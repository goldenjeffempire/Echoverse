'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Activity, Globe } from 'lucide-react';

// Types for data coming from API
interface GeneralMetrics {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

interface GeneralDashboardData {
  metrics: GeneralMetrics[];
  announcements: { id: string; message: string; date: string }[];
}

export default function GeneralDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data, isLoading, error } = useQuery<GeneralDashboardData>({
    queryKey: ['/api/dashboard/general'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load the general dashboard.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const defaultMetrics: GeneralMetrics[] = [
    {
      label: 'Active Users',
      value: 1024,
      icon: <Users className="h-5 w-5 text-primary" />,
      description: 'Currently online',
    },
    {
      label: 'Server Load',
      value: '75%',
      icon: <Activity className="h-5 w-5 text-primary" />,
      description: 'Average CPU usage',
    },
    {
      label: 'Global Reach',
      value: '24 countries',
      icon: <Globe className="h-5 w-5 text-primary" />,
      description: 'Users worldwide',
    },
  ];

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Welcome, {user?.fullName || user?.username || 'User'}</h2>
        <p className="text-muted-foreground">Here’s a quick snapshot of your environment.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {(data?.metrics || defaultMetrics).map((metric, idx) => (
          <Card key={idx} className="bg-dark-card border-primary/20">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.announcements && data.announcements.length > 0 ? (
            data.announcements.map(({ id, message, date }) => (
              <div key={id} className="text-sm">
                <p>{message}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(date).toLocaleDateString()}
                </time>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No announcements at this time.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
