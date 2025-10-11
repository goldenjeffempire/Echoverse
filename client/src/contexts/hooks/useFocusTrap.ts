/**
 * MEDIUM PRIORITY FIX #65: Focus trap for modals
 * Keeps focus within modal for accessibility
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      FOCUSABLE_ELEMENTS.join(',')
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const previouslyFocused = document.activeElement as HTMLElement;

    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        previouslyFocused?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      previouslyFocused?.focus();
    };
  }, [active]);

  return ref;
}
