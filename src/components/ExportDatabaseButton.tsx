import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ExportDatabaseButtonProps {
  year?: number;
  variant?: 'default' | 'outline';
  className?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const ExportDatabaseButton: React.FC<ExportDatabaseButtonProps> = ({ 
  year, 
  variant = 'outline',
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const url = year 
        ? `${API_BASE_URL}/export/all-data?year=${year}`
        : `${API_BASE_URL}/export/all-data`;

      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = year ? `gcg_data_${year}.xlsx` : 'gcg_data_all.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        console.error('Export failed:', response.statusText);
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </>
      )}
    </Button>
  );
};

export default ExportDatabaseButton;
