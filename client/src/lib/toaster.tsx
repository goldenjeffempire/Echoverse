// src/components/ui/Toaster.tsx
import React from "react"
import {
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open, onOpenChange }) => (
        <ToastRoot
          key={id}
          open={open}
          variant={variant}
          onOpenChange={onOpenChange}
        >
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
          <ToastClose aria-label="Close toast" />
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
