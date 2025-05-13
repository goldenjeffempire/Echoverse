import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layouts/main-layout";

// Make sure to call loadStripe outside of a component
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe public key");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/success",
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements} 
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: 1999 })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch(error => {
        toast({
          title: "Error initializing payment",
          description: error.message || "Could not initialize payment process",
          variant: "destructive",
        });
      });
  }, [toast]);

  const appearance = {
    theme: 'stripe' as const,
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>

        <div className="mb-8">
          <div className="bg-primary/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>EchoVerse Pro Subscription (Monthly)</span>
              <span>$19.99</span>
            </div>
            <div className="border-t pt-2 mt-4 flex justify-between font-semibold">
              <span>Total</span>
              <span>$19.99</span>
            </div>
          </div>
        </div>

        {clientSecret ? (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        ) : (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}