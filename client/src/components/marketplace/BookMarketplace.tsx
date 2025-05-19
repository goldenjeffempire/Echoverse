
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

import { useRecommendations } from '@/hooks/use-recommendations';
import { motion, AnimatePresence } from 'framer-motion';

export function BookMarketplace() {
  const { recommendations, isLoading } = useRecommendations();
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {demoBooks.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <div className="aspect-[3/4] relative">
              <img 
                src={book.cover} 
                alt={book.title}
                className="object-cover w-full h-full"
              />
            </div>
            <CardHeader>
              <CardTitle>{book.title}</CardTitle>
              <CardDescription>{book.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-bold">${book.price}</span>
                <Button>Add to Cart</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const demoBooks: Book[] = [
  {
    id: '1',
    title: 'The Creative Mind',
    author: 'Sarah Johnson',
    cover: 'https://picsum.photos/300/400',
    price: 24.99,
    category: 'adult',
    ageRange: '18+',
    rating: 4.5,
    description: 'An exploration of creativity and innovation'
  },
  {
    id: '2',
    title: 'Adventures in Wonderland',
    author: 'Michael Smith',
    cover: 'https://picsum.photos/300/400',
    price: 14.99,
    category: 'children',
    ageRange: '8-12',
    rating: 4.8,
    description: 'A magical journey for young readers'
  }
];
