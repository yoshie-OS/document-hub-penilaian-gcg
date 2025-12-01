import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { seedUser } from "@/lib/seed/seedUser";

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Inisialisasi user dari localStorage atau seed
  useEffect(() => {
    // Only seed users if they don't exist (first time setup)
    const existingUsers = localStorage.getItem("users");
    if (!existingUsers) {
      localStorage.setItem("users", JSON.stringify(seedUser));
    }

    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
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

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}; 