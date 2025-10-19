/**
 * Global Error Toast System
 * Provides consistent error notifications across the application
 */
import { toast } from 'sonner';
/**
 * Show error toast
 */
export function showError(message, options) {
    toast.error(options?.title || 'Error', {
        description: message,
        duration: options?.duration || 5000,
        action: options?.action
    });
}
/**
 * Show success toast
 */
export function showSuccess(message, options) {
    toast.success('Success', {
        description: message,
        duration: options?.duration || 3000,
        action: options?.action
    });
}
/**
 * Show info toast
 */
export function showInfo(message, options) {
    toast.info('Info', {
        description: message,
        duration: options?.duration || 4000,
        action: options?.action
    });
}
/**
 * Show warning toast
 */
export function showWarning(message, options) {
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
export function handleApiError(error) {
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        // SECURITY: Never show stack traces in production
        const description = isDevelopment && apiError.stack
            ? `${apiError.details?.map((d) => d.message).join(', ')}\n\nStack: ${apiError.stack}`
            : apiError.details?.map((d) => d.message).join(', ');
        showError(apiError.message || 'An error occurred', {
            title: apiError.code || 'Error',
            description
        });
    }
    else if (error.message) {
        // Only show detailed error messages in development
        const message = isDevelopment ? error.message : 'An error occurred';
        showError(message);
    }
    else {
        showError('An unexpected error occurred');
    }
}
/**
 * Promise toast wrapper
 * Shows loading, success, and error states automatically
 */
export function toastPromise(promise, messages) {
    toast.promise(promise, messages);
}
