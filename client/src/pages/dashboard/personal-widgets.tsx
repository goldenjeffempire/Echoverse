import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function PersonalWidgets() {
  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ["/api/personal/journal"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/personal/journal");
      return res.json();
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading journals...</p>
          ) : journalEntries.length === 0 ? (
            <p>No journal entries yet. Start writing!</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {journalEntries.slice(0, 5).map(entry => (
                <li key={entry.id}>
                  ✍️ {new Date(entry.date).toLocaleDateString()} - {entry.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
