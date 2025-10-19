import { logger } from '../logger';
import { closeDatabase } from '../db';
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds
const WS_DRAIN_TIMEOUT = 10000; // 10 seconds for WebSocket draining
let isShuttingDown = false;
let wsServer = null;
let inFlightRequests = 0;
/**
 * Track in-flight requests for graceful shutdown
 */
export function trackRequest(req, res, next) {
    if (isShuttingDown) {
        res.status(503).json({ error: 'Server is shutting down' });
        return;
    }
    inFlightRequests++;
    res.on('finish', () => {
        inFlightRequests--;
    });
    res.on('close', () => {
        inFlightRequests--;
    });
    next();
}
/**
 * Register WebSocket server for graceful shutdown
 */
export function registerWebSocketServer(wss) {
    wsServer = wss;
}
/**
 * Drain WebSocket connections gracefully
 */
async function drainWebSocketConnections() {
    if (!wsServer) {
        logger.info('No WebSocket server to drain');
        return;
    }
    logger.info('Draining WebSocket connections', {
        activeConnections: wsServer.clients?.size || 0
    });
    // Notify all clients about server shutdown
    wsServer.clients?.forEach((ws) => {
        if (ws.readyState === 1) { // OPEN
            ws.send(JSON.stringify({
                type: 'server_shutdown',
                message: 'Server is shutting down, please reconnect in a moment'
            }));
        }
    });
    // Wait a bit for clients to process the message
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Close all connections gracefully
    const closePromises = [];
    wsServer.clients?.forEach((ws) => {
        closePromises.push(new Promise((resolve) => {
            if (ws.readyState === 1) { // OPEN
                ws.close(1001, 'Server shutting down');
            }
            resolve();
        }));
    });
    await Promise.race([
        Promise.all(closePromises),
        new Promise(resolve => setTimeout(resolve, WS_DRAIN_TIMEOUT))
    ]);
    logger.info('WebSocket connections drained');
}
/**
 * Wait for in-flight requests to complete
 */
async function waitForInFlightRequests() {
    if (inFlightRequests === 0) {
        logger.info('No in-flight requests to wait for');
        return;
    }
    logger.info('Waiting for in-flight requests to complete', { count: inFlightRequests });
    const startTime = Date.now();
    const maxWait = 10000; // 10 seconds
    while (inFlightRequests > 0 && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    logger.info('In-flight requests completed', {
        remaining: inFlightRequests,
        waitedMs: Date.now() - startTime
    });
}
/**
 * Setup graceful shutdown handlers
 * Ensures proper cleanup before process termination
 */
export function setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
        if (isShuttingDown) {
            logger.warn('Shutdown already in progress, forcing exit');
            process.exit(1);
        }
        isShuttingDown = true;
        logger.info('Graceful shutdown initiated', { signal });
        // Set a timeout to force shutdown if graceful shutdown takes too long
        const forceShutdownTimeout = setTimeout(() => {
            logger.error('Graceful shutdown timeout exceeded, forcing exit');
            process.exit(1);
        }, SHUTDOWN_TIMEOUT);
        try {
            // 1. Stop accepting new connections
            logger.info('Closing HTTP server (stopping new connections)');
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        logger.error('Error closing HTTP server', err);
                        reject(err);
                    }
                    else {
                        logger.info('HTTP server closed');
                        resolve();
                    }
                });
            });
            // 2. Drain WebSocket connections
            await drainWebSocketConnections();
            // 3. Wait for in-flight requests to complete
            await waitForInFlightRequests();
            // 4. Close database connections
            logger.info('Closing database connections');
            await closeDatabase();
            // Clear the force shutdown timeout
            clearTimeout(forceShutdownTimeout);
            logger.info('Graceful shutdown completed successfully');
            process.exit(0);
        }
        catch (error) {
            logger.error('Error during graceful shutdown', error instanceof Error ? error : undefined);
            clearTimeout(forceShutdownTimeout);
            process.exit(1);
        }
    };
    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        const errorMessage = error?.message || String(error);
        // Don't shutdown for recoverable Neon WebSocket errors
        if (errorMessage && (errorMessage.includes('Connection terminated unexpectedly') ||
            errorMessage.includes('WebSocket was closed') ||
            errorMessage.includes('WebSocket is not open'))) {
            logger.warn('Recoverable database WebSocket error - not shutting down', { error: error.message });
            return;
        }
        logger.error('Uncaught exception - initiating shutdown', error);
        shutdown('uncaughtException');
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        const errorMessage = error?.message || String(error);
        // Don't shutdown for recoverable Neon WebSocket errors
        if (errorMessage && (errorMessage.includes('Connection terminated unexpectedly') ||
            errorMessage.includes('WebSocket was closed') ||
            errorMessage.includes('WebSocket is not open'))) {
            logger.warn('Recoverable database WebSocket rejection - not shutting down', { error: error.message });
            return;
        }
        logger.error('Unhandled promise rejection - initiating shutdown', error);
        shutdown('unhandledRejection');
    });
    logger.info('Graceful shutdown handlers registered');
}
