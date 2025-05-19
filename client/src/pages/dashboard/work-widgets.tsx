import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export function WorkGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome back, {username}</h2>
      <p className="text-muted-foreground">Let’s get that bread 🥖</p>
    </div>
  );
}

export function WorkBoard({ tasks = [] }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No active tasks.</p>;
  }

  const grouped = tasks.reduce((acc: Record<string, any[]>, task) => {
    const status = task.status || 'To Do';
    acc[status] = acc[status] || [];
    acc[status].push(task);
    return acc;
  }, {});

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Kanban Board</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(grouped).map((status) => (
            <div key={status} className="space-y-2">
              <h4 className="text-sm font-semibold">{status}</h4>
              {grouped[status].map((task, idx) => (
                <div
                  key={idx}
                  className="p-2 border border-muted rounded-md bg-card text-sm"
                >
                  {task.title}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkAgenda({ meetings = [] }: { meetings: any[] }) {
  if (meetings.length === 0) {
    return <p className="text-sm text-muted-foreground mt-4">No meetings scheduled today.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Today’s Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetings.map((meeting, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>{meeting.title}</span>
            <span className="text-muted-foreground">
              {new Date(meeting.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
