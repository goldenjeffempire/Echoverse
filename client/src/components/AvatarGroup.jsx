/**
 * LOW PRIORITY FIX #108: Avatar group component
 */
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
export function AvatarGroup({ avatars, max = 5, size = 'md', className = '', }) {
    const displayAvatars = avatars.slice(0, max);
    const remaining = Math.max(0, avatars.length - max);
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    };
    return (<div className={`flex -space-x-3 ${className}`}>
      {displayAvatars.map((avatar, index) => (<Avatar key={index} className={`${sizeClasses[size]} border-2 border-background ring-2 ring-background`}>
          <AvatarImage src={avatar.src} alt={avatar.alt}/>
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>))}
      {remaining > 0 && (<Avatar className={`${sizeClasses[size]} border-2 border-background ring-2 ring-background bg-muted`}>
          <AvatarFallback>+{remaining}</AvatarFallback>
        </Avatar>)}
    </div>);
}
