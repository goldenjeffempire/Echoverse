import React, { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProviderCustom as ToastProvider } from "@/hooks/use-toast"; // Custom provider
import { Toaster } from "@/components/ui/toaster"; // Toast UI component
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { AIChatWidget } from "@/components/chat/ai-chat-widget";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Lazy-loaded pages
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Unauthorized = lazy(() => import("@/pages/unauthorized"));

const HomePage = lazy(() => import("@/pages/home-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const BrandingPage = lazy(() => import("@/pages/branding-page"));
const MarketplacePage = lazy(() => import("@/pages/marketplace-page"));
const CartPage = lazy(() => import("@/pages/cart-page"));
const HelpCenterPage = lazy(() => import("@/pages/help-center-page"));
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions-page"));
const Notifications = lazy(() => import("@/pages/notifications"));
const ModulesPage = lazy(() => import("@/pages/modules"));

// Dashboards
const GeneralDashboard = lazy(() => import("@/pages/dashboard/general"));
const PersonalDashboard = lazy(() => import("@/pages/dashboard/personal"));
const SchoolDashboard = lazy(() => import("@/pages/dashboard/school"));
const WorkDashboard = lazy(() => import("@/pages/dashboard/work"));

// Features
const LessonBuilder = lazy(() => import("@/components/education/LessonBuilder"));
const ClassroomManager = lazy(() => import("@/components/education/ClassroomManager"));
const KanbanBoard = lazy(() => import("@/components/work/KanbanBoard"));
const PluginMarketplace = lazy(() => import("@/components/developer/PluginMarketplace"));
const ApiKeyManager = lazy(() => import("@/components/developer/ApiKeyManager"));
const BookingSystem = lazy(() => import("@/components/scheduling/BookingSystem"));
const BookMarketplace = lazy(() => import("@/components/marketplace/BookMarketplace"));
const DomainManager = lazy(() => import("@/components/hosting/DomainManager"));

// Role-protected route
interface RoleProtectedRouteProps {
  component: React.ComponentType<any>;
  rolesAllowed: string[];
  [key: string]: any;
}

const RoleProtectedRoute = ({ component: Component, rolesAllowed, ...rest }: RoleProtectedRouteProps) => {
  const [, setLocation] = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setLocation("/login");
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(userStr);
        if (!Array.isArray(user.roles)) throw new Error();
        const hasRole = user.roles.some((role: string) => rolesAllowed.includes(role));
        setAuthorized(hasRole);
        setLocation(hasRole ? undefined : "/unauthorized");
      } catch {
        setLocation("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndRole();
  }, [rolesAllowed, setLocation]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return authorized ? <Component {...rest} /> : null;
};

// Global error toasts
import { useToast } from "@/hooks/use-toast";
function GlobalErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      toast({
        title: "Unhandled Error",
        description: e.reason?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    };

    const onError = (e: ErrorEvent) => {
      toast({
        title: "Runtime Error",
        description: e.error?.message ?? "An error occurred.",
        variant: "destructive",
      });
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, [toast]);

  return null;
}

// Conditional AI Chatbot
function AIChatbotWrapper() {
  const [location] = useLocation();
  const hideOn = ["/login", "/signup", "/unauthorized", "/not-found"];
  return hideOn.includes(location) ? null : <AIChatWidget />;
}

export default function App() {
  const [location] = useLocation();
  const isAuthPage = ["/login", "/signup"].includes(location);

  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <TooltipProvider>
                  <SidebarProvider>
                    <Router>
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center min-h-screen">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                          </div>
                        }
                      >
                        {isAuthPage ? (
                          <Switch>
                            <Route path="/login" component={Login} />
                            <Route path="/signup" component={Signup} />
                            <Route component={NotFound} />
                          </Switch>
                        ) : (
                          <DashboardLayout>
                            <Switch>
                              {/* Dashboards */}
                              <Route
                                path="/"
                                component={() => (
                                  <RoleProtectedRoute component={WorkDashboard} rolesAllowed={["user", "admin"]} />
                                )}
                                exact
                              />
                              <Route
                                path="/dashboard/general"
                                component={() => (
                                  <RoleProtectedRoute component={GeneralDashboard} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/dashboard/school"
                                component={() => (
                                  <RoleProtectedRoute component={SchoolDashboard} rolesAllowed={["teacher", "admin"]} />
                                )}
                              />
                              <Route
                                path="/dashboard/work"
                                component={() => (
                                  <RoleProtectedRoute component={WorkDashboard} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/dashboard/personal"
                                component={() => (
                                  <RoleProtectedRoute component={PersonalDashboard} rolesAllowed={["user", "admin"]} />
                                )}
                              />

                              {/* Features */}
                              <Route
                                path="/education/lessons"
                                component={() => (
                                  <RoleProtectedRoute component={LessonBuilder} rolesAllowed={["teacher", "admin"]} />
                                )}
                              />
                              <Route
                                path="/education/classroom"
                                component={() => (
                                  <RoleProtectedRoute component={ClassroomManager} rolesAllowed={["teacher", "admin"]} />
                                )}
                              />
                              <Route
                                path="/work/kanban"
                                component={() => (
                                  <RoleProtectedRoute component={KanbanBoard} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/developer/plugins"
                                component={() => (
                                  <RoleProtectedRoute component={PluginMarketplace} rolesAllowed={["developer", "admin"]} />
                                )}
                              />
                              <Route
                                path="/developer/api-keys"
                                component={() => (
                                  <RoleProtectedRoute component={ApiKeyManager} rolesAllowed={["developer", "admin"]} />
                                )}
                              />
                              <Route
                                path="/scheduling/booking"
                                component={() => (
                                  <RoleProtectedRoute component={BookingSystem} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/marketplace/books"
                                component={() => (
                                  <RoleProtectedRoute component={BookMarketplace} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/hosting/domains"
                                component={() => (
                                  <RoleProtectedRoute component={DomainManager} rolesAllowed={["admin"]} />
                                )}
                              />

                              {/* Pages */}
                              <Route
                                path="/marketplace"
                                component={() => (
                                  <RoleProtectedRoute component={MarketplacePage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/checkout"
                                component={() => (
                                  <RoleProtectedRoute component={CheckoutPage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/profile"
                                component={() => (
                                  <RoleProtectedRoute component={ProfilePage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/branding"
                                component={() => (
                                  <RoleProtectedRoute component={BrandingPage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/cart"
                                component={() => (
                                  <RoleProtectedRoute component={CartPage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/help"
                                component={() => (
                                  <RoleProtectedRoute component={HelpCenterPage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/subscriptions"
                                component={() => (
                                  <RoleProtectedRoute component={SubscriptionsPage} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/notifications"
                                component={() => (
                                  <RoleProtectedRoute component={Notifications} rolesAllowed={["user", "admin"]} />
                                )}
                              />
                              <Route
                                path="/modules"
                                component={() => (
                                  <RoleProtectedRoute component={ModulesPage} rolesAllowed={["admin"]} />
                                )}
                              />

                              {/* Utility Pages */}
                              <Route path="/unauthorized" component={Unauthorized} />
                              <Route path="*" component={NotFound} />
                            </Switch>
                          </DashboardLayout>
                        )}
                      </Suspense>
                    </Router>
                    <AIChatbotWrapper />
                    <GlobalErrorHandler />
                    <Toaster />
                  </SidebarProvider>
                </TooltipProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
