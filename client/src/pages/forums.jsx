import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessagesSquare, Plus, Search, Pin, Lock, MessageCircle, Eye, ThumbsUp, Filter, TrendingUp, Clock, Users, Award } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
export default function Forums() {
    const [threads, setThreads] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredThreads, setFilteredThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("recent");
    const [newThread, setNewThread] = useState({
        title: "",
        content: "",
        category: ""
    });
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        loadForumData();
    }, []);
    useEffect(() => {
        filterThreads();
    }, [threads, searchQuery, selectedCategory, sortBy]);
    const loadForumData = async () => {
        setLoading(true);
        try {
            const [threadsRes, categoriesRes] = await Promise.all([
                apiClient.get('/api/forum/threads'),
                apiClient.get('/api/forum/categories')
            ]);
            setThreads(threadsRes.threads || []);
            setCategories(categoriesRes.categories || []);
        }
        catch (error) {
            toast({
                title: "Error loading forum",
                description: error.message || "Failed to load forum data",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const filterThreads = () => {
        let filtered = [...threads];
        if (searchQuery) {
            filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.content.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (selectedCategory !== "all") {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }
        switch (sortBy) {
            case "recent":
                filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
                break;
            case "popular":
                filtered.sort((a, b) => b.replies - a.replies);
                break;
            case "trending":
                filtered.sort((a, b) => b.views - a.views);
                break;
            case "likes":
                filtered.sort((a, b) => b.likes - a.likes);
                break;
        }
        const pinned = filtered.filter(t => t.isPinned);
        const regular = filtered.filter(t => !t.isPinned);
        setFilteredThreads([...pinned, ...regular]);
    };
    const handleCreateThread = async () => {
        if (!newThread.title || !newThread.content || !newThread.category) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }
        try {
            const response = await apiClient.post('/api/forum/threads', newThread);
            setThreads([response.thread, ...threads]);
            setNewThread({ title: "", content: "", category: "" });
            setIsCreatingThread(false);
            toast({
                title: "Thread created",
                description: "Your thread has been posted successfully",
            });
        }
        catch (error) {
            toast({
                title: "Creation failed",
                description: error.message || "Failed to create thread",
                variant: "destructive"
            });
        }
    };
    if (loading) {
        return (<div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64"/>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24"/>)}
        </div>
      </div>);
    }
    const totalThreads = threads.length;
    const totalPosts = threads.reduce((acc, t) => acc + t.replies, 0);
    const totalViews = threads.reduce((acc, t) => acc + t.views, 0);
    return (<div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <MessagesSquare className="h-8 w-8 text-primary"/>
            Community Forums
          </h1>
          <p className="text-muted-foreground">Join the discussion and connect with the community</p>
        </div>
        <Dialog open={isCreatingThread} onOpenChange={setIsCreatingThread}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2"/>
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Thread</DialogTitle>
              <DialogDescription>Start a new discussion topic</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thread-title">Title *</Label>
                <Input id="thread-title" value={newThread.title} onChange={(e) => setNewThread({ ...newThread, title: e.target.value })} placeholder="Enter thread title"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thread-category">Category *</Label>
                <Select value={newThread.category} onValueChange={(value) => setNewThread({ ...newThread, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category"/>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thread-content">Content *</Label>
                <Textarea id="thread-content" value={newThread.content} onChange={(e) => setNewThread({ ...newThread, content: e.target.value })} placeholder="Write your post content here..." className="min-h-[200px]"/>
              </div>
              <Button onClick={handleCreateThread} className="w-full">
                Create Thread
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessagesSquare className="h-4 w-4"/>
              Total Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalThreads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4"/>
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4"/>
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4"/>
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="threads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="threads">All Threads</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search threads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2"/>
                <SelectValue placeholder="Category"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <TrendingUp className="h-4 w-4 mr-2"/>
                <SelectValue placeholder="Sort by"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Replies</SelectItem>
                <SelectItem value="trending">Most Views</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredThreads.length === 0 ? (<Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessagesSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground">No threads found</p>
                  </div>
                </CardContent>
              </Card>) : (filteredThreads.map(thread => (<Card key={thread.id} className="hover-elevate cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar>
                          <AvatarImage src={thread.author.avatar}/>
                          <AvatarFallback>{thread.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.isPinned && <Pin className="h-4 w-4 text-primary"/>}
                            {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground"/>}
                            <h3 className="font-semibold text-lg truncate">{thread.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{thread.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              by {thread.author.name}
                            </span>
                            {thread.author.reputation > 100 && (<Badge variant="secondary" className="text-xs">
                                <Award className="h-3 w-3 mr-1"/>
                                {thread.author.reputation}
                              </Badge>)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {thread.content}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        <div>{new Date(thread.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3"/>
                          {new Date(thread.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4"/>
                        {thread.replies} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4"/>
                        {thread.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4"/>
                        {thread.likes} likes
                      </span>
                    </div>
                  </CardContent>
                </Card>)))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map(category => (<Card key={category.id} className="hover-elevate cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>{category.threadCount} threads</span>
                    <span>{category.postCount} posts</span>
                  </div>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="space-y-3">
            {threads
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
            .map((thread, index) => (<Card key={thread.id} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{thread.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {thread.views.toLocaleString()} views • {thread.replies} replies
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-primary"/>
                    </div>
                  </CardContent>
                </Card>))}
          </div>
        </TabsContent>
      </Tabs>
    </div>);
}
