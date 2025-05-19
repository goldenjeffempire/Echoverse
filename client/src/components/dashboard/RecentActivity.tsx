import { getRelativeTime } from '@/lib/utils';
import { Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ActivityItem } from '@/types';

type RecentActivityProps = {
  activities: ActivityItem[];
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {activity.user.avatar ? (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    {activity.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {activity.action}
                  </span>{' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                {activity.comment && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 border-l-2 border-neutral-200 dark:border-neutral-700 pl-3 mt-1">
                    {activity.comment}
                  </p>
                )}
                <div className="flex items-center mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {getRelativeTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-4">
              <p className="text-neutral-500 dark:text-neutral-400">No recent activities</p>
            </div>
          )}
          
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <button className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              View all activity
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}