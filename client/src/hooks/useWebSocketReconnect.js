import { useEffect, useRef, useState, useCallback } from 'react';
export function useWebSocketReconnect(options = {}) {
    const { onMessage, onOpen, onClose, onError, reconnectInterval = 3000, maxReconnectAttempts = 10, } = options;
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const shouldReconnect = useRef(true);
    const getWebSocketUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws`;
    };
    // Calculate exponential backoff delay
    const getReconnectDelay = (attempt) => {
        // Exponential backoff: base * 2^attempt, with max cap
        const baseDelay = reconnectInterval;
        const maxDelay = 30000; // Cap at 30 seconds
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 1000;
        return Math.min(exponentialDelay + jitter, maxDelay);
    };
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }
        try {
            const ws = new WebSocket(getWebSocketUrl());
            wsRef.current = ws;
            ws.onopen = (event) => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setReconnectAttempts(0);
                onOpen?.(event);
            };
            ws.onmessage = (event) => {
                onMessage?.(event);
            };
            ws.onclose = (event) => {
                console.log('WebSocket disconnected', event);
                setIsConnected(false);
                onClose?.(event);
                // Attempt to reconnect if not manually closed
                if (shouldReconnect.current && reconnectAttempts < maxReconnectAttempts) {
                    const delay = getReconnectDelay(reconnectAttempts);
                    console.log(`Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1);
                        connect();
                    }, delay);
                }
                else if (reconnectAttempts >= maxReconnectAttempts) {
                    console.error('Max reconnect attempts reached');
                }
            };
            ws.onerror = (event) => {
                console.error('WebSocket error', event);
                onError?.(event);
            };
        }
        catch (error) {
            console.error('Failed to create WebSocket connection', error);
            setIsConnected(false);
        }
    }, [
        onMessage,
        onOpen,
        onClose,
        onError,
        reconnectInterval,
        maxReconnectAttempts,
        reconnectAttempts,
    ]);
    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
        else {
            console.warn('WebSocket is not connected. Message not sent:', data);
        }
    }, []);
    const close = useCallback(() => {
        shouldReconnect.current = false;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);
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
    }, []);
    return {
        isConnected,
        reconnectAttempts,
        sendMessage,
        close,
    };
}
