'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { WorkGreeting, WorkBoard, WorkAgenda } from './work-widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, ListTodo } from 'lucide-react';

export default function WorkDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/work'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not load work dashboard.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const metrics = data?.metrics || [
    {
      label: 'Tasks Completed',
      value: 12,
      icon: <ListTodo className="h-5 w-5 text-primary" />,
      description: 'This week',
    },
    {
      label: 'Hours Logged',
      value: '36h',
      icon: <Clock className="h-5 w-5 text-primary" />,
      description: 'Tracked via TimeTool',
    },
    {
      label: 'Meetings Today',
      value: 3,
      icon: <Briefcase className="h-5 w-5 text-primary" />,
      description: 'Better bring coffee ☕',
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
      <WorkGreeting username={user?.fullName || user?.username || 'Pro Worker'} />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
