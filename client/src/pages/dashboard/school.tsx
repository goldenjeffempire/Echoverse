import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Users, 
  GraduationCap,
  FileText,
  CheckCircle,
  BarChart
} from 'lucide-react';

import MetricsGrid from '@/components/dashboard/MetricsGrid';
import RoleSwitch from '@/components/dashboard/RoleSwitch';
import AiAssistant from '@/components/chat/AiAssistant';
import type { MetricItem } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Types
interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  nextClass: Date;
  documents: number;
  assignments: {
    total: number;
    completed: number;
  };
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: Date;
  status: 'completed' | 'in_progress' | 'not_started' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

interface StudySession {
  id: string;
  subject: string;
  date: Date;
  duration: number; // in minutes
  topics: string[];
  participants?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

// Mock data
const metrics: MetricItem[] = [
  {
    id: '1',
    title: 'Active Courses',
    value: 4,
    icon: 'projectIcon',
    change: {
      value: 1,
      isPositive: true,
      text: 'from last semester'
    }
  },
  {
    id: '2',
    title: 'Assignments Due',
    value: 3,
    icon: 'taskIcon',
    change: {
      value: 2,
      isPositive: false,
      text: 'this week'
    }
  },
  {
    id: '3',
    title: 'Study Hours',
    value: 16,
    icon: 'creditIcon',
    change: {
      value: 20,
      isPositive: true,
      text: 'vs. last week'
    }
  },
  {
    id: '4',
    title: 'GPA',
    value: '3.8',
    icon: 'productivityIcon',
    change: {
      value: 0.2,
      isPositive: true,
      text: 'from last semester'
    }
  }
];

const courses: Course[] = [
  {
    id: 'course1',
    title: 'Advanced Data Science',
    instructor: 'Dr. Sarah Thompson',
    progress: 65,
    nextClass: new Date('2025-05-20T14:30:00'),
    documents: 18,
    assignments: {
      total: 8,
      completed: 5
    }
  },
  {
    id: 'course2',
    title: 'Modern Literature',
    instructor: 'Prof. Michael Chen',
    progress: 42,
    nextClass: new Date('2025-05-19T10:00:00'),
    documents: 24,
    assignments: {
      total: 6,
      completed: 2
    }
  },
  {
    id: 'course3',
    title: 'Quantum Physics',
    instructor: 'Dr. Eliza Rodriguez',
    progress: 30,
    nextClass: new Date('2025-05-21T13:15:00'),
    documents: 15,
    assignments: {
      total: 5,
      completed: 1
    }
  },
  {
    id: 'course4',
    title: 'Business Ethics',
    instructor: 'Prof. James Wilson',
    progress: 80,
    nextClass: new Date('2025-05-22T09:00:00'),
    documents: 12,
    assignments: {
      total: 4,
      completed: 3
    }
  }
];

const assignments: Assignment[] = [
  {
    id: 'assignment1',
    title: 'Data Visualization Project',
    course: 'Advanced Data Science',
    dueDate: new Date('2025-05-25T23:59:00'),
    status: 'in_progress',
    priority: 'high'
  },
  {
    id: 'assignment2',
    title: 'Literary Analysis Essay',
    course: 'Modern Literature',
    dueDate: new Date('2025-05-26T23:59:00'),
    status: 'not_started',
    priority: 'medium'
  },
  {
    id: 'assignment3',
    title: 'Quantum Mechanics Problem Set',
    course: 'Quantum Physics',
    dueDate: new Date('2025-05-24T23:59:00'),
    status: 'not_started',
    priority: 'high'
  },
  {
    id: 'assignment4',
    title: 'Ethics Case Study Analysis',
    course: 'Business Ethics',
    dueDate: new Date('2025-05-28T23:59:00'),
    status: 'in_progress',
    priority: 'low'
  },
  {
    id: 'assignment5',
    title: 'Machine Learning Algorithm Implementation',
    course: 'Advanced Data Science',
    dueDate: new Date('2025-05-18T23:59:00'),
    status: 'completed',
    priority: 'high'
  },
  {
    id: 'assignment6',
    title: 'Poetry Interpretation Exercise',
    course: 'Modern Literature',
    dueDate: new Date('2025-05-15T23:59:00'),
    status: 'completed',
    priority: 'medium'
  }
];

const studySessions: StudySession[] = [
  {
    id: 'session1',
    subject: 'Quantum Physics',
    date: new Date('2025-05-23T15:00:00'),
    duration: 120,
    topics: ['Wave Functions', 'Schrödinger Equation'],
    participants: [
      {
        id: 'user1',
        name: 'You',
        avatar: ''
      },
      {
        id: 'user2',
        name: 'Alex Chen',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        id: 'user3',
        name: 'Madison Lee',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    id: 'session2',
    subject: 'Advanced Data Science',
    date: new Date('2025-05-24T10:00:00'),
    duration: 90,
    topics: ['Neural Networks', 'Deep Learning Models'],
    participants: [
      {
        id: 'user1',
        name: 'You',
        avatar: ''
      },
      {
        id: 'user4',
        name: 'Jordan Smith',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
      }
    ]
  },
  {
    id: 'session3',
    subject: 'Modern Literature',
    date: new Date('2025-05-25T14:00:00'),
    duration: 60,
    topics: ['Postmodernism', 'Contemporary Authors'],
  }
];

export default function SchoolDashboard() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Get the user from local storage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // In a real app, we would fetch the actual data from the server
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/school'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user, // Only fetch when user exists
  });

