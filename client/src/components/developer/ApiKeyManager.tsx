import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  RefreshCw,
  Shield,
  Clock3,
  ListFilter,
  ChevronDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Settings,
  Search
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
type ApiKeyScope = 'read' | 'write' | 'admin';
type ApiEnvironment = 'development' | 'staging' | 'production';
type ApiKeyStatus = 'active' | 'expired' | 'revoked';

interface ApiKeyUsage {
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  byEndpoint: {
    endpoint: string;
    count: number;
  }[];
}

interface ApiKeyEvent {
  id: string;
  type: 'created' | 'used' | 'updated' | 'expired' | 'revoked';
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details?: string;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key?: string; // Full key only shown once upon creation
  scopes: ApiKeyScope[];
  environment: ApiEnvironment;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsed: Date | null;
  status: ApiKeyStatus;
  createdBy: string;
  usage: ApiKeyUsage;
  events: ApiKeyEvent[];
  rateLimitPerMinute: number;
  ipRestrictions: string[];
  referrerRestrictions: string[];
}

// Mock data
const mockApiKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'Production API Key',
    prefix: 'echo_prod_',
    scopes: ['read', 'write'],
    environment: 'production',
    createdAt: new Date('2025-01-15'),
    expiresAt: new Date('2026-01-15'),
    lastUsed: new Date('2025-05-15T14:32:11'),
    status: 'active',
    createdBy: 'Sarah Johnson',
    usage: {
      last24Hours: 1287,
      last7Days: 9432,
      last30Days: 38562,
      byEndpoint: [
        { endpoint: '/api/content', count: 4562 },
        { endpoint: '/api/users', count: 2341 },
        { endpoint: '/api/analytics', count: 1853 }
      ]
    },
    events: [
      {
        id: 'event_1',
        type: 'created',
        timestamp: new Date('2025-01-15T10:24:32'),
        details: 'API key created by Sarah Johnson'
      },
      {
        id: 'event_2',
        type: 'used',
        timestamp: new Date('2025-05-15T14:32:11'),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        endpoint: '/api/content',
        details: 'Rate limit: 120 requests/minute'
      }
    ],
    rateLimitPerMinute: 120,
    ipRestrictions: [],
    referrerRestrictions: []
  },
  {
    id: 'key_2',
    name: 'Development Testing',
    prefix: 'echo_dev_',
    scopes: ['read', 'write', 'admin'],
    environment: 'development',
    createdAt: new Date('2025-03-20'),
    expiresAt: new Date('2025-09-20'),
    lastUsed: new Date('2025-05-16T09:15:43'),
    status: 'active',
    createdBy: 'Michael Chen',
    usage: {
      last24Hours: 342,
      last7Days: 1543,
      last30Days: 5678,
      byEndpoint: [
        { endpoint: '/api/debug', count: 1245 },
        { endpoint: '/api/test', count: 987 },
        { endpoint: '/api/users', count: 456 }
      ]
    },
    events: [
      {
        id: 'event_3',
        type: 'created',
        timestamp: new Date('2025-03-20T15:11:22'),
        details: 'API key created by Michael Chen'
      }
    ],
    rateLimitPerMinute: 240,
    ipRestrictions: ['192.168.1.10', '192.168.1.11'],
    referrerRestrictions: ['localhost', 'dev.echoverse.com']
  },
  {
    id: 'key_3',
    name: 'External Partner Integration',
    prefix: 'echo_partner_',
    scopes: ['read'],
    environment: 'production',
    createdAt: new Date('2024-11-05'),
    expiresAt: new Date('2025-11-05'),
    lastUsed: new Date('2025-05-10T19:22:01'),
    status: 'active',
    createdBy: 'Sarah Johnson',
    usage: {
      last24Hours: 523,
      last7Days: 3641,
      last30Days: 14532,
      byEndpoint: [
        { endpoint: '/api/public/content', count: 12453 },
        { endpoint: '/api/public/data', count: 2079 }
      ]
    },
    events: [
      {
        id: 'event_4',
        type: 'created',
        timestamp: new Date('2024-11-05T11:45:16'),
        details: 'API key created for partner integration'
      },
      {
        id: 'event_5',
        type: 'updated',
        timestamp: new Date('2025-02-20T14:10:45'),
        details: 'Rate limit increased from 60 to 100 requests/minute'
      }
    ],
    rateLimitPerMinute: 100,
    ipRestrictions: ['203.0.113.15', '203.0.113.16'],
    referrerRestrictions: ['partner.example.com']
  },
  {
    id: 'key_4',
    name: 'Legacy System',
    prefix: 'echo_legacy_',
    scopes: ['read', 'write'],
    environment: 'production',
    createdAt: new Date('2023-05-10'),
    expiresAt: null,
    lastUsed: new Date('2025-03-15T10:11:32'),
    status: 'expired',
    createdBy: 'David Kim',
    usage: {
      last24Hours: 0,
      last7Days: 0,
      last30Days: 542,
      byEndpoint: [
        { endpoint: '/api/legacy/sync', count: 542 }
      ]
    },
    events: [
      {
        id: 'event_6',
        type: 'created',
        timestamp: new Date('2023-05-10T09:15:22'),
        details: 'API key created for legacy system integration'
      },
      {
        id: 'event_7',
        type: 'expired',
        timestamp: new Date('2025-05-10T00:00:00'),
        details: 'API key expired automatically'
      }
    ],
    rateLimitPerMinute: 60,
    ipRestrictions: [],
    referrerRestrictions: []
  }
];

