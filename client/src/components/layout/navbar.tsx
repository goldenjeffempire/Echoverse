
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { X, Menu, ChevronDown, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const menuItems = {
    Product: [
      { name: "AI Studio", href: "/ai-studio" },
      { name: "Features", href: "/features" },
      { name: "Projects", href: "/projects" },
      { name: "Marketplace", href: "/marketplace" }
    ],
    Solutions: [
      { name: "Content Generation", href: "/ai-tools" },
      { name: "Learning Hub", href: "/learning" },
      { name: "CMS", href: "/cms" },
      { name: "E-commerce", href: "/marketplace" }
    ],
    Resources: [
      { name: "Help Center", href: "/help" },
      { name: "Documentation", href: "/docs" },
      { name: "Blog", href: "/blog" },
      { name: "Courses", href: "/courses" },
      { name: "Books", href: "/books" }
    ]
  };

  const nonDropdownItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "Enterprise", href: "/enterprise" }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-base/80 backdrop-blur-lg border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Logo />
            </Link>
            <div className="hidden md:block ml-10">
              <NavigationMenu>
                <NavigationMenuList>
                  {Object.entries(menuItems).map(([category, items]) => (
                    <NavigationMenuItem key={category}>
                      <NavigationMenuTrigger className="text-light-base/70 hover:text-white">
                        {category}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-2 p-4">
                          {items.map((item) => (
                            <li key={item.name}>
                              <Link href={item.href}>
                                <NavigationMenuLink
                                  className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 hover:text-white ${
                                    location === item.href
                                      ? "text-white"
                                      : "text-light-base/70"
                                  }`}
                                >
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
                          className={`block select-none p-3 leading-none no-underline outline-none transition-colors hover:text-white ${
                            location === item.href
                              ? "text-white"
                              : "text-light-base/70"
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
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5 text-light-base" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">2</span>
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} variant="default">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button variant="default">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-dark-base"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-4 flex justify-between items-center border-b border-primary/20">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(menuItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-white font-medium px-3">{category}</h3>
                  {items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-light-base/70 hover:text-white"
                      >
                        {item.name}
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
                    className="w-full justify-start text-light-base/70 hover:text-white"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
            <div className="p-4 border-t border-primary/20 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="default" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
