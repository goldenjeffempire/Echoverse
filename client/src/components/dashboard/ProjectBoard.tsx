import { formatDate } from '@/lib/utils';
import { CircleDot, Calendar, MoreHorizontal } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { Project, ProjectStatus } from '@/types';

type ProjectBoardProps = {
  projects: Project[];
};

const getStatusBadgeClasses = (status: ProjectStatus) => {
  switch (status) {
    case 'On Track':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'At Risk':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'Delayed':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
};

const getProgressBarColor = (status: ProjectStatus) => {
  switch (status) {
    case 'On Track':
      return 'bg-green-500';
    case 'At Risk':
      return 'bg-amber-500';
    case 'Delayed':
      return 'bg-rose-500';
    default:
      return 'bg-blue-500';
  }
};

export default function ProjectBoard({ projects }: ProjectBoardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Track your active projects</CardDescription>
        </div>
        <Button size="sm" variant="outline">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {project.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Project</DropdownMenuItem>
                    <DropdownMenuItem>Share Project</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center ${getStatusBadgeClasses(project.status)}`}>
                  <CircleDot className="mr-1 h-3 w-3" />
                  {project.status}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  Due {formatDate(project.dueDate)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className={getProgressBarColor(project.status)} />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {project.team.map((member) => (
                    <div 
                      key={member.id} 
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-800 overflow-hidden"
                      title={member.name}
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button size="sm" variant="ghost">View Details</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}