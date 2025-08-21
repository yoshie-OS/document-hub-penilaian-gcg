import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface YearContextType {
  selectedYear: number | null;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  addYear: (year: number) => void;
  removeYear: (year: number) => void;
  getAvailableYears: () => number[];
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
      const updatedYears = [...availableYears, year].sort((a, b) => b - a); // Sort descending
      setAvailableYears(updatedYears);
    }
  };

  const removeYear = (year: number) => {
    const updatedYears = availableYears.filter(y => y !== year);
    setAvailableYears(updatedYears);
    
    // If the removed year was selected, select the most recent year
    if (selectedYear === year && updatedYears.length > 0) {
      setSelectedYear(updatedYears[0]);
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
  };

  return (
    <YearContext.Provider value={value}>
      {children}
    </YearContext.Provider>
  );
}; 