// Available endpoints
const availableEndpoints = [
  { path: '/api/users', description: 'User management', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { path: '/api/content', description: 'Content operations', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  { path: '/api/analytics', description: 'Analytics data', methods: ['GET'] },
  { path: '/api/billing', description: 'Billing operations', methods: ['GET', 'POST'] },
  { path: '/api/public/content', description: 'Public content API', methods: ['GET'] },
  { path: '/api/public/data', description: 'Public data access', methods: ['GET'] },
  { path: '/api/legacy/sync', description: 'Legacy system sync', methods: ['GET', 'POST'] },
  { path: '/api/webhooks', description: 'Webhook management', methods: ['GET', 'POST', 'DELETE'] },
  { path: '/api/debug', description: 'Debug operations (non-production)', methods: ['GET', 'POST'] },
  { path: '/api/test', description: 'Test endpoints (non-production)', methods: ['GET', 'POST'] }
];

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [filteredKeys, setFilteredKeys] = useState<ApiKey[]>(mockApiKeys);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiKeyStatus | 'all'>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<ApiEnvironment | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState<Partial<ApiKey>>({
    name: '',
    scopes: ['read'],
    environment: 'development',
    expiresAt: null,
    rateLimitPerMinute: 60,
    ipRestrictions: [],
    referrerRestrictions: []
  });
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newIpRestriction, setNewIpRestriction] = useState('');
  const [newReferrerRestriction, setNewReferrerRestriction] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Filter API keys based on search and filters
  useEffect(() => {
    let result = [...apiKeys];
    
    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(key => 
        key.name.toLowerCase().includes(lowerQuery) || 
        key.prefix.toLowerCase().includes(lowerQuery) ||
        key.id.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(key => key.status === statusFilter);
    }
    
    // Environment filter
    if (environmentFilter !== 'all') {
      result = result.filter(key => key.environment === environmentFilter);
    }
    
    // Sort by creation date, newest first
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setFilteredKeys(result);
  }, [apiKeys, searchQuery, statusFilter, environmentFilter]);

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format relative time
  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  };

  // Calculate time until expiration
  const getTimeUntilExpiration = (expiresAt: Date | null) => {
    if (!expiresAt) return 'Never expires';
    
    const now = new Date();
    if (expiresAt < now) return 'Expired';
    
    const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / (60 * 60 * 24));
    
    if (diffInDays < 1) {
      const diffInHours = Math.floor(diffInSeconds / (60 * 60));
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        return `Expires in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
      }
      return `Expires in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
    } else if (diffInDays === 1) {
      return 'Expires tomorrow';
    } else if (diffInDays < 30) {
      return `Expires in ${diffInDays} days`;
    } else if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Expires in ${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`;
    } else {
      const diffInYears = Math.floor(diffInDays / 365);
      return `Expires in ${diffInYears} year${diffInYears !== 1 ? 's' : ''}`;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: ApiKeyStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'expired':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Revoked</Badge>;
    }
  };

  // Get environment badge color
  const getEnvironmentBadge = (environment: ApiEnvironment) => {
    switch (environment) {
      case 'development':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Development</Badge>;
      case 'staging':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Staging</Badge>;
      case 'production':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Production</Badge>;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The API key has been copied to your clipboard.',
    });
  };

  // Handle creating a new API key
  const handleCreateKey = async () => {
    if (!newKeyData.name) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name for your API key.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest('POST', '/api/developer/keys', newKeyData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a random API key
      const keyPrefix = `echo_${newKeyData.environment?.substring(0, 4)}_${Math.random().toString(36).substring(2, 7)}`;
      const keySecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const fullKey = `${keyPrefix}_${keySecret}`;
      
      // Create new API key object
      const now = new Date();
      const newKey: ApiKey = {
        id: `key_${Date.now()}`,
        name: newKeyData.name || 'Unnamed Key',
        prefix: keyPrefix,
        key: fullKey, // This will be shown only once
        scopes: newKeyData.scopes as ApiKeyScope[] || ['read'],
        environment: newKeyData.environment as ApiEnvironment || 'development',
        createdAt: now,
        expiresAt: newKeyData.expiresAt || null,
        lastUsed: null,
        status: 'active',
        createdBy: 'Current User', // This would be the actual user in a real app
        usage: {
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0,
          byEndpoint: []
        },
        events: [
          {
            id: `event_${Date.now()}`,
            type: 'created',
            timestamp: now,
            details: `API key created by Current User`
          }
        ],
        rateLimitPerMinute: newKeyData.rateLimitPerMinute || 60,
        ipRestrictions: newKeyData.ipRestrictions || [],
        referrerRestrictions: newKeyData.referrerRestrictions || []
      };
      
      // Add to list and reset form
      setApiKeys([newKey, ...apiKeys]);
      setNewApiKey(fullKey);
      setShowNewKey(true);
      setIsCreatingKey(false);
      
      toast({
        title: 'API Key Created',
        description: 'Your new API key has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle revoking an API key
  const handleRevokeKey = async (keyId: string) => {
    setIsRevoking(true);
    
    try {
      // In a real app, this would be an API call
      // await apiRequest('POST', `/api/developer/keys/${keyId}/revoke`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      const updatedKeys = apiKeys.map(key => {
        if (key.id === keyId) {
          const now = new Date();
          return {
            ...key,
            status: 'revoked' as ApiKeyStatus,
            events: [
              ...key.events,
              {
                id: `event_${Date.now()}`,
                type: 'revoked' as const,
                timestamp: now,
                details: 'API key revoked manually'
              }
            ]
          };
        }
        return key;
      });
      
      setApiKeys(updatedKeys);
      if (selectedKey?.id === keyId) {
        setSelectedKey(updatedKeys.find(k => k.id === keyId) || null);
      }
      
      toast({
        title: 'API Key Revoked',
        description: 'The API key has been revoked successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Add IP restriction
  const handleAddIpRestriction = () => {
    if (!newIpRestriction) return;
    
    // Simple IP validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIpRestriction)) {
      toast({
        title: 'Invalid IP Address',
        description: 'Please enter a valid IPv4 address.',
        variant: 'destructive',
      });
      return;
    }
    
    setNewKeyData({
      ...newKeyData,
      ipRestrictions: [...(newKeyData.ipRestrictions || []), newIpRestriction]
    });
    setNewIpRestriction('');
  };

  // Remove IP restriction
  const handleRemoveIpRestriction = (ip: string) => {
    setNewKeyData({
      ...newKeyData,
      ipRestrictions: (newKeyData.ipRestrictions || []).filter(r => r !== ip)
    });
  };

  // Add referrer restriction
  const handleAddReferrerRestriction = () => {
    if (!newReferrerRestriction) return;
    
    setNewKeyData({
      ...newKeyData,
      referrerRestrictions: [...(newKeyData.referrerRestrictions || []), newReferrerRestriction]
    });
    setNewReferrerRestriction('');
  };

  // Remove referrer restriction
  const handleRemoveReferrerRestriction = (referrer: string) => {
    setNewKeyData({
      ...newKeyData,
      referrerRestrictions: (newKeyData.referrerRestrictions || []).filter(r => r !== referrer)
    });
  };

  // Set expiration date
  const handleExpirationChange = (value: string) => {
    let expiresAt: Date | null = null;
    const now = new Date();
    
    switch (value) {
      case 'never':
        expiresAt = null;
        break;
      case '30days':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        expiresAt = null;
    }
    
    setNewKeyData({
      ...newKeyData,
      expiresAt
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">API Key Management</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Create and manage API keys for accessing Echoverse APIs</p>
          </div>
          
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="hidden md:inline">API Docs</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View API documentation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button onClick={() => setIsCreatingKey(true)} className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden md:inline">Create API Key</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Create API Key Dialog */}
      <Dialog open={isCreatingKey} onOpenChange={setIsCreatingKey}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Create an API key to authenticate requests to the Echoverse API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Backend, Mobile App, etc."
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Give your API key a descriptive name to help you identify its purpose.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={newKeyData.environment as string}
                onValueChange={(value) => setNewKeyData({ ...newKeyData, environment: value as ApiEnvironment })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Choose the environment where this API key will be used.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permission-read"
                    checked={newKeyData.scopes?.includes('read')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: [...(newKeyData.scopes || []), 'read']
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter(s => s !== 'read')
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-read">
                    Read (GET requests)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permission-write"
                    checked={newKeyData.scopes?.includes('write')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: [...(newKeyData.scopes || []), 'write']
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter(s => s !== 'write')
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-write">
                    Write (POST, PATCH, PUT requests)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permission-admin"
                    checked={newKeyData.scopes?.includes('admin')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: [...(newKeyData.scopes || []), 'admin']
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter(s => s !== 'admin')
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-admin">
                    Admin (full access, including DELETE requests)
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select
                defaultValue="90days"
                onValueChange={handleExpirationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="never">Never (not recommended)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                For security, API keys should have an expiration date.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Rate Limit (requests per minute)</Label>
              <Select
                value={String(newKeyData.rateLimitPerMinute)}
                onValueChange={(value) => setNewKeyData({ ...newKeyData, rateLimitPerMinute: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 requests/minute</SelectItem>
                  <SelectItem value="60">60 requests/minute</SelectItem>
                  <SelectItem value="120">120 requests/minute</SelectItem>
                  <SelectItem value="240">240 requests/minute</SelectItem>
                  <SelectItem value="600">600 requests/minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="restrictions">
                <AccordionTrigger>Advanced Restrictions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>IP Restrictions (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="192.168.1.1"
                          value={newIpRestriction}
                          onChange={(e) => setNewIpRestriction(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddIpRestriction}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Restrict API access to specific IP addresses.
                      </p>
                      
                      {newKeyData.ipRestrictions && newKeyData.ipRestrictions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newKeyData.ipRestrictions.map(ip => (
                            <Badge key={ip} variant="secondary" className="gap-1">
                              {ip}
                              <XCircle
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleRemoveIpRestriction(ip)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Referrer Restrictions (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="yourdomain.com"
                          value={newReferrerRestriction}
                          onChange={(e) => setNewReferrerRestriction(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddReferrerRestriction}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Restrict API access to specific referrer domains.
                      </p>
                      
                      {newKeyData.referrerRestrictions && newKeyData.referrerRestrictions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newKeyData.referrerRestrictions.map(referrer => (
                            <Badge key={referrer} variant="secondary" className="gap-1">
                              {referrer}
                              <XCircle
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleRemoveReferrerRestriction(referrer)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingKey(false)}>Cancel</Button>
            <Button onClick={handleCreateKey} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>Create API Key</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* API Key Created Dialog */}
      <Dialog open={showNewKey} onOpenChange={() => {
        setShowNewKey(false);
        setNewApiKey(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your API key has been created successfully. This is the only time you will see the full API key, so make sure to copy it now.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Important</p>
                <p className="text-sm">Store this API key securely. For security reasons, we cannot display it again after you close this dialog.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex">
                <Input
                  type="text"
                  value={newApiKey || ''}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={() => newApiKey && copyToClipboard(newApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Authentication Header</Label>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md font-mono text-sm">
                <span className="text-blue-600 dark:text-blue-400">Authorization:</span> Bearer {newApiKey}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Use this header in your API requests for authentication.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowNewKey(false);
              setNewApiKey(null);
            }}>
              I've Copied My API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* API Key Details Dialog */}
      <Dialog open={!!selectedKey} onOpenChange={(open) => !open && setSelectedKey(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          {selectedKey && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-xl">{selectedKey.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      {getEnvironmentBadge(selectedKey.environment)}
                      {getStatusBadge(selectedKey.status)}
                      <span className="text-sm">
                        Created {formatDate(selectedKey.createdAt)}
                      </span>
                    </DialogDescription>
                  </div>
                  {selectedKey.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeKey(selectedKey.id)}
                      disabled={isRevoking}
                    >
                      {isRevoking ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          Revoke Key
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogHeader>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key ID</Label>
                      <div className="flex">
                        <Input
                          type="text"
                          value={selectedKey.id}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(selectedKey.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Key Prefix</Label>
                      <div className="flex">
                        <Input
                          type="text"
                          value={selectedKey.prefix}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(selectedKey.prefix)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedKey.status)}
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedKey.status === 'active' && selectedKey.expiresAt && (
                          getTimeUntilExpiration(selectedKey.expiresAt)
                        )}
                        {selectedKey.status === 'expired' && (
                          `Expired on ${formatDate(selectedKey.expiresAt)}`
                        )}
                        {selectedKey.status === 'revoked' && (
                          `Revoked on ${formatDate(selectedKey.events.find(e => e.type === 'revoked')?.timestamp)}`
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="flex gap-2">
                      {selectedKey.scopes.includes('read') && (
                        <Badge variant="outline">Read</Badge>
                      )}
                      {selectedKey.scopes.includes('write') && (
                        <Badge variant="outline">Write</Badge>
                      )}
                      {selectedKey.scopes.includes('admin') && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rate Limit</Label>
                      <div className="text-sm">
                        {selectedKey.rateLimitPerMinute} requests per minute
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Last Used</Label>
                      <div className="text-sm">
                        {selectedKey.lastUsed ? formatDate(selectedKey.lastUsed) : 'Never used'}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>IP Restrictions</Label>
                    {selectedKey.ipRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedKey.ipRestrictions.map(ip => (
                          <Badge key={ip} variant="secondary">
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No IP restrictions (accessible from any IP address)
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Referrer Restrictions</Label>
                    {selectedKey.referrerRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedKey.referrerRestrictions.map(referrer => (
                          <Badge key={referrer} variant="secondary">
                            {referrer}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No referrer restrictions (can be used from any domain)
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="usage" className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Last 24 Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedKey.usage.last24Hours.toLocaleString()}</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">requests</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Last 7 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedKey.usage.last7Days.toLocaleString()}</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">requests</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Last 30 Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedKey.usage.last30Days.toLocaleString()}</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">requests</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage by Endpoint</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Endpoint</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedKey.usage.byEndpoint.length > 0 ? (
                            selectedKey.usage.byEndpoint.map(endpoint => (
                              <TableRow key={endpoint.endpoint}>
                                <TableCell className="font-mono">{endpoint.endpoint}</TableCell>
                                <TableCell className="text-right">{endpoint.count.toLocaleString()}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                                No usage data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="events" className="space-y-4 py-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedKey.events.map(event => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <Badge className={`
                                  ${event.type === 'created' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
                                  ${event.type === 'used' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                                  ${event.type === 'updated' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : ''}
                                  ${event.type === 'expired' ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300' : ''}
                                  ${event.type === 'revoked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
                                `}>
                                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(event.timestamp)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {event.details}
                                  {event.endpoint && (
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                      Endpoint: {event.endpoint}
                                    </div>
                                  )}
                                  {event.ip && (
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                      IP: {event.ip}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Main content */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search API keys..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ApiKeyStatus | 'all')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={environmentFilter}
              onValueChange={(value) => setEnvironmentFilter(value as ApiEnvironment | 'all')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Envs</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* API Keys Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead className="hidden md:table-cell">Key Prefix</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeys.length > 0 ? (
                filteredKeys.map(apiKey => (
                  <TableRow key={apiKey.id} onClick={() => setSelectedKey(apiKey)} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-neutral-500" />
                        {apiKey.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 md:hidden">
                        {apiKey.prefix}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEnvironmentBadge(apiKey.environment)}
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden md:table-cell">
                      {apiKey.prefix}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(apiKey.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(apiKey.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {apiKey.status === 'active' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKey(apiKey);
                              }}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleRevokeKey(apiKey.id);
                              }}>
                                Revoke Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKey(apiKey);
                          }}>
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-1 text-neutral-500 dark:text-neutral-400">
                      <Key className="h-8 w-8 mb-1" />
                      <p>No API keys found</p>
                      <p className="text-sm">Try adjusting your filters or create a new API key</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Documentation Section */}
      <div className="p-4 border-t">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="documentation">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                API Documentation
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md font-mono text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Authorization:</span> Bearer YOUR_API_KEY
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Include your API key in the Authorization header with all requests.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Available Endpoints</h3>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Methods</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableEndpoints.map(endpoint => (
                          <TableRow key={endpoint.path}>
                            <TableCell className="font-mono">{endpoint.path}</TableCell>
                            <TableCell>{endpoint.description}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {endpoint.methods.map(method => (
                                  <Badge key={method} variant="outline" className={`
                                    ${method === 'GET' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : ''}
                                    ${method === 'POST' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''}
                                    ${method === 'PATCH' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : ''}
                                    ${method === 'DELETE' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : ''}
                                  `}>
                                    {method}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Code Examples</h3>
                  <Tabs defaultValue="javascript">
                    <TabsList>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="javascript" className="mt-2">
                      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">
{`// Using fetch API
const apiKey = 'YOUR_API_KEY';

fetch('https://api.echoverse.com/api/content', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="python" className="mt-2">
                      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">
{`# Using requests library
import requests

api_key = 'YOUR_API_KEY'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.echoverse.com/api/content', headers=headers)
data = response.json()
print(data)`}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="curl" className="mt-2">
                      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">
{`curl -X GET \\
  https://api.echoverse.com/api/content \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Full Documentation
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}