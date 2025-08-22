import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useYear } from './YearContext';

// Interfaces
export interface Direktorat {
  id: number;
  nama: string;
  deskripsi: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

export interface Subdirektorat {
  id: number;
  nama: string;
  direktoratId: number;
  deskripsi: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

export interface AnakPerusahaan {
  id: number;
  nama: string;
  kategori: string;
  deskripsi: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

export interface Divisi {
  id: number;
  nama: string;
  subdirektoratId: number;
  deskripsi: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

interface StrukturPerusahaanContextType {
  // Data berdasarkan tahun yang dipilih
  direktorat: Direktorat[];
  subdirektorat: Subdirektorat[];
  anakPerusahaan: AnakPerusahaan[];
  divisi: Divisi[];
  
  // CRUD functions
  addDirektorat: (data: Omit<Direktorat, 'id' | 'createdAt' | 'isActive'>) => void;
  addSubdirektorat: (data: Omit<Subdirektorat, 'id' | 'createdAt' | 'isActive'>) => void;
  addAnakPerusahaan: (data: Omit<AnakPerusahaan, 'id' | 'createdAt' | 'isActive'>) => void;
  addDivisi: (data: Omit<Divisi, 'id' | 'createdAt' | 'isActive'>) => void;
  
  deleteDirektorat: (id: number) => void;
  deleteSubdirektorat: (id: number) => void;
  deleteAnakPerusahaan: (id: number) => void;
  deleteDivisi: (id: number) => void;
  
  // Utility functions
  useDefaultData: (year: number) => void;
  refreshData: () => void;
  
  // Loading state
  isLoading: boolean;
}

const StrukturPerusahaanContext = createContext<StrukturPerusahaanContextType | undefined>(undefined);

interface StrukturPerusahaanProviderProps {
  children: ReactNode;
}

export const StrukturPerusahaanProvider: React.FC<StrukturPerusahaanProviderProps> = ({ children }) => {
  const { selectedYear } = useYear();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // State untuk data
  const [direktorat, setDirektorat] = useState<Direktorat[]>([]);
  const [subdirektorat, setSubdirektorat] = useState<Subdirektorat[]>([]);
  const [anakPerusahaan, setAnakPerusahaan] = useState<AnakPerusahaan[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);

  // Load data dari localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load Direktorat
        const direktoratData = localStorage.getItem('direktorat');
        if (direktoratData) {
          setDirektorat(JSON.parse(direktoratData));
        }

        // Load Subdirektorat
        const subdirektoratData = localStorage.getItem('subdirektorat');
        if (subdirektoratData) {
          setSubdirektorat(JSON.parse(subdirektoratData));
        }

        // Load Anak Perusahaan
        const anakPerusahaanData = localStorage.getItem('anakPerusahaan');
        if (anakPerusahaanData) {
          setAnakPerusahaan(JSON.parse(anakPerusahaanData));
        }

        // Load Divisi
        const divisiData = localStorage.getItem('divisi');
        if (divisiData) {
          setDivisi(JSON.parse(divisiData));
        }
      } catch (error) {
        console.error('Error loading struktur perusahaan data:', error);
      }
    };

    loadData();
  }, [refreshTrigger]);

  // Filter data berdasarkan tahun yang dipilih
  const filteredDirektorat = selectedYear ? direktorat.filter(d => d.tahun === selectedYear) : [];
  const filteredSubdirektorat = selectedYear ? subdirektorat.filter(s => s.tahun === selectedYear) : [];
  const filteredAnakPerusahaan = selectedYear ? anakPerusahaan.filter(a => a.tahun === selectedYear) : [];
  const filteredDivisi = selectedYear ? divisi.filter(d => d.tahun === selectedYear) : [];

  // CRUD Functions
  const addDirektorat = (data: Omit<Direktorat, 'id' | 'createdAt' | 'isActive'>) => {
    const newDirektorat: Direktorat = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedDirektorat = [...direktorat, newDirektorat];
    setDirektorat(updatedDirektorat);
    localStorage.setItem('direktorat', JSON.stringify(updatedDirektorat));
    triggerUpdate();
  };

