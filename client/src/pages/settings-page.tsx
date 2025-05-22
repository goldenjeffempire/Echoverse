"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Shield,
  LogOut,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";

import { toast } from "@/lib/toast";

interface UserData {
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  bio: string;
}

// --- Mock API service functions (replace with real backend calls) ---
async function apiLogout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 1000));
  // Implement real logout here
}

async function apiGetUserProfile(): Promise<UserData> {
  await new Promise((r) => setTimeout(r, 1000));
  return {
    username: "jeffery_dev",
    email: "jeffery@example.com",
    firstName: "Jeffery",
    lastName: "Smith",
    bio: "Hard working and love being the best out of all in my work.",
  };
}

async function apiUpdateProfile(data: Partial<UserData>): Promise<UserData> {
  await new Promise((r) => setTimeout(r, 1200));
  // Normally returns updated user data
  return { ...data } as UserData;
}

async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await new Promise((r) => setTimeout(r, 1200));
  // Simulate failure for wrong password
  if (currentPassword !== "correct_password") {
    throw new Error("Current password is incorrect");
  }
}

async function apiUpdateNotificationSettings(
  settings: Record<string, boolean>
): Promise<void> {
  await new Promise((r) => setTimeout(r, 1000));
}

async function apiGetApiKey(): Promise<string> {
  await new Promise((r) => setTimeout(r, 1000));
  return "ABCD-1234-EFGH-5678-IJKL";
}

async function apiRegenerateApiKey(): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500));
  // Generate new key (random string)
  return Math.random().toString(36).substring(2, 18).toUpperCase();
}

async function apiGetApiUsage(): Promise<{ used: number; limit: number }> {
  await new Promise((r) => setTimeout(r, 800));
  return { used: 1235, limit: 10000 };
}

// ---------------------------------------------------------------------

export default function SettingsPage() {
  // --- States ---
  const [user, setUser] = useState<UserData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    productUpdates: true,
    billingAlerts: true,
    aiInsights: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyRegenerating, setApiKeyRegenerating] = useState(false);

  const [apiUsage, setApiUsage] = useState<{ used: number; limit: number }>({
    used: 0,
    limit: 0,
  });
  const [apiUsageLoading, setApiUsageLoading] = useState(true);

  const [copySuccess, setCopySuccess] = useState(false);

  // Password form error
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- Effects ---

  useEffect(() => {
    // Load user profile on mount
    async function loadProfile() {
      try {
        setErrorProfile(null);
        setLoadingProfile(true);
        const profile = await apiGetUserProfile();
        setUser(profile);
      } catch (err) {
        setErrorProfile("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();

    // Load API key & usage
    async function loadApiInfo() {
      try {
        setApiKeyLoading(true);
        setApiUsageLoading(true);
        const [key, usage] = await Promise.all([apiGetApiKey(), apiGetApiUsage()]);
        setApiKey(key);
        setApiUsage(usage);
      } catch {
        toast({ title: "Error", description: "Failed to load API info" });
      } finally {
        setApiKeyLoading(false);
        setApiUsageLoading(false);
      }
    }
    loadApiInfo();
  }, []);

  // --- Handlers ---

  async function handleLogout() {
    try {
      setLogoutLoading(true);
      await apiLogout();
      toast({ title: "Logged out", description: "You have signed out." });
      // Redirect or reload page here as needed
    } catch {
      toast({ title: "Error", description: "Logout failed." });
    } finally {
      setLogoutLoading(false);
    }
  }

  async function handleUpdateProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const bio = (form.elements.namedItem("bio") as HTMLTextAreaElement).value.trim();

    setUpdatingProfile(true);
    try {
      const updated = await apiUpdateProfile({ email, firstName, lastName, bio });
      setUser((prev) => (prev ? { ...prev, ...updated } : updated));
      toast({ title: "Success", description: "Profile updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile." });
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);

    const form = e.currentTarget;
    const currentPassword = (form.elements.namedItem(
      "currentPassword"
    ) as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement)
      .value;
    const confirmPassword = (form.elements.namedItem(
      "confirmPassword"
    ) as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      toast({ title: "Success", description: "Password changed." });
      form.reset();
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Save immediately or batch later, here immediate save
      saveNotificationSettings(updated);
      return updated;
    });
  }

  async function saveNotificationSettings(updatedSettings: typeof notifications) {
    setNotifSaving(true);
    try {
      await apiUpdateNotificationSettings(updatedSettings);
      toast({ title: "Success", description: "Notification settings updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update notification settings." });
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleRegenerateApiKey() {
    setApiKeyRegenerating(true);
    try {
      const newKey = await apiRegenerateApiKey();
      setApiKey(newKey);
      toast({ title: "Success", description: "API key regenerated." });
    } catch {
      toast({ title: "Error", description: "Failed to regenerate API key." });
    } finally {
      setApiKeyRegenerating(false);
    }
  }

  async function handleCopyApiKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({ title: "Copied", description: "API key copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to copy API key." });
    }
  }

  if (loadingProfile)
    return (
      <div className="flex justify-center items-center h-screen text-white text-lg">
        Loading profile...
      </div>
    );

  if (errorProfile)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg">
        {errorProfile}
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-gray-50 rounded-lg p-4 shadow">
        <div className="flex flex-col items-center">
          <User className="text-primary w-12 h-12" />
          <h2 className="mt-2 text-xl font-semibold">{user?.username}</h2>
          <p className="text-sm text-gray-600">{user?.email ?? "No email set"}</p>
          <button
            className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <Loader2 className="animate-spin mr-2 inline-block w-5 h-5" />
            ) : (
              <LogOut className="inline-block mr-2 w-5 h-5" />
            )}
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User /> Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock /> Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user?.username} readOnly />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user?.email ?? ""}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        defaultValue={user?.firstName ?? ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        defaultValue={user?.lastName ?? ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        defaultValue={user?.bio ?? ""}
                        className="w-full border rounded px-3 py-2 resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={updatingProfile}>
                    {updatingProfile ? (
                      <Loader2 className="animate-spin mr-2 w-5 h-5" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Password tab */}
          <TabsContent value="password">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Choose a strong, new password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-red-600 flex items-center gap-1">
                        <AlertCircle size={16} /> {passwordError}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? (
                      <Loader2 className="animate-spin mr-2 w-5 h-5" />
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Notifications tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage your notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "emailNotifications",
                    label: "Email Notifications",
                    description: "Receive email alerts about your account.",
                  },
                  {
                    key: "productUpdates",
                    label: "Product Updates",
                    description: "Stay updated with product news.",
                  },
                  {
                    key: "billingAlerts",
                    label: "Billing Alerts",
                    description: "Get alerts on billing and invoices.",
                  },
                  {
                    key: "aiInsights",
                    label: "AI Insights",
                    description: "Receive insights powered by AI.",
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Label htmlFor={key}>{label}</Label>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                    <Switch
                      id={key}
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={() =>
                        handleToggleNotification(key as keyof typeof notifications)
                      }
                      disabled={notifSaving}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>
                  Manage your API key and monitor usage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Input
                      id="apiKey"
                      type="text"
                      value={apiKey ?? ""}
                      readOnly
                      className="w-64 md:w-80"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyApiKey}
                      disabled={!apiKey}
                    >
                      {copySuccess ? (
                        <Check className="text-green-600 w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRegenerateApiKey}
                    disabled={apiKeyRegenerating}
                  >
                    {apiKeyRegenerating ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : (
                      "Regenerate Key"
                    )}
                  </Button>
                </div>

                {/* API Usage Bar */}
                <div className="mt-6">
                  <label htmlFor="apiUsage" className="block mb-1 font-medium">
                    API Usage: {apiUsage.used} / {apiUsage.limit}
                  </label>
                  <div
                    id="apiUsage"
                    className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
                    aria-valuemin={0}
                    aria-valuemax={apiUsage.limit}
                    aria-valuenow={apiUsage.used}
                    role="progressbar"
                  >
                    <div
                      className="h-3 bg-primary rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (apiUsage.used / apiUsage.limit) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
