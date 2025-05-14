
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PenTool,
  MonitorSmartphone,
  Wand2,
  Store,
  Calendar,
  UtensilsCrossed,
  NotebookText,
  Image,
  Globe,
  Server,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Package,
  Users,
  BarChart,
  Mail,
  Search,
  Briefcase,
  Code,
  BookOpen,
  Sparkle,
  PencilRuler,
  Megaphone,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  User
} from "lucide-react";

interface MenuItem {
  label: string;
  description?: string;
  href?: string;
  external?: boolean;
  icon?: React.ElementType;
  children?: { heading: string; items: MenuItem[] }[];
}

const menuItems: MenuItem[] = [
  {
    label: "Product",
    children: [
      {
        heading: "CREATION",
        items: [
          {
            label: "Website Design",
            href: "/features/website-design",
            description: "Create your site with intuitive design features.",
            icon: PenTool,
          },
          {
            label: "Website Templates",
            href: "/features/templates",
            description: "Choose from 900+ website templates.",
            icon: MonitorSmartphone,
          },
          {
            label: "AI Website Builder",
            href: "/features/ai-builder",
            description: "Create your site in no time with AI.",
            icon: Wand2,
          },
        ],
      },
      {
        heading: "BUSINESS",
        items: [
          {
            label: "eCommerce",
            href: "/features/ecommerce",
            description: "Run & grow your eCommerce website.",
            icon: Store,
          },
          {
            label: "Scheduling",
            href: "/features/scheduling",
            description: "Manage appointments, staff & clients.",
            icon: Calendar,
          },
          {
            label: "Restaurant",
            href: "/features/restaurant",
            description: "Manage your menus, orders, and reservations.",
            icon: UtensilsCrossed,
          },
          {
            label: "Blog",
            href: "/features/blog",
            description: "Share ideas & grow your traffic.",
            icon: NotebookText,
          },
          {
            label: "Portfolio",
            href: "/features/portfolio",
            description: "Showcase your work with an online portfolio.",
            icon: Image,
          },
        ],
      },
      {
        heading: "ESSENTIALS",
        items: [
          {
            label: "Domain Names",
            href: "/features/domains",
            description: "Buy & register a domain for your website.",
            icon: Globe,
          },
          {
            label: "Web Hosting",
            href: "/features/hosting",
            description: "Get secure & reliable website hosting.",
            icon: Server,
          },
          {
            label: "Website Security",
            href: "/features/security",
            description: "Get enterprise-grade security for your site.",
            icon: ShieldCheck,
          },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    children: [
      {
        heading: "MANAGEMENT",
        items: [
          {
            label: "Payment Solutions",
            href: "/solutions/payments",
            description: "Accept & manage payments online.",
            icon: CreditCard,
          },
          {
            label: "Mobile App",
            href: "/solutions/mobile",
            description: "Run your business on the go from your mobile.",
            icon: Smartphone,
          },
          {
            label: "All Business Features",
            href: "/solutions/business",
            description: "Explore all business management features.",
            icon: Package,
          },
          {
            label: "CRM System",
            href: "/solutions/crm",
            description: "Build & manage customer relationships.",
            icon: Users,
          },
          {
            label: "Website Analytics",
            href: "/solutions/analytics",
            description: "Get reports with actionable data & insights.",
            icon: BarChart,
          },
        ],
      },
      {
        heading: "GROWTH",
        items: [
          {
            label: "Email Marketing",
            href: "/solutions/email",
            description: "Create email marketing campaigns.",
            icon: Mail,
          },
          {
            label: "SEO Tools",
            href: "/solutions/seo",
            description: "Optimize your website for search engines.",
            icon: Search,
          },
          {
            label: "All Marketing Features",
            href: "/solutions/marketing",
            description: "Explore all growth and marketing features.",
            icon: Megaphone,
          },
        ],
      },
      {
        heading: "ECHO STUDIO",
        items: [
          {
            label: "Agencies & Freelancers",
            href: "/studio/agencies",
            description: "Deliver exceptional client websites at scale.",
            icon: Briefcase,
          },
          {
            label: "Developers",
            href: "/studio/developers",
            description: "Build sites & apps and offer dev services.",
            icon: Code,
          },
          {
            label: "Enterprise",
            href: "/studio/enterprise",
            description: "Discover solutions for large-scale businesses.",
            icon: LayoutDashboard,
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    children: [
      {
        heading: "EXPLORE",
        items: [
          {
            label: "Echo Blog",
            href: "/resources/blog",
            description: "Read the latest industry tips and trends.",
            icon: BookOpen,
          },
          {
            label: "AI Features",
            href: "/resources/ai",
            description: "Discover all the ways to create and grow with AI.",
            icon: Sparkle,
          },
          {
            label: "Web Design Inspiration",
            href: "/resources/inspiration",
            description: "Explore designs by other Echo users.",
            icon: PencilRuler,
          },
        ],
      },
      {
        heading: "SUPPORT",
        items: [
          {
            label: "Help Center",
            href: "/support/help",
            description: "Find the answers and support you need.",
            icon: User,
          },
          {
            label: "Hire a Professional",
            href: "/support/professionals",
            description: "Get expert help with your site & business.",
            icon: Briefcase,
          },
        ],
      },
      {
        heading: "TOOLS",
        items: [
          {
            label: "Logo Maker",
            href: "/tools/logo",
            description: "Create a custom logo for your brand.",
            icon: PenTool,
          },
          {
            label: "Business Name Generator",
            href: "/tools/name-generator",
            description: "Get name ideas for your business.",
            icon: Sparkle,
          },
          {
            label: "Free Business Tools",
            href: "/tools/free",
            description: "Explore tools to help you run & grow your business.",
            icon: Package,
          },
        ],
      },
      {
        heading: "FEATURED ARTICLE",
        items: [
          {
            label: "Learn how to create a website →",
            href: "/resources/featured",
            description: "Start your journey today with Echo.",
            icon: BookOpen,
          },
        ],
      },
    ],
  },
  {
    label: "Plans & Pricing",
    href: "/pricing",
  },
];

import { privateRoutes } from "@/data/navbar-items";

const userNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Account", href: "/account", icon: User },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "My Projects", href: "/projects", icon: Package },
];

const quickAccessItems = [
  { label: "Cart", href: "/cart", icon: ShoppingCart },
  { label: "Account", href: "/account", icon: User },
];

export function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const renderMenuItem = (item: MenuItem, index: number, isMobile = false) => {
    const isActive = location === item.href;
    const Icon = item.icon;
    const classes = `flex items-center gap-2 px-4 py-2 text-sm ${
      isActive ? "bg-purple-900 text-white" : "text-gray-300 hover:text-white"
    }`;

    if (item.external) {
      return (
        <a 
          key={index} 
          href={item.href || "#"} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={classes}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {item.label}
        </a>
      );
    }

    return (
      <Link 
        key={index} 
        href={item.href || "#"} 
        onClick={isMobile ? closeMobileMenu : undefined}
        className={classes}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {item.label}
      </Link>
    );
  };

  const renderDropdown = (item: MenuItem, index: number, isMobile = false) => {
    const isOpen = openDropdown === index;

    return (
      <div
        key={index}
        className="relative"
        onMouseEnter={() => setOpenDropdown(index)}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
          {item.label}
        </button>

        <AnimatePresence>
          {isOpen && !isMobile && item.children && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-[600px] max-h-[80vh] overflow-y-auto rounded-md bg-black bg-opacity-80 backdrop-blur-md border border-gray-700 shadow-lg z-20"
            >
              <div className="p-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {item.children.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-3">
                      <h4 className="px-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                        {section.heading}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map((child, cIdx) => (
                          <Link
                            key={cIdx}
                            href={child.href || "#"}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-gray-800/50 transition-all"
                            onClick={closeMobileMenu}
                          >
                            {child.icon && (
                              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-purple-900/30 text-purple-400">
                                <child.icon className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                                {child.label}
                              </div>
                              {child.description && (
                                <div className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                                  {child.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur bg-black bg-opacity-60 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="text-white font-semibold text-lg">Echoverse</span>
            </Link>

            <div className="hidden sm:flex space-x-6 items-center">
              {menuItems.map((item, i) =>
                item.children ? renderDropdown(item, i) : renderMenuItem(item, i)
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated &&
              userNavItems.map((item, i) => renderMenuItem(item, i))}
            {!isAuthenticated && (
              <>
                <Link
                  href="/signin"
                  className="text-gray-300 hover:text-white text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-500"
                >
                  Sign Up
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white flex items-center gap-2"
              >
                <LogOutIcon className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>

          <div className="sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden px-4 py-2 space-y-1 bg-black bg-opacity-80 backdrop-blur border-t border-gray-800"
          >
            {menuItems.map((item, i) =>
              item.children
                ? item.children.flatMap((group, groupIdx) =>
                    group.items.map((child, idx) => (
                      <Link
                        key={`${group.heading}-${groupIdx}-${idx}`}
                        href={child.href || "#"}
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white"
                      >
                        {child.icon && <child.icon className="w-4 h-4" />}
                        {child.label}
                      </Link>
                    ))
                  )
                : renderMenuItem(item, i, true)
            )}

            {isAuthenticated &&
              userNavItems.map((item, i) => renderMenuItem(item, i, true))}

            {!isAuthenticated && (
              <>
                <Link
                  key="signin-mobile"
                  href="/signin"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  key="signup-mobile"
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-md"
                >
                  Sign Up
                </Link>
              </>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-gray-300 hover:text-white flex items-center gap-2 px-4 py-2"
              >
                <LogOutIcon className="w-4 h-4" /> Sign out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
