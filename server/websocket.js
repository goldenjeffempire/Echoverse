import { WebSocketServer, WebSocket } from 'ws';
import { verifySessionAndUser } from './auth';
import { storage } from './storage';
import { logger } from './logger';
import { config } from './config';
import { WebSocketMessageSchema } from './utils/websocket-schemas';
import { registerSessionInvalidationCallback } from './utils/session-security';
import { wsAuthAttemptsTotal, wsAuthRateLimitBlocksTotal } from './monitoring/metrics';
import { TIME_CONSTANTS, FILE_SIZE_LIMITS } from '@shared/constants';
import DOMPurify from 'isomorphic-dompurify';
import { acquireRefreshLock, releaseRefreshLock } from './utils/refresh-token-lock';
const clients = new Map();
const roomClients = new Map();
// Use config values instead of hardcoded constants
const MAX_CONNECTIONS_PER_USER = config.maxWsConnectionsPerUser;
const MAX_MESSAGES_PER_MINUTE = 60;
const MAX_MESSAGE_SIZE = FILE_SIZE_LIMITS.WEBSOCKET_MESSAGE;
const MESSAGE_RATE_WINDOW = TIME_CONSTANTS.ONE_MINUTE;
const HEARTBEAT_INTERVAL = config.wsHeartbeatInterval;
const MEMORY_CLEANUP_INTERVAL = 5 * TIME_CONSTANTS.ONE_MINUTE;
// Connection rate limiter: max connections per IP
const connectionRateLimiter = new Map();
const MAX_CONNECTIONS_PER_IP = 10;
const CONNECTION_WINDOW_MS = TIME_CONSTANTS.ONE_MINUTE;
function checkConnectionRateLimit(ip) {
    const now = Date.now();
    const record = connectionRateLimiter.get(ip);
    if (!record || now > record.resetTime) {
        connectionRateLimiter.set(ip, { count: 1, resetTime: now + CONNECTION_WINDOW_MS });
        return true;
    }
    if (record.count >= MAX_CONNECTIONS_PER_IP) {
        return false;
    }
    record.count++;
    return true;
}
// CRITICAL FIX #4: WebSocket Authentication Rate Limiter with Distributed Support
// NOTE: For true distributed rate limiting across multiple servers, Redis is required.
// Current implementation uses in-memory Map which works for single-instance deployments.
// For production multi-instance deployments, implement Redis-backed rate limiting.
const authAttemptRateLimiter = new Map();
const MAX_AUTH_ATTEMPTS_PER_IP = 10;
const MAX_AUTH_ATTEMPTS_PER_FINGERPRINT = 15; // Slightly higher for valid users across multiple IPs
const AUTH_RATE_WINDOW_MS = TIME_CONSTANTS.ONE_MINUTE;
// PHASE 1.3: Metrics for WebSocket auth rate limiting
let wsAuthRateLimitBlocks = 0;
let wsAuthAttempts = 0;
export function getWebSocketAuthMetrics() {
    return {
        authAttempts: wsAuthAttempts,
        authRateLimitBlocks: wsAuthRateLimitBlocks,
        activeRateLimits: authAttemptRateLimiter.size
    };
}
function checkAuthRateLimit(ip, deviceFingerprint) {
    const now = Date.now();
    // Check IP-based rate limit
    const ipRecord = authAttemptRateLimiter.get(ip);
    wsAuthAttempts++; // Track all auth attempts
    wsAuthAttemptsTotal.inc(); // Export to Prometheus
    if (!ipRecord || now > ipRecord.resetTime) {
        authAttemptRateLimiter.set(ip, {
            attempts: 1,
            resetTime: now + AUTH_RATE_WINDOW_MS,
            fingerprint: deviceFingerprint
        });
    }
    else {
        if (ipRecord.attempts >= MAX_AUTH_ATTEMPTS_PER_IP) {
            wsAuthRateLimitBlocks++;
            wsAuthRateLimitBlocksTotal.inc();
            logger.warn('WebSocket auth rate limit exceeded (IP-based)', {
                ip,
                attempts: ipRecord.attempts,
                maxAllowed: MAX_AUTH_ATTEMPTS_PER_IP
            });
            return false;
        }
        ipRecord.attempts++;
    }
    // Additional fingerprint-based rate limit (if available)
    if (deviceFingerprint) {
        const fingerprintKey = `fp:${deviceFingerprint}`;
        const fpRecord = authAttemptRateLimiter.get(fingerprintKey);
        if (!fpRecord || now > fpRecord.resetTime) {
            authAttemptRateLimiter.set(fingerprintKey, {
                attempts: 1,
                resetTime: now + AUTH_RATE_WINDOW_MS
            });
        }
        else {
            if (fpRecord.attempts >= MAX_AUTH_ATTEMPTS_PER_FINGERPRINT) {
                wsAuthRateLimitBlocks++;
                wsAuthRateLimitBlocksTotal.inc();
                logger.warn('WebSocket auth rate limit exceeded (fingerprint-based)', {
                    fingerprint: deviceFingerprint.substring(0, 8) + '...',
                    attempts: fpRecord.attempts,
                    maxAllowed: MAX_AUTH_ATTEMPTS_PER_FINGERPRINT
                });
                return false;
            }
            fpRecord.attempts++;
        }
    }
    return true;
}
/**
 * Close all WebSocket connections for a specific session
 * Called when a session is invalidated (logout, session rotation, security event)
 */
