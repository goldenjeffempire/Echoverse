import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message || 'An error occurred while processing your payment.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful!',
          description: 'Thank you for your purchase. You now have access to premium features.',
        });
        setIsCompleted(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-bold">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Thank you for your purchase. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground pt-4">
        Your payment is secured by Stripe. We do not store your credit card information.
      </p>
    </form>
  );
}