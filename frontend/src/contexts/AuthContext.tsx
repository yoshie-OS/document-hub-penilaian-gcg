import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  nama: string;
  role: 'ADMIN' | 'USER';
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await refreshAuth();
        } catch (error) {
          console.error('Failed to refresh auth:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await authAPI.refresh();
      const { user: userData } = response.data;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
