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
  ShoppingCart,
  Code,
  Laptop,
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  HelpCircle,
  Briefcase,
  Store,
  Box,
  Rocket,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils"; // 🔥 FIXED: Missing import

// 🔁 Menu config moved out of component
const menuItems = {
  Product: [
    { name: "AI Studio", href: "/ai-studio", icon: <Code className="w-4 h-4" aria-hidden="true" /> },
    { name: "Features", href: "/features", icon: <Rocket className="w-4 h-4" aria-hidden="true" /> },
    { name: "Projects", href: "/projects", icon: <Box className="w-4 h-4" aria-hidden="true" /> },
    { name: "Marketplace", href: "/marketplace", icon: <Store className="w-4 h-4" aria-hidden="true" /> },
  ],
  Learn: [
    { name: "Courses", href: "/courses", icon: <BookOpen className="w-4 h-4" aria-hidden="true" /> },
    { name: "Books", href: "/books", icon: <FileText className="w-4 h-4" aria-hidden="true" /> },
    { name: "Blog", href: "/blog", icon: <Laptop className="w-4 h-4" aria-hidden="true" /> },
    { name: "Help Center", href: "/help", icon: <HelpCircle className="w-4 h-4" aria-hidden="true" /> },
  ],
  Community: [
    { name: "Team", href: "/team", icon: <Users className="w-4 h-4" aria-hidden="true" /> },
    { name: "Partners", href: "/partners", icon: <Briefcase className="w-4 h-4" aria-hidden="true" /> },
    { name: "Events", href: "/events", icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { name: "Contribute", href: "/contribute", icon: <Rocket className="w-4 h-4" aria-hidden="true" /> },
  ],
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 fixed w-full z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Link href="/" aria-label="Home">
            <a className="flex items-center space-x-2">
              <Logo className="h-8 w-auto" />
              <span className="hidden sm:inline font-bold text-lg text-neutral-900 dark:text-neutral-100 select-none">Echoverse</span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {Object.entries(menuItems).map(([category, items]) => (
              <NavigationMenu key={category}>
                <NavigationMenuTrigger aria-expanded="false">{category}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuList>
                    {items.map(({ name, href, icon }) => (
                      <NavigationMenuItem key={name}>
                        <NavigationMenuLink asChild>
                          <Link href={href}>
                            <a className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary">
                              {icon}
                              <span>{name}</span>
                            </a>
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenuContent>
              </NavigationMenu>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            variant="ghost"
            size="sm"
          >
            {theme === "light" ? (
              <span className="material-icons">dark_mode</span>
            ) : (
              <span className="material-icons">light_mode</span>
            )}
          </Button>

          {/* Desktop Auth */}
          {user ? (
            <DropdownMenu open={showProfileDropdown} onOpenChange={setShowProfileDropdown}>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User profile dropdown"
                  className="flex items-center rounded-full focus:outline-none focus:ring focus:ring-primary"
                >
                  <img
                    src={user.avatarUrl || "/default-avatar.png"}
                    alt={`${user?.name || "User"}'s avatar`}
                    className="h-8 w-8 rounded-full object-cover"
                    loading="lazy"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a>Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a>Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Link href="/login">
                <a className="px-3 py-1 rounded-md text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  Sign In
                </a>
              </Link>
              <Link href="/register">
                <a className="px-3 py-1 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">
                  Register
                </a>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <nav aria-label="Mobile Navigation" className="px-4 py-3 space-y-2">
              {Object.entries(menuItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1 select-none">
                    {category}
                  </h3>
                  <ul>
                    {items.map(({ name, href, icon }) => (
                      <li key={name}>
                        <Link href={href}>
                          <a
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary",
                              location === href ? "bg-primary-100 dark:bg-primary-900 font-semibold" : ""
                            )}
                          >
                            {icon}
                            <span>{name}</span>
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {user ? (
                <div className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <Link href="/profile">
                    <a className="block px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700">Profile</a>
                  </Link>
                  <Link href="/settings">
                    <a className="block px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</a>
                  </Link>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4 flex space-x-3">
                  <Link href="/login">
                    <a className="flex-grow px-3 py-2 text-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      Sign In
                    </a>
                  </Link>
                  <Link href="/register">
                    <a className="flex-grow px-3 py-2 text-center rounded-md bg-primary-500 text-white hover:bg-primary-600">
                      Register
                    </a>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
