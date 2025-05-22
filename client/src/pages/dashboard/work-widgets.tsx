import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function WorkWidgets() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/work/tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/work/tasks");
      return res.json();
    }
  });

  const pendingTasks = (tasks || []).filter(task => !task.completed);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading tasks...</p>
          ) : pendingTasks.length === 0 ? (
            <p>You're all caught up! 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pendingTasks.map(task => (
                <li key={task.id}>📝 {task.title}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
