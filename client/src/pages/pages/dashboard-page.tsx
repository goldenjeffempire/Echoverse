import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  ArrowRight,
  ArrowUpRight, 
  BarChart3, 
  BookOpen, 
  Building, 
  Code2, 
  LayoutDashboard, 
  Settings, 
  Users, 
  ShoppingBag,
  Sparkles, 
  MessageSquare, 
  BarChart2, 
  Activity, 
  Calendar, 
  Clock,
  BookMarked,
  Lightbulb,
  BookType,
  Zap,
  CheckCircle,
  Award,
  Star,
  Search,
  Mail,
  Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  lastPurchase: string;
  totalSpent: number;
  avatar?: string;
  orders: number;
}

interface Stat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
}

const stats: Stat[] = [
  {
    label: "Revenue",
    value: "$23,456",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    description: "+12% from last month",
  },
  {
    label: "New Customers",
    value: 32,
    icon: <Users className="h-5 w-5 text-primary" />,
    description: "+8% from last month",
  },
  {
    label: "Avg. Order Value",
    value: "$734",
    icon: <ShoppingBag className="h-5 w-5 text-primary" />,
    description: "-2% from last month",
  },
  {
    label: "Open Tickets",
    value: 12,
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    description: "3 new today",
  },
];

function WelcomeGreeting({ username }: { username: string }) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
      {greeting}, {username} 👋
    </h1>
  );
}

function ProgressRing({ radius, stroke, progress, color }: { radius: number; stroke: number; progress: number; color: string }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference) / 100;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="var(--muted-foreground)"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />

      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
      <text
        x={radius}
        y={radius + 5}
        className="text-xs font-medium"
        textAnchor="middle"
        fill="white"
      >
        {progress}%
      </text>
    </svg>
  );
}

function ActivityCard() {
  const activities = [
    {
      id: 1,
      title: "New sign-up",
      time: "2 mins ago",
      description: "A new user signed up for the service.",
      icon: <Zap className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      title: "Subscription started",
      time: "5 mins ago",
      description: "A user has started a pro subscription.",
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 3,
      title: "New badge earned",
      time: "1 hour ago",
      description: "A user earned a new achievement badge.",
      icon: <Award className="h-4 w-4 text-yellow-500" />,
    },
    {
      id: 4,
      title: "5-star rating received",
      time: "3 hours ago",
      description: "You've received a new 5-star rating!",
      icon: <Star className="h-4 w-4 text-orange-500" />,
    },
  ];

  return (
    <Card className="bg-dark-card border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity
        </CardTitle>
        <CardDescription>Recent activities on your account</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-primary/10">
                {activity.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <time className="block text-xs text-muted-foreground">{activity.time}</time>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Sample customer data
  const customers: Customer[] = [
    {
      id: 1,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "+1 234 567 8901",
      status: "active",
      lastPurchase: "2024-02-15",
      totalSpent: 1249.99,
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      orders: 5
    }
  ];
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const getRoleDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "admin":
        return <AdminDashboard stats={stats} customers={customers} />;
      default:
        return <DefaultDashboard stats={stats} />;
    }
  };

  if (!user) return null;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  // Dashboard navigation items
  const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <BarChart3 size={20} />, label: "Analytics", href: "#analytics" },
    { icon: <Code2 size={20} />, label: "Projects", href: "#projects" },
    { icon: <ShoppingBag size={20} />, label: "Marketplace", href: "/marketplace" },
    { icon: <BookOpen size={20} />, label: "Learn", href: "#learn" },
    { icon: <Building size={20} />, label: "Organization", href: "#organization" },
    { icon: <Users size={20} />, label: "Team", href: "#team" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
  ];
  
  return (
    <>
      <Helmet>
        <title>Dashboard - Echoverse</title>
        <meta name="description" content="Echoverse dashboard - Access your AI tools, analytics, and projects" />
      </Helmet>
      
      <DashboardLayout>
        <div className="container py-6 max-w-7xl">
          <div className="mb-8">
            <WelcomeGreeting username={user.fullName || user.username} />
            <p className="text-muted-foreground">
              Here's what's happening with your Echoverse account today.
            </p>
          </div>
          {getRoleDashboard()}
        </div>
      </DashboardLayout>
    </>
  );
}

function AdminDashboard({ stats, customers }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DefaultDashboard stats={stats} />
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Management</CardTitle>
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search customers..." 
                    className="pl-8"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback>
                              {customer.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function DefaultDashboard({ stats }: { stats: Stat[] }) {
  return (
    <motion.div
      className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div key={index} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
          <Card className="bg-dark-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">{stat.icon} {stat.label}</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
        <ActivityCard />
      </motion.div>
    </motion.div>
  );
}