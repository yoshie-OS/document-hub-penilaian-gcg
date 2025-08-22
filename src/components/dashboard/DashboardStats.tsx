import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
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
  const { uploadedFiles, getFilesByYear } = useFileUpload();
  const { checklist, getAspectsByYear } = useChecklist();

  // Get statistics
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
      const yearFiles = getFilesByYear(selectedYear) || [];
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      
      const totalChecklist = yearChecklist.length;
      const uploadedFiles = yearFiles.length;
      const pendingFiles = totalChecklist - uploadedFiles;
              const totalSize = yearFiles.reduce((total, file) => total + (file.fileSize || 0), 0);
      const progress = totalChecklist > 0 ? Math.round((uploadedFiles / totalChecklist) * 100) : 0;

      return {
        totalFiles: yearFiles.length,
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

  // Get statistics per aspect
  const getAspectStats = () => {
    if (!selectedYear) return [];

    try {
      const yearFiles = getFilesByYear(selectedYear) || [];
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      
      // Get aspects from context for the selected year
      const yearAspects = getAspectsByYear(selectedYear);
      
      return yearAspects.map(aspek => {
        const aspectItems = yearChecklist.filter(item => item.aspek === aspek.nama);
        const uploadedFiles = yearFiles.filter(file => file.aspect === aspek.nama);
        const totalItems = aspectItems.length;
        const uploadedCount = uploadedFiles.length;
        const pendingCount = totalItems - uploadedCount;
        const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

        return {
          aspek: aspek.nama,
          totalItems,
          uploadedCount,
          pendingCount,
          progress,
          files: uploadedFiles
        };
      });
    } catch (error) {
      console.error('Error calculating aspect stats:', error);
      return [];
    }
  };

  // Get overall progress data
  const getOverallProgress = () => {
    if (!selectedYear) return null;
    
    try {
      const yearFiles = getFilesByYear(selectedYear) || [];
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      
      const totalItems = yearChecklist.length;
      const uploadedCount = yearFiles.length;
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

  const stats = getStats();
  const aspectStats = getAspectStats();
  const overallProgress = getOverallProgress();

  // Helper functions
  const getAspectIcon = (aspekName: string) => {
    // Use predefined icons for known aspects, fallback to Plus for new ones
    const iconMap: Record<string, any> = {
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