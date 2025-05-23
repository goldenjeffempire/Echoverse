// client/src/pages/subscriptions-page.tsx

import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number; // in cents
  yearlyPrice: number;  // in cents
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  isFree?: boolean;
}

export default function SubscriptionPage() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    data: plans,
    isLoading,
    isError,
    error,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      if (!res.ok) throw new Error("Failed to fetch subscription plans");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="container py-12 text-center text-red-600">
          Failed to load subscription plans: {(error as Error)?.message ?? "Unknown error"}
        </div>
      </MainLayout>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price / 100);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (plan.isFree) {
      toast({
        title: "Free Plan Active",
        description: "You are now on the free plan",
      });
      return;
    }

    setSelectedPlan(plan.id);
    setLocation(`/checkout?plan=${plan.id}&interval=${billingInterval}`);
  };

  // Determine current plan by comparing user's subscriptionTier to plan name
  const currentPlanName = user?.subscriptionTier;
  const isCurrentPlan = (plan: SubscriptionPlan) => {
    if (!currentPlanName) {
      // If user has no subscriptionTier, consider free plan active if it exists
      return plan.isFree === true;
    }
    return currentPlanName === plan.name;
  };

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock the full potential of Echoverse with our premium plans
          </p>

          <div className="flex justify-center mt-6">
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={billingInterval === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingInterval("month")}
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === "year" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingInterval("year")}
              >
                Yearly
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                >
                  Save 15%
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col ${
                plan.id === 2 ? "border-primary shadow-lg" : ""
              }`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    {formatPrice(
                      billingInterval === "month"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice
                    )}
                    <span className="text-sm text-gray-500 font-normal">
                      /{billingInterval}
                    </span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={
                    plan.id === 2
                      ? "default"
                      : plan.isFree
                      ? "outline"
                      : "secondary"
                  }
                  className="w-full"
                  disabled={isCurrentPlan(plan) || selectedPlan === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrentPlan(plan) ? (
                    "Current Plan"
                  ) : selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
