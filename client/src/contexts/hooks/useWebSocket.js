import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const MAX_QUEUE_SIZE = 100;
export function useWebSocket(options = {}) {
    const { onMessage, onConnect, onDisconnect, onError, reconnect = true, reconnectAttempts = 10, reconnectInterval = 3000, } = options;
    const { user } = useAuth();
    const getToken = () => localStorage.getItem('accessToken');
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectCountRef = useRef(0);
    const messageQueueRef = useRef([]);
    const heartbeatIntervalRef = useRef(null);
    const isAuthenticatedRef = useRef(false);
    const [state, setState] = useState({
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
            // Queue will continue to process on next send
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
        if (!user || !token)
            return;
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));
        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            ws.onopen = () => {
                setState({ isConnected: true, isConnecting: false, error: null });
                ws.send(JSON.stringify({ type: 'auth', token }));
            };
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'pong') {
                        return;
                    }
                    if (message.type === 'authenticated') {
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
                }
                catch (error) {
                    setState((prev) => ({ ...prev, error: 'Failed to parse message' }));
                }
            };
            ws.onerror = (error) => {
                setState((prev) => ({ ...prev, error: 'Connection error' }));
                onError?.(error);
            };
            ws.onclose = (event) => {
                setState({ isConnected: false, isConnecting: false, error: event.reason || null });
                isAuthenticatedRef.current = false;
                clearHeartbeatInterval();
                onDisconnect?.();
                if (reconnect && reconnectCountRef.current < reconnectAttempts) {
                    const jitter = Math.random() * 1000;
                    const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectCountRef.current) + jitter, 30000);
                    clearReconnectTimeout();
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectCountRef.current++;
                        connect();
                    }, delay);
                }
                else if (reconnectCountRef.current >= reconnectAttempts) {
                    setState((prev) => ({ ...prev, error: 'Max reconnection attempts reached' }));
                }
            };
        }
        catch (error) {
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
    const send = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticatedRef.current) {
            wsRef.current.send(JSON.stringify(message));
        }
        else {
            if (messageQueueRef.current.length < MAX_QUEUE_SIZE) {
                messageQueueRef.current.push(message);
            }
            else {
                // Drop oldest message to make room
                messageQueueRef.current.shift();
                messageQueueRef.current.push(message);
            }
        }
    }, []);
    const joinRoom = useCallback((roomId) => {
        send({ type: 'join_room', data: { roomId } });
    }, [send]);
    const leaveRoom = useCallback((roomId) => {
        send({ type: 'leave_room', data: { roomId } });
    }, [send]);
    const sendMessage = useCallback((content, roomId, receiverId) => {
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
