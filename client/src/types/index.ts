// User types
export type UserRole = 'work' | 'personal' | 'school' | 'general';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  plan: string;
};

// Dashboard types
export type MetricItem = {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  change: {
    value: number;
    isPositive: boolean;
    text: string;
  };
};

export type ActivityItem = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  comment?: string;
  timestamp: Date;
};

export type Priority = 'high' | 'medium' | 'normal';

export type Task = {
  id: string;
  title: string;
  dueDate: Date;
  priority: Priority;
  completed: boolean;
  assignee: {
    name: string;
    avatar: string;
  };
};

export type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed';

export type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: Date;
  team: {
    id: string;
    avatar: string;
    name: string;
  }[];
};

// Module types
export type Module = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'rose';
  href: string;
};

// Chat types
export type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isThinking?: boolean;
};

// Subscription types
export type Subscription = {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  renewalDate: Date;
  credits: {
    used: number;
    total: number;
  };
};
