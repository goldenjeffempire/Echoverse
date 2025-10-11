import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
const WebSocketContext = createContext(null);
export function WebSocketProvider({ children }) {
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [messageQueueSize, setMessageQueueSize] = useState(0);
    const [lastPingTime, setLastPingTime] = useState(Date.now());
    // Initialize WebSocket connection with error handling
    const webSocket = useWebSocket({
        onConnect: () => {
            // WebSocket provider connected
            setConnectionQuality('good');
            toast.success('Connected to real-time updates');
        },
        onDisconnect: () => {
            // WebSocket provider disconnected
            setConnectionQuality('offline');
            toast.error('Real-time updates disconnected');
        },
        onError: (error) => {
            // WebSocket provider error
            setConnectionQuality('poor');
            toast.error('Connection error - retrying...');
        },
        reconnect: true,
        reconnectAttempts: 5,
        reconnectInterval: 3000,
    });
    const { isConnected, isConnecting, error, send, sendMessage } = webSocket;
    // PHASE 3: Monitor connection quality based on ping latency
    useEffect(() => {
        if (!isConnected) {
            setConnectionQuality('offline');
            return;
        }
        const pingInterval = setInterval(() => {
            const pingStart = Date.now();
            setLastPingTime(pingStart);
            // Send ping message
            send({ type: 'ping', timestamp: pingStart });
            // Measure latency (simplified - would need pong response in real impl)
            const latency = Date.now() - pingStart;
            if (latency < 100) {
                setConnectionQuality('good');
            }
            else if (latency < 300) {
                setConnectionQuality('degraded');
            }
            else {
                setConnectionQuality('poor');
            }
        }, 5000); // Check every 5 seconds
        return () => clearInterval(pingInterval);
    }, [isConnected, send]);
    // PHASE 3: Backpressure handling - limit message queue size
    const sendWithBackpressure = (message) => {
        if (messageQueueSize >= 100) {
            toast.warning('Message queue full - please wait');
            return;
        }
        setMessageQueueSize(prev => prev + 1);
        send(message);
        // Simulate message sent confirmation
        setTimeout(() => {
            setMessageQueueSize(prev => Math.max(0, prev - 1));
        }, 100);
    };
    const sendMessageWithBackpressure = (content, roomId, receiverId) => {
        if (messageQueueSize >= 100) {
            toast.warning('Message queue full - please wait');
            return;
        }
        setMessageQueueSize(prev => prev + 1);
        sendMessage(content, roomId, receiverId);
        setTimeout(() => {
            setMessageQueueSize(prev => Math.max(0, prev - 1));
        }, 100);
    };
    // PHASE 3: UI notifications for connection state changes
    useEffect(() => {
        if (connectionQuality === 'degraded') {
            toast.warning('Connection degraded - messages may be delayed');
        }
        else if (connectionQuality === 'poor') {
            toast.error('Poor connection - experiencing delays');
        }
    }, [connectionQuality]);
    return (<WebSocketContext.Provider value={{
            isConnected,
            isConnecting,
            error,
            send: sendWithBackpressure,
            sendMessage: sendMessageWithBackpressure,
            connectionQuality,
            messageQueueSize
        }}>
      {children}
    </WebSocketContext.Provider>);
}
export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within WebSocketProvider');
    }
    return context;
}
