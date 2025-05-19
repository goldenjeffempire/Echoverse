import { StrictMode, useEffect, useState } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AIChatWidget } from "@/components/chat/ai-chat-widget";

// Layouts & Pages
import DashboardLayout from "@/components/layout/DashboardLayout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Checkout from "@/pages/checkout";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import SettingsPage from "@/pages/settings-page";
import CheckoutPage from "@/pages/checkout-page";
import ProfilePage from "@/pages/profile-page";
import BrandingPage from "@/pages/branding-page";
import MarketplacePage from "@/pages/marketplace-page";
import CartPage from "@/pages/cart-page";
import HelpCenterPage from "@/pages/help-center-page";
import SubscriptionsPage from "@/pages/subscriptions-page";
import WorkDashboard from "@/pages/dashboard/work";
import PersonalDashboard from "@/pages/dashboard/personal";
import SchoolDashboard from "@/pages/dashboard/school";
import GeneralDashboard from "@/pages/dashboard/general";

// Features
import LessonBuilder from "@/components/education/LessonBuilder";
import ClassroomManager from "@/components/education/ClassroomManager";
import KanbanBoard from "@/components/work/KanbanBoard";
import PluginMarketplace from "@/components/developer/PluginMarketplace";
import ApiKeyManager from "@/components/developer/ApiKeyManager";
import BookingSystem from "@/components/scheduling/BookingSystem";
import { BookMarketplace } from "@/components/marketplace/BookMarketplace";
import { DomainManager } from "@/components/hosting/DomainManager";

// Custom Pages
import ModulesPage from "@/pages/modules";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

// Protected Route
const ProtectedRoute = ({ component: Component, children, ...rest }) => {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      setLocation('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return isAuthenticated ? (Component ? <Component {...rest} /> : children) : null;
};

function GlobalErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      toast({ title: "Error", description: event.reason?.message || "Unexpected error", variant: "destructive" });
    };

    const handleError = (event) => {
      toast({ title: "Error", description: event.error?.message || "Unexpected error", variant: "destructive" });
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
  return hideChatbotOnRoutes.includes(location) ? null : <AIChatWidget />;
}

export default function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/signup';

  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <Router>
                  {isAuthPage ? (
                    <Switch>
                      <Route path="/login" component={Login} />
                      <Route path="/signup" component={Signup} />
                      <Route component={NotFound} />
                    </Switch>
                  ) : (
                    <DashboardLayout>
                      <Switch>
                        <Route path="/" component={() => <ProtectedRoute component={WorkDashboard} />} />
                        <Route path="/dashboard/work" component={() => <ProtectedRoute component={WorkDashboard} />} />
                        <Route path="/dashboard/personal" component={() => <ProtectedRoute component={PersonalDashboard} />} />
                        <Route path="/dashboard/school" component={() => <ProtectedRoute component={SchoolDashboard} />} />
                        <Route path="/dashboard/general" component={() => <ProtectedRoute component={GeneralDashboard} />} />
                        <Route path="/education/lessons" component={() => <ProtectedRoute component={LessonBuilder} />} />
                        <Route path="/education/classroom" component={() => <ProtectedRoute component={ClassroomManager} />} />
                        <Route path="/work/kanban" component={() => <ProtectedRoute component={KanbanBoard} />} />
                        <Route path="/developer/plugins" component={() => <ProtectedRoute component={PluginMarketplace} />} />
                        <Route path="/developer/api-keys" component={() => <ProtectedRoute component={ApiKeyManager} />} />
                        <Route path="/scheduling/booking" component={() => <ProtectedRoute component={BookingSystem} />} />
                        <Route path="/marketplace/books" component={() => <ProtectedRoute component={BookMarketplace} />} />
                        <Route path="/hosting/domains" component={() => <ProtectedRoute component={DomainManager} />} />
                        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
                        <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
                        <Route path="/modules" component={() => <ProtectedRoute component={ModulesPage} />} />
                        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
                        <Route path="/checkout" component={() => <ProtectedRoute component={Checkout} />} />
                        <Route path="/auth" component={AuthPage} />
                        <Route path="/branding" component={BrandingPage} />
                        <Route path="/marketplace" component={MarketplacePage} />
                        <Route path="/dashboard" component={() => <ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/subscriptions" component={() => <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                        <Route path="/cart" component={() => <ProtectedRoute><CartPage /></ProtectedRoute>} />
                        <Route path="/help" component={HelpCenterPage} />
                        <Route component={NotFound} />
                      </Switch>
                    </DashboardLayout>
                  )}
                </Router>
                <Toaster />
                <GlobalErrorHandler />
                <AIChatbotWrapper />
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
