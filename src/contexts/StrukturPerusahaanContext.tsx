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

  updateDirektorat: (id: number, data: Partial<Direktorat>) => Promise<void>;
  updateSubdirektorat: (id: number, data: Partial<Subdirektorat>) => Promise<void>;
  updateAnakPerusahaan: (id: number, data: Partial<AnakPerusahaan>) => Promise<void>;
  updateDivisi: (id: number, data: Partial<Divisi>) => Promise<void>;

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

  // Load data from backend first, fallback to localStorage
  useEffect(() => {
    const loadDataFrombackend = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/config/struktur-organisasi');
        if (response.ok) {
          const data = await response.json();
          
          // Map the backend data to our local format
          const mapbackendData = (items: any[], type: string) => {
            return items.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              deskripsi: item.deskripsi || '',
              tahun: item.tahun || selectedYear || new Date().getFullYear(),
              createdAt: new Date(item.created_at || new Date()),
              isActive: true,
              // Type-specific fields
              ...(type === 'subdirektorat' && { direktoratId: item.parent_id }),
              ...(type === 'divisi' && { subdirektoratId: item.parent_id }),
            }));
          };

          setDirektorat(mapbackendData(data.direktorat || [], 'direktorat'));
          setSubdirektorat(mapbackendData(data.subdirektorat || [], 'subdirektorat'));
          setAnakPerusahaan(mapbackendData(data.anak_perusahaan || [], 'anak_perusahaan'));
          setDivisi(mapbackendData(data.divisi || [], 'divisi'));

          console.log('StrukturPerusahaanContext: Loaded data from backend');
        } else {
          console.error('StrukturPerusahaanContext: Failed to load from backend');
          setDirektorat([]);
          setSubdirektorat([]);
          setAnakPerusahaan([]);
          setDivisi([]);
        }
      } catch (error) {
        console.error('StrukturPerusahaanContext: Error loading from backend', error);
        setDirektorat([]);
        setSubdirektorat([]);
        setAnakPerusahaan([]);
        setDivisi([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFrombackend();
  }, [refreshTrigger]);

  // Filter data berdasarkan tahun yang dipilih
  const filteredDirektorat = selectedYear ? direktorat.filter(d => d.tahun === selectedYear) : [];
  const filteredSubdirektorat = selectedYear ? subdirektorat.filter(s => s.tahun === selectedYear) : [];
  const filteredAnakPerusahaan = selectedYear ? anakPerusahaan.filter(a => a.tahun === selectedYear) : [];
  const filteredDivisi = selectedYear ? divisi.filter(d => d.tahun === selectedYear) : [];

  // CRUD Functions
  const addDirektorat = async (data: Omit<Direktorat, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to backend API
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
      
      console.log('StrukturPerusahaanContext: Successfully saved direktorat to backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save direktorat to backend:', error);
    }

    const newDirektorat: Direktorat = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedDirektorat = [...direktorat, newDirektorat];
    setDirektorat(updatedDirektorat);
    triggerUpdate();
  };

  const addSubdirektorat = async (data: Omit<Subdirektorat, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to backend API
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
      
      console.log('StrukturPerusahaanContext: Successfully saved subdirektorat to backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save subdirektorat to backend:', error);
    }

    const newSubdirektorat: Subdirektorat = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedSubdirektorat = [...subdirektorat, newSubdirektorat];
    setSubdirektorat(updatedSubdirektorat);
    triggerUpdate();
  };

  const addAnakPerusahaan = async (data: Omit<AnakPerusahaan, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to backend API
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
      
      console.log('StrukturPerusahaanContext: Successfully saved anak perusahaan to backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save anak perusahaan to backend:', error);
    }

    const newAnakPerusahaan: AnakPerusahaan = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedAnakPerusahaan = [...anakPerusahaan, newAnakPerusahaan];
    setAnakPerusahaan(updatedAnakPerusahaan);
    triggerUpdate();
  };

  const addDivisi = async (data: Omit<Divisi, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      // Save to backend API
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
      
      console.log('StrukturPerusahaanContext: Successfully saved divisi to backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to save divisi to backend:', error);
    }

    const newDivisi: Divisi = {
      ...data,
      id: Date.now(),
      createdAt: new Date(),
      isActive: true
    };

    const updatedDivisi = [...divisi, newDivisi];
    setDivisi(updatedDivisi);
    triggerUpdate();
  };

  const deleteDirektorat = async (id: number) => {
    try {
      // Delete from backend API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted direktorat from backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete direktorat from backend:', error);
    }

    const updatedDirektorat = direktorat.filter(d => d.id !== id);
    setDirektorat(updatedDirektorat);
    triggerUpdate();
  };

  const deleteSubdirektorat = async (id: number) => {
    try {
      // Delete from backend API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted subdirektorat from backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete subdirektorat from backend:', error);
    }

    const updatedSubdirektorat = subdirektorat.filter(s => s.id !== id);
    setSubdirektorat(updatedSubdirektorat);
    triggerUpdate();
  };

  const deleteAnakPerusahaan = async (id: number) => {
    try {
      // Delete from backend API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('StrukturPerusahaanContext: Successfully deleted anak perusahaan from backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete anak perusahaan from backend:', error);
    }

    const updatedAnakPerusahaan = anakPerusahaan.filter(a => a.id !== id);
    setAnakPerusahaan(updatedAnakPerusahaan);
    triggerUpdate();
  };

  const deleteDivisi = async (id: number) => {
    try {
      // Delete from backend API
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('StrukturPerusahaanContext: Successfully deleted divisi from backend');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to delete divisi from backend:', error);
    }

    const updatedDivisi = divisi.filter(d => d.id !== id);
    setDivisi(updatedDivisi);
    triggerUpdate();
  };

  // Update functions
  const updateDirektorat = async (id: number, data: Partial<Direktorat>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direktorat',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('StrukturPerusahaanContext: Successfully updated direktorat');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to update direktorat:', error);
    }

    const updatedDirektorat = direktorat.map(d => d.id === id ? { ...d, ...data } : d);
    setDirektorat(updatedDirektorat);
    triggerUpdate();
  };

  const updateSubdirektorat = async (id: number, data: Partial<Subdirektorat>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subdirektorat',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: data.direktoratId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('StrukturPerusahaanContext: Successfully updated subdirektorat');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to update subdirektorat:', error);
    }

    const updatedSubdirektorat = subdirektorat.map(s => s.id === id ? { ...s, ...data } : s);
    setSubdirektorat(updatedSubdirektorat);
    triggerUpdate();
  };

  const updateAnakPerusahaan = async (id: number, data: Partial<AnakPerusahaan>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'anak_perusahaan',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('StrukturPerusahaanContext: Successfully updated anak perusahaan');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to update anak perusahaan:', error);
    }

    const updatedAnakPerusahaan = anakPerusahaan.map(a => a.id === id ? { ...a, ...data } : a);
    setAnakPerusahaan(updatedAnakPerusahaan);
    triggerUpdate();
  };

  const updateDivisi = async (id: number, data: Partial<Divisi>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/config/struktur-organisasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'divisi',
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          parent_id: data.subdirektoratId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('StrukturPerusahaanContext: Successfully updated divisi');
    } catch (error) {
      console.error('StrukturPerusahaanContext: Failed to update divisi:', error);
    }

    const updatedDivisi = divisi.map(d => d.id === id ? { ...d, ...data } : d);
    setDivisi(updatedDivisi);
    triggerUpdate();
  };

  const useDefaultData = async (year: number) => {
    try {
      console.log(`StrukturPerusahaanContext: Creating default data for year ${year}`);
      setIsLoading(true);
      
      // Import the actual default data
      const { DEFAULT_STRUKTUR_ORGANISASI } = await import('../data/defaultStrukturOrganisasi');
      
      // Clear existing data first to avoid duplicates
      setDirektorat(prev => prev.filter(d => d.tahun !== year));
      setSubdirektorat(prev => prev.filter(s => s.tahun !== year));
      setDivisi(prev => prev.filter(d => d.tahun !== year));
      setAnakPerusahaan(prev => prev.filter(a => a.tahun !== year));
      
      // Prepare batch data for API
      const batchItems: any[] = [];
      
      // Add all direktorat to batch
      for (const dir of DEFAULT_STRUKTUR_ORGANISASI.direktorat) {
        batchItems.push({
          type: 'direktorat',
          nama: dir.nama,
          deskripsi: `${dir.kode} - ${dir.nama}`,
          tahun: year, // Add year field
          parent_id: null,
          // Include original ID for mapping later
          original_id: dir.id
        });
      }
      
      // Add all subdirektorat to batch
      for (const sub of DEFAULT_STRUKTUR_ORGANISASI.subdirektorat) {
        batchItems.push({
          type: 'subdirektorat',
          nama: sub.nama,
          deskripsi: `${sub.kode} - ${sub.nama}`,
          tahun: year, // Add year field
          parent_id: sub.parentId, // Will be mapped by backend
          original_id: sub.id,
          parent_original_id: sub.parentId
        });
      }
      
      // Add all divisi to batch
      for (const div of DEFAULT_STRUKTUR_ORGANISASI.divisi) {
        batchItems.push({
          type: 'divisi',
          nama: div.nama,
          deskripsi: `${div.kode} - ${div.nama}`,
          tahun: year, // Add year field
          parent_id: div.parentId, // Will be mapped by backend
          original_id: div.id,
          parent_original_id: div.parentId
        });
      }
      
      console.log(`StrukturPerusahaanContext: Sending ${batchItems.length} items in batch API call`);
      
      // Single batch API call to avoid race conditions
      const response = await fetch('http://localhost:5000/api/config/struktur-organisasi/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: batchItems }),
      });
      
      if (!response.ok) {
        throw new Error(`Batch API failed: ${response.status} ${response.statusText}`);
      }
      
      const batchResult = await response.json();
      console.log(`StrukturPerusahaanContext: Batch API successful, created ${batchResult.created?.length || 0} items`);
      
      // Update local state with the batch results
      if (batchResult.created && Array.isArray(batchResult.created)) {
        const newDirektorat: Direktorat[] = [];
        const newSubdirektorat: Subdirektorat[] = [];
        const newDivisi: Divisi[] = [];
        
        for (const item of batchResult.created) {
          if (item.type === 'direktorat') {
            newDirektorat.push({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              deskripsi: item.deskripsi,
              tahun: year,
              createdAt: new Date(item.created_at || new Date()),
              isActive: true
            });
          } else if (item.type === 'subdirektorat') {
            newSubdirektorat.push({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              direktoratId: item.parent_id,
              deskripsi: item.deskripsi,
              tahun: year,
              createdAt: new Date(item.created_at || new Date()),
              isActive: true
            });
          } else if (item.type === 'divisi') {
            newDivisi.push({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              subdirektoratId: item.parent_id,
              deskripsi: item.deskripsi,
              tahun: year,
              createdAt: new Date(item.created_at || new Date()),
              isActive: true
            });
          }
        }
        
        // Update state with all new items
        setDirektorat(prev => [...prev, ...newDirektorat]);
        setSubdirektorat(prev => [...prev, ...newSubdirektorat]);
        setDivisi(prev => [...prev, ...newDivisi]);
        
        console.log(`StrukturPerusahaanContext: Updated state with ${newDirektorat.length} direktorat, ${newSubdirektorat.length} subdirektorat, ${newDivisi.length} divisi`);
      }
      
      console.log(`StrukturPerusahaanContext: Successfully created default data for year ${year}`);
      
      // Force refresh from backend to update localStorage with the latest data
      setTimeout(() => {
        triggerUpdate();
      }, 1000); // Reduced timeout since we're using batch API
      
    } catch (error) {
      console.error('StrukturPerusahaanContext: Error creating default data:', error);
      throw error;
    } finally {
      setIsLoading(false);
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

  // localStorage sync removed - data only comes from API

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
    updateDirektorat,
    updateSubdirektorat,
    updateAnakPerusahaan,
    updateDivisi,
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
