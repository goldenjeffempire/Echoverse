
import { create } from 'zustand';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  registerMutation: any;
  logout: () => Promise<void>;
}

async function handleAuthError(error: any) {
  console.error('Auth error:', error);
  toast({
    title: "Authentication Error",
    description: error.message || "An unexpected error occurred",
    variant: "destructive",
  });
  throw error;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  loginMutation: useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const user = await response.json();
        set({ user, isLoading: false });
        return user;
      } catch (error) {
        return handleAuthError(error);
      }
    }
  }),
  registerMutation: useMutation({
    mutationFn: async (userData: any) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        const user = await response.json();
        set({ user, isLoading: false });
        return user;
      } catch (error) {
        return handleAuthError(error);
      }
    }
  }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      set({ user: null });
    } catch (error) {
      handleAuthError(error);
    }
  }
}));

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const user = await response.json();
        auth.setState({ user, isLoading: false });
        return user;
      } catch (error) {
        auth.setState({ user: null, isLoading: false });
        throw error;
      }
    }
  });

  return <>{children}</>;
}
