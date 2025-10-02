import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Star,
  Download,
  DollarSign,
  Search,
  Filter,
  Plus,
  Code,
  Palette,
  Zap,
  Shield,
  TrendingUp,
  Users
} from "lucide-react"

export function Marketplace() {
  // TODO: Remove mock data - replace with real marketplace data
  const [plugins] = useState([
    { 
      id: 1, 
      name: "Advanced Analytics Pro", 
      developer: "DataViz Studios",
      category: "Analytics",
      price: "$29/month",
      rating: 4.8,
      downloads: 1234,
      description: "Comprehensive analytics dashboard with AI insights",
      featured: true
    },
    { 
      id: 2, 
      name: "Social Media Connector", 
      developer: "SocialTech Inc",
      category: "Integration",
      price: "Free",
      rating: 4.5,
      downloads: 5678,
      description: "Connect and manage multiple social media platforms",
      featured: false
    },
    { 
      id: 3, 
      name: "Custom Theme Builder", 
      developer: "Design Co",
      category: "Design",
      price: "$19/month",
      rating: 4.7,
      downloads: 892,
      description: "Create stunning custom themes with drag-and-drop",
      featured: true
    },
    { 
      id: 4, 
      name: "AI Content Generator", 
      developer: "ContentAI",
      category: "Content",
      price: "$39/month",
      rating: 4.9,
      downloads: 2345,
      description: "Generate high-quality content with advanced AI",
      featured: true
    },
  ])

  const [categories] = useState([
    { name: "Analytics", count: 24, icon: TrendingUp },
    { name: "Design", count: 18, icon: Palette },
    { name: "Integration", count: 32, icon: Zap },
    { name: "Security", count: 12, icon: Shield },
    { name: "Content", count: 15, icon: Code },
    { name: "Social", count: 9, icon: Users },
  ])

  const [myPlugins] = useState([
    { id: 1, name: "Social Media Connector", status: "active", version: "2.1.0", lastUpdate: "2024-01-10" },
    { id: 2, name: "Advanced Analytics Pro", status: "active", version: "1.5.2", lastUpdate: "2024-01-08" },
    { id: 3, name: "Custom Theme Builder", status: "inactive", version: "3.2.1", lastUpdate: "2024-01-05" },
  ])

  const getCategoryBadge = (category: string) => {
    const variants = {
      Analytics: "default",
      Design: "secondary",
      Integration: "outline",
      Security: "destructive",
      Content: "default",
      Social: "secondary"
    } as const
    return variants[category as keyof typeof variants] || "default"
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      updating: "outline"
    } as const
    return variants[status as keyof typeof variants] || "default"
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Plugin Marketplace
          </h1>
          <p className="text-muted-foreground">Extend your platform with powerful plugins and extensions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-submit-plugin">
            <Plus className="h-4 w-4 mr-2" />
            Submit Plugin
          </Button>
          <Button data-testid="button-developer-portal">
            <Code className="h-4 w-4 mr-2" />
            Developer Portal
          </Button>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-plugins">{plugins.length}</div>
            <p className="text-xs text-muted-foreground">5 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-downloads">
              {plugins.reduce((acc, plugin) => acc + plugin.downloads, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+23% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue">$12,345</div>
            <p className="text-xs text-muted-foreground">Developer earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-rating">4.7</div>
            <p className="text-xs text-muted-foreground">Across all plugins</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Plugins</TabsTrigger>
          <TabsTrigger value="installed">My Plugins</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Featured Plugins</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Search plugins..." className="pl-9" data-testid="input-search-plugins" />
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-filter-plugins">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plugins.map((plugin) => (
                  <Card key={plugin.id} className="hover-elevate" data-testid={`plugin-card-${plugin.id}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{plugin.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {plugin.developer}</p>
                        </div>
                        {plugin.featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{plugin.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={getCategoryBadge(plugin.category)}>
                          {plugin.category}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium text-sm">{plugin.price}</div>
                          {renderStarRating(plugin.rating)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{plugin.downloads.toLocaleString()} downloads</span>
                      </div>
                      <Button 
                        className="w-full" 
                        data-testid={`button-install-${plugin.id}`}
                      >
                        {plugin.price === "Free" ? "Install" : "Purchase"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installed Plugins</CardTitle>
              <CardDescription>Manage your installed plugins and extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myPlugins.map((plugin) => (
                  <div key={plugin.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate" data-testid={`installed-plugin-${plugin.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{plugin.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>v{plugin.version}</span>
                          <span>•</span>
                          <span>Updated {plugin.lastUpdate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(plugin.status)}>
                        {plugin.status}
                      </Badge>
                      <Button variant="outline" size="sm" data-testid={`button-configure-${plugin.id}`}>
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-update-${plugin.id}`}>
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Categories</CardTitle>
              <CardDescription>Explore plugins by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.name} className="hover-elevate cursor-pointer" data-testid={`category-${category.name.toLowerCase()}`}>
                    <CardContent className="p-6 text-center">
                      <category.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-medium text-foreground mb-1">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} plugins</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Developer Dashboard</CardTitle>
              <CardDescription>Manage your published plugins and track performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-create-plugin">
                  <Plus className="h-6 w-6" />
                  Create New Plugin
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-plugin-analytics">
                  <TrendingUp className="h-6 w-6" />
                  Analytics
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-documentation">
                  <Code className="h-6 w-6" />
                  Documentation
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-support-center">
                  <Shield className="h-6 w-6" />
                  Support Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}