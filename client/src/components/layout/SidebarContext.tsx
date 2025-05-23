import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SidebarContextValue {
  isOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  // Let's start sidebar open by default on desktop size, but you can tweak this
  const [isOpen, setIsOpen] = useState(() => {
    // Could read from localStorage here to persist state if you want
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Optional: persist sidebar state to localStorage (pro tip for UX continuity)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // The real MVP methods:
  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook for easy access to SidebarContext in your components
export const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
