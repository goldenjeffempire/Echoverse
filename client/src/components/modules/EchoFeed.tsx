import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { HeartIcon, MessageCircleIcon, ShareIcon } from 'lucide-react';

interface Post {
  id: number;
  content: string;
  authorId: number;
  author?: {
    username: string;
    avatar: string;
  };
  likes: number;
  attachedImage?: string;
  createdAt: string;
  hasLiked?: boolean;
}

export default function EchoFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const response = await fetch('/api/feed');
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPost,
          visibility: 'public'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewPost('');
        fetchPosts();
        toast({
          title: 'Success',
          description: 'Post created successfully!',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    }
  }

  async function handleLike(postId: number) {
    try {
      const response = await fetch(`/api/post/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card className="p-4">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full resize-none"
            rows={3}
          />
          <Button type="submit" className="w-full">
            Post
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar src={post.author?.avatar} fallback={post.author?.username?.[0] || 'U'} />
              <div>
                <h3 className="font-semibold">{post.author?.username}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-gray-700">{post.content}</p>

            {post.attachedImage && (
              <img
                src={post.attachedImage}
                alt="Post attachment"
                className="rounded-lg max-h-96 w-full object-cover"
              />
            )}

            <div className="flex items-center space-x-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-1 ${
                  post.hasLiked ? 'text-red-500' : ''
                }`}
              >
                <HeartIcon size={20} />
                <span>{post.likes}</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <MessageCircleIcon size={20} />
                <span>Comment</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <ShareIcon size={20} />
                <span>Share</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}