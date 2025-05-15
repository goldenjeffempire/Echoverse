import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';

export default function DevLogin() {
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleQuickLogin = async () => {
    setLoggingIn(true);
    try {
      await loginMutation.mutateAsync({
        username: 'admin',
        password: 'admin123',
      });
      toast({
        title: 'Login successful',
        description: 'Welcome back, admin!',
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dev Login | Echoverse</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Dev Login</CardTitle>
            <CardDescription>
              Quick login for development testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleQuickLogin} 
                className="w-full" 
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  'Login as Admin'
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <a href="/auth" className="underline underline-offset-4 hover:text-primary">
                  Go to regular login
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}