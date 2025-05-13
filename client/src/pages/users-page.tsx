
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Users as UsersIcon, Award, TrendingUp, 
  UserPlus, Star, Shield, BookOpen
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users", searchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users?search=${searchQuery}`);
      return res.json();
    }
  });

  const filterUsers = (users: User[] = []) => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) || 
      user.fullName?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { icon: Shield, color: 'text-red-500' };
      case 'moderator':
        return { icon: Star, color: 'text-yellow-500' };
      case 'mentor':
        return { icon: BookOpen, color: 'text-blue-500' };
      default:
        return { icon: UsersIcon, color: 'text-gray-500' };
    }
  };

  const filteredUsers = filterUsers(users);

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Community Users</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredUsers?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            filteredUsers?.map((user) => {
              const { icon: RoleIcon, color } = getRoleBadge(user.role);
              return (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {user.fullName || user.username}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <RoleIcon className={`h-3 w-3 mr-1 ${color}`} />
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={user.isFollowing ? "outline" : "default"}
                        size="sm"
                        className="ml-auto"
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>

                    {user.bio && (
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        <span>{user.followerCount} followers</span>
                      </div>
                      <div className="flex items-center ml-4">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{user.followingCount} following</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
