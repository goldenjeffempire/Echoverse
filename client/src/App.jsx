import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { WebSocketErrorBoundary } from "@/components/WebSocketErrorBoundary";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AIChatbot } from "@/components/ai-chatbot";
import { csrfManager } from "@/lib/csrf-manager";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";
import OrdersPage from "@/pages/orders";
import ProductsPage from "@/pages/products";
import CheckoutPage from "@/pages/checkout";
import SearchPage from "@/pages/search";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import DashboardPage from "@/pages/dashboard";
import AIBuilderPage from "@/pages/ai-builder";
import WebsiteBuilder from "@/pages/website-builder";
import EcommercePage from "@/pages/ecommerce";
import CmsPage from "@/pages/cms";
import CommunityPage from "@/pages/community";
import MarketingPage from "@/pages/marketing";
import MarketplacePage from "@/pages/marketplace";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
/**
 * CSRF Bootstrap Hook with Atomic Initialization
 *
 * Uses the centralized CSRF manager to:
 * - Prevent race conditions with promise-based locking
 * - Implement atomic initialization
 * - Provide proper error recovery
 * - Handle retry logic with exponential backoff
 *
 * @returns {object} - Object with csrfReady and csrfError states
 */
function useCSRFBootstrap() {
    const [csrfReady, setCSRFReady] = React.useState(false);
    const [csrfError, setCSRFError] = React.useState(null);
    useEffect(() => {
        let mounted = true;
        async function initializeCSRF() {
            try {
                const success = await csrfManager.initialize();
                if (!mounted)
                    return;
                if (success) {
                    setCSRFReady(true);
                    setCSRFError(null);
                }
                else {
                    setCSRFError('Failed to initialize CSRF protection. Please refresh the page.');
                }
            }
            catch (error) {
                console.error('[CSRF] Bootstrap initialization failed:', error);
                if (mounted) {
                    setCSRFError('Failed to initialize CSRF protection. Please refresh the page.');
                }
            }
        }
        initializeCSRF();
        return () => {
            mounted = false;
        };
    }, []);
    return { csrfReady, csrfError };
}
function Router() {
    return (<Switch>
      <Route path="/">
        {() => (<RouteErrorBoundary routeName="Home">
            <HomePage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/login">
        {() => (<RouteErrorBoundary routeName="Login">
            <LoginPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/register">
        {() => (<RouteErrorBoundary routeName="Register">
            <RegisterPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/reset-password">
        {() => (<RouteErrorBoundary routeName="Reset Password">
            <ResetPasswordPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/dashboard">
        {() => (<RouteErrorBoundary routeName="Dashboard">
            <DashboardPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/ai-builder">
        {() => (<RouteErrorBoundary routeName="AI Builder">
            <AIBuilderPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/builder">
        {() => (<RouteErrorBoundary routeName="Website Builder">
            <WebsiteBuilder />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/ecommerce">
        {() => (<RouteErrorBoundary routeName="E-Commerce">
            <EcommercePage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/cms">
        {() => (<RouteErrorBoundary routeName="CMS">
            <CmsPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/community">
        {() => (<RouteErrorBoundary routeName="Community">
            <CommunityPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/marketing">
        {() => (<RouteErrorBoundary routeName="Marketing">
            <MarketingPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/marketplace">
        {() => (<RouteErrorBoundary routeName="Marketplace">
            <MarketplacePage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/users">
        {() => (<RouteErrorBoundary routeName="Users">
            <UsersPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/settings">
        {() => (<RouteErrorBoundary routeName="Settings">
            <SettingsPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/profile">
        {() => (<RouteErrorBoundary routeName="Profile">
            <ProfilePage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/orders">
        {() => (<RouteErrorBoundary routeName="Orders">
            <OrdersPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/products">
        {() => (<RouteErrorBoundary routeName="Products">
            <ProductsPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/checkout">
        {() => (<RouteErrorBoundary routeName="Checkout">
            <CheckoutPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/search">
        {() => (<RouteErrorBoundary routeName="Search">
            <SearchPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/terms">
        {() => (<RouteErrorBoundary routeName="Terms of Service">
            <TermsPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route path="/privacy">
        {() => (<RouteErrorBoundary routeName="Privacy Policy">
            <PrivacyPage />
          </RouteErrorBoundary>)}
      </Route>
      <Route component={NotFound}/>
    </Switch>);
}
function AppContent() {
    const [location] = useLocation();
    const isFullPageRoute = ['/', '/login', '/register', '/reset-password', '/terms', '/privacy'].includes(location);
    const style = {
        "--sidebar-width": "20rem",
        "--sidebar-width-icon": "4rem",
    };
    if (isFullPageRoute) {
        return <Router />;
    }
    return (<SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle"/>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>);
}
function App() {
    // Bootstrap CSRF token verification on app mount and wait for ready
    const { csrfReady, csrfError } = useCSRFBootstrap();
    // Show loading state while CSRF initializes
    if (!csrfReady && !csrfError) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing security...</p>
        </div>
      </div>);
    }
    // Show error state if CSRF failed
    if (csrfError) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Security Initialization Failed</h2>
          <p className="text-muted-foreground mb-4">{csrfError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Reload Page
          </button>
        </div>
      </div>);
    }
    return (<ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WebSocketErrorBoundary>
          <AuthProvider>
            <WebSocketProvider>
              <TooltipProvider>
                <ThemeProvider defaultTheme="light" storageKey="echoverse-ui-theme">
                  <AppContent />
                  <AIChatbot />
                  <Toaster />
                </ThemeProvider>
              </TooltipProvider>
            </WebSocketProvider>
          </AuthProvider>
        </WebSocketErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>);
}
export default App;
