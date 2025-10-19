import React, { createContext, useContext } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
const WebSocketContext = createContext(null);
export function WebSocketProvider({ children }) {
    // Initialize WebSocket connection with error handling
    // Connection errors are exposed via context for components to handle gracefully
    // The WebSocketErrorBoundary catches unexpected errors during message processing
    const webSocket = useWebSocket({
        onConnect: () => console.log('[WebSocket] Provider connected'),
        onDisconnect: () => console.log('[WebSocket] Provider disconnected'),
        onError: (error) => {
            console.error('[WebSocket] Provider error:', error);
        },
        reconnect: true,
        reconnectAttempts: 5,
        reconnectInterval: 3000,
    });
    const { isConnected, isConnecting, error, send, sendMessage } = webSocket;
    return (<WebSocketContext.Provider value={{ isConnected, isConnecting, error, send, sendMessage }}>
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
