/**
 * Global Error Toast System
 * Provides consistent error notifications across the application
 */

import { toast } from 'sonner';

export interface ErrorOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show error toast
 */
export function showError(message: string, options?: ErrorOptions): void {
  toast.error(options?.title || 'Error', {
    description: message,
    duration: options?.duration || 5000,
    action: options?.action
  });
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: Omit<ErrorOptions, 'title'>): void {
  toast.success('Success', {
    description: message,
    duration: options?.duration || 3000,
    action: options?.action
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: Omit<ErrorOptions, 'title'>): void {
  toast.info('Info', {
    description: message,
    duration: options?.duration || 4000,
    action: options?.action
  });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: Omit<ErrorOptions, 'title'>): void {
  toast.warning('Warning', {
    description: message,
    duration: options?.duration || 4000,
    action: options?.action
  });
}

/**
 * Handle API errors with consistent formatting
 * HIGH PRIORITY FIX #29: Hide stack traces in production
 */
export function handleApiError(error: any): void {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    
    // SECURITY: Never show stack traces in production
    const description = isDevelopment && apiError.stack 
      ? `${apiError.details?.map((d: any) => d.message).join(', ')}\n\nStack: ${apiError.stack}`
      : apiError.details?.map((d: any) => d.message).join(', ');
    
    showError(apiError.message || 'An error occurred', {
      title: apiError.code || 'Error',
      description
    });
  } else if (error.message) {
    // Only show detailed error messages in development
    const message = isDevelopment ? error.message : 'An error occurred';
    showError(message);
  } else {
    showError('An unexpected error occurred');
  }
}

/**
 * Promise toast wrapper
 * Shows loading, success, and error states automatically
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): void {
  toast.promise(promise, messages);
}
