import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart2, 
  Users, 
  Shield, 
  Package, 
  CreditCard, 
  Settings, 
  SearchIcon, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  XCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileBarChart,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Star,
  ShoppingCart
} from "lucide-react";
import { useState } from "react";

// Mock data for users
const usersData = [
  {
    id: 1,
    username: "alex_miller",
    email: "alex@example.com",
    planTier: "premium",
    status: "active",
    lastActive: "2024-04-25T16:32:10",
    joinDate: "2023-11-12",
    revenue: 299.97
  },
  {
    id: 2,
    username: "sarah_johnson",
    email: "sarah@example.com",
    planTier: "pro",
    status: "active",
    lastActive: "2024-04-22T09:45:30",
    joinDate: "2023-12-05",
    revenue: 149.99
  },
  {
    id: 3,
    username: "michael_smith",
    email: "michael@example.com",
    planTier: "free",
    status: "inactive",
    lastActive: "2024-03-15T11:20:45",
    joinDate: "2024-01-18",
    revenue: 0
  },
  {
    id: 4,
    username: "emily_davis",
    email: "emily@example.com",
    planTier: "pro",
    status: "active",
    lastActive: "2024-04-24T14:10:22",
    joinDate: "2023-10-30",
    revenue: 149.99
  },
  {
    id: 5,
    username: "james_wilson",
    email: "james@example.com",
    planTier: "premium",
    status: "active",
    lastActive: "2024-04-25T08:55:18",
    joinDate: "2023-09-22",
    revenue: 299.97
  },
  {
    id: 6,
    username: "lisa_brown",
    email: "lisa@example.com",
    planTier: "free",
    status: "pending",
    lastActive: "2024-04-18T17:40:12",
    joinDate: "2024-04-15",
    revenue: 0
  }
];

// Mock data for marketplace items
const marketplaceItems = [
  {
    id: "email-generator-agent",
    title: "Email Generator Agent",
    category: "agent",
    price: "Free",
    sales: 1254,
    revenue: 0,
    rating: 4.8,
    status: "active"
  },
  {
    id: "restaurant-website-template",
    title: "Restaurant Website Template",
    category: "template",
    price: 29.99,
    sales: 876,
    revenue: 26271.24,
    rating: 4.9,
    status: "active"
  },
  {
    id: "dark-nebula-theme",
    title: "Dark Nebula Theme",
    category: "theme",
    price: 19.99,
    sales: 543,
    revenue: 10854.57,
    rating: 4.7,
    status: "active"
  },
  {
    id: "seo-analyzer-plugin",
    title: "SEO Analyzer Plugin",
    category: "plugin",
    price: 49.99,
    sales: 325,
    revenue: 16246.75,
    rating: 4.6,
    status: "active"
  },
  {
    id: "content-writer-agent",
    title: "Content Writer Agent",
    category: "agent",
    price: 9.99,
    sales: 987,
    revenue: 9860.13,
    rating: 4.7,
    status: "active"
  }
];

// Mock data for recent transactions
const transactions = [
  {
    id: "tx-12345",
    userId: 5,
    username: "james_wilson",
    description: "Premium Plan Subscription",
    amount: 29.99,
    date: "2024-04-25T08:22:45",
    status: "completed",
    paymentMethod: "credit_card"
  },
  {
    id: "tx-12344",
    userId: 1,
    username: "alex_miller",
    description: "Dark Nebula Theme",
    amount: 19.99,
    date: "2024-04-24T16:10:33",
    status: "completed",
    paymentMethod: "paypal"
  },
  {
    id: "tx-12343",
    userId: 2,
    username: "sarah_johnson",
    description: "Pro Plan Subscription",
    amount: 14.99,
    date: "2024-04-22T09:45:12",
    status: "completed",
    paymentMethod: "credit_card"
  },
  {
    id: "tx-12342",
    userId: 4,
    username: "emily_davis",
    description: "SEO Analyzer Plugin",
    amount: 49.99,
    date: "2024-04-21T11:30:55",
    status: "completed",
    paymentMethod: "credit_card"
  },
  {
    id: "tx-12341",
    userId: 3,
    username: "michael_smith",
    description: "Content Writer Agent",
    amount: 9.99,
    date: "2024-04-20T14:22:18",
    status: "refunded",
    paymentMethod: "paypal"
  }
];

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

