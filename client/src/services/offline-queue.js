/**
 * Offline Queue for Network Requests
 * FIX #18: Add offline request queuing
 */
const QUEUE_KEY = 'offline_request_queue';
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50;
class OfflineQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.loadQueue();
        this.setupListeners();
    }
    loadQueue() {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load offline queue:', error);
            this.queue = [];
        }
    }
    saveQueue() {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
        }
        catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }
    setupListeners() {
        window.addEventListener('online', () => {
            console.log('Back online, processing queued requests');
            this.processQueue();
        });
        // Try to process queue periodically when online
        setInterval(() => {
            if (navigator.onLine && this.queue.length > 0) {
                this.processQueue();
            }
        }, 30000); // Every 30 seconds
    }
    add(url, options = {}) {
        if (this.queue.length >= MAX_QUEUE_SIZE) {
            console.warn('Offline queue full, dropping oldest request');
            this.queue.shift();
        }
        const request = {
            id: `${Date.now()}-${Math.random()}`,
            url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timestamp: Date.now(),
            retryCount: 0
        };
        this.queue.push(request);
        this.saveQueue();
        console.log(`Request queued for offline: ${url}`);
    }
    async processQueue() {
        if (this.processing || this.queue.length === 0 || !navigator.onLine) {
            return;
        }
        this.processing = true;
        const queue = [...this.queue];
        for (const request of queue) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body
                });
                if (response.ok) {
                    // Success - remove from queue
                    this.queue = this.queue.filter(r => r.id !== request.id);
                    console.log(`Offline request successful: ${request.url}`);
                }
                else if (response.status >= 400 && response.status < 500) {
                    // Client error - remove from queue (won't succeed on retry)
                    this.queue = this.queue.filter(r => r.id !== request.id);
                    console.error(`Offline request failed with ${response.status}: ${request.url}`);
                }
                else {
                    // Server error - retry
                    this.handleRetry(request);
                }
            }
            catch (error) {
                console.error(`Failed to process offline request: ${request.url}`, error);
                this.handleRetry(request);
            }
        }
        this.saveQueue();
        this.processing = false;
    }
    handleRetry(request) {
        const index = this.queue.findIndex(r => r.id === request.id);
        if (index === -1)
            return;
        this.queue[index].retryCount += 1;
        if (this.queue[index].retryCount >= MAX_RETRIES) {
            console.error(`Max retries reached for: ${request.url}`);
            this.queue.splice(index, 1);
        }
    }
    getQueueSize() {
        return this.queue.length;
    }
    clearQueue() {
        this.queue = [];
        this.saveQueue();
    }
    getQueue() {
        return [...this.queue];
    }
}
export const offlineQueue = new OfflineQueue();
// Enhanced fetch with offline support
export async function fetchWithOfflineSupport(url, options = {}) {
    if (!navigator.onLine) {
        // Queue for later if mutation
        if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
            offlineQueue.add(url, options);
            throw new Error('Offline - request queued');
        }
        throw new Error('Offline - read operation not available');
    }
    try {
        return await fetch(url, options);
    }
    catch (error) {
        // Network error while supposedly online - might be intermittent
        if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
            offlineQueue.add(url, options);
        }
        throw error;
    }
}
