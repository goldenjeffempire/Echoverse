// client/src/pages/not-found.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import React from 'react';

export default function NotFound() {
  const [, navigate] = useLocation();

  const goBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goHome = React.useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-background p-4"
      role="main"
      aria-labelledby="notfound-title"
      aria-describedby="notfound-desc"
    >
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="flex mb-4 items-center gap-2" aria-hidden="true">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 id="notfound-title" className="text-2xl font-bold">
              404 Page Not Found
            </h1>
          </div>

          <p id="notfound-desc" className="mt-2 text-sm text-muted-foreground mb-6">
            Sorry, we couldn't find the page you're looking for.
          </p>

          <div className="flex gap-4">
            <Button variant="outline" onClick={goBack} aria-label="Go back to previous page">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={goHome} aria-label="Go to home page">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
