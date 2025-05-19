import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TaskList from '@/components/dashboard/TaskList';
import ProjectBoard from '@/components/dashboard/ProjectBoard';
import RoleSwitch from '@/components/dashboard/RoleSwitch';
import AiAssistant from '@/components/chat/AiAssistant';
import type { MetricItem, Task, Project } from '@/types';

// Mock data for initial development
const metrics: MetricItem[] = [
  {
    id: '1',
    title: 'Personal Goals',
    value: 5,
    icon: 'projectIcon',
    change: {
      value: 1,
      isPositive: true,
      text: 'from last month'
    }
  },
  {
    id: '2',
    title: 'Tasks Completed',
    value: 12,
    icon: 'taskIcon',
    change: {
      value: 4,
      isPositive: true,
      text: 'from last week'
    }
  },
  {
    id: '3',
    title: 'AI Credits',
    value: 85,
    icon: 'creditIcon',
    change: {
      value: 15,
      isPositive: false,
      text: 'used this month'
    }
  },
  {
    id: '4',
    title: 'Productivity Score',
    value: '78%',
    icon: 'productivityIcon',
    change: {
      value: 3,
      isPositive: true,
      text: 'from last week'
    }
  }
];

const tasks: Task[] = [
  {
    id: '1',
    title: 'Plan weekend trip',
    dueDate: new Date('2025-05-22'),
    priority: 'medium',
    completed: false,
    assignee: {
      name: 'You',
      avatar: ''
    }
  },
  {
    id: '2',
    title: 'Schedule dentist appointment',
    dueDate: new Date('2025-05-24'),
    priority: 'high',
    completed: false,
    assignee: {
      name: 'You',
      avatar: ''
    }
  },
  {
    id: '3',
    title: 'Pay utility bills',
    dueDate: new Date('2025-05-20'),
    priority: 'normal',
    completed: true,
    assignee: {
      name: 'You',
      avatar: ''
    }
  }
];

const projects: Project[] = [
  {
    id: '1',
    title: 'Home Renovation',
    description: 'Planning and executing kitchen renovation project',
    status: 'On Track',
    progress: 45,
    dueDate: new Date('2025-07-15'),
    team: [
      {
        id: 'u1',
        avatar: '',
        name: 'You'
      },
      {
        id: 'u2',
        avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
        name: 'Jamie Lee'
      }
    ]
  },
  {
    id: '2',
    title: 'Fitness Challenge',
    description: '30-day fitness and nutrition program',
    status: 'At Risk',
    progress: 22,
    dueDate: new Date('2025-06-05'),
    team: [
      {
        id: 'u1',
        avatar: '',
        name: 'You'
      }
    ]
  }
];

export default function PersonalDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Get the user from local storage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // In a real app, we would fetch the actual data from the server
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/personal'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user, // Only fetch when user exists
  });

  // When there's an error, show a toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Use real data if available, fallback to mock data for development
  const displayData = dashboardData || {
    metrics,
    tasks,
    projects
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Personal Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Welcome back, {user?.displayName || user?.username || 'User'}
          </p>
        </div>
        <RoleSwitch title="Current Role" currentRole="personal" />
      </div>

      <MetricsGrid metrics={displayData.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectBoard projects={displayData.projects} />
        </div>
        <div>
          <AiAssistant />
        </div>
      </div>

      <TaskList tasks={displayData.tasks} />
    </div>
  );
}