import { Bot, ShoppingCart, FileText, Users, BarChart3, Settings, Sparkles, MessageSquare, TrendingUp, Package } from "lucide-react";
import { Link } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
const mainFeatures = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart3,
        badge: null
    },
    {
        title: "AI Website Builder",
        url: "/ai-builder",
        icon: Bot,
        badge: "AI"
    },
    {
        title: "E-Commerce",
        url: "/ecommerce",
        icon: ShoppingCart,
        badge: null
    },
    {
        title: "CMS & Blog",
        url: "/cms",
        icon: FileText,
        badge: null
    },
    {
        title: "Community",
        url: "/community",
        icon: MessageSquare,
        badge: null
    },
    {
        title: "Marketing",
        url: "/marketing",
        icon: TrendingUp,
        badge: "New"
    },
];
const systemFeatures = [
    {
        title: "Marketplace",
        url: "/marketplace",
        icon: Package,
        badge: null
    },
    {
        title: "Users",
        url: "/users",
        icon: Users,
        badge: null
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        badge: null
    },
];
export function AppSidebar() {
    return (<Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground"/>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">EchoVerse</h2>
            <p className="text-xs text-muted-foreground">AI Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainFeatures.map((item) => (<SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4"/>
                      <span>{item.title}</span>
                      {item.badge && (<Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>)}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemFeatures.map((item) => (<SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4"/>
                      <span>{item.title}</span>
                      {item.badge && (<Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>)}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);
}
