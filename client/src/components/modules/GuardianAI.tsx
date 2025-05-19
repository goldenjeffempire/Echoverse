import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  UserPlus, 
  Settings, 
  Save,
  Clock,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Key,
  Sliders,
  ToggleLeft,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Types
type ContentCategory = 'sexual' | 'violence' | 'profanity' | 'hate' | 'harassment' | 'selfHarm' | 'misinformation';

type FilterLevel = 'off' | 'low' | 'medium' | 'high' | 'strict';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  contentAccess: {
    maxAgeRating: string;
    categories: {
      [key in ContentCategory]: FilterLevel;
    };
    timeRestrictions: {
      enabled: boolean;
      weekdayLimit: number; // in minutes
      weekendLimit: number; // in minutes
      bedtime: {
        weekday: string;
        weekend: string;
      };
    };
    blockedKeywords: string[];
    aiContentSettings: {
      viewAIContent: boolean;
      interactWithAI: boolean;
      createAIContent: boolean;
    };
  };
  activityReports: {
    lastActive: Date;
    contentBlocked: number;
    timeSpent: {
      lastWeek: number; // in minutes
      byCategory: {
        learning: number;
        social: number;
        entertainment: number;
      };
    };
  };
};

type ModerationEvent = {
  id: string;
  timestamp: Date;
  contentType: 'post' | 'comment' | 'message' | 'search';
  action: 'blocked' | 'flagged' | 'allowed';
  category: ContentCategory;
  confidence: number;
  excerpt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
};

