import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const MAX_QUEUE_SIZE = 100;

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectAttempts = 10,
    reconnectInterval = 3000,
  } = options;

  const { user } = useAuth();
  const getToken = () => localStorage.getItem('accessToken');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticatedRef = useRef(false);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const clearHeartbeatInterval = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const sendQueuedMessages = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticatedRef.current && messageQueueRef.current.length > 0) {
      const messages = messageQueueRef.current.splice(0, MAX_QUEUE_SIZE);
      messages.forEach((message) => {
        wsRef.current?.send(JSON.stringify(message));
      });
      if (messageQueueRef.current.length > 0) {
        console.warn(`[WebSocket] Queue still has ${messageQueueRef.current.length} messages after limit`);
      }
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeatInterval();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000); // Send ping every 25 seconds (server expects pong within 30s)
  }, []);

  const connect = useCallback(() => {
    const token = getToken();
    if (!user || !token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected - sending auth');
        setState({ isConnected: true, isConnecting: false, error: null });
        
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          if (message.type === 'pong') {
            return;
          }

          if (message.type === 'authenticated') {
            console.log('[WebSocket] Authenticated successfully');
            isAuthenticatedRef.current = true;
            reconnectCountRef.current = 0;
            startHeartbeat();
            sendQueuedMessages();
            onConnect?.();
            return;
          }

          if (message.type === 'connected') {
            return;
          }
          
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setState((prev) => ({ ...prev, error: 'Connection error' }));
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setState({ isConnected: false, isConnecting: false, error: event.reason || null });
        isAuthenticatedRef.current = false;
        clearHeartbeatInterval();
        onDisconnect?.();

        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          const jitter = Math.random() * 1000;
          const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectCountRef.current) + jitter, 30000);
          console.log(`[WebSocket] Reconnecting in ${Math.round(delay)}ms... (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`);
          
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else if (reconnectCountRef.current >= reconnectAttempts) {
          setState((prev) => ({ ...prev, error: 'Max reconnection attempts reached' }));
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setState((prev) => ({ ...prev, isConnecting: false, error: 'Failed to create connection' }));
    }
  }, [user, reconnect, reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage, sendQueuedMessages, startHeartbeat]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearHeartbeatInterval();
    isAuthenticatedRef.current = false;
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    messageQueueRef.current = [];
    setState({ isConnected: false, isConnecting: false, error: null });
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticatedRef.current) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      if (messageQueueRef.current.length < MAX_QUEUE_SIZE) {
        messageQueueRef.current.push(message);
      } else {
        console.warn('[WebSocket] Message queue full, dropping oldest message');
        messageQueueRef.current.shift();
        messageQueueRef.current.push(message);
      }
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    send({ type: 'join_room', data: { roomId } });
  }, [send]);

  const leaveRoom = useCallback((roomId: string) => {
    send({ type: 'leave_room', data: { roomId } });
  }, [send]);

  const sendMessage = useCallback((content: string, roomId?: string, receiverId?: string) => {
    send({
      type: 'send_message',
      data: { content, roomId, receiverId },
    });
  }, [send]);

  useEffect(() => {
    const token = getToken();
    if (user && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  return {
    ...state,
    send,
    joinRoom,
    leaveRoom,
    sendMessage,
    connect,
    disconnect,
  };
}
