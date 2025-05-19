'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  PersonalGreeting,
  PersonalMetrics,
  PersonalProjects,
  PersonalTasks,
} from './personal-widgets';

export default function PersonalDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      setUser(JSON.parse(data));
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/personal'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading dashboard',
        description: 'Could not fetch personal data. Try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const fallback = {
    metrics: [
      {
        label: 'Steps Today',
        value: '8,240',
        description: 'Keep moving 💪',
      },
      {
        label: 'Upcoming Events',
        value: 4,
        description: '2 birthdays, 1 appointment',
      },
      {
        label: 'Goals Met',
        value: 3,
        description: 'On fire 🔥',
      },
      {
        label: 'Avg Sleep',
        value: '7.5 hrs',
        description: 'Last 7 days',
      },
    ],
    projects: [
      {
        id: '1',
        title: 'Kitchen Remodel',
        progress: 40,
        status: 'In Progress',
      },
    ],
    tasks: [
      {
        id: '1',
        title: 'Pay electricity bill',
        due: '2025-05-20',
        done: false,
      },
    ],
  };

  const content = data || fallback;

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PersonalGreeting username={user?.fullName || user?.username || 'User'} />
      <PersonalMetrics metrics={content.metrics} />
      <PersonalProjects projects={content.projects} />
      <PersonalTasks tasks={content.tasks} />
    </div>
  );
}
