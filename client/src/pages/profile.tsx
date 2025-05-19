
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>User Name</CardTitle>
            <p className="text-sm text-muted-foreground">user@example.com</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-4">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <div className="space-y-4">
                {/* Activity items would go here */}
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <Button>Edit Profile</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
