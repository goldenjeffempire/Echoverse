import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, CircleDashed, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Task, Priority } from '@/types';

type TaskListProps = {
  tasks: Task[];
};

const getPriorityStyles = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'normal':
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
};

export default function TaskList({ tasks }: TaskListProps) {
  const [taskItems, setTaskItems] = useState(tasks);

  const toggleTaskCompletion = (id: string) => {
    setTaskItems(
      taskItems.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addNewTask = () => {
    // In a real app, this would open a modal or form to add a new task
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: 'New task',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      priority: 'normal',
      completed: false,
      assignee: {
        name: 'You',
        avatar: ''
      }
    };
    
    setTaskItems([...taskItems, newTask]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Manage your upcoming tasks</CardDescription>
        </div>
        <Button size="sm" onClick={addNewTask}>
          <Plus className="mr-1 h-4 w-4" /> Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {taskItems.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1"
                />
                <div>
                  <h4
                    className={`font-medium ${
                      task.completed ? 'line-through text-neutral-500' : ''
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getPriorityStyles(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-neutral-400" />
                  )}
                  <span className="ml-1 text-sm">
                    {task.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  {task.assignee.avatar ? (
                    <img
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-700 dark:text-neutral-300">
                      {task.assignee.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {taskItems.filter((task) => task.completed).length} of{' '}
          {taskItems.length} tasks completed
        </p>
      </CardFooter>
    </Card>
  );
}