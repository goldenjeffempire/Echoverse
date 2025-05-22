import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const validRoles = ['work', 'school', 'personal', 'general'];

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (location.includes('?signup=success')) {
      toast({
        title: 'Account Created',
        description: 'You can now sign in.',
      });
      // Clean the query param from URL after showing toast
      setLocation('/login', { replace: true });
    }
  }, [location, setLocation, toast]);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to login');
      }

      localStorage.setItem('user', JSON.stringify(result.user));

      toast({
        title: 'Success',
        description: 'You have successfully logged in',
      });

      const userRole = result.user.currentRole;

      if (!validRoles.includes(userRole)) {
        setLocation('/dashboard/work');
      } else {
        setLocation(`/dashboard/${userRole}`);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to Echoverse</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">
            AI-powered productivity for all
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
