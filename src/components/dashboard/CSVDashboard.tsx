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

interface CSVDashboardProps {
  selectedYear?: number;
}

const CSVDashboard: React.FC<CSVDashboardProps> = ({ selectedYear }) => {
  const [dashboardData, setDashboardData] = useState<Record<number, DashboardDataItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Fetch data from CSV API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard-data');
        const result = await response.json();
        
        if (result.success) {
          console.log('📊 Dashboard data loaded from CSV:', result.message);
          
          // Transform years_data to our format
          const transformedData: Record<number, DashboardDataItem[]> = {};
          Object.entries(result.years_data).forEach(([year, yearData]: [string, any]) => {
            transformedData[parseInt(year)] = yearData.data;
          });
          
          setDashboardData(transformedData);
          setAvailableYears(result.available_years.sort((a: number, b: number) => b - a));
          setError(null);
        } else {
          console.log('📋 No dashboard data:', result.message);
          setError(result.message);
        }
      } catch (err) {
        console.error('❌ Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Process GCG data for visualization
  const processedData = useMemo((): ProcessedGCGData[] => {
    const results: ProcessedGCGData[] = [];

    Object.entries(dashboardData).forEach(([year, yearData]) => {
      const yearNumber = parseInt(year);
      
      // Filter by selected year if specified
      if (selectedYear && yearNumber !== selectedYear) return;

      // Group by aspek and calculate totals
      const aspekGroups: Record<string, DashboardDataItem[]> = {};
      yearData.forEach(item => {
        if (!aspekGroups[item.aspek]) {
          aspekGroups[item.aspek] = [];
        }
        aspekGroups[item.aspek].push(item);
      });

      // Create sections data
      const sections: SectionData[] = [];
      let totalScore = 0;

      Object.entries(aspekGroups).forEach(([aspek, items]) => {
        const totalBobot = items.reduce((sum, item) => sum + item.bobot, 0);
        const totalSkor = items.reduce((sum, item) => sum + item.skor, 0);
        const avgCapaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
        
        sections.push({
          name: aspek,
          romanNumeral: aspek,
          capaian: avgCapaian,
          height: Math.max(20, Math.min(100, avgCapaian)), // Visual height
          color: aspekColorMap[aspek] || '#cccccc',
          bobot: totalBobot,
          skor: totalSkor,
          jumlah_parameter: items.reduce((sum, item) => sum + item.jumlah_parameter, 0)
        });

        totalScore += totalSkor;
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
        penilai: yearData[0]?.auditor || 'Unknown'
      });
    });

    return results.sort((a, b) => b.year - a.year); // Sort by year descending
  }, [dashboardData, selectedYear]);

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h4 className="font-semibold text-blue-900">Loading Dashboard...</h4>
              <p className="text-blue-700 text-sm">Reading data from output.csv</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-yellow-600" />
            <div>
              <h4 className="font-semibold text-yellow-900">No Dashboard Data</h4>
              <p className="text-yellow-700 text-sm">{error}</p>
              <p className="text-yellow-600 text-xs mt-1">Save some assessment data to see visualizations here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processedData.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900">No Data Available</h4>
            <p className="text-gray-600 text-sm">
              {selectedYear ? `No data found for year ${selectedYear}` : 'No assessment data to display'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data source indicator */}
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <Database className="w-4 h-4" />
        <span>📊 Data loaded from output.csv ({availableYears.length} year(s) available)</span>
      </div>

      {processedData.map((data) => (
        <Card key={data.year} className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center space-x-3">
                  <BarChart3 className="w-8 h-8" />
                  <span>GCG Assessment {data.year}</span>
                </CardTitle>
                <p className="text-blue-100 mt-1">Auditor: {data.penilai}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{data.totalScore.toFixed(1)}</div>
                <div className="text-blue-200 text-sm">Total Score</div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-semibold">Total Skor</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">{data.totalScore.toFixed(1)}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-green-900 font-semibold">Total Aspek</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">{data.sections.length}</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-semibold">Aspek Terbaik</span>
                </div>
                <div className="text-lg font-bold text-purple-700 mt-1">
                  {data.sections.length > 0 
                    ? data.sections.reduce((max, section) => section.capaian > max.capaian ? section : max).romanNumeral
                    : '-'
                  }
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-900 font-semibold">Status</span>
                </div>
                <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                  Data from CSV
                </Badge>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Performance by Section
              </h3>
              
              <div className="flex items-end justify-center space-x-2 md:space-x-4 h-64">
                {data.sections.map((section, index) => (
                  <div
                    key={section.romanNumeral}
                    className="flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    {/* Bar */}
                    <div
                      className="w-12 md:w-16 rounded-t-lg shadow-lg border-2 border-white relative overflow-hidden transition-all duration-300"
                      style={{
                        height: `${section.height}%`,
                        backgroundColor: section.color,
                        minHeight: '20px'
                      }}
                    >
                      {/* Score display on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-20 text-white text-xs font-bold">
                        {section.capaian.toFixed(1)}%
                      </div>
                    </div>
                    
                    {/* Label */}
                    <div className="mt-2 text-center">
                      <div className="font-semibold text-gray-800 text-sm md:text-base">
                        {section.romanNumeral}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {section.capaian.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CSVDashboard;