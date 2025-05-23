import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Notification {
  id: string | number;
  message: string;
}

export function GeneralWidgets() {
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/general/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/general/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    retry: 1,
  });

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading notifications...</p>
          ) : error ? (
            <p className="text-destructive">Failed to load notifications.</p>
          ) : !notifications || notifications.length === 0 ? (
            <p className="text-muted-foreground">Nothing new here.</p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {notifications.slice(0, 5).map((note) => (
                <li key={note.id}>🔔 {note.message}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
