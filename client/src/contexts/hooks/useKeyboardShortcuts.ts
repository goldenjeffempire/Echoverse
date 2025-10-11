/**
 * MEDIUM PRIORITY FIX #64: Keyboard shortcuts hook
 * Adds keyboard navigation support
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: (event: KeyboardEvent) => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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

export function useGlobalKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
): void {
  useKeyboardShortcuts([
    {
      key,
      ...modifiers,
      callback,
    },
  ]);
}
