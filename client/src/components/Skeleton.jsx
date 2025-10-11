/**
 * LOW PRIORITY FIX #110: Skeleton loader variants
 */
export function Skeleton({ variant = 'rectangular', width, height, className = '', animate = true, }) {
    const baseClasses = 'bg-muted';
    const animateClass = animate ? 'animate-pulse' : '';
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
        card: 'rounded-lg',
    };
    const style = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };
    return (<div className={`${baseClasses} ${variantClasses[variant]} ${animateClass} ${className}`} style={style}/>);
}
export function SkeletonCard() {
    return (<div className="rounded-lg border p-4 space-y-4">
      <Skeleton variant="circular" width={48} height={48}/>
      <div className="space-y-2">
        <Skeleton variant="text" width="60%"/>
        <Skeleton variant="text" width="40%"/>
      </div>
      <Skeleton variant="rectangular" height={100}/>
    </div>);
}
export function SkeletonTable({ rows = 5 }) {
    return (<div className="space-y-2">
      <Skeleton variant="rectangular" height={40}/>
      {Array.from({ length: rows }).map((_, i) => (<Skeleton key={i} variant="rectangular" height={32}/>))}
    </div>);
}
