import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, passwordHistory } from "@shared/schema";
import { z } from "zod";
import { randomUUID, createHash } from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { logger } from "./logger";
import { TIME_CONSTANTS, SECURITY } from "@shared/constants";
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
}
let JWT_SECRET;
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
    }
    console.warn('WARNING: JWT_SECRET not set. Using SESSION_SECRET as fallback. This is NOT recommended for production!');
    console.warn('Please set a separate JWT_SECRET environment variable for enhanced security.');
    JWT_SECRET = process.env.SESSION_SECRET;
}
else {
    if (process.env.JWT_SECRET === process.env.SESSION_SECRET) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be different from SESSION_SECRET in production for security');
        }
        console.warn('WARNING: JWT_SECRET is the same as SESSION_SECRET. For production, use different secrets.');
    }
    JWT_SECRET = process.env.JWT_SECRET;
}
const SALT_ROUNDS = SECURITY.BCRYPT_ROUNDS;
// Password hashing utilities
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
// Hash function for refresh tokens
function hashRefreshToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
// Session and JWT utilities
const MAX_SESSIONS_PER_USER = 5; // Configurable limit
export async function createSession(userId) {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + TIME_CONSTANTS.ONE_DAY);
    // Generate refresh token with random component
    const refreshTokenPayload = { userId, sessionId, type: "refresh", nonce: randomUUID() };
    const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, { expiresIn: "7d" });
    const refreshTokenHash = hashRefreshToken(refreshToken);
    // Use transaction to ensure atomicity of session limit enforcement
    await storage.createSessionWithLimit(userId, {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt
    }, MAX_SESSIONS_PER_USER);
    // Generate access token
    const accessToken = jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: "15m" });
    return { sessionId, accessToken, refreshToken };
}
export async function refreshSession(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        if (decoded.type !== "refresh") {
            return null;
        }
        // SECURITY: Acquire lock to prevent concurrent refresh attacks
        const { acquireRefreshLock, releaseRefreshLock } = await import('./utils/refresh-token-lock');
        const lockAcquired = await acquireRefreshLock(decoded.sessionId);
        if (!lockAcquired) {
            // Concurrent refresh attempt detected - potential attack
            logger.warn('[Security] Concurrent refresh token attempt blocked', {
                sessionId: decoded.sessionId.substring(0, 8) + '...',
                userId: decoded.userId
            });
            // Invalidate session as a security precaution
            await invalidateSession(decoded.sessionId);
            return null;
        }
        try {
            // Verify session exists and is valid
            const session = await storage.getSession(decoded.sessionId);
            if (!session || new Date() > session.expiresAt) {
                return null;
            }
            // Verify refresh token matches stored hash (prevents reuse of old tokens)
            const tokenHash = hashRefreshToken(refreshToken);
            if (session.refreshTokenHash !== tokenHash) {
                // Token has been rotated/invalidated - reject
                return null;
            }
            // Generate new refresh token with new nonce
            const newRefreshTokenPayload = { userId: decoded.userId, sessionId: decoded.sessionId, type: "refresh", nonce: randomUUID() };
            const newRefreshToken = jwt.sign(newRefreshTokenPayload, JWT_SECRET, { expiresIn: "7d" });
            // Update session with new refresh token hash (invalidates old token)
            await storage.updateSession(decoded.sessionId, {
                refreshTokenHash: hashRefreshToken(newRefreshToken),
                updatedAt: new Date()
            });
            // Generate new access token
            const newAccessToken = jwt.sign({ userId: decoded.userId, sessionId: decoded.sessionId }, JWT_SECRET, { expiresIn: "15m" });
            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        }
        finally {
            // Always release the lock
            releaseRefreshLock(decoded.sessionId);
        }
    }
    catch {
        return null;
    }
}
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type === "refresh") {
            return null; // Refresh tokens can't be used for authentication
        }
        return { userId: decoded.userId, sessionId: decoded.sessionId };
    }
    catch {
        return null;
    }
}
export async function invalidateSession(sessionId) {
    await storage.deleteSession(sessionId);
}
export async function invalidateAllUserSessions(userId) {
    await storage.deleteUserSessions(userId);
}
// Authentication middleware
// Configuration for session security
const SESSION_SECURITY_CONFIG = {
    enforceStrictIpBinding: process.env.NODE_ENV === 'production', // Enabled in production for better security
    enforceStrictUaBinding: process.env.NODE_ENV === 'production', // Enabled in production for better security
    logSecurityWarnings: true, // Log suspicious activity for monitoring
};
// Shared session verification helper with optional IP/UA binding check
export async function verifySessionAndUser(token, requestIp, requestUserAgent) {
    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }
    try {
        // Verify session exists and is valid
        const session = await storage.getSession(decoded.sessionId);
        if (!session || new Date() > session.expiresAt) {
            return null;
        }
        // SECURITY: Optional IP address verification to detect potential session hijacking
        // NOTE: Disabled by default because legitimate scenarios can change IP:
        // - Mobile users switching between WiFi and cellular
        // - Users with dynamic IP addresses (ISP rotation)
        // - Corporate proxies with rotating IPs
        // Enable only in high-security environments where user experience trade-offs are acceptable
        if (SESSION_SECURITY_CONFIG.enforceStrictIpBinding && requestIp && session.ipAddress && session.ipAddress !== requestIp) {
            if (SESSION_SECURITY_CONFIG.logSecurityWarnings) {
                logger.warn(`[Security] Session IP mismatch for session ${decoded.sessionId}: stored=${session.ipAddress}, current=${requestIp}`);
            }
            await invalidateSession(decoded.sessionId);
            return null;
        }
        else if (SESSION_SECURITY_CONFIG.logSecurityWarnings && requestIp && session.ipAddress && session.ipAddress !== requestIp) {
            // Log warning but allow the request (monitoring only)
            logger.warn(`[Security Monitor] Session IP changed for session ${decoded.sessionId}: ${session.ipAddress} → ${requestIp}`);
        }
        // SECURITY: Optional User-Agent verification
        // NOTE: Disabled by default because browsers auto-update and change UA strings
        // Enable only in high-security environments
        if (SESSION_SECURITY_CONFIG.enforceStrictUaBinding && requestUserAgent && session.userAgent && session.userAgent !== requestUserAgent) {
            if (SESSION_SECURITY_CONFIG.logSecurityWarnings) {
                logger.warn(`[Security] Session UA mismatch for session ${decoded.sessionId}`);
            }
            await invalidateSession(decoded.sessionId);
            return null;
        }
        else if (SESSION_SECURITY_CONFIG.logSecurityWarnings && requestUserAgent && session.userAgent && session.userAgent !== requestUserAgent) {
            // Log warning but allow the request (monitoring only)
            logger.warn(`[Security Monitor] Session UA changed for session ${decoded.sessionId}`);
        }
        const user = await storage.getUser(decoded.userId);
        if (!user) {
            return null;
        }
        return { user, sessionId: decoded.sessionId };
    }
    catch (error) {
        return null;
    }
}
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ message: "Access token required" });
        return;
    }
    // Get client info for IP/UA binding verification
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() :
        typeof realIp === 'string' ? realIp :
            req.socket.remoteAddress) ?? 'unknown';
    const clientUserAgent = req.headers['user-agent'];
    const result = await verifySessionAndUser(token, clientIp, clientUserAgent);
    if (!result) {
        res.status(403).json({ message: "Invalid, expired, or revoked token" });
        return;
    }
    req.user = result.user;
    req.sessionId = result.sessionId;
    next();
}
// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
        const forwarded = req.headers['x-forwarded-for'];
        const realIp = req.headers['x-real-ip'];
        const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() :
            typeof realIp === 'string' ? realIp :
                req.socket.remoteAddress) ?? 'unknown';
        const clientUserAgent = req.headers['user-agent'];
        const result = await verifySessionAndUser(token, clientIp, clientUserAgent);
        if (result) {
            req.user = result.user;
            req.sessionId = result.sessionId;
        }
    }
    next();
}
// Role-based access control
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Insufficient permissions" });
            return;
        }
        next();
    };
}
// Registration handler
export async function register(req, res) {
    try {
        const validatedData = insertUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
            res.status(400).json({ message: "Username already exists" });
            return;
        }
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
            res.status(400).json({ message: "Email already registered" });
            return;
        }
        // SECURITY: Check password against HaveIBeenPwned breach database
        const { validatePasswordSecurity } = await import('./services/hibp');
        const passwordValidation = await validatePasswordSecurity(validatedData.password);
        if (!passwordValidation.valid) {
            res.status(400).json({
                message: "Password does not meet security requirements",
                errors: passwordValidation.errors,
                warnings: passwordValidation.warnings
            });
            return;
        }
        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);
        // Create user
        const user = await storage.createUser({
            ...validatedData,
            password: hashedPassword,
        });
        // Send email verification (async, don't block registration)
        if (process.env.ENABLE_EMAIL_VERIFICATION !== 'false') {
            const { createEmailVerificationToken } = await import('./services/email-verification');
            createEmailVerificationToken(user.id, user.email, req.ip, req.get('user-agent')).catch(error => {
                logger.error('Failed to send verification email', error instanceof Error ? error : new Error(String(error)));
            });
        }
        // Create session and generate tokens
        const { sessionId, accessToken, refreshToken } = await createSession(user.id);
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            message: "Registration successful",
            user: userWithoutPassword,
            accessToken,
            refreshToken,
            sessionId,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            });
        }
        else {
            logger.error("Registration error", error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
// Login handler with enhanced security
export async function login(req, res) {
    const { getClientInfo, recordLoginAttempt, isAccountLocked, checkAndLockIfNeeded } = await import('./auth-enhanced');
    const clientInfo = getClientInfo(req);
    try {
        const { username, password, twoFactorToken } = req.body;
        // Find user
        const user = await storage.getUserByUsername(username);
        if (!user) {
            // Record failed attempt
            await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, false, 'User not found');
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Check if account is locked
        const lockStatus = await isAccountLocked(user.id);
        if (lockStatus.locked) {
            await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, false, 'Account locked');
            res.status(423).json({
                message: "Account is locked due to too many failed login attempts",
                lockedUntil: lockStatus.until,
                reason: lockStatus.reason
            });
            return;
        }
        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            // Record failed attempt
            await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, false, 'Invalid password');
            await checkAndLockIfNeeded(username, clientInfo.ipAddress, user.id);
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Check if 2FA is enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            if (!twoFactorToken) {
                // Return that 2FA is required
                const tempToken = jwt.sign({ userId: user.id, type: "2fa_pending" }, JWT_SECRET, { expiresIn: "5m" });
                res.json({
                    requires2FA: true,
                    tempToken,
                    message: "2FA verification required"
                });
                return;
            }
            // Verify 2FA token (TOTP)
            const isValid2FA = verify2FAToken(user.twoFactorSecret, twoFactorToken);
            // If TOTP fails, try backup code verification
            if (!isValid2FA) {
                if (user.twoFactorBackupCodes) {
                    const backupResult = await verifyBackupCode(twoFactorToken, user.twoFactorBackupCodes);
                    if (backupResult.valid) {
                        // Update user with remaining backup codes
                        await storage.updateUser(user.id, {
                            twoFactorBackupCodes: backupResult.remainingCodes ?? null
                        });
                    }
                    else {
                        await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, false, 'Invalid 2FA token');
                        await checkAndLockIfNeeded(username, clientInfo.ipAddress, user.id);
                        res.status(401).json({ message: "Invalid 2FA token or backup code" });
                        return;
                    }
                }
                else {
                    await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, false, 'Invalid 2FA token');
                    await checkAndLockIfNeeded(username, clientInfo.ipAddress, user.id);
                    res.status(401).json({ message: "Invalid 2FA token" });
                    return;
                }
            }
        }
        // SECURITY: Session regeneration - Invalidate all old sessions on login to prevent session fixation
        // This ensures any previously compromised sessions cannot be used
        await invalidateAllUserSessions(user.id);
        // Create fresh session with client info tracking
        const { sessionId, accessToken, refreshToken } = await createSessionWithTracking(user.id, clientInfo);
        // Record successful login
        await recordLoginAttempt(username, clientInfo.ipAddress, clientInfo.userAgent, true);
        // Return user without password
        const { password: _, twoFactorSecret: __, ...userWithoutPassword } = user;
        res.json({
            message: "Login successful",
            user: userWithoutPassword,
            accessToken,
            refreshToken,
            sessionId,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            });
        }
        else {
            logger.error("Login error", error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
// Enhanced session creation with client tracking
async function createSessionWithTracking(userId, clientInfo) {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + TIME_CONSTANTS.ONE_DAY);
    // Generate refresh token with random component
    const refreshTokenPayload = { userId, sessionId, type: "refresh", nonce: randomUUID() };
    const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, { expiresIn: "7d" });
    const refreshTokenHash = hashRefreshToken(refreshToken);
    // Create session with tracking info
    await storage.createSessionWithLimit(userId, {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt,
        ...clientInfo
    }, MAX_SESSIONS_PER_USER);
    // Generate access token
    const accessToken = jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: "15m" });
    return { sessionId, accessToken, refreshToken };
}
// Get current user
export async function getCurrentUser(req, res) {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
}
// Logout with session invalidation
export async function logout(req, res) {
    if (req.sessionId) {
        await invalidateSession(req.sessionId);
    }
    res.json({ message: "Logout successful" });
}
// Refresh token endpoint
export async function refreshTokens(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token required" });
            return;
        }
        const tokens = await refreshSession(refreshToken);
        if (!tokens) {
            res.status(403).json({ message: "Invalid or expired refresh token" });
            return;
        }
        res.json(tokens);
    }
    catch (error) {
        res.status(500).json({ message: "Token refresh error" });
    }
}
// 2FA Utilities
export function generate2FASecret(username) {
    const secret = speakeasy.generateSecret({
        name: `EchoVerse (${username})`,
        issuer: 'EchoVerse',
        length: 32
    });
    return {
        secret: secret.base32,
        qrCode: secret.otpauth_url,
        otpauthUrl: secret.otpauth_url
    };
}
export function verify2FAToken(secret, token) {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
    });
}
export async function generateQRCode(otpauthUrl) {
    return await QRCode.toDataURL(otpauthUrl);
}
// 2FA Backup Codes Utilities
export function generate2FABackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
        codes.push(code);
    }
    return codes;
}
/**
 * Encrypt backup codes for secure storage
 * Uses AES-256-GCM encryption instead of hashing to allow recovery if needed
 */
