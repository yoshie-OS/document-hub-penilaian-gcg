import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aoiAPI } from '@/services/api';

export interface AOITable {
  id: number;
  nama: string;
  tahun: number;
  targetType: 'direktorat' | 'subdirektorat' | 'divisi';
  targetDirektorat: string;
  targetSubdirektorat: string;
  targetDivisi: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface AOIRecommendation {
  id: number;
  aoiTableId: number;
  jenis: 'REKOMENDASI' | 'SARAN';
  no: number;
  isi: string;
  tingkatUrgensi: 'RENDAH' | 'SEDANG' | 'TINGGI';
  aspekAOI: string;
  pihakTerkait: string;
  organPerusahaan: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface AOITracking {
  id: number;
  aoiRecommendationId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  notes: string;
  updatedAt: string;
}

interface AOIContextType {
  // Tables
  aoiTables: AOITable[];
  createAOITable: (tableData: Omit<AOITable, 'id' | 'createdAt'>) => Promise<AOITable>;
  updateAOITable: (id: number, tableData: Partial<AOITable>) => Promise<AOITable>;
  deleteAOITable: (id: number) => Promise<void>;
  
  // Recommendations
  aoiRecommendations: AOIRecommendation[];
  addRecommendation: (recommendationData: Omit<AOIRecommendation, 'id' | 'createdAt'>) => Promise<AOIRecommendation>;
  updateRecommendation: (id: number, recommendationData: Partial<AOIRecommendation>) => Promise<AOIRecommendation>;
  deleteRecommendation: (id: number) => Promise<void>;
  getRecommendationsByTable: (tableId: number) => AOIRecommendation[];
  
  // Tracking
  aoiTracking: AOITracking[];
  updateTracking: (id: number, trackingData: Partial<AOITracking>) => Promise<AOITracking>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Refresh data
  refreshData: () => Promise<void>;
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
  const [aoiTables, setAoiTables] = useState<AOITable[]>([]);
  const [aoiRecommendations, setAoiRecommendations] = useState<AOIRecommendation[]>([]);
  const [aoiTracking, setAoiTracking] = useState<AOITracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try API first
      try {
        const [tables, recommendations] = await Promise.all([
          aoiAPI.getTables(),
          aoiAPI.getTables().then(tables => 
            Promise.all(tables.map(table => 
              aoiAPI.getRecommendationsByTable(table.id)
            ))
          ).then(allRecommendations => allRecommendations.flat())
        ]);
        
        setAoiTables(tables);
        setAoiRecommendations(recommendations);
      } catch (apiError) {
        console.warn('API failed, using mock data:', apiError);
        
        // Fallback to mock data
        const mockTables: AOITable[] = [
          {
            id: 1,
            nama: "AOI GCG 2024 - DIREKTORAT BISNIS JASA KEUANGAN / SUB DIREKTORAT GOVERNMENT AND CORPORATE BUSINESS / PENYALURAN DANA",
            tahun: 2024,
            targetType: "divisi",
            targetDirektorat: "DIREKTORAT BISNIS JASA KEUANGAN",
            targetSubdirektorat: "SUB DIREKTORAT GOVERNMENT AND CORPORATE BUSINESS",
            targetDivisi: "PENYALURAN DANA",
            createdAt: "2024-01-01T00:00:00.000Z",
            status: "active"
          }
        ];

        const mockRecommendations: AOIRecommendation[] = [
          {
            id: 1,
            aoiTableId: 1,
            jenis: "REKOMENDASI",
            no: 1,
            isi: "Perlu peningkatan dalam implementasi Good Corporate Governance",
            tingkatUrgensi: "TINGGI",
            aspekAOI: "TATA KELOLA",
            pihakTerkait: "DIREKSI",
            organPerusahaan: "RUPS",
            createdAt: "2024-01-01T00:00:00.000Z",
            status: "active"
          },
          {
            id: 2,
            aoiTableId: 1,
            jenis: "SARAN",
            no: 1,
            isi: "Saran untuk peningkatan transparansi",
            tingkatUrgensi: "SEDANG",
            aspekAOI: "TRANSPARANSI",
            pihakTerkait: "DEWAN KOMISARIS",
            organPerusahaan: "DEWAN KOMISARIS",
            createdAt: "2024-01-01T00:00:00.000Z",
            status: "active"
          }
        ];

        setAoiTables(mockTables);
        setAoiRecommendations(mockRecommendations);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AOI data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createAOITable = async (tableData: Omit<AOITable, 'id' | 'createdAt'>): Promise<AOITable> => {
    try {
      setError(null);
      
      // Try API first
      try {
        const newTable = await aoiAPI.createTable({
          ...tableData,
          createdAt: new Date().toISOString()
        });
        
        setAoiTables(prev => [...prev, newTable]);
        return newTable;
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
        
        // Fallback to local state
        const newTable: AOITable = {
          ...tableData,
          id: Date.now(),
          createdAt: new Date().toISOString()
        };
        
        setAoiTables(prev => [...prev, newTable]);
        return newTable;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create AOI table';
      setError(errorMessage);
      throw err;
    }
  };

  const updateAOITable = async (id: number, tableData: Partial<AOITable>): Promise<AOITable> => {
    try {
      setError(null);
      
      // Try API first
      try {
        const updatedTable = await aoiAPI.updateTable(id, tableData);
        
        setAoiTables(prev => prev.map(table => 
          table.id === id ? updatedTable : table
        ));
        return updatedTable;
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
        
        // Fallback to local state
        setAoiTables(prev => prev.map(table => 
          table.id === id ? { ...table, ...tableData } : table
        ));
        
        const updatedTable = aoiTables.find(table => table.id === id);
        if (!updatedTable) throw new Error('Table not found');
        
        return { ...updatedTable, ...tableData };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update AOI table';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAOITable = async (id: number): Promise<void> => {
    try {
      setError(null);
      
      // Try API first
      try {
        await aoiAPI.deleteTable(id);
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
      }
      
      // Remove from local state
      setAoiTables(prev => prev.filter(table => table.id !== id));
      setAoiRecommendations(prev => prev.filter(rec => rec.aoiTableId !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete AOI table';
      setError(errorMessage);
      throw err;
    }
  };

  const addRecommendation = async (recommendationData: Omit<AOIRecommendation, 'id' | 'createdAt'>): Promise<AOIRecommendation> => {
    try {
      setError(null);
      
      // Try API first
      try {
        const newRecommendation = await aoiAPI.createRecommendation({
          ...recommendationData,
          createdAt: new Date().toISOString()
        });
        
        setAoiRecommendations(prev => [...prev, newRecommendation]);
        return newRecommendation;
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
        
        // Fallback to local state
        const newRecommendation: AOIRecommendation = {
          ...recommendationData,
          id: Date.now(),
          createdAt: new Date().toISOString()
        };
        
        setAoiRecommendations(prev => [...prev, newRecommendation]);
        return newRecommendation;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add recommendation';
      setError(errorMessage);
      throw err;
    }
  };

  const updateRecommendation = async (id: number, recommendationData: Partial<AOIRecommendation>): Promise<AOIRecommendation> => {
    try {
      setError(null);
      
      // Try API first
      try {
        const updatedRecommendation = await aoiAPI.updateRecommendation(id, recommendationData);
        
        setAoiRecommendations(prev => prev.map(rec => 
          rec.id === id ? updatedRecommendation : rec
        ));
        return updatedRecommendation;
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
        
        // Fallback to local state
        setAoiRecommendations(prev => prev.map(rec => 
          rec.id === id ? { ...rec, ...recommendationData } : rec
        ));
        
        const updatedRecommendation = aoiRecommendations.find(rec => rec.id === id);
        if (!updatedRecommendation) throw new Error('Recommendation not found');
        
        return { ...updatedRecommendation, ...recommendationData };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recommendation';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteRecommendation = async (id: number): Promise<void> => {
    try {
      setError(null);
      
      // Try API first
      try {
        await aoiAPI.deleteRecommendation(id);
      } catch (apiError) {
        console.warn('API failed, using local state:', apiError);
      }
      
      // Remove from local state
      setAoiRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recommendation';
      setError(errorMessage);
      throw err;
    }
  };

  const getRecommendationsByTable = (tableId: number): AOIRecommendation[] => {
    return aoiRecommendations.filter(rec => rec.aoiTableId === tableId);
  };

  const updateTracking = async (id: number, trackingData: Partial<AOITracking>): Promise<AOITracking> => {
    try {
      setError(null);
      
      setAoiTracking(prev => prev.map(tracking => 
        tracking.id === id ? { ...tracking, ...trackingData, updatedAt: new Date().toISOString() } : tracking
      ));
      
      const updatedTracking = aoiTracking.find(tracking => tracking.id === id);
      if (!updatedTracking) throw new Error('Tracking not found');
      
      return { ...updatedTracking, ...trackingData, updatedAt: new Date().toISOString() };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tracking';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const value: AOIContextType = {
    aoiTables: aoiTables || [],
    createAOITable,
    updateAOITable,
    deleteAOITable,
    aoiRecommendations: aoiRecommendations || [],
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    getRecommendationsByTable,
    aoiTracking: aoiTracking || [],
    updateTracking,
    isLoading,
    error,
    refreshData
  };

  return (
    <AOIContext.Provider value={value}>
      {children}
    </AOIContext.Provider>
  );
};
