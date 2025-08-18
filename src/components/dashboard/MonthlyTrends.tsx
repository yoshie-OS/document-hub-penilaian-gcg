import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useYear } from '@/contexts/YearContext';
import { useDirektorat } from '@/contexts/DireksiContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { TrendingUp } from 'lucide-react';
// removed keen-slider as Progres Subdirektorat section is deleted

interface MonthlyTrendsProps {
  className?: string;
}

interface ChecklistAssignment {
  id: number;
  checklistId: number;
  subdirektorat: string;
  aspek: string;
  deskripsi: string;
  tahun: number;
  assignedBy: string;
  assignedAt: Date;
  status: 'assigned' | 'in_progress' | 'completed';
  notes?: string;
}

const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ className }) => {
  const { selectedYear } = useYear();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { subdirektorat: strukturSubdirektorat } = useStrukturPerusahaan();

  // Get assignments data for the selected year
  const assignments = useMemo(() => {
    try {
      const stored = localStorage.getItem('checklistAssignments');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as ChecklistAssignment[];
      return parsed.filter(a => a.tahun === selectedYear);
    } catch (error) {
      console.error('Error getting assignments:', error);
      return [];
    }
  }, [selectedYear]);

  // Listen for assignments updates
  useEffect(() => {
    const handleAssignmentsUpdate = () => {
      // Force re-render when assignments change
      window.location.reload();
    };

    window.addEventListener('assignmentsUpdated', handleAssignmentsUpdate);
    return () => {
      window.removeEventListener('assignmentsUpdated', handleAssignmentsUpdate);
    };
  }, []);

  // Data progres per subdirektorat (berdasarkan dokumen yang diupload)
  const chartData = useMemo(() => {
    if (!selectedYear) return [];
    const yearDocuments = getDocumentsByYear(selectedYear);

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
      
      // Hitung target dari assignments (berapa checklist yang ditugaskan)
      const targetAssignments = assignments.filter(a => a.subdirektorat === subName);
      const target = targetAssignments.length;
      
      // Hitung progress dari dokumen yang sudah diupload
      const subdirDocs = yearDocuments.filter(doc => (doc.subdirektorat || '').trim() === subName);
      const progress = subdirDocs.length;
      
      // Breakdown per divisi
      const divisionCounts: Record<string, number> = {};
      subdirDocs.forEach(doc => {
        const div = (doc.division || '').trim() || 'Divisi Lainnya';
        divisionCounts[div] = (divisionCounts[div] || 0) + 1;
      });
      const divisions = Object.entries(divisionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
      
      // Hitung persentase berdasarkan target dan progress
      const percent = target > 0 ? (progress / target) * 100 : 0;
      
      return {
        subdirektorat: cleanName,
        percent,
        progress,
        target,
        divisions
      };
    }).filter(Boolean); // Filter out null values
  }, [selectedYear, documents, getDocumentsByYear, strukturSubdirektorat, assignments]);

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
                strokeWidth="3"
                className="animate-[dash_3s_ease-in-out_infinite]"
              />

              {/* Data Points */}
              {chartData.map((data, index) => {
                const x = getX(index);
                const y = bottomDataY - (data.percent / 100) * valueHeight;
                return (
                  <circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r={index === activeIndex ? 6 : 4}
                    fill={index === activeIndex ? 'rgb(37, 99, 235)' : 'rgb(59, 130, 246)'}
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                );
              })}

              {/* Active index marker */}
              {!showAll && chartData.length > 1 && (
                <line
                  x1={getX(activeIndex)}
                  y1={topDataY}
                  x2={getX(activeIndex)}
                  y2={bottomDataY}
                  stroke="#bfdbfe"
                  strokeWidth="2"
                  strokeDasharray="4 4"
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

          {/* Breakdown Penugasan Subdirektorat (x/x, nama simple) */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Breakdown Penugasan Subdirektorat</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {chartData.map((data, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-1 text-center truncate">{data.subdirektorat}</div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-base font-bold text-blue-600">{data.progress}/{data.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${data.percent}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    ></div>
                  </div>
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