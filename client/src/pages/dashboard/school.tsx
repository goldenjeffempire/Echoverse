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
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {books.map(({ id, title, author, ageRestriction }) => (
            <li key={id} className="border-b pb-2">
              <strong>{title}</strong> by {author} <br />
              <small className="text-muted-foreground">
                Age {ageRestriction}+ recommended
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
    enabled: Boolean(user),
    retry: 2,
    staleTime: 5 * 60 * 1000,
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

  const age = user.dob
    ? Math.floor(
        (Date.now() - new Date(user.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )
    : 0;

  const filteredBooks = data?.recommendedBooks.filter(book => book.ageRestriction <= age) || [];

  return (
    <main className="space-y-6 p-6 max-w-5xl mx-auto">
      <SchoolGreeting username={user.fullName || user.username || 'Student'} />

      <BookList books={filteredBooks} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <progress
            className="w-full"
            value={data?.attendanceRate ?? 0}
            max={100}
            aria-label="Attendance Rate"
          />
          <p className="mt-2 text-center text-sm">
            {data?.attendanceRate ?? 0}%
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
