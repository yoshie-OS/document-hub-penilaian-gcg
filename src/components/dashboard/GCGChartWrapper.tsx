import React, { useState, useEffect } from 'react';
import { GCGChart } from '@/components/GCGChart';
import { processGCGData, processGCGDataFromTable } from '@/utils/gcgDataProcessor';
import type { GCGData } from '@/types/gcg';

interface PenilaianRow {
  id: string;
  no?: string;
  aspek: string;
  deskripsi: string;
  jumlah_parameter?: number;
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
}

interface GCGChartWrapperProps {
  selectedYear: number;
  tableData: PenilaianRow[];
  auditor: string;
  jenisAsesmen: string;
}

export const GCGChartWrapper: React.FC<GCGChartWrapperProps> = ({
  selectedYear,
  tableData,
  auditor,
  jenisAsesmen
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [rawGCGData, setRawGCGData] = useState<GCGData[]>([]);
  const [chartMode, setChartMode] = useState<'aspek' | 'tahun'>('aspek');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to fetch data from the new GCG chart API (for graphics-2 format)
        try {
          const response = await fetch('/api/gcg-chart-data');
          if (response.ok) {
            const apiData = await response.json();
            if (apiData.success && apiData.data && apiData.data.length > 0) {
              setRawGCGData(apiData.data as GCGData[]);
              const processedApiData = processGCGData(apiData.data as GCGData[]);
              
              if (processedApiData.length > 0) {
                setChartData(processedApiData);
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError) {
          console.log('GCG chart API not available, using table data');
        }

        // Fallback to current table data
        const processedTableData = processGCGDataFromTable(
          tableData,
          selectedYear,
          auditor,
          jenisAsesmen
        );
        
        setChartData(processedTableData);
        setLoading(false);
      } catch (err) {
        console.error('Error processing chart data:', err);
        setError('Failed to load chart data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedYear, tableData, auditor, jenisAsesmen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          No data available for visualization. Please add some assessment data first.
        </div>
      </div>
    );
  }

  return (
    <GCGChart
      data={chartData}
      rawData={rawGCGData}
      chartMode={chartMode}
      setChartMode={setChartMode}
    />
  );
};