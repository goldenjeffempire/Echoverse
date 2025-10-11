import { ReactNode, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
}

export function MobileLayout({ 
  children, 
  className, 
  safeAreaTop = true, 
  safeAreaBottom = true 
}: MobileLayoutProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        // Status bar height is handled by CSS safe-area-inset-top
        setStatusBarHeight(0); // Use CSS safe areas instead
      } catch (e) {
        console.error('Status bar setup error:', e);
      }
    };

    const setupKeyboard = async () => {
      await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
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

  return (
    <div 
      className={cn(
        'mobile-layout h-screen w-screen overflow-hidden',
        className
      )}
      style={{
        paddingTop: safeAreaTop ? `${statusBarHeight}px` : 0,
        paddingBottom: safeAreaBottom ? `${keyboardHeight}px` : 0,
      }}
    >
      {children}
    </div>
  );
}

interface MobileHeaderProps {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export function MobileHeader({ title, leftAction, rightAction, className }: MobileHeaderProps) {
  return (
    <header className={cn(
      'mobile-header flex items-center justify-between px-4 py-3 bg-background border-b',
      className
    )}>
      <div className="flex-shrink-0 w-12">
        {leftAction}
      </div>
      <h1 className="flex-1 text-center font-semibold text-lg truncate">
        {title}
      </h1>
      <div className="flex-shrink-0 w-12 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}

interface MobileContentProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function MobileContent({ children, className, scrollable = true }: MobileContentProps) {
  return (
    <main className={cn(
      'mobile-content flex-1',
      scrollable && 'overflow-y-auto',
      className
    )}>
      {children}
    </main>
  );
}

interface MobileBottomNavProps {
  children: ReactNode;
  className?: string;
}

export function MobileBottomNav({ children, className }: MobileBottomNavProps) {
  return (
    <nav className={cn(
      'mobile-bottom-nav flex items-center justify-around px-4 py-2 bg-background border-t safe-area-bottom',
      className
    )}>
      {children}
    </nav>
  );
}
