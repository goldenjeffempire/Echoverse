import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CheckoutProps {
  amount: number; // cents
  description: string;
  returnUrl: string;
}

const CheckoutForm: React.FC<{ returnUrl: string }> = ({ returnUrl }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Unknown error",
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
      <Button type="submit" disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

const CheckoutPage: React.FC<CheckoutProps> = ({ amount, description, returnUrl }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, description }),
        });
        const data = await res.json();
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else throw new Error("No client secret received");
      } catch (error: any) {
        toast({
          title: "Payment Initialization Error",
          description: error.message || "Failed to start payment process",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [amount, description, toast]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-2">Complete Your Purchase</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{description}</p>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm returnUrl={returnUrl} />
          </Elements>
        ) : (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading payment form...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
