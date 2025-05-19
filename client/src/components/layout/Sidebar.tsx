import { useState } from 'react';
import { useLocation, Link } from 'wouter';
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
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const NavLink = ({ href, icon, label, badge }: { href: string; icon: string; label: string; badge?: number }) => {
    const isActive = location === href;

    return (
      <SidebarNavItem>
        <Link href={href}>
          <div
            className={cn(
              "sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700",
              isActive && "active border-l-4 border-primary bg-opacity-10 dark:bg-opacity-20"
            )}
          >
            <span className={cn(
              "material-icons mr-3",
              isActive ? "text-primary-500" : "text-neutral-500"
            )}>
              {icon}
            </span>
            {!collapsed && (
              <>
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
      </SidebarNavItem>
    );
  };

  return (
    <SidebarContainer className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          {!collapsed && <span className="font-bold text-lg">Echoverse</span>}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <span className="material-icons text-neutral-500">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </SidebarHeader>

      {!collapsed && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">Alex Morgan</p>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Work Account
                </span>
                <span className="inline-block h-4 px-1.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-medium rounded">
                  Pro
                </span>
              </div>
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

      <SidebarFooter>
        <a
          href="/settings"
          className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400"
        >
          <span className="material-icons text-sm">settings</span>
          {!collapsed && <span>Settings</span>}
        </a>
      </SidebarFooter>
    </SidebarContainer>
  );
}
