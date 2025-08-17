import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import AnalysisCard from '@/components/cards/AnalysisCard';

// Keen-slider autoplay plugin
const autoplay = (run = true, interval = 2500): KeenSliderPlugin => (slider) => {
  let timeout: ReturnType<typeof setTimeout>;
  let mouseOver = false;
  function clearNextTimeout() {
    clearTimeout(timeout);
  }
  function nextTimeout() {
    clearTimeout(timeout);
    if (mouseOver) return;
    timeout = setTimeout(() => {
      if (run && slider) slider.next();
    }, interval);
  }
  slider.on('created', () => {
    slider.container.addEventListener('mouseover', () => {
      mouseOver = true;
      clearNextTimeout();
    });
    slider.container.addEventListener('mouseout', () => {
      mouseOver = false;
      nextTimeout();
    });
    nextTimeout();
  });
  slider.on('dragStarted', clearNextTimeout);
  slider.on('animationEnded', nextTimeout);
  slider.on('updated', nextTimeout);
};

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
  maxCardsInSlider?: number;
  showViewAllButton?: boolean;
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
  maxCardsInSlider = 4,
  showViewAllButton = true,
  showOverallProgress = false
}) => {
  const [showAllAspects, setShowAllAspects] = useState(false);
  
  // Memoize the autoplay plugin to prevent infinite re-renders
  const autoplayPlugin = useMemo(() => autoplay(), []);
  
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: 'free-snap',
    slides: { perView: 1, spacing: 16 },
    breakpoints: {
      '(min-width: 640px)': { slides: { perView: 2, spacing: 16 } },
      '(min-width: 768px)': { slides: { perView: 2, spacing: 20 } },
      '(min-width: 1024px)': { slides: { perView: 3, spacing: 20 } },
      '(min-width: 1280px)': { slides: { perView: 4, spacing: 20 } },
      '(min-width: 1536px)': { slides: { perView: 4, spacing: 24 } },
    },
    drag: true,
    created(slider) {
      slider.moveToIdx(0, true);
    },
    updated(slider) {
      // Don't call slider.update() here as it causes infinite recursion
      // The slider will update automatically when needed
    }
  }, [autoplayPlugin]);

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

  // Get first N aspects for slider
  const firstNAspects = useMemo(() => {
    return analysisData.slice(0, maxCardsInSlider);
  }, [analysisData, maxCardsInSlider]);

  // Update slider when sidebar state changes
  useEffect(() => {
    if (instanceRef.current) {
      setTimeout(() => {
        instanceRef.current?.update();
        setTimeout(() => {
          instanceRef.current?.update();
        }, 50);
      }, 150);
    }
  }, [isSidebarOpen, instanceRef]);

  // Update slider on window resize
  useEffect(() => {
    const handleResize = () => {
      if (instanceRef.current) {
        instanceRef.current.update();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [instanceRef]);

  // Handle aspect click
  const handleAspectClick = useCallback((aspectName: string) => {
    if (onAspectClick) {
      onAspectClick(aspectName);
    }
  }, [onAspectClick]);

  if (!selectedYear) {
    return (
      <div className="mb-8">
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pilih Tahun Buku
          </h3>
          <p className="text-gray-600">
            Silakan pilih tahun buku di atas untuk melihat statistik
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Year Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title || `Statistik Tahun Buku ${selectedYear}`}
        </h2>
        <p className="text-gray-600">
          {description || `Overview dokumen dan assessment dokumen GCG tahun ${selectedYear}`}
        </p>
      </div>

             {/* Overall Progress Card */}
       {showOverallProgress && overallProgress && (
         <div className="mb-6">
           <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-4 text-white">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-white/20 rounded-md">
                   {(() => {
                     const IconComponent = getAspectIcon(overallProgress.aspek);
                     return <IconComponent className="w-4 h-4 text-white" />;
                   })()}
                 </div>
                 <div>
                   <h3 className="text-lg font-bold">{overallProgress.aspek}</h3>
                   <p className="text-purple-100 text-xs">Progress Keseluruhan Tahun {selectedYear}</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-2xl font-bold">{overallProgress.uploadedCount}/{overallProgress.totalItems}</div>
                 <div className="text-purple-100 text-xs">
                   {overallProgress.progress}% selesai
                 </div>
               </div>
             </div>
             <div className="w-full bg-white/20 rounded-full h-2 mt-3">
               <div 
                 className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                 style={{ width: `${overallProgress.progress}%` }}
               ></div>
             </div>
           </div>
         </div>
       )}

      {/* Analysis Cards Grid / Swiper */}
      <div className="relative">
        {analysisData.length > 0 ? (
          showAllAspects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {analysisData.map((data, index) => (
                <AnalysisCard 
                  key={index} 
                  {...data} 
                  onClick={() => handleAspectClick(data.title)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden mb-8">
              <div ref={sliderRef} className="keen-slider">
                {firstNAspects.map((data, index) => (
                  <div key={index} className="keen-slider__slide">
                    <AnalysisCard 
                      {...data} 
                      highlightBorder={data.color}
                      onClick={() => handleAspectClick(data.title)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md mb-8">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada data aspek
            </h3>
            <p className="text-gray-600">
              Belum ada aspek dokumen GCG yang tersedia untuk tahun {selectedYear}
            </p>
          </div>
        )}

        {/* View All Button */}
        {showViewAllButton && analysisData.length > maxCardsInSlider && (
          <div className="flex justify-center mb-8">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setShowAllAspects(!showAllAspects)}
            >
              {showAllAspects ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Sembunyikan Semua Aspek</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Lihat Semua Aspek</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearStatisticsPanel; 