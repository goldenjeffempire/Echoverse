import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./navbar";
import { useSidebar } from "./SidebarContext";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarOpen, closeSidebar, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  // Track screen size to decide mobile or desktop layout
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();

    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Close sidebar if clicking outside it (mobile only)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const mobileBtn = document.getElementById("mobile-menu-btn");

      if (
        isMobile &&
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        mobileBtn &&
        !mobileBtn.contains(e.target as Node)
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isSidebarOpen, closeSidebar]);

  // Load Material Icons (run once)
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar panel: show/hide based on mobile + sidebar open */}
      <div
        id="sidebar"
        className={`${
          isMobile ? (isSidebarOpen ? "block" : "hidden") : "block"
        } md:flex fixed md:relative z-20`}
      >
        <Sidebar />
      </div>

      {/* Mobile overlay behind sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pass toggleSidebar to Navbar so it can control sidebar */}
        <Navbar toggleSidebar={toggleSidebar} isMobile={isMobile} />
        <main className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
