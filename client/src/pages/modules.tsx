// client/src/pages/modules.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  MessageSquare, 
  Sparkles, 
  Shield, 
  Users, 
  PenLine,
  Code,
  Newspaper,
  GraduationCap,
  Home,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleSwitch from '@/components/dashboard/RoleSwitch';

type ModuleCategory = 'content' | 'social' | 'productivity' | 'development';

interface Module {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  icon: React.ReactNode;
  color: string; // Tailwind bg color class, e.g. 'bg-blue-500'
  path: string;
  requiredPlan: 'free' | 'basic' | 'pro' | 'enterprise';
  isNew?: boolean;
  comingSoon?: boolean;
}

interface User {
  currentRole: Role;
  // add other user fields as needed
}

type Role = 'work' | 'school' | 'personal';

const COLOR_TEXT_MAP: Record<string, string> = {
  'bg-blue-500': 'text-blue-700 dark:text-blue-300',
  'bg-green-500': 'text-green-700 dark:text-green-300',
  'bg-purple-500': 'text-purple-700 dark:text-purple-300',
  'bg-red-500': 'text-red-700 dark:text-red-300',
  'bg-indigo-500': 'text-indigo-700 dark:text-indigo-300',
  'bg-amber-500': 'text-amber-700 dark:text-amber-300',
  'bg-cyan-500': 'text-cyan-700 dark:text-cyan-300',
  'bg-emerald-500': 'text-emerald-700 dark:text-emerald-300',
  'bg-pink-500': 'text-pink-700 dark:text-pink-300',
  'bg-orange-500': 'text-orange-700 dark:text-orange-300',
};

