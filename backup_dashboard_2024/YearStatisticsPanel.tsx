import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import AnalysisCard from '@/components/cards/AnalysisCard';

interface AspectData {
  aspek: string;
  totalItems: number;
  uploadedCount: number;
  progress: number;
}

interface YearStatisticsPanelProps {
  selectedYear: number | null;
  aspectStats: AspectData[];
  overallProgress?: AspectData | null;
  getAspectIcon: (aspekName: string) => LucideIcon;
  getAspectColor: (aspekName: string, progress: number) => string;
  onAspectClick?: (aspectName: string) => void;
  isSidebarOpen?: boolean;
  title?: string;
  description?: string;
  showOverallProgress?: boolean;
}

const YearStatisticsPanel: React.FC<YearStatisticsPanelProps> = ({
  selectedYear,
  aspectStats,
  overallProgress,
  getAspectIcon,
  getAspectColor,
  onAspectClick,
  isSidebarOpen = false,
  title,
  description,
  showOverallProgress = false
}) => {
  // Create analysis data for aspects
  const analysisData = useMemo(() => {
    return aspectStats.map((aspect) => ({
      title: aspect.aspek,
      value: `${aspect.totalItems} item`,
      subtitle: `${aspect.uploadedCount} sudah terupload`,
      icon: getAspectIcon(aspect.aspek),
      color: getAspectColor(aspect.aspek, aspect.progress),
      percentage: aspect.progress
    }));
  }, [aspectStats, getAspectIcon, getAspectColor]);

  const handleAspectClick = useCallback((aspectName: string) => {
    if (onAspectClick) {
      onAspectClick(aspectName);
    }
  }, [onAspectClick]);

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
            Silakan pilih tahun buku di atas untuk melihat statistik
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Year Header - Smaller */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {title || `Statistik Tahun Buku ${selectedYear}`}
        </h2>
        <p className="text-sm text-gray-600">
          {description || `Overview dokumen dan assessment dokumen GCG tahun ${selectedYear}`}
        </p>
      </div>

      {/* Overall Progress Card - Smaller */}
      {showOverallProgress && overallProgress && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-white/20 rounded-md">
                  {(() => {
                    const IconComponent = getAspectIcon(overallProgress.aspek);
                    return <IconComponent className="w-3 h-3 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{overallProgress.aspek}</h3>
                  <p className="text-purple-100 text-xs">Progress Keseluruhan Tahun {selectedYear}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{overallProgress.uploadedCount}/{overallProgress.totalItems}</div>
                <div className="text-purple-100 text-xs">
                  {overallProgress.progress}% selesai
                </div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <div 
                className="bg-white rounded-full h-1.5 transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Cards Grid - Always show all, smaller size */}
      <div className="relative">
        {analysisData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {analysisData.map((data, index) => (
              <AnalysisCard 
                key={index} 
                {...data} 
                highlightBorder={data.color}
                onClick={() => handleAspectClick(data.title)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-3">
              <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Tidak ada data aspek
            </h3>
            <p className="text-sm text-gray-600">
              Belum ada aspek dokumen GCG yang tersedia untuk tahun {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearStatisticsPanel; 