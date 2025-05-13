
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface WebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (data: any) => void;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectCount = useRef(0);
  const { toast } = useToast();

  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage
  } = options;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectCount.current = 0;
        toast({
          title: "Connected",
          description: "WebSocket connection established",
        });
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setError(error as Error);
        toast({
          title: "Connection Error",
          description: "Failed to establish WebSocket connection",
          variant: "destructive",
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      setSocket(ws);
    } catch (error) {
      setError(error as Error);
      console.error('WebSocket connection error:', error);
    }
  }, [url, reconnectAttempts, reconnectInterval, onMessage, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      toast({
        title: "Connection Error",
        description: "Cannot send message: WebSocket is not connected",
        variant: "destructive",
      });
    }
  }, [socket, toast]);

  return { socket, isConnected, error, sendMessage };
}
