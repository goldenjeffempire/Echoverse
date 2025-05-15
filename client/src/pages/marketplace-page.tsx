import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Grid, Download, Star } from "lucide-react";
import { useState } from "react";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  type: "template" | "plugin" | "ai-pack";
  price: number;
  downloads: number;
  rating: number;
  author: string;
  thumbnail?: string;
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  return (
    <DashboardLayout>
      <div className="container py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground">Discover templates, plugins, and AI packs</p>
          </div>
          <Button>
            <Grid className="w-4 h-4 mr-2" />
            Submit Item
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="plugin">Plugins</SelectItem>
              <SelectItem value="ai-pack">AI Packs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="group hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <img 
                  src={`/placeholder-${item}.jpg`} 
                  alt={`Template ${item}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm">4.8</span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">Professional Template {item}</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Template
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  A professional template designed for modern applications
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">$29.99</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      1.2k downloads
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}