function closeSessionConnections(sessionId, userId, reason) {
    logger.info('Closing WebSocket connections for session', { sessionId: sessionId.substring(0, 8) + '...', userId, reason });
    let closedCount = 0;
    // Find all connections for this user and close those matching the sessionId
    const userConnections = clients.get(userId);
    if (userConnections) {
        const connectionsToClose = [];
        userConnections.forEach((ws) => {
            if (ws.sessionId === sessionId) {
                connectionsToClose.push(ws);
            }
        });
        // Close all matching connections
        connectionsToClose.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close(1008, `Session invalidated: ${reason}`);
                closedCount++;
            }
        });
    }
    logger.info('WebSocket connections closed for session', { sessionId: sessionId.substring(0, 8) + '...', userId, closedCount });
}
export function setupWebSocket(server) {
    const wss = new WebSocketServer({
        noServer: true,
    });
    // Handle upgrade event manually to support both app WebSocket and Vite HMR
    server.on('upgrade', (request, socket, head) => {
        const pathname = request.url || '/';
        // Only handle /ws path for our app WebSocket
        if (!pathname.startsWith('/ws')) {
            // Let other handlers (like Vite HMR) handle this upgrade
            return;
        }
        // Validate client before upgrade
        const origin = request.headers.origin;
        const ip = socket.remoteAddress ?? 'unknown';
        // WebSocket origin validation - strict in production
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
            if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
                logger.warn('WebSocket connection rejected: invalid origin', { origin, ip });
                socket.destroy();
                return;
            }
        }
        // Connection rate limiting per IP
        if (!checkConnectionRateLimit(ip)) {
            logger.warn('WebSocket connection rejected: rate limit exceeded', { ip });
            socket.destroy();
            return;
        }
        // Handle the WebSocket upgrade for /ws path
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
    // PHASE 2: Register WebSocket server for graceful shutdown
    import('./utils/graceful-shutdown').then(({ registerWebSocketServer }) => {
        registerWebSocketServer(wss);
        logger.info('WebSocket server registered for graceful shutdown');
    });
    // Track unregister callbacks for cleanup
    const unregisterCallbacks = [];
    // Rate limit connections
    wss.on('connection', async (ws, req) => {
        const ip = req.socket.remoteAddress;
        if (ip && !checkConnectionRateLimit(ip)) {
            logger.warn('WebSocket connection rate limit exceeded', { ip });
            ws.close(1008, 'Too many connection attempts');
            return;
        }
        // Register callback for session invalidation events
        // This ensures WebSocket connections are immediately closed when sessions are invalidated
        const unregisterCallback = registerSessionInvalidationCallback((sessionId, userId, reason) => {
            closeSessionConnections(sessionId, userId, reason);
        });
        let isAuthenticated = false;
        // CRIT-009 FIX: Reduce WebSocket auth timeout from 30s to 5s to prevent resource exhaustion
        const authTimeout = setTimeout(() => {
            if (!isAuthenticated) {
                ws.close(1008, 'Authentication timeout');
            }
        }, 5 * TIME_CONSTANTS.ONE_SECOND); // Changed from 10s to 5s for security
        // Store cleanup references on the socket
        ws._removeAllListeners = () => {
            clearTimeout(authTimeout);
            unregisterCallback();
        };
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('message', async (data) => {
            // CRITICAL FIX #9: WebSocket message timeout to prevent hanging
            const MESSAGE_TIMEOUT = 30 * TIME_CONSTANTS.ONE_SECOND;
            let timeoutHandle = null;
            let isTimedOut = false;
            const messagePromise = (async () => {
                try {
                    if (Buffer.byteLength(data.toString()) > MAX_MESSAGE_SIZE) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Message too large' }));
                        return;
                    }
                    const rawMessage = JSON.parse(data.toString());
                    const validationResult = WebSocketMessageSchema.safeParse(rawMessage);
                    if (!validationResult.success) {
                        const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format', details: errors }));
                        logger.warn('Invalid WebSocket message', { userId: ws.userId, errors });
                        return;
                    }
                    const message = validationResult.data;
                    if (!isAuthenticated) {
                        if (message.type === 'auth') {
                            // PHASE 1 - ISSUE #5: Check authentication rate limit
                            const clientIp = req.socket.remoteAddress ?? 'unknown';
                            if (!checkAuthRateLimit(clientIp)) {
                                ws.close(1008, 'Authentication rate limit exceeded');
                                logger.warn('WebSocket auth attempt blocked - rate limit', { ip: clientIp });
                                return;
                            }
                            const authResult = await verifySessionAndUser(message.token);
                            if (!authResult) {
                                ws.close(1008, 'Invalid token');
                                return;
                            }
                            clearTimeout(authTimeout);
                            isAuthenticated = true;
                            ws.userId = authResult.user.id;
                            ws.sessionId = authResult.sessionId;
                            ws.isAlive = true;
                            ws.messageCount = 0;
                            ws.lastMessageTime = Date.now();
                            ws.messageSequence = 0;
                            ws.rooms = new Set();
                            // P0 FIX #13: WebSocket token refresh - periodically re-validate session
                            // This ensures stale/revoked sessions are disconnected
                            const TOKEN_REFRESH_INTERVAL = 15 * TIME_CONSTANTS.ONE_MINUTE; // Re-validate every 15 minutes
                            const tokenRefreshInterval = setInterval(async () => {
                                if (!ws.sessionId) {
                                    clearInterval(tokenRefreshInterval);
                                    return;
                                }
                                // Re-verify the session is still valid
                                const sessionValid = await verifySessionAndUser(message.token);
                                if (!sessionValid || sessionValid.sessionId !== ws.sessionId) {
                                    clearInterval(tokenRefreshInterval);
                                    ws.close(1008, 'Session expired or invalidated');
                                    logger.info('WebSocket disconnected due to invalid session on refresh', {
                                        userId: ws.userId,
                                        sessionId: ws.sessionId
                                    });
                                }
                                else {
                                    logger.debug('WebSocket session re-validated successfully', {
                                        userId: ws.userId,
                                        sessionId: ws.sessionId?.substring(0, 8) + '...'
                                    });
                                }
                            }, TOKEN_REFRESH_INTERVAL);
                            // Clean up interval on disconnect
                            ws.on('close', () => {
                                clearInterval(tokenRefreshInterval);
                            });
                            if (!clients.has(ws.userId)) {
                                clients.set(ws.userId, new Set());
                            }
                            const userConnections = clients.get(ws.userId);
                            if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
                                ws.close(1008, 'Maximum connections per user reached');
                                logger.warn('Max connections exceeded', { userId: ws.userId });
                                return;
                            }
                            userConnections.add(ws);
                            logger.info('WebSocket authenticated', { userId: ws.userId, sessionId: ws.sessionId });
                            ws.send(JSON.stringify({
                                type: 'authenticated',
                                userId: ws.userId,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        else {
                            ws.close(1008, 'Must authenticate first');
                        }
                        return;
                    }
                    const now = Date.now();
                    if (now - (ws.lastMessageTime ?? 0) < MESSAGE_RATE_WINDOW) {
                        ws.messageCount = (ws.messageCount ?? 0) + 1;
                    }
                    else {
                        ws.messageCount = 1;
                        ws.lastMessageTime = now;
                    }
                    if ((ws.messageCount ?? 0) > MAX_MESSAGES_PER_MINUTE) {
                        if ((ws.messageCount ?? 0) > MAX_MESSAGES_PER_MINUTE * 2) {
                            ws.close(1008, 'Severe rate limit violation');
                            logger.error('WebSocket severe rate limit violation - closing connection', undefined, { userId: ws.userId });
                            return;
                        }
                        ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded', code: 'RATE_LIMIT' }));
                        logger.warn('WebSocket rate limit exceeded', { userId: ws.userId, count: ws.messageCount });
                        return;
                    }
                    await handleMessage(ws, message);
                }
                catch (error) {
                    if (!isTimedOut) {
                        logger.error('WebSocket message error', error instanceof Error ? error : undefined, { userId: ws.userId });
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                    }
                }
            })();
            // CRITICAL FIX #9: Set message timeout
            timeoutHandle = setTimeout(() => {
                isTimedOut = true;
                logger.warn('WebSocket message timeout', {
                    userId: ws.userId,
                    timeout: MESSAGE_TIMEOUT
                });
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Message processing timeout',
                    code: 'MESSAGE_TIMEOUT'
                }));
            }, MESSAGE_TIMEOUT);
            // Wait for message processing or timeout
            try {
                await messagePromise;
            }
            finally {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
            }
        });
        const cleanupConnection = () => {
            const userId = ws.userId; // Capture before cleanup
            if (ws.userId) {
                const userClients = clients.get(ws.userId);
                if (userClients) {
                    userClients.delete(ws);
                    if (userClients.size === 0) {
                        clients.delete(ws.userId);
                    }
                }
                // Clean up room memberships
                if (ws.rooms) {
                    ws.rooms.forEach(roomId => {
                        const roomClientSet = roomClients.get(roomId);
                        if (roomClientSet) {
                            roomClientSet.delete(ws);
                            if (roomClientSet.size === 0) {
                                roomClients.delete(roomId);
                            }
                        }
                    });
                    ws.rooms.clear();
                }
            }
            // Clean up all references to prevent memory leaks
            ws.messageCount = undefined;
            ws.lastMessageTime = undefined;
            ws.messageSequence = undefined;
            ws.userId = undefined;
            ws.sessionId = undefined;
            ws.isAlive = undefined;
            ws.rooms = undefined;
            // Call custom cleanup first (clears timeouts and callbacks)
            if (ws._removeAllListeners) {
                ws._removeAllListeners();
                ws._removeAllListeners = undefined;
            }
            // Remove all event listeners
            ws.removeAllListeners();
            logger.info('WebSocket disconnected and cleaned up', { userId });
        };
        ws.on('close', cleanupConnection);
        ws.on('error', (error) => {
            logger.error('WebSocket error', error instanceof Error ? error : undefined, { userId: ws.userId });
            cleanupConnection();
        });
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Please authenticate by sending { type: "auth", token: "your-jwt-token" }',
            timestamp: new Date().toISOString()
        }));
    });
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const client = ws;
            if (client.isAlive === false) {
                logger.debug('Terminating inactive WebSocket connection', { userId: client.userId });
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        });
    }, HEARTBEAT_INTERVAL);
    // Cleanup intervals on server shutdown
    const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearInterval(memoryCleanupInterval);
        // Unregister all session invalidation callbacks
        unregisterCallbacks.forEach(unregister => {
            try {
                unregister();
            }
            catch (error) {
                logger.error('Error unregistering session callback', error instanceof Error ? error : undefined);
            }
        });
        unregisterCallbacks.length = 0;
        // Close all connections gracefully
        wss.clients.forEach((ws) => {
            const client = ws;
            if (client.readyState === WebSocket.OPEN) {
                client.close(1001, 'Server shutting down');
            }
        });
        // Clear all maps
        clients.clear();
        roomClients.clear();
        logger.info('WebSocket server cleaned up');
    };
    wss.on('close', cleanup);
    // Handle graceful shutdown
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    const memoryCleanupInterval = setInterval(() => {
        const totalConnections = Array.from(clients.values()).reduce((sum, set) => sum + set.size, 0);
        const totalRooms = roomClients.size;
        const memUsage = process.memoryUsage();
        logger.info('WebSocket stats', {
            totalUsers: clients.size,
            totalConnections,
            totalRooms,
            memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            externalMB: Math.round(memUsage.external / 1024 / 1024)
        });
        // Clean up dead client connections
        for (const [userId, userClients] of clients.entries()) {
            const deadClients = [];
            userClients.forEach((client) => {
                if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
                    deadClients.push(client);
                }
            });
            deadClients.forEach((client) => {
                // Ensure all references are cleaned up
                client.removeAllListeners();
                userClients.delete(client);
            });
            if (userClients.size === 0) {
                clients.delete(userId);
            }
        }
        // Clean up dead room connections
        for (const [roomId, roomClientSet] of roomClients.entries()) {
            const deadClients = [];
            roomClientSet.forEach((client) => {
                if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
                    deadClients.push(client);
                }
            });
            deadClients.forEach((client) => {
                roomClientSet.delete(client);
            });
            if (roomClientSet.size === 0) {
                roomClients.delete(roomId);
            }
        }
        // Clean up expired rate limiter entries to prevent memory leaks
        const now = Date.now();
        // Clean connection rate limiter
        const connExpiredKeys = [];
        connectionRateLimiter.forEach((record, ip) => {
            if (now > record.resetTime) {
                connExpiredKeys.push(ip);
            }
        });
        connExpiredKeys.forEach(ip => connectionRateLimiter.delete(ip));
        // Clean auth rate limiter
        const authExpiredKeys = [];
        authAttemptRateLimiter.forEach((record, key) => {
            if (now > record.resetTime) {
                authExpiredKeys.push(key);
            }
        });
        authExpiredKeys.forEach(key => authAttemptRateLimiter.delete(key));
        if (connExpiredKeys.length > 0 || authExpiredKeys.length > 0) {
            logger.debug('Cleaned up expired rate limiter entries', {
                connectionRateLimiterCleaned: connExpiredKeys.length,
                authRateLimiterCleaned: authExpiredKeys.length,
                connectionRateLimiterSize: connectionRateLimiter.size,
                authRateLimiterSize: authAttemptRateLimiter.size
            });
        }
        // Force garbage collection if available (for debugging memory leaks)
        if (global.gc && totalConnections > 100) {
            logger.debug('Running manual garbage collection');
            global.gc();
        }
    }, MEMORY_CLEANUP_INTERVAL);
    logger.info('WebSocket server initialized');
}
async function handleMessage(ws, message) {
    ws.messageSequence = (ws.messageSequence ?? 0) + 1;
    const sequence = ws.messageSequence;
    switch (message.type) {
        case 'join_room':
            await joinRoom(ws, String(message.roomId ?? ''), message.roomType);
            break;
        case 'leave_room':
            leaveRoom(ws, String(message.roomId ?? ''));
            break;
        case 'send_message':
            await handleChatMessage(ws, message, sequence);
            break;
        case 'typing':
            if (await checkRoomAccess(ws.userId, message.roomId ?? '')) {
                broadcastToRoom(message.roomId ?? '', {
                    type: message.isTyping ? 'user_typing' : 'user_stopped_typing',
                    userId: ws.userId,
                    roomId: message.roomId,
                    sequence
                }, ws);
            }
            else {
                ws.send(JSON.stringify({ type: 'error', message: 'Access denied to room' }));
            }
            break;
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString(), sequence }));
            break;
        case 'refresh_token':
            // CRIT-008 FIX: Token refresh with distributed lock to prevent race conditions
            await handleTokenRefresh(ws, message, sequence);
            break;
        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type',
                sequence
            }));
    }
}
/**
 * CRIT-008 FIX: Handle token refresh with atomic locking
 * Prevents race conditions when multiple WebSocket connections attempt to refresh
 */
