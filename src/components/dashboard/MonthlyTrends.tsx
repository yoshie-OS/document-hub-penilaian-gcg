import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { TrendingUp, Building2, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface MonthlyTrendsProps {
  className?: string;
}

interface SubdirektoratProgress {
  subdirektorat: string;
  percent: number;
  progress: number;
  target: number;
  divisions: Array<{ name: string; count: number }>;
  status: 'completed' | 'in_progress' | 'pending';
}

const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ className }) => {
  const { selectedYear } = useYear();
  const { getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();
  const { subdirektorat: strukturSubdirektorat } = useStrukturPerusahaan();

  // Data progres per subdirektorat (berdasarkan dokumen yang diupload) - REAL-TIME
  const chartData = useMemo(() => {
    if (!selectedYear) return [];
    
    // Get checklist items dan uploaded files untuk tahun yang dipilih
    const yearChecklist = checklist?.filter(item => item.tahun === selectedYear) || [];
    const yearFiles = getFilesByYear(selectedYear) || [];

    // Get assignments untuk tahun yang dipilih
    const storedAssignments = localStorage.getItem('checklistAssignments');
    let yearAssignments: any[] = [];
    
    if (storedAssignments) {
      try {
        const allAssignments = JSON.parse(storedAssignments);
        yearAssignments = allAssignments.filter((assignment: any) => 
          assignment.tahun === selectedYear
        );
      } catch (error) {
        console.error('Error parsing assignments:', error);
      }
    }

    // Gunakan daftar subdirektorat dari StrukturPerusahaanContext untuk tahun terpilih
    const subdirs: string[] = (strukturSubdirektorat || [])
      .map((s) => s?.nama)
      .filter((name): name is string => !!name && typeof name === 'string' && name.trim() !== '');

    return subdirs.map((subName) => {
      // Pastikan subName adalah string yang valid
      if (!subName || typeof subName !== 'string') {
        console.warn('Invalid subName:', subName);
        return null;
      }
      
      // Hilangkan awalan "Sub Direktorat " agar rapi
      const cleanName = subName.replace(/^\s*Sub\s*Direktorat\s*/i, '').trim();
      
      // Hitung target dari assignments untuk subdirektorat ini
      // Target = total checklist items yang diassign ke subdirektorat ini
      const subdirAssignments = yearAssignments.filter(a => a.subdirektorat === subName);
      const target = subdirAssignments.length;
      
      // Hitung progress dari dokumen yang sudah diupload untuk subdirektorat ini
      // Progress = checklist items yang sudah diupload (berdasarkan checklistId)
      const uploadedChecklistIds = new Set(yearFiles.map(file => file.checklistId));
      const progress = subdirAssignments.filter(assignment => 
        uploadedChecklistIds.has(assignment.checklistId)
      ).length;
      
      // Breakdown per aspek (bukan divisi) untuk lebih relevan
      const aspectCounts: Record<string, number> = {};
      yearFiles.forEach(file => {
        if (file.subdirektorat === subName && file.aspect) {
          const aspect = file.aspect.trim() || 'Tidak Diberikan Aspek';
          aspectCounts[aspect] = (aspectCounts[aspect] || 0) + 1;
        }
      });
      const aspects = Object.entries(aspectCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
      
      // Hitung persentase berdasarkan target dan progress
      const percent = target > 0 ? (progress / target) * 100 : 0;
      
      // Tentukan status berdasarkan progress
      let status: 'completed' | 'in_progress' | 'pending';
      if (percent >= 100) status = 'completed';
      else if (percent > 0) status = 'in_progress';
      else status = 'pending';
      
      console.log(`Progress for ${subName}:`, {
        target,
        progress,
        percent,
        status,
        assignments: subdirAssignments.length
      });
      
      return {
        subdirektorat: cleanName,
        percent,
        progress,
        target,
        divisions: aspects, // Gunakan aspects sebagai divisions untuk konsistensi
        status
      };
    }).filter(Boolean); // Filter out null values
  }, [selectedYear, checklist, getFilesByYear, strukturSubdirektorat]);

  if (!chartData.length) return (
    <Card className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <span>Progres Pengerjaan</span>
        </CardTitle>
        <CardDescription>
          Tidak ada data subdirektorat untuk tahun ini.
        </CardDescription>
      </CardHeader>
    </Card>
  );

  // Ukuran dinamis chart agar tidak perlu scroll horizontal
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || 0;
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const svgWidth = Math.max(700, containerWidth || 700);
  const leftMargin = 60;
  const rightMargin = 40;
  const innerWidth = Math.max(1, svgWidth - leftMargin - rightMargin);
  // Vertikal: beri jarak lebih luas antar grid 0..100
  const topDataY = 30;
  const bottomDataY = 220;
  const valueHeight = bottomDataY - topDataY; // 190px tinggi area nilai
  const labelBaselineY = bottomDataY + 30; // posisi label badge
  const svgHeight = labelBaselineY + 20; // tinggi total svg
  const getX = (index: number) => {
    const n = chartData.length;
    if (n <= 1) return leftMargin + innerWidth / 2;
    return leftMargin + (index * innerWidth) / (n - 1);
  };

  // Abbreviation agar label satu baris rapi dan tidak saling menumpuk
  const abbreviate = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    const blacklist = new Set(['SUB', 'DIREKTORAT', 'AND', 'DAN', 'OF', 'THE']);
    const initials = words
      .map((w) => w.replace(/[^A-Za-z]/g, ''))
      .filter((w) => w.length > 0)
      .filter((w) => !blacklist.has(w.toUpperCase()))
      .map((w) => w[0].toUpperCase())
      .join('');
    let abbr = initials.slice(0, 4);
    if (abbr.length < 2) abbr = (name.slice(0, 4) || 'NA').toUpperCase();
    return abbr;
  };

  // Auto-highlight index agar chart tetap terasa hidup tanpa scroll
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (!chartData.length || showAll) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % chartData.length);
    }, 2500);
    return () => clearInterval(id);
  }, [chartData, showAll]);

  // removed auto-scroll helper and slider

  return (
    <Card className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <span>Progres Pengerjaan</span>
        </CardTitle>
        <CardDescription>
          Progress pengerjaan dokumen GCG per subdirektorat tahun {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Controls & Indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
              {showAll ? 'Semua Subdirektorat' : (chartData[activeIndex]?.subdirektorat || '—')}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`cursor-pointer ${showAll ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                onClick={() => setShowAll(false)}
              >
                Fokus
              </Badge>
              <Badge
                variant="secondary"
                className={`cursor-pointer ${showAll ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                onClick={() => setShowAll(true)}
              >
                Tampilkan semua
              </Badge>
            </div>
          </div>

          {/* Line Chart Persentase - auto animate like radar */}
          <div ref={containerRef} className="relative overflow-x-hidden pb-2">
            <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full">
              {/* Grid Lines dan label Y (0% - 100%) */}
              {Array.from({ length: 11 }, (_, i) => {
                const percent = i * 10;
                const y = bottomDataY - (percent / 100) * valueHeight;
                return (
                  <g key={`grid-y-${i}`}>
                    <line
                      x1={leftMargin}
                      y1={y}
                      x2={svgWidth - rightMargin}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    <text
                      x={leftMargin - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-500"
                    >
                      {percent}%
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {chartData.map((data, index) => {
                const x = getX(index);
                const label = data.subdirektorat;
                const abbr = abbreviate(label);
                const badgePaddingX = 6;
                const approxCharWidth = 6;
                const badgeWidth = Math.max(28, abbr.length * approxCharWidth + badgePaddingX * 2);
                const badgeHeight = 14;
                const y = labelBaselineY;
                return (
                  <g key={`label-${index}`}>
                    <rect
                      x={x - badgeWidth / 2}
                      y={y - badgeHeight}
                      width={badgeWidth}
                      height={badgeHeight}
                      rx={7}
                      ry={7}
                      fill="#ffffff"
                      stroke={!showAll && index === activeIndex ? '#93c5fd' : '#e5e7eb'}
                    />
                    <text
                      x={x}
                      y={y - 4}
                      textAnchor="middle"
                      className="fill-gray-700"
                      style={{ fontWeight: 700, fontSize: 9 }}
                    >
                      <title>{label}</title>
                      {abbr}
                    </text>
                  </g>
                );
              })}

              {/* Line Chart Persentase */}
              <path
                d={chartData.map((data, index) => {
                  const x = getX(index);
                  const y = bottomDataY - (data.percent / 100) * valueHeight;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {chartData.map((data, index) => {
                const x = getX(index);
                const y = bottomDataY - (data.percent / 100) * valueHeight;
                return (
                  <g key={`point-group-${index}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={index === activeIndex ? 8 : 6}
                      fill={index === activeIndex ? 'rgb(37, 99, 235)' : 'rgb(59, 130, 246)'}
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* Percentage Label */}
                    <text
                      x={x}
                      y={y - (index === activeIndex ? 16 : 14)}
                      textAnchor="middle"
                      className="fill-gray-700 font-bold"
                      style={{ fontSize: '10px' }}
                    >
                      {Math.round(data.percent)}%
                    </text>
                  </g>
                );
              })}

              {/* Active index marker */}
              {!showAll && chartData.length > 1 && (
                <line
                  x1={getX(activeIndex)}
                  y1={topDataY}
                  x2={getX(activeIndex)}
                  y2={bottomDataY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  opacity="0.7"
                />
              )}

              {/* Area under line */}
              <path
                d={`M ${leftMargin} ${bottomDataY} ${chartData.map((data, index) => {
                  const x = getX(index);
                  const y = bottomDataY - (data.percent / 100) * valueHeight;
                  return `L ${x} ${y}`;
                }).join(' ')} L ${leftMargin + innerWidth} ${bottomDataY} Z`}
                fill="rgba(59, 130, 246, 0.1)"
              />
            </svg>
          </div>

          {/* Legend mapping abbr -> full name (tanpa scroll) */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {chartData.map((d, i) => (
              <div key={i} className={`flex items-center space-x-2 text-xs ${!showAll && i === activeIndex ? 'text-blue-700' : 'text-gray-600'}`}>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border ${i === activeIndex ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  {abbreviate(d.subdirektorat)}
                </span>
                <span className="truncate" title={d.subdirektorat}>{d.subdirektorat}</span>
              </div>
            ))}
          </div>

          {/* Removed Progres Subdirektorat section as requested */}

          {/* Breakdown Penugasan Subdirektorat - REAL-TIME */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Breakdown Penugasan Subdirektorat</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chartData.map((data, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Header dengan status indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={data.subdirektorat}>
                      {data.subdirektorat}
                    </div>
                    <div className="flex items-center space-x-1">
                      {data.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-600" title="Selesai" />
                      )}
                      {data.status === 'in_progress' && (
                        <Clock className="w-4 h-4 text-yellow-600" title="Sedang Berjalan" />
                      )}
                      {data.status === 'pending' && (
                        <AlertCircle className="w-4 h-4 text-red-600" title="Belum Dimulai" />
                      )}
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <span className="text-lg font-bold text-blue-600">{data.progress}</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-lg font-bold text-gray-700">{data.target}</span>
                    <span className="text-sm text-gray-500">dokumen</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        data.status === 'completed' ? 'bg-green-500' :
                        data.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: `${data.percent}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    ></div>
                  </div>

                  {/* Percentage */}
                  <div className="text-center mb-3">
                    <span className={`text-sm font-semibold ${
                      data.status === 'completed' ? 'text-green-600' :
                      data.status === 'in_progress' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(data.percent)}% Selesai
                    </span>
                  </div>

                  {/* Breakdown per Aspek */}
                  {data.divisions.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">Breakdown per Aspek:</div>
                      <div className="space-y-1">
                        {data.divisions.slice(0, 3).map((aspect, aspectIndex) => (
                          <div key={aspectIndex} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate max-w-[80px]" title={aspect.name}>
                              {aspect.name}
                            </span>
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {aspect.count}
                            </Badge>
                          </div>
                        ))}
                        {data.divisions.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{data.divisions.length - 3} aspek lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrends; 