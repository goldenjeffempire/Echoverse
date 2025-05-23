import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  X,
  Menu,
  Code,
  Briefcase,
  BookOpen,
  LayoutDashboard,
  HelpCircle,
  Users,
  DollarSign,
  Server,
  FileText,
  Globe,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

// Menu config with endpoints and hrefs
const menuItems = {
  Product: [
    { name: "AI Studio", href: "/ai-studio", icon: <Code className="w-4 h-4" aria-hidden="true" /> },
    { name: "Pricing", href: "/pricing", icon: <DollarSign className="w-4 h-4" aria-hidden="true" /> },
    { name: "Enterprise", href: "/enterprise", icon: <Briefcase className="w-4 h-4" aria-hidden="true" /> },
  ],
  Solution: [
    { name: "Use Cases", href: "/solution/use-cases", icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { name: "Integrations", href: "/solution/integrations", icon: <Server className="w-4 h-4" aria-hidden="true" /> },
    { name: "API Docs", href: "/solution/api-docs", icon: <FileText className="w-4 h-4" aria-hidden="true" /> },
  ],
  Resources: [
    { name: "Blog", href: "/resources/blog", icon: <BookOpen className="w-4 h-4" aria-hidden="true" /> },
    { name: "Help Center", href: "/resources/help", icon: <HelpCircle className="w-4 h-4" aria-hidden="true" /> },
    { name: "Community", href: "/resources/community", icon: <Users className="w-4 h-4" aria-hidden="true" /> },
    { name: "Events", href: "/resources/events", icon: <Globe className="w-4 h-4" aria-hidden="true" /> },
  ],
  Pricing: [
    { name: "Plans", href: "/pricing/plans", icon: <DollarSign className="w-4 h-4" aria-hidden="true" /> },
    { name: "Billing FAQ", href: "/pricing/faq", icon: <HelpCircle className="w-4 h-4" aria-hidden="true" /> },
  ],
  "AI Studio": [
    { name: "Dashboard", href: "/ai-studio/dashboard", icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { name: "Projects", href: "/ai-studio/projects", icon: <Briefcase className="w-4 h-4" aria-hidden="true" /> },
    { name: "Marketplace", href: "/ai-studio/marketplace", icon: <Server className="w-4 h-4" aria-hidden="true" /> },
  ],
  Enterprise: [
    { name: "Overview", href: "/enterprise/overview", icon: <Briefcase className="w-4 h-4" aria-hidden="true" /> },
    { name: "Custom Solutions", href: "/enterprise/custom-solutions", icon: <Code className="w-4 h-4" aria-hidden="true" /> },
    { name: "Contact Sales", href: "/enterprise/contact", icon: <DollarSign className="w-4 h-4" aria-hidden="true" /> },
  ],
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left - Logo + Desktop Menu */}
        <div className="flex items-center space-x-4">
          <Link href="/" aria-label="Go to home page" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary">
            <Logo className="h-8 w-auto" />
            <span className="font-bold text-xl text-primary-600 dark:text-primary-400 select-none">Echoverse</span>
          </Link>

          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-4">
                {Object.entries(menuItems).map(([category, items]) => (
                  <NavigationMenuItem key={category}>
                    <NavigationMenuTrigger>{category}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid grid-cols-1 gap-3 p-4 max-w-sm">
                        {items.map(({ name, href, icon }) => (
                          <li key={name}>
                            <NavigationMenuLink asChild>
                              <Link href={href}>
                                <a
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary",
                                    location === href ? "bg-primary-100 dark:bg-primary-900" : ""
                                  )}
                                >
                                  {icon}
                                  <span>{name}</span>
                                </a>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right - Desktop Controls */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring focus:ring-primary"
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <img
                    src={user.avatar ?? "/default-avatar.png"}
                    alt={`${user.name ?? "User"}'s avatar`}
                    className="w-8 h-8 rounded-full object-cover"
                    loading="lazy"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48 p-2">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-left px-3 py-2 rounded hover:bg-red-600 hover:text-white"
                  >
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="text-primary-600 hover:underline focus:outline-none focus:ring focus:ring-primary">
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="p-2 rounded-md focus:outline-none focus:ring focus:ring-primary"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700"
          >
            <nav className="px-4 py-4 space-y-2">
              {Object.entries(menuItems).map(([category, items]) => (
                <div key={category}>
                  <p className="text-sm font-semibold mb-1">{category}</p>
                  <ul className="space-y-1">
                    {items.map(({ name, href }) => (
                      <li key={name}>
                        <Link href={href}>
                          <a
                            className={cn(
                              "block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700",
                              location === href ? "bg-primary-100 dark:bg-primary-900" : ""
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {name}
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 w-full px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="w-5 h-5" aria-hidden="true" />
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-5 h-5" aria-hidden="true" />
                      <span>Light Mode</span>
                    </>
                  )}
                </button>

                {user ? (
                  <>
                    <Link href="/profile">
                      <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Profile</a>
                    </Link>
                    <Link href="/settings">
                      <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</a>
                    </Link>
                    <button
                      onClick={() => {
                        logoutMutation.mutate();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-red-600 hover:text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="block px-3 py-2 rounded hover:bg-primary-100 dark:hover:bg-primary-900">
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
