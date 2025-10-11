import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  subscriptionTier?: string;
  twoFactorEnabled?: boolean;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { username, password });
    
    api.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const register = async (data: any) => {
    const response = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', data);
    
    api.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      api.clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
