// client/src/pages/notification.tsx
import React, { useMemo } from 'react';
import { Bell, Calendar, Mail, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'reminder' | 'email' | string;
  createdAt: string;
  mentions?: string[]; // user IDs or names mentioned
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getQueryFn({ endpoint: '/api/notifications' }),
  });

  // Filter notifications by tab value
  const [tab, setTab] = React.useState<'all' | 'mentions' | 'reminders'>('all');

  // Assume userId from localStorage or auth context; fallback to empty string
  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?.id || '';
    } catch {
      return '';
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    if (tab === 'all') return notifications;

    if (tab === 'mentions') {
      return notifications.filter((n) => n.mentions?.includes(userId));
    }

    if (tab === 'reminders') {
      return notifications.filter((n) => n.type === 'reminder');
    }

    return notifications;
  }, [notifications, tab, userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center text-destructive">
        <p className="text-lg">Failed to load notifications. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <ScrollArea className="h-[600px]">
            {filteredNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10">
                No notifications found in this category.
              </p>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className="p-4 mb-2">
                  <div className="flex items-start gap-4">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" aria-label="Message notification" />;
    case 'reminder':
      return <Calendar className="h-5 w-5 text-green-500" aria-label="Reminder notification" />;
    case 'email':
      return <Mail className="h-5 w-5 text-purple-500" aria-label="Email notification" />;
    default:
      return <Bell className="h-5 w-5 text-gray-400" aria-label="General notification" />;
  }
}
