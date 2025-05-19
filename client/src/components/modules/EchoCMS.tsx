import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Image, 
  Calendar, 
  Save, 
  Send, 
  FileDown, 
  Clock, 
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ContentStatus = 'draft' | 'scheduled' | 'published';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  tags: string[];
  category: string;
  status: ContentStatus;
  featuredImage?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
}

export default function EchoCMS() {
  const [posts, setPosts] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Getting Started with Echoverse',
      content: `# Getting Started with Echoverse

Welcome to Echoverse! This guide will help you navigate the platform's features and get the most out of your experience.

## Key Features

- **AI-Powered Content Creation**: Generate high-quality content with a few clicks
- **Multi-Role Dashboard**: Switch between work, personal, school, and general contexts
- **Collaboration Tools**: Work with your team seamlessly

## Getting Started

1. Set up your profile
2. Choose your primary role
3. Explore the modules available to you

## Next Steps

Try creating your first content piece using EchoWriter!`,
      excerpt: "A beginner's guide to using the Echoverse platform and its key features.",
      author: 'Echoverse Team',
      tags: ['tutorial', 'beginner', 'guide'],
      category: 'Documentation',
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8',
      createdAt: new Date('2025-05-10T10:00:00'),
      updatedAt: new Date('2025-05-12T14:30:00'),
      publishedAt: new Date('2025-05-15T09:00:00'),
    },
    {
      id: '2',
      title: 'Advanced AI Techniques for Content Creation',
      content: `# Advanced AI Techniques for Content Creation

This article explores advanced techniques for getting the most out of Echoverse's AI capabilities.

## Customizing AI Outputs

Understanding how to guide the AI to produce exactly what you need is essential for effective content creation.

## Prompt Engineering

Learn how to craft effective prompts that yield better results.

## Editing and Refining

The AI provides a great starting point, but human refinement is where the magic happens.`,
      excerpt: 'Take your AI-generated content to the next level with these advanced techniques.',
      author: 'Alex Morgan',
      tags: ['AI', 'advanced', 'content creation'],
      category: 'Tutorials',
      status: 'draft',
      createdAt: new Date('2025-05-14T16:45:00'),
      updatedAt: new Date('2025-05-16T11:20:00'),
    },
    {
      id: '3',
      title: 'Upcoming Features: Q3 2025',
      content: `# Upcoming Features: Q3 2025

Echoverse is constantly evolving. Here's what to expect in our Q3 2025 update.

## New Modules

- **EchoAnalytics**: Advanced content performance metrics
- **CollabSpace**: Enhanced team collaboration tools

## Improvements

- Faster AI response times
- More customization options for dashboards

## Release Schedule

The update will roll out in phases starting July 2025.`,
      excerpt: 'Preview of upcoming features and improvements coming to Echoverse in Q3 2025.',
      author: 'Echoverse Team',
      tags: ['roadmap', 'features', 'updates'],
      category: 'Announcements',
      status: 'scheduled',
      scheduledFor: new Date('2025-06-25T08:00:00'),
      createdAt: new Date('2025-05-16T09:30:00'),
      updatedAt: new Date('2025-05-16T15:45:00'),
    }
  ]);

  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredPosts = posts.filter(post => {
    // Filter by status/tab
    if (currentTab !== 'all' && post.status !== currentTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !post.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  const handleCreateNew = () => {
    const newPost: ContentItem = {
      id: `new-${Date.now()}`,
      title: 'Untitled Post',
      content: '# Untitled Post\n\nStart writing your content here...',
      excerpt: '',
      author: 'You',
      tags: [],
      category: 'Uncategorized',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setPosts([newPost, ...posts]);
    setSelectedPost(newPost);
    setEditMode(true);
  };

  const handleSelectPost = (post: ContentItem) => {
    setSelectedPost(post);
    setEditMode(false);
  };

  const handlePostUpdate = (field: keyof ContentItem, value: any) => {
    if (!selectedPost) return;
    
    setSelectedPost({
      ...selectedPost,
      [field]: value,
      updatedAt: new Date()
    });
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }
    
    toast({
      title: 'Post Deleted',
      description: 'The post has been permanently deleted.',
    });
  };

  const handleSavePost = () => {
    if (!selectedPost) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setPosts(posts.map(post => 
        post.id === selectedPost.id ? selectedPost : post
      ));
      
      setIsSubmitting(false);
      setEditMode(false);
      
      toast({
        title: 'Post Saved',
        description: 'Your content has been saved successfully.',
      });
    }, 800);
  };

  const handlePublishPost = () => {
    if (!selectedPost) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedPost = {
        ...selectedPost,
        status: 'published' as ContentStatus,
        publishedAt: new Date(),
        updatedAt: new Date()
      };
      
      setPosts(posts.map(post => 
        post.id === selectedPost.id ? updatedPost : post
      ));
      
      setSelectedPost(updatedPost);
      setIsSubmitting(false);
      setEditMode(false);
      
      toast({
        title: 'Post Published',
        description: 'Your content has been published successfully.',
      });
    }, 800);
  };

  const handleSchedulePost = (date: Date) => {
    if (!selectedPost) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedPost = {
        ...selectedPost,
        status: 'scheduled' as ContentStatus,
        scheduledFor: date,
        updatedAt: new Date()
      };
      
      setPosts(posts.map(post => 
        post.id === selectedPost.id ? updatedPost : post
      ));
      
      setSelectedPost(updatedPost);
      setIsSubmitting(false);
      setEditMode(false);
      
      toast({
        title: 'Post Scheduled',
        description: `Your content has been scheduled for ${date.toLocaleString()}.`,
      });
    }, 800);
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">Draft</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Scheduled</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</span>;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            EchoCMS
          </CardTitle>
          <CardDescription>
            Create, manage, and publish content with markdown support and media integration
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Content Library</CardTitle>
                <Button onClick={handleCreateNew} size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              <div className="pt-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input 
                    placeholder="Search content..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <Tabs defaultValue="all" onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-3 mb-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <div
                      key={post.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                        selectedPost?.id === post.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                      }`}
                      onClick={() => handleSelectPost(post)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
                        <div>{getStatusBadge(post.status)}</div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {post.excerpt || post.content.replace(/[#*_~`]/g, '').substring(0, 80) + '...'}
                      </p>
                      <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>
                          {post.status === 'published' ? formatDate(post.publishedAt) : 
                           post.status === 'scheduled' ? formatDate(post.scheduledFor) : 
                           'Last edited ' + formatDate(post.updatedAt)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPost(post);
                              setEditMode(true);
                            }}>
                              <Edit2 className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(post.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                    <p>No content found</p>
                    <Button variant="link" onClick={handleCreateNew} className="mt-2">
                      Create new post
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedPost ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    {editMode ? (
                      <Input
                        value={selectedPost.title}
                        onChange={(e) => handlePostUpdate('title', e.target.value)}
                        placeholder="Post title"
                        className="text-xl font-bold"
                      />
                    ) : (
                      <CardTitle>{selectedPost.title}</CardTitle>
                    )}
                    <CardDescription>
                      {selectedPost.status === 'published' ? (
                        <>Published on {formatDate(selectedPost.publishedAt)}</>
                      ) : selectedPost.status === 'scheduled' ? (
                        <>Scheduled for {formatDate(selectedPost.scheduledFor)}</>
                      ) : (
                        <>Draft • Last edited {formatDate(selectedPost.updatedAt)}</>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    {editMode ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSavePost}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        {selectedPost.status !== 'published' && (
                          <Button onClick={handlePublishPost}>
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {selectedPost.status !== 'published' && (
                              <DropdownMenuItem onClick={() => handleSchedulePost(new Date(Date.now() + 86400000))}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileDown className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDeletePost(selectedPost.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <Tabs defaultValue="editor" className="h-full flex flex-col">
                  <TabsList className="px-6 pt-3 pb-0 border-b">
                    <TabsTrigger value="editor" className="relative rounded-b-none">
                      <FileText className="h-4 w-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="relative rounded-b-none">
                      <FileText className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="flex-1 p-0 m-0">
                    <div className="p-6">
                      {editMode ? (
                        <div className="space-y-4">
                          <Textarea
                            className="min-h-[500px] font-mono"
                            value={selectedPost.content}
                            onChange={(e) => handlePostUpdate('content', e.target.value)}
                            placeholder="Write your content here using Markdown..."
                          />
                        </div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none">
                          {/* In a real implementation, we'd use a Markdown renderer here */}
                          <div className="whitespace-pre-wrap">{selectedPost.content}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="flex-1 p-0 m-0">
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Post Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                              Excerpt
                            </label>
                            {editMode ? (
                              <Textarea
                                value={selectedPost.excerpt}
                                onChange={(e) => handlePostUpdate('excerpt', e.target.value)}
                                placeholder="A brief summary of your post..."
                                className="h-20"
                              />
                            ) : (
                              <p className="text-sm p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {selectedPost.excerpt || 'No excerpt provided'}
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                                Category
                              </label>
                              {editMode ? (
                                <Select
                                  value={selectedPost.category}
                                  onValueChange={(value) => handlePostUpdate('category', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Documentation">Documentation</SelectItem>
                                    <SelectItem value="Tutorials">Tutorials</SelectItem>
                                    <SelectItem value="Announcements">Announcements</SelectItem>
                                    <SelectItem value="Features">Features</SelectItem>
                                    <SelectItem value="Updates">Updates</SelectItem>
                                    <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <p className="text-sm p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                  {selectedPost.category}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                                Author
                              </label>
                              {editMode ? (
                                <Input
                                  value={selectedPost.author}
                                  onChange={(e) => handlePostUpdate('author', e.target.value)}
                                  placeholder="Author name"
                                />
                              ) : (
                                <p className="text-sm p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                  {selectedPost.author}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                              Tags
                            </label>
                            {editMode ? (
                              <Input
                                value={selectedPost.tags.join(', ')}
                                onChange={(e) => handlePostUpdate('tags', e.target.value.split(',').map(tag => tag.trim()))}
                                placeholder="Enter tags separated by commas"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                {selectedPost.tags.map((tag, index) => (
                                  <div
                                    key={index}
                                    className="px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 rounded-full text-xs"
                                  >
                                    {tag}
                                  </div>
                                ))}
                                {selectedPost.tags.length === 0 && (
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No tags</p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                              Featured Image URL
                            </label>
                            {editMode ? (
                              <Input
                                value={selectedPost.featuredImage || ''}
                                onChange={(e) => handlePostUpdate('featuredImage', e.target.value)}
                                placeholder="Enter image URL"
                              />
                            ) : (
                              selectedPost.featuredImage ? (
                                <div className="relative h-40 rounded-md overflow-hidden">
                                  <img
                                    src={selectedPost.featuredImage}
                                    alt={selectedPost.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <p className="text-sm p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                                  No featured image
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              {editMode && (
                <CardFooter className="border-t flex justify-between">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Last saved {formatDate(selectedPost.updatedAt)}
                  </div>
                  <Button
                    onClick={handleSavePost}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-10 text-center">
              <FileText className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Content Selected</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
                Select a post from the content library or create a new one to get started
              </p>
              <Button onClick={handleCreateNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Post
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}