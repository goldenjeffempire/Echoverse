import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifySessionAndUser } from './auth';
import { storage } from './storage';
import { logger } from './logger';
import { config } from './config';
import { WebSocketMessageSchema } from './utils/websocket-schemas';
import { ZodError } from 'zod';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
  messageCount?: number;
  lastMessageTime?: number;
  messageSequence?: number;
  rooms?: Set<string>;
  _removeAllListeners?: () => void;
}

const clients = new Map<string, Set<AuthenticatedWebSocket>>();
const roomClients = new Map<string, Set<AuthenticatedWebSocket>>();

// Use config values instead of hardcoded constants
const MAX_CONNECTIONS_PER_USER = config.maxWsConnectionsPerUser;
const MAX_MESSAGES_PER_MINUTE = 60;
const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB
const MESSAGE_RATE_WINDOW = 60000; // 1 minute
const HEARTBEAT_INTERVAL = config.wsHeartbeatInterval;
const MEMORY_CLEANUP_INTERVAL = 300000; // 5 minutes

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
    let isAuthenticated = false;
    const authTimeout = setTimeout(() => {
      if (!isAuthenticated) {
        ws.close(1008, 'Authentication timeout');
      }
    }, 10000); // 10 second auth timeout

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
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

            if (!clients.has(ws.userId)) {
              clients.set(ws.userId, new Set());
            }

            const userConnections = clients.get(ws.userId)!;
            
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
          } else {
            ws.close(1008, 'Must authenticate first');
          }
          return;
        }

        const now = Date.now();
        if (now - (ws.lastMessageTime || 0) < MESSAGE_RATE_WINDOW) {
          ws.messageCount = (ws.messageCount || 0) + 1;
        } else {
          ws.messageCount = 1;
          ws.lastMessageTime = now;
        }

        if ((ws.messageCount || 0) > MAX_MESSAGES_PER_MINUTE) {
          if ((ws.messageCount || 0) > MAX_MESSAGES_PER_MINUTE * 2) {
            ws.close(1008, 'Severe rate limit violation');
            logger.error('WebSocket severe rate limit violation - closing connection', undefined, { userId: ws.userId });
            return;
          }
          ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded', code: 'RATE_LIMIT' }));
          logger.warn('WebSocket rate limit exceeded', { userId: ws.userId, count: ws.messageCount });
          return;
        }

        await handleMessage(ws, message);
      } catch (error) {
        logger.error('WebSocket message error', error instanceof Error ? error : undefined, { userId: ws.userId });
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    const cleanupConnection = () => {
      if (ws.userId) {
        const userClients = clients.get(ws.userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            clients.delete(ws.userId);
          }
        }

        for (const [roomId, roomClientSet] of roomClients.entries()) {
          roomClientSet.delete(ws);
          if (roomClientSet.size === 0) {
            roomClients.delete(roomId);
          }
        }
      }
      
      // Clean up all references to prevent memory leaks
      ws.messageCount = undefined;
      ws.lastMessageTime = undefined;
      ws.userId = undefined;
      ws.sessionId = undefined;
      ws.isAlive = undefined;
      
      // Remove all event listeners
      ws.removeAllListeners();
      
      logger.info('WebSocket disconnected and cleaned up', { userId: ws.userId });
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
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
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
    
    // Close all connections gracefully
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
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
      const deadClients: AuthenticatedWebSocket[] = [];
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
      const deadClients: AuthenticatedWebSocket[] = [];
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
    
    // Force garbage collection if available (for debugging memory leaks)
    if (global.gc && totalConnections > 100) {
      logger.debug('Running manual garbage collection');
      global.gc();
    }
  }, MEMORY_CLEANUP_INTERVAL);

  logger.info('WebSocket server initialized');
}

async function handleMessage(ws: AuthenticatedWebSocket, message: any): Promise<void> {
  ws.messageSequence = (ws.messageSequence || 0) + 1;
  const sequence = ws.messageSequence;

  switch (message.type) {
    case 'join_room':
      await joinRoom(ws, message.roomId, message.roomType);
      break;

    case 'leave_room':
      leaveRoom(ws, message.roomId);
      break;

    case 'send_message':
      await handleChatMessage(ws, message, sequence);
      break;

    case 'typing':
      if (await checkRoomAccess(ws.userId!, message.roomId)) {
        broadcastToRoom(message.roomId, {
          type: message.isTyping ? 'user_typing' : 'user_stopped_typing',
          userId: ws.userId,
          roomId: message.roomId,
          sequence
        }, ws);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Access denied to room' }));
      }
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString(), sequence }));
      break;
  }
}

async function checkRoomAccess(userId: string, roomId: string, roomType?: string): Promise<boolean> {
  try {
    if (roomType === 'community') {
      const members = await storage.getCommunityMembers(roomId);
      return members.some((member: any) => member.userId === userId);
    } else if (roomType === 'direct_message') {
      return roomId.includes(userId);
    }
    return true;
  } catch (error) {
    logger.error('Room access check failed', error instanceof Error ? error : undefined);
    return false;
  }
}

async function joinRoom(ws: AuthenticatedWebSocket, roomId: string, roomType?: string): Promise<void> {
  if (!await checkRoomAccess(ws.userId!, roomId, roomType)) {
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
  roomClients.get(roomId)!.add(ws);
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

function leaveRoom(ws: AuthenticatedWebSocket, roomId: string): void {
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

async function handleChatMessage(ws: AuthenticatedWebSocket, data: any, sequence: number): Promise<void> {
  const { roomId, content, metadata } = data;

  if (!await checkRoomAccess(ws.userId!, roomId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Access denied to room',
      sequence
    }));
    return;
  }

  const message = await storage.createMessage({
    senderId: ws.userId!,
    receiverId: null,
    communityId: roomId,
    content,
    type: 'text',
    metadata: metadata || {},
    isRead: false
  });

  broadcastToRoom(roomId, {
    type: 'new_message',
    message,
    roomId,
    timestamp: new Date().toISOString(),
    sequence
  });
}

function broadcastToRoom(roomId: string, message: any, exclude?: AuthenticatedWebSocket): void {
  const room = roomClients.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(message);
  room.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function sendToUser(userId: string, message: any): void {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const payload = JSON.stringify(message);
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function broadcastToAll(message: any): void {
  const payload = JSON.stringify(message);
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });
}

export function sendNotification(userId: string, notification: any): void {
  sendToUser(userId, {
    type: 'notification',
    notification,
    timestamp: new Date().toISOString()
  });
}
