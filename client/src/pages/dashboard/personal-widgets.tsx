import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function PersonalGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Welcome, {username}</h1>
      <p className="text-muted-foreground">Hope your day is as smooth as your code ✨</p>
    </div>
  );
}

export function PersonalMetrics({ metrics }: { metrics: any[] }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((stat, i) => (
        <Card key={i} className="bg-dark-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PersonalProjects({ projects }: { projects: any[] }) {
  if (!projects.length) {
    return <p className="text-sm text-muted-foreground">No active projects yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Projects</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project: any) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                {project.status}
              </div>
              <Progress value={project.progress} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PersonalTasks({ tasks }: { tasks: any[] }) {
  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground">All caught up! 🎉</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tasks</h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex justify-between items-center border p-3 rounded-md bg-muted/10"
          >
            <span>{task.title}</span>
            <span className="text-xs text-muted-foreground">{task.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
