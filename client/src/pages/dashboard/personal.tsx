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

interface PersonalDashboardData {
  goals: { id: string; goal: string; progress: number }[];
  upcomingEvents: { id: string; title: string; date: string }[];
}

function PersonalGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome, {username}</h2>
      <p className="text-muted-foreground">Focus on what matters most ❤️</p>
    </div>
  );
}

function GoalsList({ goals }: { goals: PersonalDashboardData['goals'] }) {
  if (!goals.length) {
    return <p className="text-sm text-muted-foreground mt-4">No personal goals set.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Personal Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {goals.map(({ id, goal, progress }) => (
            <li key={id} className="space-y-1">
              <p className="font-semibold">{goal}</p>
              <progress
                className="w-full"
                value={progress}
                max={100}
                aria-label={`${goal} progress`}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EventsList({ events }: { events: PersonalDashboardData['upcomingEvents'] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground mt-4">No upcoming events.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {events.map(({ id, title, date }) => (
            <li key={id}>
              {title} — {new Date(date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function PersonalDashboard() {
  const user = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<PersonalDashboardData>({
    queryKey: ['/api/dashboard/personal'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: Boolean(user),
    retry: 2,
    staleTime: 5 * 60 * 1000, // cache for 5 mins to reduce server load
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading personal dashboard',
        description: 'Try refreshing or contact support if the issue persists.',
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

  return (
    <main className="space-y-6 p-6 max-w-5xl mx-auto">
      <PersonalGreeting username={user.fullName || user.username || 'Friend'} />

      <GoalsList goals={data?.goals || []} />
      <EventsList events={data?.upcomingEvents || []} />
    </main>
  );
}