export default function GuardianAI() {
  // Mock profiles data
  const childProfiles: ChildProfile[] = [
    {
      id: 'child1',
      name: 'Emma Johnson',
      age: 13,
      avatar: 'https://randomuser.me/api/portraits/children/1.jpg',
      contentAccess: {
        maxAgeRating: 'PG',
        categories: {
          sexual: 'strict',
          violence: 'high',
          profanity: 'medium',
          hate: 'strict',
          harassment: 'strict',
          selfHarm: 'strict',
          misinformation: 'medium'
        },
        timeRestrictions: {
          enabled: true,
          weekdayLimit: 120, // 2 hours
          weekendLimit: 180, // 3 hours
          bedtime: {
            weekday: '20:00',
            weekend: '21:30'
          }
        },
        blockedKeywords: ['gambling', 'betting', 'inappropriate'],
        aiContentSettings: {
          viewAIContent: true,
          interactWithAI: true,
          createAIContent: false
        }
      },
      activityReports: {
        lastActive: new Date('2025-05-17T18:30:00'),
        contentBlocked: 5,
        timeSpent: {
          lastWeek: 850, // 14 hours, 10 minutes
          byCategory: {
            learning: 420,
            social: 280,
            entertainment: 150
          }
        }
      }
    },
    {
      id: 'child2',
      name: 'Noah Williams',
      age: 16,
      avatar: 'https://randomuser.me/api/portraits/children/2.jpg',
      contentAccess: {
        maxAgeRating: 'PG-13',
        categories: {
          sexual: 'high',
          violence: 'medium',
          profanity: 'low',
          hate: 'high',
          harassment: 'high',
          selfHarm: 'strict',
          misinformation: 'medium'
        },
        timeRestrictions: {
          enabled: true,
          weekdayLimit: 150, // 2.5 hours
          weekendLimit: 240, // 4 hours
          bedtime: {
            weekday: '22:00',
            weekend: '23:00'
          }
        },
        blockedKeywords: ['adult content', 'mature'],
        aiContentSettings: {
          viewAIContent: true,
          interactWithAI: true,
          createAIContent: true
        }
      },
      activityReports: {
        lastActive: new Date('2025-05-17T20:15:00'),
        contentBlocked: 2,
        timeSpent: {
          lastWeek: 1230, // 20 hours, 30 minutes
          byCategory: {
            learning: 560,
            social: 440,
            entertainment: 230
          }
        }
      }
    }
  ];

  // Mock moderation events
  const moderationEvents: ModerationEvent[] = [
    {
      id: 'event1',
      timestamp: new Date('2025-05-17T14:23:12'),
      contentType: 'post',
      action: 'blocked',
      category: 'profanity',
      confidence: 0.92,
      excerpt: 'This post contained inappropriate language that violated community guidelines.',
      user: {
        id: 'child1',
        name: 'Emma Johnson',
        avatar: 'https://randomuser.me/api/portraits/children/1.jpg'
      }
    },
    {
      id: 'event2',
      timestamp: new Date('2025-05-17T11:45:00'),
      contentType: 'search',
      action: 'flagged',
      category: 'violence',
      confidence: 0.78,
      excerpt: 'Search query contained potentially concerning terms related to violence.',
      user: {
        id: 'child2',
        name: 'Noah Williams',
        avatar: 'https://randomuser.me/api/portraits/children/2.jpg'
      }
    },
    {
      id: 'event3',
      timestamp: new Date('2025-05-16T18:12:34'),
      contentType: 'comment',
      action: 'blocked',
      category: 'harassment',
      confidence: 0.85,
      excerpt: 'Comment contained content that could be considered harassment.',
      user: {
        id: 'child1',
        name: 'Emma Johnson',
        avatar: 'https://randomuser.me/api/portraits/children/1.jpg'
      }
    },
    {
      id: 'event4',
      timestamp: new Date('2025-05-16T16:30:27'),
      contentType: 'message',
      action: 'allowed',
      category: 'profanity',
      confidence: 0.56,
      excerpt: 'Message contained mild language that was within acceptable thresholds.',
      user: {
        id: 'child2',
        name: 'Noah Williams',
        avatar: 'https://randomuser.me/api/portraits/children/2.jpg'
      }
    }
  ];

  // State
  const [profiles, setProfiles] = useState<ChildProfile[]>(childProfiles);
  const [events, setEvents] = useState<ModerationEvent[]>(moderationEvents);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>('child1');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ChildProfile | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [contentToAnalyze, setContentToAnalyze] = useState('');
  const [contentAnalysisResults, setContentAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Get the currently selected profile
  const selectedProfile = selectedProfileId 
    ? profiles.find(profile => profile.id === selectedProfileId) 
    : null;

  // Handle profile changes
  const handleEditProfile = () => {
    if (selectedProfile) {
      setEditedProfile(JSON.parse(JSON.stringify(selectedProfile)));
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => {
    if (!editedProfile) return;
    
    setProfiles(profiles.map(profile => 
      profile.id === editedProfile.id ? editedProfile : profile
    ));
    
    setIsEditing(false);
    setEditedProfile(null);
    
    toast({
      title: 'Profile Updated',
      description: `${editedProfile.name}'s profile has been successfully updated.`,
    });
  };

  const handleCreateProfile = (newProfile: Omit<ChildProfile, 'id'>) => {
    const profile: ChildProfile = {
      ...newProfile,
      id: `child${profiles.length + 1}`,
      activityReports: {
        lastActive: new Date(),
        contentBlocked: 0,
        timeSpent: {
          lastWeek: 0,
          byCategory: {
            learning: 0,
            social: 0,
            entertainment: 0
          }
        }
      }
    };
    
    setProfiles([...profiles, profile]);
    setSelectedProfileId(profile.id);
    setIsAddingProfile(false);
    
    toast({
      title: 'Profile Created',
      description: `${profile.name}'s profile has been successfully created.`,
    });
  };

  // Content analysis
  const handleAnalyzeContent = async () => {
    if (!contentToAnalyze.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // In a real implementation, this would call the OpenAI API
      // const response = await apiRequest('POST', '/api/guardian/analyze', {
      //   content: contentToAnalyze
      // });
      // const result = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate response
      const result = {
        categories: {
          sexual: { detected: false, confidence: 0.02 },
          violence: { detected: contentToAnalyze.toLowerCase().includes('violent'), confidence: contentToAnalyze.toLowerCase().includes('violent') ? 0.78 : 0.05 },
          profanity: { detected: contentToAnalyze.toLowerCase().includes('damn') || contentToAnalyze.toLowerCase().includes('hell'), confidence: contentToAnalyze.toLowerCase().includes('damn') ? 0.65 : 0.08 },
          hate: { detected: false, confidence: 0.03 },
          harassment: { detected: false, confidence: 0.04 },
          selfHarm: { detected: false, confidence: 0.01 },
          misinformation: { detected: false, confidence: 0.15 }
        },
        ageRating: contentToAnalyze.toLowerCase().includes('violent') ? 'PG-13' : 'G',
        keywords: ['technology', 'AI', 'future'].filter(keyword => 
          contentToAnalyze.toLowerCase().includes(keyword.toLowerCase())
        ),
        summary: 'This content appears to be a discussion about technology and AI. ' + 
                 (contentToAnalyze.toLowerCase().includes('violent') ? 'It contains some mentions of violence that may not be suitable for younger audiences.' : 'It appears to be suitable for all audiences.'),
        recommendation: contentToAnalyze.toLowerCase().includes('violent') ? 'FLAG' : 'ALLOW'
      };
      
      setContentAnalysisResults(result);
      
      toast({
        title: 'Analysis Complete',
        description: 'The content has been analyzed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format time
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const getCategoryLabel = (category: ContentCategory) => {
    switch (category) {
      case 'sexual': return 'Sexual Content';
      case 'violence': return 'Violence';
      case 'profanity': return 'Profanity';
      case 'hate': return 'Hate Speech';
      case 'harassment': return 'Harassment';
      case 'selfHarm': return 'Self Harm';
      case 'misinformation': return 'Misinformation';
    }
  };

  const getLevelName = (level: FilterLevel) => {
    switch (level) {
      case 'off': return 'Off';
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'strict': return 'Strict';
    }
  };

  const getActionColor = (action: 'blocked' | 'flagged' | 'allowed') => {
    switch (action) {
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'flagged': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'allowed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-6 w-6" />
            GuardianAI
          </CardTitle>
          <CardDescription>
            AI-powered content moderation and parental controls for a safer digital environment
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Profiles</CardTitle>
                <Button size="sm" onClick={() => setIsAddingProfile(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription>
                Manage children's content access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      selectedProfileId === profile.id ? 'bg-neutral-100 dark:bg-neutral-800 border-l-4 border-primary' : ''
                    }`}
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      {profile.avatar ? (
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                      ) : (
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Age: {profile.age}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-9">
          <Tabs defaultValue="profile" className="h-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              <TabsTrigger value="activity">Activity Monitor</TabsTrigger>
              <TabsTrigger value="content">Content Analyzer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="h-full">
              {selectedProfile ? (
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          {selectedProfile.avatar ? (
                            <AvatarImage src={selectedProfile.avatar} alt={selectedProfile.name} />
                          ) : (
                            <AvatarFallback>{selectedProfile.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle>{selectedProfile.name}</CardTitle>
                          <CardDescription>Age: {selectedProfile.age}</CardDescription>
                        </div>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedProfile(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleEditProfile}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Settings
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Content Filtering</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Maximum Age Rating
                          </label>
                          {isEditing ? (
                            <Select
                              value={editedProfile?.contentAccess.maxAgeRating}
                              onValueChange={(value) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      maxAgeRating: value
                                    }
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select age rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="G">G (General Audiences)</SelectItem>
                                <SelectItem value="PG">PG (Parental Guidance)</SelectItem>
                                <SelectItem value="PG-13">PG-13 (Parents Strongly Cautioned)</SelectItem>
                                <SelectItem value="T">T (Teen)</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                              {selectedProfile.contentAccess.maxAgeRating}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Content Categories</h4>
                          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Filter Level</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(selectedProfile.contentAccess.categories).map(([category, level]) => (
                                  <TableRow key={category}>
                                    <TableCell>{getCategoryLabel(category as ContentCategory)}</TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Select
                                          value={editedProfile?.contentAccess.categories[category as ContentCategory]}
                                          onValueChange={(value) => {
                                            if (editedProfile) {
                                              setEditedProfile({
                                                ...editedProfile,
                                                contentAccess: {
                                                  ...editedProfile.contentAccess,
                                                  categories: {
                                                    ...editedProfile.contentAccess.categories,
                                                    [category]: value as FilterLevel
                                                  }
                                                }
                                              });
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select filter level" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="off">Off</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="strict">Strict</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        getLevelName(level as FilterLevel)
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Blocked Keywords
                          </label>
                          {isEditing ? (
                            <Textarea
                              value={editedProfile?.contentAccess.blockedKeywords.join(', ')}
                              onChange={(e) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      blockedKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                                    }
                                  });
                                }
                              }}
                              placeholder="Enter keywords separated by commas"
                              className="h-20"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                              {selectedProfile.contentAccess.blockedKeywords.map((keyword, index) => (
                                <Badge key={index} variant="outline">
                                  {keyword}
                                </Badge>
                              ))}
                              {selectedProfile.contentAccess.blockedKeywords.length === 0 && (
                                <span className="text-neutral-500 dark:text-neutral-400">No blocked keywords</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Time Restrictions</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Enable Time Limits
                          </label>
                          {isEditing ? (
                            <Switch
                              checked={editedProfile?.contentAccess.timeRestrictions.enabled}
                              onCheckedChange={(checked) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      timeRestrictions: {
                                        ...editedProfile.contentAccess.timeRestrictions,
                                        enabled: checked
                                      }
                                    }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className={selectedProfile.contentAccess.timeRestrictions.enabled ? 'text-green-600' : 'text-neutral-500'}>
                              {selectedProfile.contentAccess.timeRestrictions.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Weekday Screen Time Limit
                            </label>
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">0h</span>
                                  <span className="text-sm">4h</span>
                                </div>
                                <Slider
                                  value={[editedProfile?.contentAccess.timeRestrictions.weekdayLimit || 0]}
                                  max={240}
                                  step={15}
                                  disabled={!editedProfile?.contentAccess.timeRestrictions.enabled}
                                  onValueChange={(value) => {
                                    if (editedProfile) {
                                      setEditedProfile({
                                        ...editedProfile,
                                        contentAccess: {
                                          ...editedProfile.contentAccess,
                                          timeRestrictions: {
                                            ...editedProfile.contentAccess.timeRestrictions,
                                            weekdayLimit: value[0]
                                          }
                                        }
                                      });
                                    }
                                  }}
                                />
                                <div className="text-center text-sm font-medium">
                                  {formatMinutes(editedProfile?.contentAccess.timeRestrictions.weekdayLimit || 0)}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {formatMinutes(selectedProfile.contentAccess.timeRestrictions.weekdayLimit)}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Weekend Screen Time Limit
                            </label>
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">0h</span>
                                  <span className="text-sm">6h</span>
                                </div>
                                <Slider
                                  value={[editedProfile?.contentAccess.timeRestrictions.weekendLimit || 0]}
                                  max={360}
                                  step={15}
                                  disabled={!editedProfile?.contentAccess.timeRestrictions.enabled}
                                  onValueChange={(value) => {
                                    if (editedProfile) {
                                      setEditedProfile({
                                        ...editedProfile,
                                        contentAccess: {
                                          ...editedProfile.contentAccess,
                                          timeRestrictions: {
                                            ...editedProfile.contentAccess.timeRestrictions,
                                            weekendLimit: value[0]
                                          }
                                        }
                                      });
                                    }
                                  }}
                                />
                                <div className="text-center text-sm font-medium">
                                  {formatMinutes(editedProfile?.contentAccess.timeRestrictions.weekendLimit || 0)}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {formatMinutes(selectedProfile.contentAccess.timeRestrictions.weekendLimit)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Weekday Bedtime
                            </label>
                            {isEditing ? (
                              <Input
                                type="time"
                                value={editedProfile?.contentAccess.timeRestrictions.bedtime.weekday}
                                onChange={(e) => {
                                  if (editedProfile) {
                                    setEditedProfile({
                                      ...editedProfile,
                                      contentAccess: {
                                        ...editedProfile.contentAccess,
                                        timeRestrictions: {
                                          ...editedProfile.contentAccess.timeRestrictions,
                                          bedtime: {
                                            ...editedProfile.contentAccess.timeRestrictions.bedtime,
                                            weekday: e.target.value
                                          }
                                        }
                                      }
                                    });
                                  }
                                }}
                                disabled={!editedProfile?.contentAccess.timeRestrictions.enabled}
                              />
                            ) : (
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {selectedProfile.contentAccess.timeRestrictions.bedtime.weekday}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Weekend Bedtime
                            </label>
                            {isEditing ? (
                              <Input
                                type="time"
                                value={editedProfile?.contentAccess.timeRestrictions.bedtime.weekend}
                                onChange={(e) => {
                                  if (editedProfile) {
                                    setEditedProfile({
                                      ...editedProfile,
                                      contentAccess: {
                                        ...editedProfile.contentAccess,
                                        timeRestrictions: {
                                          ...editedProfile.contentAccess.timeRestrictions,
                                          bedtime: {
                                            ...editedProfile.contentAccess.timeRestrictions.bedtime,
                                            weekend: e.target.value
                                          }
                                        }
                                      }
                                    });
                                  }
                                }}
                                disabled={!editedProfile?.contentAccess.timeRestrictions.enabled}
                              />
                            ) : (
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {selectedProfile.contentAccess.timeRestrictions.bedtime.weekend}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">AI Interaction Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            View AI-Generated Content
                          </label>
                          {isEditing ? (
                            <Switch
                              checked={editedProfile?.contentAccess.aiContentSettings.viewAIContent}
                              onCheckedChange={(checked) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      aiContentSettings: {
                                        ...editedProfile.contentAccess.aiContentSettings,
                                        viewAIContent: checked
                                      }
                                    }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className={selectedProfile.contentAccess.aiContentSettings.viewAIContent ? 'text-green-600' : 'text-neutral-500'}>
                              {selectedProfile.contentAccess.aiContentSettings.viewAIContent ? 'Allowed' : 'Blocked'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Interact with AI Assistants
                          </label>
                          {isEditing ? (
                            <Switch
                              checked={editedProfile?.contentAccess.aiContentSettings.interactWithAI}
                              onCheckedChange={(checked) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      aiContentSettings: {
                                        ...editedProfile.contentAccess.aiContentSettings,
                                        interactWithAI: checked
                                      }
                                    }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className={selectedProfile.contentAccess.aiContentSettings.interactWithAI ? 'text-green-600' : 'text-neutral-500'}>
                              {selectedProfile.contentAccess.aiContentSettings.interactWithAI ? 'Allowed' : 'Blocked'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Create AI-Generated Content
                          </label>
                          {isEditing ? (
                            <Switch
                              checked={editedProfile?.contentAccess.aiContentSettings.createAIContent}
                              onCheckedChange={(checked) => {
                                if (editedProfile) {
                                  setEditedProfile({
                                    ...editedProfile,
                                    contentAccess: {
                                      ...editedProfile.contentAccess,
                                      aiContentSettings: {
                                        ...editedProfile.contentAccess.aiContentSettings,
                                        createAIContent: checked
                                      }
                                    }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className={selectedProfile.contentAccess.aiContentSettings.createAIContent ? 'text-green-600' : 'text-neutral-500'}>
                              {selectedProfile.contentAccess.aiContentSettings.createAIContent ? 'Allowed' : 'Blocked'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center p-6 text-center">
                  <div>
                    <Users className="h-16 w-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Profile Selected</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                      Select a profile from the list or create a new one to manage parental controls
                    </p>
                    <Button onClick={() => setIsAddingProfile(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Profile
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedProfile ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">Last Active</div>
                            <div className="font-medium">{formatDate(selectedProfile.activityReports.lastActive)}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">Content Blocked</div>
                            <div className="font-medium">{selectedProfile.activityReports.contentBlocked} items</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">Weekly Screen Time</div>
                            <div className="font-medium">{formatMinutes(selectedProfile.activityReports.timeSpent.lastWeek)}</div>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
                          Select a profile to view activity
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Time by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProfile ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Learning</span>
                            <span>{formatMinutes(selectedProfile.activityReports.timeSpent.byCategory.learning)}</span>
                          </div>
                          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${(selectedProfile.activityReports.timeSpent.byCategory.learning / selectedProfile.activityReports.timeSpent.lastWeek) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Social</span>
                            <span>{formatMinutes(selectedProfile.activityReports.timeSpent.byCategory.social)}</span>
                          </div>
                          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${(selectedProfile.activityReports.timeSpent.byCategory.social / selectedProfile.activityReports.timeSpent.lastWeek) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Entertainment</span>
                            <span>{formatMinutes(selectedProfile.activityReports.timeSpent.byCategory.entertainment)}</span>
                          </div>
                          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{
                                width: `${(selectedProfile.activityReports.timeSpent.byCategory.entertainment / selectedProfile.activityReports.timeSpent.lastWeek) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
                        Select a profile to view time spent
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Moderation Events</CardTitle>
                  <CardDescription>
                    Recent content moderation actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Content Type</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events
                          .filter(event => !selectedProfileId || event.user.id === selectedProfileId)
                          .map(event => (
                            <TableRow key={event.id}>
                              <TableCell>{formatDate(event.timestamp)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-6 w-6 mr-2">
                                    {event.user.avatar ? (
                                      <AvatarImage src={event.user.avatar} alt={event.user.name} />
                                    ) : (
                                      <AvatarFallback>{event.user.name.charAt(0)}</AvatarFallback>
                                    )}
                                  </Avatar>
                                  {event.user.name}
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{event.contentType}</TableCell>
                              <TableCell>
                                <Badge className={`${getActionColor(event.action)} capitalize`}>
                                  {event.action}
                                </Badge>
                              </TableCell>
                              <TableCell>{getCategoryLabel(event.category)}</TableCell>
                            </TableRow>
                          ))}
                        {events.filter(event => !selectedProfileId || event.user.id === selectedProfileId).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                              No moderation events found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="content" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Content Analyzer</CardTitle>
                  <CardDescription>
                    Analyze content for safety and suitability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Textarea
                      placeholder="Enter content to analyze for safety and appropriateness..."
                      className="min-h-[150px]"
                      value={contentToAnalyze}
                      onChange={(e) => setContentToAnalyze(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={handleAnalyzeContent}
                        disabled={isAnalyzing || !contentToAnalyze.trim()}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Analyze Content
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {contentAnalysisResults && (
                    <div className="space-y-4 border p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Analysis Results</h3>
                        <Badge
                          className={contentAnalysisResults.recommendation === 'ALLOW' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}
                        >
                          {contentAnalysisResults.recommendation}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Content Categories</h4>
                          <div className="space-y-2">
                            {Object.entries(contentAnalysisResults.categories).map(([category, data]: [string, any]) => (
                              <div key={category} className="flex items-center">
                                <div className="w-32 text-sm">{getCategoryLabel(category as ContentCategory)}</div>
                                <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${data.detected ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${data.confidence * 100}%` }}
                                  />
                                </div>
                                <div className="w-16 text-right text-xs">
                                  {Math.round(data.confidence * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Age Rating</h4>
                            <div className="text-lg font-bold">{contentAnalysisResults.ageRating}</div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Detected Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {contentAnalysisResults.keywords.length > 0 ? (
                                contentAnalysisResults.keywords.map((keyword: string, index: number) => (
                                  <Badge key={index} variant="outline">
                                    {keyword}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-neutral-500 dark:text-neutral-400">No keywords detected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Summary</h4>
                        <p className="text-neutral-700 dark:text-neutral-300">
                          {contentAnalysisResults.summary}
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Content analysis powered by GuardianAI. Results are for guidance only and may not be 100% accurate.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Add Profile Dialog */}
      <Dialog open={isAddingProfile} onOpenChange={setIsAddingProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Profile</DialogTitle>
            <DialogDescription>
              Create a new child profile with custom safety settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            const newProfile: any = {
              name: formData.get('name') as string,
              age: parseInt(formData.get('age') as string, 10),
              avatar: formData.get('avatar') as string || undefined,
              contentAccess: {
                maxAgeRating: formData.get('maxAgeRating') as string,
                categories: {
                  sexual: 'strict',
                  violence: 'high',
                  profanity: 'medium',
                  hate: 'strict',
                  harassment: 'strict',
                  selfHarm: 'strict',
                  misinformation: 'medium'
                },
                timeRestrictions: {
                  enabled: true,
                  weekdayLimit: 120,
                  weekendLimit: 180,
                  bedtime: {
                    weekday: '20:00',
                    weekend: '21:30'
                  }
                },
                blockedKeywords: [],
                aiContentSettings: {
                  viewAIContent: true,
                  interactWithAI: true,
                  createAIContent: false
                }
              }
            };
            
            handleCreateProfile(newProfile);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="age" className="text-right text-sm">
                  Age
                </label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="17"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="avatar" className="text-right text-sm">
                  Avatar URL
                </label>
                <Input
                  id="avatar"
                  name="avatar"
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="maxAgeRating" className="text-right text-sm">
                  Content Rating
                </label>
                <Select name="maxAgeRating" defaultValue="PG">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">G (General Audiences)</SelectItem>
                    <SelectItem value="PG">PG (Parental Guidance)</SelectItem>
                    <SelectItem value="PG-13">PG-13 (Parents Strongly Cautioned)</SelectItem>
                    <SelectItem value="T">T (Teen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddingProfile(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}