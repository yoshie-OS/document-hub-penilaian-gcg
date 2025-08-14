import React, { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { useYear } from '@/contexts/YearContext';

interface YearSelectorProps {
  initialYear?: number;
}

const YearSelector: React.FC<YearSelectorProps> = ({ initialYear }) => {
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  // Set initial year if provided
  useEffect(() => {
    if (initialYear && initialYear !== selectedYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear, selectedYear, setSelectedYear]);

  // Use years from global context
  const years = availableYears;

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tahun Buku</h2>
            <p className="text-sm text-gray-600">
              Pilih tahun buku untuk mengakses data
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Tahun yang dipilih: <span className="font-semibold text-blue-600">{selectedYear || 'Belum dipilih'}</span>
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => handleYearSelect(year)}
              className={`transition-all duration-200 ${
                selectedYear === year 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {year}
            </Button>
          ))}
        </div>
        
        {selectedYear && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tahun Buku {selectedYear}:</strong> Dokumen assessment yang dibuat/dikumpulkan di tahun {selectedYear}
            </p>
          </div>
        )}


      </div>

      {/* File Upload Dialog removed */}
    </div>
  );
};

export default YearSelector; 