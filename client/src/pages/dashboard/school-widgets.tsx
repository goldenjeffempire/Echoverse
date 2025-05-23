import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface HomeworkAssignment {
  id: string;
  subject: string;
  dueDate: string;
  completed: boolean;
}

export function SchoolWidgets() {
  const { data: assignments, isLoading, error } = useQuery<HomeworkAssignment[]>({
    queryKey: ['/api/school/homework'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/school/homework');
      if (!res.ok) throw new Error('Failed to fetch homework assignments');
      return res.json();
    },
    retry: 1,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homework Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Could not load homework assignments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Homework Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading assignments...</p>
        ) : assignments?.length === 0 ? (
          <p>No pending homework! Great job 🎉</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {assignments.map(({ id, subject, dueDate, completed }) => (
              <li key={id} className={completed ? 'line-through text-muted-foreground' : ''}>
                {subject} — due {new Date(dueDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
