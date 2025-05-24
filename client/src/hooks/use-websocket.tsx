import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketReadyState = 
  | typeof WebSocket.CONNECTING
  | typeof WebSocket.OPEN
  | typeof WebSocket.CLOSING
  | typeof WebSocket.CLOSED;

interface UseWebSocketOptions {
  debug?: boolean;             // Enable console logs for dev
  reconnectInterval?: number;  // ms before trying to reconnect on close/error
  maxReconnectAttempts?: number; // limit reconnection attempts
}

export function useWebSocket<T = any>(
  url: string,
  options?: UseWebSocketOptions
) {
  const {
    debug = false,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options || {};

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [message, setMessage] = useState<T | null>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>(WebSocket.CLOSED);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    if (debug) console.log(`[WS] Connecting to ${url}...`);

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      reconnectAttempts.current = 0;
      setReadyState(WebSocket.OPEN);
      setError(null);
      if (debug) console.log('[WS] Connected');
    };

    ws.current.onclose = (event) => {
      setReadyState(WebSocket.CLOSED);
      if (debug) console.log(`[WS] Disconnected: code=${event.code}, reason=${event.reason}`);

      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        if (debug) console.log(`[WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts.current})`);
        reconnectTimeout.current = setTimeout(connect, reconnectInterval);
      } else if (debug) {
        console.warn('[WS] Max reconnect attempts reached, giving up.');
      }
    };

    ws.current.onerror = (event) => {
      // Create a meaningful Error object instead of unsafe casting
      const errorMessage = `WebSocket error: ${event.type || 'Unknown error'}`;
      setError(new Error(errorMessage));
      setReadyState(WebSocket.CLOSING);
      if (debug) console.error('[WS] Error encountered', event);
      // onclose will follow onerror
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage(data);
      } catch {
        // If JSON parse fails, fallback to raw data
        setMessage(event.data as any);
      }
    };
  }, [url, debug, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (debug) console.log('[WS] Cleanup: closing socket');
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect, debug]);

  const sendMessage = useCallback((msg: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
      if (debug) console.log('[WS] Sent message', msg);
    } else if (debug) {
      console.warn('[WS] Cannot send message, socket not open:', msg);
    }
  }, [debug]);

  return { message, sendMessage, readyState, error };
}
