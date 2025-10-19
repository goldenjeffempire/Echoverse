import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Mail, BarChart3, Users, MousePointer, Zap, Plus, Search, Play, Pause, Edit, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
export function MarketingDashboard() {
    const [campaigns, setCampaigns] = useState([]);
    const [leads, setLeads] = useState([]);
    const [funnels, setFunnels] = useState([]);
    const [segments, setSegments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token)
                return;
            const response = await fetch('/api/campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data.campaigns || []);
            }
        }
        catch (error) {
            console.error('Error fetching campaigns:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token)
                return;
            const response = await fetch('/api/leads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(data.leads || []);
            }
        }
        catch (error) {
            console.error('Error fetching leads:', error);
        }
    };
    useEffect(() => {
        fetchCampaigns();
        fetchLeads();
    }, []);
    const getStatusBadge = (status) => {
        const variants = {
            active: "default",
            paused: "secondary",
            draft: "outline",
            completed: "secondary"
        };
        return variants[status] || "default";
    };
    const getCampaignTypeBadge = (type) => {
        const variants = {
            Email: "default",
            Social: "secondary",
            Display: "outline",
            Search: "destructive"
        };
        return variants[type] || "default";
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary"/>
            Marketing Automation
          </h1>
          <p className="text-muted-foreground">Drive growth with intelligent marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-ab-test">
            <BarChart3 className="h-4 w-4 mr-2"/>
            A/B Test
          </Button>
          <Button data-testid="button-new-campaign" className="gap-2">
            <Plus className="h-4 w-4"/>
            New Campaign
          </Button>
        </div>
      </div>

      {/* Marketing Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-reach">24.5k</div>
            <p className="text-xs text-muted-foreground">+18.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-click-rate">3.8%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversions">279</div>
            <p className="text-xs text-muted-foreground">+23% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-roi">280%</div>
            <p className="text-xs text-muted-foreground">Above target</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Campaigns</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground"/>
                    <Input placeholder="Search campaigns..." className="pl-9" data-testid="input-search-campaigns"/>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (<TableRow key={campaign.id} data-testid={`campaign-row-${campaign.id}`}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant={getCampaignTypeBadge(campaign.type)}>
                          {campaign.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.opens.toLocaleString()}</TableCell>
                      <TableCell>{campaign.clicks}</TableCell>
                      <TableCell>{campaign.conversions}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.spent} / {campaign.budget}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-campaign-${campaign.id}`}>
                            <Edit className="h-3 w-3"/>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-view-campaign-${campaign.id}`}>
                            <Eye className="h-3 w-3"/>
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-toggle-campaign-${campaign.id}`}>
                            {campaign.status === 'active' ?
                <Pause className="h-3 w-3"/> :
                <Play className="h-3 w-3"/>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnels</CardTitle>
              <CardDescription>Track customer journey and optimize conversion paths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnels.map((funnel) => (<div key={funnel.id} className="p-4 border rounded-lg hover-elevate" data-testid={`funnel-${funnel.id}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-foreground">{funnel.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(funnel.status)}>
                          {funnel.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-foreground">{funnel.visitors.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Visitors</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{funnel.leads.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Leads</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{funnel.customers}</div>
                        <div className="text-xs text-muted-foreground">Customers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{funnel.conversionRate}</div>
                        <div className="text-xs text-muted-foreground">Conv. Rate</div>
                      </div>
                    </div>
                  </div>))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience Segments</CardTitle>
              <CardDescription>Manage customer segments for targeted campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {segments.map((segment) => (<Card key={segment.id} className="hover-elevate" data-testid={`segment-${segment.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {segment.count.toLocaleString()}
                      </div>
                      <p className={`text-xs ${segment.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {segment.growth} this month
                      </p>
                    </CardContent>
                  </Card>))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5"/>
                Marketing Automation
              </CardTitle>
              <CardDescription>Set up automated workflows and triggers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-email-automation">
                  <Mail className="h-6 w-6"/>
                  Email Sequences
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-behavior-triggers">
                  <Target className="h-6 w-6"/>
                  Behavior Triggers
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-lead-scoring">
                  <BarChart3 className="h-6 w-6"/>
                  Lead Scoring
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-workflow-builder">
                  <Zap className="h-6 w-6"/>
                  Workflow Builder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);
}
