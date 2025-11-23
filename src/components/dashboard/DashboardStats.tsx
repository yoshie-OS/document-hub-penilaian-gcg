import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useYear } from '@/contexts/YearContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  Plus,
  Eye
} from 'lucide-react';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DashboardStats = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear } = useYear();
  const { uploadedFiles, getFilesByYear, refreshFiles } = useFileUpload();
  const { checklist, getAspectsByYear } = useChecklist();
  const { refreshDocuments } = useDocumentMetadata();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Get statistics - menggunakan logika yang sama dengan MonitoringUploadGCG
  const getStats = () => {
    if (!selectedYear) {
      return {
        totalFiles: 0,
        uploadedFiles: 0,
        pendingFiles: 0,
        totalSize: 0,
        progress: 0
      };
    }

    try {
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      const yearFiles = getFilesByYear(selectedYear) || [];
      
      const totalChecklist = yearChecklist.length;
      
      // Hitung uploaded files berdasarkan checklist items yang sudah diupload
      // Ini mencegah double counting saat re-upload
      const uploadedFiles = yearChecklist.filter(item => 
        yearFiles.some(file => file.checklistId === item.id)
      ).length;
      
      const pendingFiles = totalChecklist - uploadedFiles;
      
      // Hitung total size dari file yang unik (berdasarkan checklistId)
      const uniqueFiles = yearFiles.filter((file, index, self) => 
        index === self.findIndex(f => f.checklistId === file.checklistId)
      );
      const totalSize = uniqueFiles.reduce((total, file) => total + (file.fileSize || 0), 0);
      
      const progress = totalChecklist > 0 ? Math.round((uploadedFiles / totalChecklist) * 100) : 0;

      return {
        totalFiles: uniqueFiles.length, // Gunakan unique files
        uploadedFiles,
        pendingFiles,
        totalSize,
        progress
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalFiles: 0,
        uploadedFiles: 0,
        pendingFiles: 0,
        totalSize: 0,
        progress: 0
      };
    }
  };

  // Get statistics per aspect - menggunakan logika yang sama dengan MonitoringUploadGCG
  const getAspectStats = () => {
    if (!selectedYear) return [];

    try {
      const yearFiles = getFilesByYear(selectedYear) || [];
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      
      // Get unique aspects dari checklist items (termasuk yang kosong/undefined)
      // Ini konsisten dengan MonitoringUploadGCG
      const uniqueAspects = Array.from(new Set(yearChecklist.map(item => item.aspek)));
      
      return uniqueAspects.map(aspek => {
        // Handle aspek yang kosong/undefined
        const aspekName = aspek || 'Dokumen Tanpa Aspek';
        const aspectItems = yearChecklist.filter(item => item.aspek === aspek);
        
        // Hitung uploaded files berdasarkan checklist items yang sudah diupload
        // Ini mencegah double counting saat re-upload
        const uploadedCount = aspectItems.filter(item => 
          yearFiles.some(file => file.checklistId === item.id)
        ).length;
        
        const totalItems = aspectItems.length;
        const pendingCount = totalItems - uploadedCount;
        const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

        // Ambil file yang unik untuk aspek ini
        const uniqueFiles = yearFiles.filter((file, index, self) => {
          // Handle aspek yang kosong/undefined
          const fileAspect = file.aspect || '';
          const itemAspect = aspek || '';
          return fileAspect === itemAspect && 
            index === self.findIndex(f => f.checklistId === file.checklistId);
        });

        return {
          aspek: aspekName,
          totalItems,
          uploadedCount,
          pendingCount,
          progress,
          files: uniqueFiles
        };
      }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
    } catch (error) {
      console.error('Error calculating aspect stats:', error);
      return [];
    }
  };

  // Get overall progress data - menggunakan logika yang sama dengan MonitoringUploadGCG
  const getOverallProgress = () => {
    if (!selectedYear) return null;
    
    try {
      const yearFiles = getFilesByYear(selectedYear) || [];
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      
      const totalItems = yearChecklist.length;
      
      // Hitung uploaded files berdasarkan checklist items yang sudah diupload
      // Ini mencegah double counting saat re-upload
      const uploadedCount = yearChecklist.filter(item => 
        yearFiles.some(file => file.checklistId === item.id)
      ).length;
      
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

      return {
        aspek: 'Progress Keseluruhan',
        totalItems,
        uploadedCount,
        progress
      };
    } catch (error) {
      console.error('Error calculating overall progress:', error);
      return null;
    }
  };

  // Event handling for real-time updates
  useEffect(() => {
    const handleDataUpdate = async () => {
      console.log('🔔 DashboardStats: Data update event received, refreshing data');
      try {
        console.log('🔔 DashboardStats: Force refreshing data after update event');
        await Promise.all([refreshFiles(), refreshDocuments()]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('❌ DashboardStats: Error refreshing data:', error);
      }
    };

    const handleFileUpload = async () => {
      console.log('🔔 DashboardStats: File upload event received, refreshing data');
      try {
        // Add small delay to ensure backend has processed the upload
        setTimeout(async () => {
          console.log('🔔 DashboardStats: Force refreshing data after file upload');
          await Promise.all([refreshFiles(), refreshDocuments()]);
          setForceUpdate(prev => prev + 1);
        }, 200);
      } catch (error) {
        console.error('❌ DashboardStats: Error refreshing data:', error);
      }
    };

    // Listen to all relevant events for real-time updates
    window.addEventListener('fileUploaded', handleFileUpload);
    window.addEventListener('documentsUpdated', handleDataUpdate);
    window.addEventListener('assignmentsUpdated', handleDataUpdate);
    window.addEventListener('uploadedFilesChanged', handleDataUpdate);
    window.addEventListener('checklistAssignmentsChanged', handleDataUpdate);
    window.addEventListener('checklistUpdated', handleDataUpdate);
    
    // Add additional event listeners for better coverage
    window.addEventListener('fileUploaded', handleDataUpdate);
    window.addEventListener('uploadedFilesChanged', handleFileUpload);

    // Also listen to storage changes for real-time updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'checklistAssignments' || e.key === 'documentMetadata' || e.key === 'checklist' || e.key === 'uploadedFiles') {
        console.log('🔔 DashboardStats: Storage change detected:', e.key, 'refreshing data');
        handleDataUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('fileUploaded', handleFileUpload);
      window.removeEventListener('documentsUpdated', handleDataUpdate);
      window.removeEventListener('assignmentsUpdated', handleDataUpdate);
      window.removeEventListener('uploadedFilesChanged', handleDataUpdate);
      window.removeEventListener('checklistAssignmentsChanged', handleDataUpdate);
      window.removeEventListener('checklistUpdated', handleDataUpdate);
      window.removeEventListener('fileUploaded', handleDataUpdate);
      window.removeEventListener('uploadedFilesChanged', handleFileUpload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshFiles]);

  // Force refresh when year changes
  useEffect(() => {
    if (selectedYear) {
      console.log('🔔 DashboardStats: Year changed to', selectedYear, 'refreshing data');
      setForceUpdate(prev => prev + 1);
    }
  }, [selectedYear]);

  const stats = useMemo(() => getStats(), [selectedYear, checklist, uploadedFiles, forceUpdate]);
  const aspectStats = useMemo(() => getAspectStats(), [selectedYear, checklist, uploadedFiles, forceUpdate]);
  const overallProgress = useMemo(() => getOverallProgress(), [selectedYear, checklist, uploadedFiles, forceUpdate]);

  // Helper functions
  const getAspectIcon = (aspekName: string) => {
    // Use predefined icons for known aspects, fallback to Plus for new ones
    const iconMap: Record<string, any> = {
      'Dokumen Tanpa Aspek': Plus,
      'ASPEK I. Komitmen': BarChart3,
      'ASPEK II. RUPS': CheckCircle,
      'ASPEK III. Dewan Komisaris': TrendingUp,
      'ASPEK IV. Direksi': FileText,
      'ASPEK V. Pengungkapan': Upload,
    };
    
    return iconMap[aspekName] || Plus;
  };

  // Generate colors dynamically based on aspect index
  const getAspectColor = (aspekName: string, progress: number) => {
    // Predefined colors for known aspects
    const predefinedColors: Record<string, string> = {
      'Dokumen Tanpa Aspek': '#6b7280', // abu-abu
      'ASPEK I. Komitmen': '#2563eb', // biru
      'ASPEK II. RUPS': '#059669',    // hijau
      'ASPEK III. Dewan Komisaris': '#f59e42', // oranye
      'ASPEK IV. Direksi': '#eab308', // kuning
      'ASPEK V. Pengungkapan': '#d946ef', // ungu
  };

    if (predefinedColors[aspekName]) return predefinedColors[aspekName];
    
    // For new aspects, generate color based on progress
    if (progress >= 80) return '#059669'; // hijau
    if (progress >= 50) return '#eab308'; // kuning
    return '#ef4444'; // merah
  };

  // Function to navigate to List GCG with filters
  const handleAspectClick = (aspectName: string) => {
    if (!selectedYear) return;
    
    // Navigate to List GCG with year and aspect parameters, and auto-scroll to checklist table
    navigate(`/list-gcg?year=${selectedYear}&aspect=${encodeURIComponent(aspectName)}&scroll=checklist`);
  };

  if (!selectedYear) {
    return (
      <div className="mb-6">
        <div className="text-center py-8 bg-white rounded-xl shadow-md">
          <div className="w-12 h-12 text-gray-400 mx-auto mb-3">
            <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Pilih Tahun Buku
          </h3>
          <p className="text-sm text-gray-600">
            Silakan pilih tahun buku di atas untuk melihat statistik dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="mb-6">
      {/* Use YearStatisticsPanel for consistent UI */}
      <YearStatisticsPanel 
        selectedYear={selectedYear}
        aspectStats={aspectStats}
        overallProgress={overallProgress}
        getAspectIcon={getAspectIcon}
        getAspectColor={getAspectColor}
        onAspectClick={handleAspectClick}
        isSidebarOpen={isSidebarOpen}
        title="Statistik Tahun Buku"
        description={`Overview dokumen dan assessment dokumen GCG tahun ${selectedYear}`}
        showOverallProgress={true}
      />
    </div>
  );
};

export default DashboardStats; 