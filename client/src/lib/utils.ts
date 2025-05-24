import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind class names with clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to a readable string e.g. "May 23, 2025"
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Define time units in seconds with readonly safety and fallback default
const timeUnits = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000,
  year: 31536000,
} as const;

type TimeUnit = keyof typeof timeUnits;

// Safely get seconds for a given unit, fallback to 0 if invalid unit
function getSeconds(unit: string): number {
  return timeUnits[unit as TimeUnit] ?? 0;
}

/**
 * Returns a human-friendly relative time string from a given Date.
 * E.g., "5 minutes ago", "in 2 hours", "just now"
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // difference in seconds

  // Intl.RelativeTimeFormat for nice localized strings
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  // Thresholds sorted by ascending limit (seconds)
  const thresholds: { limit: number; unit: TimeUnit }[] = [
    { limit: 60, unit: 'second' },
    { limit: 3600, unit: 'minute' },
    { limit: 86400, unit: 'hour' },
    { limit: 604800, unit: 'day' },
    { limit: 2592000, unit: 'week' },
    { limit: 31536000, unit: 'month' },
    { limit: Infinity, unit: 'year' },
  ];

  for (const { limit, unit } of thresholds) {
    if (diff < limit) {
      // Calculate relative value (rounded)
      const value = Math.floor(diff / getSeconds(unit));
      return rtf.format(-value, unit);
    }
  }

  // Edge fallback (should never reach here)
  return 'just now';
}
