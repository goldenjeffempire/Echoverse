import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import MobileMenu from "@/components/mobile-menu";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import {
  PenTool, MonitorSmartphone, Wand2, Store, Calendar, UtensilsCrossed,
  NotebookText, Image, Globe, Server, ShieldCheck, CreditCard, Smartphone,
  Package, Users, BarChart, Mail, Search, Briefcase, Code, BookOpen,
  Sparkle, PencilRuler, Megaphone, LayoutDashboard, Settings, ShoppingCart,
  User, ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const menuItems = [
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
    ],
  },
  {
    label: "Plans & Pricing",
    href: "/pricing",
  },
];

const userNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Account", href: "/account", icon: User },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "My Projects", href: "/projects", icon: Package },
];

const quickAccessItems = [
  { label: "Cart", href: "/cart", icon: ShoppingCart, badge: 3 },
  { label: "Account", href: "/account", icon: User },
];

export function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const renderMenuItem = (item: typeof menuItems[0], index: number, isMobile = false) => {
    const isActive = location === item.href;
    const Icon = item.icon;
    const classes = `flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 ${
      isActive 
        ? "bg-purple-900/30 text-white rounded-md" 
        : "text-gray-300 hover:text-white hover:bg-purple-900/20 rounded-md"
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

  const renderDropdown = (item: typeof menuItems[0], index: number) => {
    const isOpen = openDropdown === index;

    return (
      <motion.div
        key={index}
        className="relative"
        onMouseEnter={() => setOpenDropdown(index)}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200">
          {item.label}
          <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && item.children && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-[600px] max-h-[80vh] overflow-y-auto rounded-md bg-black border border-gray-800/50 shadow-lg shadow-black/20 z-20"
            >
              <div className="p-5 bg-black">
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
                            className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-purple-900/20 transition-all duration-200"
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
      </motion.div>
    );
  };

  return (
    <motion.header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-black border-b border-gray-800/50 shadow-lg shadow-black/20" 
          : "bg-black"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            {menuItems.map((item, index) => (
              item.children ? renderDropdown(item, index) : renderMenuItem(item, index)
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {!isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="px-4 py-2 rounded-md text-sm font-medium bg-purple-700 hover:bg-purple-600 text-white transition-all transform hover:scale-105">
                    Get Started
                  </Link>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative flex items-center space-x-2 p-1.5 rounded-md hover:bg-purple-900/20 focus:outline-none">
                      <UserAvatar user={user} />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-white">{user?.username}</span>
                        <span className="text-xs text-purple-400">Premium Plan</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-black/95 border border-purple-900/30 shadow-lg shadow-purple-900/20">
                    <DropdownMenuLabel className="text-xs text-purple-400">
                      Manage Account
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {userNavItems.map((item, index) => (
                        <DropdownMenuItem key={index} asChild>
                          <Link href={item.href} className="flex items-center cursor-pointer">
                            {item.icon && <item.icon className="w-4 h-4 mr-2 text-purple-400" />}
                            <span className="text-gray-300 hover:text-white">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-purple-900/30" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer text-red-400 hover:text-red-300">
                      <LogOutIcon className="w-4 h-4 mr-2" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu} 
        menuItems={menuItems}
        userNavItems={userNavItems}
        quickAccessItems={quickAccessItems}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </motion.header>
  );
}
