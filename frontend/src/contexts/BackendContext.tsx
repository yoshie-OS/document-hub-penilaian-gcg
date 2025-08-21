import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { yearAPI, strukturAPI, aspectAPI, checklistAPI, userAPI } from '../services/api';

// Types
export interface Year {
  id: number;
  tahun: number;
  nama?: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrukturPerusahaan {
  id: number;
  tahun: number;
  direktorat: string;
  subdirektorat?: string;
  divisi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Aspek {
  id: number;
  nama: string;
  tahun: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistGCG {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nama: string;
  role: 'ADMIN' | 'USER';
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendContextType {
  // State
  years: Year[];
  struktur: StrukturPerusahaan[];
  aspects: Aspek[];
  checklist: ChecklistGCG[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  // Year operations
  fetchYears: () => Promise<void>;
  createYear: (yearData: { tahun: number; nama?: string; deskripsi?: string }) => Promise<void>;
  updateYear: (id: number, yearData: Partial<Year>) => Promise<void>;
  deleteYear: (id: number) => Promise<void>;
  
  // Struktur operations
  fetchStruktur: (tahun?: number) => Promise<void>;
  createStruktur: (strukturData: { tahun: number; direktorat: string; subdirektorat?: string; divisi?: string }) => Promise<void>;
  updateStruktur: (id: number, strukturData: Partial<StrukturPerusahaan>) => Promise<void>;
  deleteStruktur: (id: number) => Promise<void>;
  
  // Aspect operations
  fetchAspects: (tahun?: number) => Promise<void>;
  createAspect: (aspectData: { nama: string; tahun: number }) => Promise<void>;
  updateAspect: (id: number, aspectData: Partial<Aspek>) => Promise<void>;
  deleteAspect: (id: number) => Promise<void>;
  
  // Checklist operations
  fetchChecklist: (tahun?: number) => Promise<void>;
  createChecklist: (checklistData: { aspek: string; deskripsi: string; tahun: number }) => Promise<void>;
  updateChecklist: (id: number, checklistData: Partial<ChecklistGCG>) => Promise<void>;
  deleteChecklist: (id: number) => Promise<void>;
  
  // User operations
  fetchUsers: () => Promise<void>;
  createUser: (userData: any) => Promise<void>;
  updateUser: (id: number, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  
  // Utility functions
  getYearsByYear: (tahun: number) => Year[];
  getStrukturByYear: (tahun: number) => StrukturPerusahaan[];
  getAspectsByYear: (tahun: number) => Aspek[];
  getChecklistByYear: (tahun: number) => ChecklistGCG[];
  getUsersByRole: (role: 'ADMIN' | 'USER') => User[];
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};

interface BackendProviderProps {
  children: ReactNode;
}

export const BackendProvider: React.FC<BackendProviderProps> = ({ children }) => {
  const [years, setYears] = useState<Year[]>([]);
  const [struktur, setStruktur] = useState<StrukturPerusahaan[]>([]);
  const [aspects, setAspects] = useState<Aspek[]>([]);
  const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch years
  const fetchYears = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await yearAPI.getAll();
      setYears(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch years');
      console.error('Error fetching years:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create year
  const createYear = useCallback(async (yearData: { tahun: number; nama?: string; deskripsi?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await yearAPI.create(yearData);
      setYears(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create year');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update year
  const updateYear = useCallback(async (id: number, yearData: Partial<Year>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await yearAPI.update(id, yearData);
      setYears(prev => prev.map(year => year.id === id ? response.data : year));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update year');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete year
  const deleteYear = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await yearAPI.delete(id);
      setYears(prev => prev.filter(year => year.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete year');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch struktur
  const fetchStruktur = useCallback(async (tahun?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await strukturAPI.getAll(tahun);
      setStruktur(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch struktur');
      console.error('Error fetching struktur:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create struktur
  const createStruktur = useCallback(async (strukturData: { tahun: number; direktorat: string; subdirektorat?: string; divisi?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await strukturAPI.create(strukturData);
      setStruktur(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create struktur');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update struktur
  const updateStruktur = useCallback(async (id: number, strukturData: Partial<StrukturPerusahaan>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await strukturAPI.update(id, strukturData);
      setStruktur(prev => prev.map(struk => struk.id === id ? response.data : struk));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update struktur');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete struktur
  const deleteStruktur = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await strukturAPI.delete(id);
      setStruktur(prev => prev.filter(struk => struk.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete struktur');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch aspects
  const fetchAspects = useCallback(async (tahun?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await aspectAPI.getAll(tahun);
      setAspects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch aspects');
      console.error('Error fetching aspects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create aspect
  const createAspect = useCallback(async (aspectData: { nama: string; tahun: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await aspectAPI.create(aspectData);
      setAspects(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create aspect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update aspect
  const updateAspect = useCallback(async (id: number, aspectData: Partial<Aspek>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await aspectAPI.update(id, aspectData);
      setAspects(prev => prev.map(aspect => aspect.id === id ? response.data : aspect));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update aspect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete aspect
  const deleteAspect = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await aspectAPI.delete(id);
      setAspects(prev => prev.filter(aspect => aspect.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete aspect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch checklist
  const fetchChecklist = useCallback(async (tahun?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await checklistAPI.getAll(tahun);
      setChecklist(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch checklist');
      console.error('Error fetching checklist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create checklist
  const createChecklist = useCallback(async (checklistData: { aspek: string; deskripsi: string; tahun: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await checklistAPI.create(checklistData);
      setChecklist(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create checklist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update checklist
  const updateChecklist = useCallback(async (id: number, checklistData: Partial<ChecklistGCG>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await checklistAPI.update(id, checklistData);
      setChecklist(prev => prev.map(item => item.id === id ? response.data : item));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update checklist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete checklist
  const deleteChecklist = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await checklistAPI.delete(id);
      setChecklist(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete checklist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userAPI.create(userData);
      setUsers(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id: number, userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userAPI.update(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? response.data : user));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await userAPI.delete(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility functions
  const getYearsByYear = useCallback((tahun: number) => {
    return years.filter(year => year.tahun === tahun);
  }, [years]);

  const getStrukturByYear = useCallback((tahun: number) => {
    return struktur.filter(struk => struk.tahun === tahun);
  }, [struktur]);

  const getAspectsByYear = useCallback((tahun: number) => {
    return aspects.filter(aspect => aspect.tahun === tahun);
  }, [aspects]);

  const getChecklistByYear = useCallback((tahun: number) => {
    return checklist.filter(item => item.tahun === tahun);
  }, [checklist]);

  const getUsersByRole = useCallback((role: 'ADMIN' | 'USER') => {
    return users.filter(user => user.role === role);
  }, [users]);

  // Initial data fetch
  useEffect(() => {
    fetchYears();
    fetchStruktur();
    fetchAspects();
    fetchChecklist();
    fetchUsers();
  }, [fetchYears, fetchStruktur, fetchAspects, fetchChecklist, fetchUsers]);

  const value: BackendContextType = {
    years,
    struktur,
    aspects,
    checklist,
    users,
    isLoading,
    error,
    fetchYears,
    createYear,
    updateYear,
    deleteYear,
    fetchStruktur,
    createStruktur,
    updateStruktur,
    deleteStruktur,
    fetchAspects,
    createAspect,
    updateAspect,
    deleteAspect,
    fetchChecklist,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getYearsByYear,
    getStrukturByYear,
    getAspectsByYear,
    getChecklistByYear,
    getUsersByRole,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
};

