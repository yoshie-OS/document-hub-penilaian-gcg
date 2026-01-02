import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import YearSelector from '@/components/dashboard/YearSelector';
import MonthlyTrends from '@/components/dashboard/MonthlyTrends';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { PageHeaderPanel } from '@/components/panels';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  AlertCircle
} from 'lucide-react';

const DashboardMain = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear } = useYear();
  const { uploadedFiles, getFilesByYear, refreshFiles } = useFileUpload();
  const { checklist } = useChecklist();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Get URL parameters
  const filterYear = searchParams.get('year');

  // Event handling for real-time updates
  useEffect(() => {
    const handleDataUpdate = async () => {
      try {
        await refreshFiles();
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('DashboardMain: Error refreshing data:', error);
      }
    };

    window.addEventListener('fileUploaded', handleDataUpdate);
    window.addEventListener('documentsUpdated', handleDataUpdate);
    window.addEventListener('checklistUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('fileUploaded', handleDataUpdate);
      window.removeEventListener('documentsUpdated', handleDataUpdate);
      window.removeEventListener('checklistUpdated', handleDataUpdate);
    };
  }, [refreshFiles]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!selectedYear) return null;

    const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
    const yearFiles = getFilesByYear(selectedYear) || [];

    const totalChecklist = yearChecklist.length;
    const uploadedCount = yearChecklist.filter(item =>
      yearFiles.some(file => file.checklistId === item.id)
    ).length;
    const pendingCount = totalChecklist - uploadedCount;
    const progress = totalChecklist > 0 ? Math.round((uploadedCount / totalChecklist) * 100) : 0;

    return {
      totalChecklist,
      uploadedCount,
      pendingCount,
      progress
    };
  }, [selectedYear, checklist, uploadedFiles, forceUpdate]);

  // Calculate per-aspect statistics
  const aspectStats = useMemo(() => {
    if (!selectedYear) return [];

    const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
    const yearFiles = getFilesByYear(selectedYear) || [];

    const uniqueAspects = Array.from(new Set(yearChecklist.map(item => item.aspek)));

    return uniqueAspects.map(aspek => {
      const aspekName = aspek || 'Dokumen Tanpa Aspek';
      const aspectItems = yearChecklist.filter(item => item.aspek === aspek);
      const uploadedCount = aspectItems.filter(item =>
        yearFiles.some(file => file.checklistId === item.id)
      ).length;
      const totalItems = aspectItems.length;
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

      return {
        aspek: aspekName,
        originalAspek: aspek,
        totalItems,
        uploadedCount,
        pendingCount: totalItems - uploadedCount,
        progress
      };
    }).sort((a, b) => b.progress - a.progress);
  }, [selectedYear, checklist, uploadedFiles, forceUpdate]);

  // Handle aspect click - navigate to monitoring with filter
  const handleAspectClick = (aspectName: string, originalAspek: string | undefined) => {
    if (!selectedYear) return;
    const aspectParam = originalAspek || aspectName;
    navigate(`/list-gcg?year=${selectedYear}&aspect=${encodeURIComponent(aspectParam)}&scroll=checklist`);
  };

  // Get color based on progress
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' };
    if (progress >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' };
    if (progress >= 25) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
  };

  return (
    <>
      <Sidebar />
      <Topbar />

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Dashboard"
            subtitle={selectedYear ? `Statistik Good Corporate Governance Documents Management System - Tahun ${selectedYear}` : "Selamat datang di Good Corporate Governance Documents Management System"}
          />

          {/* Year Selector */}
          <div id="year-selector" data-tour="year-selector" className="mb-6">
            <YearSelector initialYear={filterYear ? parseInt(filterYear) : undefined} />
          </div>

          {/* Show content only when year is selected */}
          {selectedYear && stats ? (
            <>
              {/* Progress Keseluruhan - Smaller version */}
              <Card data-tour="stats-cards" className="mb-6 border-0 shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Circular Progress - Smaller */}
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="white"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${stats.progress * 2.64} 264`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-2xl font-bold">{stats.progress}%</span>
                          <p className="text-[10px] text-purple-200">Selesai</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-lg font-bold mb-1">Progress Keseluruhan</h2>
                      <p className="text-purple-200 text-xs mb-3">Tahun Buku {selectedYear}</p>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <FileText className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{stats.totalChecklist}</p>
                          <p className="text-[10px] text-purple-200">Total Dokumen</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <CheckCircle className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{stats.uploadedCount}</p>
                          <p className="text-[10px] text-purple-200">Selesai</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <Clock className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{stats.pendingCount}</p>
                          <p className="text-[10px] text-purple-200">Belum Upload</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Per Aspek - Circular Progress Cards */}
              <Card data-tour="performance-chart" className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Progress Per Aspek
                  </CardTitle>
                  <CardDescription>
                    Klik pada aspek untuk melihat detail di menu Monitoring & Upload GCG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aspectStats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {aspectStats.map((aspect, index) => {
                        const colors = getProgressColor(aspect.progress);
                        return (
                          <div
                            key={index}
                            onClick={() => handleAspectClick(aspect.aspek, aspect.originalAspek)}
                            className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              {/* Mini Circular Progress */}
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="10"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    className={colors.bg.replace('bg-', 'stroke-')}
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${aspect.progress * 2.64} 264`}
                                    style={{ stroke: colors.bg.includes('green') ? '#22c55e' : colors.bg.includes('yellow') ? '#eab308' : colors.bg.includes('orange') ? '#f97316' : '#ef4444' }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-sm font-bold ${colors.text}`}>{aspect.progress}%</span>
                                </div>
                              </div>

                              {/* Aspect Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={aspect.aspek}>
                                  {aspect.aspek}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {aspect.uploadedCount} / {aspect.totalItems} dokumen
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {aspect.pendingCount > 0 ? (
                                    <span className="inline-flex items-center text-xs text-orange-600">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {aspect.pendingCount} belum
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-xs text-green-600">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Lengkap
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Tidak ada data aspek untuk tahun ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Pengerjaan Chart + Breakdown */}
              <MonthlyTrends />
            </>
          ) : (
            /* Empty State when no year selected */
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku di atas untuk melihat statistik dashboard yang menarik dan informatif
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardMain; 