export async function encryptBackupCodes(codes) {
    const { encrypt2FABackupCodes } = await import('./utils/encryption');
    return encrypt2FABackupCodes(codes);
}
/**
 * Verify and use a backup code
 * Decrypts the codes, checks for a match, removes the used code, and re-encrypts
 */
export async function verifyBackupCode(code, encryptedCodesJson) {
    try {
        const { decrypt2FABackupCodes, encrypt2FABackupCodes } = await import('./utils/encryption');
        const codes = decrypt2FABackupCodes(encryptedCodesJson);
        const index = codes.findIndex(c => c === code);
        if (index !== -1) {
            // Remove the used code
            const remainingCodes = codes.filter((_, i) => i !== index);
            return {
                valid: true,
                remainingCodes: encrypt2FABackupCodes(remainingCodes)
            };
        }
        return { valid: false };
    }
    catch (error) {
        return { valid: false };
    }
}
// Keep the old hashBackupCodes for backward compatibility (deprecated)
export async function hashBackupCodes(codes) {
    // Redirect to encrypted version
    return encryptBackupCodes(codes);
}
// ==================== PASSWORD HISTORY MANAGEMENT ====================
// Migrated from auth-enhanced.ts
const PASSWORD_HISTORY_COUNT = 12; // Industry standard: keep last 12 passwords
/**
 * Add password to user's password history
 * Automatically maintains only the last N passwords
 */
export async function addPasswordToHistory(userId, passwordHash) {
    await db.insert(passwordHistory).values({
        userId,
        passwordHash,
        createdAt: new Date()
    });
    // Clean up old password history (keep only last N passwords)
    const allHistory = await db
        .select()
        .from(passwordHistory)
        .where(eq(passwordHistory.userId, userId))
        .orderBy(desc(passwordHistory.createdAt));
    if (allHistory.length > PASSWORD_HISTORY_COUNT) {
        const toDelete = allHistory.slice(PASSWORD_HISTORY_COUNT);
        for (const old of toDelete) {
            await db.delete(passwordHistory).where(eq(passwordHistory.id, old.id));
        }
    }
}
/**
 * Check if password was used recently (password reuse prevention)
 * Returns true if password matches any in user's password history
 */
export async function isPasswordReused(userId, newPassword) {
    const history = await db
        .select()
        .from(passwordHistory)
        .where(eq(passwordHistory.userId, userId))
        .orderBy(desc(passwordHistory.createdAt))
        .limit(PASSWORD_HISTORY_COUNT);
    // Check if new password matches any in history
    for (const record of history) {
        const matches = await bcrypt.compare(newPassword, record.passwordHash);
        if (matches) {
            return true;
        }
    }
    return false;
}
