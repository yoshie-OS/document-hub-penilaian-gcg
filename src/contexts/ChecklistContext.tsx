import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface ChecklistGCG {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
}

export interface Aspek {
  id: number;
  nama: string;
  tahun: number;
}

interface ChecklistContextType {
  checklist: ChecklistGCG[];
  aspects: Aspek[];
  getChecklistByYear: (year: number) => ChecklistGCG[];
  getAspectsByYear: (year: number) => Aspek[];
  addChecklist: (aspek: string, deskripsi: string, year: number) => void;
  editChecklist: (id: number, aspek: string, deskripsi: string, year: number) => void;
  deleteChecklist: (id: number, year: number) => void;
  addAspek: (nama: string, year: number) => void;
  editAspek: (id: number, newNama: string, year: number) => void;
  deleteAspek: (id: number, year: number) => void;
  initializeYearData: (year: number) => void;
  ensureAllYearsHaveData: () => void;
  ensureAspectsForAllYears: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
  const [aspects, setAspects] = useState<Aspek[]>([]);

  // Initialize data from localStorage
  useEffect(() => {
    const data = localStorage.getItem("checklistGCG");
    const aspectsData = localStorage.getItem("aspects");
    
    if (data && aspectsData) {
      try {
        const parsedData = JSON.parse(data);
        const parsedAspects = JSON.parse(aspectsData);
        
        // Pastikan data valid
        if (Array.isArray(parsedData) && Array.isArray(parsedAspects)) {
          setChecklist(parsedData);
          setAspects(parsedAspects);
          console.log('ChecklistContext: Initialized from localStorage', { checklist: parsedData.length, aspects: parsedAspects.length });
          
          // Clean up any duplicate aspects
          setTimeout(() => cleanupDuplicateAspects(), 100);
        }
      } catch (error) {
        console.error('ChecklistContext: Error parsing localStorage data', error);
        // Fallback to default data
        initializeDefaultData();
      }
    } else {
      // Initialize with default data
      initializeDefaultData();
    }
  }, []);

    // Helper function untuk initialize default data - FRESH START
  const initializeDefaultData = () => {
    // Start with completely empty data
    const defaultData: ChecklistGCG[] = [];
    const defaultAspects: Aspek[] = [];
    
    localStorage.setItem("checklistGCG", JSON.stringify(defaultData));
    localStorage.setItem("aspects", JSON.stringify(defaultAspects));
    setChecklist(defaultData);
    setAspects(defaultAspects);
    console.log('ChecklistContext: Initialized with FRESH START - no default data');
  };

  // Listen for updates from PengaturanBaru
  useEffect(() => {
    const handleChecklistUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'checklistUpdated') {
        const updatedData = event.detail.data;
        console.log('ChecklistContext: Received checklistUpdated event', updatedData);
        
        // Pastikan data valid sebelum update
        if (Array.isArray(updatedData) && updatedData.length > 0) {
          setChecklist(updatedData);
          // Update localStorage juga untuk konsistensi
          localStorage.setItem('checklistGCG', JSON.stringify(updatedData));
          console.log('ChecklistContext: Data updated from PengaturanBaru', updatedData);
        }
      }
    };

