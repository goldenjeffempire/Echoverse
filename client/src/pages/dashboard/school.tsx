'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SchoolGreeting, AgeBasedLibrary, AssignmentBoard } from './school-widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, CalendarDays, BookOpenCheck } from 'lucide-react';

export default function SchoolDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/school'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not load school dashboard.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const stats = data?.metrics || [
    {
      label: 'Average Grade',
      value: 'B+',
      icon: <GraduationCap className="h-5 w-5 text-primary" />,
      description: 'This semester',
    },
    {
      label: 'Assignments Due',
      value: 3,
      icon: <BookOpenCheck className="h-5 w-5 text-primary" />,
      description: 'Next 7 days',
    },
    {
      label: 'Events Coming Up',
      value: 2,
      icon: <CalendarDays className="h-5 w-5 text-primary" />,
      description: 'Check your schedule',
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
      <SchoolGreeting username={user?.fullName || user?.username || 'Student'} />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

      <AssignmentBoard assignments={data?.assignments} />
      <AgeBasedLibrary books={data?.library} dob={user?.dob} />
    </div>
  );
}
