import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FolderOpen,
  Eye,
  Upload,
  Download,
  FileText,
  Archive
} from 'lucide-react';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useUser } from '@/contexts/UserContext';
import { useAOIDocument } from '@/contexts/AOIDocumentContext';

interface UserDocument {
  id: string | number;
  namaFile: string;
  aspek: string;
  subdirektorat: string;
  uploadDate: string;
  status: string;
  tahunBuku: string;
  source?: 'AOI' | 'REGULAR'; // Menandakan apakah dokumen dari AOI atau regular
  aoiRecommendationId?: number; // ID rekomendasi AOI jika dokumen dari AOI
}

interface AdminArchivePanelProps {
  selectedYear: number | null;
  canUploadInCurrentYear: boolean;
  isCurrentYear: boolean;
}

const AdminArchivePanel: React.FC<AdminArchivePanelProps> = ({
  selectedYear,
  canUploadInCurrentYear,
  isCurrentYear
}) => {
  const { user } = useUser();
  const { getFilesByYear } = useFileUpload();
  const { getDocumentsByYear } = useAOIDocument();

  // Handle file download
  const handleDownload = (fileName: string, fileType: string = 'application/octet-stream') => {
    // Create a mock file content (in real app, this would be the actual file content)
    const mockContent = `Mock file content for ${fileName}\n\nThis is a placeholder file for demonstration purposes.\nFile: ${fileName}\nType: ${fileType}\nDate: ${new Date().toLocaleDateString('id-ID')}`;
    
    // Create blob and download link
    const blob = new Blob([mockContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  // Generate real-time data from FileUploadContext and AOI documents
  const currentYearDocuments = useMemo(() => {
    if (!selectedYear || !user?.subdirektorat) return [];
    
    // Get regular documents
    const yearFiles = getFilesByYear(selectedYear);
    const regularDocs = yearFiles
      .filter(file => file.subdirektorat === user.subdirektorat)
      .map(file => ({
        id: file.id,
        namaFile: file.fileName,
        aspek: file.aspect || 'Unknown Aspect',
        subdirektorat: file.subdirektorat || user.subdirektorat,
        uploadDate: file.uploadDate.toISOString(),
        status: file.status,
        tahunBuku: file.year.toString(),
        source: 'REGULAR' as const,
        aoiRecommendationId: undefined
      }));

    // Get AOI documents
    const aoiDocs = getDocumentsByYear(selectedYear)
      .filter(doc => doc.userSubdirektorat === user.subdirektorat)
      .map(doc => ({
        id: doc.id,
        namaFile: doc.fileName,
        aspek: 'AOI Document',
        subdirektorat: doc.userSubdirektorat,
        uploadDate: doc.uploadDate.toISOString(),
        status: 'completed',
        tahunBuku: doc.tahun.toString(),
        source: 'AOI' as const,
        aoiRecommendationId: doc.aoiRecommendationId
      }));

    // Combine and sort by upload date
    const allDocs = [...regularDocs, ...aoiDocs];
    return allDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [selectedYear, user?.subdirektorat, getFilesByYear, getDocumentsByYear]);

  const previousYearDocuments = useMemo(() => {
    if (!selectedYear) return [];
    
    // Get regular documents
    const yearFiles = getFilesByYear(selectedYear);
    const regularDocs = yearFiles.map(file => ({
      id: file.id,
      namaFile: file.fileName,
      aspek: file.aspect || 'Unknown Aspect',
      subdirektorat: file.subdirektorat || 'Unknown',
      uploadDate: file.uploadDate.toISOString(),
      status: file.status,
      tahunBuku: file.year.toString(),
      source: 'REGULAR' as const,
      aoiRecommendationId: undefined
    }));

    // Get AOI documents
    const aoiDocs = getDocumentsByYear(selectedYear).map(doc => ({
      id: doc.id,
      namaFile: doc.fileName,
      aspek: 'AOI Document',
      subdirektorat: doc.userSubdirektorat,
      uploadDate: doc.uploadDate.toISOString(),
      status: 'completed',
      tahunBuku: doc.tahun.toString(),
      source: 'AOI' as const,
      aoiRecommendationId: doc.aoiRecommendationId
    }));

    // Combine and sort by upload date
    const allDocs = [...regularDocs, ...aoiDocs];
    return allDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [selectedYear, getFilesByYear, getDocumentsByYear]);
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Terlambat</Badge>;
      case 'revision':
        return <Badge className="bg-orange-100 text-orange-800">Revisi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isCurrentYear) {
    // Panel untuk tahun terkini - hanya dokumen subdirektorat admin
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Archive className="w-5 h-5 text-blue-600" />
            <span>Arsip Dokumen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-blue-900">
                Dokumen Tahun {selectedYear}
              </h3>
              <p className="text-sm text-blue-700">Hanya dokumen subdirektorat Anda</p>
            </div>
            
            {currentYearDocuments.length > 0 ? (
              <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentYearDocuments
                      .filter(doc => doc.source === 'REGULAR')
                      .map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-blue-50/50">
                          <TableCell className="font-medium">{doc.namaFile}</TableCell>
                          <TableCell>{doc.aspek}</TableCell>
                          <TableCell>
                            {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-200 text-green-600 hover:bg-green-50"
                                onClick={() => handleDownload(doc.namaFile)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-700">Belum ada dokumen untuk tahun {selectedYear}</p>
                {canUploadInCurrentYear && (
                  <p className="text-sm text-blue-600 mt-1">
                    Mulai upload dokumen untuk memulai progress
                  </p>
                )}
              </div>
            )}

            {/* Tabel Dokumen Tambahan dari AOI */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Dokumen Tambahan dari AOI
              </h3>
              
              {currentYearDocuments.filter(doc => doc.source === 'AOI').length > 0 ? (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Jenis & Urutan</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentYearDocuments
                        .filter(doc => doc.source === 'AOI')
                        .map((doc) => (
                          <TableRow key={doc.id} className="hover:bg-blue-50/50">
                            <TableCell className="font-medium">{doc.namaFile}</TableCell>
                            <TableCell className="text-sm text-blue-700">
                              {doc.aoiJenis === 'REKOMENDASI' ? 'Rekomendasi' : 'Saran'} #{doc.aoiUrutan}
                            </TableCell>
                            <TableCell>
                              {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">AOI Document</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 border border-blue-200 rounded-lg bg-blue-50">
                  <FileText className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-700 text-sm">Belum ada dokumen tambahan dari AOI</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Dokumen yang diupload dari panel AOI akan muncul di sini
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Panel untuk tahun lama - semua dokumen dari semua subdirektorat
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Archive className="w-5 h-5 text-blue-600" />
            <span>Arsip Dokumen - Tahun {selectedYear}</span>
          </CardTitle>
          <p className="text-sm text-blue-700 mt-2">
            Semua dokumen dari semua subdirektorat untuk tahun {selectedYear}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previousYearDocuments.filter(doc => doc.source === 'REGULAR').length > 0 ? (
              <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Subdirektorat</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousYearDocuments
                      .filter(doc => doc.source === 'REGULAR')
                      .map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-blue-50/50">
                          <TableCell className="font-medium">{doc.namaFile}</TableCell>
                          <TableCell>{doc.aspek}</TableCell>
                          <TableCell>{doc.subdirektorat || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-200 text-green-600 hover:bg-green-50"
                                onClick={() => handleDownload(doc.namaFile)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-700">Belum ada dokumen untuk tahun {selectedYear}</p>
                <p className="text-sm text-blue-600 mt-1">
                  Dokumen yang diupload akan muncul di sini
                </p>
              </div>
            )}

            {/* Tabel Dokumen Tambahan dari AOI untuk Tahun Lama */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Dokumen Tambahan dari AOI
              </h3>
              
              {previousYearDocuments.filter(doc => doc.source === 'AOI').length > 0 ? (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Jenis & Urutan</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Subdirektorat</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previousYearDocuments
                        .filter(doc => doc.source === 'AOI')
                        .map((doc) => (
                          <TableRow key={doc.id} className="hover:bg-blue-50/50">
                            <TableCell className="font-medium">{doc.namaFile}</TableCell>
                            <TableCell className="text-sm text-blue-700">
                              {doc.aoiJenis === 'REKOMENDASI' ? 'Rekomendasi' : 'Saran'} #{doc.aoiUrutan}
                            </TableCell>
                            <TableCell>{doc.subdirektorat || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">AOI Document</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                  onClick={() => handleDownload(doc.namaFile)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 border border-blue-200 rounded-lg bg-blue-50">
                  <FileText className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-700 text-sm">Belum ada dokumen tambahan dari AOI</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Dokumen yang diupload dari panel AOI akan muncul di sini
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default AdminArchivePanel;
