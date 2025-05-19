import { BarChart2, Users, CreditCard, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/types';

type MetricsGridProps = {
  metrics: Array<MetricItem>;
};

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  // Function to render the appropriate icon based on icon string
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'projectIcon':
        return <BarChart2 className="h-6 w-6 text-primary-500" />;
      case 'taskIcon':
        return <Users className="h-6 w-6 text-green-500" />;
      case 'creditIcon':
        return <CreditCard className="h-6 w-6 text-purple-500" />;
      case 'productivityIcon':
        return <TrendingUp className="h-6 w-6 text-rose-500" />;
      default:
        return <BarChart2 className="h-6 w-6 text-primary-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                {metric.title}
              </p>
              <h3 className="text-2xl font-bold mt-2 text-neutral-900 dark:text-white">
                {metric.value}
              </h3>
            </div>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
              {renderIcon(metric.icon)}
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span
              className={`flex items-center ${
                metric.change.isPositive ? 'text-green-500' : 'text-rose-500'
              }`}
            >
              {metric.change.isPositive ? '↑' : '↓'} {metric.change.value}%
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 ml-1">
              {metric.change.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}