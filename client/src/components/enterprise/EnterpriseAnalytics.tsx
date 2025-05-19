import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Download, 
  Briefcase, 
  Clock, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Award,
  Zap,
  Filter,
  FileBarChart,
  ChevronDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock data for enterprise analytics
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

// Monthly revenue data
const revenueData = [
  { name: 'Jan', revenue: 12400 },
  { name: 'Feb', revenue: 14250 },
  { name: 'Mar', revenue: 16800 },
  { name: 'Apr', revenue: 15900 },
  { name: 'May', revenue: 18600 },
  { name: 'Jun', revenue: 21500 },
  { name: 'Jul', revenue: 20400 },
  { name: 'Aug', revenue: 23100 },
  { name: 'Sep', revenue: 25700 },
  { name: 'Oct', revenue: 27800 },
  { name: 'Nov', revenue: 29400 },
  { name: 'Dec', revenue: 32100 },
];

// User acquisition data
const userAcquisitionData = [
  { name: 'Jan', users: 120 },
  { name: 'Feb', users: 145 },
  { name: 'Mar', users: 162 },
  { name: 'Apr', users: 178 },
  { name: 'May', users: 189 },
  { name: 'Jun', users: 205 },
  { name: 'Jul', users: 218 },
  { name: 'Aug', users: 235 },
  { name: 'Sep', users: 248 },
  { name: 'Oct', users: 262 },
  { name: 'Nov', users: 278 },
  { name: 'Dec', users: 292 },
];

// Feature usage data
const featureUsageData = [
  { name: 'EchoWriter', value: 35 },
  { name: 'EchoCMS', value: 20 },
  { name: 'EchoFeed', value: 15 },
  { name: 'BookingSystem', value: 20 },
  { name: 'JobBoard', value: 10 },
];

// Department usage data
const departmentUsageData = [
  { name: 'Marketing', value: 30 },
  { name: 'Sales', value: 25 },
  { name: 'Engineering', value: 20 },
  { name: 'HR', value: 15 },
  { name: 'Finance', value: 10 },
];

// Subscription plan distribution
const subscriptionData = [
  { name: 'Basic', users: 850 },
  { name: 'Pro', users: 1240 },
  { name: 'Enterprise', users: 390 },
  { name: 'Family', users: 520 },
  { name: 'Student', users: 670 }
];

// User activity data
const userActivityData = [
  { day: 'Mon', activeUsers: 1450, contentCreated: 380 },
  { day: 'Tue', activeUsers: 1650, contentCreated: 420 },
  { day: 'Wed', activeUsers: 1820, contentCreated: 490 },
  { day: 'Thu', activeUsers: 1920, contentCreated: 530 },
  { day: 'Fri', activeUsers: 1750, contentCreated: 470 },
  { day: 'Sat', activeUsers: 1250, contentCreated: 320 },
  { day: 'Sun', activeUsers: 1050, contentCreated: 280 }
];

// Retention data
const retentionData = [
  { month: 'Jan', retention: 94 },
  { month: 'Feb', retention: 92 },
  { month: 'Mar', retention: 93 },
  { month: 'Apr', retention: 95 },
  { month: 'May', retention: 97 },
  { month: 'Jun', retention: 96 },
  { month: 'Jul', retention: 95 },
  { month: 'Aug', retention: 96 },
  { month: 'Sep', retention: 97 },
  { month: 'Oct', retention: 98 },
  { month: 'Nov', retention: 96 },
  { month: 'Dec', retention: 97 }
];

// Key performance indicators
const kpiData = [
  {
    title: 'Total Revenue',
    value: '$287,492',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign
  },
  {
    title: 'Active Users',
    value: '3,674',
    change: '+8.2%',
    trend: 'up',
    icon: Users
  },
  {
    title: 'Retention Rate',
    value: '96.3%',
    change: '+1.8%',
    trend: 'up',
    icon: Award
  },
  {
    title: 'Avg. Session Time',
    value: '24m 32s',
    change: '+3.1%',
    trend: 'up',
    icon: Clock
  }
];

