import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Check, X, Flag, MessageSquare, User, Clock, Shield
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface Comment {
  id: number;
  author: {
    id: number;
    name: string;
    avatar?: string;
    email: string;
  };
  content: string;
  postTitle: string;
  postId: number;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  createdAt: Date;
  flagCount: number;
  spamScore?: number;
}

interface CommentModerationProps {
  className?: string;
}

export function CommentModeration({ className }: CommentModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch('/api/comments/moderation');
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, []);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (commentId: number) => {
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, status: 'approved' as const } : c)
    );
    // In production: await api.post(`/api/comments/${commentId}/approve`);
  };

  const handleReject = async (commentId: number, reason: string) => {
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, status: 'rejected' as const } : c)
    );
    setShowRejectDialog(false);
    setRejectReason('');
    // In production: await api.post(`/api/comments/${commentId}/reject`, { reason });
  };

  const handleMarkAsSpam = async (commentId: number) => {
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, status: 'spam' as const } : c)
    );
    // In production: await api.post(`/api/comments/${commentId}/spam`);
  };

  const filteredComments = comments.filter(comment => {
    if (filterStatus === 'all') return true;
    return comment.status === filterStatus;
  });

  const pendingCount = comments.filter(c => c.status === 'pending').length;
  const flaggedCount = comments.filter(c => c.flagCount > 0).length;

  const getStatusBadge = (status: Comment['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      spam: { variant: 'destructive' as const, label: 'Spam' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comment Moderation</h2>
          <p className="text-muted-foreground">
            Review and moderate user comments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              {pendingCount} Pending
            </Badge>
            <Badge variant="destructive">
              <Flag className="mr-1 h-3 w-3" />
              {flaggedCount} Flagged
            </Badge>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No comments to moderate</p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>
                        {comment.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.author.name}</p>
                        {getStatusBadge(comment.status)}
                        {comment.flagCount > 0 && (
                          <Badge variant="destructive">
                            <Flag className="mr-1 h-3 w-3" />
                            {comment.flagCount} Flags
                          </Badge>
                        )}
                        {comment.spamScore && comment.spamScore > 0.5 && (
                          <Badge variant="destructive">
                            <Shield className="mr-1 h-3 w-3" />
                            High Spam Score: {(comment.spamScore * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comment.author.email} •{' '}
                        {formatDistance(comment.createdAt, new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {comment.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(comment.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedComment(comment);
                          setShowRejectDialog(true);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarkAsSpam(comment.id)}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Spam
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      On: <strong>{comment.postTitle}</strong>
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p>{comment.content}</p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="ghost" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      View Author Profile
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this comment. The author will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedComment) {
                  handleReject(selectedComment.id, rejectReason);
                }
              }}
              disabled={!rejectReason.trim()}
            >
              Reject Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
