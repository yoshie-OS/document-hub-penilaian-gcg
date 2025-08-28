import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, FileText, CheckCircle, Upload, Plus, AlertTriangle } from 'lucide-react';
interface ChecklistItem {
  id: number;
  aspek?: string; // Make aspek optional
  deskripsi: string;
  tahun?: number;
  status: string;
  uploadedFile?: {
    id: string;
    fileName: string;
    fileSize: number;
    uploadDate: Date;
    checklistId?: number;
    checklistDescription?: string;
    aspect?: string;
    status: 'uploaded' | 'pending';
  } | null;
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
  // Calculate statistics for aspects
  const aspectStats = React.useMemo(() => {
    if (!selectedYear) return [];

    // Group checklist items by aspect
    const aspectGroups = checklistItems.reduce((groups, item) => {
      const aspek = item.aspek && item.aspek.trim() !== '' ? item.aspek : 'Tidak Diberikan Aspek';
      if (!groups[aspek]) {
        groups[aspek] = [];
      }
      groups[aspek].push(item);
      return groups;
    }, {} as Record<string, ChecklistItem[]>);

    // Calculate stats for each aspect
    return Object.entries(aspectGroups).map(([aspek, items]) => {
      const totalItems = items.length;
      const completedCount = items.filter(item => item.status === 'completed').length;
      const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      return {
        aspek,
        totalItems,
        uploadedCount: completedCount, // Keep for backward compatibility
        progress
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  }, [checklistItems, selectedYear]);

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    if (!selectedYear) return null;

    const totalItems = checklistItems.length;
    const completedCount = checklistItems.filter(item => item.status === 'completed').length;
    const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    return {
      aspek: 'KESELURUHAN',
      totalItems,
      uploadedCount: completedCount, // Keep for backward compatibility
      progress
    };
  }, [checklistItems, selectedYear]);

  // Get aspect icon - konsisten dengan superadmin dashboard
  const getAspectIcon = React.useCallback((aspekName: string) => {
    if (aspekName === 'KESELURUHAN') return TrendingUp;
    if (aspekName === 'Tidak Diberikan Aspek') return Plus; // Konsisten dengan superadmin
    if (aspekName.includes('ASPEK I')) return FileText;
    if (aspekName.includes('ASPEK II')) return CheckCircle;
    if (aspekName.includes('ASPEK III')) return TrendingUp;
    if (aspekName.includes('ASPEK IV')) return FileText;
    if (aspekName.includes('ASPEK V')) return Upload;
    // Aspek baru/default
    return Plus;
  }, []);

  // Get aspect color
  const getAspectColor = React.useCallback((aspekName: string, progress: number) => {
    if (aspekName === 'KESELURUHAN') return '#7c3aed'; // ungu gelap
    if (aspekName === 'Tidak Diberikan Aspek') return '#6b7280'; // abu-abu
    if (aspekName.includes('ASPEK I')) return '#2563eb'; // biru
    if (aspekName.includes('ASPEK II')) return '#059669'; // hijau
    if (aspekName.includes('ASPEK III')) return '#f59e42'; // oranye
    if (aspekName.includes('ASPEK IV')) return '#eab308'; // kuning
    if (aspekName.includes('ASPEK V')) return '#d946ef'; // ungu
    // fallback berdasarkan progress
    if (progress >= 80) return '#059669'; // hijau
    if (progress >= 50) return '#eab308'; // kuning
    return '#ef4444'; // merah
  }, []);

  if (!selectedYear) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900">
          Statistik Progress Penugasan
        </CardTitle>
        <p className="text-sm text-gray-600">
          Overview dokumen dan assessment dokumen GCG yang di-assign ke {userSubdirektorat} tahun {selectedYear}
        </p>
      </CardHeader>
      <CardContent>
        {/* Overall Progress Card */}
        {overallProgress && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{overallProgress.aspek}</h3>
                    <p className="text-purple-100 text-sm">Progress Keseluruhan Tahun {selectedYear}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{overallProgress.uploadedCount}/{overallProgress.totalItems}</div>
                  <div className="text-purple-100 text-sm">
                    {overallProgress.progress}% selesai
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                  style={{ width: `${overallProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Aspect Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aspectStats.map((aspect, index) => {
            const IconComponent = getAspectIcon(aspect.aspek);
            const color = getAspectColor(aspect.aspek, aspect.progress);
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="p-2 rounded-md"
                      style={{ backgroundColor: `${color}20`, color: color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{aspect.aspek}</h4>
                      <p className="text-xs text-gray-600">{aspect.totalItems} item</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold" style={{ color: color }}>
                        {aspect.progress}%
                      </span>
                    </div>
                    <Progress 
                      value={aspect.progress} 
                      className="h-2"
                      style={{ 
                        '--progress-background': color,
                        '--progress-foreground': color 
                      } as React.CSSProperties}
                    />
                    <div className="text-xs text-gray-500 text-center">
                      {aspect.uploadedCount} dari {aspect.totalItems} sudah terupload
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {aspectStats.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 text-gray-400 mx-auto mb-4">
              <TrendingUp className="w-full h-full" />
            </div>
            <p className="text-gray-600">Belum ada data statistik untuk tahun {selectedYear}</p>
            <p className="text-sm text-gray-500 mt-1">
              Mulai upload dokumen untuk melihat progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminStatisticsPanel;
