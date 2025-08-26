import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface YearSelectorPanelProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  availableYears: number[];
  title?: string;
  description?: string;
  className?: string;
}

const YearSelectorPanel: React.FC<YearSelectorPanelProps> = ({
  selectedYear,
  onYearChange,
  availableYears,
  title = "Tahun Buku",
  description = "Pilih tahun buku untuk mengelola data",
  className = ""
}) => {
  // Safety check for selectedYear
  const safeSelectedYear = selectedYear || null;
  
  return (
    <div className={`mb-8 ${className}`} id="year-selector">
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableYears && availableYears.length > 0 ? (
              availableYears.map((year) => (
                <Button
                  key={year}
                  variant={safeSelectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onYearChange(year)}
                  className={`transition-all duration-200 ${
                    safeSelectedYear === year 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {year}
                </Button>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                Tidak ada tahun yang tersedia
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearSelectorPanel; 