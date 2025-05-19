import { useState } from 'react';
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

type RoleSwitchProps = {
  title: string;
  currentRole: string;
};

export default function RoleSwitch({ title, currentRole }: RoleSwitchProps) {
  const [role, setRole] = useState(currentRole);
  const [, setLocation] = useLocation();
  
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    setLocation(`/dashboard/${newRole}`);
    
    // In a real app, we'd also update the user's role preference in the backend
  };
  
  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'work':
        return <Briefcase className="h-4 w-4 mr-2" />;
      case 'personal':
        return <Home className="h-4 w-4 mr-2" />;
      case 'school':
        return <School className="h-4 w-4 mr-2" />;
      case 'general':
      default:
        return <Users className="h-4 w-4 mr-2" />;
    }
  };
  
  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'work':
        return 'Work';
      case 'personal':
        return 'Personal';
      case 'school':
        return 'School';
      case 'general':
      default:
        return 'General';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          {getRoleIcon(role)}
          {getRoleLabel(role)}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleChange('work')}>
          <Briefcase className="h-4 w-4 mr-2" />
          Work
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('personal')}>
          <Home className="h-4 w-4 mr-2" />
          Personal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('school')}>
          <School className="h-4 w-4 mr-2" />
          School
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange('general')}>
          <Users className="h-4 w-4 mr-2" />
          General
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}