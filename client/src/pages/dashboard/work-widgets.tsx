import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PerformanceMetric {
  id: string;
  metricName: string;
  value: number;
}

export function WorkWidgets() {
  const { data: metrics = [], isLoading, error } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/work/metrics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/work/metrics");
      if (!res.ok) throw new Error("Failed to fetch performance metrics");
      return res.json();
    },
    retry: 1,
    staleTime: 15 * 60 * 1000,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Unable to load performance metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading metrics...</p>
        ) : metrics.length === 0 ? (
          <p>No metrics data available.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {metrics.map(({ id, metricName, value }) => (
              <li key={id}>
                <strong>{metricName}:</strong> {value}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
