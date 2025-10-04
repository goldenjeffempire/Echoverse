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
 */
export function handleApiError(error: any): void {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    showError(apiError.message || 'An error occurred', {
      title: apiError.code || 'Error',
      description: apiError.details?.map((d: any) => d.message).join(', ')
    });
  } else if (error.message) {
    showError(error.message);
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
