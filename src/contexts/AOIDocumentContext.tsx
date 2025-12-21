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
  deleteDocument: (aoiRecommendationId: number) => void;
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

  // Load documents from backend API on mount
  React.useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/aoiDocuments');
        if (response.ok) {
          const backendDocuments = await response.json();
          
          // Convert backend format to AOIDocument format
          const convertedDocuments: AOIDocument[] = backendDocuments.map((doc: any) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileSize: parseInt(doc.fileSize) || 0,
            uploadDate: new Date(doc.uploadDate),
            aoiRecommendationId: parseInt(doc.aoiRecommendationId) || 0,
            aoiJenis: doc.aoiJenis || 'REKOMENDASI',
            aoiUrutan: parseInt(doc.aoiUrutan) || 1,
            userId: doc.userId || '',
            userDirektorat: doc.userDirektorat || '',
            userSubdirektorat: doc.userSubdirektorat || '',
            userDivisi: doc.userDivisi || '',
            fileType: doc.fileType || 'application/octet-stream',
            status: doc.status || 'active',
            tahun: parseInt(doc.tahun) || new Date().getFullYear()
          }));
          
          setDocuments(convertedDocuments);
          console.log(`✅ Loaded ${convertedDocuments.length} AOI documents from backend`);
        } else {
          console.warn('Failed to load AOI documents from backend, using empty state');
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error loading AOI documents from backend:', error);
        setDocuments([]);
      }
    };

    loadDocuments();
  }, []);

  // localStorage sync removed - data only comes from API

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
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('aoiRecommendationId', aoiRecommendationId.toString());
      formData.append('aoiJenis', aoiJenis);
      formData.append('aoiUrutan', aoiUrutan.toString());
      formData.append('year', tahun.toString());
      formData.append('userDirektorat', userDirektorat);
      formData.append('userSubdirektorat', userSubdirektorat);
      formData.append('userDivisi', userDivisi);
      formData.append('userId', userId);

      // Upload to backend API
      const response = await fetch('http://localhost:5001/api/upload-aoi-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      
      // Convert backend response to AOIDocument format
      const newDocument: AOIDocument = {
        id: result.document.id,
        fileName: result.document.fileName,
        fileSize: result.document.fileSize,
        uploadDate: new Date(result.document.uploadDate),
        aoiRecommendationId: result.document.aoiRecommendationId,
        aoiJenis: result.document.aoiJenis as 'REKOMENDASI' | 'SARAN',
        aoiUrutan: result.document.aoiUrutan,
        userId: result.document.userId,
        userDirektorat: result.document.userDirektorat,
        userSubdirektorat: result.document.userSubdirektorat,
        userDivisi: result.document.userDivisi,
        fileType: result.document.fileType,
        status: result.document.status as 'active' | 'archived',
        tahun: result.document.tahun
      };

      // Update local state
      setDocuments(prev => {
        // Remove existing document for the same recommendation
        const filteredDocs = prev.filter(doc => doc.aoiRecommendationId !== aoiRecommendationId);
        // Add new document
        return [...filteredDocs, newDocument];
      });
      
      console.log('✅ AOI document uploaded successfully to backend:', result.filePath);
      return newDocument;
      
    } catch (error) {
      console.error('❌ AOI document upload failed:', error);
      throw error;
    }
  }, []);

  const getDocumentsByRecommendation = useCallback((aoiRecommendationId: number): AOIDocument[] => {
    return documents.filter(doc => doc.aoiRecommendationId === aoiRecommendationId);
  }, [documents]);

  const getDocumentsByYear = useCallback((year: number): AOIDocument[] => {
    return documents.filter(doc => doc.tahun === year);
  }, [documents]);

  const getDocumentsByUser = useCallback((userId: string): AOIDocument[] => {
    return documents.filter(doc => doc.userId === userId);
  }, [documents]);

  const updateDocument = useCallback((documentId: string, updates: Partial<AOIDocument>): void => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, ...updates } : doc
    ));
    console.log('AOIDocumentContext: Document updated', documentId);
  }, []);

  const deleteDocument = useCallback((aoiRecommendationId: number): void => {
    setDocuments(prev => prev.filter(doc => doc.aoiRecommendationId !== aoiRecommendationId));
    console.log('AOIDocumentContext: Document deleted for recommendation', aoiRecommendationId);
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
