'use client';

import React, { useEffect, useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Briefcase, Clock, ListTodo } from 'lucide-react';

// Reuse UserContext from general for consistency
import { UserContext, useUser } from './general';

interface Task {
  id: string;
  title: string;
  status: string; // e.g. 'To Do', 'In Progress', 'Done'
}

interface Meeting {
  id: string;
  title: string;
  time: string; // ISO string datetime
}

interface Metrics {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

interface WorkDashboardData {
  metrics: Metrics[];
  tasks: Task[];
  meetings: Meeting[];
}

function WorkGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome back, {username}</h2>
      <p className="text-muted-foreground">Let’s get that bread 🥖</p>
    </div>
  );
}

function WorkBoard({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground mt-4">No active tasks.</p>;
  }

  // Group tasks by status for Kanban style display
  const groupedTasks = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const status = task.status || 'To Do';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Kanban Board</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(groupedTasks).map(([status, taskList]) => (
          <div key={status} className="space-y-2">
            <h4 className="text-sm font-semibold">{status}</h4>
            {taskList.map((task) => (
              <div
                key={task.id}
                className="p-2 border border-muted rounded-md bg-card text-sm"
              >
                {task.title}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkAgenda({ meetings }: { meetings: Meeting[] }) {
  if (!meetings.length) {
    return <p className="text-sm text-muted-foreground mt-4">No meetings scheduled today.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Today’s Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="flex justify-between text-sm"
            title={new Date(meeting.time).toLocaleString()}
          >
            <span>{meeting.title}</span>
            <span className="text-muted-foreground">
              {new Date(meeting.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function WorkDashboard() {
  const user = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<WorkDashboardData>({
    queryKey: ['/api/dashboard/work'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
    retry: 2,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading work dashboard',
        description: 'Try refreshing or reach out if this persists.',
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

  const metrics =
    data?.metrics || [
      {
        label: 'Tasks Completed',
        value: 0,
        description: 'This week',
        icon: <ListTodo className="h-5 w-5 text-primary" />,
      },
      {
        label: 'Hours Logged',
        value: '0h',
        description: 'Tracked via TimeTool',
        icon: <Clock className="h-5 w-5 text-primary" />,
      },
      {
        label: 'Meetings Today',
        value: 0,
        description: 'Better bring coffee ☕',
        icon: <Briefcase className="h-5 w-5 text-primary" />,
      },
    ];

  return (
    <div className="space-y-6 p-6">
      <WorkGreeting username={user.fullName || user.username || 'Pro Worker'} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <WorkBoard tasks={data?.tasks || []} />
      <WorkAgenda meetings={data?.meetings || []} />
    </div>
  );
}
