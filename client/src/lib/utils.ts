import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // in seconds

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const thresholds = [
    { limit: 60, unit: 'second' },
    { limit: 3600, unit: 'minute' },
    { limit: 86400, unit: 'hour' },
    { limit: 604800, unit: 'day' },
    { limit: 2592000, unit: 'week' },
    { limit: 31536000, unit: 'month' },
    { limit: Infinity, unit: 'year' },
  ];

  for (const { limit, unit } of thresholds) {
    const value = Math.floor(diff / {
      second: 1,
      minute: 60,
      hour: 3600,
      day: 86400,
      week: 604800,
      month: 2592000,
      year: 31536000,
    }[unit]);

    if (diff < limit) {
      return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'just now';
}
