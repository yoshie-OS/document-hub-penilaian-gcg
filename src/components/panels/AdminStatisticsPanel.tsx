import React from 'react';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';

interface ChecklistItem {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
  status?: 'uploaded' | 'not_uploaded';
  file?: string;
}

interface AdminStatisticsPanelProps {
  selectedYear: number | null;
  checklistItems: ChecklistItem[];
  userSubdirektorat: string;
  isSidebarOpen: boolean;
}

const AdminStatisticsPanel: React.FC<AdminStatisticsPanelProps> = ({
  selectedYear,
  checklistItems,
  userSubdirektorat,
  isSidebarOpen
}) => {
  // Calculate statistics for YearStatisticsPanel (same as superadmin)
  const getAspectStats = React.useMemo(() => {
    if (!selectedYear) return [];

    // Group checklist items by aspect
    const aspectGroups = checklistItems.reduce((groups, item) => {
      if (!groups[item.aspek]) {
        groups[item.aspek] = [];
      }
      groups[item.aspek].push(item);
      return groups;
    }, {} as Record<string, ChecklistItem[]>);

    // Calculate stats for each aspect
    return Object.entries(aspectGroups).map(([aspek, items]) => {
      const totalItems = items.length;
      const uploadedCount = items.filter(item => item.status === 'uploaded').length;
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

      return {
        aspek,
        totalItems,
        uploadedCount,
        progress
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  }, [checklistItems, selectedYear]);

  // Calculate overall progress (same as superadmin)
  const getOverallProgress = React.useMemo(() => {
    if (!selectedYear) return null;

    const totalItems = checklistItems.length;
    const uploadedCount = checklistItems.filter(item => item.status === 'uploaded').length;
    const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

    return {
      aspek: 'KESELURUHAN',
      totalItems,
      uploadedCount,
      progress
    };
  }, [checklistItems, selectedYear]);

  // Get aspect icon - konsisten dengan superadmin
  const getAspectIcon = React.useCallback((aspekName: string) => {
    const { TrendingUp, FileText, CheckCircle, Upload, Plus } = require('lucide-react');
    
    if (aspekName === 'KESELURUHAN') return TrendingUp;
    if (aspekName.includes('ASPEK I')) return FileText;
    if (aspekName.includes('ASPEK II')) return CheckCircle;
    if (aspekName.includes('ASPEK III')) return TrendingUp;
    if (aspekName.includes('ASPEK IV')) return FileText;
    if (aspekName.includes('ASPEK V')) return Upload;
    // Aspek baru/default
    return Plus;
  }, []);

  // Mapping warna unik untuk tiap aspek - sama dengan superadmin
  const ASPECT_COLORS: Record<string, string> = {
    'KESELURUHAN': '#7c3aed', // ungu gelap untuk keseluruhan
    'ASPEK I. Komitmen': '#2563eb', // biru
    'ASPEK II. RUPS': '#059669',    // hijau
    'ASPEK III. Dewan Komisaris': '#f59e42', // oranye
    'ASPEK IV. Direksi': '#eab308', // kuning
    'ASPEK V. Pengungkapan': '#d946ef', // ungu
    // fallback
    'default': '#ef4444', // merah
  };

  // Get aspect color based on progress - sama dengan superadmin
  const getAspectColor = React.useCallback((aspekName: string, progress: number) => {
    if (ASPECT_COLORS[aspekName]) return ASPECT_COLORS[aspekName];
    if (progress >= 80) return '#059669'; // hijau
    if (progress >= 50) return '#eab308'; // kuning
    return '#ef4444'; // merah
  }, []);

  if (!selectedYear) return null;

  return (
    <YearStatisticsPanel 
      selectedYear={selectedYear}
      aspectStats={getAspectStats}
      overallProgress={getOverallProgress}
      getAspectIcon={getAspectIcon}
      getAspectColor={getAspectColor}
      onAspectClick={(aspectName) => {
        // TODO: Implement aspect filtering
        console.log('Clicked aspect:', aspectName);
      }}
      isSidebarOpen={isSidebarOpen}
      title="Statistik Progress Penugasan"
      description={`Overview dokumen dan assessment dokumen GCG yang di-assign ke ${userSubdirektorat} tahun ${selectedYear}`}
      showOverallProgress={true}
    />
  );
};

export default AdminStatisticsPanel;
