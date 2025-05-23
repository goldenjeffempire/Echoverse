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

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
}

interface Meeting {
  id: string;
  subject: string;
  time: string;
}

interface WorkDashboardData {
  tasks: Task[];
  meetings: Meeting[];
  productivityScore: number; // 0 - 100
}

function TaskBoard({ tasks }: { tasks: Task[] }) {
  const statusGroups = {
    pending: [] as Task[],
    'in-progress': [] as Task[],
    completed: [] as Task[],
  };

  tasks.forEach(task => {
    statusGroups[task.status].push(task);
  });

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {(['pending', 'in-progress', 'completed'] as const).map(status => (
        <Card key={status}>
          <CardHeader>
            <CardTitle>{status.replace('-', ' ').toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusGroups[status].length === 0 ? (
              <p className="text-muted-foreground">No {status} tasks.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {statusGroups[status].map(({ id, title, dueDate }) => (
                  <li key={id}>
                    {title} (Due {new Date(dueDate).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WorkDashboard() {
  const user = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<WorkDashboardData>({
    queryKey: ['/api/dashboard/work'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: Boolean(user),
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading work dashboard',
        description: 'Try refreshing or contact your admin.',
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
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">
        Welcome back, {user.fullName || user.username || 'Team Player'}
      </h2>
      <p className="text-muted-foreground">Let’s get that bread 🥖</p>

      <Card>
        <CardHeader>
          <CardTitle>Productivity Score</CardTitle>
        </CardHeader>
        <CardContent>
          <progress
            className="w-full"
            max={100}
            value={data?.productivityScore ?? 0}
            aria-label="Productivity Score"
          />
          <p className="text-center mt-2 text-sm">
            {data?.productivityScore ?? 0}%
          </p>
        </CardContent>
      </Card>

      <TaskBoard tasks={data?.tasks || []} />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.meetings.length === 0 ? (
            <p className="text-muted-foreground">No meetings scheduled.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data?.meetings.map(({ id, subject, time }) => (
                <li key={id}>
                  {subject} — {new Date(time).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
