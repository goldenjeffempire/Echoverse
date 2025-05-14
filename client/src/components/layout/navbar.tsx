import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { LucideIcon, LogOutIcon } from "lucide-react";

interface MenuItem {
  label: string;
  href?: string;
  external?: boolean;
  description?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Product",
    children: [
      { label: "Overview", href: "/overview" },
      { label: "Features", href: "/features" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    label: "Learn",
    children: [
      { label: "Tutorials", href: "/tutorials" },
      { label: "Guides", href: "/guides" },
      { label: "Case Studies", href: "/case-studies" },
    ],
  },
  {
    label: "Tools",
    children: [
      { label: "CLI", href: "/cli" },
      { label: "VS Code Extension", href: "/vscode" },
    ],
  },
];

const dashboardItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

const nonDropdownItems: MenuItem[] = [
  { label: "Cart", href: "/cart" },
  { label: "Account", href: "/account" },
];

export function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    console.log("User signed out");
    closeMobileMenu();
  };

  const renderMenuItem = (item: MenuItem, index: number, isMobile = false) => {
    const isActive = location === item.href;
    const classes = `block px-4 py-2 text-sm ${isActive ? "bg-gray-100" : "text-gray-700"}`;

    if (item.external) {
      return (
        <a
          key={index}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link href={item.href || "#"} key={index} onClick={isMobile ? closeMobileMenu : undefined}>
        <span className={classes}>{item.label}</span>
      </Link>
    );
  };

  const renderDropdown = (item: MenuItem, index: number, isMobile = false) => {
    return (
      <div key={index} className="relative group">
        <button
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          aria-haspopup="true"
        >
          {item.label}
        </button>
        <div className={`absolute z-10 ${isMobile ? "block" : "hidden group-hover:block"}`}>
          <div className="py-1 bg-white shadow-lg">
            {item.children?.map((child, idx) => renderMenuItem(child, idx, isMobile))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-xl font-bold">Echoverse</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item, index) =>
                item.children ? renderDropdown(item, index) : renderMenuItem(item, index)
              )}
              {dashboardItems.map((item, index) => renderMenuItem(item, index))}
              {nonDropdownItems.map((item, index) => renderMenuItem(item, index))}
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sm:hidden"
          >
            <div className="pt-2 pb-3 space-y-1">
              {menuItems.map((item, index) =>
                item.children ? renderDropdown(item, index, true) : renderMenuItem(item, index, true)
              )}
              {dashboardItems.map((item, index) => renderMenuItem(item, index, true))}
              {nonDropdownItems.map((item, index) => renderMenuItem(item, index, true))}
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <LogOutIcon className="inline-block mr-2 w-4 h-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
