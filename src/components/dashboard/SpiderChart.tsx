import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useYear } from '@/contexts/YearContext';
import { Target, Eye, Shield, Heart, Users, Building2, PieChart } from 'lucide-react';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';

interface SpiderChartProps {
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

// Subdirektorat didapat dari StrukturPerusahaanContext untuk tahun aktif

const SpiderChart: React.FC<SpiderChartProps> = ({ className }) => {
  const { selectedYear } = useYear();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { checklist, aspects, getAspectsByYear } = useChecklist();
  const { subdirektorat } = useStrukturPerusahaan();
  const [selectedSubDirektorat, setSelectedSubDirektorat] = useState<string | null>(null);
  const [currentSubDirektoratIndex, setCurrentSubDirektoratIndex] = useState(0);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(true);

  // Get actual assignment data from localStorage
  const getAssignmentData = () => {
    try {
      const assignments = localStorage.getItem('checklistAssignments');
      if (!assignments) return [];
      return JSON.parse(assignments) as ChecklistAssignment[];
    } catch (error) {
      console.error('Error getting assignment data:', error);
      return [];
    }
  };

  // Listen to updates from ListGCG and refresh chart
  useEffect(() => {
    const onUpdate = () => {
      // Trigger recompute by toggling selectedSubDirektorat (no-op)
      setSelectedSubDirektorat((prev) => (prev ? `${prev}` : prev));
    };
    
    const onAspectsUpdate = () => {
      // Trigger recompute when aspects are updated
      setSelectedSubDirektorat((prev) => (prev ? `${prev}` : prev));
    };
    
    window.addEventListener('assignmentsUpdated', onUpdate);
    window.addEventListener('aspectsUpdated', onAspectsUpdate);
    
    return () => {
      window.removeEventListener('assignmentsUpdated', onUpdate);
      window.removeEventListener('aspectsUpdated', onAspectsUpdate);
    };
  }, []);

  // Auto-rotate through sub-direktorat
  useEffect(() => {
    if (!isAutoRotateEnabled) return;

    const interval = setInterval(() => {
      setCurrentSubDirektoratIndex((prev) => {
        const options = (subdirektorat || []).map(s => s.nama).filter(Boolean);
        if (options.length === 0) return 0;
        const nextIndex = (prev + 1) % options.length;
        setSelectedSubDirektorat(options[nextIndex] as string);
        return nextIndex;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoRotateEnabled, subdirektorat]);

  const normalizeAspek = (s: string) => s.replace(/\s+/g, ' ').trim();

  const chartData = useMemo(() => {
    if (!selectedYear) return null;

    const yearDocuments = getDocumentsByYear(selectedYear);
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const assignments = getAssignmentData();
    const yearAssignments = assignments.filter(assignment => assignment.tahun === selectedYear);

    // Get aspects from context for the selected year
    const yearAspects = getAspectsByYear(selectedYear);
    
    // Map aspects to chart data with icons and colors
    const aspects = yearAspects.map((aspek, index) => {
      const icons = [Target, Eye, Shield, Heart, Users, Building2];
      const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600', 'text-indigo-600'];
      const IconComponent = icons[index % icons.length];
      const color = colors[index % colors.length];
      
      return {
        name: aspek.nama,
        icon: <IconComponent className="w-4 h-4" />,
        color: color
      };
    });

    const data = aspects.map(aspect => {
      // Get all checklist items for this aspect (total available items - Y)
      const aspectChecklistItems = yearChecklist.filter(item => 
        normalizeAspek(item.aspek) === normalizeAspek(aspect.name)
      );

      // Get all assignments for this aspect
      const aspectAssignments = yearAssignments.filter(assignment => 
        normalizeAspek(assignment.aspek) === normalizeAspek(aspect.name)
      );

      // Calculate total available checklist items for this aspect (Y - total items sesungguhnya)
      const totalAvailableItems = aspectChecklistItems.length;

      // Calculate distribution percentage for each sub-direktorat based on total available items
      const subOptions = (subdirektorat || []).map(s => s.nama).filter(Boolean) as string[];
      const subDirektoratDistribution = subOptions.map(subName => {
        const subDirAssignments = aspectAssignments.filter(assignment => 
          assignment.subdirektorat === subName
        );
        
        // Calculate percentage based on total available items, not just assigned items
        const percentage = totalAvailableItems > 0 
          ? (subDirAssignments.length / totalAvailableItems) * 100 
          : 0;

        return {
          subDirektorat: subName,
          label: subName,
          count: subDirAssignments.length,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
          totalAvailable: totalAvailableItems
        };
      });

      // Filter by selected sub-direktorat if any
      let filteredAssignments = aspectAssignments;
      if (selectedSubDirektorat) {
        filteredAssignments = aspectAssignments.filter(assignment => 
          assignment.subdirektorat === selectedSubDirektorat
        );
      }

      // Get documents for these assignments
      const assignmentIds = filteredAssignments.map(a => a.checklistId);
      const aspectDocs = yearDocuments.filter(doc => 
        assignmentIds.includes(doc.checklistId)
      );

      // Calculate statistics
      const totalAssigned = filteredAssignments.length;
      const completedCount = aspectDocs.length;
      const progress = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;

      // Get unique sub-direktorats assigned to this aspect
      const assignedSubDirektorats = [...new Set(filteredAssignments.map(a => a.subdirektorat))];

      return {
        ...aspect,
        progress,
        documents: aspectDocs.length,
        checklist: totalAssigned,
        uploaded: completedCount,
        assignedSubDirektorats,
        totalAssignments: totalAvailableItems, // Total sesungguhnya dari checklist yang tersedia
        subDirektoratDistribution
      };
    });

    return data;
  }, [selectedYear, documents, checklist, getDocumentsByYear, selectedSubDirektorat]);

  if (!chartData) return null;

  // Calculate max percentage for scaling the radar chart
  const maxPercentage = Math.max(...chartData.map(d => 
    Math.max(...d.subDirektoratDistribution.map(sd => sd.percentage))
  ));
  
  const radius = 120;
  const centerX = 150;
  const centerY = 150;
  const labelRadius = radius + 40; // Radius untuk label agar berada di sisi segi enam

  const getPoint = (angle: number, value: number) => {
    const normalizedValue = value / (maxPercentage || 100);
    const x = centerX + Math.cos(angle) * radius * normalizedValue;
    const y = centerY + Math.sin(angle) * radius * normalizedValue;
    return { x, y };
  };

  const getLabelPosition = (angle: number) => {
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;
    return { x, y };
  };

  const generatePolygonPoints = () => {
    const points = chartData.map((data, index) => {
      const angle = (index * 2 * Math.PI) / chartData.length - Math.PI / 2;
      
      // Use the percentage of the selected sub-direktorat for this aspect
      let percentage = 0;
      if (selectedSubDirektorat) {
        const subDirData = data.subDirektoratDistribution.find(sd => 
          sd.subDirektorat === selectedSubDirektorat
        );
        percentage = subDirData ? subDirData.percentage : 0;
      } else {
        // If no sub-direktorat selected, use average percentage
        const avgPercentage = data.subDirektoratDistribution.reduce((sum, sd) => sum + sd.percentage, 0) / data.subDirektoratDistribution.length;
        percentage = avgPercentage;
      }
      
      const point = getPoint(angle, percentage);
      return `${point.x},${point.y}`;
    });
    return points.join(' ');
  };

  const generateGridLines = () => {
    const lines = [];
    for (let i = 1; i <= 5; i++) {
      const scale = i / 5;
      const points = chartData.map((_, index) => {
        const angle = (index * 2 * Math.PI) / chartData.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius * scale;
        const y = centerY + Math.sin(angle) * radius * scale;
        return `${x},${y}`;
      });
      lines.push(points.join(' '));
    }
    return lines;
  };

  const generateAxisLines = () => {
    return chartData.map((_, index) => {
      const angle = (index * 2 * Math.PI) / chartData.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      return { x, y, angle };
    });
  };

  const handleSubDirektoratClick = (subDirektorat: string) => {
    setSelectedSubDirektorat(subDirektorat);
    const options = (subdirektorat || []).map(s => s.nama).filter(Boolean) as string[];
    const index = options.findIndex(s => s === subDirektorat);
    if (index !== -1) setCurrentSubDirektoratIndex(index);
    // Disable auto-rotate when user clicks manually
    setIsAutoRotateEnabled(false);
  };

  const handleAutoRotateToggle = () => {
    setIsAutoRotateEnabled(!isAutoRotateEnabled);
  };

  // Get assignment statistics for the selected sub-direktorat
  const getAssignmentStats = () => {
    if (!selectedSubDirektorat) return null;
    
    const assignments = getAssignmentData();
    const yearAssignments = assignments.filter(assignment => 
      assignment.tahun === selectedYear && 
      assignment.subdirektorat === selectedSubDirektorat
    );

    const totalAssigned = yearAssignments.length;
    const completedCount = yearAssignments.filter(assignment => {
      const yearDocuments = getDocumentsByYear(selectedYear);
      return yearDocuments.some(doc => doc.checklistId === assignment.checklistId);
    }).length;

    return {
      totalAssigned,
      completedCount,
      progress: totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0
    };
  };

  const assignmentStats = getAssignmentStats();

  const subOptions = (subdirektorat || []).map(s => s.nama).filter(Boolean) as string[];

  return (
    <Card className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-6 h-6 text-blue-600" />
          <span>Performance Radar - Distribusi Penugasan</span>
        </CardTitle>
        <CardDescription>
          Visualisasi distribusi penugasan per aspek berdasarkan total item (Y) dan persentase penyebaran ke sub-direktorat
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Assignment Summary: pindah ke kiri agar konsisten dengan Progres Pengerjaan */}
        <div className="mb-4 flex items-center justify-start">
          <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm shadow-sm">
            {selectedSubDirektorat
              ? selectedSubDirektorat
              : 'Tidak ada sub-direktorat aktif'}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg width="300" height="300" viewBox="0 0 300 300">
              {/* Grid Lines */}
              {generateGridLines().map((points, index) => (
                <polygon
                  key={`grid-${index}`}
                  points={points}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}

              {/* Axis Lines */}
              {generateAxisLines().map((axis, index) => (
                <line
                  key={`axis-${index}`}
                  x1={centerX}
                  y1={centerY}
                  x2={axis.x}
                  y2={axis.y}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
              ))}

              {/* Data Polygon */}
              <polygon
                points={generatePolygonPoints()}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                className="animate-pulse"
              />

              {/* Data Points */}
              {chartData.map((data, index) => {
                const angle = (index * 2 * Math.PI) / chartData.length - Math.PI / 2;
                
                // Use the percentage of the selected sub-direktorat for this aspect
                let percentage = 0;
                if (selectedSubDirektorat) {
                  const subDirData = data.subDirektoratDistribution.find(sd => 
                    sd.subDirektorat === selectedSubDirektorat
                  );
                  percentage = subDirData ? subDirData.percentage : 0;
                } else {
                  // If no sub-direktorat selected, use average percentage
                  const avgPercentage = data.subDirektoratDistribution.reduce((sum, sd) => sum + sd.percentage, 0) / data.subDirektoratDistribution.length;
                  percentage = avgPercentage;
                }
                
                const point = getPoint(angle, percentage);
                return (
                  <circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="rgb(59, 130, 246)"
                  />
                );
              })}

              {/* Center Point */}
              <circle
                cx={centerX}
                cy={centerY}
                r="3"
                fill="rgb(59, 130, 246)"
              />
            </svg>

            {/* Aspect Labels at Corners */}
            {chartData.map((data, index) => {
              const angle = (index * 2 * Math.PI) / chartData.length - Math.PI / 2;
              const labelPos = getLabelPosition(angle);
              const isTop = labelPos.y < centerY;

              // Untuk aspek 2 dan 3 (index 1 dan 2), tidak perlu alignment khusus
              if (index === 1 || index === 2) {
                return (
                  <div
                    key={`label-${index}`}
                    className="absolute"
                    style={{
                      left: labelPos.x + 8,
                      top: labelPos.y,
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white border shadow-sm ${data.color}`}>
                      {data.name}
                    </div>
                  </div>
                );
              }

              // Default alignment untuk aspek lainnya
              return (
                <div
                  key={`label-${index}`}
                  className="absolute"
                  style={{
                    left: labelPos.x,
                    top: labelPos.y,
                    transform: `translate(-50%, ${isTop ? '-100%' : '0%'})`
                  }}
                >
                  <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white border shadow-sm ${data.color}`}>
                    {data.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution Details */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detail Distribusi Penugasan per Aspek:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chartData.map((aspect, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${aspect.color}`}>
                    {aspect.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {aspect.totalAssignments} item tersedia
                  </Badge>
                </div>
                
                {selectedSubDirektorat ? (
                  // Show distribution for selected sub-direktorat
                  <div className="space-y-1">
                    {aspect.subDirektoratDistribution
                      .filter(sd => sd.subDirektorat === selectedSubDirektorat)
                      .map((subDir, sdIndex) => (
                        <div key={sdIndex} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">
                            {subDir.label.replace(/^\s*Sub\s*Direktorat\s*/i, '')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">{subDir.count} item</span>
                            <Badge variant="secondary" className="text-xs">
                              {subDir.percentage}% dari {subDir.totalAvailable} item
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  // Show distribution for all sub-direktorats
                  <div className="space-y-1">
                    {aspect.subDirektoratDistribution
                      .filter(sd => sd.count > 0)
                      .slice(0, 3) // Show only top 3
                      .map((subDir, sdIndex) => (
                        <div key={sdIndex} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">
                            {subDir.label.replace(/^\s*Sub\s*Direktorat\s*/i, '')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">{subDir.count} item</span>
                            <Badge variant="secondary" className="text-xs">
                              {subDir.percentage}% dari {subDir.totalAvailable} item
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {aspect.subDirektoratDistribution.filter(sd => sd.count > 0).length > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{aspect.subDirektoratDistribution.filter(sd => sd.count > 0).length - 3} sub-direktorat lainnya
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show unassigned items if any */}
                {aspect.totalAssignments > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Belum dibagikan:</span>
                      <span>{aspect.totalAssignments - aspect.subDirektoratDistribution.reduce((sum, sd) => sum + sd.count, 0)} item</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filter Sub-Direktorat */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Sub-Direktorat Aktif:</h4>
            <Badge 
              variant="secondary" 
              className={`cursor-pointer transition-all duration-200 ${
                isAutoRotateEnabled 
                  ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
              onClick={handleAutoRotateToggle}
            >
              {isAutoRotateEnabled ? 'Auto-Rotate' : 'Manual'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {subOptions.length === 0 && (
              <div className="text-xs text-gray-500 col-span-full">Belum ada subdirektorat untuk tahun ini</div>
            )}
            {subOptions.map((subName, index) => (
              <div
                key={subName}
                className={`
                  p-2 rounded-lg border cursor-pointer transition-all duration-200 text-xs
                  ${selectedSubDirektorat === subName
                    ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-md'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                  ${index === currentSubDirektoratIndex && isAutoRotateEnabled ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                `}
                onClick={() => handleSubDirektoratClick(subName)}
                >
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  {/* Hilangkan kata 'Sub Direktorat' dari label agar lebih rapi */}
                  <span className="truncate">{String(subName).replace(/^\s*Sub\s*Direktorat\s*/i, '')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpiderChart; 