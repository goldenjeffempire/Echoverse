import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Check, X, AlertTriangle, Trash2, Search, Filter, Clock, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function CommentModeration() {
    const [comments, setComments] = useState([]);
    const [filteredComments, setFilteredComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedComments, setSelectedComments] = useState(new Set());
    const { toast } = useToast();
    useEffect(() => {
        loadComments();
    }, []);
    useEffect(() => {
        filterComments();
    }, [comments, searchQuery, statusFilter]);
    const loadComments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/comments/moderate');
            setComments(response.comments || []);
        }
        catch (error) {
            toast({
                title: "Error loading comments",
                description: error.message || "Failed to load comments",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const filterComments = () => {
        let filtered = [...comments];
        if (searchQuery) {
            filtered = filtered.filter(c => c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.postTitle.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter(c => c.status === statusFilter);
        }
        setFilteredComments(filtered);
    };
    const handleApprove = async (commentId) => {
        try {
            await apiClient.post(`/api/comments/${commentId}/approve`);
            setComments(comments.map(c => c.id === commentId ? { ...c, status: "approved" } : c));
            toast({
                title: "Comment approved",
                description: "The comment has been approved successfully",
            });
        }
        catch (error) {
            toast({
                title: "Approval failed",
                description: error.message || "Failed to approve comment",
                variant: "destructive"
            });
        }
    };
    const handleReject = async (commentId) => {
        try {
            await apiClient.post(`/api/comments/${commentId}/reject`);
            setComments(comments.map(c => c.id === commentId ? { ...c, status: "rejected" } : c));
            toast({
                title: "Comment rejected",
                description: "The comment has been rejected",
            });
        }
        catch (error) {
            toast({
                title: "Rejection failed",
                description: error.message || "Failed to reject comment",
                variant: "destructive"
            });
        }
    };
    const handleMarkAsSpam = async (commentId) => {
        try {
            await apiClient.post(`/api/comments/${commentId}/spam`);
            setComments(comments.map(c => c.id === commentId ? { ...c, status: "spam" } : c));
            toast({
                title: "Marked as spam",
                description: "The comment has been marked as spam",
            });
        }
        catch (error) {
            toast({
                title: "Operation failed",
                description: error.message || "Failed to mark comment as spam",
                variant: "destructive"
            });
        }
    };
    const handleDelete = async (commentId) => {
        try {
            await apiClient.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId));
            toast({
                title: "Comment deleted",
                description: "The comment has been permanently deleted",
            });
        }
        catch (error) {
            toast({
                title: "Delete failed",
                description: error.message || "Failed to delete comment",
                variant: "destructive"
            });
        }
    };
    const handleBulkAction = async (action) => {
        const commentIds = Array.from(selectedComments);
        try {
            await apiClient.post('/api/comments/bulk-action', { commentIds, action });
            if (action === "delete") {
                setComments(comments.filter(c => !selectedComments.has(c.id)));
            }
            else {
                setComments(comments.map(c => selectedComments.has(c.id) ? { ...c, status: action } : c));
            }
            setSelectedComments(new Set());
            toast({
                title: "Bulk action completed",
                description: `${commentIds.length} comment(s) ${action === 'delete' ? 'deleted' : action}`,
            });
        }
        catch (error) {
            toast({
                title: "Bulk action failed",
                description: error.message || "Failed to perform bulk action",
                variant: "destructive"
            });
        }
    };
    const toggleCommentSelection = (commentId) => {
        const newSelected = new Set(selectedComments);
        if (newSelected.has(commentId)) {
            newSelected.delete(commentId);
        }
        else {
            newSelected.add(commentId);
        }
        setSelectedComments(newSelected);
    };
    const getStatusBadge = (status) => {
        const variants = {
            pending: { variant: "secondary", label: "Pending" },
            approved: { variant: "default", label: "Approved" },
            spam: { variant: "destructive", label: "Spam" },
            rejected: { variant: "outline", label: "Rejected" }
        };
        return variants[status];
    };
    if (loading) {
        return (<div className="space-y-6">
        <Skeleton className="h-10 w-64"/>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32"/>)}
        </div>
      </div>);
    }
    const pendingCount = comments.filter(c => c.status === "pending").length;
    const approvedCount = comments.filter(c => c.status === "approved").length;
    const spamCount = comments.filter(c => c.status === "spam").length;
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary"/>
            Comment Moderation
          </h1>
          <p className="text-muted-foreground">Review and manage user comments</p>
        </div>
        <Button onClick={loadComments} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600"/>
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600"/>
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600"/>
              Spam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spamCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search comments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2"/>
            <SelectValue placeholder="Filter by status"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Comments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedComments.size > 0 && (<Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span>{selectedComments.size} comment(s) selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction("approve")}>
                  <Check className="h-4 w-4 mr-2"/>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("reject")}>
                  <X className="h-4 w-4 mr-2"/>
                  Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("spam")}>
                  <AlertTriangle className="h-4 w-4 mr-2"/>
                  Spam
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-4 w-4 mr-2"/>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}

      <div className="space-y-4">
        {filteredComments.length === 0 ? (<Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">No comments to moderate</p>
              </div>
            </CardContent>
          </Card>) : (filteredComments.map(comment => (<Card key={comment.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input type="checkbox" checked={selectedComments.has(comment.id)} onChange={() => toggleCommentSelection(comment.id)} className="mt-1"/>
                    <Avatar>
                      <AvatarImage src={comment.authorAvatar}/>
                      <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{comment.author}</h3>
                        <Badge {...getStatusBadge(comment.status)}/>
                        {comment.flagCount > 0 && (<Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1"/>
                            {comment.flagCount} flags
                          </Badge>)}
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.authorEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        On: <span className="font-medium">{comment.postTitle}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{comment.content}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4"/>
                    {comment.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4"/>
                    {comment.downvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4"/>
                    {comment.replies} replies
                  </span>
                </div>

                {comment.status === "pending" && (<div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(comment.id)}>
                      <Check className="h-4 w-4 mr-2"/>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(comment.id)}>
                      <X className="h-4 w-4 mr-2"/>
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAsSpam(comment.id)}>
                      <AlertTriangle className="h-4 w-4 mr-2"/>
                      Mark as Spam
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="h-4 w-4 mr-2"/>
                      Delete
                    </Button>
                  </div>)}

                {comment.status === "approved" && (<div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReject(comment.id)}>
                      <X className="h-4 w-4 mr-2"/>
                      Unapprove
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAsSpam(comment.id)}>
                      <AlertTriangle className="h-4 w-4 mr-2"/>
                      Mark as Spam
                    </Button>
                  </div>)}
              </CardContent>
            </Card>)))}
      </div>
    </div>);
}
