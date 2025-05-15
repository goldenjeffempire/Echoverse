
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Copy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SuccessPage() {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Extract payment intent ID from URL
    const query = new URLSearchParams(window.location.search);
    const paymentIntentId = query.get("payment_intent");
    setPaymentId(paymentIntentId);
    
    // Simulate checking payment status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCopyPaymentId = () => {
    if (paymentId) {
      navigator.clipboard.writeText(paymentId);
      toast({
        title: "Copied!",
        description: "Payment ID copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-medium">Confirming your payment...</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-3xl py-12">
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Thank you for your purchase. Your subscription has been activated.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment ID</span>
                <div className="flex items-center">
                  <span className="font-mono">{paymentId?.substring(0, 12)}...</span>
                  <Button variant="ghost" size="icon" onClick={handleCopyPaymentId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account</span>
                <span>{user?.username || user?.email || "Your account"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={() => setLocation("/")}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => setLocation("/subscription")}>
            Manage Subscription
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
