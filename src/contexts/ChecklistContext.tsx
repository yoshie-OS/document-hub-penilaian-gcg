import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { seedChecklistGCG } from "@/lib/seed/seedChecklistGCG";

const API_BASE_URL = 'http://localhost:5000/api';

export interface ChecklistGCG {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
}

interface ChecklistContextType {
  checklist: ChecklistGCG[];
  getChecklistByYear: (year: number) => ChecklistGCG[];
  addChecklist: (aspek: string, deskripsi: string, year: number) => void;
  editChecklist: (id: number, aspek: string, deskripsi: string, year: number) => void;
  deleteChecklist: (id: number, year: number) => void;
  addAspek: (aspek: string, year: number) => void;
  editAspek: (oldAspek: string, newAspek: string, year: number) => void;
  deleteAspek: (aspek: string, year: number) => void;
  initializeYearData: (year: number) => void;
  ensureAllYearsHaveData: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
  const isMigratingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Fetch from API
  const fetchChecklist = useCallback(async () => {
    if (hasFetchedRef.current) return; // Prevent multiple fetches

    try {
      const response = await fetch(`${API_BASE_URL}/checklist`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data);
        hasFetchedRef.current = true;
        console.log(`✅ Loaded ${data.length} items from database`);
      } else {
        console.error('Failed to fetch checklist, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  }, []);

  // Auto-migrate localStorage to SQLite on first load
  const migrateFromLocalStorage = useCallback(async () => {
    if (isMigratingRef.current) return; // Prevent duplicate migration

    const alreadyMigrated = localStorage.getItem('checklistMigrated');
    if (alreadyMigrated === 'true') {
      console.log('✅ Already migrated, loading from database...');
      await fetchChecklist();
      return;
    }

    const localData = localStorage.getItem("checklistGCG");
    if (!localData) {
      console.log('📦 No localStorage data to migrate, using database seed');
      await fetchChecklist();
      localStorage.setItem('checklistMigrated', 'true');
      return;
    }

    isMigratingRef.current = true;

    try {
      const items = JSON.parse(localData);
      console.log(`🔄 Migrating ${items.length} checklist items to SQLite...`);

      for (const item of items) {
        await fetch(`${API_BASE_URL}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aspek: item.aspek,
            deskripsi: item.deskripsi,
            tahun: item.tahun || 2024
          })
        });
      }

      console.log('✅ Migration complete! Backing up localStorage...');
      localStorage.setItem('checklistGCG_backup', localData);
      localStorage.setItem('checklistMigrated', 'true');

      await fetchChecklist();
    } catch (error) {
      console.error('❌ Migration error:', error);
      isMigratingRef.current = false;
    }
  }, [fetchChecklist]);

  // Function to ensure all years have checklist data
  const ensureAllYearsHaveData = useCallback(async () => {
    await fetchChecklist();
  }, [fetchChecklist]);

  useEffect(() => {
    // Skip migration for now - just load from database
    console.log('📦 Loading checklist from SQLite database...');
    fetchChecklist();
  }, []); // Empty deps - only run once on mount

  const getChecklistByYear = (year: number): ChecklistGCG[] => {
    return checklist.filter(item => item.tahun === year);
  };

  const refetch = async () => {
    hasFetchedRef.current = false;
    await fetchChecklist();
  };

  const initializeYearData = async (year: number) => {
    const existingData = checklist.filter(item => item.tahun === year);
    if (existingData.length === 0) {
      const defaultData = seedChecklistGCG.map(item => ({ ...item, tahun: year }));
      for (const item of defaultData) {
        await fetch(`${API_BASE_URL}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aspek: item.aspek, deskripsi: item.deskripsi, tahun: year })
        });
      }
      await refetch();
    }
  };

  const addChecklist = async (aspek: string, deskripsi: string, year: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aspek, deskripsi, tahun: year })
      });
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('Error adding checklist:', error);
    }
  };

  const editChecklist = async (id: number, aspek: string, deskripsi: string, year: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/checklist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aspek, deskripsi, tahun: year })
      });
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('Error editing checklist:', error);
    }
  };

  const deleteChecklist = async (id: number, year: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/checklist/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const addAspek = async (aspek: string, year: number) => {
    await addChecklist(aspek, `Item dokumen GCG untuk ${aspek}`, year);
  };

  const editAspek = async (oldAspek: string, newAspek: string, year: number) => {
    const itemsToUpdate = checklist.filter(c => c.aspek === oldAspek && c.tahun === year);
    for (const item of itemsToUpdate) {
      await editChecklist(item.id, newAspek, item.deskripsi, year);
    }
  };

  const deleteAspek = async (aspek: string, year: number) => {
    const itemsToDelete = checklist.filter(c => c.aspek === aspek && c.tahun === year);
    for (const item of itemsToDelete) {
      await deleteChecklist(item.id, year);
    }
  };

  return (
    <ChecklistContext.Provider value={{ 
      checklist, 
      getChecklistByYear,
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