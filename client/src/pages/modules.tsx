import { useState, useEffect } from 'react';
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
  Briefcase,
  GraduationCap,
  Home,
  Globe,
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
  color: string;
  path: string;
  requiredPlan: 'free' | 'basic' | 'pro' | 'enterprise';
  isNew?: boolean;
  comingSoon?: boolean;
}

export default function ModulesPage() {
  const [currentRole, setCurrentRole] = useState<string>('work');
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Get user data on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      // Set the current role from user if available
      const userObj = JSON.parse(userData);
      if (userObj.currentRole) {
        setCurrentRole(userObj.currentRole);
      }
    }
  }, []);

  // Different modules based on roles
  const getModules = (): Module[] => {
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
      }
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
      }
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
      }
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
      }
    ];

    // Return different modules based on role
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
  };

  const modules = getModules();

  // Group modules by category
  const groupedModules: Record<ModuleCategory, Module[]> = {
    content: modules.filter(m => m.category === 'content'),
    social: modules.filter(m => m.category === 'social'),
    productivity: modules.filter(m => m.category === 'productivity'),
    development: modules.filter(m => m.category === 'development'),
  };

  // Function to handle module click for coming soon modules
  const handleModuleClick = (module: Module) => {
    if (module.comingSoon) {
      toast({
        title: 'Coming Soon',
        description: `${module.title} is currently under development and will be available soon.`,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Modules</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Discover and access Echoverse's powerful modules
          </p>
        </div>
        <RoleSwitch title="Current Context" currentRole={currentRole} />
      </div>

      {Object.entries(groupedModules).map(([category, modules]) => (
        modules.length > 0 && (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold capitalize">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map(module => (
                <Card 
                  key={module.id} 
                  className={`overflow-hidden ${module.comingSoon ? 'opacity-80' : ''}`}
                >
                  <div className={`h-2 ${module.color}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-lg ${module.color} bg-opacity-10 text-${module.color.split('-')[1]}-700 dark:text-${module.color.split('-')[1]}-300`}>
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
                    <CardTitle className="mt-2">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    {module.comingSoon ? (
                      <Button variant="outline" className="w-full" onClick={() => handleModuleClick(module)}>
                        Coming Soon
                      </Button>
                    ) : (
                      <Link href={module.path}>
                        <Button className="w-full">
                          Open Module
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}