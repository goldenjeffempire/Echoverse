import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
export class MobileNavigationService {
    constructor() {
        this.backButtonListeners = new Set();
        if (Capacitor.isNativePlatform()) {
            this.setupBackButtonHandler();
        }
    }
    static getInstance() {
        if (!MobileNavigationService.instance) {
            MobileNavigationService.instance = new MobileNavigationService();
        }
        return MobileNavigationService.instance;
    }
    setupBackButtonHandler() {
        App.addListener('backButton', async ({ canGoBack }) => {
            for (const listener of this.backButtonListeners) {
                const handled = listener();
                if (handled) {
                    return;
                }
            }
            if (canGoBack) {
                window.history.back();
            }
            else {
                const shouldExit = confirm('Are you sure you want to exit?');
                if (shouldExit) {
                    App.exitApp();
                }
            }
        });
    }
    registerBackButtonHandler(handler) {
        this.backButtonListeners.add(handler);
        return () => {
            this.backButtonListeners.delete(handler);
        };
    }
    async openExternalUrl(url) {
        if (Capacitor.isNativePlatform()) {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url });
        }
        else {
            window.open(url, '_blank');
        }
    }
    async getAppInfo() {
        if (Capacitor.isNativePlatform()) {
            return await App.getInfo();
        }
        return {
            name: 'EchoVerse',
            id: 'com.echoverse.platform',
            build: 'web',
            version: '1.0.0'
        };
    }
}
export const navigationService = MobileNavigationService.getInstance();
