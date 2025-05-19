import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Code, 
  Star, 
  FileText, 
  ExternalLink, 
  Clock, 
  Users, 
  ArrowDownToLine, 
  ArrowUpRightFromSquare, 
  Terminal, 
  Settings, 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  XCircle, 
  Filter, 
  Sliders, 
  ChevronDown, 
  ChevronsUpDown, 
  BarChart,
  ShieldAlert,
  Github,
  Globe,
  Tag
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Type definitions
interface PluginAuthor {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  company?: string;
  website?: string;
  github?: string;
}

interface PluginRating {
  averageScore: number; // 1-5
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface PluginReview {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: Date;
}

type PluginCategory = 'analytics' | 'productivity' | 'content' | 'integration' | 'utility' | 'security' | 'communication' | 'ai';

interface PluginVersion {
  version: string;
  releaseDate: Date;
  changelog: string;
  minAppVersion: string;
}

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  icon: string; // URL to icon
  screenshots: string[]; // URLs to screenshots
  author: PluginAuthor;
  category: PluginCategory;
  tags: string[];
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    trial?: number; // Trial period in days
    subscription?: boolean;
  };
  version: string;
  releaseDate: Date;
  lastUpdate: Date;
  compatibility: string[]; // e.g. ["web", "desktop"]
  requirements: string[];
  dependencies: string[];
  installationCount: number;
  rating: PluginRating;
  featured: boolean;
  verified: boolean;
  versions: PluginVersion[];
  website?: string;
  repository?: string;
  documentation?: string;
  license: string;
  permissions: string[];
  apiEndpoints: string[];
  reviews: PluginReview[];
  installed?: boolean;
  installedVersion?: string;
}

