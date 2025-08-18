import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { seedChecklistGCG } from "@/lib/seed/seedChecklistGCG";

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
      const parsedData = JSON.parse(data);
      const parsedAspects = JSON.parse(aspectsData);
      setChecklist(parsedData);
      setAspects(parsedAspects);
    } else {
      // Initialize with default data
      const defaultData: ChecklistGCG[] = [];
      const defaultAspects: Aspek[] = [];
      
      // Get available years from localStorage or use current year
      const years = [2024, 2025]; // Default years
      
      years.forEach(year => {
        const yearData = seedChecklistGCG.map(item => ({ ...item, tahun: year }));
        defaultData.push(...yearData);
        
        // Extract unique aspects from seed data
        const uniqueAspects = [...new Set(yearData.map(item => item.aspek))];
        uniqueAspects.forEach(aspek => {
          defaultAspects.push({
            id: Date.now() + Math.random(),
            nama: aspek,
            tahun: year
          });
        });
      });
      
      localStorage.setItem("checklistGCG", JSON.stringify(defaultData));
      localStorage.setItem("aspects", JSON.stringify(defaultAspects));
      setChecklist(defaultData);
      setAspects(defaultAspects);
    }
  }, []);

  // Listen for updates from PengaturanBaru
  useEffect(() => {
    const handleChecklistUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'checklistUpdated') {
        const updatedData = event.detail.data;
        setChecklist(updatedData);
        console.log('ChecklistContext: Data updated from PengaturanBaru', updatedData);
      }
    };

    const handleAspectsUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'aspectsUpdated') {
        const updatedAspects = event.detail.data;
        setAspects(updatedAspects);
        console.log('ChecklistContext: Aspects updated from PengaturanBaru', updatedAspects);
      }
    };

    window.addEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
    window.addEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
      window.removeEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    };
  }, []);

  const getChecklistByYear = (year: number): ChecklistGCG[] => {
    return checklist.filter(item => item.tahun === year);
  };

  const getAspectsByYear = (year: number): Aspek[] => {
    return aspects.filter(aspek => aspek.tahun === year);
  };

  const initializeYearData = (year: number) => {
    const existingData = checklist.filter(item => item.tahun === year);
    const existingAspects = aspects.filter(aspek => aspek.tahun === year);
    
    if (existingData.length === 0) {
      // Initialize with default data for the new year
      const defaultData = seedChecklistGCG.map(item => ({ ...item, tahun: year }));
      const updated = [...checklist, ...defaultData];
      setChecklist(updated);
      localStorage.setItem("checklistGCG", JSON.stringify(updated));
    }
    
    if (existingAspects.length === 0) {
      // Initialize aspects for the new year
      const uniqueAspects = [...new Set(seedChecklistGCG.map(item => item.aspek))];
      const newAspects = uniqueAspects.map(aspek => ({
        id: Date.now() + Math.random(),
        nama: aspek,
        tahun: year
      }));
      const updatedAspects = [...aspects, ...newAspects];
      setAspects(updatedAspects);
      localStorage.setItem("aspects", JSON.stringify(updatedAspects));
    }
  };

  const addChecklist = (aspek: string, deskripsi: string, year: number) => {
    const newChecklist = { id: Date.now(), aspek, deskripsi, tahun: year };
    const updated = [...checklist, newChecklist];
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
  };

  const editChecklist = (id: number, aspek: string, deskripsi: string, year: number) => {
    const updated = checklist.map((c) => (c.id === id ? { ...c, aspek, deskripsi, tahun: year } : c));
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
  };

  const deleteChecklist = (id: number, year: number) => {
    const updated = checklist.filter((c) => c.id !== id);
    setChecklist(updated);
    localStorage.setItem("checklistGCG", JSON.stringify(updated));
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
      ensureAllYearsHaveData
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