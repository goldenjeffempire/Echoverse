/**
 * Internationalization (i18n) Support
 * 
 * Multi-language support for the EchoVerse platform
 */

import { logger } from './utils';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ar' | 'ru';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  [locale: string]: Translation;
}

const DEFAULT_LOCALE: SupportedLocale = 'en';
const STORAGE_KEY = 'echoverse_locale';

class I18n {
  private currentLocale: SupportedLocale = DEFAULT_LOCALE;
  private translations: Translations = {};
  private fallbackTranslations: Translation = {};

  constructor() {
    this.loadLocale();
  }

  /**
   * Initialize i18n with translations
   */
  async init(translations: Translations): Promise<void> {
    this.translations = translations;
    this.fallbackTranslations = translations[DEFAULT_LOCALE] || {};
    
    // Load saved locale or detect from browser
    const savedLocale = localStorage.getItem(STORAGE_KEY) as SupportedLocale;
    const browserLocale = this.detectBrowserLocale();
    
    const locale = savedLocale || browserLocale || DEFAULT_LOCALE;
    await this.setLocale(locale);
  }

  /**
   * Detect browser locale
   */
  private detectBrowserLocale(): SupportedLocale | null {
    const browserLang = navigator.language || navigator.languages[0];
    const langCode = browserLang.split('-')[0] as SupportedLocale;
    
    const supported: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'ru'];
    return supported.includes(langCode) ? langCode : null;
  }

  /**
   * Load saved locale from storage
   */
  private loadLocale(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.currentLocale = saved as SupportedLocale;
    }
  }

  /**
   * Set current locale
   */
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.translations[locale]) {
      logger.warn(`Translations not found for locale: ${locale}`);
      return;
    }

    this.currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    
    // Update HTML lang attribute
    document.documentElement.lang = locale;
    
    // Update direction for RTL languages
    const rtlLanguages = ['ar'];
    document.documentElement.dir = rtlLanguages.includes(locale) ? 'rtl' : 'ltr';
    
    // Dispatch locale change event
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key, this.currentLocale) || 
                       this.getTranslation(key, DEFAULT_LOCALE) || 
                       key;

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Get translation for a specific key
   */
  private getTranslation(key: string, locale: string): string | null {
    const keys = key.split('.');
    let current: unknown = this.translations[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate variables in translation
   */
  private interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return key in params ? String(params[key]) : match;
    });
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(value);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency
    }).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Format relative time
   */
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    return new Intl.RelativeTimeFormat(this.currentLocale).format(value, unit);
  }

  /**
   * Get list of available locales
   */
  getAvailableLocales(): SupportedLocale[] {
    return Object.keys(this.translations) as SupportedLocale[];
  }

  /**
   * Check if locale is RTL
   */
  isRTL(): boolean {
    return ['ar'].includes(this.currentLocale);
  }
}

// Create singleton instance
export const i18n = new I18n();

// Default English translations
const enTranslations: Translation = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info'
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginSuccess: 'Login successful',
    loginError: 'Invalid email or password'
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back, {{name}}!',
    overview: 'Overview',
    analytics: 'Analytics',
    stats: 'Statistics'
  },
  ecommerce: {
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    addToCart: 'Add to Cart',
    checkout: 'Checkout',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    shipping: 'Shipping'
  },
  errors: {
    notFound: 'Page not found',
    serverError: 'Server error occurred',
    networkError: 'Network error',
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden'
  }
};

// Initialize with default translations
i18n.init({ en: enTranslations });

// Export translation hook for React components
export function useTranslation() {
  const [locale, setLocale] = React.useState(i18n.getLocale());

  React.useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setLocale(customEvent.detail.locale);
    };

    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  return {
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    locale,
    setLocale: (newLocale: SupportedLocale) => i18n.setLocale(newLocale),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => i18n.formatNumber(value, options),
    formatCurrency: (value: number, currency?: string) => i18n.formatCurrency(value, currency),
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => i18n.formatDate(date, options),
    isRTL: () => i18n.isRTL()
  };
}

// React import (will be available in the browser)
declare const React: typeof import('react');
