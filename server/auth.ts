import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, type User, type Session } from "@shared/schema";
import { z } from "zod";
import { randomUUID, createHash } from "crypto";

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for production');
}
const JWT_SECRET = process.env.SESSION_SECRET;
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash function for refresh tokens
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Session and JWT utilities
export async function createSession(userId: string): Promise<{ sessionId: string; accessToken: string; refreshToken: string }> {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Generate refresh token with random component
  const refreshTokenPayload = { userId, sessionId, type: "refresh", nonce: randomUUID() };
  const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, { expiresIn: "7d" });
  
  // Create session in database with refresh token hash
  await storage.createSession({
    id: sessionId,
    userId,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt
  });
  
  // Generate access token
  const accessToken = jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: "15m" });
  
  return { sessionId, accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; sessionId: string; type: string; nonce: string };
    
    if (decoded.type !== "refresh") {
      return null;
    }
    
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
  } catch {
    return null;
  }
}

export function verifyToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string; type?: string };
    if (decoded.type === "refresh") {
      return null; // Refresh tokens can't be used for authentication
    }
    return { userId: decoded.userId, sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await storage.deleteSession(sessionId);
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await storage.deleteUserSessions(userId);
}

// Authentication middleware
// Shared session verification helper
export async function verifySessionAndUser(token: string): Promise<{ user: User; sessionId: string } | null> {
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
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return null;
    }

    return { user, sessionId: decoded.sessionId };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  const result = await verifySessionAndUser(token);
  if (!result) {
    res.status(403).json({ message: "Invalid, expired, or revoked token" });
    return;
  }

  req.user = result.user;
  req.sessionId = result.sessionId;
  next();
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const result = await verifySessionAndUser(token);
    if (result) {
      req.user = result.user;
      req.sessionId = result.sessionId;
    }
  }

  next();
}

// Role-based access control
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
export async function register(req: Request, res: Response): Promise<void> {
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

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    } else {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

// Login handler
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Create session and generate tokens
    const { sessionId, accessToken, refreshToken } = await createSession(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    } else {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

// Get current user
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
}

// Logout with session invalidation
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.sessionId) {
    await invalidateSession(req.sessionId);
  }
  res.json({ message: "Logout successful" });
}

// Refresh token endpoint
export async function refreshTokens(req: Request, res: Response): Promise<void> {
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
  } catch (error) {
    res.status(500).json({ message: "Token refresh error" });
  }
}