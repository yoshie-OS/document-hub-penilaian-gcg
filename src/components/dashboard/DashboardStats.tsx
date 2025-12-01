import React, { useState, useMemo, useEffect } from 'react';
import { useKeenSlider, KeenSliderPlugin } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';

import { useYear } from '@/contexts/YearContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnalysisCard from '@/components/cards/AnalysisCard';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  Plus,
  Eye,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Custom CSS for keen-slider
const keenSliderStyles = `
  .keen-slider {
    display: flex;
    overflow: hidden;
    position: relative;
    width: 100%;
    max-width: 100%;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -khtml-user-select: none;
    touch-action: pan-y;
  }
  .keen-slider__slide {
    position: relative;
    overflow: hidden;
    width: 100%;
    min-height: 100%;
    flex-shrink: 0;
  }
  .keen-slider[data-keen-slider-v] {
    flex-wrap: wrap;
  }
  .keen-slider[data-keen-slider-v] .keen-slider__slide {
    width: 100%;
  }
  .keen-slider[data-keen-slider-moves] * {
    pointer-events: none;
  }
  .keen-slider[data-keen-slider-mode="free-snap"] {
    scroll-snap-type: x mandatory;
  }
  .keen-slider[data-keen-slider-mode="free-snap"] .keen-slider__slide {
    scroll-snap-align: start;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = keenSliderStyles;
  document.head.appendChild(styleElement);
}

const DashboardStats = () => {
  const navigate = useNavigate();
  const { selectedYear } = useYear();
  const { getYearStats, getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();

  const { isSidebarOpen } = useSidebar();
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
    // Commented out - causes infinite recursion
    // updated(slider) {
    //   slider.update();
    // }
  }, [autoplayPlugin]);

  // Update slider when sidebar state changes
  useEffect(() => {
    if (instanceRef.current) {
      // Longer delay to ensure DOM has fully updated
      setTimeout(() => {
        instanceRef.current?.update();
        // Force a second update after a short delay
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

  // Calculate statistics based on selected year
  const getStats = () => {
    if (!selectedYear) {
      return {
        totalChecklist: 0,
        uploadedFiles: 0,
        pendingFiles: 0,
        totalSize: 0,
        progress: 0
      };
    }

    try {
      const yearStats = getYearStats(selectedYear);
      const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
      const totalChecklist = yearChecklist.length;
      const progress = totalChecklist > 0 ? Math.round((yearStats?.uploadedCount || 0) / totalChecklist * 100) : 0;

      return {
        totalChecklist,
        uploadedFiles: yearStats?.uploadedCount || 0,
        pendingFiles: totalChecklist - (yearStats?.uploadedCount || 0),
        totalSize: yearStats?.totalSize || 0,
        progress
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalChecklist: 0,
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
      
      // Get unique aspek names from checklist
      const aspekNames = [...new Set(yearChecklist.map(item => item.aspek))];
      
      return aspekNames.map(aspekName => {
        if (!aspekName) return null;
        
        const aspectItems = yearChecklist.filter(item => item.aspek === aspekName);
        const uploadedFiles = yearFiles.filter(file => file.aspect === aspekName);
        const totalItems = aspectItems.length;
        const uploadedCount = uploadedFiles.length;
        const pendingCount = totalItems - uploadedCount;
        const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

        return {
          aspek: aspekName,
          totalItems,
          uploadedCount,
          pendingCount,
          progress,
          files: uploadedFiles
        };
      }).filter(Boolean); // Remove null values
    } catch (error) {
      console.error('Error calculating aspect stats:', error);
      return [];
    }
  };

  const stats = getStats();
  const aspectStats = getAspectStats();



  // Get first 4 aspects for display
  const getFirstFourAspects = () => {
    return aspectStats.slice(0, 4);
  };

  const firstFourAspects = getFirstFourAspects();
  const allAspects = aspectStats;

  // Helper functions
  const getAspectIcon = (aspekName: string) => {
    if (aspekName.includes('ASPEK I')) return BarChart3;
    if (aspekName.includes('ASPEK II')) return CheckCircle;
    if (aspekName.includes('ASPEK III')) return TrendingUp;
    if (aspekName.includes('ASPEK IV')) return FileText;
    if (aspekName.includes('ASPEK V')) return Upload;
    // Aspek baru/default
    return Plus;
  };

  // Mapping warna unik untuk tiap aspek
  const ASPECT_COLORS: Record<string, string> = {
    'ASPEK I. Komitmen': '#2563eb', // biru
    'ASPEK II. RUPS': '#059669',    // hijau
    'ASPEK III. Dewan Komisaris': '#f59e42', // oranye
    'ASPEK IV. Direksi': '#eab308', // kuning
    'ASPEK V. Pengungkapan': '#d946ef', // ungu
    // fallback
    'default': '#ef4444', // merah
  };

  const getAspectColor = (aspekName: string, progress: number) => {
    if (ASPECT_COLORS[aspekName]) return ASPECT_COLORS[aspekName];
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

  // Create analysis data for first 4 aspects
  const analysisData = firstFourAspects.map((aspect) => ({
      title: aspect.aspek,
      value: `${aspect.totalItems} item`,
      subtitle: `${aspect.uploadedCount} sudah terupload`,
      icon: getAspectIcon(aspect.aspek),
    color: getAspectColor(aspect.aspek, aspect.progress),
      percentage: aspect.progress
  }));

  // Create analysis data for all aspects
  const allAnalysisData = allAspects.map((aspect) => ({
      title: aspect.aspek,
      value: `${aspect.totalItems} item`,
      subtitle: `${aspect.uploadedCount} sudah terupload`,
      icon: getAspectIcon(aspect.aspek),
    color: getAspectColor(aspect.aspek, aspect.progress),
      percentage: aspect.progress
  }));

  if (!selectedYear) {
    return (
      <div className="mb-8">
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pilih Tahun Buku
          </h3>
          <p className="text-gray-600">
            Silakan pilih tahun buku di atas untuk melihat statistik dashboard
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
          Statistik Tahun Buku {selectedYear}
        </h2>
        <p className="text-gray-600">
          Overview dokumen dan assessment dokumen GCG tahun {selectedYear}
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white/20 rounded-md">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Progress Keseluruhan</h3>
                <p className="text-purple-100 text-xs">Progress Keseluruhan Tahun {selectedYear}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.uploadedFiles}/{stats.totalChecklist}</div>
              <div className="text-purple-100 text-xs">
                {stats.progress}% selesai
              </div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
              style={{ width: `${stats.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Analysis Cards Grid / Swiper */}
      <div className="relative">
        {showAllAspects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allAnalysisData.map((data, index) => (
              <AnalysisCard 
                key={index} 
                {...data} 
                onClick={() => handleAspectClick(data.title)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div ref={sliderRef} className="keen-slider">
              {allAnalysisData.map((data, index) => (
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
        )}
        {/* View All Button */}
        {aspectStats.length > 4 && (
          <div className="flex justify-center mt-6">
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

export default DashboardStats; 