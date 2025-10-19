import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { cn } from '@/lib/utils';
export function MobileLayout({ children, className, safeAreaTop = true, safeAreaBottom = true }) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [statusBarHeight, setStatusBarHeight] = useState(0);
    useEffect(() => {
        if (!Capacitor.isNativePlatform())
            return;
        const setupStatusBar = async () => {
            try {
                await StatusBar.setStyle({ style: Style.Dark });
                // Status bar height is handled by CSS safe-area-inset-top
                setStatusBarHeight(0); // Use CSS safe areas instead
            }
            catch (e) {
                console.error('Status bar setup error:', e);
            }
        };
        const setupKeyboard = async () => {
            await Keyboard.addListener('keyboardWillShow', (info) => {
                setKeyboardHeight(info.keyboardHeight);
            });
            await Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardHeight(0);
            });
        };
        setupStatusBar();
        setupKeyboard();
        return () => {
            if (Capacitor.isNativePlatform()) {
                Keyboard.removeAllListeners();
            }
        };
    }, []);
    return (<div className={cn('mobile-layout h-screen w-screen overflow-hidden', className)} style={{
            paddingTop: safeAreaTop ? `${statusBarHeight}px` : 0,
            paddingBottom: safeAreaBottom ? `${keyboardHeight}px` : 0,
        }}>
      {children}
    </div>);
}
export function MobileHeader({ title, leftAction, rightAction, className }) {
    return (<header className={cn('mobile-header flex items-center justify-between px-4 py-3 bg-background border-b', className)}>
      <div className="flex-shrink-0 w-12">
        {leftAction}
      </div>
      <h1 className="flex-1 text-center font-semibold text-lg truncate">
        {title}
      </h1>
      <div className="flex-shrink-0 w-12 flex justify-end">
        {rightAction}
      </div>
    </header>);
}
export function MobileContent({ children, className, scrollable = true }) {
    return (<main className={cn('mobile-content flex-1', scrollable && 'overflow-y-auto', className)}>
      {children}
    </main>);
}
export function MobileBottomNav({ children, className }) {
    return (<nav className={cn('mobile-bottom-nav flex items-center justify-around px-4 py-2 bg-background border-t safe-area-bottom', className)}>
      {children}
    </nav>);
}
