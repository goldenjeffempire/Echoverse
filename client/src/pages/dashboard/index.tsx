'use client';

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function DashboardIndex() {
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    // Immediate redirect attempt
    setLocation('/dashboard/general');

    // Fallback redirect in case immediate doesn't work
    const fallback = setTimeout(() => {
      setRedirecting(false);
      setLocation('/dashboard/general');
    }, 5000);

    return () => clearTimeout(fallback);
  }, [setLocation]);

  return (
    <main
      role="main"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center"
    >
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Redirecting to your dashboard...
      </h1>

      {redirecting ? (
        <div
          role="status"
          aria-label="Loading"
          className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-blue-600 rounded-full animate-spin mx-auto"
        />
      ) : (
        <p className="text-muted-foreground max-w-xs">
          If you are not redirected automatically,{' '}
          <button
            onClick={() => setLocation('/dashboard/general')}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            click here
          </button>{' '}
          to continue.
        </p>
      )}
    </main>
  );
}