export default function EnterpriseAnalytics() {
  const [period, setPeriod] = useState('year');
  const [dataView, setDataView] = useState('summary');
  const { toast } = useToast();
  
  const handleExportData = () => {
    toast({
      title: 'Analytics Export',
      description: 'Your analytics data export has been initiated. You will receive an email when it is ready for download.',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Enterprise Analytics</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Comprehensive insights into organization performance and user engagement</p>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportData} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <Tabs defaultValue="dashboard" className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">User Analytics</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="usage">Feature Usage</TabsTrigger>
              <TabsTrigger value="departments">Department Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="h-full">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpiData.map((kpi, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{kpi.title}</p>
                        <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                        <div className={`flex items-center mt-1 ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {kpi.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-sm font-medium">{kpi.change}</span>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <kpi.icon className="h-5 w-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue generated over time</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip 
                            formatter={(value) => [`$${value}`, 'Revenue']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            fill="url(#colorRevenue)" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* User Acquisition Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">User Acquisition</CardTitle>
                    <CardDescription>New users onboarded over time</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={userAcquisitionData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value}`, 'New Users']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2, fill: 'white' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Feature Usage Pie Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Feature Usage Distribution</CardTitle>
                    <CardDescription>Percentage of time spent on different features</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={featureUsageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {featureUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Usage']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* User Retention Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">User Retention</CardTitle>
                    <CardDescription>Monthly retention rate percentage</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={retentionData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Retention Rate']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar dataKey="retention" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Daily User Activity Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Daily User Activity</CardTitle>
                    <CardDescription>Active users and content creation by day of week</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={userActivityData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="activeUsers" name="Active Users" fill="#8884d8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="contentCreated" name="Content Created" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* User Acquisition Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">User Acquisition Trend</CardTitle>
                    <CardDescription>New users onboarded over time</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={userAcquisitionData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value}`, 'New Users']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2, fill: 'white' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* User Retention Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">User Retention</CardTitle>
                    <CardDescription>Monthly retention rate percentage</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={retentionData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Retention Rate']}
                          />
                          <Bar dataKey="retention" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Subscription Plan Distribution */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Subscription Plan Distribution</CardTitle>
                    <CardDescription>Users by subscription plan type</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={subscriptionData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} users`, 'Subscriptions']} />
                          <Bar dataKey="users" fill="#ffc658" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Daily User Activity Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Daily User Activity</CardTitle>
                    <CardDescription>Active users and content creation by day of week</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={userActivityData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="activeUsers" name="Active Users" fill="#8884d8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="contentCreated" name="Content Created" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="h-full">
              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Revenue Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue generated over time</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip 
                            formatter={(value) => [`$${value}`, 'Revenue']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            fill="url(#colorRevenue2)" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Subscription Revenue */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue by Subscription Plan</CardTitle>
                    <CardDescription>Monthly revenue by plan type</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Basic', value: 45000 },
                              { name: 'Pro', value: 148000 },
                              { name: 'Enterprise', value: 78000 },
                              { name: 'Family', value: 26000 },
                              { name: 'Student', value: 20000 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {featureUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`$${value}`, 'Revenue']}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Regional Revenue */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue by Region</CardTitle>
                    <CardDescription>Geographic distribution of revenue</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'North America', value: 142000 },
                            { name: 'Europe', value: 89000 },
                            { name: 'Asia', value: 63000 },
                            { name: 'Oceania', value: 28000 },
                            { name: 'Africa', value: 12000 },
                            { name: 'South America', value: 18000 }
                          ]}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis type="number" tickFormatter={(value) => `$${value/1000}K`} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip
                            formatter={(value) => [`$${value}`, 'Revenue']}
                          />
                          <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Feature Usage Pie Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Feature Usage Distribution</CardTitle>
                    <CardDescription>Percentage of time spent on different features</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={featureUsageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {featureUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Usage']}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Growth */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Feature Usage Growth</CardTitle>
                    <CardDescription>Month-over-month growth in feature adoption</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { month: 'Jan', EchoWriter: 10, EchoCMS: 8, EchoFeed: 5, BookingSystem: 3, JobBoard: 1 },
                            { month: 'Feb', EchoWriter: 12, EchoCMS: 10, EchoFeed: 6, BookingSystem: 4, JobBoard: 2 },
                            { month: 'Mar', EchoWriter: 15, EchoCMS: 11, EchoFeed: 8, BookingSystem: 5, JobBoard: 3 },
                            { month: 'Apr', EchoWriter: 18, EchoCMS: 12, EchoFeed: 10, BookingSystem: 7, JobBoard: 4 },
                            { month: 'May', EchoWriter: 20, EchoCMS: 15, EchoFeed: 11, BookingSystem: 10, JobBoard: 6 },
                            { month: 'Jun', EchoWriter: 22, EchoCMS: 16, EchoFeed: 13, BookingSystem: 12, JobBoard: 8 },
                            { month: 'Jul', EchoWriter: 25, EchoCMS: 18, EchoFeed: 15, BookingSystem: 15, JobBoard: 10 },
                            { month: 'Aug', EchoWriter: 28, EchoCMS: 20, EchoFeed: 18, BookingSystem: 18, JobBoard: 12 },
                            { month: 'Sep', EchoWriter: 30, EchoCMS: 21, EchoFeed: 20, BookingSystem: 20, JobBoard: 14 },
                            { month: 'Oct', EchoWriter: 32, EchoCMS: 22, EchoFeed: 22, BookingSystem: 22, JobBoard: 15 },
                            { month: 'Nov', EchoWriter: 34, EchoCMS: 24, EchoFeed: 23, BookingSystem: 24, JobBoard: 17 },
                            { month: 'Dec', EchoWriter: 35, EchoCMS: 25, EchoFeed: 25, BookingSystem: 26, JobBoard: 20 }
                          ]}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                          <Line type="monotone" dataKey="EchoWriter" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="EchoCMS" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="EchoFeed" stroke="#ffc658" />
                          <Line type="monotone" dataKey="BookingSystem" stroke="#ff8042" />
                          <Line type="monotone" dataKey="JobBoard" stroke="#a4de6c" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Feature Engagement */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Feature Engagement Metrics</CardTitle>
                    <CardDescription>Average time spent and actions per session</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'EchoWriter', timeSpent: 24, actionsPerSession: 18 },
                            { name: 'EchoCMS', timeSpent: 18, actionsPerSession: 15 },
                            { name: 'EchoFeed', timeSpent: 12, actionsPerSession: 22 },
                            { name: 'BookingSystem', timeSpent: 15, actionsPerSession: 12 },
                            { name: 'JobBoard', timeSpent: 10, actionsPerSession: 8 }
                          ]}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="timeSpent" name="Avg. Time Spent (min)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="actionsPerSession" name="Actions Per Session" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="departments" className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Department Usage Pie Chart */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Department Usage Distribution</CardTitle>
                    <CardDescription>Percentage of usage by department</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentUsageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {departmentUsageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Usage']}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Department Feature Preference */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Department Feature Preference</CardTitle>
                    <CardDescription>Most used features by department</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              department: 'Marketing',
                              EchoWriter: 40,
                              EchoCMS: 30,
                              EchoFeed: 25,
                              BookingSystem: 3,
                              JobBoard: 2
                            },
                            {
                              department: 'Sales',
                              EchoWriter: 25,
                              EchoCMS: 15,
                              EchoFeed: 10,
                              BookingSystem: 35,
                              JobBoard: 15
                            },
                            {
                              department: 'Engineering',
                              EchoWriter: 20,
                              EchoCMS: 45,
                              EchoFeed: 10,
                              BookingSystem: 15,
                              JobBoard: 10
                            },
                            {
                              department: 'HR',
                              EchoWriter: 15,
                              EchoCMS: 10,
                              EchoFeed: 5,
                              BookingSystem: 20,
                              JobBoard: 50
                            },
                            {
                              department: 'Finance',
                              EchoWriter: 30,
                              EchoCMS: 20,
                              EchoFeed: 10,
                              BookingSystem: 30,
                              JobBoard: 10
                            }
                          ]}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 20,
                            bottom: 5,
                          }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis type="number" />
                          <YAxis dataKey="department" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="EchoWriter" stackId="a" fill="#8884d8" />
                          <Bar dataKey="EchoCMS" stackId="a" fill="#82ca9d" />
                          <Bar dataKey="EchoFeed" stackId="a" fill="#ffc658" />
                          <Bar dataKey="BookingSystem" stackId="a" fill="#ff8042" />
                          <Bar dataKey="JobBoard" stackId="a" fill="#a4de6c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Department Growth */}
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Department User Growth</CardTitle>
                    <CardDescription>Quarterly increase in users by department</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { quarter: 'Q1', Marketing: 35, Sales: 28, Engineering: 42, HR: 18, Finance: 22 },
                            { quarter: 'Q2', Marketing: 45, Sales: 38, Engineering: 52, HR: 25, Finance: 28 },
                            { quarter: 'Q3', Marketing: 60, Sales: 48, Engineering: 68, HR: 32, Finance: 34 },
                            { quarter: 'Q4', Marketing: 75, Sales: 62, Engineering: 85, HR: 45, Finance: 42 }
                          ]}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" strokeOpacity={0.3} />
                          <XAxis dataKey="quarter" />
                          <YAxis />
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                          <Line type="monotone" dataKey="Marketing" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Sales" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Engineering" stroke="#ffc658" />
                          <Line type="monotone" dataKey="HR" stroke="#ff8042" />
                          <Line type="monotone" dataKey="Finance" stroke="#a4de6c" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}