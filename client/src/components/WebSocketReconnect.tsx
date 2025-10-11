/**
 * WebSocket Automatic Reconnection
 * FIX #19: Add WebSocket reconnection logic
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface WebSocketReconnectProps {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocketReconnect({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10
}: WebSocketReconnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnect = useRef(true);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const connect = () => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempt(0);
        toast.success('Connected to real-time updates');
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        onClose?.(event);

        // Attempt reconnection if not intentional close
        if (shouldReconnect.current && event.code !== 1000) {
          attemptReconnect();
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        onError?.(event);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempt >= maxReconnectAttempts) {
      toast.error('Failed to connect', {
        description: 'Real-time updates unavailable. Please refresh the page.'
      });
      return;
    }

    const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttempt), 30000);
    
    setReconnectAttempt(prev => prev + 1);
    
    toast.loading(`Reconnecting... (${reconnectAttempt + 1}/${maxReconnectAttempts})`, {
      id: 'ws-reconnect'
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      console.error('WebSocket not connected');
      toast.error('Not connected to server');
    }
  };

  const disconnect = () => {
    shouldReconnect.current = false;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
    }
  };

  return {
    isConnected,
    send,
    disconnect,
    reconnectAttempt
  };
}
