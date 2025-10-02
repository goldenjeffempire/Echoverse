import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Users, 
  Heart,
  Share2,
  Flag,
  Bot,
  Plus,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Clock
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CommunityDashboard() {
  // TODO: Remove mock data - replace with real community data
  const [discussions] = useState([
    { 
      id: 1, 
      title: "How to integrate AI into existing workflows?", 
      author: "Sarah Johnson",
      replies: 23,
      likes: 45,
      category: "AI Tools",
      lastActivity: "2 hours ago",
      status: "active"
    },
    { 
      id: 2, 
      title: "Best practices for e-commerce SEO", 
      author: "Mike Chen",
      replies: 12,
      likes: 28,
      category: "E-commerce",
      lastActivity: "4 hours ago",
      status: "active"
    },
    { 
      id: 3, 
      title: "Community guidelines update", 
      author: "Admin",
      replies: 8,
      likes: 67,
      category: "Announcements",
      lastActivity: "1 day ago",
      status: "pinned"
    },
  ])

  const [members] = useState([
    { 
      id: 1, 
      name: "Sarah Johnson", 
      username: "@sarah_j",
      role: "Pro Member",
      joinDate: "Jan 2024",
      posts: 45,
      reputation: 892
    },
    { 
      id: 2, 
      name: "Mike Chen", 
      username: "@mike_c",
      role: "Member",
      joinDate: "Dec 2023",
      posts: 23,
      reputation: 456
    },
    { 
      id: 3, 
      name: "Emma Davis", 
      username: "@emma_d",
      role: "Moderator",
      joinDate: "Nov 2023",
      posts: 78,
      reputation: 1234
    },
  ])

  const [reports] = useState([
    { id: 1, type: "spam", content: "Inappropriate promotion", reporter: "User123", status: "pending" },
    { id: 2, type: "harassment", content: "Offensive language", reporter: "User456", status: "resolved" },
    { id: 3, type: "off-topic", content: "Unrelated discussion", reporter: "User789", status: "pending" },
  ])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pinned: "secondary",
      closed: "outline",
      pending: "destructive",
      resolved: "default"
    } as const
    return variants[status as keyof typeof variants] || "default"
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      "Pro Member": "default",
      "Member": "secondary",
      "Moderator": "outline",
      "Admin": "destructive"
    } as const
    return variants[role as keyof typeof variants] || "default"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground">Foster engagement and manage your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-community-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button data-testid="button-new-announcement" className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-members">2,843</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-discussions">156</div>
            <p className="text-xs text-muted-foreground">23 new today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-daily-activity">89%</div>
            <p className="text-xs text-muted-foreground">Above average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-reports">
              {reports.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="chatbot">AI Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Discussions</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Search discussions..." className="pl-9" data-testid="input-search-discussions" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div key={discussion.id} className="flex items-start gap-4 p-4 border rounded-lg hover-elevate" data-testid={`discussion-${discussion.id}`}>
                    <Avatar>
                      <AvatarFallback>{discussion.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-foreground">{discussion.title}</h3>
                        <Badge variant={getStatusBadge(discussion.status)}>
                          {discussion.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>by {discussion.author}</span>
                        <Badge variant="outline">{discussion.category}</Badge>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {discussion.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {discussion.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {discussion.lastActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Members</CardTitle>
              <CardDescription>Manage member roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadge(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.posts}</TableCell>
                      <TableCell>{member.reputation.toLocaleString()}</TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-member-actions-${member.id}`}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Content Moderation
              </CardTitle>
              <CardDescription>Review reported content and manage community safety</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell>{report.content}</TableCell>
                      <TableCell>{report.reporter}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-approve-${report.id}`}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" data-testid={`button-remove-${report.id}`}>
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Community Assistant
              </CardTitle>
              <CardDescription>Configure AI chatbot to help community members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-configure-bot">
                  <Settings className="h-6 w-6" />
                  Configure Bot
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-train-bot">
                  <Bot className="h-6 w-6" />
                  Train Responses
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-bot-analytics">
                  <TrendingUp className="h-6 w-6" />
                  Bot Analytics
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-integration-settings">
                  <MessageSquare className="h-6 w-6" />
                  Integration Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}