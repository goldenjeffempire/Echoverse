import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        avatar: user?.avatar || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/profile', profileData);
            await refreshUser();
            toast({
                title: 'Profile updated',
                description: 'Your profile has been updated successfully.',
            });
        }
        catch (err) {
            toast({
                title: 'Update failed',
                description: err.response?.data?.message || 'Failed to update profile',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please ensure both passwords are the same',
                variant: 'destructive',
            });
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast({
                title: 'Password changed',
                description: 'Your password has been changed successfully.',
            });
        }
        catch (err) {
            toast({
                title: 'Password change failed',
                description: err.response?.data?.message || 'Failed to change password',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    if (!user) {
        return (<div className="flex items-center justify-center h-full">
        <Alert>
          <AlertDescription>Please log in to view your profile.</AlertDescription>
        </Alert>
      </div>);
    }
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || user.username[0]}`.toUpperCase();
    return (<div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar}/>
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.firstName || user.username}</h1>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2"/>
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2"/>
            Password
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2"/>
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} disabled={loading}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} disabled={loading}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" value={profileData.avatar} onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })} placeholder="https://example.com/avatar.jpg" disabled={loading}/>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Saving...
                    </>) : ('Save Changes')}
                </Button>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required disabled={loading}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required disabled={loading}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required disabled={loading}/>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Changing...
                    </>) : ('Change Password')}
                </Button>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
                  </p>
                </div>
                <Button variant={user.twoFactorEnabled ? 'destructive' : 'default'}>
                  {user.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.isEmailVerified ? 'Verified' : 'Verify your email address'}
                  </p>
                </div>
                {!user.isEmailVerified && <Button variant="outline">Verify Email</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
