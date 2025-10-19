/**
 * ISSUE #36 FIX: Internationalization (i18n) Implementation
 * 
 * Simple i18n system for multi-language support
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export interface Translations {
  [locale: string]: TranslationDictionary;
}

class I18n {
  private currentLocale: SupportedLocale = 'en';
  private translations: Translations = {};
  private fallbackLocale: SupportedLocale = 'en';

  constructor() {
    // Load locale from localStorage or browser
    const savedLocale = localStorage.getItem('locale') as SupportedLocale;
    const browserLocale = this.getBrowserLocale();
    this.currentLocale = savedLocale || browserLocale || 'en';
  }

  /**
   * Get browser's preferred locale
   */
  private getBrowserLocale(): SupportedLocale {
    const lang = navigator.language.split('-')[0];
    const supported: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
    return supported.includes(lang as SupportedLocale) ? (lang as SupportedLocale) : 'en';
  }

  /**
   * Set translations for a locale
   */
  addTranslations(locale: SupportedLocale, translations: TranslationDictionary): void {
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations,
    };
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Set current locale
   */
  setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
  }

  /**
   * Translate a key with interpolation
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key, this.currentLocale) ||
                       this.getTranslation(key, this.fallbackLocale) ||
                       key;

    return this.interpolate(translation, params);
  }

  /**
   * Get translation for a key in a specific locale
   */
  private getTranslation(key: string, locale: SupportedLocale): string | null {
    const keys = key.split('.');
    let value: any = this.translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpolate variables into translation string
   */
  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;

    return Object.entries(params).reduce(
      (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
      text
    );
  }

  /**
   * Pluralization helper
   */
  plural(count: number, singular: string, plural: string): string {
    return count === 1 ? singular : plural;
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

// Global instance
export const i18n = new I18n();

// Shorthand function
export const t = i18n.translate.bind(i18n);

// React hook
import { useState, useEffect } from 'react';

export function useTranslation() {
  const [, forceUpdate] = useState({});
  const [locale, setLocaleState] = useState(i18n.getLocale());

  const setLocale = (newLocale: SupportedLocale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
    forceUpdate({});
  };

  return {
    t: i18n.translate.bind(i18n),
    locale,
    setLocale,
    formatNumber: i18n.formatNumber.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    plural: i18n.plural.bind(i18n),
  };
}

// Load default English translations
i18n.addTranslations('en', {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
  },
  auth: {
    login: 'Log In',
    logout: 'Log Out',
    register: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    email: 'Email',
    password: 'Password',
    username: 'Username',
  },
  errors: {
    required: '{{field}} is required',
    invalid: 'Invalid {{field}}',
    tooShort: '{{field}} must be at least {{min}} characters',
    tooLong: '{{field}} must be less than {{max}} characters',
    networkError: 'Network error. Please try again.',
    serverError: 'Server error. Please try again later.',
  },
});
