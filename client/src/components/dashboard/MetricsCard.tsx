import { cn } from '@/lib/utils';

type MetricsCardProps = {
  title: string;
  value: string | number;
  icon: string;
  change: {
    value: number;
    isPositive: boolean;
    text: string;
  };
};

export default function MetricsCard({ title, value, icon, change }: MetricsCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</p>
        <span className="material-icons text-primary-500">{icon}</span>
      </div>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      <div className="flex items-center mt-1 text-xs">
        <span className={cn(
          "flex items-center",
          change.isPositive ? "text-success-500" : "text-error-500"
        )}>
          <span className="material-icons text-xs mr-0.5">
            {change.isPositive ? "arrow_upward" : "arrow_downward"}
          </span>
          {change.value}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400 ml-1">{change.text}</span>
      </div>
    </div>
  );
}
