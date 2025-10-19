/**
 * PWA Install Prompt Customization
 * Issue #79: Customize install prompt
 */
let deferredPrompt = null;
export function initializeInstallPrompt() {
    if (typeof window === 'undefined')
        return;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Show custom install UI
        const event = new CustomEvent('pwa-install-available');
        window.dispatchEvent(event);
    });
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        // PWA installed successfully
    });
}
export async function showInstallPrompt() {
    if (!deferredPrompt) {
        return null;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
}
export function isInstallable() {
    return deferredPrompt !== null;
}
