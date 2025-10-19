import React from 'react';
import { Loader2 } from 'lucide-react';
/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    return (<Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`}/>);
}
/**
 * Full Page Loading Component
 */
export function PageLoading({ message = 'Loading...' }) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4 text-primary"/>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>);
}
/**
 * Skeleton Loader Component
 */
export function Skeleton({ className = '', ...props }) {
    return (<div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props}/>);
}
/**
 * Card Skeleton
 */
export function CardSkeleton() {
    return (<div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4"/>
      <Skeleton className="h-4 w-1/2"/>
      <Skeleton className="h-20 w-full"/>
    </div>);
}
/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5 }) {
    return (<div className="space-y-2">
      <Skeleton className="h-10 w-full"/>
      {Array.from({ length: rows }).map((_, i) => (<Skeleton key={i} className="h-16 w-full"/>))}
    </div>);
}
/**
 * List Skeleton
 */
export function ListSkeleton({ items = 5 }) {
    return (<div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (<div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full"/>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4"/>
            <Skeleton className="h-3 w-1/2"/>
          </div>
        </div>))}
    </div>);
}
/**
 * Empty State Component
 */
export function EmptyState({ icon: Icon, title, description, action }) {
    return (<div className="text-center py-12">
      {Icon && (<div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full mb-4">
          <Icon className="w-6 h-6 text-gray-600"/>
        </div>)}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>);
}
