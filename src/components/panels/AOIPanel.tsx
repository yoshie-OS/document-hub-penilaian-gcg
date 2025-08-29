import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, FileText, Users, Calendar, CheckCircle, Upload, Download, RefreshCw } from 'lucide-react';
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

  // Check if document exists for a recommendation (mock function - replace with actual logic)
  const hasDocument = (recommendationId: number) => {
    // TODO: Replace with actual document check logic
    // This should check if there's a document uploaded for this recommendation
    // For now, returning false to show only upload button
    return false;
  };

  // Handle file upload
  const handleUpload = (recommendationId: number) => {
    // TODO: Implement file upload functionality
    console.log('Upload file for recommendation:', recommendationId);
  };

  // Handle file re-upload
  const handleReUpload = (recommendationId: number) => {
    // TODO: Implement file re-upload functionality
    console.log('Re-upload file for recommendation:', recommendationId);
  };

  // Handle file download
  const handleDownload = (recommendationId: number) => {
    // TODO: Implement file download functionality
    console.log('Download file for recommendation:', recommendationId);
  };

  // Render action buttons based on document status
  const renderActionButtons = (recommendationId: number) => {
    const hasDoc = hasDocument(recommendationId);

    return (
      <div className="flex gap-2">
        {/* Upload button - always visible */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUpload(recommendationId)}
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Upload className="w-3 h-3 mr-1" />
          Upload
        </Button>

        {/* Re-upload and Download buttons - only visible when document exists */}
        {hasDoc && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReUpload(recommendationId)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Re-upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(recommendationId)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </>
        )}
      </div>
    );
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
          Rekomendasi perbaikan GCG untuk tahun {selectedYear}
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
              <div className="space-y-8">
                <div>
                  <h4 className="text-md font-semibold text-blue-800 mb-4 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Rekomendasi & Saran
                  </h4>
                  <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="text-blue-900 font-semibold w-16">NO</TableHead>
                          <TableHead className="text-blue-900 font-semibold min-w-[400px]">REKOMENDASI</TableHead>
                          <TableHead className="text-blue-900 font-semibold">PIHAK TERKAIT</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-32">TINGKAT URGENSI</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-32">ASPEK AOI</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-48">AKSI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearRecommendations
                          .map((rec) => {
                            const text = rec.jenis === 'REKOMENDASI' ? rec.rekomendasi : rec.saran;
                            return (
                              <TableRow key={rec.id} className="hover:bg-blue-50/50">
                                <TableCell className="font-medium text-center">{rec.no || '-'}</TableCell>
                                <TableCell className="min-w-[400px]">
                                  <div className="text-sm leading-relaxed pr-4">{text || '-'}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-blue-700">{rec.pihakTerkait || '-'}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    {renderStars(rec.tingkatUrgensi || 0)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-center">{rec.aspekAOI || '-'}</div>
                                </TableCell>
                                <TableCell>
                                  {renderActionButtons(rec.id)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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
