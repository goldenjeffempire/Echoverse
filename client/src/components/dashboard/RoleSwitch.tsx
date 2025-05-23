import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, Home, School, Users, ChevronDown } from 'lucide-react';

const ROLE_OPTIONS = [
  { key: 'general', label: 'General', icon: Users },
  { key: 'personal', label: 'Personal', icon: Home },
  { key: 'school', label: 'School', icon: School },
  { key: 'work', label: 'Work', icon: Briefcase },
];

type RoleSwitchProps = {
  title?: string;
  currentRole: string;
};

export default function RoleSwitch({ title = 'Switch Role', currentRole }: RoleSwitchProps) {
  const [role, setRole] = useState(currentRole);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setRole(currentRole); // Sync state with props when route changes externally
  }, [currentRole]);

  const handleRoleChange = (newRole: string) => {
    if (newRole !== role) {
      setRole(newRole);
      setLocation(`/dashboard/${newRole}`);
      // Optional: Save preference to localStorage or backend
    }
  };

  const current = ROLE_OPTIONS.find((opt) => opt.key === role) ?? ROLE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 capitalize">
          <current.icon className="h-4 w-4" />
          {current.label}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onSelect={() => handleRoleChange(opt.key)}
            className="flex items-center gap-2 capitalize"
          >
            <opt.icon className="h-4 w-4" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
