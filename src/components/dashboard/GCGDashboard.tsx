import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Enhanced mapping warna untuk setiap aspek (I-VI) with better contrast
const aspekColorMap: Record<string, string> = {
  I: '#9EDDFF',
  II: '#80C4E9',
  III: 'rgba(123, 211, 234, 1)',
  IV: '#578FCA', 
  V: '#3674B5',
  VI: '#638889',
};

interface TableDataItem {
  id: string;
  aspek: string;
  deskripsi: string;
  jumlah_parameter: number;
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
}

interface ProcessedGCGData {
  year: number;
  totalScore: number;
  sections: SectionData[];
  hasLevel2Data: boolean;
  penilai?: string;
  penjelasan?: string;
}

interface SectionData {
  name: string;
  romanNumeral: string;
  capaian: number;
  height: number;
  color: string;
  bobot?: number;
  skor?: number;
  jumlah_parameter?: number;
}

interface GCGDashboardProps {
  tableData: TableDataItem[];
  selectedYear: number;
  auditor?: string;
}

const GCGDashboard: React.FC<GCGDashboardProps> = ({ tableData, selectedYear, auditor = 'Manual Input' }) => {
  const [hovered, setHovered] = useState<{year: number, section: string} | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Convert tableData to ProcessedGCGData format
  const processedData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    console.log('🔍 GCGDashboard: Processing tableData:', tableData);
    console.log('🔍 GCGDashboard: Full sample data with types:', tableData.slice(0, 3).map((item, idx) => ({
      index: idx,
      id: item.id,
      aspek: `"${item.aspek}" (${typeof item.aspek})`,
      skor: `"${item.skor}" (${typeof item.skor})`,
      bobot: `"${item.bobot}" (${typeof item.bobot})`,
      jumlah_parameter: `"${item.jumlah_parameter}" (${typeof item.jumlah_parameter})`,
      capaian: `"${item.capaian}" (${typeof item.capaian})`,
      deskripsi: `"${item.deskripsi}"`
    })));
    
    // Test parsing on first item to debug
    if (tableData.length > 0) {
      const testItem = tableData[0];
      console.log('🧪 Testing parsing on first item:', {
        original_skor: testItem.skor,
        skor_type: typeof testItem.skor,
        parseFloat_result: parseFloat(testItem.skor as any),
        is_string: typeof testItem.skor === 'string',
        is_number: typeof testItem.skor === 'number',
        is_nan: isNaN(testItem.skor as any)
      });
    }

    // Group by aspek (Roman numerals) with proper number parsing
    const aspectGroups = tableData.reduce((acc, item) => {
      const roman = item.aspek;
      if (!acc[roman]) {
        acc[roman] = [];
      }
      acc[roman].push(item);
      return acc;
    }, {} as Record<string, TableDataItem[]>);

    // Calculate total score and sections with robust number conversion
    const totalScore = tableData.reduce((sum, item) => {
      let skorValue = 0;
      if (typeof item.skor === 'string') {
        // Handle string values including decimals
        skorValue = parseFloat(item.skor) || 0;
      } else if (typeof item.skor === 'number') {
        skorValue = isNaN(item.skor) ? 0 : item.skor;
      }
      console.log(`Item ${item.aspek}: skor=${item.skor} (type: ${typeof item.skor}) -> parsed: ${skorValue}`);
      return sum + skorValue;
    }, 0);
    
    const sections: SectionData[] = Object.entries(aspectGroups).map(([roman, items]) => {
      const aspectScore = items.reduce((sum, item) => {
        let skorValue = 0;
        if (typeof item.skor === 'string') {
          skorValue = parseFloat(item.skor) || 0;
        } else if (typeof item.skor === 'number') {
          skorValue = isNaN(item.skor) ? 0 : item.skor;
        }
        return sum + skorValue;
      }, 0);
      
      const aspectBobot = items.reduce((sum, item) => {
        let bobotValue = 0;
        if (typeof item.bobot === 'string') {
          bobotValue = parseFloat(item.bobot) || 0;
        } else if (typeof item.bobot === 'number') {
          bobotValue = isNaN(item.bobot) ? 0 : item.bobot;
        }
        return sum + bobotValue;
      }, 0);
      
      // Use the capaian values calculated in PenilaianGCG instead of recalculating
      // This preserves the negative bobot exception logic
      const aspectCapaian = items.length > 0 ? 
        items.reduce((sum, item) => sum + item.capaian, 0) / items.length : 0;
      
      console.log(`Aspek ${roman}: score=${aspectScore}, bobot=${aspectBobot}, capaian=${aspectCapaian}%`);
      
      return {
        name: `Aspek ${roman}`,
        romanNumeral: roman,
        capaian: aspectCapaian,
        height: aspectScore,
        color: aspekColorMap[roman] || '#9EDDFF',
        bobot: aspectBobot,
        skor: aspectScore,
        jumlah_parameter: items.reduce((sum, item) => {
          let paramValue = 0;
          if (typeof item.jumlah_parameter === 'string') {
            paramValue = parseInt(item.jumlah_parameter) || 0;
          } else if (typeof item.jumlah_parameter === 'number') {
            paramValue = isNaN(item.jumlah_parameter) ? 0 : Math.floor(item.jumlah_parameter);
          }
          return sum + paramValue;
        }, 0)
      };
    });

    const yearData: ProcessedGCGData = {
      year: selectedYear,
      totalScore,
      sections,
      hasLevel2Data: true, // Since we have detailed data
      penilai: auditor,
      penjelasan: totalScore >= 85 ? 'Sangat Baik' : totalScore >= 70 ? 'Baik' : totalScore >= 60 ? 'Cukup' : 'Kurang'
    };

    console.log('GCGDashboard: Final processed data:', {
      totalScore,
      sectionsCount: sections.length,
      sections: sections.map(s => ({ roman: s.romanNumeral, score: s.skor, capaian: s.capaian }))
    });

    return [yearData];
  }, [tableData, selectedYear]);

  if (!processedData || processedData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Tidak ada data untuk ditampilkan.</p>
        </CardContent>
      </Card>
    );
  }

  const data = processedData;
  
  // Dynamic Y axis calculation
  const rawMinScore = Math.min(...data.map(d => d.totalScore));
  const rawMaxScore = Math.max(...data.map(d => d.totalScore));
  let minScore = Math.max(0, rawMinScore - 10);
  let maxScore = Math.min(100, rawMaxScore + 10);
  
  // If min and max are equal, force a range
  if (minScore === maxScore) {
    minScore = Math.max(0, minScore - 10);
    maxScore = Math.min(100, maxScore + 10);
  }
  
  const chartHeight = Math.max(window.innerHeight - 300, 450); // Dynamic height based on screen size

  // Performance badge color based on total score
  const getPerformanceBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';  
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Skor</p>
                <p className="text-2xl font-bold text-gray-900">{data[0].totalScore.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Aspek</p>
                <p className="text-2xl font-bold text-gray-900">{data[0].sections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Aspek Terbaik</p>
                <p className="text-lg font-bold text-gray-900">
                  {data[0].sections.reduce((best, current) => 
                    current.capaian > best.capaian ? current : best
                  ).romanNumeral}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={`${getPerformanceBadgeColor(data[0].totalScore)} text-white`}>
                  {data[0].penjelasan}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Visualisasi Skor GCG {selectedYear}</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Analisis performa per aspek dengan total skor {data[0].totalScore.toFixed(2)}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">

        <div className="w-full overflow-x-auto">
          <div className="relative" style={{ minWidth: '400px', minHeight: '450px' }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500" style={{height: `${chartHeight}px`}}>
              {[...Array(6)].map((_, i) => {
                const value = minScore + (i * (maxScore - minScore) / 5);
                const bottom = (i * chartHeight) / 5;
                return (
                  <div key={i} className="flex items-center" style={{position:'absolute', bottom: `${bottom}px`}}>
                    <span className="w-10 text-right pr-2">{value.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>

            {/* Chart area */}
            <div className="ml-12 relative" style={{ height: `${chartHeight}px` }}>
              {/* Grid lines */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-gray-200"
                    style={{ top: `${(i * chartHeight) / 5}px` }}
                  />
                ))}
              </div>

              {/* Enhanced Bar with better animations */}
              <div className="relative h-full flex items-end justify-center">
                {data.map((yearData) => {
                  const barHeight = ((yearData.totalScore - minScore) / (maxScore - minScore)) * chartHeight;
                  const isHoveredBar = hoveredBar === yearData.year;
                  return (
                    <div key={yearData.year} className="flex flex-col items-center">
                      <div
                        className={`relative flex flex-col items-center justify-end rounded-lg bg-gradient-to-t from-gray-50 to-white transition-all duration-300 ${
                          isHoveredBar ? 'shadow-2xl scale-105' : 'shadow-md hover:shadow-lg'
                        }`}
                        style={{ height: `${chartHeight + 100}px`, width: '140px', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredBar(yearData.year)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Enhanced bar with shadow and animation */}
                        <div 
                          className={`transition-all duration-500 ease-out ${isHoveredBar ? 'shadow-lg' : ''}`}
                          style={{
                            height: `${barHeight}px`, 
                            width: '120px', 
                            position: 'absolute', 
                            bottom: '100px', 
                            left: '50%', 
                            transform: 'translateX(-50%)',
                            borderRadius: '8px 8px 0 0',
                            overflow: 'hidden',
                            border: isHoveredBar ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          {/* Sections */}
                          {yearData.sections.map((section, sectionIndex) => {
                            const sectionColor = aspekColorMap[section.romanNumeral] || section.color;
                            const sectionHeight = (section.height / yearData.totalScore) * barHeight;
                            const bottomOffset = yearData.sections
                              .slice(0, sectionIndex)
                              .reduce((sum, s) => sum + (s.height / yearData.totalScore) * barHeight, 0);
                            const isHovered = hovered && hovered.year === yearData.year && hovered.section === section.name;
                            const faded = hovered && hovered.year === yearData.year && hovered.section !== section.name;
                            
                            return (
                              <div
                                key={section.name}
                                className={`absolute w-full border border-white/30 cursor-pointer transition-all duration-300 hover:border-white/50 ${
                                  isHovered ? 'scale-110 z-10' : ''
                                }`}
                                style={{
                                  height: `${sectionHeight}px`,
                                  bottom: `${bottomOffset}px`,
                                  backgroundColor: sectionColor,
                                  opacity: isHovered ? 1 : faded ? 0.5 : 0.95,
                                  zIndex: isHovered ? 10 : 1,
                                  borderRadius: sectionIndex === 0 ? '0 0 8px 8px' : 
                                               sectionIndex === yearData.sections.length - 1 ? '8px 8px 0 0' : '0',
                                  boxShadow: isHovered ? '0 4px 20px rgba(0,0,0,0.15)' : undefined,
                                }}
                                onMouseEnter={() => setHovered({year: yearData.year, section: section.name})}
                                onMouseLeave={() => setHovered(null)}
                              >
                                {/* Enhanced section label with better visibility */}
                                {sectionHeight > 25 && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`text-xs font-bold text-white text-center leading-tight px-2 py-1 rounded ${
                                      isHovered ? 'bg-black/20 backdrop-blur-sm' : ''
                                    }`}>
                                      <div className="text-sm">Aspek {section.romanNumeral}</div>
                                      <div className="text-xs opacity-95 font-medium">
                                        {section.capaian.toFixed(1)}%
                                      </div>
                                      {isHovered && (
                                        <div className="text-xs mt-1 opacity-90">
                                          Skor: {section.skor?.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hover tooltip for narrow sections */}
                                {isHovered && sectionHeight <= 25 && (
                                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-20">
                                    <div className="text-center">
                                      <div>Aspek {section.romanNumeral}</div>
                                      <div>{section.capaian.toFixed(1)}%</div>
                                      <div>Skor: {section.skor?.toFixed(2)}</div>
                                    </div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Enhanced score display at top of bar */}
                          <div className={`absolute left-1/2 transform -translate-x-1/2 text-center transition-all duration-300 ${
                            isHoveredBar ? 'scale-110' : ''
                          }`} style={{top: '-30px'}}>
                            <div className={`bg-white px-3 py-1 rounded-full shadow-md border-2 ${
                              isHoveredBar ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                            }`}>
                              <div className="text-lg font-bold text-gray-800">{yearData.totalScore.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced year label at bottom */}
                        <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center justify-center text-center bg-gradient-to-t from-white to-gray-50 rounded-b-lg py-3 transition-all duration-300 ${
                          isHoveredBar ? 'border-t-2 border-blue-200 shadow-inner' : 'border-t border-gray-200'
                        }`} style={{minHeight: 100}}>
                          <div className={`text-xl font-bold transition-colors duration-300 ${
                            isHoveredBar ? 'text-blue-600' : 'text-gray-800'
                          }`}>{yearData.year}</div>
                          {yearData.penilai && (
                            <div className="text-xs text-gray-600 leading-tight mt-1">{yearData.penilai}</div>
                          )}
                          {yearData.penjelasan && (
                            <Badge className={`mt-2 text-xs ${getPerformanceBadgeColor(yearData.totalScore)} text-white`}>
                              {yearData.penjelasan}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Enhanced Legend with detailed information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Detail Skor per Aspek</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data[0].sections.map((section) => (
              <div key={section.romanNumeral} 
                   className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div 
                  className="w-6 h-6 rounded-lg flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: aspekColorMap[section.romanNumeral] || section.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Aspek {section.romanNumeral}</span>
                    <Badge variant="outline" className="text-xs">
                      {section.capaian.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>Skor: {section.skor?.toFixed(2)}</span>
                    {section.bobot && (
                      <span className="ml-3">Bobot: {section.bobot.toFixed(2)}</span>
                    )}
                  </div>
                  {section.jumlah_parameter && (
                    <div className="text-xs text-gray-500 mt-1">
                      Parameter: {section.jumlah_parameter}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCGDashboard;