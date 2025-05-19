import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export function WelcomeGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome, {username}</h2>
      <p className="text-muted-foreground">Here’s what’s happening across the board today.</p>
    </div>
  );
}

export function ActivityCard() {
  const activities = [
    { id: 1, text: 'John updated the Q2 financial forecast.', time: '2 hours ago' },
    { id: 2, text: 'Maria joined the Marketing team.', time: '5 hours ago' },
    { id: 3, text: 'A new product demo is available.', time: 'Yesterday' },
  ];

  return (
    <Card className="bg-muted/10 border-border/10">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="text-sm">
            <p>{activity.text}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
