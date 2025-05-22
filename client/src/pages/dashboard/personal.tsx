'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, Calendar, Heart } from 'lucide-react';

// User context for consistency across dashboards (can be shared or imported from general)
interface UserInfo {
  username: string;
  fullName?: string;
  dob?: string;
  email?: string;
}

const UserContext = createContext<UserInfo | null>(null);

export const useUser = () => {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('useUser must be used within UserProvider');
  }
  return user;
};

function PersonalGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Hey {username}, welcome to your personal space</h2>
      <p className="text-muted-foreground">Manage your goals and wellness here.</p>
    </div>
  );
}

interface Goal {
  id: string;
  title: string;
  progress: number; // 0-100 %
}

interface WellnessStats {
  sleepHours: number;
  mood: string;
}

interface PersonalDashboardData {
  goals: Goal[];
  wellness: WellnessStats;
}

function GoalsBoard({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return <p className="text-sm text-muted-foreground mt-4">No goals set yet. Time to set some!</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Your Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-1">
            <div className="flex justify-between font-medium">{goal.title}</div>
            <progress
              className="w-full h-3 rounded bg-muted"
              value={goal.progress}
              max={100}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WellnessPanel({ wellness }: { wellness: WellnessStats }) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Wellness Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Sleep: {wellness.sleepHours} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Mood: {wellness.mood}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PersonalDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data, isLoading, error } = useQuery<PersonalDashboardData>({
    queryKey: ['/api/dashboard/personal'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
    retry: 2,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your personal dashboard.',
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
    <UserContext.Provider value={user}>
      <div className="space-y-6 p-6">
        <PersonalGreeting username={user.fullName || user.username} />

        <GoalsBoard goals={data?.goals || []} />
        {data?.wellness && <WellnessPanel wellness={data.wellness} />}
      </div>
    </UserContext.Provider>
  );
}
