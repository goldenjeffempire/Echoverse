/**
 * LOW PRIORITY FIX #101: Empty state component
 */
export function EmptyState({ icon, title, description, action, className = '', }) {
    return (<div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (<p className="mt-2 text-sm text-muted-foreground max-w-md">{description}</p>)}
      {action && <div className="mt-6">{action}</div>}
    </div>);
}
