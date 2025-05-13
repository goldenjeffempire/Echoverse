
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  publishDate: string;
  status: 'draft' | 'published';
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  const addNewPost = () => {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: 'New Blog Post',
      content: '',
      excerpt: '',
      publishDate: new Date().toISOString(),
      status: 'draft'
    };
    setPosts([...posts, newPost]);
    setCurrentPost(newPost.id);
    setEditMode(true);
  };

  const updatePost = (postId: string, updates: Partial<BlogPost>) => {
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        return { ...p, ...updates };
      }
      return p;
    });
    setPosts(updatedPosts);
  };

  const deletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
    if (currentPost === postId) {
      setCurrentPost(null);
      setEditMode(false);
    }
  };

  const getCurrentPost = () => posts.find(p => p.id === currentPost);

  return (
    <DashboardLayout>
      <div className="container py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
            <p className="text-muted-foreground">Create and manage your blog posts</p>
          </div>
          <Button onClick={addNewPost}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {posts.map(post => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer"
                      onClick={() => {
                        setCurrentPost(post.id);
                        setEditMode(false);
                      }}
                    >
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {post.status} - {new Date(post.publishDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePost(post.id);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-8">
            {currentPost && getCurrentPost() ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>
                    {editMode ? 'Edit Post' : 'Preview Post'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <Input
                          value={getCurrentPost()?.title}
                          onChange={(e) => updatePost(currentPost, { title: e.target.value })}
                          placeholder="Post title"
                          className="text-lg font-bold"
                        />
                      </div>
                      <div>
                        <Textarea
                          value={getCurrentPost()?.excerpt}
                          onChange={(e) => updatePost(currentPost, { excerpt: e.target.value })}
                          placeholder="Post excerpt"
                          className="h-20"
                        />
                      </div>
                      <div>
                        <Textarea
                          value={getCurrentPost()?.content}
                          onChange={(e) => updatePost(currentPost, { content: e.target.value })}
                          placeholder="Post content"
                          className="h-[400px]"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => updatePost(currentPost, { status: 'draft' })}
                        >
                          Save as Draft
                        </Button>
                        <Button
                          onClick={() => {
                            updatePost(currentPost, { status: 'published' });
                            toast({
                              title: "Success",
                              description: "Post published successfully",
                            });
                          }}
                        >
                          Publish
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      <h1>{getCurrentPost()?.title}</h1>
                      <p className="text-muted-foreground">{getCurrentPost()?.excerpt}</p>
                      <div dangerouslySetInnerHTML={{ __html: getCurrentPost()?.content || '' }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a post to edit or preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
