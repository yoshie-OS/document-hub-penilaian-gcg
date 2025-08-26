import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FolderOpen,
  Eye,
  Upload,
  Download,
  FileText
} from 'lucide-react';

interface UserDocument {
  id: string | number;
  namaFile: string;
  aspek: string;
  subdirektorat: string;
  uploadDate: string;
  status: string;
  tahunBuku: string;
}

interface AdminArchivePanelProps {
  selectedYear: number | null;
  currentYearDocuments: UserDocument[];
  previousYearDocuments: UserDocument[];
  canUploadInCurrentYear: boolean;
  isCurrentYear: boolean;
}

const AdminArchivePanel: React.FC<AdminArchivePanelProps> = ({
  selectedYear,
  currentYearDocuments,
  previousYearDocuments,
  canUploadInCurrentYear,
  isCurrentYear
}) => {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 h-5" />
            <span>Arsip Dokumen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Dokumen Tahun {selectedYear}
              </h3>
              <p className="text-sm text-gray-600">Hanya dokumen subdirektorat Anda</p>
            </div>
            
            {currentYearDocuments.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama File</TableHead>
                      <TableHead>Aspek</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentYearDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.namaFile}</TableCell>
                        <TableCell>{doc.aspek}</TableCell>
                        <TableCell>
                          {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                            {canUploadInCurrentYear && (
                              <Button size="sm" variant="outline">
                                <Upload className="h-4 w-4 mr-1" />
                                Update
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada dokumen untuk tahun {selectedYear}</p>
                {canUploadInCurrentYear && (
                  <p className="text-sm text-gray-500 mt-1">
                    Mulai upload dokumen untuk memulai progress
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Panel untuk tahun lama - semua dokumen dari semua subdirektorat
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 h-5" />
            <span>Arsip Dokumen - Tahun {selectedYear}</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Semua dokumen dari semua subdirektorat untuk tahun {selectedYear}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previousYearDocuments.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama File</TableHead>
                      <TableHead>Aspek</TableHead>
                      <TableHead>Subdirektorat</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousYearDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.namaFile}</TableCell>
                        <TableCell>{doc.aspek}</TableCell>
                        <TableCell>{doc.subdirektorat || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                            <Button size="sm" variant="outline">
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
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada dokumen untuk tahun {selectedYear}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Dokumen yang diupload akan muncul di sini
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default AdminArchivePanel;
