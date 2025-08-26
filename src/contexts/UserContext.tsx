import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "superadmin" | "admin";
export interface User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  direktorat?: string;
  subDirektorat?: string; // mempertahankan casing historis jika ada penggunaan lama
  subdirektorat?: string; // normalisasi baru
  divisi?: string;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  canModifySuperAdmin: (userId: number) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Inisialisasi user dari localStorage - FRESH START dengan Super Admin default
  useEffect(() => {
    console.log('UserContext: Initializing...');
    
    // Check if super admin exists, if not create one
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    console.log('UserContext: Current users in localStorage:', users);
    
    const superAdminExists = users.some(u => u.role === 'superadmin');
    console.log('UserContext: Super admin exists:', superAdminExists);
    
    if (!superAdminExists) {
      const defaultSuperAdmin: User = {
        id: 1,
        email: 'arsippostgcg@gmail.com',
        password: 'postarsipGCG.',
        role: 'superadmin',
        name: 'Super Administrator',
        direktorat: 'Direksi',
        subdirektorat: 'Direksi Utama',
        divisi: 'Direksi'
      };
      
      const updatedUsers = [...users, defaultSuperAdmin];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      console.log('UserContext: Created default super admin account with arsippostgcg@gmail.com');
      console.log('UserContext: Updated users list:', updatedUsers);
    }
    
      // Load current user if exists
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    try {
      const parsed = JSON.parse(currentUser);
      setUser(parsed);
      console.log('UserContext: Loaded current user from localStorage:', parsed);
    } catch (error) {
      console.error('UserContext: Error parsing currentUser', error);
      localStorage.removeItem("currentUser");
      setUser(null);
    }
  } else {
    console.log('UserContext: No current user found in localStorage');
  }
}, []);

// Listen for year data cleanup events
useEffect(() => {
  const handleYearDataCleaned = (event: CustomEvent) => {
    if (event.detail?.type === 'yearRemoved') {
      const removedYear = event.detail.year;
      console.log(`UserContext: Year ${removedYear} data cleaned up, refreshing users`);
      
      // Refresh users data from localStorage
      const usersData = localStorage.getItem('users');
      if (usersData) {
        try {
          const parsed = JSON.parse(usersData);
          // Note: We don't have a setUsers function, but the cleanup is handled in YearContext
          console.log(`UserContext: Users data refreshed after year ${removedYear} cleanup`);
        } catch (error) {
          console.error('UserContext: Error refreshing users after year cleanup', error);
        }
      }
    }
  };

  window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
  
  return () => {
    window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
  };
}, []);

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    console.log('Login attempt:', { email, password, usersCount: users.length });
    
    const found = users.find(
      (u) => u.email === email && u.password === password
    );
    
    if (found) {
      console.log('User found:', found);
      // Normalisasi field nama organisasi
      const normalized: User = {
        ...found,
        subdirektorat: (found as any).subdirektorat || (found as any).subDirektorat || '',
        subDirektorat: (found as any).subDirektorat || (found as any).subdirektorat || ''
      };
      setUser(normalized);
      localStorage.setItem("currentUser", JSON.stringify(normalized));
      return true;
    }
    
    console.log('User not found for:', email);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  // Helper functions untuk role checking
  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };



  // Check if user can modify super admin (only super admin can modify super admin)
  const canModifySuperAdmin = (userId: number) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    
    // Get target user
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const targetUser = users.find(u => u.id === userId);
    
    // Non-super admin cannot modify super admin
    if (targetUser?.role === 'superadmin') return false;
    
    return true;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isSuperAdmin, 
      isAdmin, 
      canModifySuperAdmin 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}; 