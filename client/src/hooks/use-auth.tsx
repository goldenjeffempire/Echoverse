
import { create } from 'zustand';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setState: (state: Partial<AuthState>) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setState: (newState) => set(newState),
}));

export function useAuth() {
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;

  const loginMutation = useMutation({
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

        const userData = await response.json();
        useAuthStore.setState({ user: userData, isLoading: false });
        return userData;
      } catch (error) {
        return handleAuthError(error);
      }
    }
  });

  const registerMutation = useMutation({
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

        const newUser = await response.json();
        useAuthStore.setState({ user: newUser, isLoading: false });
        return newUser;
      } catch (error) {
        return handleAuthError(error);
      }
    }
  });

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      useAuthStore.setState({ user: null });
    } catch (error) {
      handleAuthError(error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    loginMutation,
    registerMutation,
    logout,
  };
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
}

export function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = useRequireAuth();
  return isAuthenticated ? <Component /> : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        useAuthStore.setState({ user: userData, isLoading: false });
        return userData;
      } catch (error) {
        useAuthStore.setState({ user: null, isLoading: false });
        throw error;
      }
    }
  });

  return <>{children}</>;
}
