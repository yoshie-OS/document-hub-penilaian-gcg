import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface YearContextType {
  selectedYear: number | null;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  addYear: (year: number) => void;
  removeYear: (year: number) => void;
  getAvailableYears: () => number[];
  cleanupYearData: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const useYear = () => {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
};

interface YearProviderProps {
  children: React.ReactNode;
}

export const YearProvider: React.FC<YearProviderProps> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Initialize available years from localStorage - FRESH START
  useEffect(() => {
    const storedYears = localStorage.getItem('availableYears');
    if (storedYears) {
      try {
        const parsedYears = JSON.parse(storedYears);
        if (Array.isArray(parsedYears)) {
          setAvailableYears(parsedYears);
          console.log('YearContext: Loaded years from localStorage', parsedYears);
        }
      } catch (error) {
        console.error('YearContext: Error parsing years from localStorage', error);
        localStorage.removeItem('availableYears');
        setAvailableYears([]);
      }
    } else {
      // Start completely fresh - no default years
      setAvailableYears([]);
      console.log('YearContext: Started fresh - no default years');
    }

    // Tidak set selected year otomatis - biarkan user pilih manual
    // setSelectedYear hanya akan di-set saat user benar-benar memilih tahun
  }, []);

  // Save available years to localStorage whenever it changes
  useEffect(() => {
    if (availableYears.length > 0) {
      localStorage.setItem('availableYears', JSON.stringify(availableYears));
    }
  }, [availableYears]);

  const addYear = (year: number) => {
    if (!availableYears.includes(year)) {
      // Ensure no leftover data exists for this year before adding
      cleanupYearData(year);
      
      const updatedYears = [...availableYears, year].sort((a, b) => b - a); // Sort descending
      setAvailableYears(updatedYears);
      
      console.log(`YearContext: Added year ${year} with clean slate`);
    }
  };

  const removeYear = (year: number) => {
    // Clean up all data related to the year before removing it
    cleanupYearData(year);
    
    const updatedYears = availableYears.filter(y => y !== year);
    setAvailableYears(updatedYears);
    
    // If the removed year was selected, select the most recent year
    if (selectedYear === year && updatedYears.length > 0) {
      setSelectedYear(updatedYears[0]);
    } else if (updatedYears.length === 0) {
      setSelectedYear(null);
    }
    
    // Force refresh all contexts to ensure data is properly cleaned
    window.dispatchEvent(new CustomEvent('yearRemoved', { 
      detail: { year, type: 'yearRemoved' } 
    }));
  };

  // Comprehensive cleanup function to remove all data related to a specific year
  const cleanupYearData = (year: number) => {
    try {
      console.log(`YearContext: Cleaning up all data for year ${year}`);
      
      // Clean up checklist data
      const checklistData = localStorage.getItem('checklistGCG');
      if (checklistData) {
        const parsed = JSON.parse(checklistData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('checklistGCG', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up checklist data for year ${year}`);
      }

      // Clean up aspects data
      const aspectsData = localStorage.getItem('aspects');
      if (aspectsData) {
        const parsed = JSON.parse(aspectsData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('aspects', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up aspects data for year ${year}`);
      }

      // Clean up document metadata
      const documentData = localStorage.getItem('documentMetadata');
      if (documentData) {
        const parsed = JSON.parse(documentData);
        const filtered = parsed.filter((item: any) => item.year !== year);
        localStorage.setItem('documentMetadata', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up document metadata for year ${year}`);
      }

      // Clean up uploaded files
      const filesData = localStorage.getItem('uploadedFiles');
      if (filesData) {
        const parsed = JSON.parse(filesData);
        const filtered = parsed.filter((item: any) => item.year !== year);
        localStorage.setItem('uploadedFiles', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up uploaded files for year ${year}`);
      }

      // Clean up checklist assignments
      const assignmentsData = localStorage.getItem('checklistAssignments');
      if (assignmentsData) {
        const parsed = JSON.parse(assignmentsData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('checklistAssignments', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up checklist assignments for year ${year}`);
      }

      // Clean up struktur perusahaan data
      const direktoratData = localStorage.getItem('direktorat');
      if (direktoratData) {
        const parsed = JSON.parse(direktoratData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('direktorat', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up direktorat data for year ${year}`);
      }

      const subdirektoratData = localStorage.getItem('subdirektorat');
      if (subdirektoratData) {
        const parsed = JSON.parse(subdirektoratData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('subdirektorat', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up subdirektorat data for year ${year}`);
      }

      const divisiData = localStorage.getItem('divisi');
      if (divisiData) {
        const parsed = JSON.parse(divisiData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('divisi', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up divisi data for year ${year}`);
      }

      // Clean up user data (remove users that were created for this year)
      const usersData = localStorage.getItem('users');
      if (usersData) {
        const parsed = JSON.parse(usersData);
        const filtered = parsed.filter((user: any) => user.createdYear !== year && user.tahun !== year);
        localStorage.setItem('users', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up user data for year ${year}`);
      }

      // Clean up anak perusahaan data
      const anakPerusahaanData = localStorage.getItem('anakPerusahaan');
      if (anakPerusahaanData) {
        const parsed = JSON.parse(anakPerusahaanData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        localStorage.setItem('anakPerusahaan', JSON.stringify(filtered));
        console.log(`YearContext: Cleaned up anak perusahaan data for year ${year}`);
      }

      // Dispatch custom event to notify other components about the cleanup
      window.dispatchEvent(new CustomEvent('yearDataCleaned', { 
        detail: { year, type: 'yearRemoved' } 
      }));

      console.log(`YearContext: Successfully cleaned up all data for year ${year}`);
    } catch (error) {
      console.error(`YearContext: Error cleaning up data for year ${year}:`, error);
    }
  };

  const getAvailableYears = () => {
    return availableYears;
  };

  const value = {
    selectedYear,
    setSelectedYear,
    availableYears,
    addYear,
    removeYear,
    getAvailableYears,
    cleanupYearData,
  };

  return (
    <YearContext.Provider value={value}>
      {children}
    </YearContext.Provider>
  );
}; 