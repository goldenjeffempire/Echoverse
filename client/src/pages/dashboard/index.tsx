'use client';

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function DashboardIndex() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to general dashboard by default — this is the breadwinner view after all
    setLocation('/dashboard/general');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Redirecting to your dashboard...</h1>
        <p className="text-muted-foreground">Hang tight — or use the sidebar to jump around.</p>
      </div>
    </div>
  );
}