// Helper function to format time
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

// Helper function to format relative time
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}

// Helper function to format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Admin check - only admins should access this
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="max-w-md p-6 text-center">
          <Shield className="h-16 w-16 text-primary/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-light-base/70 mb-6">You do not have permission to access the admin dashboard.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sorting function
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort users
  const sortedUsers = [...usersData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Filter users
  const filteredUsers = sortedUsers.filter(user => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter marketplace items
  const filteredItems = marketplaceItems.filter(item => 
    item.title.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => 
    tx.username.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
    tx.description.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
    tx.id.toLowerCase().includes(transactionSearchTerm.toLowerCase())
  );

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to perform this action.",
        variant: "destructive",
      });
      return;
    }

    let actionText = "";
    switch (action) {
      case "delete":
        actionText = "deleted";
        break;
      case "suspend":
        actionText = "suspended";
        break;
      case "verify":
        actionText = "verified";
        break;
      default:
        actionText = action + "ed";
    }

    toast({
      title: `${selectedUsers.length} users ${actionText}`,
      description: `The selected users have been ${actionText} successfully.`,
    });

    setSelectedUsers([]);
  };

  // Toggle all users selection
  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Toggle single user selection
  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Calculate total revenue
  const totalRevenue = usersData.reduce((sum, user) => sum + user.revenue, 0);
  const totalItemRevenue = marketplaceItems.reduce((sum, item) => sum + item.revenue, 0);
  
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Echoverse</title>
        <meta name="description" content="Echoverse admin dashboard - Manage users, content, and platform settings" />
      </Helmet>
      
      <div className="min-h-screen bg-dark-base">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-light-base/70 mt-1">Manage users, marketplace, and platform settings</p>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-dark-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-light-base/70 text-sm">Total Users</p>
                    <h3 className="text-3xl font-bold mt-1">{usersData.length}</h3>
                    <p className="text-xs text-light-base/60 mt-1">
                      <span className="text-green-400">+12%</span> from last month
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-light-base/70 text-sm">Marketplace Items</p>
                    <h3 className="text-3xl font-bold mt-1">{marketplaceItems.length}</h3>
                    <p className="text-xs text-light-base/60 mt-1">
                      <span className="text-green-400">+5%</span> from last month
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-light-base/70 text-sm">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
                    <p className="text-xs text-light-base/60 mt-1">
                      <span className="text-green-400">+23%</span> from last month
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-light-base/70 text-sm">Marketplace Revenue</p>
                    <h3 className="text-3xl font-bold mt-1">{formatCurrency(totalItemRevenue)}</h3>
                    <p className="text-xs text-light-base/60 mt-1">
                      <span className="text-green-400">+18%</span> from last month
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Main tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="users" className="space-y-6">
              <TabsList className="bg-dark-card border border-primary/20">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              {/* Users Tab */}
              <TabsContent value="users">
                <Card className="bg-dark-card border-primary/20">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <CardTitle>User Management</CardTitle>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-base/40" />
                          <Input
                            placeholder="Search users..."
                            className="pl-9 bg-dark-base/50 w-full md:w-[250px]"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button size="sm" variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                        <Button size="sm">Add User</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-dark-base/30">
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-primary/30 bg-dark-base/50 text-primary focus:ring-primary"
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={toggleAllUsers}
                              />
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('username')}>
                              <div className="flex items-center">
                                User
                                {sortConfig?.key === 'username' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('planTier')}>
                              <div className="flex items-center">
                                Plan
                                {sortConfig?.key === 'planTier' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('status')}>
                              <div className="flex items-center">
                                Status
                                {sortConfig?.key === 'status' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('lastActive')}>
                              <div className="flex items-center">
                                Last Active
                                {sortConfig?.key === 'lastActive' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('joinDate')}>
                              <div className="flex items-center">
                                Joined
                                {sortConfig?.key === 'joinDate' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('revenue')}>
                              <div className="flex items-center justify-end">
                                Revenue
                                {sortConfig?.key === 'revenue' && (
                                  sortConfig.direction === 'ascending' ? 
                                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-6 text-light-base/60">
                                No users found matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((userData) => (
                              <TableRow key={userData.id} className="hover:bg-dark-base/20">
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-primary/30 bg-dark-base/50 text-primary focus:ring-primary"
                                    checked={selectedUsers.includes(userData.id)}
                                    onChange={() => toggleUserSelection(userData.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gradient-purple text-white">
                                        {userData.username[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{userData.username}</div>
                                      <div className="text-xs text-light-base/60">{userData.email}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    userData.planTier === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                                    userData.planTier === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }>
                                    {userData.planTier}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    userData.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                    userData.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }>
                                    {userData.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-light-base/70">
                                  {formatRelativeTime(userData.lastActive)}
                                </TableCell>
                                <TableCell className="text-sm text-light-base/70">
                                  {formatDate(userData.joinDate)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(userData.revenue)}
                                </TableCell>
                                <TableCell className="flex justify-end space-x-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-primary/10 py-4">
                    <div className="flex items-center text-sm text-light-base/70">
                      {selectedUsers.length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <span>{selectedUsers.length} users selected</span>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction("verify")}>
                              Verify
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction("suspend")}>
                              Suspend
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleBulkAction("delete")}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span>Showing {filteredUsers.length} of {usersData.length} users</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Marketplace Tab */}
              <TabsContent value="marketplace">
                <Card className="bg-dark-card border-primary/20">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <CardTitle>Marketplace Items</CardTitle>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-base/40" />
                          <Input
                            placeholder="Search items..."
                            className="pl-9 bg-dark-base/50 w-full md:w-[250px]"
                            value={itemSearchTerm}
                            onChange={(e) => setItemSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button size="sm" variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                        <Button size="sm">Add Item</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-dark-base/30">
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-6 text-light-base/60">
                                No items found matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-dark-base/20">
                                <TableCell>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-xs text-light-base/60">{item.id}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="capitalize">{item.category}</Badge>
                                </TableCell>
                                <TableCell>
                                  {item.price === "Free" ? (
                                    <span className="text-green-400">Free</span>
                                  ) : (
                                    <span>${item.price}</span>
                                  )}
                                </TableCell>
                                <TableCell>{item.sales.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                    <span>{item.rating}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.revenue)}
                                </TableCell>
                                <TableCell className="flex justify-end space-x-1">
                                  <Link href={`/marketplace/${item.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-primary/10 py-4">
                    <div className="text-sm text-light-base/70">
                      Showing {filteredItems.length} of {marketplaceItems.length} items
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card className="bg-dark-card border-primary/20">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <CardTitle>Recent Transactions</CardTitle>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-base/40" />
                          <Input
                            placeholder="Search transactions..."
                            className="pl-9 bg-dark-base/50 w-full md:w-[250px]"
                            value={transactionSearchTerm}
                            onChange={(e) => setTransactionSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button size="sm" variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                        <Button size="sm">Export</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-primary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-dark-base/30">
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-20 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-6 text-light-base/60">
                                No transactions found matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((transaction) => (
                              <TableRow key={transaction.id} className="hover:bg-dark-base/20">
                                <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {transaction.username[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{transaction.username}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell className="text-sm text-light-base/70">
                                  {formatDateTime(transaction.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-red-500/20 text-red-400'
                                  }>
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {transaction.paymentMethod.replace('_', ' ')}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell className="flex justify-end space-x-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {transaction.status === 'completed' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
                                      onClick={() => {
                                        toast({
                                          title: "Transaction refunded",
                                          description: `Transaction ${transaction.id} has been refunded.`,
                                        });
                                      }}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-primary/10 py-4">
                    <div className="text-sm text-light-base/70">
                      Showing {filteredTransactions.length} of {transactions.length} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <Card className="bg-dark-card border-primary/20">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <CardTitle>Platform Analytics</CardTitle>
                        <CardDescription>Overview of key platform metrics and trends</CardDescription>
                      </div>
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Last 7 Days
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileBarChart className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Revenue Chart */}
                      <div className="rounded-lg border border-primary/10 p-6">
                        <h3 className="text-lg font-medium mb-6">Revenue Overview</h3>
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-light-base/50 text-center">
                            <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-40" />
                            <p>Revenue chart visualization would appear here</p>
                            <p className="text-sm">Showing data from premium subscriptions and marketplace sales</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-primary/10 p-6">
                          <h4 className="text-light-base/70 text-sm font-medium mb-4">User Growth</h4>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-3xl font-bold">+24%</p>
                              <p className="text-xs text-light-base/60 mt-1">vs. last month</p>
                            </div>
                            <div className="h-16 flex items-end">
                              <div className="w-4 h-8 bg-primary/20 rounded-t-sm"></div>
                              <div className="w-4 h-10 bg-primary/30 rounded-t-sm mx-1"></div>
                              <div className="w-4 h-12 bg-primary/40 rounded-t-sm"></div>
                              <div className="w-4 h-14 bg-primary/50 rounded-t-sm mx-1"></div>
                              <div className="w-4 h-16 bg-primary rounded-t-sm"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="rounded-lg border border-primary/10 p-6">
                          <h4 className="text-light-base/70 text-sm font-medium mb-4">Marketplace Activity</h4>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-3xl font-bold">1,254</p>
                              <p className="text-xs text-light-base/60 mt-1">downloads this week</p>
                            </div>
                            <div className="h-16 flex items-end">
                              <div className="w-4 h-10 bg-green-500/30 rounded-t-sm"></div>
                              <div className="w-4 h-12 bg-green-500/40 rounded-t-sm mx-1"></div>
                              <div className="w-4 h-8 bg-green-500/30 rounded-t-sm"></div>
                              <div className="w-4 h-14 bg-green-500/50 rounded-t-sm mx-1"></div>
                              <div className="w-4 h-16 bg-green-500/60 rounded-t-sm"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="rounded-lg border border-primary/10 p-6">
                          <h4 className="text-light-base/70 text-sm font-medium mb-4">Conversion Rate</h4>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-3xl font-bold">18.5%</p>
                              <p className="text-xs text-light-base/60 mt-1">free to paid conversions</p>
                            </div>
                            <div className="relative h-16 w-16">
                              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                              <div 
                                className="absolute inset-0 rounded-full border-4 border-primary"
                                style={{ 
                                  clipPath: 'polygon(50% 50%, 0% 0%, 100% 0%, 100% 33%)' 
                                }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                18.5%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="rounded-lg border border-primary/10 p-6">
                        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                          {[
                            { user: "james_wilson", action: "upgraded to Premium", time: "2 hours ago", icon: <CheckCircle className="text-green-400" /> },
                            { user: "emily_davis", action: "purchased SEO Analyzer Plugin", time: "4 hours ago", icon: <ShoppingCart className="text-blue-400" /> },
                            { user: "alex_miller", action: "published a new theme", time: "6 hours ago", icon: <Package className="text-purple-400" /> },
                            { user: "lisa_brown", action: "signed up", time: "10 hours ago", icon: <Users className="text-primary" /> },
                            { user: "michael_smith", action: "requested a refund", time: "1 day ago", icon: <XCircle className="text-red-400" /> },
                          ].map((activity, i) => (
                            <div key={i} className="flex items-center space-x-3 p-2 rounded-md hover:bg-dark-base/20">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {activity.icon}
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm">
                                  <span className="font-medium">{activity.user}</span>
                                  <span className="text-light-base/70"> {activity.action}</span>
                                </p>
                                <p className="text-xs text-light-base/60">{activity.time}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  );
}