// client/src/components/developer/ApiKeyManager.tsx
import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient'; // Assuming this is a custom utility for API calls
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
  Search,
  Zap,
  History,
  TrendingUp,
  ExternalLink,
  CalendarDays,
  Gauge,
  CircleDot,
  User,
  Hash,
  Filter, // Added Filter for clarity in UI
  X, // Added X for clearing search
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
import { Progress } from '@/components/ui/progress';

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
    name: 'Production API Key for Backend',
    prefix: 'echo_prod_',
    scopes: ['read', 'write'],
    environment: 'production',
    createdAt: new Date('2025-01-15T10:24:32'),
    expiresAt: new Date('2026-01-15T10:24:32'),
    lastUsed: new Date('2025-05-22T14:32:11'), // Updated to reflect "today"
    status: 'active',
    createdBy: 'Sarah Johnson',
    usage: {
      last24Hours: 1287,
      last7Days: 9432,
      last30Days: 38562,
      byEndpoint: [
        { endpoint: '/api/content', count: 4562 },
        { endpoint: '/api/users', count: 2341 },
        { endpoint: '/api/analytics', count: 1853 },
      ],
    },
    events: [
      {
        id: 'event_1',
        type: 'created',
        timestamp: new Date('2025-01-15T10:24:32'),
        details: 'API key created by Sarah Johnson',
      },
      {
        id: 'event_2',
        type: 'used',
        timestamp: new Date('2025-05-22T14:32:11'),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        endpoint: '/api/content',
        details: 'Successful GET request to /api/content',
      },
      {
        id: 'event_2a',
        type: 'used',
        timestamp: new Date('2025-05-21T10:00:00'),
        ip: '192.168.1.5',
        userAgent: 'curl/7.81.0',
        endpoint: '/api/users',
        details: 'Successful POST request to /api/users',
      },
      {
        id: 'event_2b',
        type: 'updated',
        timestamp: new Date('2025-03-01T09:00:00'),
        details: 'Scopes updated by admin',
      },
    ],
    rateLimitPerMinute: 120,
    ipRestrictions: ['192.168.1.1', '192.168.1.2'],
    referrerRestrictions: ['app.example.com'],
  },
  {
    id: 'key_2',
    name: 'Development Testing API',
    prefix: 'echo_dev_',
    scopes: ['read', 'write', 'admin'],
    environment: 'development',
    createdAt: new Date('2025-03-20T15:11:22'),
    expiresAt: new Date('2025-09-20T15:11:22'),
    lastUsed: new Date('2025-05-21T09:15:43'),
    status: 'active',
    createdBy: 'Michael Chen',
    usage: {
      last24Hours: 342,
      last7Days: 1543,
      last30Days: 5678,
      byEndpoint: [
        { endpoint: '/api/debug', count: 1245 },
        { endpoint: '/api/test', count: 987 },
        { endpoint: '/api/users', count: 456 },
      ],
    },
    events: [
      {
        id: 'event_3',
        type: 'created',
        timestamp: new Date('2025-03-20T15:11:22'),
        details: 'API key created by Michael Chen',
      },
    ],
    rateLimitPerMinute: 240,
    ipRestrictions: ['192.168.1.10', '192.168.1.11'],
    referrerRestrictions: ['localhost:3000', 'dev.echoverse.com'],
  },
  {
    id: 'key_3',
    name: 'External Partner Integration',
    prefix: 'echo_partner_',
    scopes: ['read'],
    environment: 'production',
    createdAt: new Date('2024-11-05T11:45:16'),
    expiresAt: new Date('2025-05-23T11:45:16'), // Expires today
    lastUsed: new Date('2025-05-22T19:22:01'),
    status: 'active', // Will become expired based on calculation
    createdBy: 'Sarah Johnson',
    usage: {
      last24Hours: 523,
      last7Days: 3641,
      last30Days: 14532,
      byEndpoint: [
        { endpoint: '/api/public/content', count: 12453 },
        { endpoint: '/api/public/data', count: 2079 },
      ],
    },
    events: [
      {
        id: 'event_4',
        type: 'created',
        timestamp: new Date('2024-11-05T11:45:16'),
        details: 'API key created for partner integration',
      },
      {
        id: 'event_5',
        type: 'updated',
        timestamp: new Date('2025-02-20T14:10:45'),
        details: 'Rate limit increased from 60 to 100 requests/minute',
      },
    ],
    rateLimitPerMinute: 100,
    ipRestrictions: ['203.0.113.15', '203.0.113.16'],
    referrerRestrictions: ['partner.example.com'],
  },
  {
    id: 'key_4',
    name: 'Legacy System Access',
    prefix: 'echo_legacy_',
    scopes: ['read', 'write'],
    environment: 'production',
    createdAt: new Date('2023-05-10T09:15:22'),
    expiresAt: null, // No explicit expiration
    lastUsed: new Date('2025-03-15T10:11:32'),
    status: 'revoked', // Manually revoked
    createdBy: 'David Kim',
    usage: {
      last24Hours: 0,
      last7Days: 0,
      last30Days: 542,
      byEndpoint: [{ endpoint: '/api/legacy/sync', count: 542 }],
    },
    events: [
      {
        id: 'event_6',
        type: 'created',
        timestamp: new Date('2023-05-10T09:15:22'),
        details: 'API key created for legacy system integration',
      },
      {
        id: 'event_7',
        type: 'revoked',
        timestamp: new Date('2025-04-01T10:00:00'),
        details: 'API key revoked by admin',
      },
    ],
    rateLimitPerMinute: 60,
    ipRestrictions: [],
    referrerRestrictions: [],
  },
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
  { path: '/api/test', description: 'Test endpoints (non-production)', methods: ['GET', 'POST'] },
];

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [filteredKeys, setFilteredKeys] = useState<ApiKey[]>(mockApiKeys);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiKeyStatus | 'all'>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<ApiEnvironment | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false); // Renamed to avoid conflict
  const [newKeyData, setNewKeyData] = useState<Partial<ApiKey>>({
    name: '',
    scopes: ['read'],
    environment: 'development',
    expiresAt: null, // Will be set by handleExpirationChange
    rateLimitPerMinute: 60,
    ipRestrictions: [],
    referrerRestrictions: [],
  });
  const [newlyGeneratedApiKey, setNewlyGeneratedApiKey] = useState<string | null>(null); // Renamed for clarity
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newIpRestriction, setNewIpRestriction] = useState('');
  const [newReferrerRestriction, setNewReferrerRestriction] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const { toast } = useToast();

  // Filter API keys based on search and filters
  useEffect(() => {
    let result = [...apiKeys];

    // Status calculation (dynamic status based on expiration)
    result = result.map((key) => {
      if (key.status === 'revoked') {
        return key; // Revoked keys remain revoked
      }
      const now = new Date();
      if (key.expiresAt && key.expiresAt < now) {
        return { ...key, status: 'expired' };
      }
      return key;
    });

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (key) =>
          key.name.toLowerCase().includes(lowerQuery) ||
          key.prefix.toLowerCase().includes(lowerQuery) ||
          key.id.toLowerCase().includes(lowerQuery) ||
          key.createdBy.toLowerCase().includes(lowerQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((key) => key.status === statusFilter);
    }

    // Environment filter
    if (environmentFilter !== 'all') {
      result = result.filter((key) => key.environment === environmentFilter);
    }

    // Sort by creation date, newest first
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredKeys(result);
  }, [apiKeys, searchQuery, statusFilter, environmentFilter]);

  // Handle selected key change (e.g., when clicking on a key in the list)
  useEffect(() => {
    if (selectedKey) {
      // Find the updated key in the main apiKeys array
      const updatedSelectedKey = apiKeys.find((key) => key.id === selectedKey.id);
      setSelectedKey(updatedSelectedKey || null);
    }
  }, [apiKeys, selectedKey]);

  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format relative time
  const getRelativeTime = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'In the future'; // For expiresAt

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
  const getTimeUntilExpiration = (expiresAt: Date | null | undefined) => {
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
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Get environment badge color
  const getEnvironmentBadge = (environment: ApiEnvironment) => {
    switch (environment) {
      case 'development':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Development</Badge>
        );
      case 'staging':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Staging</Badge>
        );
      case 'production':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Production</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, description: string = 'Content') => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${description} has been copied to your clipboard.`,
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
    if (!newKeyData.scopes || newKeyData.scopes.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please select at least one permission scope.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest('POST', '/api/developer/keys', newKeyData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a random API key
      const keyPrefix = `echo_${newKeyData.environment?.substring(0, 4)}_${Math.random()
        .toString(36)
        .substring(2, 7)}`;
      const keySecret =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const fullKey = `${keyPrefix}${keySecret}`; // Changed to not have underscore before secret

      // Create new API key object
      const now = new Date();
      const newKey: ApiKey = {
        id: `key_${Date.now()}`,
        name: newKeyData.name || 'Unnamed Key',
        prefix: keyPrefix,
        key: fullKey, // This will be shown only once
        scopes: (newKeyData.scopes as ApiKeyScope[]) || ['read'],
        environment: (newKeyData.environment as ApiEnvironment) || 'development',
        createdAt: now,
        expiresAt: newKeyData.expiresAt || null,
        lastUsed: null,
        status: 'active',
        createdBy: 'Current User', // This would be the actual user in a real app
        usage: {
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0,
          byEndpoint: [],
        },
        events: [
          {
            id: `event_${Date.now()}`,
            type: 'created',
            timestamp: now,
            details: `API key created by Current User`,
          },
        ],
        rateLimitPerMinute: newKeyData.rateLimitPerMinute || 60,
        ipRestrictions: newKeyData.ipRestrictions || [],
        referrerRestrictions: newKeyData.referrerRestrictions || [],
      };

      // Add to list and reset form
      setApiKeys((prevKeys) => [newKey, ...prevKeys]);
      setNewlyGeneratedApiKey(fullKey);
      setShowNewKeyDialog(true);
      setIsCreatingKey(false);
      setNewKeyData({
        name: '',
        scopes: ['read'],
        environment: 'development',
        expiresAt: null,
        rateLimitPerMinute: 60,
        ipRestrictions: [],
        referrerRestrictions: [],
      }); // Reset form after creation

      toast({
        title: 'API Key Created',
        description: 'Your new API key has been created successfully. Store it safely!',
        action: (
          <Button variant="outline" onClick={() => copyToClipboard(fullKey, 'API Key')}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        ),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      const updatedKeys = apiKeys.map((key) => {
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
                details: 'API key revoked manually',
              },
            ],
          };
        }
        return key;
      });
      setApiKeys(updatedKeys);

      // If the currently viewed key is revoked, clear selection
      if (selectedKey?.id === keyId) {
        setSelectedKey(null);
        setActiveTab('overview'); // Reset tab
      }

      toast({
        title: 'API Key Revoked',
        description: 'The API key has been revoked successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to revoke API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
      setIsConfirmingRevoke(false); // Close confirmation dialog
    }
  };

  // Handle updating an API key (e.g., rate limit, restrictions, name)
  const handleUpdateKey = async (updatedFields: Partial<ApiKey>) => {
    if (!selectedKey) return;
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // await apiRequest('PATCH', `/api/developer/keys/${selectedKey.id}`, updatedFields);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setApiKeys((prevKeys) =>
        prevKeys.map((key) => {
          if (key.id === selectedKey.id) {
            const now = new Date();
            return {
              ...key,
              ...updatedFields,
              events: [
                ...key.events,
                {
                  id: `event_${Date.now()}`,
                  type: 'updated',
                  timestamp: now,
                  details: 'API key settings updated',
                },
              ],
            };
          }
          return key;
        })
      );

      toast({
        title: 'API Key Updated',
        description: 'API key settings saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add IP restriction to selectedKey
  const handleAddIpRestrictionToSelected = () => {
    if (!selectedKey || !newIpRestriction) return;

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIpRestriction)) {
      toast({
        title: 'Invalid IP Address',
        description: 'Please enter a valid IPv4 address.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedKey.ipRestrictions.includes(newIpRestriction)) {
      toast({
        title: 'Duplicate Entry',
        description: 'This IP address is already added.',
        variant: 'warning',
      });
      return;
    }

    handleUpdateKey({
      ipRestrictions: [...selectedKey.ipRestrictions, newIpRestriction],
    });
    setNewIpRestriction('');
  };

  // Remove IP restriction from selectedKey
  const handleRemoveIpRestrictionFromSelected = (ip: string) => {
    if (!selectedKey) return;
    handleUpdateKey({
      ipRestrictions: selectedKey.ipRestrictions.filter((r) => r !== ip),
    });
  };

  // Add referrer restriction to selectedKey
  const handleAddReferrerRestrictionToSelected = () => {
    if (!selectedKey || !newReferrerRestriction) return;

    // Basic referrer validation (can be enhanced)
    try {
      new URL(newReferrerRestriction); // Check if it's a valid URL format
    } catch {
      toast({
        title: 'Invalid Referrer URL',
        description: 'Please enter a valid URL (e.g., https://example.com or example.com).',
        variant: 'destructive',
      });
      return;
    }

    if (selectedKey.referrerRestrictions.includes(newReferrerRestriction)) {
      toast({
        title: 'Duplicate Entry',
        description: 'This referrer is already added.',
        variant: 'warning',
      });
      return;
    }

    handleUpdateKey({
      referrerRestrictions: [...selectedKey.referrerRestrictions, newReferrerRestriction],
    });
    setNewReferrerRestriction('');
  };

  // Remove referrer restriction from selectedKey
  const handleRemoveReferrerRestrictionFromSelected = (referrer: string) => {
    if (!selectedKey) return;
    handleUpdateKey({
      referrerRestrictions: selectedKey.referrerRestrictions.filter((r) => r !== referrer),
    });
  };

  // Set expiration date for new key
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
      expiresAt,
    });
  };

  // Component for displaying endpoint usage breakdown
  const EndpointUsageChart = ({ usageData }: { usageData: { endpoint: string; count: number }[] }) => {
    if (!usageData || usageData.length === 0) {
      return <p className="text-neutral-500">No endpoint usage data available.</p>;
    }

    const totalRequests = usageData.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="space-y-3">
        {usageData
          .sort((a, b) => b.count - a.count)
          .map((item) => (
            <div key={item.endpoint} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-neutral-200">{item.endpoint}</span>
                  <span className="text-neutral-400">
                    {item.count} ({((item.count / totalRequests) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress value={(item.count / totalRequests) * 100} className="h-2" />
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-900">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-50">API Key Management</h1>
            <p className="text-neutral-400 mt-1">
              Create and manage API keys for accessing Echoverse APIs securely.
            </p>
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
            <Button onClick={() => setIsCreatingKey(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
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
              Generate a new API key with specific permissions and restrictions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Backend, Mobile App, etc."
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-neutral-50"
              />
              <p className="text-sm text-neutral-500">
                Give your API key a descriptive name to help you identify its purpose.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={newKeyData.environment as string}
                onValueChange={(value) => setNewKeyData({ ...newKeyData, environment: value as ApiEnvironment })}
              >
                <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-neutral-50">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-50">
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                Choose the environment where this API key will be used.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permission-read"
                    checked={newKeyData.scopes?.includes('read')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: [...(newKeyData.scopes || []), 'read'],
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter((s) => s !== 'read'),
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-read" className="text-neutral-200">
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
                          scopes: [...(newKeyData.scopes || []), 'write'],
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter((s) => s !== 'write'),
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-write" className="text-neutral-200">
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
                          scopes: [...(newKeyData.scopes || []), 'admin'],
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          scopes: (newKeyData.scopes || []).filter((s) => s !== 'admin'),
                        });
                      }
                    }}
                  />
                  <Label htmlFor="permission-admin" className="text-neutral-200">
                    Admin (Sensitive operations)
                  </Label>
                </div>
              </div>
              <p className="text-sm text-neutral-500">
                Define what actions this API key is allowed to perform.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
              <Input
                id="rateLimit"
                type="number"
                min="1"
                placeholder="e.g., 60, 120, 500"
                value={newKeyData.rateLimitPerMinute}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, rateLimitPerMinute: parseInt(e.target.value) || 0 })
                }
                className="bg-neutral-800 border-neutral-700 text-neutral-50"
              />
              <p className="text-sm text-neutral-500">
                Control the maximum number of requests this API key can make per minute.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select
                value={
                  newKeyData.expiresAt === null
                    ? 'never'
                    : newKeyData.expiresAt.getTime() ===
                      new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).getTime()
                      ? '30days'
                      : newKeyData.expiresAt.getTime() ===
                        new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000).getTime()
                        ? '90days'
                        : newKeyData.expiresAt.getTime() ===
                          new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).getTime()
                          ? '1year'
                          : 'custom' // Fallback for custom or unrecognised date
                }
                onValueChange={handleExpirationChange}
              >
                <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-neutral-50">
                  <SelectValue placeholder="Set expiration" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-50">
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                Automatically expire this API key after a certain period for enhanced security.
              </p>
            </div>

            <div className="space-y-4">
              <Label>IP Restrictions (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 192.168.1.100"
                  value={newIpRestriction}
                  onChange={(e) => setNewIpRestriction(e.target.value)}
                  className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-50"
                />
                <Button variant="outline" onClick={handleAddIpRestrictionToSelected}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newKeyData.ipRestrictions?.map((ip) => (
                  <Badge
                    key={ip}
                    variant="secondary"
                    className="flex items-center gap-1 bg-neutral-700 text-neutral-100"
                  >
                    {ip}
                    <XCircle
                      className="h-3 w-3 cursor-pointer text-neutral-400 hover:text-neutral-50 transition-colors"
                      onClick={() =>
                        setNewKeyData({
                          ...newKeyData,
                          ipRestrictions: newKeyData.ipRestrictions?.filter((r) => r !== ip),
                        })
                      }
                    />
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-neutral-500">
                Restrict API key usage to specific IP addresses for added security.
              </p>
            </div>

            <div className="space-y-4">
              <Label>Referrer Restrictions (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., https://example.com"
                  value={newReferrerRestriction}
                  onChange={(e) => setNewReferrerRestriction(e.target.value)}
                  className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-50"
                />
                <Button variant="outline" onClick={handleAddReferrerRestrictionToSelected}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newKeyData.referrerRestrictions?.map((referrer) => (
                  <Badge
                    key={referrer}
                    variant="secondary"
                    className="flex items-center gap-1 bg-neutral-700 text-neutral-100"
                  >
                    {referrer}
                    <XCircle
                      className="h-3 w-3 cursor-pointer text-neutral-400 hover:text-neutral-50 transition-colors"
                      onClick={() =>
                        setNewKeyData({
                          ...newKeyData,
                          referrerRestrictions: newKeyData.referrerRestrictions?.filter((r) => r !== referrer),
                        })
                      }
                    />
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-neutral-500">
                Restrict API key usage to requests originating from specific referrers (e.g., your website).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingKey(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isLoading || !newKeyData.name || newKeyData.scopes?.length === 0}>
              {isLoading ? 'Creating...' : 'Create API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newly Generated API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Please copy your new API key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Input
                className="pr-10 font-mono text-neutral-50 bg-neutral-800 border-neutral-700"
                value={newlyGeneratedApiKey || ''}
                readOnly
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-1 text-neutral-400 hover:text-neutral-50"
                onClick={() => copyToClipboard(newlyGeneratedApiKey || '', 'API Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-amber-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Store this key securely. You will not be able to retrieve it again.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKeyDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
        {/* Left Pane: API Key List */}
        <div className="lg:col-span-1 border-r border-neutral-700 flex flex-col bg-neutral-800">
          <div className="p-4 border-b border-neutral-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search keys..."
                className="w-full pl-9 bg-neutral-700 border-neutral-600 text-neutral-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 text-neutral-400 hover:text-neutral-50"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between gap-2 text-neutral-50 border-neutral-700 bg-neutral-900">
                    <Filter className="h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-neutral-800 border-neutral-700 text-neutral-50">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('expired')}>Expired</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('revoked')}>Revoked</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between gap-2 text-neutral-50 border-neutral-700 bg-neutral-900">
                    <Gauge className="h-4 w-4" />
                    Env: {environmentFilter === 'all' ? 'All' : environmentFilter}
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-neutral-800 border-neutral-700 text-neutral-50">
                  <DropdownMenuLabel>Filter by Environment</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEnvironmentFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnvironmentFilter('development')}>Development</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnvironmentFilter('staging')}>Staging</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnvironmentFilter('production')}>Production</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-700">
            {filteredKeys.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">No API keys found.</div>
            ) : (
              filteredKeys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 cursor-pointer hover:bg-neutral-700 transition-colors ${
                    selectedKey?.id === key.id ? 'bg-neutral-700 border-l-4 border-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedKey(key);
                    setActiveTab('overview');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-50">{key.name}</h3>
                    {getStatusBadge(key.status)}
                  </div>
                  <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {key.prefix}*****
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
                    <Clock className="h-3 w-3" />
                    Last used: {getRelativeTime(key.lastUsed)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                    <CalendarDays className="h-3 w-3" />
                    {getTimeUntilExpiration(key.expiresAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: API Key Details */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col bg-neutral-900">
          {!selectedKey ? (
            <div className="flex flex-1 items-center justify-center text-neutral-500">
              <Info className="h-6 w-6 mr-2" />
              Select an API key to view its details.
            </div>
          ) : (
            <>
              {/* Details Header */}
              <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-50">{selectedKey.name}</h2>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-neutral-50 border-neutral-700 bg-neutral-800">
                        <Settings className="h-4 w-4" /> Options
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 text-neutral-50">
                      <DropdownMenuItem
                        onClick={() => setSelectedKey({ ...selectedKey, expiresAt: null })}
                        disabled={selectedKey.status === 'revoked'}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Expiration
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DialogTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => setIsConfirmingRevoke(true)}
                          className="text-red-400 hover:text-red-500 hover:bg-neutral-700 focus:text-red-500 focus:bg-neutral-700"
                          disabled={selectedKey.status === 'revoked'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Revoke Key
                        </DropdownMenuItem>
                      </DialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Revoke Confirmation Dialog */}
              <Dialog open={isConfirmingRevoke} onOpenChange={setIsConfirmingRevoke}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Confirm Revocation
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to revoke the API key "
                      <span className="font-semibold text-neutral-200">{selectedKey.name}</span>"? This
                      action cannot be undone and the key will immediately become inactive.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmingRevoke(false)} disabled={isRevoking}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleRevokeKey(selectedKey.id)} disabled={isRevoking}>
                      {isRevoking ? 'Revoking...' : 'Revoke Key'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Details Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-neutral-700 bg-neutral-900 text-neutral-400">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-none">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-none">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="events" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-none">
                    Event Log
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-900">
                  <Card className="bg-neutral-800 border-neutral-700 text-neutral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" /> Key Information
                      </CardTitle>
                      <CardDescription>Essential details about this API key.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Key Name</Label>
                          <p className="font-medium text-neutral-50">{selectedKey.name}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Key Status</Label>
                          {getStatusBadge(selectedKey.status)}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Prefix</Label>
                          <p className="font-mono text-neutral-50">{selectedKey.prefix}*****</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Environment</Label>
                          {getEnvironmentBadge(selectedKey.environment)}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Created At</Label>
                          <p className="text-neutral-50">{formatDate(selectedKey.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Last Used</Label>
                          <p className="text-neutral-50">{formatDate(selectedKey.lastUsed)} ({getRelativeTime(selectedKey.lastUsed)})</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Expires At</Label>
                          <p className="text-neutral-50">{formatDate(selectedKey.expiresAt)} ({getTimeUntilExpiration(selectedKey.expiresAt)})</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400">Created By</Label>
                          <p className="text-neutral-50">{selectedKey.createdBy}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-neutral-400">Scopes</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedKey.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="bg-neutral-700 text-neutral-100">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-neutral-800 border-neutral-700 text-neutral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Usage Metrics
                      </CardTitle>
                      <CardDescription>Overview of API key usage over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-neutral-400 flex items-center gap-1">
                            <Clock3 className="h-4 w-4" /> Last 24 Hours
                          </Label>
                          <p className="text-2xl font-bold text-neutral-50">{selectedKey.usage.last24Hours.toLocaleString()}</p>
                          <p className="text-sm text-neutral-500">requests</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Last 7 Days
                          </Label>
                          <p className="text-2xl font-bold text-neutral-50">{selectedKey.usage.last7Days.toLocaleString()}</p>
                          <p className="text-sm text-neutral-500">requests</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-neutral-400 flex items-center gap-1">
                            <History className="h-4 w-4" /> Last 30 Days
                          </Label>
                          <p className="text-2xl font-bold text-neutral-50">{selectedKey.usage.last30Days.toLocaleString()}</p>
                          <p className="text-sm text-neutral-500">requests</p>
                        </div>
                      </div>
                      <Separator className="bg-neutral-700" />
                      <div className="space-y-2">
                        <Label className="text-neutral-400 flex items-center gap-1">
                          <ListFilter className="h-4 w-4" /> Usage by Endpoint
                        </Label>
                        <EndpointUsageChart usageData={selectedKey.usage.byEndpoint} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-900">
                  <Card className="bg-neutral-800 border-neutral-700 text-neutral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> General Settings
                      </CardTitle>
                      <CardDescription>Adjust the general properties of this API key.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editKeyName">API Key Name</Label>
                        <Input
                          id="editKeyName"
                          value={selectedKey.name}
                          onChange={(e) => setSelectedKey({ ...selectedKey, name: e.target.value })}
                          onBlur={() => handleUpdateKey({ name: selectedKey.name })}
                          className="bg-neutral-900 border-neutral-700 text-neutral-50"
                          disabled={selectedKey.status === 'revoked'}
                        />
                        <p className="text-sm text-neutral-500">A descriptive name for your API key.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editRateLimit">Rate Limit (requests/minute)</Label>
                        <Input
                          id="editRateLimit"
                          type="number"
                          min="1"
                          value={selectedKey.rateLimitPerMinute}
                          onChange={(e) => setSelectedKey({ ...selectedKey, rateLimitPerMinute: parseInt(e.target.value) || 0 })}
                          onBlur={() => handleUpdateKey({ rateLimitPerMinute: selectedKey.rateLimitPerMinute })}
                          className="bg-neutral-900 border-neutral-700 text-neutral-50"
                          disabled={selectedKey.status === 'revoked'}
                        />
                        <p className="text-sm text-neutral-500">
                          Controls the maximum number of requests per minute for this key.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEnvironment">Environment</Label>
                        <Select
                          value={selectedKey.environment}
                          onValueChange={(value) => {
                            setSelectedKey({ ...selectedKey, environment: value as ApiEnvironment });
                            handleUpdateKey({ environment: value as ApiEnvironment });
                          }}
                          disabled={selectedKey.status === 'revoked'}
                        >
                          <SelectTrigger id="editEnvironment" className="w-full bg-neutral-900 border-neutral-700 text-neutral-50">
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-50">
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-neutral-500">
                          The deployment environment this API key is associated with.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-neutral-800 border-neutral-700 text-neutral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Security & Restrictions
                      </CardTitle>
                      <CardDescription>Manage access control for this API key.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label>IP Restrictions</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add IP address (e.g., 203.0.113.45)"
                            value={newIpRestriction}
                            onChange={(e) => setNewIpRestriction(e.target.value)}
                            className="flex-1 bg-neutral-900 border-neutral-700 text-neutral-50"
                            disabled={selectedKey.status === 'revoked'}
                          />
                          <Button variant="outline" onClick={handleAddIpRestrictionToSelected} disabled={selectedKey.status === 'revoked'}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedKey.ipRestrictions.length === 0 && selectedKey.status !== 'revoked' ? (
                            <p className="text-sm text-neutral-500">No IP restrictions set. Key can be used from any IP.</p>
                          ) : selectedKey.ipRestrictions.length === 0 && selectedKey.status === 'revoked' ? (
                            <p className="text-sm text-neutral-500">No IP restrictions were set for this revoked key.</p>
                          ) : (
                            selectedKey.ipRestrictions.map((ip) => (
                              <Badge
                                key={ip}
                                variant="secondary"
                                className="flex items-center gap-1 bg-neutral-700 text-neutral-100"
                              >
                                {ip}
                                {selectedKey.status !== 'revoked' && (
                                  <XCircle
                                    className="h-3 w-3 cursor-pointer text-neutral-400 hover:text-neutral-50 transition-colors"
                                    onClick={() => handleRemoveIpRestrictionFromSelected(ip)}
                                  />
                                )}
                              </Badge>
                            ))
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          Only requests from these IP addresses will be authorized.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Label>Referrer Restrictions</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add referrer (e.g., https://your-domain.com)"
                            value={newReferrerRestriction}
                            onChange={(e) => setNewReferrerRestriction(e.target.value)}
                            className="flex-1 bg-neutral-900 border-neutral-700 text-neutral-50"
                            disabled={selectedKey.status === 'revoked'}
                          />
                          <Button variant="outline" onClick={handleAddReferrerRestrictionToSelected} disabled={selectedKey.status === 'revoked'}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedKey.referrerRestrictions.length === 0 && selectedKey.status !== 'revoked' ? (
                            <p className="text-sm text-neutral-500">No referrer restrictions set. Key can be used from any referrer.</p>
                          ) : selectedKey.referrerRestrictions.length === 0 && selectedKey.status === 'revoked' ? (
                            <p className="text-sm text-neutral-500">No referrer restrictions were set for this revoked key.</p>
                          ) : (
                            selectedKey.referrerRestrictions.map((referrer) => (
                              <Badge
                                key={referrer}
                                variant="secondary"
                                className="flex items-center gap-1 bg-neutral-700 text-neutral-100"
                              >
                                {referrer}
                                {selectedKey.status !== 'revoked' && (
                                  <XCircle
                                    className="h-3 w-3 cursor-pointer text-neutral-400 hover:text-neutral-50 transition-colors"
                                    onClick={() => handleRemoveReferrerRestrictionFromSelected(referrer)}
                                  />
                                )}
                              </Badge>
                            ))
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          Only requests originating from these HTTP referrers will be authorized.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>API Key Scopes</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="scope-read"
                              checked={selectedKey.scopes.includes('read')}
                              onCheckedChange={(checked) => {
                                let updatedScopes: ApiKeyScope[];
                                if (checked) {
                                  updatedScopes = [...selectedKey.scopes, 'read'];
                                } else {
                                  updatedScopes = selectedKey.scopes.filter((s) => s !== 'read');
                                }
                                setSelectedKey({ ...selectedKey, scopes: updatedScopes });
                                handleUpdateKey({ scopes: updatedScopes });
                              }}
                              disabled={selectedKey.status === 'revoked'}
                            />
                            <Label htmlFor="scope-read" className="text-neutral-200">
                              Read (GET requests)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="scope-write"
                              checked={selectedKey.scopes.includes('write')}
                              onCheckedChange={(checked) => {
                                let updatedScopes: ApiKeyScope[];
                                if (checked) {
                                  updatedScopes = [...selectedKey.scopes, 'write'];
                                } else {
                                  updatedScopes = selectedKey.scopes.filter((s) => s !== 'write');
                                }
                                setSelectedKey({ ...selectedKey, scopes: updatedScopes });
                                handleUpdateKey({ scopes: updatedScopes });
                              }}
                              disabled={selectedKey.status === 'revoked'}
                            />
                            <Label htmlFor="scope-write" className="text-neutral-200">
                              Write (POST, PATCH, PUT requests)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="scope-admin"
                              checked={selectedKey.scopes.includes('admin')}
                              onCheckedChange={(checked) => {
                                let updatedScopes: ApiKeyScope[];
                                if (checked) {
                                  updatedScopes = [...selectedKey.scopes, 'admin'];
                                } else {
                                  updatedScopes = selectedKey.scopes.filter((s) => s !== 'admin');
                                }
                                setSelectedKey({ ...selectedKey, scopes: updatedScopes });
                                handleUpdateKey({ scopes: updatedScopes });
                              }}
                              disabled={selectedKey.status === 'revoked'}
                            />
                            <Label htmlFor="scope-admin" className="text-neutral-200">
                              Admin (Sensitive operations)
                            </Label>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Define the set of permissions granted to this API key.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="events" className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-900">
                  <Card className="bg-neutral-800 border-neutral-700 text-neutral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Event Log
                      </CardTitle>
                      <CardDescription>A chronological record of actions related to this API key.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-neutral-700">
                            <TableHead className="w-[150px] text-neutral-400">Timestamp</TableHead>
                            <TableHead className="text-neutral-400">Event Type</TableHead>
                            <TableHead className="text-neutral-400">Details</TableHead>
                            <TableHead className="text-neutral-400">IP / User Agent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedKey.events.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-neutral-500 py-4">
                                No events recorded for this API key.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedKey.events
                              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Newest first
                              .map((event) => (
                                <TableRow key={event.id} className="border-neutral-700">
                                  <TableCell className="font-medium text-neutral-50">
                                    {formatDate(event.timestamp)}
                                    <span className="block text-xs text-neutral-500">
                                      ({getRelativeTime(event.timestamp)})
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={`
                                        ${event.type === 'created' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                                        ${event.type === 'used' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}
                                        ${event.type === 'updated' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}
                                        ${event.type === 'expired' && 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}
                                        ${event.type === 'revoked' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}
                                      `}
                                    >
                                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-neutral-200">{event.details}</TableCell>
                                  <TableCell className="text-neutral-400 text-sm">
                                    {event.ip && <p>IP: {event.ip}</p>}
                                    {event.userAgent && (
                                      <p className="truncate max-w-[200px]">Agent: {event.userAgent}</p>
                                    )}
                                    {!event.ip && !event.userAgent && <p>N/A</p>}
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
