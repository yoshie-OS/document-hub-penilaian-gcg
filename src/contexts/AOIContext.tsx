import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AOITable, AOIRecommendation, AOITracking } from '@/types/admin';

interface AOIContextType {
  // AOI Tables
  aoiTables: AOITable[];
  activeAOITable: AOITable | null;
  
  // AOI Recommendations
  recommendations: AOIRecommendation[];
  
  // AOI Tracking
  tracking: AOITracking[];
  
  // CRUD Operations for Tables
  createAOITable: (table: Omit<AOITable, 'id' | 'createdAt' | 'createdBy' | 'recommendations' | 'tracking'>) => void;
  updateAOITable: (id: number, updates: Partial<AOITable>) => void;
  deleteAOITable: (id: number) => void;
  setActiveAOITable: (table: AOITable | null) => void;
  
  // CRUD Operations for Recommendations
  addRecommendation: (recommendation: Omit<AOIRecommendation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateRecommendation: (id: number, updates: Partial<AOIRecommendation>) => void;
  deleteRecommendation: (id: number) => void;
  
  // CRUD Operations for Tracking
  updateTracking: (aoiId: number, updates: Partial<AOITracking>) => void;
  getTrackingByAOI: (aoiId: number) => AOITracking | undefined;
  
  // Utility Functions
  getAOITablesByYear: (year: number) => AOITable[];
  getRecommendationsByYear: (year: number) => AOIRecommendation[];
  getRecommendationsByTable: (tableId: number) => AOIRecommendation[];
  
  // Loading State
  isLoading: boolean;
}

const AOIContext = createContext<AOIContextType | undefined>(undefined);

export const useAOI = () => {
  const context = useContext(AOIContext);
  if (context === undefined) {
    throw new Error('useAOI must be used within an AOIProvider');
  }
  return context;
};

interface AOIProviderProps {
  children: ReactNode;
}

export const AOIProvider: React.FC<AOIProviderProps> = ({ children }) => {
  const [aoiTables, setAOITables] = useState<AOITable[]>([]);
  const [activeAOITable, setActiveAOITable] = useState<AOITable | null>(null);
  const [recommendations, setRecommendations] = useState<AOIRecommendation[]>([]);
  const [tracking, setTracking] = useState<AOITracking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTables = localStorage.getItem('aoiTables');
      const savedRecommendations = localStorage.getItem('aoiRecommendations');
      const savedTracking = localStorage.getItem('aoiTracking');
      
      if (savedTables) {
        const parsedTables = JSON.parse(savedTables).map((table: any) => ({
          ...table,
          createdAt: new Date(table.createdAt),
          recommendations: table.recommendations || []
        }));
        setAOITables(parsedTables);
      }
      
      if (savedRecommendations) {
        const parsedRecommendations = JSON.parse(savedRecommendations).map((rec: any) => ({
          ...rec,
          createdAt: new Date(rec.createdAt),
          updatedAt: new Date(rec.updatedAt)
        }));
        setRecommendations(parsedRecommendations);
      }
      
      if (savedTracking) {
        const parsedTracking = JSON.parse(savedTracking).map((track: any) => ({
          ...track,
          lastUpdated: new Date(track.lastUpdated)
        }));
        setTracking(parsedTracking);
      }
    } catch (error) {
      console.error('Error loading AOI data:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aoiTables', JSON.stringify(aoiTables));
  }, [aoiTables]);

  useEffect(() => {
    localStorage.setItem('aoiRecommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem('aoiTracking', JSON.stringify(tracking));
  }, [tracking]);

  // CRUD Operations for Tables
  const createAOITable = (table: Omit<AOITable, 'id' | 'createdAt' | 'createdBy' | 'recommendations' | 'tracking'>) => {
    const newTable: AOITable = {
      ...table,
      id: Date.now(),
      createdAt: new Date(),
      createdBy: 'Super Admin', // TODO: Get from user context
      recommendations: [],
      tracking: []
    };
    
    setAOITables(prev => [...prev, newTable]);
    
    // No initial recommendations/tracking upon table creation
  };

  const updateAOITable = (id: number, updates: Partial<AOITable>) => {
    setAOITables(prev => prev.map(table => 
      table.id === id ? { ...table, ...updates, updatedAt: new Date() } : table
    ));
  };

  const deleteAOITable = (id: number) => {
    setAOITables(prev => prev.filter(table => table.id !== id));
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    setTracking(prev => prev.filter(track => track.aoiId !== id));
  };

  // CRUD Operations for Recommendations
  const addRecommendation = (recommendation: Omit<AOIRecommendation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    // Auto generate next number within the same table
    const tableRecs = recommendations.filter(r => r.aoiTableId === recommendation.aoiTableId);
    const nextRecommendationNo = tableRecs.length + 1;

    const newRecommendation: AOIRecommendation = {
      ...recommendation,
      no: nextRecommendationNo,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Super Admin'
    };

    setRecommendations(prev => [...prev, newRecommendation]);

    // Initial tracking per recommendation
    const newTracking: AOITracking = {
      id: Date.now() + Math.random(),
      aoiId: newRecommendation.id,
      rups: false,
      dewanKomisaris: false,
      sekdekom: false,
      komite: false,
      direksi: false,
      sekretarisPerusahaan: false,
      lastUpdated: new Date(),
      updatedBy: 'Super Admin'
    };

    setTracking(prev => [...prev, newTracking]);
  };

  const updateRecommendation = (id: number, updates: Partial<AOIRecommendation>) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, ...updates, updatedAt: new Date() } : rec
    ));
  };

  const deleteRecommendation = (id: number) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    setTracking(prev => prev.filter(track => track.aoiId !== id));
  };

  // CRUD Operations for Tracking
  const updateTracking = (aoiId: number, updates: Partial<AOITracking>) => {
    setTracking(prev => prev.map(track => 
      track.aoiId === aoiId ? { ...track, ...updates, lastUpdated: new Date() } : track
    ));
  };

  const getTrackingByAOI = (aoiId: number) => {
    return tracking.find(track => track.aoiId === aoiId);
  };

  // Utility Functions
  const getAOITablesByYear = (year: number) => {
    return aoiTables.filter(table => table.tahun === year);
  };

  const getRecommendationsByYear = (year: number) => {
    return recommendations.filter(rec => rec.tahun === year);
  };

  const getRecommendationsByTable = (tableId: number) => {
    return recommendations.filter(rec => rec.aoiTableId === tableId);
  };

  const value: AOIContextType = {
    aoiTables,
    activeAOITable,
    recommendations,
    tracking,
    createAOITable,
    updateAOITable,
    deleteAOITable,
    setActiveAOITable,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    updateTracking,
    getTrackingByAOI,
    getAOITablesByYear,
    getRecommendationsByYear,
    getRecommendationsByTable,
    isLoading
  };

  return (
    <AOIContext.Provider value={value}>
      {children}
    </AOIContext.Provider>
  );
};
