import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export class MobileStorageService {
  private static instance: MobileStorageService;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): MobileStorageService {
    if (!MobileStorageService.instance) {
      MobileStorageService.instance = new MobileStorageService();
    }
    return MobileStorageService.instance;
  }

  public async set(key: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);
    this.cache.set(key, value);
    
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: stringValue });
    } else {
      localStorage.setItem(key, stringValue);
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    let value: string | null = null;
    
    if (Capacitor.isNativePlatform()) {
      const result = await Preferences.get({ key });
      value = result.value;
    } else {
      value = localStorage.getItem(key);
    }

    if (value) {
      try {
        const parsed = JSON.parse(value);
        this.cache.set(key, parsed);
        return parsed;
      } catch (e) {
        return value as T;
      }
    }

    return null;
  }

  public async remove(key: string): Promise<void> {
    this.cache.delete(key);
    
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    
    if (Capacitor.isNativePlatform()) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  public async keys(): Promise<string[]> {
    if (Capacitor.isNativePlatform()) {
      const { keys } = await Preferences.keys();
      return keys;
    } else {
      return Object.keys(localStorage);
    }
  }
}

export const storageService = MobileStorageService.getInstance();
