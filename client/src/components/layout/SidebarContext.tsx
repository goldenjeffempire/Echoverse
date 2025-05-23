// client/src/components/layout/SidebarContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;       // true means sidebar is slim/collapsed
  toggleCollapse: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  isOpen: boolean;          // convenience derived state: !collapsed
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

const LOCAL_STORAGE_KEY = "sidebar-collapsed";

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  // default to false (expanded) if no saved state
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed(prev => !prev);
  const openSidebar = () => setCollapsed(false);
  const closeSidebar = () => setCollapsed(true);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleCollapse,
        openSidebar,
        closeSidebar,
        isOpen: !collapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
