import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  MoreHorizontal, 
  ChevronDown, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Tag, 
  User, 
  MessageSquare, 
  Paperclip, 
  ArrowUpRight, 
  Edit, 
  Trash2, 
  Filter, 
  Search, 
  XCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Types
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  subtasks?: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface Column {
  id: Status;
  title: string;
  tasks: Task[];
}

const statusMap: Record<Status, { title: string, color: string }> = {
  backlog: { title: 'Backlog', color: 'bg-neutral-200 dark:bg-neutral-800' },
  todo: { title: 'To Do', color: 'bg-blue-200 dark:bg-blue-900' },
  in_progress: { title: 'In Progress', color: 'bg-amber-200 dark:bg-amber-900' },
  in_review: { title: 'In Review', color: 'bg-purple-200 dark:bg-purple-900' },
  done: { title: 'Done', color: 'bg-green-200 dark:bg-green-900' },
};

const priorityMap: Record<Priority, { title: string, color: string, icon: React.ReactNode }> = {
  low: { 
    title: 'Low', 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950', 
    icon: <div className="h-2 w-2 rounded-full bg-blue-400" /> 
  },
  medium: { 
    title: 'Medium', 
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950', 
    icon: <div className="h-2 w-2 rounded-full bg-green-400" /> 
  },
  high: { 
    title: 'High', 
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950', 
    icon: <div className="h-2 w-2 rounded-full bg-amber-400" /> 
  },
  urgent: { 
    title: 'Urgent', 
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950', 
    icon: <div className="h-2 w-2 rounded-full bg-red-400" /> 
  },
};

// Mock Data
const mockMembers: Member[] = [
  {
    id: 'user1',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    role: 'Product Manager'
  },
  {
    id: 'user2',
    name: 'Michael Chen',
    email: 'michael.c@company.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    role: 'Developer'
  },
  {
    id: 'user3',
    name: 'Emily Rodriguez',
    email: 'emily.r@company.com',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    role: 'Designer'
  },
  {
    id: 'user4',
    name: 'David Kim',
    email: 'david.k@company.com',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    role: 'Developer'
  },
  {
    id: 'user5',
    name: 'Lisa Taylor',
    email: 'lisa.t@company.com',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    role: 'QA Engineer'
  }
];

