import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function DashboardIndex() {
  const [_, setLocation] = useLocation();
  
  // Redirect to the work dashboard by default
  useEffect(() => {
    setLocation('/dashboard/work');
  }, [setLocation]);
  
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting to your dashboard...</h1>
        <p className="text-neutral-500">Please wait or click a dashboard from the sidebar.</p>
      </div>
    </div>
  );
}
