import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
export class NotificationService {
    constructor() {
        this.isInitialized = false;
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    async initialize(config) {
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
        await PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            config.onRegistered?.(token.value);
        });
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', error);
            config.onRegistrationError?.(error);
        });
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
            config.onReceived?.(notification);
        });
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push notification action performed:', action);
            config.onActionPerformed?.(action);
        });
        await PushNotifications.register();
        this.isInitialized = true;
    }
    async getDeliveredNotifications() {
        if (!Capacitor.isNativePlatform()) {
            return [];
        }
        const result = await PushNotifications.getDeliveredNotifications();
        return result.notifications;
    }
    async removeDeliveredNotifications(notifications) {
        if (!Capacitor.isNativePlatform()) {
            return;
        }
        await PushNotifications.removeDeliveredNotifications({ notifications });
    }
    async removeAllDeliveredNotifications() {
        if (!Capacitor.isNativePlatform()) {
            return;
        }
        await PushNotifications.removeAllDeliveredNotifications();
    }
}
export const notificationService = NotificationService.getInstance();
