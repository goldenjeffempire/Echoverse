// client/src/pages/dashboard/school.tsx
'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, UserCheck } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  ageRestriction: number;
}

interface SchoolDashboardData {
  recommendedBooks: Book[];
  attendanceRate: number;
}

function SchoolGreeting({ username }: { username: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Hey, {username}</h2>
      <p className="text-muted-foreground">Keep learning, keep growing 📚</p>
    </div>
  );
}

function BookList({ books }: { books: Book[] }) {
  if (!books.length) {
    return <p className="text-sm text-muted-foreground mt-4">No recommended books available.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recommended Books</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {books.map((book) => (
            <li key={book.id} className="border-b pb-2">
              <strong>{book.title}</strong> by {book.author} <br />
              <small className="text-muted-foreground">
                Age {book.ageRestriction}+ recommended
              </small>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function SchoolDashboard() {
  const user = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<SchoolDashboardData>({
    queryKey: ['/api/dashboard/school'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!user,
    retry: 2,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading school dashboard',
        description: 'Please reload or contact support.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Age calculation for filtering (optional, can be done server-side)
  const age = user.dob
    ? Math.floor(
        (new Date().getTime() - new Date(user.dob).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : 0;

  const recommendedBooks = data?.recommendedBooks.filter(
    (book) => book.ageRestriction <= age
  ) || [];

  return (
    <div className="space-y-6 p-6">
      <SchoolGreeting username={user.fullName || user.username || 'Student'} />

      <p className="text-sm text-muted-foreground">
        Attendance rate: {(data?.attendanceRate ?? 0).toFixed(1)}%
      </p>

      <BookList books={recommendedBooks} />
    </div>
  );
}
