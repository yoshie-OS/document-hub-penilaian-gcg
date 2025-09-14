import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userAPI } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  direktorat: string;
  subdirektorat: string;
  divisi: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing user session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const authToken = localStorage.getItem('authToken');
        
        if (storedUser && authToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (err) {
        console.error('Error checking existing session:', err);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try API login first
      try {
        const userData = await userAPI.login(email, password);
        setUser(userData);
        return true;
      } catch (apiError) {
        console.warn('API login failed, falling back to local data:', apiError);
        
        // Check local users first (from PengaturanBaru)
        const localUsers = localStorage.getItem('users');
        if (localUsers) {
          try {
            const users = JSON.parse(localUsers);
            const localUser = users.find((u: any) => u.email === email && u.password === password);
            if (localUser) {
              const { password: _, ...userWithoutPassword } = localUser;
              // Convert id to string to match interface
              const userData = {
                ...userWithoutPassword,
                id: String(userWithoutPassword.id),
                createdAt: userWithoutPassword.createdAt || new Date().toISOString(),
                status: 'active' as const
              };
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('authToken', `local-${userData.id}`);
              return true;
            }
          } catch (parseError) {
            console.warn('Failed to parse local users:', parseError);
          }
        }
        
        // Fallback to mock data for demo purposes
        const mockUsers = [
          {
            id: '1',
            name: 'Super Admin',
            email: 'arsippostgcg@gmail.com',
            password: 'postarsipGCG.',
            role: 'superadmin' as const,
            direktorat: 'DIREKTORAT UTAMA',
            subdirektorat: 'SUB DIREKTORAT UTAMA',
            divisi: 'DIVISI UTAMA',
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const
          },
          {
            id: '2',
            name: 'Admin GCG',
            email: 'admin@posindonesia.co.id',
            password: 'admin123',
            role: 'admin' as const,
            direktorat: 'DIREKTORAT BISNIS JASA KEUANGAN',
            subdirektorat: 'SUB DIREKTORAT GOVERNMENT AND CORPORATE BUSINESS',
            divisi: 'PENYALURAN DANA',
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const
          },
          {
            id: '3',
            name: 'User Regular',
            email: 'user@posindonesia.co.id',
            password: 'user123',
            role: 'user' as const,
            direktorat: 'DIREKTORAT BISNIS JASA KEUANGAN',
            subdirektorat: 'SUB DIREKTORAT GOVERNMENT AND CORPORATE BUSINESS',
            divisi: 'PENYALURAN DANA',
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const
          }
        ];

        const mockUser = mockUsers.find(u => u.email === email && u.password === password);
        if (mockUser) {
          const { password: _, ...userWithoutPassword } = mockUser;
          setUser(userWithoutPassword);
          localStorage.setItem('user', JSON.stringify(userWithoutPassword));
          localStorage.setItem('authToken', `mock-${userWithoutPassword.id}`);
      return true;
    }
    
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    userAPI.logout();
  };

  const value: UserContextType = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 