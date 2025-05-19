// src/pages/checkout.tsx

import React, { useEffect, useState } from "react";
import {
  useStripe,
  Elements,
  PaymentElement,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Check environment variable once, top-level
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}

// Initialize Stripe once here
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/work`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: 49.99, // Example amount in dollars
          description: "Echoverse Pro Subscription",
        });

        const data = await response.json();

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Error",
            description: "Failed to initialize payment",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching payment intent:", error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchPaymentIntent();
  }, [toast]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Upgrade to Echoverse Pro</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Unlock premium features to boost your productivity
          </p>
        </div>

        <div className="mb-8 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Echoverse Pro (Monthly)</span>
            <span>$49.99</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>Includes all AI modules and unlimited credits</span>
          </div>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading payment form...</span>
          </div>
        )}
      </div>
    </div>
  );
}