    const handleAspectsUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'aspectsUpdated') {
        const updatedAspects = event.detail.data;
        setAspects(updatedAspects);
        console.log('ChecklistContext: Aspects updated from PengaturanBaru', updatedAspects);
      }
    };

    // Listen for year data cleanup events
    const handleYearDataCleaned = (event: CustomEvent) => {
      if (event.detail?.type === 'yearRemoved') {
        const removedYear = event.detail.year;
        console.log(`ChecklistContext: Year ${removedYear} data cleaned up, refreshing local state`);
        
        // Refresh data from localStorage to ensure consistency
        const storedChecklist = localStorage.getItem('checklistGCG');
        if (storedChecklist) {
          try {
            const parsed = JSON.parse(storedChecklist);
            setChecklist(parsed);
          } catch (error) {
            console.error('ChecklistContext: Error refreshing checklist after year cleanup', error);
          }
        }
        
        const storedAspects = localStorage.getItem('aspects');
        if (storedAspects) {
          try {
            const parsed = JSON.parse(storedAspects);
            setAspects(parsed);
          } catch (error) {
            console.error('ChecklistContext: Error refreshing aspects after year cleanup', error);
          }
        }
      }
    };

    window.addEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
    window.addEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    
    return () => {
      window.removeEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
      window.removeEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
      window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    };
  }, []);

  // Effect untuk memantau perubahan di localStorage dan sync dengan state
  useEffect(() => {
    const handleStorageChange = () => {
      const storedData = localStorage.getItem("checklistGCG");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData) && JSON.stringify(parsedData) !== JSON.stringify(checklist)) {
            console.log('ChecklistContext: localStorage changed, updating state', {
              stored: parsedData.length,
              current: checklist.length
            });
            setChecklist(parsedData);
          }
        } catch (error) {
          console.error('ChecklistContext: Error parsing localStorage change', error);
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage periodically for changes
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checklist]);

  const getChecklistByYear = (year: number): ChecklistGCG[] => {
    // Pastikan data di-load dari localStorage terlebih dahulu
    const storedData = localStorage.getItem("checklistGCG");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          // Update state jika ada data baru
          if (JSON.stringify(parsedData) !== JSON.stringify(checklist)) {
            setChecklist(parsedData);
          }
          return parsedData.filter(item => item.tahun === year);
        }
      } catch (error) {
        console.error('ChecklistContext: Error parsing stored data in getChecklistByYear', error);
      }
    }
    return checklist.filter(item => item.tahun === year);
  };

  const getAspectsByYear = (year: number): Aspek[] => {
    // Pastikan data di-load dari localStorage terlebih dahulu
    const storedData = localStorage.getItem("aspects");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          // Update state jika ada data baru
          if (JSON.stringify(parsedData) !== JSON.stringify(aspects)) {
            setAspects(parsedData);
          }
          return parsedData.filter(aspek => aspek.tahun === year);
        }
      } catch (error) {
        console.error('ChecklistContext: Error parsing stored data in getAspectsByYear', error);
      }
    }
    return aspects.filter(aspek => aspek.tahun === year);
  };

  const initializeYearData = (year: number) => {
    const existingData = checklist.filter(item => item.tahun === year);
    const existingAspects = aspects.filter(aspek => aspek.tahun === year);
    
    if (existingData.length === 0) {
      // Initialize with empty data for the new year - FRESH START
      console.log(`ChecklistContext: Year ${year} initialized with empty data`);
      // No default data - user must add manually
    }
    
    if (existingAspects.length === 0) {
      // Initialize aspects for the new year - FRESH START
      console.log(`ChecklistContext: Year ${year} aspects initialized with empty data`);
      // No default aspects - user must add manually
    }
  };

  const addChecklist = (aspek: string, deskripsi: string, year: number) => {
    const newChecklist = { id: Date.now(), aspek, deskripsi, tahun: year };
    const updated = [...checklist, newChecklist];
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const editChecklist = (id: number, aspek: string, deskripsi: string, year: number) => {
    const updated = checklist.map((c) => (c.id === id ? { ...c, aspek, deskripsi, tahun: year } : c));
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const deleteChecklist = (id: number, year: number) => {
    const updated = checklist.filter((c) => c.id !== id);
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const addAspek = (nama: string, year: number) => {
    const newAspek = { 
      id: Date.now(), 
      nama, 
      tahun: year 
    };
    const updated = [...aspects, newAspek];
    setAspects(updated);
    localStorage.setItem("aspects", JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aspectsUpdated', {
      detail: { type: 'aspectsUpdated', data: updated }
    }));
  };

  const editAspek = (id: number, newNama: string, year: number) => {
    const updated = aspects.map((a) => 
      a.id === id ? { ...a, nama: newNama } : a
    );
    setAspects(updated);
    localStorage.setItem("aspects", JSON.stringify(updated));
    
    // Update checklist items that use this aspect
    const updatedChecklist = checklist.map(item => 
      item.aspek === aspects.find(a => a.id === id)?.nama && item.tahun === year
        ? { ...item, aspek: newNama }
        : item
    );
    setChecklist(updatedChecklist);
    localStorage.setItem("checklistGCG", JSON.stringify(updatedChecklist));
    
    // Trigger update events
    window.dispatchEvent(new CustomEvent('aspectsUpdated', {
      detail: { type: 'aspectsUpdated', data: updated }
    }));
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updatedChecklist }
    }));
  };

  const deleteAspek = (id: number, year: number) => {
    const aspekToDelete = aspects.find(a => a.id === id);
    if (!aspekToDelete) return;
    
    // Remove aspect from aspects list
    const updatedAspects = aspects.filter(a => a.id !== id);
    setAspects(updatedAspects);
    localStorage.setItem("aspects", JSON.stringify(updatedAspects));
    
    // IMPORTANT: Don't delete checklist items, just remove the aspect reference
    // This ensures checklist items remain but without the deleted aspect
    const updatedChecklist = checklist.map(item => 
      item.aspek === aspekToDelete.nama && item.tahun === year
        ? { ...item, aspek: '' } // Set to empty string instead of deleting
        : item
    );
    setChecklist(updatedChecklist);
    localStorage.setItem("checklistGCG", JSON.stringify(updatedChecklist));
    
    // Trigger update events
    window.dispatchEvent(new CustomEvent('aspectsUpdated', {
      detail: { type: 'aspectsUpdated', data: updatedAspects }
    }));
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updatedChecklist }
    }));
  };

  const ensureAllYearsHaveData = useCallback(() => {
    // Implementation for ensuring all years have data
    const years = [2024, 2025]; // Get from YearContext if available
    years.forEach(year => {
      initializeYearData(year);
    });
  }, []);

  // Function to make aspects available for all years (DISABLED to prevent duplication)
  const ensureAspectsForAllYears = useCallback(() => {
    // DISABLED: This function was causing aspect duplication
    // The generatePredeterminedRows function now gets ALL aspects regardless of year
    console.log('ChecklistContext: ensureAspectsForAllYears disabled to prevent duplication');
    return;
  }, [aspects]);

  // Cleanup function to remove duplicate aspects
  const cleanupDuplicateAspects = useCallback(() => {
    const allAspects = JSON.parse(localStorage.getItem('aspects') || '[]');
    if (allAspects.length === 0) return;

    // Remove duplicates based on nama (aspect name)
    const uniqueAspects: Aspek[] = [];
    const seenNames = new Set<string>();

    allAspects.forEach((aspect: Aspek) => {
      if (!seenNames.has(aspect.nama)) {
        seenNames.add(aspect.nama);
        uniqueAspects.push(aspect);
      }
    });

    if (uniqueAspects.length !== allAspects.length) {
      console.log(`ChecklistContext: Removing ${allAspects.length - uniqueAspects.length} duplicate aspects`);
      console.log(`ChecklistContext: Cleaned up from ${allAspects.length} to ${uniqueAspects.length} aspects`);
      
      setAspects(uniqueAspects);
      localStorage.setItem('aspects', JSON.stringify(uniqueAspects));
    }
  }, []);

  return (
    <ChecklistContext.Provider value={{ 
      checklist, 
      aspects,
      getChecklistByYear,
      getAspectsByYear,
      addChecklist, 
      editChecklist, 
      deleteChecklist,
      addAspek,
      editAspek,
      deleteAspek,
      initializeYearData,
      ensureAllYearsHaveData,
      ensureAspectsForAllYears
    }}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist must be used within ChecklistProvider");
  return ctx;
}; 