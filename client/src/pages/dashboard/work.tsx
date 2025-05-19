import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TaskList from '@/components/dashboard/TaskList';
import ProjectBoard from '@/components/dashboard/ProjectBoard';
import RoleSwitch from '@/components/dashboard/RoleSwitch';
import RecentActivity from '@/components/dashboard/RecentActivity';
import type { MetricItem, Task, Project, ActivityItem } from '@/types';

// Mock data for initial development
const metrics: MetricItem[] = [
  {
    id: '1',
    title: 'Active Projects',
    value: 8,
    icon: 'projectIcon',
    change: {
      value: 2,
      isPositive: true,
      text: 'from last month'
    }
  },
  {
    id: '2',
    title: 'Tasks Completed',
    value: 24,
    icon: 'taskIcon',
    change: {
      value: 5,
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
    title: 'Team Productivity',
    value: '87%',
    icon: 'productivityIcon',
    change: {
      value: 4,
      isPositive: true,
      text: 'from last week'
    }
  }
];

const tasks: Task[] = [
  {
    id: '1',
    title: 'Create project proposal',
    dueDate: new Date('2025-05-20'),
    priority: 'high',
    completed: false,
    assignee: {
      name: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
    }
  },
  {
    id: '2',
    title: 'Review marketing materials',
    dueDate: new Date('2025-05-19'),
    priority: 'medium',
    completed: false,
    assignee: {
      name: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
    }
  },
  {
    id: '3',
    title: 'Update client documentation',
    dueDate: new Date('2025-05-18'),
    priority: 'normal',
    completed: true,
    assignee: {
      name: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
    }
  }
];

const projects: Project[] = [
  {
    id: '1',
    title: 'Brand Refresh Project',
    description: 'Complete redesign of company brand assets and guidelines',
    status: 'On Track',
    progress: 65,
    dueDate: new Date('2025-06-15'),
    team: [
      {
        id: 'u1',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
        name: 'Alex Morgan'
      },
      {
        id: 'u2',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        name: 'Sarah Chen'
      }
    ]
  },
  {
    id: '2',
    title: 'Q2 Marketing Campaign',
    description: 'Plan and execute marketing campaign for Q2 product launch',
    status: 'At Risk',
    progress: 32,
    dueDate: new Date('2025-05-30'),
    team: [
      {
        id: 'u1',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
        name: 'Alex Morgan'
      }
    ]
  }
];

const activities: ActivityItem[] = [
  {
    id: '1',
    user: {
      name: 'Alex Morgan',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
    },
    action: 'completed',
    target: 'Update client documentation task',
    timestamp: new Date('2025-05-17T08:30:00')
  },
  {
    id: '2',
    user: {
      name: 'Sarah Chen',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    action: 'commented on',
    target: 'Brand Refresh Project',
    comment: 'The new designs look great! I think we should proceed with these.',
    timestamp: new Date('2025-05-17T07:45:00')
  }
];

export default function WorkDashboard() {
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
    queryKey: ['/api/dashboard/work'],
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
    projects,
    activities
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
          <h1 className="text-2xl font-bold">Work Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Welcome back, {user?.displayName || user?.username || 'User'}
          </p>
        </div>
        <RoleSwitch title="Current Role" currentRole="work" />
      </div>

      <MetricsGrid metrics={displayData.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectBoard projects={displayData.projects} />
        </div>
        <div>
          <RecentActivity activities={displayData.activities} />
        </div>
      </div>

      <TaskList tasks={displayData.tasks} />
    </div>
  );
}