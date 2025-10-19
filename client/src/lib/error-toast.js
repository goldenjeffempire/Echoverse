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
 */
export function handleApiError(error) {
    if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        showError(apiError.message || 'An error occurred', {
            title: apiError.code || 'Error',
            description: apiError.details?.map((d) => d.message).join(', ')
        });
    }
    else if (error.message) {
        showError(error.message);
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
