import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, FileText, Users, Calendar, CheckCircle, Upload, Download, RefreshCw } from 'lucide-react';
import { useAOI } from '@/contexts/AOIContext';
import { useUser } from '@/contexts/UserContext';
import { useAOIDocument } from '@/contexts/AOIDocumentContext';

interface AOIPanelProps {
  selectedYear: number | null;
  className?: string;
}

const AOIPanel: React.FC<AOIPanelProps> = ({ selectedYear, className = "" }) => {
  const { aoiTables, aoiRecommendations, aoiTracking } = useAOI();
  const { user } = useUser();
  const { uploadDocument, getDocumentsByRecommendation } = useAOIDocument();

  if (!selectedYear || !user) return null;

  // Get AOI tables for selected year that are relevant to the current admin user
  const yearTables = (aoiTables || []).filter(table => {
    if (table.tahun !== selectedYear) return false;
    
    // Check if the table targets the user's organizational level
    if (table.targetType === 'direktorat' && table.targetDirektorat === user.direktorat) {
      return true;
    }
    if (table.targetType === 'subdirektorat' && 
        table.targetDirektorat === user.direktorat && 
        table.targetSubdirektorat === user.subdirektorat) {
      return true;
    }
    if (table.targetType === 'divisi' && 
        table.targetDirektorat === user.direktorat && 
        table.targetSubdirektorat === user.subdirektorat && 
        table.targetDivisi === user.divisi) {
      return true;
    }
    
    return false;
  });

  // Get recommendations for the relevant tables
  const relevantTableIds = yearTables.map(table => table.id);
  const yearRecommendations = (aoiRecommendations || []).filter(rec => 
    relevantTableIds.includes(rec.aoiTableId)
  );

  // Render star rating
  const renderStars = (rating: string) => {
    const ratingMap: Record<string, number> = {
      'RENDAH': 1,
      'SEDANG': 3,
      'TINGGI': 5
    };
    const starCount = ratingMap[rating] || 0;
    
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < starCount ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Get tracking for a recommendation
  const getTracking = (recommendationId: number) => {
    return aoiTracking.find(track => track.aoiRecommendationId === recommendationId);
  };

  // Check if document exists for a recommendation
  const hasDocument = (recommendationId: number) => {
    const docs = getDocumentsByRecommendation(recommendationId);
    return docs.length > 0;
  };

  // Handle file upload
  const handleUpload = (recommendationId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        try {
          // Get recommendation details for jenis and urutan
          const recommendation = aoiRecommendations.find(rec => rec.id === recommendationId);
          if (recommendation) {
            await uploadDocument(
              file,
              recommendationId,
              recommendation.jenis,
              recommendation.no || 0,
              String(user.id || 'unknown'),
              user.direktorat || '',
              user.subdirektorat || '',
              user.divisi || '',
              selectedYear
            );
            // Refresh the component to show updated state
            window.location.reload();
          }
        } catch (error) {
          console.error('Error uploading document:', error);
          alert('Gagal mengupload dokumen. Silakan coba lagi.');
        }
      }
    };
    input.click();
  };

  // Handle file re-upload
  const handleReUpload = (recommendationId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        try {
          // Get recommendation details for jenis and urutan
          const recommendation = aoiRecommendations.find(rec => rec.id === recommendationId);
          if (recommendation) {
            await uploadDocument(
              file,
              recommendationId,
              recommendation.jenis,
              recommendation.no || 0,
              String(user.id || 'unknown'),
              user.direktorat || '',
              user.subdirektorat || '',
              user.divisi || '',
              selectedYear
            );
            // Refresh the component to show updated state
            window.location.reload();
          }
        } catch (error) {
          console.error('Error re-uploading document:', error);
          alert('Gagal mengupload ulang dokumen. Silakan coba lagi.');
        }
      }
    };
    input.click();
  };

  // Handle file download
  const handleDownload = (recommendationId: number) => {
    const docs = getDocumentsByRecommendation(recommendationId);
    if (docs.length > 0) {
      const doc = docs[0]; // Get the latest document
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob(['Mock file content'], { type: 'text/plain' }));
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  // Render action buttons based on document status
  const renderActionButtons = (recommendationId: number) => {
    const hasDoc = hasDocument(recommendationId);

    return (
      <div className="flex gap-2">
        {/* Upload button - always visible */}
        <Button
          size="sm"
          onClick={() => handleUpload(recommendationId)}
          className="bg-blue-600 hover:bg-blue-700"
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
              Super admin belum membuat tabel Area of Improvement untuk {user.direktorat || 'direktorat Anda'} tahun {selectedYear}
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
              
            </div>

            {yearRecommendations.length > 0 ? (
              <div className="space-y-8">
                {/* Rekomendasi Section */}
                <div>
                  <h4 className="text-md font-semibold text-blue-800 mb-4 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Rekomendasi ({yearRecommendations.filter(rec => rec.jenis === 'REKOMENDASI').length})
                  </h4>
                  <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="text-blue-900 font-semibold w-16">NO</TableHead>
                          <TableHead className="text-blue-900 font-semibold min-w-[400px]">ISI</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-28">URGENSI</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-32">ASPEK</TableHead>
                          <TableHead className="text-blue-900 font-semibold w-40">
                            <div className="text-xs leading-tight">
                              ORGAN PERUSAHAAN<br />YANG MENINDAKLANJUTI
                            </div>
                          </TableHead>
                          <TableHead className="text-blue-900 font-semibold w-28">AKSI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearRecommendations
                          .filter(rec => rec.jenis === 'REKOMENDASI')
                          .map((rec) => (
                            <TableRow key={rec.id} className="hover:bg-blue-50/50">
                              <TableCell className="font-medium text-center">{rec.no || '-'}</TableCell>
                              <TableCell className="min-w-[400px]">
                                <div className="text-sm leading-relaxed pr-4">{rec.isi || '-'}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  {renderStars(rec.tingkatUrgensi || 'SEDANG')}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm">{rec.aspekAOI || '-'}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm font-medium text-blue-700">{rec.pihakTerkait || '-'}</div>
                              </TableCell>
                              <TableCell>
                                {renderActionButtons(rec.id)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Saran Section */}
                <div>
                  <h4 className="text-md font-semibold text-yellow-800 mb-4 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
                    Saran ({yearRecommendations.filter(rec => rec.jenis === 'SARAN').length})
                  </h4>
                  <div className="border border-yellow-200 rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-yellow-50">
                          <TableHead className="text-yellow-900 font-semibold w-16">NO</TableHead>
                          <TableHead className="text-yellow-900 font-semibold min-w-[400px]">ISI</TableHead>
                          <TableHead className="text-yellow-900 font-semibold w-28">URGENSI</TableHead>
                          <TableHead className="text-yellow-900 font-semibold w-32">ASPEK</TableHead>
                          <TableHead className="text-yellow-900 font-semibold w-40">
                            <div className="text-xs leading-tight">
                              ORGAN PERUSAHAAN<br />YANG MENINDAKLANJUTI
                            </div>
                          </TableHead>
                          <TableHead className="text-yellow-900 font-semibold w-28">AKSI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearRecommendations
                          .filter(rec => rec.jenis === 'SARAN')
                          .map((rec) => (
                            <TableRow key={rec.id} className="hover:bg-yellow-50/50">
                              <TableCell className="font-medium text-center">{rec.no || '-'}</TableCell>
                              <TableCell className="min-w-[400px]">
                                <div className="text-sm leading-relaxed pr-4">{rec.isi || '-'}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  {renderStars(rec.tingkatUrgensi || 'SEDANG')}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm">{rec.aspekAOI || '-'}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm font-medium text-yellow-700">{rec.pihakTerkait || '-'}</div>
                              </TableCell>
                              <TableCell>
                                {renderActionButtons(rec.id)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-blue-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <p className="text-sm">Belum ada rekomendasi untuk tabel ini</p>
                <p className="text-xs mt-1">Super admin akan menambahkan rekomendasi yang ditujukan untuk {user.direktorat || 'direktorat Anda'}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AOIPanel;
