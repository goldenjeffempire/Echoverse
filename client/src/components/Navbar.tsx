import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Sparkles, 
  Menu, 
  X, 
  ChevronDown,
  Globe,
  ShoppingCart,
  Puzzle,
  TrendingUp,
  BookOpen,
  Code,
  Users,
  MessageSquare,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const productItems = [
    { icon: Globe, name: "AI Website Builder", desc: "Build sites with AI", href: "/ai-builder" },
    { icon: ShoppingCart, name: "E-Commerce", desc: "Online store solution", href: "/ecommerce" },
    { icon: MessageSquare, name: "Community", desc: "Social & forums", href: "/community" },
    { icon: TrendingUp, name: "Marketing", desc: "Automation tools", href: "/marketing" },
    { icon: Puzzle, name: "Marketplace", desc: "Plugins & extensions", href: "/marketplace" },
  ];

  const resourceItems = [
    { icon: BookOpen, name: "Documentation", desc: "API & guides", href: "/documentation" },
    { icon: Code, name: "API Reference", desc: "Developer docs", href: "/api-reference" },
    { icon: Users, name: "Community", desc: "Join discussions", href: "/community" },
    { icon: Zap, name: "Templates", desc: "Get started fast", href: "/templates" },
  ];

  const DropdownMenu = ({ title, items }: { title: string; items: typeof productItems }) => {
    const isActive = activeDropdown === title;
    
    return (
      <div 
        className="relative"
        onMouseEnter={() => setActiveDropdown(title)}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {title}
          <ChevronDown className={`w-4 h-4 transition-transform ${isActive ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50"
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setLocation(item.href);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-lg' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EchoVerse
              </span>
            </motion.button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <DropdownMenu title="Product" items={productItems} />
              <button 
                onClick={() => setLocation("/about")}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Solutions
              </button>
              <DropdownMenu title="Resources" items={resourceItems} />
              <button 
                onClick={() => setLocation("/pricing")}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Pricing
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/dashboard")}
                    className="font-medium"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => setLocation("/ai-builder")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  >
                    Start Building
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/login")}
                    className="font-medium"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setLocation("/register")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-2 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      EchoVerse
                    </span>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 mb-3">PRODUCT</h3>
                      {productItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setLocation(item.href);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 mb-3">RESOURCES</h3>
                      {resourceItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setLocation(item.href);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => {
                          setLocation("/pricing");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Pricing
                      </button>
                      <button 
                        onClick={() => {
                          setLocation("/about");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        About Us
                      </button>
                    </div>
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {user ? (
                      <>
                        <Button
                          onClick={() => {
                            setLocation("/dashboard");
                            setMobileMenuOpen(false);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          Dashboard
                        </Button>
                        <Button
                          onClick={() => {
                            setLocation("/ai-builder");
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          Start Building
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setLocation("/login");
                            setMobileMenuOpen(false);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => {
                            setLocation("/register");
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          Get Started
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.nav>
      
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
