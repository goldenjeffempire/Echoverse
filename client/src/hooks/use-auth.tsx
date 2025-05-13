import { create } from 'zustand';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

// Types
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

// Zustand store for auth state
export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// Handle authentication errors
async function handleAuthError(error: any) {
  console.error('Auth error:', error);
  toast({
    title: 'Authentication Error',
    description: error.message || 'An unexpected error occurred',
    variant: 'destructive',
  });
  throw error;
}

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth(); // Zustand store for auth state

  // Query to fetch current user data (auth check)
  useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const user = await response.json();
        auth.setUser(user); // Update user state
        auth.setIsLoading(false); // Loading complete
        return user;
      } catch (error) {
        auth.setUser(null); // No user found
        auth.setIsLoading(false); // Loading complete
        throw error;
      }
    },
  });

  // Login mutation hook
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const user = await response.json();
        auth.setUser(user); // Update user state
        auth.setIsLoading(false); // Loading complete
        return user;
      } catch (error) {
        return handleAuthError(error); // Handle login error
      }
    },
  });

  // Register mutation hook
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        const user = await response.json();
        auth.setUser(user); // Update user state
        auth.setIsLoading(false); // Loading complete
        return user;
      } catch (error) {
        return handleAuthError(error); // Handle registration error
      }
    },
  });

  // Logout mutation hook
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      auth.setUser(null); // Clear user state
    } catch (error) {
      handleAuthError(error); // Handle logout error
    }
  };

  return (
    <>
      {children}
    </>
  );
}
