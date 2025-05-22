'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Grid, Download, Star } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  type: 'template' | 'plugin' | 'ai-pack';
  price: number;
  downloads: number;
  rating: number;
  author: string;
  thumbnail?: string;
  createdAt: Date;
}

const MOCK_ITEMS: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Professional Template 1',
    description: 'A professional template designed for modern applications.',
    type: 'template',
    price: 29.99,
    downloads: 1200,
    rating: 4.8,
    author: 'Echo Devs',
    thumbnail: '/placeholder-1.jpg',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Ultimate Plugin 2',
    description: 'Boost your workflow with this powerful plugin.',
    type: 'plugin',
    price: 19.99,
    downloads: 800,
    rating: 4.5,
    author: 'Plugin Masters',
    thumbnail: '/placeholder-2.jpg',
    createdAt: new Date('2024-05-22'),
  },
  {
    id: '3',
    title: 'AI Pack 3',
    description: 'Leverage AI with this comprehensive AI pack.',
    type: 'ai-pack',
    price: 49.99,
    downloads: 300,
    rating: 4.9,
    author: 'AI Wizards',
    thumbnail: '/placeholder-3.jpg',
    createdAt: new Date('2024-03-10'),
  },
  // Add more realistic items as needed
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-asc' | 'price-desc'>('popular');

  // Filtered and sorted list memoized for performance
  const filteredItems = useMemo(() => {
    let items = [...MOCK_ITEMS];

    // Filter by search query (title and description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType) {
      items = items.filter((item) => item.type === selectedType);
    }

    // Sort items
    switch (sortBy) {
      case 'popular':
        items.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'price-asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        items.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return items;
  }, [searchQuery, selectedType, sortBy]);

  return (
    <DashboardLayout>
      <div className="container py-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground">Discover templates, plugins, and AI packs</p>
          </div>
          <Button variant="default" onClick={() => alert('Submit Item flow coming soon!')}>
            <Grid className="w-4 h-4 mr-2" />
            Submit Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Search marketplace..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search marketplace items"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType} aria-label="Filter by type">
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
          <Select value={sortBy} onValueChange={setSortBy} aria-label="Sort by">
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

        {/* Items Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">
              No items found matching your criteria.
            </p>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video relative bg-muted rounded-t-md overflow-hidden">
                  {item.thumbnail ? (
                    <>
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400 text-lg font-semibold">
                      No Image
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white select-none">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm">{item.rating.toFixed(1)}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                      {item.type.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => alert(`Downloading ${item.title}`)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
