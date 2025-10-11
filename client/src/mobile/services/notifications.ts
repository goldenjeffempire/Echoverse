import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationConfig {
  onRegistered?: (token: string) => void;
  onReceived?: (notification: PushNotificationSchema) => void;
  onActionPerformed?: (action: ActionPerformed) => void;
  onRegistrationError?: (error: any) => void;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(config: NotificationConfig): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      const permRequest = await PushNotifications.requestPermissions();
      
      if (permRequest.receive !== 'granted') {
        throw new Error('Push notification permission denied');
      }
    }

    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      config.onRegistered?.(token.value);
    });

    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
      config.onRegistrationError?.(error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      config.onReceived?.(notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      config.onActionPerformed?.(action);
    });

    await PushNotifications.register();
    this.isInitialized = true;
  }

  public async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  public async removeDeliveredNotifications(notifications: PushNotificationSchema[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await PushNotifications.removeDeliveredNotifications({ notifications });
  }

  public async removeAllDeliveredNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await PushNotifications.removeAllDeliveredNotifications();
  }
}

export const notificationService = NotificationService.getInstance();
