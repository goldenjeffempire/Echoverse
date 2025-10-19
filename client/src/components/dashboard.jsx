import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ShoppingCart, FileText, DollarSign, Activity, Bot, Sparkles, ArrowUpRight } from "lucide-react";
import { apiClient } from "@/lib/api";
export function Dashboard() {
    const { data: analyticsData } = useQuery({
        queryKey: ['/api/analytics/stats'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/api/analytics/stats');
                return response;
            }
            catch {
                return {
                    revenue: "$0",
                    users: "0",
                    orders: "0",
                    pages: "0",
                    growth: "+0%",
                    activeUsers: "0"
                };
            }
        },
        refetchInterval: 30000
    });
    const { data: activityData } = useQuery({
        queryKey: ['/api/analytics/activity'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/api/analytics/activity');
                return response.activities || [];
            }
            catch {
                return [];
            }
        },
        refetchInterval: 10000
    });
    const stats = analyticsData || {
        revenue: "$0",
        users: "0",
        orders: "0",
        pages: "0",
        growth: "+0%",
        activeUsers: "0"
    };
    const recentActivity = activityData || [];
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your platform overview.</p>
        </div>
        <Button data-testid="button-quick-action" className="gap-2">
          <Sparkles className="h-4 w-4"/>
          Generate Site with AI
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue">{stats.revenue}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.growth}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-users">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active now
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-orders">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              +7 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pages">{stats.pages}</div>
            <p className="text-xs text-muted-foreground">
              12 AI-generated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5"/>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates across your platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (<div key={index} className="flex items-start gap-3" data-testid={`activity-${index}`}>
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"/>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-foreground">{activity.content}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5"/>
              AI Quick Actions
            </CardTitle>
            <CardDescription>Accelerate your workflow with AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-generate-content">
              <FileText className="h-4 w-4"/>
              Generate Blog Content
              <ArrowUpRight className="h-4 w-4 ml-auto"/>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-analyze-data">
              <TrendingUp className="h-4 w-4"/>
              Analyze Customer Data
              <ArrowUpRight className="h-4 w-4 ml-auto"/>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-optimize-seo">
              <Sparkles className="h-4 w-4"/>
              Optimize SEO Settings
              <ArrowUpRight className="h-4 w-4 ml-auto"/>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>);
}
