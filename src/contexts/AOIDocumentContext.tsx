import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AOIDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  aoiRecommendationId: number;
  aoiJenis: 'REKOMENDASI' | 'SARAN'; // Jenis rekomendasi (Rekomendasi atau Saran)
  aoiUrutan: number; // Urutan dalam tabel AOI
  userId: string;
  userDirektorat: string;
  userSubdirektorat: string;
  userDivisi: string;
  fileType: string;
  status: 'active' | 'archived';
  tahun: number;
}

interface AOIDocumentContextType {
  documents: AOIDocument[];
  uploadDocument: (file: File, aoiRecommendationId: number, aoiJenis: 'REKOMENDASI' | 'SARAN', aoiUrutan: number, userId: string, userDirektorat: string, userSubdirektorat: string, userDivisi: string, tahun: number) => Promise<AOIDocument>;
  getDocumentsByRecommendation: (aoiRecommendationId: number) => AOIDocument[];
  getDocumentsByYear: (tahun: number) => AOIDocument[];
  getDocumentsByUser: (userId: string) => AOIDocument[];
  deleteDocument: (documentId: string) => void;
  updateDocument: (documentId: string, updates: Partial<AOIDocument>) => void;
}

const AOIDocumentContext = createContext<AOIDocumentContextType | undefined>(undefined);

export const useAOIDocument = () => {
  const context = useContext(AOIDocumentContext);
  if (!context) {
    throw new Error('useAOIDocument must be used within an AOIDocumentProvider');
  }
  return context;
};

interface AOIDocumentProviderProps {
  children: ReactNode;
}

export const AOIDocumentProvider: React.FC<AOIDocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<AOIDocument[]>([]);

  // Load documents from localStorage on mount
  React.useEffect(() => {
    const savedDocuments = localStorage.getItem('aoiDocuments');
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments);
        // Convert string dates back to Date objects
        const documentsWithDates = parsed.map((doc: any) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate)
        }));
        setDocuments(documentsWithDates);
      } catch (error) {
        console.error('Error loading AOI documents from localStorage:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever documents change
  React.useEffect(() => {
    localStorage.setItem('aoiDocuments', JSON.stringify(documents));
  }, [documents]);

  const uploadDocument = useCallback(async (
    file: File, 
    aoiRecommendationId: number, 
    aoiJenis: 'REKOMENDASI' | 'SARAN',
    aoiUrutan: number,
    userId: string, 
    userDirektorat: string, 
    userSubdirektorat: string, 
    userDivisi: string, 
    tahun: number
  ): Promise<AOIDocument> => {
    const newDocument: AOIDocument = {
      id: `aoi-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      aoiRecommendationId,
      aoiJenis,
      aoiUrutan,
      userId,
      userDirektorat,
      userSubdirektorat,
      userDivisi,
      fileType: file.type,
      status: 'active',
      tahun
    };

    setDocuments(prev => [...prev, newDocument]);
    
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return newDocument;
  }, []);

  const getDocumentsByRecommendation = useCallback((aoiRecommendationId: number): AOIDocument[] => {
    return documents.filter(doc => doc.aoiRecommendationId === aoiRecommendationId);
  }, [documents]);

  const getDocumentsByYear = useCallback((tahun: number): AOIDocument[] => {
    return documents.filter(doc => doc.tahun === tahun);
  }, [documents]);

  const getDocumentsByUser = useCallback((userId: string): AOIDocument[] => {
    return documents.filter(doc => doc.userId === userId);
  }, [documents]);

  const deleteDocument = useCallback((documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  }, []);

  const updateDocument = useCallback((documentId: string, updates: Partial<AOIDocument>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, ...updates } : doc
    ));
  }, []);

  const value: AOIDocumentContextType = {
    documents,
    uploadDocument,
    getDocumentsByRecommendation,
    getDocumentsByYear,
    getDocumentsByUser,
    deleteDocument,
    updateDocument
  };

  return (
    <AOIDocumentContext.Provider value={value}>
      {children}
    </AOIDocumentContext.Provider>
  );
};
