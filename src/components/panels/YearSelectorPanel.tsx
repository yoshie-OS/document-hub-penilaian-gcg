import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Upload, Eye } from 'lucide-react';

interface YearSelectorPanelProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  availableYears: number[];
  title?: string;
  description?: string;
  className?: string;
  showYearCategories?: boolean; // Untuk menampilkan kategori tahun aktif/sebelumnya
}

const YearSelectorPanel: React.FC<YearSelectorPanelProps> = ({
  selectedYear,
  onYearChange,
  availableYears,
  title = "Tahun Buku",
  description = "Pilih tahun buku untuk mengelola data",
  className = "",
  showYearCategories = true
}) => {
  // Safety check for selectedYear
  const safeSelectedYear = selectedYear || null;
  
  // Sort years: newest added year first (most recent), then previous years in descending order
  const sortedYears = [...availableYears].sort((a, b) => b - a);
  
  // Get the most recent year (first in sorted array) and previous years
  const mostRecentYear = sortedYears[0]; // Tahun paling baru yang ditambahkan
  const previousYears = sortedYears.slice(1); // Tahun-tahun sebelumnya
  
  return (
    <div className={`mb-6 ${className}`} id="year-selector">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
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
          {showYearCategories && availableYears.length > 0 ? (
            <>
              {/* Most Recent Year Section (Upload) */}
              {mostRecentYear && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Tahun Aktif (Upload)</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Tahun Terkini
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={safeSelectedYear === mostRecentYear ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onYearChange(mostRecentYear)}
                      className={`transition-all duration-200 ${
                        safeSelectedYear === mostRecentYear 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:bg-green-50 border-green-200 text-green-700 hover:border-green-300'
                      }`}
                    >
                      <span className="mr-2">{mostRecentYear}</span>
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Tahun {mostRecentYear} adalah tahun aktif untuk upload dokumen yang telah di-assign oleh superadmin
                  </p>
                </div>
              )}

              {/* Previous Years Section */}
              {previousYears.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Tahun Sebelumnya (Lihat/Download)</h3>
                    <Badge className="bg-gray-100 text-gray-800 text-xs">
                      Arsip Dokumen
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previousYears.map((year) => (
                      <Button
                        key={year}
                        variant={safeSelectedYear === year ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onYearChange(year)}
                        className={`transition-all duration-200 ${
                          safeSelectedYear === year 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{year}</span>
                        <Eye className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Tahun-tahun sebelumnya hanya dapat melihat dan mengunduh dokumen dari panel Arsip Dokumen
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Simple Year Selection (for backward compatibility) */
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
          )}

          {/* No Years Available */}
          {availableYears.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Belum ada tahun buku yang tersedia</p>
              <p className="text-xs text-gray-400 mt-1">Hubungi superadmin untuk setup tahun buku</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default YearSelectorPanel; 