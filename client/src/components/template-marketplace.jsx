import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Layout, Search, Star, Download, Eye, Filter, Grid3x3, List, TrendingUp, Zap } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
export function TemplateMarketplace() {
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("popular");
    const [viewMode, setViewMode] = useState("grid");
    const { toast } = useToast();
    const categories = [
        { value: "all", label: "All Templates" },
        { value: "business", label: "Business" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "portfolio", label: "Portfolio" },
        { value: "blog", label: "Blog" },
        { value: "landing", label: "Landing Page" },
        { value: "dashboard", label: "Dashboard" }
    ];
    useEffect(() => {
        loadTemplates();
    }, []);
    useEffect(() => {
        filterAndSortTemplates();
    }, [templates, searchQuery, selectedCategory, sortBy]);
    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/templates');
            setTemplates(response.templates || []);
        }
        catch (error) {
            toast({
                title: "Error loading templates",
                description: error.message || "Failed to load templates",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const filterAndSortTemplates = () => {
        let filtered = [...templates];
        if (searchQuery) {
            filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        }
        if (selectedCategory !== "all") {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }
        switch (sortBy) {
            case "popular":
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case "rating":
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case "newest":
                filtered.sort((a, b) => b.id.localeCompare(a.id));
                break;
            case "price-low":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                filtered.sort((a, b) => b.price - a.price);
                break;
        }
        setFilteredTemplates(filtered);
    };
    const handlePreview = (template) => {
        toast({
            title: "Template Preview",
            description: `Opening preview for ${template.name}`,
        });
    };
    const handleInstall = async (template) => {
        try {
            await apiClient.post('/api/templates/install', { templateId: template.id });
            toast({
                title: "Template Installed",
                description: `${template.name} has been installed successfully`,
            });
        }
        catch (error) {
            toast({
                title: "Installation Failed",
                description: error.message || "Failed to install template",
                variant: "destructive"
            });
        }
    };
    if (loading) {
        return (<div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64"/>
          <Skeleton className="h-10 w-32"/>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (<Skeleton key={i} className="h-64"/>))}
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Layout className="h-8 w-8 text-primary"/>
            Template Marketplace
          </h1>
          <p className="text-muted-foreground">Browse and install professional templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-accent" : ""}>
            <Grid3x3 className="h-4 w-4"/>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-accent" : ""}>
            <List className="h-4 w-4"/>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2"/>
            <SelectValue placeholder="Category"/>
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <TrendingUp className="h-4 w-4 mr-2"/>
            <SelectValue placeholder="Sort by"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.filter(t => t.featured).length > 0 && (<Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary"/>
              Featured Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.filter(t => t.featured).map(template => (<Card key={template.id} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500"/>
                        {template.rating}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-muted-foreground">
                        <Download className="h-3 w-3 inline mr-1"/>
                        {template.downloads.toLocaleString()}
                      </div>
                      <div className="font-bold text-primary">
                        {template.price === 0 ? "Free" : `$${template.price}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePreview(template)}>
                        <Eye className="h-3 w-3 mr-1"/>
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleInstall(template)}>
                        <Download className="h-3 w-3 mr-1"/>
                        Install
                      </Button>
                    </div>
                  </CardContent>
                </Card>))}
            </div>
          </CardContent>
        </Card>)}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="free">Free</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredTemplates.map(template => (<Card key={template.id} className={`hover-elevate ${viewMode === "list" ? "flex" : ""}`}>
                <CardHeader className={viewMode === "list" ? "flex-1" : ""}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500"/>
                      {template.rating}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {template.tags.slice(0, 3).map(tag => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-muted-foreground">
                      <Download className="h-3 w-3 inline mr-1"/>
                      {template.downloads.toLocaleString()} downloads
                    </div>
                    <div className="font-bold text-primary">
                      {template.price === 0 ? "Free" : `$${template.price}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePreview(template)}>
                      <Eye className="h-3 w-3 mr-1"/>
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleInstall(template)}>
                      <Download className="h-3 w-3 mr-1"/>
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>

        <TabsContent value="free">
          <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredTemplates.filter(t => t.price === 0).map(template => (<Card key={template.id} className="hover-elevate">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full" onClick={() => handleInstall(template)}>
                    <Download className="h-3 w-3 mr-1"/>
                    Install Free Template
                  </Button>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>

        <TabsContent value="premium">
          <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredTemplates.filter(t => t.price > 0).map(template => (<Card key={template.id} className="hover-elevate border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge className="bg-primary">${template.price}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full" onClick={() => handleInstall(template)}>
                    <Download className="h-3 w-3 mr-1"/>
                    Purchase & Install
                  </Button>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>
      </Tabs>
    </div>);
}