  // When there's an error, show a toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Use real data if available, fallback to mock data for development
  const displayData = dashboardData || {
    metrics,
    courses,
    assignments,
    studySessions
  };

  // Helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateTime = (date: Date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">Not Started</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Overdue</Badge>;
    }
  };

  const getPriorityBadge = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">Low</Badge>;
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'not_started':
        return 'bg-neutral-500';
      case 'overdue':
        return 'bg-red-500';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">School Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Welcome back, {user?.displayName || user?.username || 'Student'}
          </p>
        </div>
        <RoleSwitch title="Current Role" currentRole="school" />
      </div>

      <MetricsGrid metrics={displayData.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>
                Track your current courses and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayData.courses.map(course => (
                  <div key={course.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {course.instructor}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Next Class</div>
                        <div className="text-sm font-medium">{formatDateTime(course.nextClass)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-2 text-sm">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-neutral-500" />
                        <span>{course.documents} documents</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-neutral-500" />
                        <span>{course.assignments.completed}/{course.assignments.total} assignments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Upcoming Study Sessions
              </CardTitle>
              <CardDescription>
                Scheduled study sessions and group meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayData.studySessions.map(session => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{session.subject}</h3>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Topics: {session.topics.join(', ')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="mb-2">
                          {formatDuration(session.duration)}
                        </Badge>
                        <div className="text-sm font-medium">
                          {formatDateTime(session.date)}
                        </div>
                      </div>
                    </div>
                    
                    {session.participants && (
                      <div className="mt-3">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                          Participants
                        </div>
                        <div className="flex -space-x-2">
                          {session.participants.map(participant => (
                            <Avatar key={participant.id} className="h-8 w-8 border-2 border-white dark:border-neutral-800">
                              {participant.avatar ? (
                                <AvatarImage src={participant.avatar} alt={participant.name} />
                              ) : (
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule New Session
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5" />
                Assignments
              </CardTitle>
              <CardDescription>
                Track your upcoming assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="space-y-3">
                  {displayData.assignments
                    .filter(a => a.status !== 'completed')
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                    .map(assignment => (
                      <div key={assignment.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {assignment.course}
                            </p>
                          </div>
                          {getPriorityBadge(assignment.priority)}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Due {formatDate(assignment.dueDate)}
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-3">
                  {displayData.assignments
                    .filter(a => a.status === 'completed')
                    .map(assignment => (
                      <div key={assignment.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {assignment.course}
                            </p>
                          </div>
                          {getPriorityBadge(assignment.priority)}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Due {formatDate(assignment.dueDate)}
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="all" className="space-y-3">
                  {displayData.assignments
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                    .map(assignment => (
                      <div key={assignment.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {assignment.course}
                            </p>
                          </div>
                          {getPriorityBadge(assignment.priority)}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Due {formatDate(assignment.dueDate)}
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Track Assignment Progress
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Study Assistant
              </CardTitle>
              <CardDescription>
                AI-powered study help and answers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <AiAssistant />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}