const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'Implement user authentication',
    description: 'Add user authentication functionality with email and password login, as well as social media login options.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'user2',
    reporterId: 'user1',
    dueDate: new Date('2025-05-25'),
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-15'),
    tags: ['backend', 'security'],
    comments: [
      {
        id: 'comment1',
        authorId: 'user1',
        content: 'Please make sure to implement both email and Google authentication.',
        createdAt: new Date('2025-05-10')
      },
      {
        id: 'comment2',
        authorId: 'user2',
        content: 'I\'ve started working on email authentication. Will add Google auth next.',
        createdAt: new Date('2025-05-12')
      }
    ],
    attachments: [
      {
        id: 'attachment1',
        name: 'auth-diagram.png',
        url: 'https://example.com/auth-diagram.png',
        fileType: 'image/png',
        uploadedAt: new Date('2025-05-02'),
        uploadedBy: 'user1'
      }
    ],
    subtasks: [
      {
        id: 'subtask1',
        title: 'Implement email/password authentication',
        completed: true
      },
      {
        id: 'subtask2',
        title: 'Add Google OAuth integration',
        completed: false
      },
      {
        id: 'subtask3',
        title: 'Create user profile page',
        completed: false
      }
    ]
  },
  {
    id: 'task2',
    title: 'Design homepage layout',
    description: 'Create a responsive homepage design that highlights key product features and encourages sign-ups.',
    status: 'in_review',
    priority: 'medium',
    assigneeId: 'user3',
    reporterId: 'user1',
    dueDate: new Date('2025-05-20'),
    createdAt: new Date('2025-05-03'),
    updatedAt: new Date('2025-05-14'),
    tags: ['design', 'frontend'],
    comments: [
      {
        id: 'comment3',
        authorId: 'user3',
        content: 'I\'ve completed the initial design. Please review.',
        createdAt: new Date('2025-05-14')
      }
    ],
    attachments: [
      {
        id: 'attachment2',
        name: 'homepage-mockup.fig',
        url: 'https://example.com/homepage-mockup.fig',
        fileType: 'application/figma',
        uploadedAt: new Date('2025-05-14'),
        uploadedBy: 'user3'
      }
    ],
    subtasks: [
      {
        id: 'subtask4',
        title: 'Create wireframes',
        completed: true
      },
      {
        id: 'subtask5',
        title: 'Design high-fidelity mockups',
        completed: true
      },
      {
        id: 'subtask6',
        title: 'Get feedback from stakeholders',
        completed: false
      }
    ]
  },
  {
    id: 'task3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure continuous integration and deployment pipeline for automated testing and deployment.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'user4',
    reporterId: 'user1',
    dueDate: new Date('2025-05-30'),
    createdAt: new Date('2025-05-05'),
    updatedAt: new Date('2025-05-05'),
    tags: ['devops', 'infrastructure'],
    comments: [],
    attachments: [],
    subtasks: [
      {
        id: 'subtask7',
        title: 'Set up GitHub Actions',
        completed: false
      },
      {
        id: 'subtask8',
        title: 'Configure test automation',
        completed: false
      },
      {
        id: 'subtask9',
        title: 'Set up deployment to staging environment',
        completed: false
      }
    ]
  },
  {
    id: 'task4',
    title: 'Write API documentation',
    description: 'Create comprehensive documentation for the REST API endpoints with examples and schema definitions.',
    status: 'backlog',
    priority: 'low',
    assigneeId: undefined,
    reporterId: 'user1',
    createdAt: new Date('2025-05-07'),
    updatedAt: new Date('2025-05-07'),
    tags: ['documentation', 'backend'],
    comments: [],
    attachments: [],
    subtasks: []
  },
  {
    id: 'task5',
    title: 'Fix navigation menu on mobile devices',
    description: 'The navigation menu isn\'t displaying correctly on mobile devices. Fix the responsive behavior.',
    status: 'done',
    priority: 'high',
    assigneeId: 'user2',
    reporterId: 'user5',
    dueDate: new Date('2025-05-12'),
    createdAt: new Date('2025-05-08'),
    updatedAt: new Date('2025-05-12'),
    tags: ['bug', 'frontend'],
    comments: [
      {
        id: 'comment4',
        authorId: 'user2',
        content: 'Fixed the issue with the hamburger menu not appearing on small screens.',
        createdAt: new Date('2025-05-12')
      },
      {
        id: 'comment5',
        authorId: 'user5',
        content: 'Confirmed fixed on various mobile devices.',
        createdAt: new Date('2025-05-12')
      }
    ],
    attachments: [],
    subtasks: [
      {
        id: 'subtask10',
        title: 'Debug hamburger menu issues',
        completed: true
      },
      {
        id: 'subtask11',
        title: 'Test on multiple devices',
        completed: true
      }
    ]
  },
  {
    id: 'task6',
    title: 'Implement dark mode support',
    description: 'Add dark mode support across the entire application with theme toggle functionality.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'user3',
    reporterId: 'user1',
    dueDate: new Date('2025-06-05'),
    createdAt: new Date('2025-05-10'),
    updatedAt: new Date('2025-05-10'),
    tags: ['design', 'frontend'],
    comments: [],
    attachments: [],
    subtasks: [
      {
        id: 'subtask12',
        title: 'Create dark color palette',
        completed: true
      },
      {
        id: 'subtask13',
        title: 'Implement theme context',
        completed: false
      },
      {
        id: 'subtask14',
        title: 'Add UI toggle',
        completed: false
      }
    ]
  }
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: undefined,
    tags: [],
    subtasks: []
  });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Initialize columns state
  useEffect(() => {
    const statuses = Object.keys(statusMap) as Status[];
    
    const initialColumns: Column[] = statuses.map(status => ({
      id: status,
      title: statusMap[status].title,
      tasks: mockTasks.filter(task => task.status === status)
    }));
    
    setColumns(initialColumns);
    
    // Extract all unique tags
    const tagSet = new Set<string>();
    mockTasks.forEach(task => {
      task.tags.forEach(tag => tagSet.add(tag));
    });
    setAllTags(Array.from(tagSet));
  }, []);

  // Get filtered tasks for each column
  const getFilteredTasks = (columnTasks: Task[]): Task[] => {
    return columnTasks.filter(task => {
      // Search filter
      const matchesSearch = 
        !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Assignee filter
      const matchesAssignee = !filterAssignee || task.assigneeId === filterAssignee;
      
      // Tag filter
      const matchesTag = !filterTag || task.tags.includes(filterTag);
      
      // Priority filter
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      
      return matchesSearch && matchesAssignee && matchesTag && matchesPriority;
    });
  };

  // Get member by ID
  const getMemberById = (id?: string): Member | undefined => {
    if (!id) return undefined;
    return members.find(member => member.id === id);
  };

  // Format date
  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: Status) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: Status) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    
    // Find the task and update its status
    const updatedColumns = columns.map(column => {
      // Remove task from its original column
      const taskToMove = column.tasks.find(task => task.id === draggedTaskId);
      
      if (taskToMove) {
        // Update task status
        const updatedTask = { ...taskToMove, status: columnId, updatedAt: new Date() };
        
        // Remove from original column
        const updatedOriginalColumn = {
          ...column,
          tasks: column.tasks.filter(task => task.id !== draggedTaskId)
        };
        
        return updatedOriginalColumn;
      }
      
      // Add task to new column if this is the target column
      if (column.id === columnId) {
        const task = columns.flatMap(col => col.tasks).find(t => t.id === draggedTaskId);
        if (task) {
          const updatedTask = { ...task, status: columnId, updatedAt: new Date() };
          return {
            ...column,
            tasks: [...column.tasks, updatedTask]
          };
        }
      }
      
      return column;
    });
    
    setColumns(updatedColumns);
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    
    // In a real app, you would update the task status on the server
    // apiRequest('PATCH', `/api/tasks/${draggedTaskId}`, { status: columnId });
  };

  // Handle adding comment
  const handleAddComment = async () => {
    if (!activeTask || !newComment.trim()) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest('POST', `/api/tasks/${activeTask.id}/comments`, {
      //   content: newComment
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCommentObj: Comment = {
        id: `comment${Date.now()}`,
        authorId: 'user2', // This would be the current user in a real app
        content: newComment,
        createdAt: new Date()
      };
      
      const updatedTask = {
        ...activeTask,
        comments: [...activeTask.comments, newCommentObj],
        updatedAt: new Date()
      };
      
      // Update task in columns
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: column.tasks.map(task => 
          task.id === activeTask.id ? updatedTask : task
        )
      }));
      
      setColumns(updatedColumns);
      setActiveTask(updatedTask);
      setNewComment('');
      setIsAddingComment(false);
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the task.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggle subtask
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!activeTask) return;
    
    const updatedTask = {
      ...activeTask,
      subtasks: activeTask.subtasks?.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed } : subtask
      ) || [],
      updatedAt: new Date()
    };
    
    // Update task in columns
    const updatedColumns = columns.map(column => ({
      ...column,
      tasks: column.tasks.map(task => 
        task.id === activeTask.id ? updatedTask : task
      )
    }));
    
    setColumns(updatedColumns);
    setActiveTask(updatedTask);
    
    // In a real app, you would update the subtask on the server
    // await apiRequest('PATCH', `/api/tasks/${activeTask.id}/subtasks/${subtaskId}`, { completed });
  };

  // Handle save task (create or update)
  const handleSaveTask = async () => {
    if (!newTaskData.title || !newTaskData.status || !newTaskData.priority) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title, status, and priority for the task.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isCreatingTask) {
        // Create new task
        const newTask: Task = {
          id: `task${Date.now()}`,
          title: newTaskData.title || '',
          description: newTaskData.description || '',
          status: newTaskData.status as Status,
          priority: newTaskData.priority as Priority,
          assigneeId: newTaskData.assigneeId,
          reporterId: 'user2', // This would be the current user in a real app
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: newTaskData.tags || [],
          comments: [],
          attachments: [],
          subtasks: newTaskData.subtasks || []
        };
        
        // Update columns
        const updatedColumns = columns.map(column => {
          if (column.id === newTask.status) {
            return {
              ...column,
              tasks: [...column.tasks, newTask]
            };
          }
          return column;
        });
        
        setColumns(updatedColumns);
        
        // Update allTags if new tags were added
        if (newTask.tags.length > 0) {
          const updatedTags = [...allTags];
          newTask.tags.forEach(tag => {
            if (!updatedTags.includes(tag)) {
              updatedTags.push(tag);
            }
          });
          setAllTags(updatedTags);
        }
        
        toast({
          title: 'Task Created',
          description: 'Your new task has been created successfully.',
        });
        
        // In a real app, you would create the task on the server
        // const response = await apiRequest('POST', '/api/tasks', newTask);
      } else if (isEditingTask && activeTask) {
        // Update existing task
        const updatedTask: Task = {
          ...activeTask,
          title: newTaskData.title || activeTask.title,
          description: newTaskData.description || activeTask.description,
          status: newTaskData.status as Status || activeTask.status,
          priority: newTaskData.priority as Priority || activeTask.priority,
          assigneeId: newTaskData.assigneeId,
          dueDate: newTaskData.dueDate,
          tags: newTaskData.tags || activeTask.tags,
          subtasks: newTaskData.subtasks || activeTask.subtasks,
          updatedAt: new Date()
        };
        
        // Update columns
        const updatedColumns = columns.map(column => {
          // Remove from old column
          const filteredTasks = column.tasks.filter(task => task.id !== activeTask.id);
          
          // Add to new column if status changed
          if (column.id === updatedTask.status) {
            return {
              ...column,
              tasks: [...filteredTasks, updatedTask]
            };
          }
          
          return {
            ...column,
            tasks: filteredTasks
          };
        });
        
        setColumns(updatedColumns);
        setActiveTask(updatedTask);
        
        // Update allTags if new tags were added
        if (updatedTask.tags.length > 0) {
          const updatedTags = [...allTags];
          updatedTask.tags.forEach(tag => {
            if (!updatedTags.includes(tag)) {
              updatedTags.push(tag);
            }
          });
          setAllTags(updatedTags);
        }
        
        toast({
          title: 'Task Updated',
          description: 'The task has been updated successfully.',
        });
        
        // In a real app, you would update the task on the server
        // const response = await apiRequest('PATCH', `/api/tasks/${activeTask.id}`, {
        //   title: newTaskData.title,
        //   description: newTaskData.description,
        //   // ... other fields
        // });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsCreatingTask(false);
      setIsEditingTask(false);
      setNewTaskData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: undefined,
        tags: [],
        subtasks: []
      });
    }
  };

  // Handle opening task dialog
  const handleOpenTaskDialog = (task: Task) => {
    setActiveTask(task);
    setIsTaskDialogOpen(true);
  };

  // Handle closing task dialog
  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setActiveTask(null);
    setIsAddingComment(false);
    setNewComment('');
  };

  // Handle editing task
  const handleEditTask = () => {
    if (!activeTask) return;
    
    setNewTaskData({
      title: activeTask.title,
      description: activeTask.description,
      status: activeTask.status,
      priority: activeTask.priority,
      assigneeId: activeTask.assigneeId,
      dueDate: activeTask.dueDate,
      tags: [...activeTask.tags],
      subtasks: activeTask.subtasks ? [...activeTask.subtasks] : []
    });
    
    setIsEditingTask(true);
    setIsTaskDialogOpen(false);
  };

  // Handle creating task
  const handleCreateTask = () => {
    setIsCreatingTask(true);
    setNewTaskData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: undefined,
      tags: [],
      subtasks: []
    });
  };

  // Handle adding subtask
  const handleAddSubtask = () => {
    if (!newTaskData.subtasks) {
      newTaskData.subtasks = [];
    }
    
    setNewTaskData({
      ...newTaskData,
      subtasks: [
        ...newTaskData.subtasks,
        {
          id: `subtask${Date.now()}`,
          title: '',
          completed: false
        }
      ]
    });
  };

  // Handle updating subtask
  const handleUpdateSubtask = (index: number, title: string) => {
    if (!newTaskData.subtasks) return;
    
    const updatedSubtasks = [...newTaskData.subtasks];
    updatedSubtasks[index] = {
      ...updatedSubtasks[index],
      title
    };
    
    setNewTaskData({
      ...newTaskData,
      subtasks: updatedSubtasks
    });
  };

  // Handle removing subtask
  const handleRemoveSubtask = (index: number) => {
    if (!newTaskData.subtasks) return;
    
    const updatedSubtasks = [...newTaskData.subtasks];
    updatedSubtasks.splice(index, 1);
    
    setNewTaskData({
      ...newTaskData,
      subtasks: updatedSubtasks
    });
  };

  // Handle adding tag
  const handleAddTag = (tag: string) => {
    if (!newTaskData.tags) {
      newTaskData.tags = [];
    }
    
    if (!newTaskData.tags.includes(tag)) {
      setNewTaskData({
        ...newTaskData,
        tags: [...newTaskData.tags, tag]
      });
    }
  };

  // Handle removing tag
  const handleRemoveTag = (tag: string) => {
    if (!newTaskData.tags) return;
    
    setNewTaskData({
      ...newTaskData,
      tags: newTaskData.tags.filter(t => t !== tag)
    });
  };

  // Calculate completion percentage for a task
  const calculateCompletionPercentage = (task: Task): number => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    
    const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Project Kanban Board</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage and track project tasks</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden md:inline">View</span>
            </Button>
            <Button onClick={handleCreateTask} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">Add Task</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-4 py-3 border-b">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={filterAssignee || ''}
            onValueChange={(value) => setFilterAssignee(value === '' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Assignees</SelectItem>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filterTag || ''}
            onValueChange={(value) => setFilterTag(value === '' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filterPriority || ''}
            onValueChange={(value) => setFilterPriority(value === '' ? null : value as Priority)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              {Object.entries(priorityMap).map(([key, data]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {data.icon}
                    {data.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Clear filters button */}
          {(filterAssignee || filterTag || filterPriority || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterAssignee(null);
                setFilterTag(null);
                setFilterPriority(null);
                setSearchQuery('');
              }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full p-4 gap-4 min-w-max">
          {columns.map(column => {
            const filteredTasks = getFilteredTasks(column.tasks);
            const isDraggingOver = dragOverColumnId === column.id;
            
            return (
              <div
                key={column.id}
                className={`flex flex-col w-80 h-full rounded-lg ${isDraggingOver ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column header */}
                <div className={`p-3 rounded-t-lg ${statusMap[column.id].color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs bg-white/70 dark:bg-black/30">
                      {filteredTasks.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Column content */}
                <div className="flex-1 p-2 overflow-y-auto space-y-2 bg-neutral-50 dark:bg-neutral-900 rounded-b-lg">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-neutral-800 rounded-md shadow-sm border cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handleOpenTaskDialog(task)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-medium flex-1">{task.title}</h4>
                          <Badge className={`${priorityMap[task.priority].color} flex items-center gap-1 whitespace-nowrap`}>
                            {priorityMap[task.priority].icon}
                            {priorityMap[task.priority].title}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                              <span>Subtasks</span>
                              <span>
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${calculateCompletionPercentage(task)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs bg-neutral-50 dark:bg-neutral-900">{tag}</Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          {task.dueDate ? (
                            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(task.dueDate)}
                            </div>
                          ) : (
                            <div></div>
                          )}
                          
                          {task.assigneeId ? (
                            <Avatar className="h-6 w-6">
                              {getMemberById(task.assigneeId)?.avatar ? (
                                <AvatarImage src={getMemberById(task.assigneeId)?.avatar} alt={getMemberById(task.assigneeId)?.name} />
                              ) : (
                                <AvatarFallback>
                                  {getMemberById(task.assigneeId)?.name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ) : (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-500">
                                ?
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTasks.length === 0 && (
                    <div className="h-20 flex items-center justify-center">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-auto">
          {activeTask && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle className="text-xl">{activeTask.title}</DialogTitle>
                  <Badge className={`${priorityMap[activeTask.priority].color} flex items-center gap-1`}>
                    {priorityMap[activeTask.priority].icon}
                    {priorityMap[activeTask.priority].title}
                  </Badge>
                </div>
                <DialogDescription>
                  {statusMap[activeTask.status].title} • Created {formatDate(activeTask.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md text-neutral-700 dark:text-neutral-300 whitespace-pre-line min-h-[80px]">
                    {activeTask.description || <span className="text-neutral-400 italic">No description provided</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {activeTask.assigneeId && getMemberById(activeTask.assigneeId)?.avatar ? (
                          <AvatarImage src={getMemberById(activeTask.assigneeId)?.avatar} alt={getMemberById(activeTask.assigneeId)?.name} />
                        ) : (
                          <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-500">
                            {activeTask.assigneeId ? getMemberById(activeTask.assigneeId)?.name?.charAt(0) : '?'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {activeTask.assigneeId ? (
                        <div className="text-sm">
                          <div className="font-medium">{getMemberById(activeTask.assigneeId)?.name}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {getMemberById(activeTask.assigneeId)?.role}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Unassigned</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      {activeTask.dueDate ? (
                        <span>{formatDate(activeTask.dueDate)}</span>
                      ) : (
                        <span className="text-neutral-500 dark:text-neutral-400">No due date</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reporter</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {getMemberById(activeTask.reporterId)?.avatar ? (
                          <AvatarImage src={getMemberById(activeTask.reporterId)?.avatar} alt={getMemberById(activeTask.reporterId)?.name} />
                        ) : (
                          <AvatarFallback>{getMemberById(activeTask.reporterId)?.name?.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">{getMemberById(activeTask.reporterId)?.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className={`px-3 py-1.5 rounded-md inline-block ${statusMap[activeTask.status].color}`}>
                      {statusMap[activeTask.status].title}
                    </div>
                  </div>
                </div>
                
                {activeTask.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeTask.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-neutral-50 dark:bg-neutral-900">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Subtasks</Label>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {activeTask.subtasks.filter(s => s.completed).length}/{activeTask.subtasks.length} completed
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {activeTask.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                          />
                          <span className={`text-sm ${subtask.completed ? 'line-through text-neutral-500 dark:text-neutral-400' : ''}`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Comments</Label>
                  
                  {activeTask.comments.length > 0 ? (
                    <div className="space-y-4">
                      {activeTask.comments.map(comment => {
                        const author = getMemberById(comment.authorId);
                        return (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              {author?.avatar ? (
                                <AvatarImage src={author.avatar} alt={author.name} />
                              ) : (
                                <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-sm">{author?.name}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {getRelativeTime(comment.createdAt)}
                                </div>
                              </div>
                              <div className="mt-1 text-neutral-700 dark:text-neutral-300 text-sm">
                                {comment.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                      No comments yet
                    </div>
                  )}
                  
                  {isAddingComment ? (
                    <div className="space-y-3">
                      <Textarea
                        ref={commentInputRef}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingComment(false);
                            setNewComment('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              Adding...
                            </>
                          ) : 'Add Comment'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsAddingComment(true);
                        setTimeout(() => {
                          commentInputRef.current?.focus();
                        }, 0);
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Comment
                    </Button>
                  )}
                </div>
                
                {activeTask.attachments.length > 0 && (
                  <div className="space-y-3">
                    <Label>Attachments</Label>
                    <div className="space-y-2">
                      {activeTask.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm">{attachment.name}</span>
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-between">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Last updated: {formatDate(activeTask.updatedAt)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCloseTaskDialog}>
                    Close
                  </Button>
                  <Button onClick={handleEditTask}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit/Create Task Dialog */}
      <Dialog open={isEditingTask || isCreatingTask} onOpenChange={(open) => {
        if (!open) {
          setIsEditingTask(false);
          setIsCreatingTask(false);
          setNewTaskData({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            assigneeId: undefined,
            tags: [],
            subtasks: []
          });
        }
      }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{isCreatingTask ? 'Create New Task' : 'Edit Task'}</DialogTitle>
            <DialogDescription>
              {isCreatingTask ? 'Add a new task to the board' : 'Update the selected task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                placeholder="Task title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                placeholder="Task description"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskStatus">Status</Label>
                <Select
                  value={newTaskData.status}
                  onValueChange={(value: Status) => setNewTaskData({...newTaskData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([key, data]) => (
                      <SelectItem key={key} value={key}>
                        {data.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskPriority">Priority</Label>
                <Select
                  value={newTaskData.priority}
                  onValueChange={(value: Priority) => setNewTaskData({...newTaskData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityMap).map(([key, data]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {data.icon}
                          {data.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskAssignee">Assignee</Label>
                <Select
                  value={newTaskData.assigneeId || ''}
                  onValueChange={(value) => setNewTaskData({...newTaskData, assigneeId: value || undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            {member.avatar ? (
                              <AvatarImage src={member.avatar} alt={member.name} />
                            ) : (
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskDueDate">Due Date (Optional)</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTaskData.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="h-3 w-3 rounded-full bg-neutral-400 text-white flex items-center justify-center hover:bg-neutral-500"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Tag className="mr-2 h-4 w-4" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tag..." />
                      <CommandEmpty>No tag found.</CommandEmpty>
                      <CommandGroup>
                        {allTags.map(tag => (
                          <CommandItem
                            key={tag}
                            onSelect={() => handleAddTag(tag)}
                            className="cursor-pointer"
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Add new tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleAddTag(e.currentTarget.value.trim().toLowerCase());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Subtasks</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtask}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subtask
                </Button>
              </div>
              
              <div className="space-y-2">
                {newTaskData.subtasks?.map((subtask, index) => (
                  <div key={subtask.id} className="flex gap-2">
                    <Input
                      value={subtask.title}
                      onChange={(e) => handleUpdateSubtask(index, e.target.value)}
                      placeholder={`Subtask ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubtask(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(!newTaskData.subtasks || newTaskData.subtasks.length === 0) && (
                  <div className="text-center py-2 text-sm text-neutral-500 dark:text-neutral-400">
                    No subtasks added yet
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingTask(false);
                setIsCreatingTask(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : isCreatingTask ? 'Create Task' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Command component (simplified)
function Command({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-md overflow-hidden">{children}</div>;
}

function CommandInput({ placeholder }: { placeholder: string }) {
  return <Input className="border-0 focus-visible:ring-0" placeholder={placeholder} />;
}

function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm">{children}</div>;
}

function CommandGroup({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden overflow-y-auto max-h-[200px]">{children}</div>;
}

function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <div
      className="px-2 py-1.5 text-sm rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center"
      onClick={onSelect}
    >
      {children}
    </div>
  );
}