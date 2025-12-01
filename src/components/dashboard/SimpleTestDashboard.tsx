import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface YearData {
  year: number;
  totalScore: number;
  aspects: { [key: string]: number };
}

const SimpleTestDashboard: React.FC = () => {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard-data');
        const result = await response.json();
        
        if (result.success) {
          const processedYears: YearData[] = [];
          
          Object.entries(result.years_data).forEach(([year, data]: [string, any]) => {
            const aspects: { [key: string]: number } = {};
            let totalScore = 0;
            
            // Group by aspect and calculate totals
            data.data.forEach((item: any) => {
              if (item.aspek && item.skor && !isNaN(item.skor)) {
                if (!aspects[item.aspek]) aspects[item.aspek] = 0;
                aspects[item.aspek] += item.skor;
                totalScore += item.skor;
              }
            });
            
            processedYears.push({
              year: parseInt(year),
              totalScore,
              aspects
            });
          });
          
          console.log('🎯 SIMPLE TEST - Processed years:', processedYears);
          setYearData(processedYears.sort((a, b) => b.year - a.year));
        }
      } catch (error) {
        console.error('❌ Simple test error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading simple test...</div>;

  const maxScore = Math.max(...yearData.map(d => d.totalScore));
  const chartHeight = 300;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 />
          <span>Simple Multi-Year Test ({yearData.length} years)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-8 items-end justify-center" style={{ height: chartHeight + 50 }}>
          {yearData.map((year) => {
            const barHeight = (year.totalScore / maxScore) * chartHeight;
            
            return (
              <div key={year.year} className="flex flex-col items-center">
                <div 
                  className="bg-blue-500 rounded-t"
                  style={{ 
                    width: '80px', 
                    height: `${barHeight}px`,
                    minHeight: '20px'
                  }}
                />
                <div className="text-center mt-2">
                  <div className="font-bold">{year.year}</div>
                  <div className="text-sm text-gray-600">{year.totalScore.toFixed(1)}</div>
                  <div className="text-xs">
                    {Object.keys(year.aspects).join(', ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <div>Debug Info:</div>
          {yearData.map(year => (
            <div key={year.year}>
              Year {year.year}: {year.totalScore.toFixed(2)} points, Aspects: {Object.keys(year.aspects).length}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTestDashboard;