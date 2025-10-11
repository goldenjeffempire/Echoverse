/**
 * PWA Install Prompt Customization
 * Issue #79: Customize install prompt
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initializeInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Show custom install UI
    const event = new CustomEvent('pwa-install-available');
    window.dispatchEvent(event);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    // PWA installed successfully
  });
}

export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) {
    return null;
  }

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  
  return outcome;
}

export function isInstallable(): boolean {
  return deferredPrompt !== null;
}
