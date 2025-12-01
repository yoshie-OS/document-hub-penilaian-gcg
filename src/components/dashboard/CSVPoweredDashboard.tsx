import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, Award, Database } from 'lucide-react';
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

interface DashboardDataItem {
  id: string;
  aspek: string;
  deskripsi: string;
  jumlah_parameter: number;
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
  year: number;
  auditor: string;
}

interface ProcessedGCGData {
  year: number;
  totalScore: number;
  sections: SectionData[];
  hasLevel2Data: boolean;
  penilai?: string;
  penjelasan?: string;
  dataSource: 'csv' | 'live' | 'none';
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

interface CSVPoweredDashboardProps {
  selectedYear?: number;
  tableData?: TableDataItem[];
  auditor?: string;
  jenisAsesmen?: string;
}

const CSVPoweredDashboard: React.FC<CSVPoweredDashboardProps> = ({ 
  selectedYear, 
  tableData = [], 
  auditor = 'Manual Input',
  jenisAsesmen = 'Internal'
}) => {
  const [csvData, setCsvData] = useState<Record<number, DashboardDataItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{year: number, section: string} | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Fetch CSV data on component mount
  useEffect(() => {
    const fetchCsvData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard-data');
        const result = await response.json();
        
        if (result.success) {
          console.log('📊 CSV Dashboard data loaded:', result.message);
          
          // Transform years_data to our format
          const transformedData: Record<number, DashboardDataItem[]> = {};
          Object.entries(result.years_data).forEach(([year, yearData]: [string, any]) => {
            transformedData[parseInt(year)] = yearData.data;
          });
          
          setCsvData(transformedData);
          setError(null);
        } else {
          console.log('📋 No CSV dashboard data:', result.message);
          setError(result.message);
        }
      } catch (err) {
        console.error('❌ Failed to load CSV dashboard data:', err);
        setError('Failed to load saved data');
      } finally {
        setLoading(false);
      }
    };

    fetchCsvData();
  }, []);

  // Process data for visualization - show ALL available years for multi-year comparison
  const processedData = useMemo((): ProcessedGCGData[] => {
    const results: ProcessedGCGData[] = [];

    // First, check if we have CSV data - process ALL years for side-by-side comparison
    if (Object.keys(csvData).length > 0) {
      // Process all available years from CSV, sorted by year (newest first for better visual order)
      const yearsToProcess = Object.keys(csvData).map(y => parseInt(y)).sort((a, b) => b - a);
      
      yearsToProcess.forEach(yearNumber => {
        const yearData = csvData[yearNumber];
        if (!yearData) return;
        
        // Group by aspek and calculate totals
        const aspekGroups: Record<string, DashboardDataItem[]> = {};
        yearData.forEach(item => {
          const aspekKey = item.aspek?.trim() || 'Unknown';
          if (!aspekGroups[aspekKey]) {
            aspekGroups[aspekKey] = [];
          }
          aspekGroups[aspekKey].push(item);
        });
        
        // Remove empty or invalid aspek groups
        console.log(`🔍 Before filtering - aspek groups:`, Object.keys(aspekGroups));
        Object.keys(aspekGroups).forEach(key => {
          if (!key || key === 'Unknown' || key === '' || key === 'undefined' || key === 'null') {
            console.log(`🗑️ Removing invalid aspek group: '${key}'`);
            delete aspekGroups[key];
          }
        });
        console.log(`🔍 After filtering - aspek groups:`, Object.keys(aspekGroups));

        console.log(`🔍 Year ${yearNumber} aspek groups:`, Object.keys(aspekGroups));
        console.log(`📊 ALL Year ${yearNumber} data (first 5):`, yearData.slice(0, 5).map(item => ({ aspek: item.aspek, skor: item.skor, bobot: item.bobot, type: item.id })));
        console.log(`📊 Year ${yearNumber} total items: ${yearData.length}`);
        
        // DEBUG: Check for empty or invalid aspek values
        const invalidAspeks = yearData.filter(item => !item.aspek || item.aspek.trim() === '' || item.aspek === 'Unknown');
        if (invalidAspeks.length > 0) {
          console.log(`⚠️ Year ${yearNumber} has ${invalidAspeks.length} items with invalid aspek values:`, invalidAspeks.slice(0, 3));
        }

        // Create sections data
        const sections: SectionData[] = [];
        let totalScore = 0;

        Object.entries(aspekGroups).forEach(([aspek, items]) => {
          const totalBobot = items.reduce((sum, item) => sum + (item.bobot || 0), 0);
          const totalSkor = items.reduce((sum, item) => sum + (item.skor || 0), 0);
          const avgCapaian = items.reduce((sum, item) => sum + (item.capaian || 0), 0) / items.length;
          
          console.log(`📊 Aspek ${aspek}: ${items.length} items, totalSkor: ${totalSkor}, avgCapaian: ${avgCapaian}`);
          
          // Only add sections that have meaningful data (relaxed condition for debugging)
          if (totalSkor >= 0 || items.length > 0) {
            sections.push({
              name: aspek,
              romanNumeral: aspek,
              capaian: avgCapaian,
              height: Math.max(totalSkor, 1), // Ensure minimum height for visibility
              color: aspekColorMap[aspek] || '#cccccc',
              bobot: totalBobot,
              skor: totalSkor,
              jumlah_parameter: items.reduce((sum, item) => sum + (item.jumlah_parameter || 0), 0)
            });

            totalScore += totalSkor;
          } else {
            console.log(`⚠️ Skipping aspek ${aspek} - no meaningful data (skor=${totalSkor}, items=${items.length})`);
          }
        });

        // Sort sections by Roman numeral
        sections.sort((a, b) => {
          const order = ['I', 'II', 'III', 'IV', 'V', 'VI'];
          return order.indexOf(a.romanNumeral) - order.indexOf(b.romanNumeral);
        });

        results.push({
          year: yearNumber,
          totalScore,
          sections,
          hasLevel2Data: sections.length > 0,
          penilai: yearData[0]?.auditor || 'CSV Data',
          dataSource: 'csv'
        });
        
        console.log('📊 Using CSV data for year', yearNumber, ':', sections.length, 'sections');
        console.log('📊 Sections created:', sections.map(s => ({ aspek: s.romanNumeral, skor: s.skor, height: s.height })));
      });
      
      console.log(`🎯 FINAL RESULTS: Created ${results.length} year data objects`);
      results.forEach(result => {
        console.log(`  Year ${result.year}: ${result.sections.length} sections, totalScore=${result.totalScore}`);
      });
      
      if (results.length > 0) {
        return results;
      }
    }

    // Fallback: Use live table data if available and no CSV data
    if (tableData && tableData.length > 0 && selectedYear) {
      console.log('🔴 Using live table data as fallback for year', selectedYear);
      
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
          skorValue = parseFloat(item.skor) || 0;
        } else if (typeof item.skor === 'number') {
          skorValue = isNaN(item.skor) ? 0 : item.skor;
        }
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
        
        // Use the capaian values calculated in PenilaianGCG
        const aspectCapaian = items.length > 0 ? 
          items.reduce((sum, item) => sum + item.capaian, 0) / items.length : 0;
        
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

      results.push({
        year: selectedYear,
        totalScore,
        sections,
        hasLevel2Data: true,
        penilai: auditor,
        dataSource: 'live'
      });
      
      return results;
    }

    // No data available
    console.log('⚪ No data available for visualization');
    return [];
  }, [csvData, tableData, selectedYear, auditor]);

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h4 className="font-semibold text-blue-900">Loading Dashboard...</h4>
              <p className="text-blue-700 text-sm">Checking for saved XLSX data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processedData.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Dashboard Menunggu Data</h3>
          <p className="text-gray-500 text-sm">
            {error ? (
              <>
                <span className="text-orange-600">⚠️ {error}</span><br />
                Tambahkan data penilaian GCG atau gunakan Input Otomatis untuk melihat visualisasi dashboard.
              </>
            ) : (
              <>
                Tambahkan data penilaian GCG di atas untuk melihat visualisasi dashboard.
                <br />
                Dashboard akan menampilkan grafik batang interaktif berdasarkan data yang Anda input.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Dynamic Y axis calculation for multi-year comparison
  const allScores = processedData.map(d => d.totalScore).filter(score => score > 0);
  const rawMinScore = allScores.length > 0 ? Math.min(...allScores) : 0;
  const rawMaxScore = allScores.length > 0 ? Math.max(...allScores) : 100;
  let minScore = Math.max(0, rawMinScore - 10);
  let maxScore = Math.min(300, rawMaxScore + 20); // Increased max for better visibility
  
  // If min and max are equal, force a range
  if (minScore === maxScore) {
    minScore = Math.max(0, minScore - 20);
    maxScore = Math.min(300, maxScore + 20);
  }
  
  console.log(`📊 Dashboard Y-axis: min=${minScore}, max=${maxScore}, processed data count=${processedData.length}`);
  console.log(`📊 Processed years for rendering:`, processedData.map(d => ({ year: d.year, sections: d.sections.length, totalScore: d.totalScore })));
  
  const chartHeight = Math.max(window.innerHeight - 300, 450);

  return (
    <div className="space-y-6">
      {/* Data source indicator */}
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <Database className="w-4 h-4" />
        <span>📊 Multi-year comparison from saved XLSX ({processedData.length} year(s))</span>
      </div>

      <Card className="shadow-lg border-0 w-full">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-2xl flex items-center space-x-3">
            <BarChart3 className="w-8 h-8" />
            <span>GCG Multi-Year Assessment Comparison</span>
          </CardTitle>
          <p className="text-blue-100 mt-1">
            Comparing {processedData.length} year(s): {processedData.map(d => d.year).join(', ')}
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Multi-Year Bar Chart */}
          <div className="w-full overflow-x-auto">
            <div className="relative" style={{ minWidth: `${Math.max(processedData.length * 160, 800)}px`, minHeight: `${chartHeight + 100}px` }}>
              {console.log(`🎨 Rendering ${processedData.length} bars with minWidth: ${Math.max(processedData.length * 160, 800)}px`)}
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500" style={{height: `${chartHeight}px`}}>
                {[...Array(6)].map((_, i) => {
                  const value = minScore + (i * (maxScore - minScore) / 5);
                  const bottom = (i * chartHeight) / 5;
                  return (
                    <div key={i} className="flex items-center" style={{position:'absolute', bottom: `${bottom}px`}}>
                      <span className="w-12 text-right pr-2">{value.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chart area */}
              <div className="ml-14 relative" style={{ height: `${chartHeight}px` }}>
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

                {/* Multiple Year Bars */}
                <div className="relative h-full flex items-end justify-center space-x-6">
                  {console.log(`🎯 About to render ${processedData.length} year bars:`, processedData.map(d => ({ year: d.year, sections: d.sections.length, totalScore: d.totalScore })))}
                  {processedData.map((yearData) => {
                    const barHeight = ((yearData.totalScore - minScore) / (maxScore - minScore)) * chartHeight;
                    const isHovered = hoveredBar === yearData.year;
                    
                    return (
                      <div key={yearData.year} className="flex flex-col items-center">
                        <div
                          className={`relative flex flex-col items-center justify-end rounded-lg bg-gradient-to-t from-gray-50 to-white transition-all duration-300 ${
                            isHovered ? 'shadow-2xl scale-105' : 'shadow-md hover:shadow-lg'
                          }`}
                          style={{ height: `${chartHeight + 100}px`, width: '120px', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredBar(yearData.year)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {/* Stacked sections bar */}
                          <div 
                            className={`transition-all duration-500 ease-out ${isHovered ? 'shadow-lg' : ''}`}
                            style={{
                              height: `${barHeight}px`, 
                              width: '100px', 
                              position: 'absolute', 
                              bottom: '100px', 
                              left: '50%', 
                              transform: 'translateX(-50%)',
                              borderRadius: '8px 8px 0 0',
                              overflow: 'hidden',
                              border: isHovered ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            {/* Individual section stacks */}
                            {yearData.sections.map((section, sectionIndex) => {
                              const sectionColor = aspekColorMap[section.romanNumeral] || section.color;
                              const sectionHeight = Math.max((section.height / yearData.totalScore) * barHeight, 5); // Minimum 5px visibility
                              const bottomOffset = yearData.sections
                                .slice(0, sectionIndex)
                                .reduce((sum, s) => sum + (s.height / yearData.totalScore) * barHeight, 0);
                              
                              console.log(`🎨 Rendering section ${section.romanNumeral}: height=${sectionHeight}px, bottomOffset=${bottomOffset}px, color=${sectionColor}`);
                              const isSectionHovered = hovered && hovered.year === yearData.year && hovered.section === section.name;
                              const faded = hovered && hovered.year === yearData.year && hovered.section !== section.name;
                              
                              return (
                                <div
                                  key={section.name}
                                  className={`absolute w-full border border-white/30 cursor-pointer transition-all duration-300 hover:border-white/50 ${
                                    isSectionHovered ? 'scale-110 z-10' : ''
                                  }`}
                                  style={{
                                    height: `${sectionHeight}px`,
                                    bottom: `${bottomOffset}px`,
                                    backgroundColor: sectionColor,
                                    opacity: isSectionHovered ? 1 : faded ? 0.5 : 0.95,
                                    zIndex: isSectionHovered ? 10 : 1,
                                    borderRadius: sectionIndex === 0 ? '0 0 8px 8px' : 
                                                 sectionIndex === yearData.sections.length - 1 ? '8px 8px 0 0' : '0',
                                    boxShadow: isSectionHovered ? '0 4px 20px rgba(0,0,0,0.15)' : undefined,
                                  }}
                                  onMouseEnter={() => setHovered({year: yearData.year, section: section.name})}
                                  onMouseLeave={() => setHovered(null)}
                                >
                                  {/* Section label */}
                                  {sectionHeight > 25 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className={`text-xs font-bold text-white text-center leading-tight px-2 py-1 rounded ${
                                        isSectionHovered ? 'bg-black/20 backdrop-blur-sm' : ''
                                      }`}>
                                        <div className="text-sm">{section.romanNumeral}</div>
                                        <div className="text-xs opacity-95 font-medium">
                                          {section.capaian.toFixed(1)}%
                                        </div>
                                        {isSectionHovered && (
                                          <div className="text-xs mt-1 opacity-90">
                                            Skor: {section.skor?.toFixed(2)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Hover tooltip for narrow sections */}
                                  {isSectionHovered && sectionHeight <= 25 && (
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-20">
                                      <div className="text-center">
                                        <div>{section.romanNumeral}</div>
                                        <div>{section.capaian.toFixed(1)}%</div>
                                        <div>Skor: {section.skor?.toFixed(2)}</div>
                                      </div>
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Score display at top of bar */}
                            <div className={`absolute left-1/2 transform -translate-x-1/2 text-center transition-all duration-300 ${
                              isHovered ? 'scale-110' : ''
                            }`} style={{top: '-30px'}}>
                              <div className={`bg-white px-3 py-1 rounded-full shadow-md border-2 ${
                                isHovered ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                              }`}>
                                <div className="text-lg font-bold text-gray-800">{yearData.totalScore.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Year label at bottom */}
                          <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center justify-center text-center bg-gradient-to-t from-white to-gray-50 rounded-b-lg py-3 transition-all duration-300 ${
                            isHovered ? 'border-t-2 border-blue-200 shadow-inner' : 'border-t border-gray-200'
                          }`} style={{minHeight: 100}}>
                            <div className={`text-xl font-bold transition-colors duration-300 ${
                              isHovered ? 'text-blue-600' : 'text-gray-800'
                            }`}>{yearData.year}</div>
                            {yearData.penilai && (
                              <div className="text-xs text-gray-600 leading-tight mt-1">{yearData.penilai}</div>
                            )}
                            {yearData.penjelasan && (
                              <Badge className={`mt-2 text-xs ${
                                yearData.totalScore >= 90 ? 'bg-green-500' :
                                yearData.totalScore >= 80 ? 'bg-blue-500' :  
                                yearData.totalScore >= 70 ? 'bg-yellow-500' :
                                yearData.totalScore >= 60 ? 'bg-orange-500' :
                                'bg-red-500'
                              } text-white`}>
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
    </div>
  );
};

export default CSVPoweredDashboard;