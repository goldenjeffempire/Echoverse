import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Palette, Key, Mail, Smartphone, Download } from "lucide-react";
export function Settings() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: true,
        security: true
    });
    const [general, setGeneral] = useState({
        siteName: "EchoVerse Platform",
        siteDescription: "AI-powered platform for modern businesses",
        timezone: "UTC",
        language: "English"
    });
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary"/>
            Settings
          </h1>
          <p className="text-muted-foreground">Configure your platform settings and preferences</p>
        </div>
        <Button data-testid="button-save-settings" className="gap-2">
          <Download className="h-4 w-4"/>
          Export Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Configuration</CardTitle>
              <CardDescription>Basic settings for your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" value={general.siteName} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} data-testid="input-site-name"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} data-testid="input-timezone"/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Input id="site-description" value={general.siteDescription} onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })} data-testid="input-site-description"/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5"/>
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-theme-settings">
                  <Palette className="h-6 w-6"/>
                  Theme Settings
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-brand-colors">
                  <Palette className="h-6 w-6"/>
                  Brand Colors
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5"/>
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })} data-testid="switch-email-notifications"/>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch checked={notifications.push} onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })} data-testid="switch-push-notifications"/>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Product updates and tips</p>
                </div>
                <Switch checked={notifications.marketing} onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })} data-testid="switch-marketing-notifications"/>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">Important security notifications</p>
                </div>
                <Switch checked={notifications.security} onCheckedChange={(checked) => setNotifications({ ...notifications, security: checked })} data-testid="switch-security-notifications"/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5"/>
                Security & Privacy
              </CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-change-password">
                  <Key className="h-6 w-6"/>
                  Change Password
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-two-factor">
                  <Smartphone className="h-6 w-6"/>
                  Two-Factor Auth
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-login-history">
                  <Shield className="h-6 w-6"/>
                  Login History
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-data-export">
                  <Download className="h-6 w-6"/>
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5"/>
                Third-party Integrations
              </CardTitle>
              <CardDescription>Connect with external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-600"/>
                    </div>
                    <div>
                      <h3 className="font-medium">Email Service</h3>
                      <p className="text-sm text-muted-foreground">Connected to SendGrid</p>
                    </div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div>
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-muted-foreground">Google Analytics</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-connect-analytics">
                    Connect
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Key className="h-5 w-5 text-purple-600"/>
                    </div>
                    <div>
                      <h3 className="font-medium">Payment Gateway</h3>
                      <p className="text-sm text-muted-foreground">Stripe integration</p>
                    </div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>System-level configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-backup-settings">
                  <Download className="h-6 w-6"/>
                  Backup & Restore
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-api-keys">
                  <Key className="h-6 w-6"/>
                  API Keys
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-system-logs">
                  <Database className="h-6 w-6"/>
                  System Logs
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-maintenance-mode">
                  <SettingsIcon className="h-6 w-6"/>
                  Maintenance Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
