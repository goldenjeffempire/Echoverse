import { StrictMode } from "react";
import { Router, Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AIChatWidget } from "@/components/chat/ai-chat-widget";

// Pages
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import DashboardPage from "./pages/dashboard-page";
import SettingsPage from "./pages/settings-page";
import NotFound from "./pages/not-found";
import CheckoutPage from "@/pages/checkout-page";
import ProfilePage from "@/pages/profile-page";
import BrandingPage from "@/pages/branding-page";
import MarketplacePage from "@/pages/marketplace-page";
import CartPage from "@/pages/cart-page";
import HelpCenterPage from "@/pages/help-center-page";
import SubscriptionsPage from "@/pages/subscriptions-page";

// Protected route wrapper
import { ProtectedRoute } from "./lib/protected-route";

function GlobalErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error('Error:', error);
    toast({
      title: "Error",
      description: errorMessage || "An unexpected error occurred",
      variant: "destructive",
      duration: 5000,
    });
  };

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);

      toast({
        title: "Error",
        description: event.reason?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Error:', event.error);
      toast({
        title: "Error",
        description: event.error?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [toast]);

  return null;
}

function AIChatbotWrapper() {
  const [location] = useLocation();
  const hideChatbotOnRoutes = ["/auth"];

  if (hideChatbotOnRoutes.includes(location)) {
    return null;
  }

  return <AIChatWidget />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <TooltipProvider>
                <Router>
                  <Switch>
                    <Route path="/" component={HomePage} />
                    <Route path="/auth" component={AuthPage} />
                    <Route path="/branding" component={BrandingPage} />
                    <Route path="/marketplace" component={MarketplacePage} />
                    <Route path="/dashboard">
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/subscriptions">
                      <ProtectedRoute>
                        <SubscriptionsPage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/checkout">
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/cart">
                      <ProtectedRoute>
                        <CartPage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/settings">
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/profile">
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    </Route>
                    <Route path="/help" component={HelpCenterPage} />
                    <Route component={NotFound} />
                  </Switch>
                </Router>
                <Toaster />
                <GlobalErrorHandler />
                <AIChatbotWrapper />
              </TooltipProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}