import React from 'react';
import { cn } from '@/lib/utils';
export function Skeleton({ className }) {
    return (<div className={cn('animate-pulse rounded-md bg-muted', className)}/>);
}
export function ProductCardSkeleton() {
    return (<div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-48 w-full"/>
      <Skeleton className="h-4 w-3/4"/>
      <Skeleton className="h-4 w-1/2"/>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20"/>
        <Skeleton className="h-9 w-24"/>
      </div>
    </div>);
}
export function TableRowSkeleton({ cols = 4 }) {
    return (<tr>
      {Array.from({ length: cols }).map((_, i) => (<td key={i} className="p-4">
          <Skeleton className="h-4 w-full"/>
        </td>))}
    </tr>);
}
export function DashboardCardSkeleton() {
    return (<div className="border rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-32"/>
        <Skeleton className="h-8 w-8 rounded-full"/>
      </div>
      <Skeleton className="h-8 w-24"/>
      <Skeleton className="h-3 w-48"/>
    </div>);
}
export function UserProfileSkeleton() {
    return (<div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full"/>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32"/>
          <Skeleton className="h-3 w-48"/>
        </div>
      </div>
      <Skeleton className="h-24 w-full"/>
    </div>);
}
export function FormSkeleton() {
    return (<div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>))}
      <Skeleton className="h-10 w-full"/>
    </div>);
}
export function ChatMessageSkeleton() {
    return (<div className="flex items-start space-x-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full"/>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24"/>
        <Skeleton className="h-4 w-3/4"/>
        <Skeleton className="h-4 w-1/2"/>
      </div>
    </div>);
}
