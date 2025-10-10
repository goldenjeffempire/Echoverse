/**
 * LOW PRIORITY FIX #109: Progress bar component
 */

import { Progress } from './ui/progress';

export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  variant = 'default',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: '[&>div]:bg-primary',
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-yellow-500',
    danger: '[&>div]:bg-red-500',
  };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-2 text-sm">
          <span>{label || 'Progress'}</span>
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <Progress
        value={percentage}
        className={`${sizeClasses[size]} ${variantClasses[variant]}`}
      />
    </div>
  );
}