export default function ModulesPage() {
  const [currentRole, setCurrentRole] = useState<Role>('work');
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Load user and currentRole from localStorage once on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.currentRole) {
          setCurrentRole(parsedUser.currentRole);
        }
      } catch {
        // Malformed user data - ignore
        setUser(null);
      }
    }
  }, []);

  // Persist currentRole in localStorage whenever it changes
  useEffect(() => {
    if (user) {
      const updatedUser = { ...user, currentRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [currentRole]);

  // Memoized modules array based on currentRole
  const modules = useMemo<Module[]>(() => {
    const baseModules: Module[] = [
      {
        id: 'echo-writer',
        title: 'EchoWriter',
        description: 'AI-powered content generation for blogs, ads, product descriptions, and more',
        category: 'content',
        icon: <PenLine className="h-6 w-6" />,
        color: 'bg-blue-500',
        path: '/modules/echo-writer',
        requiredPlan: 'free',
      },
      {
        id: 'echo-cms',
        title: 'EchoCMS',
        description: 'Create, manage, and publish content with markdown support and media integration',
        category: 'content',
        icon: <FileText className="h-6 w-6" />,
        color: 'bg-green-500',
        path: '/modules/echo-cms',
        requiredPlan: 'basic',
      },
      {
        id: 'echo-feed',
        title: 'EchoFeed',
        description: 'AI-enhanced social networking with intelligent content recommendations',
        category: 'social',
        icon: <MessageSquare className="h-6 w-6" />,
        color: 'bg-purple-500',
        path: '/modules/echo-feed',
        requiredPlan: 'basic',
      },
      {
        id: 'guardian-ai',
        title: 'GuardianAI',
        description: 'Content moderation and parental controls for a safer digital environment',
        category: 'social',
        icon: <Shield className="h-6 w-6" />,
        color: 'bg-red-500',
        path: '/modules/guardian-ai',
        requiredPlan: 'pro',
      },
    ];

    const workModules: Module[] = [
      {
        id: 'echo-dev',
        title: 'EchoDev',
        description: 'AI-assisted code generation and programming tools for developers',
        category: 'development',
        icon: <Code className="h-6 w-6" />,
        color: 'bg-indigo-500',
        path: '/modules/echo-dev',
        requiredPlan: 'pro',
        comingSoon: true,
      },
      {
        id: 'team-space',
        title: 'TeamSpace',
        description: 'Collaborative workspace for teams with shared projects and tasks',
        category: 'productivity',
        icon: <Users className="h-6 w-6" />,
        color: 'bg-amber-500',
        path: '/modules/team-space',
        requiredPlan: 'enterprise',
        comingSoon: true,
      },
    ];

    const schoolModules: Module[] = [
      {
        id: 'echo-learn',
        title: 'EchoLearn',
        description: 'Educational tools and learning resources for students and educators',
        category: 'productivity',
        icon: <GraduationCap className="h-6 w-6" />,
        color: 'bg-cyan-500',
        path: '/modules/echo-learn',
        requiredPlan: 'basic',
        comingSoon: true,
      },
      {
        id: 'study-assistant',
        title: 'Study Assistant',
        description: 'AI-powered study aid with flashcards, notes, and quiz generation',
        category: 'productivity',
        icon: <Sparkles className="h-6 w-6" />,
        color: 'bg-emerald-500',
        path: '/modules/study-assistant',
        requiredPlan: 'pro',
        comingSoon: true,
      },
    ];

    const personalModules: Module[] = [
      {
        id: 'echo-planner',
        title: 'EchoPlanner',
        description: 'Personal life organizer with AI-suggested activities and planning',
        category: 'productivity',
        icon: <Home className="h-6 w-6" />,
        color: 'bg-pink-500',
        path: '/modules/echo-planner',
        requiredPlan: 'basic',
        comingSoon: true,
      },
      {
        id: 'echo-journal',
        title: 'EchoJournal',
        description: 'Digital journaling with mood tracking and personal insights',
        category: 'content',
        icon: <Newspaper className="h-6 w-6" />,
        color: 'bg-orange-500',
        path: '/modules/echo-journal',
        requiredPlan: 'pro',
        comingSoon: true,
      },
    ];

    switch (currentRole) {
      case 'work':
        return [...baseModules, ...workModules];
      case 'school':
        return [...baseModules, ...schoolModules];
      case 'personal':
        return [...baseModules, ...personalModules];
      default:
        return baseModules;
    }
  }, [currentRole]);

  // Group modules by category
  const groupedModules: Record<ModuleCategory, Module[]> = useMemo(() => ({
    content: modules.filter(m => m.category === 'content'),
    social: modules.filter(m => m.category === 'social'),
    productivity: modules.filter(m => m.category === 'productivity'),
    development: modules.filter(m => m.category === 'development'),
  }), [modules]);

  // Handler for "Coming Soon" clicks
  const handleModuleClick = useCallback((module: Module) => {
    if (module.comingSoon) {
      toast({
        title: 'Coming Soon',
        description: `${module.title} is currently under development and will be available soon.`,
      });
    }
  }, [toast]);

  // Handle role change from RoleSwitch component
  const handleRoleChange = useCallback((newRole: Role) => {
    setCurrentRole(newRole);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Modules</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Discover and access Echoverse&apos;s powerful modules
          </p>
        </div>
        <RoleSwitch 
          title="Current Context" 
          currentRole={currentRole} 
          onChange={handleRoleChange} 
        />
      </div>

      {Object.entries(groupedModules).map(([category, modules]) => (
        modules.length > 0 && (
          <section key={category} className="space-y-4" aria-label={`${category} modules`}>
            <h2 className="text-xl font-semibold capitalize">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map(module => {
                const textColorClass = COLOR_TEXT_MAP[module.color] || 'text-gray-700';
                return (
                  <Card 
                    key={module.id} 
                    className={`overflow-hidden ${module.comingSoon ? 'opacity-80 cursor-not-allowed' : ''}`}
                    role="region"
                    aria-labelledby={`${module.id}-title`}
                  >
                    <div className={`h-2 ${module.color}`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg ${module.color} bg-opacity-10 ${textColorClass}`}>
                          {module.icon}
                        </div>
                        <div className="flex space-x-2">
                          {module.isNew && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
                              New
                            </span>
                          )}
                          {module.comingSoon && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs rounded-full">
                              Coming Soon
                            </span>
                          )}
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 text-xs rounded-full">
                            {module.requiredPlan.charAt(0).toUpperCase() + module.requiredPlan.slice(1)}
                          </span>
                        </div>
                      </div>
                      <CardTitle id={`${module.id}-title`} className="mt-2">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      {module.comingSoon ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleModuleClick(module)}
                          aria-disabled="true"
                          tabIndex={-1}
                        >
                          Coming Soon
                        </Button>
                      ) : (
                        <Link href={module.path} aria-label={`Open ${module.title} module`}>
                          <Button className="w-full" as="a">
                            Open Module
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )
      ))}
    </div>
  );
}
