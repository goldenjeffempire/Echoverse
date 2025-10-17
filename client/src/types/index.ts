// Shared TypeScript types for the frontend

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  subscriptionTier?: string;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sku: string;
  inventory: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  type: 'post' | 'page';
  language: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  ownerId: string;
  avatar?: string;
  cover?: string;
  isPrivate: boolean;
  memberCount: number;
  settings?: CommunitySettings;
  createdAt: string;
  updatedAt: string;
}

export interface CommunitySettings {
  allowPosts: boolean;
  requireApproval: boolean;
  allowInvites: boolean;
}

export interface Plugin {
  id: string;
  developerId: string;
  name: string;
  description: string;
  version: string;
  category: string;
  price: number;
  icon?: string;
  screenshots?: string[];
  manifest?: PluginManifest;
  isActive: boolean;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PluginManifest {
  permissions: string[];
  dependencies: string[];
  settings: Record<string, any>;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  status: 'draft' | 'active' | 'paused' | 'completed';
  content?: CampaignContent;
  targeting?: CampaignTargeting;
  schedule?: CampaignSchedule;
  metrics?: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignContent {
  subject?: string;
  body: string;
  template?: string;
}

export interface CampaignTargeting {
  segments: string[];
  filters: Record<string, any>;
}

export interface CampaignSchedule {
  startDate?: string;
  endDate?: string;
  frequency?: string;
}

export interface CampaignMetrics {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface Lead {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  userId: string;
  name: string;
  description?: string;
  domain?: string;
  template?: string;
  content: WebsiteContent;
  settings: WebsiteSettings;
  status: 'draft' | 'published' | 'archived';
  version: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteContent {
  pages: WebsitePage[];
  components: WebsiteComponent[];
}

export interface WebsitePage {
  id: string;
  name: string;
  route: string;
  title: string;
  content: string;
  components: string[];
  seo: SEOMetadata;
}

export interface WebsiteComponent {
  id: string;
  type: string;
  name: string;
  html: string;
  css: string;
  props: Record<string, any>;
  preview?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface WebsiteSettings {
  theme: WebsiteTheme;
  navigation: WebsiteNavigation;
  analytics?: boolean;
  customCode?: {
    head?: string;
    body?: string;
  };
}

export interface WebsiteTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: string;
}

export interface WebsiteNavigation {
  type: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  name: string;
  route: string;
  external?: boolean;
  children?: NavigationItem[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'security' | 'marketing' | 'social';
  title: string;
  message?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsStats {
  revenue: string;
  users: string;
  orders: string;
  pages: string;
  growth: string;
  activeUsers: string;
}

export interface Activity {
  type: string;
  content: string;
  time: string;
}
