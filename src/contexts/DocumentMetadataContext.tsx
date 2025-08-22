import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DocumentMetadata {
  id: string;
  
  // Basic Information
  title: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  
  // GCG Classification
  gcgPrinciple: string;
  documentType: string;
  documentCategory: string;
  
  // Organizational Information
  direktorat: string;
  subdirektorat: string;
  division: string;
  
  // File Information
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  
  // Additional Metadata
  status: string;
  confidentiality: string;
  
  // Year and Upload Information
  year: number;
  uploadedBy: string;
  uploadDate: string;
  
  // Checklist Information
  checklistId?: number;
  checklistDescription?: string;
  aspect?: string;
}

interface DocumentMetadataContextType {
  documents: DocumentMetadata[];
  addDocument: (metadata: Omit<DocumentMetadata, 'id' | 'uploadDate'>) => void;
  updateDocument: (id: string, metadata: Partial<DocumentMetadata>) => void;
  deleteDocument: (id: string) => void;
  getDocumentsByYear: (year: number) => DocumentMetadata[];
  getDocumentsByAspect: (aspect: string) => DocumentMetadata[];
  getDocumentsByDirektorat: (direktorat: string) => DocumentMetadata[];
  getDocumentsByPrinciple: (principle: string) => DocumentMetadata[];
  getDocumentById: (id: string) => DocumentMetadata | undefined;
  getYearStats: (year: number) => {
    totalDocuments: number;
    totalSize: number;
    byPrinciple: { [key: string]: number };
    byType: { [key: string]: number };
    byDirektorat: { [key: string]: number };
  };
  refreshDocuments: () => void;
}

const DocumentMetadataContext = createContext<DocumentMetadataContextType | undefined>(undefined);

export const DocumentMetadataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedDocuments = localStorage.getItem('documentMetadata');
    if (savedDocuments) {
      try {
        const parsedDocuments = JSON.parse(savedDocuments);
        setDocuments(parsedDocuments);
      } catch (error) {
        console.error('Error parsing document metadata:', error);
        setDocuments([]);
      }
    } else {
      // Initialize with empty data - FRESH START
      setDocuments([]);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('documentMetadata', JSON.stringify(documents));
  }, [documents]);

  // Listen for year data cleanup events
  useEffect(() => {
    const handleYearDataCleaned = (event: CustomEvent) => {
      if (event.detail?.type === 'yearRemoved') {
        const removedYear = event.detail.year;
        console.log(`DocumentMetadataContext: Year ${removedYear} data cleaned up, refreshing documents`);
        refreshDocuments();
      }
    };

    window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    
    return () => {
      window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    };
  }, []);

  const addDocument = (metadata: Omit<DocumentMetadata, 'id' | 'uploadDate'>) => {
    const newDocument: DocumentMetadata = {
      ...metadata,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const updateDocument = (id: string, metadata: Partial<DocumentMetadata>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...metadata } : doc
    ));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getDocumentsByYear = (year: number) => {
    return documents.filter(doc => doc.year === year);
  };

  const getDocumentsByAspect = (aspect: string) => {
    return documents.filter(doc => doc.aspect === aspect);
  };

  const getDocumentsByDirektorat = (direktorat: string) => {
    return documents.filter(doc => doc.direktorat === direktorat);
  };

  const getDocumentsByPrinciple = (principle: string) => {
    return documents.filter(doc => doc.gcgPrinciple === principle);
  };

  const getDocumentById = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const getYearStats = (year: number) => {
    const yearDocuments = getDocumentsByYear(year);
    const totalSize = yearDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);
    
    const byPrinciple: { [key: string]: number } = {};
    const byType: { [key: string]: number } = {};
    const byDirektorat: { [key: string]: number } = {};

    yearDocuments.forEach(doc => {
      byPrinciple[doc.gcgPrinciple] = (byPrinciple[doc.gcgPrinciple] || 0) + 1;
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
      byDirektorat[doc.direktorat] = (byDirektorat[doc.direktorat] || 0) + 1;
    });

    return {
      totalDocuments: yearDocuments.length,
      totalSize,
      byPrinciple,
      byType,
      byDirektorat
    };
  };

  const refreshDocuments = () => {
    const savedDocuments = localStorage.getItem('documentMetadata');
    if (savedDocuments) {
      try {
        const parsedDocuments = JSON.parse(savedDocuments);
        setDocuments(parsedDocuments);
      } catch (error) {
        console.error('Error parsing document metadata:', error);
        setDocuments([]);
      }
    }
  };

  return (
    <DocumentMetadataContext.Provider value={{
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      getDocumentsByYear,
      getDocumentsByAspect,
      getDocumentsByDirektorat,
      getDocumentsByPrinciple,
      getDocumentById,
      getYearStats,
      refreshDocuments
    }}>
      {children}
    </DocumentMetadataContext.Provider>
  );
};

export const useDocumentMetadata = () => {
  const context = useContext(DocumentMetadataContext);
  if (context === undefined) {
    throw new Error('useDocumentMetadata must be used within a DocumentMetadataProvider');
  }
  return context;
}; 