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

  // Load available years from backend API on startup
  useEffect(() => {
    const loadYearsFromAPI = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/config/tahun-buku');
        if (response.ok) {
          const data = await response.json();
          // API returns array directly: [{year: 2025, is_active: 1, created_at: ...}, ...]
          if (Array.isArray(data)) {
            const years = data
              .filter((item: any) => item.is_active)
              .map((item: any) => item.year)
              .sort((a: number, b: number) => b - a);
            setAvailableYears(years);
            console.log('YearContext: Loaded years from API', years);
          }
        } else {
          console.error('YearContext: Failed to load years from API');
          setAvailableYears([]);
        }
      } catch (error) {
        console.error('YearContext: Error loading years from API', error);
        setAvailableYears([]);
      }
    };

    loadYearsFromAPI();
  }, []);

  // localStorage sync removed - data only comes from API

  // Auto-select the most recent year when years are loaded and no year is selected
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      // TEMPORARY FIX: Force select 2024 since that's where the actual data exists
      // TODO: Implement proper logic to find year with actual checklist data
      const yearWithData = availableYears.includes(2024) ? 2024 : availableYears[0];
      setSelectedYear(yearWithData);
      console.log('YearContext: Auto-selected year with data:', yearWithData);
    }
  }, [availableYears, selectedYear]);

  const addYear = async (year: number) => {
    if (!availableYears.includes(year)) {
      // Ensure no leftover data exists for this year before adding
      cleanupYearData(year);
      
      // Call backend API to save to backend
      try {
        const response = await fetch('http://localhost:5000/api/config/tahun-buku', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tahun: year,
            nama: `Tahun Buku ${year}`,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`YearContext: Successfully saved year ${year} to backend`);
      } catch (error) {
        console.error(`YearContext: Failed to save year ${year} to backend:`, error);
        // Continue with local update even if API fails
      }
      
      const updatedYears = [...availableYears, year].sort((a, b) => b - a); // Sort descending
      setAvailableYears(updatedYears);
      
      console.log(`YearContext: Added year ${year} with clean slate`);
    }
  };

  const removeYear = async (year: number) => {
    try {
      // Find the year ID from availableYears state - we need to get this from backend
      const response = await fetch('http://localhost:5000/api/config/tahun-buku');
      if (!response.ok) {
        throw new Error('Failed to fetch tahun buku data');
      }
      
      const data = await response.json();
      const yearToDelete = data.tahun_buku.find((item: any) => item.tahun === year);
      
      if (!yearToDelete) {
        console.error(`YearContext: Year ${year} not found in tahun buku data`);
        return;
      }
      
      // Call backend DELETE API
      const deleteResponse = await fetch(`http://localhost:5000/api/config/tahun-buku/${yearToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete year ${year} from backend`);
      }
      
      const deleteResult = await deleteResponse.json();
      console.log(`YearContext: Successfully deleted year ${year} from backend:`, deleteResult);

      // Log cleanup stats if available
      if (deleteResult.cleanup_stats) {
        console.log(`YearContext: Backend cleanup stats:`, deleteResult.cleanup_stats);
        const stats = deleteResult.cleanup_stats;
        const totalCleaned = Object.values(stats).reduce((sum: number, val: any) => {
          return typeof val === 'number' ? sum + val : sum;
        }, 0);
        console.log(`YearContext: Total ${totalCleaned} records cleaned from backend`);
      }

      // Clean up all frontend data related to the year
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
      
    } catch (error) {
      console.error(`YearContext: Failed to remove year ${year}:`, error);
      // Still try to clean up frontend data even if backend fails
      cleanupYearData(year);
      
      const updatedYears = availableYears.filter(y => y !== year);
      setAvailableYears(updatedYears);
      
      if (selectedYear === year && updatedYears.length > 0) {
        setSelectedYear(updatedYears[0]);
      } else if (updatedYears.length === 0) {
        setSelectedYear(null);
      }
    }
  };

  // Frontend cleanup function - backend handles database cleanup
  const cleanupYearData = (year: number) => {
    try {
      console.log(`YearContext: Notifying components about year ${year} removal`);

      // Dispatch custom event to notify other components about the cleanup
      // Backend has already cleaned up the database, this is just for frontend state refresh
      window.dispatchEvent(new CustomEvent('yearDataCleaned', {
        detail: { year, type: 'yearRemoved' }
      }));

      console.log(`YearContext: Dispatched yearDataCleaned event for year ${year}`);
    } catch (error) {
      console.error(`YearContext: Error dispatching cleanup event for year ${year}:`, error);
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