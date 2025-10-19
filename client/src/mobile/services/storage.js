import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
export class MobileStorageService {
    constructor() {
        this.cache = new Map();
    }
    static getInstance() {
        if (!MobileStorageService.instance) {
            MobileStorageService.instance = new MobileStorageService();
        }
        return MobileStorageService.instance;
    }
    async set(key, value) {
        const stringValue = JSON.stringify(value);
        this.cache.set(key, value);
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key, value: stringValue });
        }
        else {
            localStorage.setItem(key, stringValue);
        }
    }
    async get(key) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        let value = null;
        if (Capacitor.isNativePlatform()) {
            const result = await Preferences.get({ key });
            value = result.value;
        }
        else {
            value = localStorage.getItem(key);
        }
        if (value) {
            try {
                const parsed = JSON.parse(value);
                this.cache.set(key, parsed);
                return parsed;
            }
            catch (e) {
                return value;
            }
        }
        return null;
    }
    async remove(key) {
        this.cache.delete(key);
        if (Capacitor.isNativePlatform()) {
            await Preferences.remove({ key });
        }
        else {
            localStorage.removeItem(key);
        }
    }
    async clear() {
        this.cache.clear();
        if (Capacitor.isNativePlatform()) {
            await Preferences.clear();
        }
        else {
            localStorage.clear();
        }
    }
    async keys() {
        if (Capacitor.isNativePlatform()) {
            const { keys } = await Preferences.keys();
            return keys;
        }
        else {
            return Object.keys(localStorage);
        }
    }
}
export const storageService = MobileStorageService.getInstance();
