import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  year: number;
  checklistId?: number;
  checklistDescription?: string;
  aspect?: string;
  status: 'uploaded' | 'pending';
  subdirektorat?: string;
  catatan?: string; // Catatan optional dari user saat upload
}

interface FileUploadContextType {
  uploadedFiles: UploadedFile[];
  uploadFile: (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => void;
  reUploadFile: (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => void;
  deleteFile: (fileId: string) => void;
  deleteFileByFileName: (fileName: string) => void;
  refreshFiles: () => void;
  getFilesByYear: (year: number) => UploadedFile[];
  getYearStats: (year: number) => {
    totalFiles: number;
    totalSize: number;
    uploadedCount: number;
    pendingCount: number;
  };
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined);

export const FileUploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      }));
      setUploadedFiles(parsedFiles);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  // Listen for year data cleanup events
  useEffect(() => {
    const handleYearDataCleaned = (event: CustomEvent) => {
      if (event.detail?.type === 'yearRemoved') {
        const removedYear = event.detail.year;
        console.log(`FileUploadContext: Year ${removedYear} data cleaned up, refreshing files`);
        refreshFiles();
      }
    };

    window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    
    return () => {
      window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    };
  }, []);

  const uploadFile = (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => {
    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      year: year,
      checklistId,
      checklistDescription,
      aspect: aspect || 'Tidak Diberikan Aspek',
      status: 'uploaded',
      subdirektorat,
      catatan
    };

    setUploadedFiles(prev => [...prev, newFile]);
  };

  const reUploadFile = (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => {
    // Remove existing file with same checklistId
    setUploadedFiles(prev => prev.filter(existingFile => existingFile.checklistId !== checklistId));
    
    // Add new file
    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date(),
      year: year,
      checklistId,
      checklistDescription,
      aspect: aspect || 'Tidak Diberikan Aspek',
      status: 'uploaded',
      subdirektorat,
      catatan
    };

    setUploadedFiles(prev => [...prev, newFile]);
  };

  const deleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const deleteFileByFileName = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileName !== fileName));
  };

  const refreshFiles = () => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      }));
      setUploadedFiles(parsedFiles);
    }
  };

  const getFilesByYear = (year: number) => {
    return uploadedFiles.filter(file => file.year === year);
  };

  const getYearStats = (year: number) => {
    const yearFiles = getFilesByYear(year);
    const totalSize = yearFiles.reduce((sum, file) => sum + file.fileSize, 0);
    const uploadedCount = yearFiles.filter(file => file.status === 'uploaded').length;
    const pendingCount = yearFiles.filter(file => file.status === 'pending').length;

    return {
      totalFiles: yearFiles.length,
      totalSize,
      uploadedCount,
      pendingCount
    };
  };

  return (
    <FileUploadContext.Provider value={{
      uploadedFiles,
      uploadFile,
      reUploadFile,
      deleteFile,
      deleteFileByFileName,
      refreshFiles,
      getFilesByYear,
      getYearStats
    }}>
      {children}
    </FileUploadContext.Provider>
  );
};

export const useFileUpload = () => {
  const context = useContext(FileUploadContext);
  if (context === undefined) {
    throw new Error('useFileUpload must be used within a FileUploadProvider');
  }
  return context;
}; 