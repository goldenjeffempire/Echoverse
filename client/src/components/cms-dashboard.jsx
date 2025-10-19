import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, Edit, Eye, Bot, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
export function CmsDashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    useEffect(() => {
        loadPosts();
    }, []);
    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/posts');
            setPosts(response.posts || []);
        }
        catch (error) {
            toast({
                title: "Error loading posts",
                description: error.message || "Failed to load posts",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;
    const getStatusBadge = (status) => {
        const variants = {
            published: "default",
            draft: "secondary",
            scheduled: "outline",
        };
        return variants[status] || "default";
    };
    const handleGenerateContent = () => {
        toast({
            title: "AI Content Generation",
            description: "Navigate to Marketing > AI Tools to generate content",
        });
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading content...</p>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary"/>
            CMS & Blog
          </h1>
          <p className="text-muted-foreground">Create and manage your content with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateContent} data-testid="button-ai-content">
            <Bot className="h-4 w-4 mr-2"/>
            Generate Content
          </Button>
          <Button data-testid="button-new-post" className="gap-2">
            <Plus className="h-4 w-4"/>
            New Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-posts">{posts.length}</div>
            <p className="text-xs text-muted-foreground">{publishedPosts} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-posts">{draftPosts}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-page-views">--</div>
            <p className="text-xs text-muted-foreground">Analytics coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-content">--</div>
            <p className="text-xs text-muted-foreground">Content by AI</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage your blog content</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search posts..." className="w-64"/>
                  <Button variant="outline" size="icon" aria-label="Search posts">
                    <Search className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (<p className="text-center text-muted-foreground py-8">No posts yet. Create your first post to get started.</p>) : (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (<TableRow key={post.id}>
                        <TableCell className="font-medium max-w-md truncate">{post.title}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(post.status)}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{post.type || 'post'}</TableCell>
                        <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" aria-label="Edit post">
                              <Edit className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="View post">
                              <Eye className="h-4 w-4"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Static Pages</CardTitle>
              <CardDescription>Page management coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Media management coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
              <CardDescription>Category management coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
