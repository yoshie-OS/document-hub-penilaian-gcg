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
  addDirektorat: (data: Omit<Direktorat, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  addSubdirektorat: (data: Omit<Subdirektorat, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  addAnakPerusahaan: (data: Omit<AnakPerusahaan, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  addDivisi: (data: Omit<Divisi, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  
  deleteDirektorat: (id: number) => Promise<void>;
  deleteSubdirektorat: (id: number) => Promise<void>;
  deleteAnakPerusahaan: (id: number) => Promise<void>;
  deleteDivisi: (id: number) => Promise<void>;
  
  // Utility functions
  useDefaultData: (year: number) => Promise<void>;
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

  // Load data from Supabase first, fallback to localStorage
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/config/struktur-organisasi');
        if (response.ok) {
          const data = await response.json();
          
          // Map the Supabase data to our local format
          const mapSupabaseData = (items: any[], type: string) => {
            return items.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              deskripsi: item.deskripsi || '',
              tahun: item.tahun || new Date().getFullYear(),
              createdAt: new Date(item.created_at || new Date()),
              isActive: true,
              // Type-specific fields
              ...(type === 'subdirektorat' && { direktoratId: item.parent_id }),
              ...(type === 'divisi' && { subdirektoratId: item.parent_id }),
            }));
          };

          setDirektorat(mapSupabaseData(data.direktorat || [], 'direktorat'));
          setSubdirektorat(mapSupabaseData(data.subdirektorat || [], 'subdirektorat'));
          setAnakPerusahaan(mapSupabaseData(data.anak_perusahaan || [], 'anak_perusahaan'));
          setDivisi(mapSupabaseData(data.divisi || [], 'divisi'));
          
          // Also update localStorage for consistency
          localStorage.setItem('direktorat', JSON.stringify(mapSupabaseData(data.direktorat || [], 'direktorat')));
          localStorage.setItem('subdirektorat', JSON.stringify(mapSupabaseData(data.subdirektorat || [], 'subdirektorat')));
          localStorage.setItem('anakPerusahaan', JSON.stringify(mapSupabaseData(data.anak_perusahaan || [], 'anak_perusahaan')));
          localStorage.setItem('divisi', JSON.stringify(mapSupabaseData(data.divisi || [], 'divisi')));

          console.log('StrukturPerusahaanContext: Loaded data from Supabase');
        } else {
          console.error('StrukturPerusahaanContext: Failed to load from Supabase');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('StrukturPerusahaanContext: Error loading from Supabase', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
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
        
        console.log('StrukturPerusahaanContext: Loaded data from localStorage fallback');
      } catch (error) {
        console.error('StrukturPerusahaanContext: Error loading data:', error);
      }
    };

    loadDataFromSupabase();
  }, [refreshTrigger]);

  // Filter data berdasarkan tahun yang dipilih
  const filteredDirektorat = selectedYear ? direktorat.filter(d => d.tahun === selectedYear) : [];
  const filteredSubdirektorat = selectedYear ? subdirektorat.filter(s => s.tahun === selectedYear) : [];
  const filteredAnakPerusahaan = selectedYear ? anakPerusahaan.filter(a => a.tahun === selectedYear) : [];
  const filteredDivisi = selectedYear ? divisi.filter(d => d.tahun === selectedYear) : [];

  // CRUD Functions
  const addDirektorat = async (data: Omit<Direktorat, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to Supabase API
      const response = await fetch('http://localhost:5000/api/config/struktur-organisasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'direktorat',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: null,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully saved direktorat to Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save direktorat to Supabase:', error);
    }

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

  const addSubdirektorat = async (data: Omit<Subdirektorat, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to Supabase API
      const response = await fetch('http://localhost:5000/api/config/struktur-organisasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subdirektorat',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: data.direktoratId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully saved subdirektorat to Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save subdirektorat to Supabase:', error);
    }

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

  const addAnakPerusahaan = async (data: Omit<AnakPerusahaan, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to Supabase API
      const response = await fetch('http://localhost:5000/api/config/struktur-organisasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'anak_perusahaan',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: null,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully saved anak perusahaan to Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save anak perusahaan to Supabase:', error);
    }

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

  const addDivisi = async (data: Omit<Divisi, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to Supabase API
      const response = await fetch('http://localhost:5000/api/config/struktur-organisasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'divisi',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: data.subdirektoratId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully saved divisi to Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save divisi to Supabase:', error);
    }

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

  const deleteDirektorat = async (id: number) => {
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted direktorat from Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete direktorat from Supabase:', error);
    }

    const updatedDirektorat = direktorat.filter(d => d.id !== id);
    setDirektorat(updatedDirektorat);
    localStorage.setItem('direktorat', JSON.stringify(updatedDirektorat));
    triggerUpdate();
  };

  const deleteSubdirektorat = async (id: number) => {
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted subdirektorat from Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete subdirektorat from Supabase:', error);
    }

    const updatedSubdirektorat = subdirektorat.filter(s => s.id !== id);
    setSubdirektorat(updatedSubdirektorat);
    localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektorat));
    triggerUpdate();
  };

  const deleteAnakPerusahaan = async (id: number) => {
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted anak perusahaan from Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete anak perusahaan from Supabase:', error);
    }

    const updatedAnakPerusahaan = anakPerusahaan.filter(a => a.id !== id);
    setAnakPerusahaan(updatedAnakPerusahaan);
    localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaan));
    triggerUpdate();
  };

  const deleteDivisi = async (id: number) => {
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted divisi from Supabase');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete divisi from Supabase:', error);
    }

    const updatedDivisi = divisi.filter(d => d.id !== id);
    setDivisi(updatedDivisi);
    localStorage.setItem('divisi', JSON.stringify(updatedDivisi));
    triggerUpdate();
  };

  const useDefaultData = async (year: number) => {
    try {
      console.log(`StrukturPerusahaanContext: Creating default data for year ${year}`);
      
      // Create default direktorat using the API functions
      const direktoratData = [
        { nama: 'Direktorat Keuangan', deskripsi: 'Mengelola keuangan perusahaan', tahun: year },
        { nama: 'Direktorat Operasional', deskripsi: 'Mengelola operasional perusahaan', tahun: year },
        { nama: 'Direktorat SDM', deskripsi: 'Mengelola sumber daya manusia', tahun: year },
        { nama: 'Direktorat Teknologi', deskripsi: 'Mengelola teknologi informasi', tahun: year }
      ];

      // Add direktorat one by one
      for (const dir of direktoratData) {
        await addDirektorat(dir);
        // Small delay to ensure proper ordering
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get the current direktorat to get IDs for subdirektorat
      const currentDirektorat = direktorat.filter(d => d.tahun === year);
      
      if (currentDirektorat.length >= 2) {
        // Create default subdirektorat
        const subdirektoratData = [
          { nama: 'Subdirektorat Akuntansi', direktoratId: currentDirektorat[0].id, deskripsi: 'Mengelola akuntansi', tahun: year },
          { nama: 'Subdirektorat Treasury', direktoratId: currentDirektorat[0].id, deskripsi: 'Mengelola treasury', tahun: year },
          { nama: 'Subdirektorat Logistik', direktoratId: currentDirektorat[1].id, deskripsi: 'Mengelola logistik', tahun: year },
          { nama: 'Subdirektorat Pelayanan', direktoratId: currentDirektorat[1].id, deskripsi: 'Mengelola pelayanan', tahun: year }
        ];

        // Add subdirektorat one by one
        for (const sub of subdirektoratData) {
          await addSubdirektorat(sub);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get current subdirektorat for divisi
        const currentSubdirektorat = subdirektorat.filter(s => s.tahun === year);
        
        if (currentSubdirektorat.length >= 4) {
          // Create default divisi
          const divisiData = [
            { nama: 'Divisi Akuntansi', subdirektoratId: currentSubdirektorat[0].id, deskripsi: 'Mengelola akuntansi', tahun: year },
            { nama: 'Divisi Treasury', subdirektoratId: currentSubdirektorat[1].id, deskripsi: 'Mengelola treasury', tahun: year },
            { nama: 'Divisi Logistik', subdirektoratId: currentSubdirektorat[2].id, deskripsi: 'Mengelola logistik', tahun: year },
            { nama: 'Divisi Pelayanan', subdirektoratId: currentSubdirektorat[3].id, deskripsi: 'Mengelola pelayanan', tahun: year }
          ];

          // Add divisi one by one
          for (const div of divisiData) {
            await addDivisi(div);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      console.log(`StrukturPerusahaanContext: Successfully created default data for year ${year}`);
    } catch (error) {
      console.error('StrukturPerusahaanContext: Error creating default data:', error);
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
