import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen?: boolean; // Optional, for collapsible sidebar if you want
  onClose?: () => void; // Optional callback for mobile close
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" />,
  },
  {
    label: "School",
    href: "/dashboard/school",
    icon: <BookOpen className="w-5 h-5" aria-hidden="true" />,
  },
  {
    label: "Work",
    href: "/dashboard/work",
    icon: <Briefcase className="w-5 h-5" aria-hidden="true" />,
  },
  {
    label: "Personal",
    href: "/dashboard/personal",
    icon: <User className="w-5 h-5" aria-hidden="true" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" aria-hidden="true" />,
  },
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Accessibility: focus trap could be added if sidebar overlays
  // Responsive: This version assumes desktop sidebar, mobile handled separately

  return (
    <aside
      className={cn(
        "bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 h-full flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo and branding */}
      <div className="flex items-center justify-center h-16 border-b border-neutral-200 dark:border-neutral-700 px-4">
        <Link href="/" aria-label="Go to home page" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded">
          {/* Ideally your Logo component here */}
          <svg
            className="h-8 w-8 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 3v18m9-9H3" />
          </svg>
          {isOpen && <span className="font-bold text-xl text-primary-600 dark:text-primary-400 select-none">Echoverse</span>}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul role="list" className="space-y-1 px-2">
          {navItems.map(({ label, href, icon }) => (
            <li key={label}>
              <Link href={href} aria-current={location === href ? "page" : undefined}>
                <a
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                    location === href
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  )}
                >
                  {icon}
                  {isOpen && label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      {user && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center space-x-3">
          <img
            src={user.avatar ?? "/default-avatar.png"}
            alt={`${user.name ?? "User"} avatar`}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{user.name}</span>
              <button
                onClick={() => logoutMutation.mutate()}
                className="text-xs text-red-600 hover:underline focus:outline-none focus:ring-1 focus:ring-red-600"
                aria-label="Logout"
              >
                <div className="flex items-center gap-1">
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Logout</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
