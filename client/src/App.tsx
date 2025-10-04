import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
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

// Verify CSRF token cookie on app load
// Note: The XSRF-TOKEN cookie is already set by server middleware on initial page load.
// This hook verifies it exists and fetches it explicitly only if missing.
function useCSRFBootstrap() {
  useEffect(() => {
    const getCsrfCookie = () => {
      const cookies = document.cookie.split(';');
      return cookies.some(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
    };

    // Only fetch if cookie is missing (e.g., expired session)
    if (!getCsrfCookie()) {
      fetch('/api/csrf-token', { credentials: 'include' })
        .then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[CSRF] Token fetched and cookie set');
          }
        })
        .catch(err => console.error('[CSRF] Bootstrap failed:', err));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Token already present from initial page load');
    }
  }, []);
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <RouteErrorBoundary routeName="Home">
            <HomePage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <RouteErrorBoundary routeName="Dashboard">
            <DashboardPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/ai-builder">
        {() => (
          <RouteErrorBoundary routeName="AI Builder">
            <AIBuilderPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/builder">
        {() => (
          <RouteErrorBoundary routeName="Website Builder">
            <WebsiteBuilder />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/ecommerce">
        {() => (
          <RouteErrorBoundary routeName="E-Commerce">
            <EcommercePage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/cms">
        {() => (
          <RouteErrorBoundary routeName="CMS">
            <CmsPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/community">
        {() => (
          <RouteErrorBoundary routeName="Community">
            <CommunityPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/marketing">
        {() => (
          <RouteErrorBoundary routeName="Marketing">
            <MarketingPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/marketplace">
        {() => (
          <RouteErrorBoundary routeName="Marketplace">
            <MarketplacePage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/users">
        {() => (
          <RouteErrorBoundary routeName="Users">
            <UsersPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <RouteErrorBoundary routeName="Settings">
            <SettingsPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLandingPage) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  // Bootstrap CSRF token verification on app mount
  useCSRFBootstrap();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WebSocketErrorBoundary>
          <AuthProvider>
            <WebSocketProvider>
              <TooltipProvider>
                <ThemeProvider defaultTheme="light" storageKey="echoverse-ui-theme">
                  <AppContent />
                  <Toaster />
                </ThemeProvider>
              </TooltipProvider>
            </WebSocketProvider>
          </AuthProvider>
        </WebSocketErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
