import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        refreshUser();
    }, []);
    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.user);
        }
        catch {
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    };
    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        api.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    };
    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        api.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    };
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        }
        catch {
        }
        finally {
            api.clearTokens();
            setUser(null);
        }
    };
    return (<AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
