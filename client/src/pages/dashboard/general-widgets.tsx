import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function GeneralWidgets() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/general/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/general/notifications");
      return res.json();
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p>Nothing new here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {notifications.slice(0, 5).map(note => (
                <li key={note.id}>🔔 {note.message}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
