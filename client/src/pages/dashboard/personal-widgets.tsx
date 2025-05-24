import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface JournalEntry {
  id: string;
  title: string;
  date: string;
}

export function PersonalWidgets() {
  const { data: journalEntries = [], isLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ["/api/personal/journal"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/personal/journal");
      if (!res.ok) throw new Error("Failed to fetch journal entries");
      return res.json();
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load journal entries.</p>
        </CardContent>
      </Card>
    );
  }

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
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {journalEntries.slice(0, 5).map(({ id, date, title }) => (
                <li key={id}>
                  ✍️ {new Date(date).toLocaleDateString()} - {title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
