/**
 * Offline Support and Service Worker Management
 * Provides offline detection, data persistence, and sync capabilities
 */

import { useEffect, useState } from 'react';

/**
 * Check if browser is online
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Offline Storage Manager
 * Persists data locally when offline
 */
export class OfflineStorageManager {
  private dbName = 'echoverse-offline';
  private storeName = 'pending-actions';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async addPendingAction(action: Record<string, unknown>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add({ ...action, timestamp: Date.now() });

      request.onsuccess = () => {
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready
            .then(registration => {
              const syncManager = (registration as { sync?: { register: (tag: string) => Promise<void> } }).sync;
              if (syncManager) {
                syncManager.register('sync-data').catch(() => {
                  // Sync registration failed - will retry on next action
                });
              }
            })
            .catch(() => {
              // Service worker not ready - will sync when available
            });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<Array<Record<string, unknown> & { id: number }>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Sync pending actions when coming online
 */
export async function syncPendingActions(
  storageManager: OfflineStorageManager,
  onSync: (action: any) => Promise<void>
): Promise<void> {
  const pendingActions = await storageManager.getPendingActions();

  for (const action of pendingActions) {
    try {
      await onSync(action);
      await storageManager.removePendingAction(action.id);
      console.log('Synced offline action:', action);
    } catch (error) {
      console.error('Failed to sync action:', action, error);
    }
  }
}

/**
 * Register service worker for PWA
 * HIGH PRIORITY FIX #23: Ensure proper scope for production
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      // FIX: Use explicit scope of '/' for production compatibility
      const registration = await navigator.serviceWorker.register('/sw.js', { 
        scope: '/' 
      });
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Check for PWA updates
 */
export function checkForUpdates(registration: ServiceWorkerRegistration): void {
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        if (confirm('A new version is available. Reload to update?')) {
          window.location.reload();
        }
      }
    });
  });
}
