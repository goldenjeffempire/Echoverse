import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Mail,
  Key,
  Bell,
  Shield,
  CreditCard,
  HardDrive,
  Upload,
  Save,
  CheckCircle,
  X,
  Globe,
  Moon,
  Sun,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Types
interface SubscriptionPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  aiCredits: number;
  currentPlan: boolean;
}

export default function SettingsPage() {
  // State
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileFormState, setProfileFormState] = useState({
    displayName: '',
    email: '',
    username: '',
    bio: '',
    avatarUrl: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    newContentAlerts: true,
    mentionAlerts: true,
    securityAlerts: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    activityVisibility: 'friends',
    searchable: true,
    aiProcessing: true,
    dataCollection: true,
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    reducedMotion: false,
    fontSize: 16,
    highContrast: false,
  });
  
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
    {
      name: 'Free',
      price: '$0',
      description: 'Basic access to the Echoverse platform',
      features: [
        'Access to EchoWriter',
        'Limited AI credits (100/month)',
        'Basic content moderation'
      ],
      aiCredits: 100,
      currentPlan: true
    },
    {
      name: 'Basic',
      price: '$9.99/month',
      description: 'Enhanced features for individuals',
      features: [
        'All Free features',
        'Access to EchoCMS and EchoFeed',
        'Increased AI credits (500/month)',
        'Priority support'
      ],
      aiCredits: 500,
      currentPlan: false
    },
    {
      name: 'Pro',
      price: '$19.99/month',
      description: 'Premium features for power users',
      features: [
        'All Basic features',
        'Access to all Echoverse modules',
        'Unlimited AI credits',
        '24/7 priority support',
        'Advanced analytics and insights'
      ],
      aiCredits: -1, // unlimited
      currentPlan: false
    },
    {
      name: 'Enterprise',
      price: 'Contact Sales',
      description: 'Custom solutions for organizations',
      features: [
        'All Pro features',
        'Custom integration options',
        'Dedicated support team',
        'User management and admin controls',
        'Custom AI model training'
      ],
      aiCredits: -1, // unlimited
      currentPlan: false
    }
  ]);
  
  const { toast } = useToast();

  // Load user data on mount
  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setProfileFormState({
          ...profileFormState,
          displayName: userData.displayName || '',
          email: userData.email || '',
          username: userData.username || '',
          avatarUrl: userData.avatar || '',
          bio: userData.bio || '',
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (profileFormState.newPassword && profileFormState.newPassword !== profileFormState.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, we would call the API to update the user profile
      // const response = await apiRequest('PUT', '/api/user/profile', profileFormState);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage with new user data
      const updatedUser = {
        ...user,
        displayName: profileFormState.displayName,
        email: profileFormState.email,
        username: profileFormState.username,
        avatar: profileFormState.avatarUrl,
        bio: profileFormState.bio,
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification settings changes
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle appearance settings changes
  const handleAppearanceChange = (key: string, value: any) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle save settings
  const handleSaveSettings = async (settingType: 'notifications' | 'privacy' | 'appearance') => {
    setIsLoading(true);
    
    try {
      // In a real app, we would call the API to update the settings
      // const settingsData = settingType === 'notifications' 
      //   ? notificationSettings 
      //   : settingType === 'privacy' 
      //     ? privacySettings 
      //     : appearanceSettings;
      
      // const response = await apiRequest('PUT', `/api/user/settings/${settingType}`, settingsData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: `${settingType.charAt(0).toUpperCase() + settingType.slice(1)} settings updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update ${settingType} settings`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subscription upgrade
  const handleUpgradeSubscription = (planName: string) => {
    toast({
      title: 'Subscription Upgrade',
      description: `Redirecting to checkout for ${planName} plan`,
    });
    window.location.href = '/checkout';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your account preferences and settings
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  User Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    {profileFormState.avatarUrl ? (
                      <AvatarImage src={profileFormState.avatarUrl} alt="Profile avatar" />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {profileFormState.displayName ? profileFormState.displayName.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Profile Picture</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      JPG, GIF or PNG. Max size 2MB.
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={profileFormState.displayName}
                      onChange={handleProfileChange}
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={profileFormState.username}
                      onChange={handleProfileChange}
                      placeholder="Your username"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileFormState.email}
                      onChange={handleProfileChange}
                      placeholder="Your email address"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profileFormState.bio}
                      onChange={handleProfileChange}
                      placeholder="Write a short bio about yourself"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      name="avatarUrl"
                      value={profileFormState.avatarUrl}
                      onChange={handleProfileChange}
                      placeholder="URL to your avatar image"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={profileFormState.newPassword}
                        onChange={handleProfileChange}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={profileFormState.confirmPassword}
                        onChange={handleProfileChange}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                    Leave blank if you don't want to change your password.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how you receive notifications from Echoverse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Content Alerts</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Get notified when new content is published
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.newContentAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('newContentAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mention Alerts</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Get notified when someone mentions you
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.mentionAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('mentionAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Get notified about security-related events
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings('notifications')} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Manage your privacy preferences and data settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Visibility</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Who can see your profile</Label>
                    <RadioGroup 
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="visibility-public" />
                        <Label htmlFor="visibility-public" className="font-normal">
                          Public - Anyone can view your profile
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friends" id="visibility-friends" />
                        <Label htmlFor="visibility-friends" className="font-normal">
                          Friends Only - Only people you've connected with can view your profile
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="visibility-private" />
                        <Label htmlFor="visibility-private" className="font-normal">
                          Private - Only you can view your profile
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Activity Visibility</Label>
                    <Select 
                      value={privacySettings.activityVisibility}
                      onValueChange={(value) => handlePrivacyChange('activityVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Controls who can see your activity and contributions
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Discoverability</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Allow others to find you in search results
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.searchable}
                      onCheckedChange={(checked) => handlePrivacyChange('searchable', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Usage</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>AI Processing</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Allow your content to be processed by AI for personalized features
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.aiProcessing}
                      onCheckedChange={(checked) => handlePrivacyChange('aiProcessing', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Collection</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Allow collection of usage data to improve service
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataCollection}
                      onCheckedChange={(checked) => handlePrivacyChange('dataCollection', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Actions here cannot be undone. Be careful.
                </p>
                <div className="space-y-2 pt-2">
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                    Download My Data
                  </Button>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings('privacy')} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Privacy Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="mr-2 h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize how Echoverse looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`border rounded-lg p-4 text-center cursor-pointer ${
                      appearanceSettings.theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => handleAppearanceChange('theme', 'light')}
                  >
                    <Sun className="h-8 w-8 mx-auto mb-2" />
                    <span>Light</span>
                  </div>
                  <div
                    className={`border rounded-lg p-4 text-center cursor-pointer ${
                      appearanceSettings.theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => handleAppearanceChange('theme', 'dark')}
                  >
                    <Moon className="h-8 w-8 mx-auto mb-2" />
                    <span>Dark</span>
                  </div>
                  <div
                    className={`border rounded-lg p-4 text-center cursor-pointer ${
                      appearanceSettings.theme === 'system'
                        ? 'border-primary bg-primary/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => handleAppearanceChange('theme', 'system')}
                  >
                    <div className="flex justify-center mb-2">
                      <Sun className="h-8 w-8" />
                      <Moon className="h-8 w-8 -ml-4" />
                    </div>
                    <span>System</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Accessibility</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reduced Motion</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      checked={appearanceSettings.reducedMotion}
                      onCheckedChange={(checked) => handleAppearanceChange('reducedMotion', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>High Contrast</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Increase color contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      checked={appearanceSettings.highContrast}
                      onCheckedChange={(checked) => handleAppearanceChange('highContrast', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Font Size</Label>
                      <span className="text-sm">{appearanceSettings.fontSize}px</span>
                    </div>
                    <Slider
                      value={[appearanceSettings.fontSize]}
                      min={12}
                      max={24}
                      step={1}
                      onValueChange={(value) => handleAppearanceChange('fontSize', value[0])}
                    />
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Small</span>
                      <span>Default</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => handleSaveSettings('appearance')} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Appearance Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Subscription Settings */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Subscription Settings
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Plan</h3>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                  {subscriptionPlans.find(plan => plan.currentPlan) ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {subscriptionPlans.find(plan => plan.currentPlan)?.name} Plan
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {subscriptionPlans.find(plan => plan.currentPlan)?.description}
                        </p>
                        <div className="mt-2 flex items-center text-sm">
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            {subscriptionPlans.find(plan => plan.currentPlan)?.aiCredits === -1 
                              ? 'Unlimited AI credits' 
                              : `${subscriptionPlans.find(plan => plan.currentPlan)?.aiCredits} AI credits/month`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {subscriptionPlans.find(plan => plan.currentPlan)?.price}
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          Manage Plan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No active subscription plan
                      </p>
                      <Button className="mt-2">
                        Choose a Plan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Available Plans</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {subscriptionPlans.map((plan) => (
                    <Card key={plan.name} className={plan.currentPlan ? 'border-primary' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{plan.name}</CardTitle>
                          {plan.currentPlan && (
                            <Badge className="bg-primary">Current</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold">{plan.price}</div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {plan.currentPlan ? (
                          <Button variant="outline" className="w-full">
                            Current Plan
                          </Button>
                        ) : (
                          <Button className="w-full" onClick={() => handleUpgradeSubscription(plan.name)}>
                            {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Billing Information</h3>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-center py-4">
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No payment methods on file
                    </p>
                    <Button variant="outline" className="mt-2">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}