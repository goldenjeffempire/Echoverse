/**
 * ISSUE #36 FIX: Internationalization (i18n) Implementation
 *
 * Simple i18n system for multi-language support
 */
class I18n {
    constructor() {
        this.currentLocale = 'en';
        this.translations = {};
        this.fallbackLocale = 'en';
        // Load locale from localStorage or browser
        const savedLocale = localStorage.getItem('locale');
        const browserLocale = this.getBrowserLocale();
        this.currentLocale = savedLocale || browserLocale || 'en';
    }
    /**
     * Get browser's preferred locale
     */
    getBrowserLocale() {
        const lang = navigator.language.split('-')[0];
        const supported = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
        return supported.includes(lang) ? lang : 'en';
    }
    /**
     * Set translations for a locale
     */
    addTranslations(locale, translations) {
        this.translations[locale] = {
            ...this.translations[locale],
            ...translations,
        };
    }
    /**
     * Get current locale
     */
    getLocale() {
        return this.currentLocale;
    }
    /**
     * Set current locale
     */
    setLocale(locale) {
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);
        document.documentElement.lang = locale;
    }
    /**
     * Translate a key with interpolation
     */
    translate(key, params) {
        const translation = this.getTranslation(key, this.currentLocale) ||
            this.getTranslation(key, this.fallbackLocale) ||
            key;
        return this.interpolate(translation, params);
    }
    /**
     * Get translation for a key in a specific locale
     */
    getTranslation(key, locale) {
        const keys = key.split('.');
        let value = this.translations[locale];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                return null;
            }
        }
        return typeof value === 'string' ? value : null;
    }
    /**
     * Interpolate variables into translation string
     */
    interpolate(text, params) {
        if (!params)
            return text;
        return Object.entries(params).reduce((result, [key, value]) => result.replace(`{{${key}}}`, String(value)), text);
    }
    /**
     * Pluralization helper
     */
    plural(count, singular, plural) {
        return count === 1 ? singular : plural;
    }
    /**
     * Format number according to locale
     */
    formatNumber(value, options) {
        return new Intl.NumberFormat(this.currentLocale, options).format(value);
    }
    /**
     * Format date according to locale
     */
    formatDate(date, options) {
        return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
    }
    /**
     * Format currency according to locale
     */
    formatCurrency(amount, currency = 'USD') {
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
import { useState } from 'react';
export function useTranslation() {
    const [, forceUpdate] = useState({});
    const [locale, setLocaleState] = useState(i18n.getLocale());
    const setLocale = (newLocale) => {
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
