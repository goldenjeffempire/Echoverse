// client/src/types/dashboard.ts

export interface MetricItem {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  change: {
    value: number;
    isPositive: boolean;
    text: string;
  };
}

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target: string;
  comment?: string;
  timestamp: Date;
}

export type Priority = "high" | "medium" | "normal";

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: Priority;
  completed: boolean;
  assignee: {
    name: string;
    avatar?: string;
  };
}

export type ProjectStatus = "On Track" | "At Risk" | "Delayed";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: Date;
  team: {
    id: string;
    avatar?: string;
    name: string;
  }[];
}
