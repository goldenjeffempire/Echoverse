import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  // Editable form state initialized with user data
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    username: user?.username || "",
    role: user?.role || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user data into formData when user changes (important if user updates externally)
  // (Optional: you could use useEffect here)
  
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      // Call your updateUser function (should handle API call, local state update)
      await updateUser(formData);
      setEditOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="container py-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.avatar || "/placeholder-avatar.jpg"} />
            <AvatarFallback>{user?.username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {user?.fullName || user?.username || "User Name"}
            </h1>
            <p className="text-muted-foreground">{user?.role || "Role Unknown"}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <p className="text-muted-foreground">{user?.username || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <p className="text-muted-foreground">{user?.role || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-muted-foreground">January 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Your recent platform activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Replace these with real data or components */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Content Created</p>
                      <p className="text-sm text-muted-foreground">
                        Total pieces of content
                      </p>
                    </div>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Projects Completed</p>
                      <p className="text-sm text-muted-foreground">Finished projects</p>
                    </div>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">AI Credits Used</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Button onClick={() => setEditOpen(true)}>Edit Profile</Button>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSaving}
              />
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSaving}
              />
              <Input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                disabled={isSaving}
              />
              <Input
                name="role"
                placeholder="Role"
                value={formData.role}
                onChange={handleChange}
                disabled={isSaving}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
