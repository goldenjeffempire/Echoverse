/**
 * Accessibility Utilities
 * Provides helpers for ARIA, keyboard navigation, focus management, and screen readers
 */
import { useEffect, useRef } from 'react';
/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(active) {
    const ref = useRef(null);
    useEffect(() => {
        if (!active)
            return;
        const element = ref.current;
        if (!element)
            return;
        const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const handleTab = (e) => {
            if (e.key !== 'Tab')
                return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            }
            else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };
        element.addEventListener('keydown', handleTab);
        firstElement?.focus();
        return () => {
            element.removeEventListener('keydown', handleTab);
        };
    }, [active]);
    return ref;
}
/**
 * Announce to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}
/**
 * Generate unique ID for ARIA labels
 */
let idCounter = 0;
export function useAriaId(prefix = 'aria') {
    const idRef = useRef();
    if (!idRef.current) {
        idRef.current = `${prefix}-${++idCounter}`;
    }
    return idRef.current;
}
/**
 * Keyboard navigation handler with extended support
 */
export function handleKeyboardNavigation(event, handlers) {
    const keyMap = {
        'Enter': 'onEnter',
        ' ': 'onSpace',
        'Escape': 'onEscape',
        'ArrowUp': 'onArrowUp',
        'ArrowDown': 'onArrowDown',
        'ArrowLeft': 'onArrowLeft',
        'ArrowRight': 'onArrowRight',
        'Home': 'onHome',
        'End': 'onEnd',
        'PageUp': 'onPageUp',
        'PageDown': 'onPageDown',
    };
    // Handle Tab separately due to shift modifier
    if (event.key === 'Tab') {
        const handler = event.shiftKey ? 'onShiftTab' : 'onTab';
        if (handlers[handler]) {
            event.preventDefault();
            handlers[handler]();
        }
        return;
    }
    const handler = keyMap[event.key];
    if (handler && handlers[handler]) {
        event.preventDefault();
        handlers[handler]();
    }
}
/**
 * Check if element has sufficient color contrast
 */
export function checkColorContrast(foreground, background, largeText = false) {
    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);
    if (!fg || !bg) {
        return { ratio: 0, passes: false };
    }
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const threshold = largeText ? 3 : 4.5; // WCAG AA standards
    return { ratio, passes: ratio >= threshold };
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function relativeLuminance(rgb) {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        const normalized = val / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/**
 * Skip to main content link (for keyboard users)
 */
export function SkipToMainContent() {
    return (<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded">
      Skip to main content
    </a>);
}
/**
 * Screen reader only text component
 */
export function ScreenReaderOnly({ children }) {
    return (<span className="sr-only">
      {children}
    </span>);
}