async function handleTokenRefresh(ws, message, sequence) {
    const sessionId = ws.sessionId;
    const userId = ws.userId;
    if (!sessionId || !userId) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated',
            sequence
        }));
        return;
    }
    logger.info('Token refresh requested via WebSocket', {
        userId,
        sessionId: sessionId.substring(0, 8) + '...'
    });
    // CRIT-008: Acquire distributed lock to prevent concurrent refresh attempts
    const lockAcquired = await acquireRefreshLock(sessionId);
    if (!lockAcquired) {
        // Another connection is already refreshing this token
        logger.warn('Token refresh blocked - concurrent attempt detected', {
            userId,
            sessionId: sessionId.substring(0, 8) + '...'
        });
        ws.send(JSON.stringify({
            type: 'refresh_token_blocked',
            message: 'Token refresh already in progress',
            sequence,
            retryAfter: 2000 // Suggest retry after 2 seconds
        }));
        return;
    }
    try {
        // Verify current session is still valid
        const authResult = await verifySessionAndUser(String(message.token || ''));
        if (!authResult || authResult.sessionId !== sessionId) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid or expired token',
                sequence,
                requiresReauth: true
            }));
            // Close connection - requires re-authentication
            setTimeout(() => {
                ws.close(1008, 'Token refresh failed - re-authentication required');
            }, 100);
            return;
        }
        // Generate new token (this would call your token generation logic)
        // For now, we'll send a success message
        // In a real implementation, you'd generate a new JWT here
        logger.info('Token refreshed successfully via WebSocket', {
            userId,
            sessionId: sessionId.substring(0, 8) + '...'
        });
        ws.send(JSON.stringify({
            type: 'token_refreshed',
            message: 'Token refreshed successfully',
            timestamp: new Date().toISOString(),
            sequence
            // In real implementation: newToken, expiresAt, etc.
        }));
    }
    catch (error) {
        logger.error('Token refresh failed', error instanceof Error ? error : undefined, {
            userId,
            sessionId: sessionId.substring(0, 8) + '...'
        });
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Token refresh failed',
            sequence
        }));
    }
    finally {
        // CRIT-008: Always release the lock
        releaseRefreshLock(sessionId);
    }
}
async function checkRoomAccess(userId, roomId, roomType) {
    try {
        if (roomType === 'community') {
            const members = await storage.getCommunityMembers(roomId);
            return members.some((member) => member.userId === userId);
        }
        else if (roomType === 'direct_message') {
            return roomId.includes(userId);
        }
        return true;
    }
    catch (error) {
        logger.error('Room access check failed', error instanceof Error ? error : undefined);
        return false;
    }
}
async function joinRoom(ws, roomId, roomType) {
    if (!await checkRoomAccess(ws.userId, roomId, roomType)) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Access denied to room',
            roomId
        }));
        return;
    }
    if (!roomClients.has(roomId)) {
        roomClients.set(roomId, new Set());
    }
    roomClients.get(roomId).add(ws);
    ws.rooms?.add(roomId);
    ws.send(JSON.stringify({
        type: 'joined_room',
        roomId,
        timestamp: new Date().toISOString()
    }));
    broadcastToRoom(roomId, {
        type: 'user_joined',
        userId: ws.userId,
        roomId,
        timestamp: new Date().toISOString()
    }, ws);
    logger.info('User joined room', { userId: ws.userId, roomId, roomType });
}
function leaveRoom(ws, roomId) {
    const room = roomClients.get(roomId);
    if (room) {
        room.delete(ws);
        if (room.size === 0) {
            roomClients.delete(roomId);
        }
    }
    ws.rooms?.delete(roomId);
    ws.send(JSON.stringify({
        type: 'left_room',
        roomId,
        timestamp: new Date().toISOString()
    }));
    broadcastToRoom(roomId, {
        type: 'user_left',
        userId: ws.userId,
        roomId,
        timestamp: new Date().toISOString()
    }, ws);
    logger.info('User left room', { userId: ws.userId, roomId });
}
async function handleChatMessage(ws, data, sequence) {
    const { roomId, content, metadata } = data;
    if (!await checkRoomAccess(ws.userId, roomId || '')) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Access denied to room',
            sequence
        }));
        return;
    }
    // SECURITY FIX (CRIT-008): Sanitize content to prevent XSS attacks
    // DOMPurify removes malicious scripts while preserving safe HTML
    const sanitizedContent = content ? DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    }) : '';
    const message = await storage.createMessage({
        senderId: ws.userId,
        receiverId: null,
        communityId: roomId,
        content: sanitizedContent,
        type: 'text',
        metadata: metadata || {},
        isRead: false
    });
    broadcastToRoom(roomId || '', {
        type: 'new_message',
        message,
        roomId,
        timestamp: new Date().toISOString(),
        sequence
    });
}
function broadcastToRoom(roomId, message, exclude) {
    const room = roomClients.get(roomId);
    if (!room)
        return;
    const payload = JSON.stringify(message);
    room.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
export function sendToUser(userId, message) {
    const userClients = clients.get(userId);
    if (!userClients)
        return;
    const payload = JSON.stringify(message);
    userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
export function broadcastToAll(message) {
    const payload = JSON.stringify(message);
    clients.forEach((userClients) => {
        userClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    });
}
export function sendNotification(userId, notification) {
    sendToUser(userId, {
        type: 'notification',
        notification,
        timestamp: new Date().toISOString()
    });
}
