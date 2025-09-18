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
      const response = await fetch('http://localhost:5000/api/files');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.files.map((file: any) => ({
        ...file,
        uploadDate: new Date(file.created)
      }));
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
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

  const uploadFile = async (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string, rowNumber?: number) => {
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
      if (rowNumber) formData.append('rowNumber', rowNumber.toString());

      const response = await fetch('http://localhost:5000/api/upload-gcg-file', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the files list to get updated data from backend
        const updatedFiles = await fetchFiles();
        setUploadedFiles(updatedFiles);

        // Dispatch events to notify other components about the upload
        window.dispatchEvent(new CustomEvent('fileUploaded', {
          detail: {
            checklistId: checklistId,
            rowNumber: rowNumber,
            year: year,
            fileName: file.name,
            success: true
          }
        }));

        window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
          detail: {
            type: 'fileUploaded',
            files: updatedFiles,
            year: year
          }
        }));
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Upload timeout - Supabase upload took too long. Please try again.');
        } else if (error.name === 'AbortError') {
          throw new Error('Upload cancelled - Request was aborted.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      } else {
        throw new Error('Upload failed: Unknown error occurred');
      }
    }
  };

  const reUploadFile = async (file: File, year: number, checklistId?: number, checklistDescription?: string, aspect?: string, subdirektorat?: string, catatan?: string, rowNumber?: number) => {
    try {
      // First, delete existing file with same checklistId
      if (checklistId) {
        const existingFile = uploadedFiles.find(f => f.checklistId === checklistId);
        if (existingFile) {
          await deleteFile(existingFile.id);
        }
      }
      
      // Then upload new file
      await uploadFile(file, year, checklistId, checklistDescription, aspect, subdirektorat, catatan, rowNumber);
    } catch (error) {
      console.error('Re-upload error:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/uploaded-files/${fileId}`, {
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
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('File delete error:', error);
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