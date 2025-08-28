import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star, FileText, Users, Calendar } from 'lucide-react';
import { useAOI } from '@/contexts/AOIContext';

interface AOIPanelProps {
  selectedYear: number | null;
  className?: string;
}

const AOIPanel: React.FC<AOIPanelProps> = ({ selectedYear, className = "" }) => {
  const { aoiTables, recommendations, tracking } = useAOI();

  if (!selectedYear) return null;

  // Get AOI tables for selected year
  const yearTables = aoiTables.filter(table => table.tahun === selectedYear);
  const yearRecommendations = recommendations.filter(rec => rec.tahun === selectedYear);

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Get tracking for a recommendation
  const getTracking = (recommendationId: number) => {
    return tracking.find(track => track.aoiId === recommendationId);
  };

  if (yearTables.length === 0) {
    return (
      <Card className={`border-0 shadow-lg bg-gradient-to-r from-white to-blue-50 ${className}`}>
        <CardContent className="p-8">
          <div className="text-center text-blue-600">
            <FileText className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Tabel AOI</h3>
            <p className="text-sm text-blue-700">
              Super admin belum membuat tabel Area of Improvement untuk tahun {selectedYear}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg bg-gradient-to-r from-white to-blue-50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-900">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Area of Improvement (AOI)</span>
        </CardTitle>
        <p className="text-sm text-blue-700 mt-2">
          Rekomendasi perbaikan GCG dan tracking tindak lanjut untuk tahun {selectedYear}
        </p>
      </CardHeader>
      <CardContent>
        {yearTables.map((table) => (
          <div key={table.id} className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{table.nama}</h3>
              <p className="text-sm text-blue-700">{table.deskripsi}</p>
            </div>

            {yearRecommendations.length > 0 ? (
              <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-900 font-semibold w-16">NO</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Rekomendasi</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Pihak Terkait</TableHead>
                      <TableHead className="text-blue-900 font-semibold w-32">Tingkat Urgensi</TableHead>
                      <TableHead className="text-blue-900 font-semibold w-32">Jangka Waktu</TableHead>
                      <TableHead className="text-blue-900 font-semibold w-48">Tracking Tindak Lanjut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearRecommendations.map((rec) => {
                      const track = getTracking(rec.id);
                      return (
                        <TableRow key={rec.id} className="hover:bg-blue-50/50">
                          <TableCell className="font-medium text-center">{rec.no}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm leading-relaxed">{rec.rekomendasi}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{rec.pihakTerkait}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              {renderStars(rec.tingkatUrgensi)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-center">{rec.jangkaWaktu}</div>
                          </TableCell>
                          <TableCell>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.rups || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>RUPS</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.dewanKomisaris || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>DEWAN KOMISARIS</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.sekdekom || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>SEKDEKOM</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.komite || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>KOMITE</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.direksi || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>DIREKSI</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={track?.sekretarisPerusahaan || false}
                                  disabled
                                  className="w-3 h-3"
                                />
                                <span>SEKRETARIS PERUSAHAAN</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-blue-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <p className="text-sm">Belum ada rekomendasi untuk tabel ini</p>
                <p className="text-xs mt-1">Super admin akan menambahkan rekomendasi</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AOIPanel;
