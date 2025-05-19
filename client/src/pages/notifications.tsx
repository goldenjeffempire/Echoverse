
import { useState, useEffect } from 'react';
import { Bell, Calendar, Mail, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getQueryFn({ endpoint: '/api/notifications' })
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ScrollArea className="h-[600px]">
            {notifications.map((notification: any) => (
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
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5" />;
    case 'reminder':
      return <Calendar className="h-5 w-5" />;
    case 'email':
      return <Mail className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}