// Mock data
const mockPlugins: Plugin[] = [
  {
    id: 'plugin-1',
    name: 'EchoAnalytics',
    slug: 'echo-analytics',
    description: 'Advanced analytics dashboard with AI-powered insights',
    longDescription: `
      EchoAnalytics transforms your data into actionable insights with advanced visualization tools and AI-powered analytics. 

      ## Features
      - Real-time data visualization
      - Customizable dashboards
      - AI-powered trend analysis and predictions
      - Export and share reports
      - Integration with popular data sources
      
      ## Benefits
      - Make data-driven decisions with confidence
      - Identify trends and patterns instantly
      - Save time with automated reporting
      - Improve productivity and performance
      
      Get a comprehensive view of your performance metrics and uncover hidden insights with EchoAnalytics.
    `,
    icon: 'https://placehold.co/200x200?text=EA',
    screenshots: [
      'https://placehold.co/800x450',
      'https://placehold.co/800x450',
      'https://placehold.co/800x450'
    ],
    author: {
      id: 'author-1',
      name: 'DataViz Inc.',
      avatar: 'https://placehold.co/100x100',
      verified: true,
      company: 'DataViz Inc.',
      website: 'https://example.com/dataviz',
      github: 'dataviz'
    },
    category: 'analytics',
    tags: ['dashboard', 'data-visualization', 'reports', 'metrics', 'AI'],
    pricing: {
      type: 'freemium',
      price: 19.99,
      subscription: true
    },
    version: '2.3.1',
    releaseDate: new Date('2025-01-15'),
    lastUpdate: new Date('2025-05-02'),
    compatibility: ['web', 'desktop'],
    requirements: ['Admin access'],
    dependencies: ['EchoCore SDK 2.0+'],
    installationCount: 25842,
    rating: {
      averageScore: 4.7,
      totalReviews: 523,
      distribution: {
        1: 5,
        2: 10,
        3: 25,
        4: 123,
        5: 360
      }
    },
    featured: true,
    verified: true,
    versions: [
      {
        version: '2.3.1',
        releaseDate: new Date('2025-05-02'),
        changelog: 'Fixed data export bug and improved dashboard loading time',
        minAppVersion: '3.0.0'
      },
      {
        version: '2.3.0',
        releaseDate: new Date('2025-04-10'),
        changelog: 'Added new AI prediction features and improved UI',
        minAppVersion: '3.0.0'
      },
      {
        version: '2.2.0',
        releaseDate: new Date('2025-03-05'),
        changelog: 'Added PDF export functionality and new visualization types',
        minAppVersion: '2.8.0'
      }
    ],
    website: 'https://example.com/dataviz/echoanalytics',
    repository: 'https://github.com/dataviz/echoanalytics',
    documentation: 'https://docs.example.com/echoanalytics',
    license: 'MIT',
    permissions: ['Read analytics data', 'Export reports', 'Access user preferences'],
    apiEndpoints: ['/api/analytics', '/api/reports'],
    reviews: [
      {
        id: 'review-1',
        authorId: 'user-1',
        authorName: 'Sarah Johnson',
        authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 5,
        comment: 'This plugin has revolutionized how we analyze our data. The AI insights are incredibly accurate and the visualizations are beautiful.',
        date: new Date('2025-05-01')
      },
      {
        id: 'review-2',
        authorId: 'user-2',
        authorName: 'Michael Chen',
        authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 4,
        comment: 'Great plugin with powerful features. Would give 5 stars if it loaded a bit faster with large datasets.',
        date: new Date('2025-04-25')
      }
    ]
  },
  {
    id: 'plugin-2',
    name: 'ContentSync',
    slug: 'content-sync',
    description: 'Sync content across multiple platforms seamlessly',
    longDescription: `
      ContentSync allows you to create, publish, and manage content across multiple platforms from a single interface.

      ## Features
      - One-click publishing to multiple platforms
      - Content scheduling and automated publishing
      - Version control and revision history
      - Media library management
      - Analytics integration
      
      ## Benefits
      - Save time with centralized content management
      - Ensure consistent messaging across all channels
      - Streamline your publishing workflow
      - Collaborate with team members efficiently
      
      ContentSync supports integration with WordPress, Medium, LinkedIn, Twitter, Facebook, and more.
    `,
    icon: 'https://placehold.co/200x200?text=CS',
    screenshots: [
      'https://placehold.co/800x450',
      'https://placehold.co/800x450'
    ],
    author: {
      id: 'author-2',
      name: 'MediaFlow Solutions',
      avatar: 'https://placehold.co/100x100',
      verified: true,
      company: 'MediaFlow Inc.',
      website: 'https://example.com/mediaflow'
    },
    category: 'content',
    tags: ['content management', 'publishing', 'social media', 'scheduling'],
    pricing: {
      type: 'paid',
      price: 29.99,
      trial: 14,
      subscription: true
    },
    version: '1.8.5',
    releaseDate: new Date('2025-02-20'),
    lastUpdate: new Date('2025-05-10'),
    compatibility: ['web'],
    requirements: ['Admin access', 'API keys for platforms'],
    dependencies: [],
    installationCount: 12356,
    rating: {
      averageScore: 4.5,
      totalReviews: 328,
      distribution: {
        1: 8,
        2: 12,
        3: 30,
        4: 105,
        5: 173
      }
    },
    featured: false,
    verified: true,
    versions: [
      {
        version: '1.8.5',
        releaseDate: new Date('2025-05-10'),
        changelog: 'Added TikTok integration and fixed scheduling issues',
        minAppVersion: '3.0.0'
      },
      {
        version: '1.8.0',
        releaseDate: new Date('2025-04-01'),
        changelog: 'Added Instagram integration and improved media handling',
        minAppVersion: '2.9.0'
      }
    ],
    website: 'https://example.com/contentsync',
    repository: 'https://github.com/mediaflow/contentsync',
    documentation: 'https://docs.example.com/contentsync',
    license: 'Proprietary',
    permissions: ['Access content library', 'Post to external platforms', 'Read analytics data'],
    apiEndpoints: ['/api/content', '/api/publish', '/api/platforms'],
    reviews: [
      {
        id: 'review-3',
        authorId: 'user-3',
        authorName: 'Emily Rodriguez',
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        rating: 5,
        comment: 'ContentSync has become an essential part of our content strategy. It saves us hours of work every week.',
        date: new Date('2025-05-08')
      }
    ],
    installed: true,
    installedVersion: '1.8.5'
  },
  {
    id: 'plugin-3',
    name: 'SecureGuard',
    slug: 'secure-guard',
    description: 'Advanced security tools for data protection and threat detection',
    longDescription: `
      SecureGuard provides enterprise-grade security features to protect your data, detect threats, and ensure compliance.

      ## Features
      - Real-time threat detection and prevention
      - Data encryption and secure storage
      - Access control and permissions management
      - Security audit logs
      - Compliance reporting for GDPR, HIPAA, and more
      
      ## Benefits
      - Protect sensitive information from unauthorized access
      - Detect and respond to security threats in real-time
      - Maintain regulatory compliance
      - Gain peace of mind with comprehensive security
      
      SecureGuard is built with the latest security standards and protocols to provide maximum protection for your organization.
    `,
    icon: 'https://placehold.co/200x200?text=SG',
    screenshots: [
      'https://placehold.co/800x450',
      'https://placehold.co/800x450',
      'https://placehold.co/800x450'
    ],
    author: {
      id: 'author-3',
      name: 'CyberShield Technologies',
      avatar: 'https://placehold.co/100x100',
      verified: true,
      company: 'CyberShield Technologies, Inc.',
      website: 'https://example.com/cybershield'
    },
    category: 'security',
    tags: ['security', 'encryption', 'compliance', 'threat detection'],
    pricing: {
      type: 'paid',
      price: 49.99,
      trial: 30,
      subscription: true
    },
    version: '3.2.0',
    releaseDate: new Date('2025-01-05'),
    lastUpdate: new Date('2025-04-20'),
    compatibility: ['web', 'desktop'],
    requirements: ['Admin access', 'Secure connection'],
    dependencies: [],
    installationCount: 9876,
    rating: {
      averageScore: 4.8,
      totalReviews: 215,
      distribution: {
        1: 2,
        2: 5,
        3: 10,
        4: 48,
        5: 150
      }
    },
    featured: true,
    verified: true,
    versions: [
      {
        version: '3.2.0',
        releaseDate: new Date('2025-04-20'),
        changelog: 'Added AI-powered threat detection and improved encryption methods',
        minAppVersion: '3.0.0'
      },
      {
        version: '3.1.5',
        releaseDate: new Date('2025-03-15'),
        changelog: 'Enhanced compliance reporting and fixed security bugs',
        minAppVersion: '2.9.0'
      }
    ],
    website: 'https://example.com/secureguard',
    repository: 'https://github.com/cybershield/secureguard',
    documentation: 'https://docs.example.com/secureguard',
    license: 'Proprietary',
    permissions: ['Access system files', 'Monitor network traffic', 'Encrypt data'],
    apiEndpoints: ['/api/security', '/api/audit', '/api/compliance'],
    reviews: [
      {
        id: 'review-4',
        authorId: 'user-4',
        authorName: 'David Kim',
        authorAvatar: 'https://randomuser.me/api/portraits/men/46.jpg',
        rating: 5,
        comment: 'As a security professional, I\'m impressed by the robust features and attention to detail in SecureGuard.',
        date: new Date('2025-04-25')
      }
    ]
  },
  {
    id: 'plugin-4',
    name: 'AIWriter',
    slug: 'ai-writer',
    description: 'AI-powered content generation and editing assistant',
    longDescription: `
      AIWriter uses advanced AI models to help you generate, edit, and improve your content with intelligent suggestions and automated writing.

      ## Features
      - AI-powered content generation
      - Grammar and style improvements
      - Content optimization for SEO
      - Tone and voice adjustment
      - Multiple language support
      
      ## Benefits
      - Save time on content creation
      - Improve writing quality and clarity
      - Overcome writer's block
      - Ensure consistent brand voice
      
      AIWriter integrates with your favorite text editors and content management systems for a seamless experience.
    `,
    icon: 'https://placehold.co/200x200?text=AI',
    screenshots: [
      'https://placehold.co/800x450',
      'https://placehold.co/800x450'
    ],
    author: {
      id: 'author-4',
      name: 'NeuralText Labs',
      avatar: 'https://placehold.co/100x100',
      verified: true,
      company: 'NeuralText Labs',
      website: 'https://example.com/neuraltext'
    },
    category: 'ai',
    tags: ['content generation', 'writing', 'AI', 'editing', 'SEO'],
    pricing: {
      type: 'freemium',
      price: 14.99,
      subscription: true
    },
    version: '2.1.0',
    releaseDate: new Date('2025-03-10'),
    lastUpdate: new Date('2025-05-05'),
    compatibility: ['web', 'desktop'],
    requirements: ['API key for OpenAI (optional)'],
    dependencies: [],
    installationCount: 31542,
    rating: {
      averageScore: 4.6,
      totalReviews: 482,
      distribution: {
        1: 10,
        2: 15,
        3: 37,
        4: 120,
        5: 300
      }
    },
    featured: true,
    verified: true,
    versions: [
      {
        version: '2.1.0',
        releaseDate: new Date('2025-05-05'),
        changelog: 'Added support for GPT-4o and improved editing suggestions',
        minAppVersion: '3.0.0'
      },
      {
        version: '2.0.5',
        releaseDate: new Date('2025-04-20'),
        changelog: 'Added SEO optimization features and fixed bugs',
        minAppVersion: '3.0.0'
      }
    ],
    website: 'https://example.com/aiwriter',
    repository: 'https://github.com/neuraltext/aiwriter',
    documentation: 'https://docs.example.com/aiwriter',
    license: 'MIT',
    permissions: ['Access content', 'Read user preferences', 'Internet access for AI services'],
    apiEndpoints: ['/api/ai', '/api/content', '/api/preferences'],
    reviews: [
      {
        id: 'review-5',
        authorId: 'user-5',
        authorName: 'Lisa Taylor',
        authorAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
        rating: 4,
        comment: 'AIWriter has significantly improved my content creation process. The AI suggestions are remarkably accurate.',
        date: new Date('2025-05-01')
      },
      {
        id: 'review-6',
        authorId: 'user-6',
        authorName: 'Robert Johnson',
        authorAvatar: 'https://randomuser.me/api/portraits/men/55.jpg',
        rating: 5,
        comment: 'This plugin is a game-changer for content creators. It saves me hours of work each week.',
        date: new Date('2025-04-28')
      }
    ],
    installed: true,
    installedVersion: '2.0.5'
  },
  {
    id: 'plugin-5',
    name: 'TeamCollab',
    slug: 'team-collab',
    description: 'Enhance team collaboration with real-time communication tools',
    longDescription: `
      TeamCollab provides powerful collaboration features to help your team work together more effectively, regardless of location.

      ## Features
      - Real-time document collaboration
      - Team chat and discussions
      - Task assignment and tracking
      - Meeting scheduling and video conferencing
      - File sharing and version control
      
      ## Benefits
      - Improve team communication and coordination
      - Streamline project workflow
      - Reduce email overload
      - Keep all project-related information in one place
      
      TeamCollab integrates seamlessly with your existing workflow to enhance productivity and team cooperation.
    `,
    icon: 'https://placehold.co/200x200?text=TC',
    screenshots: [
      'https://placehold.co/800x450',
      'https://placehold.co/800x450',
      'https://placehold.co/800x450'
    ],
    author: {
      id: 'author-5',
      name: 'Collaboration Labs',
      avatar: 'https://placehold.co/100x100',
      verified: true,
      company: 'Collaboration Labs LLC',
      website: 'https://example.com/collablabs'
    },
    category: 'productivity',
    tags: ['collaboration', 'communication', 'team', 'project management'],
    pricing: {
      type: 'paid',
      price: 24.99,
      trial: 21,
      subscription: true
    },
    version: '3.5.2',
    releaseDate: new Date('2025-02-15'),
    lastUpdate: new Date('2025-05-12'),
    compatibility: ['web', 'desktop'],
    requirements: [],
    dependencies: [],
    installationCount: 18765,
    rating: {
      averageScore: 4.4,
      totalReviews: 342,
      distribution: {
        1: 8,
        2: 20,
        3: 45,
        4: 149,
        5: 120
      }
    },
    featured: false,
    verified: true,
    versions: [
      {
        version: '3.5.2',
        releaseDate: new Date('2025-05-12'),
        changelog: 'Improved video conferencing quality and fixed chat notification issues',
        minAppVersion: '3.0.0'
      },
      {
        version: '3.5.0',
        releaseDate: new Date('2025-04-08'),
        changelog: 'Added screen sharing feature and enhanced file collaboration',
        minAppVersion: '2.9.0'
      }
    ],
    website: 'https://example.com/teamcollab',
    repository: 'https://github.com/collablabs/teamcollab',
    documentation: 'https://docs.example.com/teamcollab',
    license: 'Proprietary',
    permissions: ['Access user list', 'Send notifications', 'Access files', 'Camera and microphone'],
    apiEndpoints: ['/api/collaboration', '/api/chat', '/api/files', '/api/meetings'],
    reviews: [
      {
        id: 'review-7',
        authorId: 'user-7',
        authorName: 'Jennifer Wilson',
        authorAvatar: 'https://randomuser.me/api/portraits/women/54.jpg',
        rating: 5,
        comment: 'TeamCollab has transformed how our distributed team works together. The real-time collaboration features are excellent.',
        date: new Date('2025-05-10')
      }
    ]
  }
];

