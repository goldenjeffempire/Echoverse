// client/src/pages/dashboard/general.tsx
'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, CalendarCheck } from 'lucide-react';

interface GeneralMetrics {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

interface GeneralDashboardData {
  metrics: GeneralMetrics[];
  notifications: string[];
}

function GeneralGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Hello, {username}</h2>
      <p className="text-muted-foreground">Here's your daily summary.</p>
    </div>
  );
}

function NotificationsList({ notifications }: { notifications: string[] }) {
  if (!notifications.length) {
    return <p className="text-sm text-muted-foreground mt-4">No new notifications.</p>;
  }
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {notifications.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function GeneralDashboard() {
  const user = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<GeneralDashboardData>({
    queryKey: ['/api/dashboard/general'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
    retry: 2,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading general dashboard',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const metrics = data?.metrics || [
    {
      label: 'Profile Completeness',
      value: '80%',
      description: 'Keep it updated!',
      icon: <User className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Upcoming Events',
      value: 3,
      description: 'Don’t miss out',
      icon: <CalendarCheck className="h-5 w-5 text-primary" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <GeneralGreeting username={user.fullName || user.username || 'User'} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="bg-dark-card border-primary/20">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex gap-2 items-center">
                {metric.icon}
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <NotificationsList notifications={data?.notifications || []} />
    </div>
  );
}
