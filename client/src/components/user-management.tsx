import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Shield,
  Key,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
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

export function UserManagement() {
  // TODO: Remove mock data - replace with real user data
  const [users] = useState([
    { 
      id: 1, 
      name: "Sarah Johnson", 
      email: "sarah@example.com",
      role: "Admin",
      status: "active",
      lastLogin: "2024-01-15 14:30",
      joinDate: "2023-12-01",
      plan: "Pro"
    },
    { 
      id: 2, 
      name: "Mike Chen", 
      email: "mike@example.com",
      role: "Editor",
      status: "active",
      lastLogin: "2024-01-15 09:15",
      joinDate: "2024-01-10",
      plan: "Basic"
    },
    { 
      id: 3, 
      name: "Emma Davis", 
      email: "emma@example.com",
      role: "Viewer",
      status: "inactive",
      lastLogin: "2024-01-10 16:45",
      joinDate: "2024-01-05",
      plan: "Free"
    },
    { 
      id: 4, 
      name: "John Wilson", 
      email: "john@example.com",
      role: "Editor",
      status: "suspended",
      lastLogin: "2024-01-12 11:20",
      joinDate: "2023-11-15",
      plan: "Pro"
    },
  ])

  const [roles] = useState([
    { 
      id: 1, 
      name: "Admin", 
      description: "Full access to all platform features",
      permissions: ["manage_users", "manage_content", "manage_settings", "view_analytics"],
      userCount: 1
    },
    { 
      id: 2, 
      name: "Editor", 
      description: "Can create and edit content",
      permissions: ["create_content", "edit_content", "view_analytics"],
      userCount: 2
    },
    { 
      id: 3, 
      name: "Viewer", 
      description: "Read-only access to content",
      permissions: ["view_content"],
      userCount: 1
    },
  ])

  const [plans] = useState([
    { name: "Free", users: 1, features: ["Basic features", "Limited storage"] },
    { name: "Basic", users: 1, features: ["Standard features", "5GB storage", "Email support"] },
    { name: "Pro", users: 2, features: ["Advanced features", "50GB storage", "Priority support", "API access"] },
  ])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      pending: "outline"
    } as const
    return variants[status as keyof typeof variants] || "default"
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      Admin: "destructive",
      Editor: "default",
      Viewer: "secondary",
      Moderator: "outline"
    } as const
    return variants[role as keyof typeof variants] || "default"
  }

  const getPlanBadge = (plan: string) => {
    const variants = {
      Free: "outline",
      Basic: "secondary",
      Pro: "default",
      Enterprise: "destructive"
    } as const
    return variants[plan as keyof typeof variants] || "default"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions across your platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-bulk-actions">
            <Settings className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          <Button data-testid="button-invite-user" className="gap-2">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{users.length}</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-users">
              {users.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Online this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-suspended-users">
              {users.filter(u => u.status === 'suspended').length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pro-users">
              {users.filter(u => u.plan === 'Pro').length}
            </div>
            <p className="text-xs text-muted-foreground">Premium subscribers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" data-testid="input-search-users" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPlanBadge(user.plan)}>
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-user-actions-${user.id}`}>
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

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Roles & Permissions</CardTitle>
                <Button data-testid="button-create-role">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 border rounded-lg hover-elevate" data-testid={`role-${role.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground flex items-center gap-2">
                          {role.name}
                          <Badge variant="outline">{role.userCount} users</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-role-${role.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-role-${role.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {permission.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage user subscription tiers and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`plan-${plan.name.toLowerCase()}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant="outline">{plan.users} users</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {feature}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-2fa-settings">
                  <Key className="h-6 w-6" />
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-session-management">
                  <Clock className="h-6 w-6" />
                  Session Management
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-password-policy">
                  <Shield className="h-6 w-6" />
                  Password Policy
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-audit-logs">
                  <Settings className="h-6 w-6" />
                  Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}