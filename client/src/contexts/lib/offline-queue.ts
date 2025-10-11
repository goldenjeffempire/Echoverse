/**
 * IndexedDB Offline Queue Persistence
 * Issue #26: Implement IndexedDB offline queue persistence
 * 
 * Stores API requests when offline and syncs when back online
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'echoverse-offline-queue';
const STORE_NAME = 'requests';
const DB_VERSION = 1;
const MAX_QUEUE_SIZE = 100; // PHASE 3: Max 100 items
const QUEUE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // PHASE 3: 24 hours

class OfflineQueue {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) await this.init();

    // PHASE 3: Clean expired items before adding
    await this.cleanExpired();

    // PHASE 3: Check queue size limit
    const existingRequests = await this.getAll();
    if (existingRequests.length >= MAX_QUEUE_SIZE) {
      // Remove oldest item to make room
      const oldest = existingRequests.sort((a, b) => a.timestamp - b.timestamp)[0];
      if (oldest) {
        await this.remove(oldest.id);
      }
    }

    const queuedRequest: QueuedRequest = {
      ...request,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.add(queuedRequest);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // PHASE 3: Clean expired queue items (older than 24 hours)
  async cleanExpired(): Promise<void> {
    if (!this.db) await this.init();

    const now = Date.now();
    const requests = await this.getAll();
    
    for (const req of requests) {
      if (now - req.timestamp > QUEUE_EXPIRATION_MS) {
        await this.remove(req.id);
      }
    }
  }

  async getAll(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async remove(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateRetryCount(id: string, count: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const request = getReq.result;
        if (request) {
          request.retryCount = count;
          const putReq = store.put(request);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    // Back online, syncing queued requests
    await syncQueue();
  });
}

async function syncQueue(): Promise<void> {
  const requests = await offlineQueue.getAll();
  
  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : undefined
      });

      if (response.ok) {
        await offlineQueue.remove(req.id);
        // Successfully synced request
      } else if (req.retryCount < 3) {
        await offlineQueue.updateRetryCount(req.id, req.retryCount + 1);
      } else {
        // Max retries reached, remove from queue
        await offlineQueue.remove(req.id);
        // Failed to sync after 3 retries
      }
    } catch (error) {
      // Error syncing request
      if (req.retryCount < 3) {
        await offlineQueue.updateRetryCount(req.id, req.retryCount + 1);
      }
    }
  }
}
