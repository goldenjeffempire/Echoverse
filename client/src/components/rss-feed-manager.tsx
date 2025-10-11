import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { 
  Rss,
  Plus,
  Copy,
  Download,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RssFeed {
  id: string
  title: string
  description: string
  url: string
  enabled: boolean
  contentType: string
  includeImages: boolean
  itemLimit: number
  createdAt: string
  lastGenerated?: string
  subscriberCount: number
}

export function RssFeedManager() {
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newFeed, setNewFeed] = useState({
    title: "",
    description: "",
    contentType: "posts",
    includeImages: true,
    itemLimit: 20
  })
  const { toast } = useToast()

  useEffect(() => {
    loadFeeds()
  }, [])

  const loadFeeds = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<{ feeds: RssFeed[] }>('/api/rss/feeds')
      setFeeds(response.feeds || [])
    } catch (error: any) {
      toast({
        title: "Error loading feeds",
        description: error.message || "Failed to load RSS feeds",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFeed = async () => {
    if (!newFeed.title || !newFeed.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiClient.post<{ feed: RssFeed }>('/api/rss/feeds', newFeed)
      setFeeds([response.feed, ...feeds])
      setNewFeed({
        title: "",
        description: "",
        contentType: "posts",
        includeImages: true,
        itemLimit: 20
      })
      toast({
        title: "Feed created",
        description: "RSS feed has been created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create RSS feed",
        variant: "destructive"
      })
    }
  }

  const handleGenerateFeed = async (feedId: string) => {
    setGenerating(true)
    try {
      await apiClient.post(`/api/rss/feeds/${feedId}/generate`)
      toast({
        title: "Feed generated",
        description: "RSS feed has been regenerated successfully",
      })
      loadFeeds()
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate RSS feed",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleFeed = async (feedId: string, enabled: boolean) => {
    try {
      await apiClient.patch(`/api/rss/feeds/${feedId}`, { enabled })
      setFeeds(feeds.map(f => f.id === feedId ? { ...f, enabled } : f))
      toast({
        title: enabled ? "Feed enabled" : "Feed disabled",
        description: `RSS feed has been ${enabled ? 'enabled' : 'disabled'}`,
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update feed status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    try {
      await apiClient.delete(`/api/rss/feeds/${feedId}`)
      setFeeds(feeds.filter(f => f.id !== feedId))
      toast({
        title: "Feed deleted",
        description: "RSS feed has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete RSS feed",
        variant: "destructive"
      })
    }
  }

  const copyFeedUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copied",
      description: "Feed URL copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Rss className="h-8 w-8 text-primary" />
            RSS Feed Manager
          </h1>
          <p className="text-muted-foreground">Create and manage RSS feeds for your content</p>
        </div>
        <Button onClick={loadFeeds} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.filter(f => f.enabled).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeds.reduce((acc, f) => acc + f.subscriberCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feeds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feeds">Active Feeds</TabsTrigger>
          <TabsTrigger value="create">Create New Feed</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="space-y-4">
          {feeds.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Rss className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No RSS feeds created yet</p>
                  <Button className="mt-4" onClick={() => {}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Feed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            feeds.map(feed => (
              <Card key={feed.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{feed.title}</CardTitle>
                        <Badge variant={feed.enabled ? "default" : "secondary"}>
                          {feed.enabled ? "Active" : "Disabled"}
                        </Badge>
                        <Badge variant="outline">{feed.contentType}</Badge>
                      </div>
                      <CardDescription className="mt-2">{feed.description}</CardDescription>
                    </div>
                    <Switch
                      checked={feed.enabled}
                      onCheckedChange={(checked) => handleToggleFeed(feed.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <code className="flex-1 text-sm">{feed.url}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyFeedUrl(feed.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={feed.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex gap-4">
                      <span>Limit: {feed.itemLimit} items</span>
                      <span>Subscribers: {feed.subscriberCount}</span>
                      {feed.lastGenerated && (
                        <span>Last generated: {new Date(feed.lastGenerated).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleGenerateFeed(feed.id)}
                      disabled={generating}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={feed.url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteFeed(feed.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New RSS Feed</CardTitle>
              <CardDescription>Configure a new RSS feed for your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Feed Title *</Label>
                <Input
                  id="title"
                  value={newFeed.title}
                  onChange={(e) => setNewFeed({ ...newFeed, title: e.target.value })}
                  placeholder="My Awesome Blog Feed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Feed Description *</Label>
                <Textarea
                  id="description"
                  value={newFeed.description}
                  onChange={(e) => setNewFeed({ ...newFeed, description: e.target.value })}
                  placeholder="Latest updates from my blog"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select 
                  value={newFeed.contentType}
                  onValueChange={(value) => setNewFeed({ ...newFeed, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posts">Blog Posts</SelectItem>
                    <SelectItem value="pages">Pages</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="all">All Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemLimit">Item Limit</Label>
                <Input
                  id="itemLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={newFeed.itemLimit}
                  onChange={(e) => setNewFeed({ ...newFeed, itemLimit: parseInt(e.target.value) || 20 })}
                />
                <p className="text-xs text-muted-foreground">Maximum number of items in the feed (1-100)</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Images</Label>
                  <p className="text-xs text-muted-foreground">Include featured images in feed items</p>
                </div>
                <Switch
                  checked={newFeed.includeImages}
                  onCheckedChange={(checked) => setNewFeed({ ...newFeed, includeImages: checked })}
                />
              </div>

              <Button onClick={handleCreateFeed} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create RSS Feed
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Feed Settings</CardTitle>
              <CardDescription>Global RSS feed configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Generation</Label>
                  <p className="text-xs text-muted-foreground">Automatically regenerate feeds when content changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Full Content</Label>
                  <p className="text-xs text-muted-foreground">Include full content in feed items instead of excerpts</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Analytics</Label>
                  <p className="text-xs text-muted-foreground">Track feed subscriptions and usage</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
