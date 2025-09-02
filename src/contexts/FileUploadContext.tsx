import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { uploadFile as apiUploadFile } from '@/services/api';

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
  uploadFile: (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => Promise<void>;
  reUploadFile: (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  deleteFileByFileName: (fileName: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
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

  // Load data from backend API on mount  
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await fetchFiles();
        setUploadedFiles(files);
      } catch (error) {
        console.error('Error loading files on mount:', error);
      }
    };
    
    loadFiles();
  }, []);

  // Fetch files from backend API
  const fetchFiles = async (): Promise<UploadedFile[]> => {
    try {
      const response = await fetch('/api/uploaded-files');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.files.map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      }));
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      // Fallback to localStorage for offline functionality
      const savedFiles = localStorage.getItem('uploadedFiles');
      if (savedFiles) {
        return JSON.parse(savedFiles).map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate)
        }));
      }
      return [];
    }
  };

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

  const uploadFile = async (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => {
    try {
      // Upload the file using the new GCG file upload endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year.toString());
      if (checklistId) formData.append('checklistId', checklistId.toString());
      if (checklistDescription) formData.append('checklistDescription', checklistDescription);
      if (aspect) formData.append('aspect', aspect);
      if (subdirektorat) formData.append('subdirektorat', subdirektorat);
      if (catatan) formData.append('catatan', catatan);

      const response = await fetch('/api/upload-gcg-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the files list to get updated data from backend
        const updatedFiles = await fetchFiles();
        setUploadedFiles(updatedFiles);
        
        // Also update localStorage as fallback
        const newFile: UploadedFile = {
          id: result.file.id,
          fileName: result.file.fileName,
          fileSize: result.file.fileSize,
          uploadDate: new Date(result.file.uploadDate),
          year: result.file.year,
          checklistId: result.file.checklistId,
          checklistDescription: result.file.checklistDescription,
          aspect: result.file.aspect || 'Tidak Diberikan Aspek',
          status: 'uploaded',
          subdirektorat: result.file.subdirektorat,
          catatan: result.file.catatan
        };
        
        const currentFiles = localStorage.getItem('uploadedFiles');
        const filesList = currentFiles ? JSON.parse(currentFiles) : [];
        filesList.push(newFile);
        localStorage.setItem('uploadedFiles', JSON.stringify(filesList));
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      // Fallback to localStorage only for offline functionality
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date(),
        year: year,
        checklistId,
        checklistDescription,
        aspect: aspect || 'Tidak Diberikan Aspek',
        status: 'pending', // Mark as pending since backend upload failed
        subdirektorat,
        catatan
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Save to localStorage as fallback
      const currentFiles = localStorage.getItem('uploadedFiles');
      const filesList = currentFiles ? JSON.parse(currentFiles) : [];
      filesList.push(newFile);
      localStorage.setItem('uploadedFiles', JSON.stringify(filesList));
      
      throw error; // Re-throw so calling code can handle the error
    }
  };

  const reUploadFile = async (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string) => {
    try {
      // First, delete existing file with same checklistId
      if (checklistId) {
        const existingFile = uploadedFiles.find(f => f.checklistId === checklistId);
        if (existingFile) {
          await deleteFile(existingFile.id);
        }
      }
      
      // Then upload new file
      await uploadFile(file, year, checklistId, checklistDescription, aspect, subdirektorat, catatan);
    } catch (error) {
      console.error('Re-upload error:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploaded-files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the files list to get updated data from backend
        const updatedFiles = await fetchFiles();
        setUploadedFiles(updatedFiles);
        
        // Also update localStorage
        const currentFiles = localStorage.getItem('uploadedFiles');
        if (currentFiles) {
          const filesList = JSON.parse(currentFiles);
          const filteredFiles = filesList.filter((file: any) => file.id !== fileId);
          localStorage.setItem('uploadedFiles', JSON.stringify(filteredFiles));
        }
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('File delete error:', error);
      // Fallback to localStorage only
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      const currentFiles = localStorage.getItem('uploadedFiles');
      if (currentFiles) {
        const filesList = JSON.parse(currentFiles);
        const updatedFiles = filesList.filter((file: any) => file.id !== fileId);
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
      }
      throw error;
    }
  };

  const deleteFileByFileName = async (fileName: string) => {
    const fileToDelete = uploadedFiles.find(file => file.fileName === fileName);
    if (fileToDelete) {
      await deleteFile(fileToDelete.id);
    }
  };

  const refreshFiles = async () => {
    try {
      const files = await fetchFiles();
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error refreshing files:', error);
      // Fallback to localStorage
      const savedFiles = localStorage.getItem('uploadedFiles');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles).map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate)
        }));
        setUploadedFiles(parsedFiles);
      }
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