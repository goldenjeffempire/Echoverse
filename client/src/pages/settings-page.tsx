import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Lock, Bell, Shield, LogOut, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If still checking auth or user is null, don't render main content
  if (!user) return null;
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      <Helmet>
        <title>Account Settings - Echoverse</title>
        <meta name="description" content="Manage your Echoverse account settings and preferences" />
      </Helmet>
      
      <div className="min-h-screen bg-dark-base">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <div className="flex space-x-2 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  View Profile
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-light-base/70 mt-2">Manage your account settings and preferences</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:block"
            >
              <Card className="bg-dark-card border-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-1 py-2">
                    <h3 className="text-sm font-medium text-light-base/70">Settings</h3>
                    <ul className="space-y-1 text-sm">
                      {[
                        { icon: <User size={16} />, label: "Profile", href: "#profile" },
                        { icon: <Lock size={16} />, label: "Password", href: "#security" },
                        { icon: <Bell size={16} />, label: "Notifications", href: "#notifications" },
                        { icon: <Shield size={16} />, label: "API Access", href: "#api" },
                      ].map((item, i) => (
                        <li key={i}>
                          <a 
                            href={item.href} 
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 text-light-base/80 hover:text-white transition-colors"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-primary/10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Sign out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-3"
            >
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-dark-card border border-primary/20">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="api">API Access</TabsTrigger>
                </TabsList>
                
                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card className="bg-dark-card border-primary/20">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your account information and public profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                              id="username" 
                              defaultValue={user.username} 
                              className="bg-dark-base/50"
                              disabled
                            />
                            <p className="text-xs text-light-base/60">Username cannot be changed</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              type="email"
                              defaultValue={user.email || ""} 
                              className="bg-dark-base/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              className="bg-dark-base/50"
                              placeholder="Enter your first name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              className="bg-dark-base/50"
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <textarea 
                            id="bio" 
                            rows={4}
                            className="w-full rounded-md border border-input bg-dark-base/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Tell us about yourself"
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Security Tab */}
                <TabsContent value="security">
                  <Card className="bg-dark-card border-primary/20">
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input 
                            id="currentPassword" 
                            type="password"
                            className="bg-dark-base/50"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input 
                              id="newPassword" 
                              type="password"
                              className="bg-dark-base/50"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password"
                              className="bg-dark-base/50"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card className="bg-dark-card border-primary/20">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Configure how you want to receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { title: "Email Notifications", description: "Receive notifications via email" },
                          { title: "Product Updates", description: "Get notified about new features and updates" },
                          { title: "Billing Alerts", description: "Receive alerts about your billing and subscription" },
                          { title: "AI Insights", description: "Get personalized AI insights and recommendations" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{item.title}</p>
                              <p className="text-sm text-light-base/60">{item.description}</p>
                            </div>
                            <Switch defaultChecked={i !== 3} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button>Save Preferences</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* API Access Tab */}
                <TabsContent value="api">
                  <Card className="bg-dark-card border-primary/20">
                    <CardHeader>
                      <CardTitle>API Access</CardTitle>
                      <CardDescription>Manage your API keys and access tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-md border border-primary/20 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-white">API Key</h3>
                              <p className="text-xs text-light-base/60">Created on {new Date().toLocaleDateString()}</p>
                            </div>
                            <Button variant="outline" size="sm">Regenerate</Button>
                          </div>
                          <div className="mt-4">
                            <div className="relative">
                              <Input 
                                type="text"
                                value="••••••••••••••••••••••••••••••••••••••••••••"
                                className="bg-dark-base/50 pr-24"
                                readOnly
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-1 top-1 h-7"
                                onClick={() => {
                                  toast({
                                    title: "Copied",
                                    description: "API key copied to clipboard",
                                  });
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                            <p className="mt-2 text-xs text-warning">Keep your API key secure. Do not share it with others.</p>
                          </div>
                        </div>
                        
                        <div className="rounded-md border border-primary/20 p-4">
                          <h3 className="font-medium text-white">API Usage</h3>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-light-base/70">Monthly Limit</span>
                              <span className="text-white">10,000 requests</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-light-base/70">Used This Month</span>
                              <span className="text-white">1,235 requests</span>
                            </div>
                            <div className="h-2 bg-dark-base/60 rounded-full mt-2">
                              <div className="h-full bg-primary rounded-full" style={{ width: '12%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href="#" className="text-primary text-sm">
                        View API documentation
                      </Link>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}