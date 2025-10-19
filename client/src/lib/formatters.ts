/**
 * ISSUES #37-38 FIX: Date and Currency Formatting
 * 
 * Centralized formatting utilities for consistent display
 */

import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

// ===== Date Formatting =====

export type DateFormat = 
  | 'short'      // 12/31/2025
  | 'medium'     // Dec 31, 2025
  | 'long'       // December 31, 2025
  | 'full'       // Friday, December 31, 2025
  | 'time'       // 3:45 PM
  | 'datetime'   // Dec 31, 2025 3:45 PM
  | 'iso';       // 2025-12-31T15:45:00.000Z

const DATE_FORMAT_PATTERNS: Record<DateFormat, string> = {
  short: 'MM/dd/yyyy',
  medium: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  full: 'EEEE, MMMM dd, yyyy',
  time: 'h:mm a',
  datetime: 'MMM dd, yyyy h:mm a',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

/**
 * Format a date with specified format
 */
export function formatDate(
  date: Date | string | number,
  formatType: DateFormat = 'medium'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(dateObj, DATE_FORMAT_PATTERNS[formatType]);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(date);
  }
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return String(date);
  }
}

/**
 * Format date relative to now (e.g., "yesterday at 3:45 PM")
 */
export function formatRelativeDate(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatRelative(dateObj, new Date());
  } catch (error) {
    console.error('Relative date formatting error:', error);
    return String(date);
  }
}

// ===== Currency Formatting =====

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyFormatOptions {
  currency?: Currency;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Format currency with compact notation (e.g., $1.2K, $3.4M)
 */
export function formatCompactCurrency(
  amount: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Compact currency formatting error:', error);
    return formatCurrency(amount, { currency });
  }
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and separators
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// ===== Number Formatting =====

/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat('en-US', options).format(value);
  } catch (error) {
    console.error('Number formatting error:', error);
    return String(value);
  }
}

/**
 * Format as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
