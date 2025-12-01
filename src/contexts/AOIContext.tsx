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

      // Get user info for filtering
      let userParams = {};
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userParams = {
            userRole: user.role || '',
            userSubdirektorat: user.subdirektorat || '',
            userDivisi: user.divisi || ''
          };
          console.log('AOIContext: Fetching with user params:', userParams);
        }
      } catch (error) {
        console.error('AOIContext: Error parsing user:', error);
      }

      // Load data from API with user filtering
      const [tables, recommendations] = await Promise.all([
        aoiAPI.getTables(userParams),
        aoiAPI.getTables(userParams).then(tables =>
          Promise.all(tables.map(table =>
            aoiAPI.getRecommendationsByTable(table.id)
          ))
        ).then(allRecommendations => allRecommendations.flat())
      ]);

      setAoiTables(tables);
      setAoiRecommendations(recommendations);
      console.log(`✅ AOI data loaded successfully: ${tables.length} tables, ${recommendations.length} recommendations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AOI data';
      console.error('❌ AOI API Error:', err);
      setError(errorMessage);

      // Set empty state instead of mock data to ensure cross-browser consistency
      setAoiTables([]);
      setAoiRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createAOITable = async (tableData: Omit<AOITable, 'id' | 'createdAt'>): Promise<AOITable> => {
    try {
      setError(null);
      
      const newTable = await aoiAPI.createTable({
        ...tableData,
        createdAt: new Date().toISOString()
      });
      
      setAoiTables(prev => [...prev, newTable]);
      console.log(`✅ AOI table created successfully:`, newTable);
      return newTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create AOI table';
      console.error('❌ Create AOI table error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const updateAOITable = async (id: number, tableData: Partial<AOITable>): Promise<AOITable> => {
    try {
      setError(null);
      
      const updatedTable = await aoiAPI.updateTable(id, tableData);
      
      setAoiTables(prev => prev.map(table => 
        table.id === id ? updatedTable : table
      ));
      console.log(`✅ AOI table updated successfully:`, updatedTable);
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update AOI table';
      console.error('❌ Update AOI table error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAOITable = async (id: number): Promise<void> => {
    try {
      setError(null);
      
      await aoiAPI.deleteTable(id);
      
      // Remove from local state after successful API call
      setAoiTables(prev => prev.filter(table => table.id !== id));
      setAoiRecommendations(prev => prev.filter(rec => rec.aoiTableId !== id));
      console.log(`✅ AOI table deleted successfully: ${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete AOI table';
      console.error('❌ Delete AOI table error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const addRecommendation = async (recommendationData: Omit<AOIRecommendation, 'id' | 'createdAt'>): Promise<AOIRecommendation> => {
    try {
      setError(null);
      
      const newRecommendation = await aoiAPI.createRecommendation({
        ...recommendationData,
        createdAt: new Date().toISOString()
      });
      
      setAoiRecommendations(prev => [...prev, newRecommendation]);
      console.log(`✅ AOI recommendation created successfully:`, newRecommendation);
      return newRecommendation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add recommendation';
      console.error('❌ Create AOI recommendation error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const updateRecommendation = async (id: number, recommendationData: Partial<AOIRecommendation>): Promise<AOIRecommendation> => {
    try {
      setError(null);
      
      const updatedRecommendation = await aoiAPI.updateRecommendation(id, recommendationData);
      
      setAoiRecommendations(prev => prev.map(rec => 
        rec.id === id ? updatedRecommendation : rec
      ));
      console.log(`✅ AOI recommendation updated successfully:`, updatedRecommendation);
      return updatedRecommendation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recommendation';
      console.error('❌ Update AOI recommendation error:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteRecommendation = async (id: number): Promise<void> => {
    try {
      setError(null);
      
      // Find the recommendation to be deleted to get its table ID and number
      const targetRecommendation = aoiRecommendations.find(rec => rec.id === id);
      if (!targetRecommendation) {
        throw new Error('Recommendation not found');
      }
      
      await aoiAPI.deleteRecommendation(id);
      
      // Remove from local state and renumber remaining recommendations
      setAoiRecommendations(prev => {
        // Remove the deleted recommendation
        const filtered = prev.filter(rec => rec.id !== id);
        
        // Renumber all recommendations for the same table that have higher numbers
        const renumbered = filtered.map(rec => {
          if (rec.aoiTableId === targetRecommendation.aoiTableId && rec.no > targetRecommendation.no) {
            return { ...rec, no: rec.no - 1 };
          }
          return rec;
        });
        
        return renumbered;
      });
      
      console.log(`✅ AOI recommendation deleted and renumbered successfully: ${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recommendation';
      console.error('❌ Delete AOI recommendation error:', err);
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