// Categories with icons
const categories: { id: PluginCategory; name: string; icon: React.ReactNode }[] = [
  { id: 'analytics', name: 'Analytics', icon: <BarChart className="h-4 w-4" /> },
  { id: 'productivity', name: 'Productivity', icon: <Clock className="h-4 w-4" /> },
  { id: 'content', name: 'Content', icon: <FileText className="h-4 w-4" /> },
  { id: 'integration', name: 'Integration', icon: <ArrowUpRightFromSquare className="h-4 w-4" /> },
  { id: 'utility', name: 'Utility', icon: <Settings className="h-4 w-4" /> },
  { id: 'security', name: 'Security', icon: <ShieldAlert className="h-4 w-4" /> },
  { id: 'communication', name: 'Communication', icon: <Users className="h-4 w-4" /> },
  { id: 'ai', name: 'AI & Machine Learning', icon: <Terminal className="h-4 w-4" /> }
];

export default function PluginMarketplace() {
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>(mockPlugins);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name' | 'rating'>('popular');
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('discover');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Extract all unique tags from plugins
  useEffect(() => {
    const allTags = new Set<string>();
    plugins.forEach(plugin => {
      plugin.tags.forEach(tag => allTags.add(tag));
    });
    setTags(Array.from(allTags).sort());
  }, [plugins]);

  // Filter and sort plugins
  useEffect(() => {
    let result = [...plugins];
    
    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(plugin => 
        plugin.name.toLowerCase().includes(lowerQuery) || 
        plugin.description.toLowerCase().includes(lowerQuery) || 
        plugin.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        plugin.author.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(plugin => plugin.category === selectedCategory);
    }
    
    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(plugin => 
        selectedTags.every(tag => plugin.tags.includes(tag))
      );
    }
    
    // Installed filter
    if (filterInstalled) {
      result = result.filter(plugin => plugin.installed);
    }
    
    // Free filter
    if (filterFree) {
      result = result.filter(plugin => plugin.pricing.type === 'free' || 
        (plugin.pricing.type === 'freemium' && !plugin.pricing.price));
    }
    
    // Verified filter
    if (filterVerified) {
      result = result.filter(plugin => plugin.verified);
    }
    
    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.installationCount - a.installationCount);
        break;
      case 'recent':
        result.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        result.sort((a, b) => b.rating.averageScore - a.rating.averageScore);
        break;
    }
    
    setFilteredPlugins(result);
  }, [plugins, searchQuery, selectedCategory, sortBy, filterInstalled, filterFree, filterVerified, selectedTags]);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };

  // Format number of installations
  const formatInstallCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Handle install plugin
  const handleInstallPlugin = async (pluginId: string) => {
    setInstallingPlugin(pluginId);
    setInstallProgress(0);
    
    // Simulate installation progress
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update plugin status
    const updatedPlugins = plugins.map(plugin => {
      if (plugin.id === pluginId) {
        return {
          ...plugin,
          installed: true,
          installedVersion: plugin.version
        };
      }
      return plugin;
    });
    
    setPlugins(updatedPlugins);
    setInstallingPlugin(null);
    setInstallProgress(0);
    
    // Update selected plugin if it's open
    if (selectedPlugin && selectedPlugin.id === pluginId) {
      const updatedPlugin = updatedPlugins.find(p => p.id === pluginId);
      if (updatedPlugin) setSelectedPlugin(updatedPlugin);
    }
    
    toast({
      title: 'Plugin Installed',
      description: `The plugin has been installed successfully.`,
    });
  };

  // Handle uninstall plugin
  const handleUninstallPlugin = async (pluginId: string) => {
    setInstallingPlugin(pluginId);
    setInstallProgress(0);
    
    // Simulate uninstallation progress
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update plugin status
    const updatedPlugins = plugins.map(plugin => {
      if (plugin.id === pluginId) {
        return {
          ...plugin,
          installed: false,
          installedVersion: undefined
        };
      }
      return plugin;
    });
    
    setPlugins(updatedPlugins);
    setInstallingPlugin(null);
    setInstallProgress(0);
    
    // Update selected plugin if it's open
    if (selectedPlugin && selectedPlugin.id === pluginId) {
      const updatedPlugin = updatedPlugins.find(p => p.id === pluginId);
      if (updatedPlugin) setSelectedPlugin(updatedPlugin);
    }
    
    toast({
      title: 'Plugin Uninstalled',
      description: `The plugin has been uninstalled successfully.`,
    });
  };

  // Handle plugin click
  const handlePluginClick = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
  };

  // Star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-neutral-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-neutral-300" />
        ))}
      </div>
    );
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Plugin Marketplace</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Discover and install plugins to enhance your experience</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="installed">Installed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search plugins..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as PluginCategory | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as 'popular' | 'recent' | 'name' | 'rating')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filter Options</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="installed"
                        checked={filterInstalled}
                        onCheckedChange={(checked) => setFilterInstalled(checked === true)}
                      />
                      <Label htmlFor="installed">Installed plugins only</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="free"
                        checked={filterFree}
                        onCheckedChange={(checked) => setFilterFree(checked === true)}
                      />
                      <Label htmlFor="free">Free plugins only</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={filterVerified}
                        onCheckedChange={(checked) => setFilterVerified(checked === true)}
                      />
                      <Label htmlFor="verified">Verified publishers only</Label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Filter by Tags</Label>
                    <div className="h-40 overflow-y-auto space-y-2 pr-2">
                      {tags.map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => toggleTag(tag)}
                          />
                          <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterInstalled(false);
                        setFilterFree(false);
                        setFilterVerified(false);
                        setSelectedTags([]);
                      }}
                    >
                      Reset
                    </Button>
                    <Button size="sm">Apply Filters</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Active filters */}
        {(filterInstalled || filterFree || filterVerified || selectedTags.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filterInstalled && (
              <Badge variant="outline" className="flex items-center gap-1">
                Installed only
                <button
                  onClick={() => setFilterInstalled(false)}
                  className="ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filterFree && (
              <Badge variant="outline" className="flex items-center gap-1">
                Free only
                <button
                  onClick={() => setFilterFree(false)}
                  className="ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filterVerified && (
              <Badge variant="outline" className="flex items-center gap-1">
                Verified only
                <button
                  onClick={() => setFilterVerified(false)}
                  className="ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {selectedTags.map(tag => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            <Button
              variant="link"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => {
                setFilterInstalled(false);
                setFilterFree(false);
                setFilterVerified(false);
                setSelectedTags([]);
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      <TabsContent value="discover" className="flex-1 overflow-auto">
        {/* Featured plugins */}
        {activeTab === 'discover' && !searchQuery && !filterInstalled && selectedCategory === 'all' && selectedTags.length === 0 && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Featured Plugins</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plugins
                .filter(plugin => plugin.featured)
                .slice(0, 3)
                .map(plugin => (
                  <Card
                    key={plugin.id}
                    className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                    onClick={() => handlePluginClick(plugin)}
                  >
                    <div className="h-40 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={plugin.screenshots[0] || plugin.icon}
                        alt={plugin.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={plugin.icon}
                            alt={plugin.name}
                            className="w-10 h-10 rounded-md"
                          />
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              <StarRating rating={plugin.rating.averageScore} />
                              <span className="text-sm text-neutral-500">
                                ({plugin.rating.totalReviews})
                              </span>
                            </div>
                          </div>
                        </div>
                        {plugin.verified && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {plugin.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-4">
                      <div className="text-sm text-neutral-500">
                        {plugin.pricing.type === 'free' ? (
                          <span>Free</span>
                        ) : plugin.pricing.type === 'freemium' ? (
                          <span>Free{plugin.pricing.price ? ` / $${plugin.pricing.price}` : ''}</span>
                        ) : (
                          <span>${plugin.pricing.price}{plugin.pricing.subscription ? '/mo' : ''}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Download className="h-4 w-4" />
                        {formatInstallCount(plugin.installationCount)}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        )}
        
        {/* Plugin listing */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'discover' ? (
                searchQuery || filterInstalled || selectedCategory !== 'all' || selectedTags.length > 0 ? 
                  `Results (${filteredPlugins.length})` : 'All Plugins'
              ) : 'Installed Plugins'}
            </h2>
          </div>
          
          {filteredPlugins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlugins.map(plugin => (
                <Card
                  key={plugin.id}
                  className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                  onClick={() => handlePluginClick(plugin)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={plugin.icon}
                          alt={plugin.name}
                          className="w-10 h-10 rounded-md"
                        />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plugin.name}
                            {plugin.installed && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 ml-2">
                                Installed
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <StarRating rating={plugin.rating.averageScore} />
                            <span className="text-sm text-neutral-500">
                              ({plugin.rating.totalReviews})
                            </span>
                          </div>
                        </div>
                      </div>
                      {plugin.verified && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {plugin.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plugin.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {plugin.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plugin.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4">
                    <div className="text-sm text-neutral-500">
                      {plugin.pricing.type === 'free' ? (
                        <span>Free</span>
                      ) : plugin.pricing.type === 'freemium' ? (
                        <span>Free{plugin.pricing.price ? ` / $${plugin.pricing.price}` : ''}</span>
                      ) : (
                        <span>${plugin.pricing.price}{plugin.pricing.subscription ? '/mo' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {formatInstallCount(plugin.installationCount)}
                      </div>
                      <div>
                        Updated {getRelativeTime(plugin.lastUpdate)}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <h3 className="mt-4 text-lg font-medium">No plugins found</h3>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFilterInstalled(false);
                  setFilterFree(false);
                  setFilterVerified(false);
                  setSelectedTags([]);
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="installed" className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Installed Plugins</h2>
          </div>
          
          {plugins.filter(p => p.installed).length > 0 ? (
            <div className="space-y-4">
              {plugins
                .filter(p => p.installed)
                .map(plugin => (
                  <Card
                    key={plugin.id}
                    className="overflow-hidden"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={plugin.icon}
                            alt={plugin.name}
                            className="w-10 h-10 rounded-md"
                          />
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <div className="text-sm text-neutral-500">
                              By {plugin.author.name} • v{plugin.installedVersion}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePluginClick(plugin);
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUninstallPlugin(plugin.id);
                            }}
                            disabled={installingPlugin === plugin.id}
                          >
                            {installingPlugin === plugin.id ? (
                              <>
                                <div className="animate-spin mr-2 h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                                Uninstalling...
                              </>
                            ) : 'Uninstall'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {plugin.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Download className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <h3 className="mt-4 text-lg font-medium">No plugins installed</h3>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                Browse the marketplace to discover and install plugins.
              </p>
              <Button
                className="mt-4"
                onClick={() => setActiveTab('discover')}
              >
                Browse Plugins
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      
      {/* Plugin detail dialog */}
      <Dialog open={!!selectedPlugin} onOpenChange={(open) => !open && setSelectedPlugin(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto p-0">
          {selectedPlugin && (
            <div>
              {/* Hero section */}
              <div className="h-48 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
                {selectedPlugin.screenshots.length > 0 && (
                  <img
                    src={selectedPlugin.screenshots[0]}
                    alt={selectedPlugin.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <img
                    src={selectedPlugin.icon}
                    alt={selectedPlugin.name}
                    className="w-20 h-20 rounded-md shadow-lg"
                  />
                </div>
              </div>
              
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{selectedPlugin.name}</h2>
                      {selectedPlugin.verified && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <StarRating rating={selectedPlugin.rating.averageScore} />
                        <span className="text-sm text-neutral-500">
                          ({selectedPlugin.rating.totalReviews} reviews)
                        </span>
                      </div>
                      <span className="text-neutral-400">•</span>
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        <Download className="h-4 w-4" />
                        {formatInstallCount(selectedPlugin.installationCount)} installs
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedPlugin.installed ? (
                      <Button
                        variant="destructive"
                        onClick={() => handleUninstallPlugin(selectedPlugin.id)}
                        disabled={installingPlugin === selectedPlugin.id}
                      >
                        {installingPlugin === selectedPlugin.id ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Uninstalling...
                          </>
                        ) : 'Uninstall'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleInstallPlugin(selectedPlugin.id)}
                        disabled={installingPlugin === selectedPlugin.id}
                      >
                        {installingPlugin === selectedPlugin.id ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Installing... {installProgress}%
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Install
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Main content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <div className="prose dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300">
                        <div className="whitespace-pre-line">
                          {selectedPlugin.longDescription}
                        </div>
                      </div>
                    </div>
                    
                    {selectedPlugin.screenshots.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Screenshots</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedPlugin.screenshots.map((screenshot, index) => (
                            <div key={index} className="border rounded-md overflow-hidden">
                              <img
                                src={screenshot}
                                alt={`${selectedPlugin.name} screenshot ${index + 1}`}
                                className="w-full h-auto"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Reviews</h3>
                      {selectedPlugin.reviews.length > 0 ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold">{selectedPlugin.rating.averageScore.toFixed(1)}</div>
                                <StarRating rating={selectedPlugin.rating.averageScore} />
                                <div className="text-sm text-neutral-500 mt-1">{selectedPlugin.rating.totalReviews} reviews</div>
                              </div>
                              
                              <div className="flex-1 space-y-1">
                                {[5, 4, 3, 2, 1].map(rating => {
                                  const count = selectedPlugin.rating.distribution[rating as keyof typeof selectedPlugin.rating.distribution];
                                  const percentage = (count / selectedPlugin.rating.totalReviews) * 100;
                                  
                                  return (
                                    <div key={rating} className="flex items-center gap-2">
                                      <div className="text-sm w-6">{rating}</div>
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <Progress value={percentage} className="h-2 flex-1" />
                                      <div className="text-sm w-8">{percentage.toFixed(0)}%</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {selectedPlugin.reviews.map(review => (
                              <div key={review.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      {review.authorAvatar ? (
                                        <AvatarImage src={review.authorAvatar} alt={review.authorName} />
                                      ) : (
                                        <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{review.authorName}</div>
                                      <div className="text-sm text-neutral-500">{formatDate(review.date)}</div>
                                    </div>
                                  </div>
                                  <StarRating rating={review.rating} />
                                </div>
                                <p className="mt-3 text-neutral-700 dark:text-neutral-300">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 border rounded-lg">
                          <p className="text-neutral-500 dark:text-neutral-400">No reviews yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Category</div>
                          <div className="flex items-center gap-1 mt-1">
                            {categories.find(c => c.id === selectedPlugin.category)?.icon}
                            {categories.find(c => c.id === selectedPlugin.category)?.name}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Developer</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                              {selectedPlugin.author.avatar ? (
                                <AvatarImage src={selectedPlugin.author.avatar} alt={selectedPlugin.author.name} />
                              ) : (
                                <AvatarFallback>{selectedPlugin.author.name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <span>{selectedPlugin.author.name}</span>
                            {selectedPlugin.author.verified && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Version</div>
                          <div className="mt-1">
                            {selectedPlugin.version}
                            {selectedPlugin.installed && selectedPlugin.installedVersion !== selectedPlugin.version && (
                              <Badge variant="outline" className="ml-2 text-amber-600 bg-amber-50 dark:bg-amber-950">
                                Update available
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Last Updated</div>
                          <div className="mt-1">{formatDate(selectedPlugin.lastUpdate)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Release Date</div>
                          <div className="mt-1">{formatDate(selectedPlugin.releaseDate)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">License</div>
                          <div className="mt-1">{selectedPlugin.license}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">Tags</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPlugin.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedPlugin.pricing.type === 'free' ? (
                          <span className="text-lg font-bold">Free</span>
                        ) : selectedPlugin.pricing.type === 'freemium' ? (
                          <div>
                            <span className="text-lg font-bold">Free / ${selectedPlugin.pricing.price}</span>
                            {selectedPlugin.pricing.subscription && (
                              <span className="text-neutral-500 dark:text-neutral-400"> per month</span>
                            )}
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                              Basic features are free, premium features require payment
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-lg font-bold">${selectedPlugin.pricing.price}</span>
                            {selectedPlugin.pricing.subscription && (
                              <span className="text-neutral-500 dark:text-neutral-400"> per month</span>
                            )}
                            {selectedPlugin.pricing.trial && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {selectedPlugin.pricing.trial}-day free trial
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedPlugin.website && (
                          <a
                            href={selectedPlugin.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedPlugin.documentation && (
                          <a
                            href={selectedPlugin.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Documentation
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedPlugin.repository && (
                          <a
                            href={selectedPlugin.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Github className="h-4 w-4" />
                            Source Code
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedPlugin.author.website && (
                          <a
                            href={selectedPlugin.author.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Users className="h-4 w-4" />
                            Developer Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Accordion type="single" collapsible>
                      <AccordionItem value="permissions">
                        <AccordionTrigger>Permissions</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            {selectedPlugin.permissions.map((permission, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                                <span>{permission}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="requirements">
                        <AccordionTrigger>Requirements</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            {selectedPlugin.requirements.length > 0 ? (
                              selectedPlugin.requirements.map((requirement, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                                  <span>{requirement}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-neutral-500">No special requirements</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="changelog">
                        <AccordionTrigger>Changelog</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {selectedPlugin.versions.map(version => (
                              <div key={version.version} className="pb-4 border-b last:border-0">
                                <div className="flex justify-between">
                                  <div className="font-medium">v{version.version}</div>
                                  <div className="text-sm text-neutral-500">{formatDate(version.releaseDate)}</div>
                                </div>
                                <div className="mt-2 text-sm whitespace-pre-line">{version.changelog}</div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}