import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Link } from "react-router-dom"; // <-- react-router-dom Link
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

export default function TopNavBar() {
  const { theme, setTheme } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            id="mobile-menu-btn"
            className="md:hidden p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label="Toggle mobile menu"
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="md:hidden flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="font-bold text-lg">Echoverse</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
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

          {/* Profile Menu */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button id="profile-menu-btn" className="flex items-center space-x-1">
                  <img
                    src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
                    alt="User avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="material-icons text-sm">arrow_drop_down</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-50">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pricing">Pricing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help">Help</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {/* Handle sign out logic separately */}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
