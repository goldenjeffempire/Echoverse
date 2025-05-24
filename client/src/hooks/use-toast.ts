// client/src/hooks/use-toast.tsx
import * as React from 'react';
import { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_TIMEOUT = 5000;

type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const ToastContext = React.createContext({
  toasts: [] as Toast[],
  toast: (toast: Omit<Toast, 'id'>) => {},
});

export function ToastProviderCustom({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_TIMEOUT);
  };

  return <ToastContext.Provider value={{ toasts, toast }}>{children}</ToastContext.Provider>;
}

export const useToast = () => React.useContext(ToastContext);
