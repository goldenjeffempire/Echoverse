/**
 * MEDIUM PRIORITY FIX #64: Keyboard shortcuts hook
 * Adds keyboard navigation support
 */
import { useEffect } from 'react';
export function useKeyboardShortcuts(shortcuts, enabled = true) {
    useEffect(() => {
        if (!enabled)
            return;
        const handleKeyDown = (event) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey;
                const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
                const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
                const metaMatch = shortcut.meta === undefined || shortcut.meta === event.metaKey;
                const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
                if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.callback(event);
                    break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
}
export function useGlobalKeyboardShortcut(key, callback, modifiers) {
    useKeyboardShortcuts([
        {
            key,
            ...modifiers,
            callback,
        },
    ]);
}
