import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  Tag,
  Image,
  Bot,
  Sparkles,
  MoreHorizontal
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CmsDashboard() {
  // TODO: Remove mock data - replace with real CMS data
  const [posts] = useState([
    { 
      id: 1, 
      title: "Getting Started with AI Website Building", 
      status: "published", 
      author: "Sarah Johnson",
      date: "2024-01-15",
      views: 1234,
      category: "Tutorial"
    },
    { 
      id: 2, 
      title: "E-commerce Trends for 2024", 
      status: "draft", 
      author: "Mike Chen",
      date: "2024-01-14",
      views: 0,
      category: "Business"
    },
    { 
      id: 3, 
      title: "Design Systems Best Practices", 
      status: "scheduled", 
      author: "Emma Davis",
      date: "2024-01-16",
      views: 0,
      category: "Design"
    },
  ])

  const [pages] = useState([
    { id: 1, title: "About Us", slug: "/about", status: "published", modified: "2024-01-10" },
    { id: 2, title: "Contact", slug: "/contact", status: "published", modified: "2024-01-08" },
    { id: 3, title: "Privacy Policy", slug: "/privacy", status: "draft", modified: "2024-01-12" },
  ])

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "default",
      draft: "secondary",
      scheduled: "outline",
    } as const
    return variants[status as keyof typeof variants] || "default"
  }

  const handleGenerateContent = () => {
    console.log("Generate AI content triggered")
    // TODO: Implement AI content generation
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            CMS & Blog
          </h1>
          <p className="text-muted-foreground">Create and manage your content with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateContent} data-testid="button-ai-content">
            <Bot className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
          <Button data-testid="button-new-post" className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-posts">{posts.length}</div>
            <p className="text-xs text-muted-foreground">2 published this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-page-views">12.3k</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-drafts">
              {posts.filter(p => p.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled">
              {posts.filter(p => p.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">Publishing soon</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Blog Posts</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Blog Posts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Search posts..." className="pl-9" data-testid="input-search-posts" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id} data-testid={`post-row-${post.id}`}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(post.status)}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.views.toLocaleString()}</TableCell>
                      <TableCell>{post.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-post-actions-${post.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Static Pages</CardTitle>
              <CardDescription>Manage your website pages</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id} data-testid={`page-row-${page.id}`}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="text-muted-foreground">{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(page.status)}>
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.modified}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-page-edit-${page.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Manage your images, videos, and documents</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Upload and organize your media files</p>
              <Button variant="outline" className="mt-4" data-testid="button-upload-media">
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Content Tools
              </CardTitle>
              <CardDescription>Generate and optimize content with artificial intelligence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-generate-blog-post">
                  <FileText className="h-6 w-6" />
                  Generate Blog Post
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-optimize-seo">
                  <Bot className="h-6 w-6" />
                  SEO Optimization
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-translate-content">
                  <Tag className="h-6 w-6" />
                  Translate Content
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-content-ideas">
                  <Sparkles className="h-6 w-6" />
                  Content Ideas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}