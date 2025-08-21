import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "superadmin" | "admin" | "user";
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
  isUser: () => boolean;
  canModifySuperAdmin: (userId: number) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Inisialisasi user dari localStorage - FRESH START dengan Super Admin default
  useEffect(() => {
    // Check if super admin exists, if not create one
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const superAdminExists = users.some(u => u.role === 'superadmin');
    
    if (!superAdminExists) {
      const defaultSuperAdmin: User = {
        id: 1,
        email: 'superadmin@posindonesia.co.id',
        password: 'superadmin123',
        role: 'superadmin',
        name: 'Super Administrator',
        direktorat: 'Direksi',
        subdirektorat: 'Direksi Utama',
        divisi: 'Direksi'
      };
      
      const updatedUsers = [...users, defaultSuperAdmin];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      console.log('UserContext: Created default super admin account');
    }
    
    // Load current user if exists
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        setUser(parsed);
      } catch (error) {
        console.error('UserContext: Error parsing currentUser', error);
        localStorage.removeItem("currentUser");
        setUser(null);
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      // Normalisasi field nama organisasi
      const normalized: User = {
        ...found,
        subdirektorat: (found as any).subdirektorat || (found as any).subDirektorat || '',
        subDirektorat: (found as any).subDirektorat || (found as any).subdirektorat || ''
      };
      setUser(found);
      localStorage.setItem("currentUser", JSON.stringify(normalized));
      return true;
    }
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

  const isUser = () => {
    return user?.role === 'user';
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
      isUser, 
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