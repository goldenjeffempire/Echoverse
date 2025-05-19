import { useWebSocket } from '@/hooks/use-websocket';
import { LineChart, BarChart } from '@/components/ui/chart';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function AnalyticsDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={[
                { name: 'Mon', value: 100 },
                { name: 'Tue', value: 120 },
                { name: 'Wed', value: 150 },
              ]}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,234</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unique Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">567</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">45%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}