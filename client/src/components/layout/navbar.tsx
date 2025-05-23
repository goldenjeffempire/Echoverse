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
  Laptop,
  BookOpen,
  LayoutDashboard,
  HelpCircle,
  Users,
  Briefcase,
  Store,
  Box,
  Rocket,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

// Menu config
const menuItems = {
  Product: [
    { name: "AI Studio", href: "/ai-studio", icon: <Code className="w-4 h-4" aria-hidden="true" /> },
    { name: "Features", href: "/features", icon: <Rocket className="w-4 h-4" aria-hidden="true" /> },
    { name: "Projects", href: "/projects", icon: <Box className="w-4 h-4" aria-hidden="true" /> },
    { name: "Marketplace", href: "/marketplace", icon: <Store className="w-4 h-4" aria-hidden="true" /> },
  ],
  Learn: [
    { name: "Courses", href: "/courses", icon: <BookOpen className="w-4 h-4" aria-hidden="true" /> },
    { name: "Books", href: "/books", icon: <Laptop className="w-4 h-4" aria-hidden="true" /> },
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

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary">
              <Logo className="h-8 w-auto" />
              <span className="font-bold text-xl text-primary-600 dark:text-primary-400 select-none">Echoverse</span>
            </a>
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

        {/* Desktop right controls */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring focus:ring-primary"
                  aria-haspopup="true"
                  aria-expanded={showProfileDropdown}
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                >
                  <img
                    src={user.avatar ?? "/default-avatar.png"}
                    alt={`${user.name}'s avatar`}
                    className="w-8 h-8 rounded-full object-cover"
                    loading="lazy"
                  />
                  <span className="sr-only">User menu</span>
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
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-left px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-700 text-red-600"
                  >
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <a className="text-sm font-medium text-primary-600 hover:underline">Login</a>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring focus:ring-primary"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <nav className="px-4 py-2 space-y-1">
              {Object.entries(menuItems).map(([category, items]) => (
                <details key={category} className="group">
                  <summary className="cursor-pointer py-2 font-semibold text-neutral-700 dark:text-neutral-300 select-none flex justify-between items-center">
                    {category}
                    <span className="material-icons group-open:rotate-180 transition-transform duration-200">expand_more</span>
                  </summary>
                  <ul className="pl-4 space-y-1">
                    {items.map(({ name, href }) => (
                      <li key={name}>
                        <Link href={href}>
                          <a
                            className={cn(
                              "block rounded px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700",
                              location === href ? "bg-primary-100 dark:bg-primary-900 font-semibold" : ""
                            )}
                          >
                            {name}
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}

              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
                {user ? (
                  <>
                    <Link href="/profile">
                      <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Profile</a>
                    </Link>
                    <Link href="/settings">
                      <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</a>
                    </Link>
                    <button
                      onClick={() => logoutMutation.mutate()}
                      className="w-full text-left px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-700 text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <a className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">Login</a>
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