  const addSubdirektorat = (data: Omit<Subdirektorat, 'id' | 'createdAt' | 'isActive'>) => {
    const newSubdirektorat: Subdirektorat = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedSubdirektorat = [...subdirektorat, newSubdirektorat];
    setSubdirektorat(updatedSubdirektorat);
    localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektorat));
    triggerUpdate();
  };

  const addAnakPerusahaan = (data: Omit<AnakPerusahaan, 'id' | 'createdAt' | 'isActive'>) => {
    const newAnakPerusahaan: AnakPerusahaan = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedAnakPerusahaan = [...anakPerusahaan, newAnakPerusahaan];
    setAnakPerusahaan(updatedAnakPerusahaan);
    localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaan));
    triggerUpdate();
  };

  const addDivisi = (data: Omit<Divisi, 'id' | 'createdAt' | 'isActive'>) => {
    const newDivisi: Divisi = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedDivisi = [...divisi, newDivisi];
    setDivisi(updatedDivisi);
    localStorage.setItem('divisi', JSON.stringify(updatedDivisi));
    triggerUpdate();
  };

  const deleteDirektorat = (id: number) => {
    const updatedDirektorat = direktorat.filter(d => d.id !== id);
    setDirektorat(updatedDirektorat);
    localStorage.setItem('direktorat', JSON.stringify(updatedDirektorat));
    triggerUpdate();
  };

  const deleteSubdirektorat = (id: number) => {
    const updatedSubdirektorat = subdirektorat.filter(s => s.id !== id);
    setSubdirektorat(updatedSubdirektorat);
    localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektorat));
    triggerUpdate();
  };

  const deleteAnakPerusahaan = (id: number) => {
    const updatedAnakPerusahaan = anakPerusahaan.filter(a => a.id !== id);
    setAnakPerusahaan(updatedAnakPerusahaan);
    localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaan));
    triggerUpdate();
  };

  const deleteDivisi = (id: number) => {
    const updatedDivisi = divisi.filter(d => d.id !== id);
    setDivisi(updatedDivisi);
    localStorage.setItem('divisi', JSON.stringify(updatedDivisi));
    triggerUpdate();
  };

  const useDefaultData = (year: number) => {
    try {
      // Default Direktorat
      const defaultDirektorat: Direktorat[] = [
        { id: Date.now(), nama: 'Direktorat Keuangan', deskripsi: 'Mengelola keuangan perusahaan', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 1, nama: 'Direktorat Operasional', deskripsi: 'Mengelola operasional perusahaan', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 2, nama: 'Direktorat SDM', deskripsi: 'Mengelola sumber daya manusia', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 3, nama: 'Direktorat Teknologi', deskripsi: 'Mengelola teknologi informasi', tahun: year, createdAt: new Date(), isActive: true }
      ];

      // Default Subdirektorat
      const defaultSubdirektorat: Subdirektorat[] = [
        { id: Date.now(), nama: 'Subdirektorat Akuntansi', direktoratId: defaultDirektorat[0].id, deskripsi: 'Mengelola akuntansi', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 1, nama: 'Subdirektorat Treasury', direktoratId: defaultDirektorat[0].id, deskripsi: 'Mengelola treasury', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 2, nama: 'Subdirektorat Logistik', direktoratId: defaultDirektorat[1].id, deskripsi: 'Mengelola logistik', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 3, nama: 'Subdirektorat Pelayanan', direktoratId: defaultDirektorat[1].id, deskripsi: 'Mengelola pelayanan', tahun: year, createdAt: new Date(), isActive: true }
      ];

      // Default Anak Perusahaan - FRESH START
      const defaultAnakPerusahaan: AnakPerusahaan[] = [];

      // Default Divisi
      const defaultDivisi: Divisi[] = [
        { id: Date.now(), nama: 'Divisi Akuntansi', subdirektoratId: defaultSubdirektorat[0].id, deskripsi: 'Mengelola akuntansi', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 1, nama: 'Divisi Treasury', subdirektoratId: defaultSubdirektorat[1].id, deskripsi: 'Mengelola treasury', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 2, nama: 'Divisi Logistik', subdirektoratId: defaultSubdirektorat[2].id, deskripsi: 'Mengelola logistik', tahun: year, createdAt: new Date(), isActive: true },
        { id: Date.now() + 3, nama: 'Divisi Pelayanan', subdirektoratId: defaultSubdirektorat[3].id, deskripsi: 'Mengelola pelayanan', tahun: year, createdAt: new Date(), isActive: true }
      ];

      // Set data
      setDirektorat(prev => [...prev, ...defaultDirektorat]);
      setSubdirektorat(prev => [...prev, ...defaultSubdirektorat]);
      setAnakPerusahaan(prev => [...prev, ...defaultAnakPerusahaan]);
      setDivisi(prev => [...prev, ...defaultDivisi]);

      // Save to localStorage
      localStorage.setItem('direktorat', JSON.stringify([...direktorat, ...defaultDirektorat]));
      localStorage.setItem('subdirektorat', JSON.stringify([...subdirektorat, ...defaultSubdirektorat]));
      localStorage.setItem('anakPerusahaan', JSON.stringify([...anakPerusahaan, ...defaultAnakPerusahaan]));
      localStorage.setItem('divisi', JSON.stringify([...divisi, ...defaultDivisi]));

      triggerUpdate();
    } catch (error) {
      console.error('Error using default data:', error);
    }
  };

  const triggerUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    // Dispatch custom event untuk update dalam tab yang sama
    window.dispatchEvent(new CustomEvent('strukturPerusahaanUpdate', {
      detail: { type: 'strukturPerusahaanUpdate' }
    }));
  };

  // Refresh function
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Listen for localStorage changes (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'direktorat' || e.key === 'subdirektorat' || e.key === 'anakPerusahaan' || e.key === 'divisi') {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events (same-tab updates)
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.type === 'strukturPerusahaanUpdate') {
        refreshData();
      }
    };

    // Listen for year data cleanup events
    const handleYearDataCleaned = (e: CustomEvent) => {
      if (e.detail?.type === 'yearRemoved') {
        const removedYear = e.detail.year;
        console.log(`StrukturPerusahaanContext: Year ${removedYear} data cleaned up, refreshing data`);
        refreshData();
      }
    };

    window.addEventListener('strukturPerusahaanUpdate', handleCustomEvent as EventListener);
    window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    
    return () => {
      window.removeEventListener('strukturPerusahaanUpdate', handleCustomEvent as EventListener);
      window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    };
  }, []);

  // Force refresh when selectedYear changes
  useEffect(() => {
    refreshData();
  }, [selectedYear]);

  const value: StrukturPerusahaanContextType = {
    direktorat: filteredDirektorat,
    subdirektorat: filteredSubdirektorat,
    anakPerusahaan: filteredAnakPerusahaan,
    divisi: filteredDivisi,
    addDirektorat,
    addSubdirektorat,
    addAnakPerusahaan,
    addDivisi,
    deleteDirektorat,
    deleteSubdirektorat,
    deleteAnakPerusahaan,
    deleteDivisi,
    useDefaultData,
    refreshData,
    isLoading
  };

  return (
    <StrukturPerusahaanContext.Provider value={value}>
      {children}
    </StrukturPerusahaanContext.Provider>
  );
};

export const useStrukturPerusahaan = (): StrukturPerusahaanContextType => {
  const context = useContext(StrukturPerusahaanContext);
  if (context === undefined) {
    throw new Error('useStrukturPerusahaan must be used within a StrukturPerusahaanProvider');
  }
  return context;
};
