// /src/lib/toast.tsx
// This file wraps your Radix toast component for simple usage across your app.

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  description?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
}

const TOAST_DEFAULT_DURATION = 3000;

const ToastContext = React.createContext<{
  showToast: (title: string, options?: ToastOptions) => void;
} | null>(null);

export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((title: string, options?: ToastOptions) => {
    const id = crypto.randomUUID();
    const type = options?.type ?? "info";
    const duration = options?.duration ?? TOAST_DEFAULT_DURATION;
    const description = options?.description;

    setToasts((prev) => [...prev, { id, title, type, duration, description }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastProvider swipeDirection="right">
        {children}
        {createPortal(
          <ToastViewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50" />,
          document.body
        )}

        {toasts.map(({ id, title, description, type, duration }) => (
          <ToastRoot
            key={id}
            duration={duration}
            onOpenChange={(open) => {
              if (!open) removeToast(id);
            }}
            className={`toast-root toast-${type}`}
          >
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
            <ToastClose aria-label="Close">×</ToastClose>
          </ToastRoot>
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  );
}

// Custom hook to use the toast context in your components
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProviderWrapper");
  }
  return context;
}
