/**
 * Service Worker Update Notification
 * Issue #31: Add service worker update notification UI
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function ServiceWorkerUpdate() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-blue-600 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version of the app is available. Refresh to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-white text-blue-600 rounded font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="px-3 py-1.5 bg-blue-700 text-white rounded font-medium text-sm hover:bg-blue-800 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowUpdate(false)}
          className="text-blue-200 hover:text-white transition-colors"
          aria-label="Dismiss update notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
