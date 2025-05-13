import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: Error) => void;
}

export function PayPalButton({
  amount,
  currency = 'USD',
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handlePayPalClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a PayPal order
      const orderResponse = await apiRequest('POST', '/api/paypal/create-order', {
        amount,
        currency
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const orderData = await orderResponse.json();
      
      // Find the approve URL from the links array
      const approveUrl = orderData.links.find((link: any) => link.rel === 'approve').href;
      
      // Open PayPal window for payment
      const paypalWindow = window.open(approveUrl, 'PayPal Checkout', 'width=550,height=700');
      
      // Poll to check when the window is closed
      const checkWindowClosed = setInterval(async () => {
        if (!paypalWindow || paypalWindow.closed) {
          clearInterval(checkWindowClosed);
          
          try {
            // Check the order status
            const orderStatusResponse = await apiRequest('GET', `/api/paypal/order/${orderData.id}`);
            if (!orderStatusResponse.ok) {
              throw new Error('Failed to check order status');
            }
            
            const statusData = await orderStatusResponse.json();
            
            if (statusData.status === 'COMPLETED') {
              // Order was completed successfully
              toast({
                title: 'Payment Successful!',
                description: 'Your PayPal payment has been processed successfully.',
              });
              
              if (onSuccess) {
                onSuccess(statusData);
              }
              
              // Redirect to dashboard after success
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else if (statusData.status === 'APPROVED') {
              // Order is approved but not yet captured, let's capture it
              const captureResponse = await apiRequest('POST', `/api/paypal/capture-order/${orderData.id}`);
              
              if (!captureResponse.ok) {
                throw new Error('Failed to complete payment');
              }
              
              const captureData = await captureResponse.json();
              
              toast({
                title: 'Payment Successful!',
                description: 'Your PayPal payment has been processed successfully.',
              });
              
              if (onSuccess) {
                onSuccess(captureData);
              }
              
              // Redirect to dashboard after success
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              // Payment was not completed
              setError('Payment was not completed. Please try again.');
            }
          } catch (checkError) {
            console.error('Error checking payment status:', checkError);
            setError('Failed to verify payment status. Please contact support.');
            
            if (onError) {
              onError(checkError instanceof Error ? checkError : new Error(String(checkError)));
            }
          }
          
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error('PayPal error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-destructive" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        variant="outline"
        className="w-full flex items-center justify-center bg-[#0070ba] hover:bg-[#003087] text-white border-[#0070ba] hover:border-[#003087]"
        onClick={handlePayPalClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.5 7H15a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-3l-2 2" />
              <path d="M6.5 7c.5-1 1.727-3 4.5-3 2.773 0 4.5 2 5 3" />
              <path d="M6.5 7c-.5 1-1.027 2-1.5 2H3.6c-.13 0-.25-.072-.316-.184a.33.33 0 0 1-.036-.327L4.5 6" />
            </svg>
            Pay with PayPal
          </>
        )}
      </Button>
    </div>
  );
}