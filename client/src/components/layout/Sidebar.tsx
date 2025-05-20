import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSidebar } from "./SidebarContext";
import {
  Sidebar as SidebarContainer,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarSectionTitle,
  SidebarNavList,
  SidebarNavItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label, badge }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <SidebarNavItem>
      <Link href={href} aria-current={isActive ? "page" : undefined}>
        <a
          className={cn(
            "sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-700",
            isActive && "active border-l-4 border-primary bg-opacity-10 dark:bg-opacity-20"
          )}
          tabIndex={0}
        >
          <span
            className={cn(
              "material-icons mr-3 select-none",
              isActive ? "text-primary-500" : "text-neutral-500"
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="flex-grow truncate">{label}</span>
          {badge && badge > 0 && (
            <span className="ml-auto bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full select-none">
              {badge}
            </span>
          )}
        </a>
      </Link>
    </SidebarNavItem>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  return (
    <SidebarContainer
      className={cn("transition-width duration-300 ease-in-out", collapsed ? "w-16" : "w-64")}
      aria-expanded={!collapsed}
    >
      <SidebarHeader className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <div
            className="h-8 w-8 rounded-md bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg select-none"
            aria-label="Echoverse logo"
          >
            E
          </div>
          {!collapsed && <span className="font-bold text-lg select-none">Echoverse</span>}
        </div>
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary"
        >
          <span className="material-icons text-neutral-500 select-none">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </SidebarHeader>

      {!collapsed && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center space-x-3">
          <img
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
            alt="User avatar"
            className="h-10 w-10 rounded-full object-cover select-none"
            loading="lazy"
          />
          <div className="flex flex-col leading-tight overflow-hidden">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate select-text">Alex Morgan</p>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 select-text">Work Account</span>
              <span className="inline-block h-4 px-1.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-medium rounded select-text">
                Pro
              </span>
            </div>
          </div>
        </div>
      )}

      <SidebarContent>
        <SidebarSection>
          <SidebarSectionTitle>Main</SidebarSectionTitle>
          <SidebarNavList>
            <NavLink href="/dashboard/work" icon="dashboard" label="Dashboard" />
            <NavLink href="/explore" icon="explore" label="Explore" />
            <NavLink href="/notifications" icon="notifications" label="Notifications" badge={3} />
          </SidebarNavList>
        </SidebarSection>

        <SidebarSection className="mt-2">
          <SidebarSectionTitle>AI Modules</SidebarSectionTitle>
          <SidebarNavList>
            <NavLink href="/echochat" icon="chat" label="EchoChat" />
            <NavLink href="/echobuilder" icon="precision_manufacturing" label="EchoBuilder" />
            <NavLink href="/echolibrary" icon="auto_stories" label="EchoLibrary" />
            <NavLink href="/echoseller" icon="shopping_bag" label="EchoSeller" />
          </SidebarNavList>
        </SidebarSection>

        <SidebarSection className="mt-2">
          <SidebarSectionTitle>Workspace</SidebarSectionTitle>
          <SidebarNavList>
            <NavLink href="/team" icon="people" label="Team" />
            <NavLink href="/projects" icon="folder" label="Projects" />
            <NavLink href="/calendar" icon="calendar_month" label="Calendar" />
          </SidebarNavList>
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
        <Link
          href="/settings"
          className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 select-none"
          aria-label="Settings"
        >
          <span className="material-icons text-sm" aria-hidden="true">
            settings
          </span>
          {!collapsed && <span>Settings</span>}
        </Link>
      </SidebarFooter>
    </SidebarContainer>
  );
}
