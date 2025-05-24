// client/src/components/ui/toast.tsx
import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'bg-red-600 text-white border-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        className
      )}
      {...props}
    />
  )
);
ToastViewport.displayName = 'ToastViewport';

export const Toast = React.forwardRef(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
);
Toast.displayName = 'Toast';

export const ToastTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  )
);
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  )
);
ToastDescription.displayName = 'ToastDescription';

export const ToastClose = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
);
ToastClose.displayName = 'ToastClose';

export const ToastAction = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium hover:bg-secondary',
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = 'ToastAction';

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {};
