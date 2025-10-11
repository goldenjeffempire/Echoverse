import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export class MobileNavigationService {
  private static instance: MobileNavigationService;
  private backButtonListeners: Set<() => boolean> = new Set();

  private constructor() {
    if (Capacitor.isNativePlatform()) {
      this.setupBackButtonHandler();
    }
  }

  public static getInstance(): MobileNavigationService {
    if (!MobileNavigationService.instance) {
      MobileNavigationService.instance = new MobileNavigationService();
    }
    return MobileNavigationService.instance;
  }

  private setupBackButtonHandler(): void {
    App.addListener('backButton', async ({ canGoBack }) => {
      for (const listener of this.backButtonListeners) {
        const handled = listener();
        if (handled) {
          return;
        }
      }

      if (canGoBack) {
        window.history.back();
      } else {
        const shouldExit = confirm('Are you sure you want to exit?');
        if (shouldExit) {
          App.exitApp();
        }
      }
    });
  }

  public registerBackButtonHandler(handler: () => boolean): () => void {
    this.backButtonListeners.add(handler);
    return () => {
      this.backButtonListeners.delete(handler);
    };
  }

  public async openExternalUrl(url: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  }

  public async getAppInfo(): Promise<{
    name: string;
    id: string;
    build: string;
    version: string;
  }> {
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
