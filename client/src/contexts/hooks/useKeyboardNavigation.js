/**
 * LOW-009: Keyboard Navigation Hook
 */
import { useEffect, useCallback } from 'react';
export function useKeyboardNavigation(options) {
    const { onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onTab, onShiftTab, enabled = true } = options;
    const handleKeyDown = useCallback((event) => {
        if (!enabled)
            return;
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                onArrowUp?.();
                break;
            case 'ArrowDown':
                event.preventDefault();
                onArrowDown?.();
                break;
            case 'ArrowLeft':
                onArrowLeft?.();
                break;
            case 'ArrowRight':
                onArrowRight?.();
                break;
            case 'Enter':
                onEnter?.();
                break;
            case 'Escape':
                onEscape?.();
                break;
            case 'Tab':
                if (event.shiftKey) {
                    onShiftTab?.();
                }
                else {
                    onTab?.();
                }
                break;
        }
    }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onTab, onShiftTab]);
    useEffect(() => {
        if (enabled) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [enabled, handleKeyDown]);
}
// List navigation hook
export function useListKeyboardNavigation(items, selectedIndex, onSelect, options = {}) {
    const { enabled = true, loop = true } = options;
    useKeyboardNavigation({
        enabled,
        onArrowUp: () => {
            const newIndex = selectedIndex > 0 ? selectedIndex - 1 : loop ? items.length - 1 : 0;
            onSelect(newIndex, items[newIndex]);
        },
        onArrowDown: () => {
            const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : loop ? 0 : items.length - 1;
            onSelect(newIndex, items[newIndex]);
        },
        onEnter: () => {
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                onSelect(selectedIndex, items[selectedIndex]);
            }
        }
    });
}
