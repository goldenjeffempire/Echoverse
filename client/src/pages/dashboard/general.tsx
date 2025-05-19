'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { WelcomeGreeting, ActivityCard } from './general-widgets';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Mail, Globe } from 'lucide-react';

export default function GeneralDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/general'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to Load',
        description: 'Could not fetch general dashboard data.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const stats = data?.metrics || [
    {
      label: 'Global Reach',
      value: '1.4M',
      icon: <Globe className="h-5 w-5 text-primary" />,
      description: 'Active users worldwide',
    },
    {
      label: 'Emails Sent',
      value: '42K',
      icon: <Mail className="h-5 w-5 text-primary" />,
      description: 'In the last 30 days',
    },
    {
      label: 'Engagement Rate',
      value: '87%',
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      description: 'Up 6% this month',
    },
    {
      label: 'Team Members',
      value: '256',
      icon: <Users className="h-5 w-5 text-primary" />,
      description: 'Across 12 departments',
    },
  ];

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <WelcomeGreeting username={user?.fullName || user?.username || 'User'} />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-dark-card border-primary/20">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex gap-2 items-center">
                {stat.icon}
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ActivityCard />
    </div>
  );
}
