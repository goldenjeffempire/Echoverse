import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { useRecommendations } from '@/hooks/use-recommendations';

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: number;
  category: 'adult' | 'children';
  ageRange: string;
  rating: number;
  description: string;
}

export function BookMarketplace() {
  const { data: recommendations = [], isLoading, error } = useRecommendations();

  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter and search logic
  const filteredBooks = recommendations.filter((book) => {
    const matchesFilter = filter === 'all' || book.category === filter;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <div>Loading books...</div>;
  if (error)
    return <div className="text-red-500">Failed to load book recommendations.</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Book Marketplace</h2>
          <p className="text-muted-foreground">Discover books for all ages</p>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="adult">Adult Books</SelectItem>
              <SelectItem value="children">Children's Books</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <p>No books match your search and filter criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img src={book.cover} alt={book.title} className="object-cover w-full h-full" />
              </div>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="font-bold">${book.price.toFixed(2)}</span>
                  <Button>Add to Cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
