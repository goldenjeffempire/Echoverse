import { useState } from "react";
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

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const menuItems = {
    Product: [
      { name: "AI Studio", href: "/ai-studio", icon: <Code className="w-4 h-4" /> },
      { name: "Features", href: "/features", icon: <Rocket className="w-4 h-4" /> },
      { name: "Projects", href: "/projects", icon: <Box className="w-4 h-4" /> },
      { name: "Marketplace", href: "/marketplace", icon: <Store className="w-4 h-4" /> },
    ],
    Learn: [
      { name: "Courses", href: "/courses", icon: <BookOpen className="w-4 h-4" /> },
      { name: "Books", href: "/books", icon: <FileText className="w-4 h-4" /> },
      { name: "Blog", href: "/blog", icon: <FileText className="w-4 h-4" /> },
      { name: "Help Center", href: "/help", icon: <HelpCircle className="w-4 h-4" /> },
    ],
    Tools: [
      { name: "AI Tools", href: "/ai-tools", icon: <Laptop className="w-4 h-4" /> },
      { name: "CMS", href: "/cms", icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: "Branding", href: "/branding", icon: <Settings className="w-4 h-4" /> },
      { name: "Jobs", href: "/jobs", icon: <Briefcase className="w-4 h-4" /> },
    ],
  };

  const dashboardItems = user
    ? [
        { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Profile", href: "/profile", icon: <Users className="w-4 h-4" /> },
        { name: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
        { name: "My Projects", href: "/projects", icon: <Box className="w-4 h-4" /> },
      ]
    : [];

  const nonDropdownItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "Enterprise", href: "/enterprise" },
  ];

  const handleLogout = () => logoutMutation.mutate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-sm border-b border-primary/20 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + Menu */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
              <Logo />
              <span className="font-bold text-lg hidden md:inline-block text-neutral-900 dark:text-white">
                Echoverse
              </span>
            </Link>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:block">
              <NavigationMenu>
                <NavigationMenuList>
                  {Object.entries(menuItems).map(([category, items]) => (
                    <NavigationMenuItem key={category}>
                      <NavigationMenuTrigger className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400">
                        {category}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[250px] gap-2 p-4">
                          {items.map((item) => (
                            <li key={item.name}>
                              <Link href={item.href}>
                                <NavigationMenuLink
                                  className={`flex items-center gap-2 select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary-600 dark:hover:text-primary-400 ${
                                    location === item.href
                                      ? "text-primary-600 dark:text-primary-400 bg-primary/10"
                                      : "text-neutral-700 dark:text-neutral-300"
                                  }`}
                                >
                                  {item.icon}
                                  {item.name}
                                </NavigationMenuLink>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                  {nonDropdownItems.map((item) => (
                    <NavigationMenuItem key={item.name}>
                      <Link href={item.href}>
                        <NavigationMenuLink
                          className={`block select-none p-3 leading-none no-underline outline-none transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                            location === item.href
                              ? "text-primary-600 dark:text-primary-400"
                              : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {item.name}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Right side: Search + Icons + User */}
          <div className="flex items-center space-x-3">
            {/* Search (Desktop only) */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                <span className="material-icons text-sm">search</span>
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-700 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <span
                className={`material-icons ${theme === "light" ? "" : "hidden"}`}
              >
                light_mode
              </span>
              <span
                className={`material-icons ${theme === "dark" ? "" : "hidden"}`}
              >
                dark_mode
              </span>
            </button>

            {/* Notifications */}
            <button
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 relative"
              aria-label="Notifications"
            >
              <span className="material-icons">notifications</span>
              <span className="absolute top-0 right-0 h-4 w-4 bg-primary-500 text-white text-xs flex items-center justify-center rounded-full">
                3
              </span>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative hidden md:inline-block">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  2
                </span>
              </Button>
            </Link>

            {/* Profile Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="profile-menu-btn"
                    className="flex items-center space-x-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1"
                    aria-haspopup="true"
                    aria-expanded={showProfileDropdown}
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  >
                    <img
                      src={user.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                      alt="User avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="material-icons text-sm">arrow_drop_down</span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-50">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">Notifications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about">About</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">Pricing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help">Help</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="hidden md:inline-flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="default" className="hidden md:inline-flex">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white dark:bg-neutral-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-4 flex justify-between items-center border-b border-primary/20">
              <Link href="/">
                <Logo />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)]">
              {Object.entries(menuItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-neutral-900 dark:text-white font-medium px-3">{category}</h3>
                  {items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {item.icon}
                        <span className="ml-2">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              ))}

              {nonDropdownItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}

              {user ? (
                <>
                  <div className="border-t border-primary/20 pt-4 space-y-2">
                    {dashboardItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {item.icon}
                          <span className="ml-2">{item.name}</span>
                        </Button>
                      </Link>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-t border-primary/20 pt-4 space-y-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" className="w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
