import React, { useMemo, useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface UserDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  year: number;
  checklistId?: number;
  checklistDescription?: string;
  aspect?: string;
  status: 'uploaded' | 'pending';
  subdirektorat?: string;
  // User information
  uploadedBy: string;
  userRole: 'superadmin' | 'admin';
  userDirektorat?: string;
  userSubdirektorat?: string;
  userDivisi?: string;
  userWhatsApp?: string;
  userEmail?: string;
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
  const { toast } = useToast();

  // State for API data
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [apiFiles, setApiFiles] = useState<any[]>([]);

  // Fetch files from API when year changes
  useEffect(() => {
    const fetchFilesFromAPI = async () => {
      if (!selectedYear) {
        setApiFiles([]);
        return;
      }

      setIsLoadingFiles(true);
      try {
        const apiUrl = `http://localhost:5001/api/uploaded-files?year=${selectedYear}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setApiFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching files:', error);
        setApiFiles([]);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFilesFromAPI();
  }, [selectedYear]);

  // Handle file download - same as ArsipDokumen
  const handleDownload = async (doc: UserDocument) => {
    try {
      console.log(`🔍 Downloading file: ${doc.fileName} (ID: ${doc.id})`);
      
      // Fetch the actual file from API
      const response = await fetch(`http://localhost:5001/api/download-file/${doc.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to download file`);
      }
      
      const blob = await response.blob();
      
      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
      link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Berhasil",
        description: `File ${doc.fileName} berhasil didownload`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Gagal",
        description: `Gagal mendownload file ${doc.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };


  // Get all documents with user information from API data
  const allDocuments = useMemo(() => {
    if (!selectedYear || isLoadingFiles) return [];
    
    try {
      // Get users data from localStorage
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Map API files to documents with user info
      const documentsWithUsers = apiFiles.map(file => {
        // Find user by uploadedBy name or email
        const fileUser = usersData.find((u: any) => 
          u.name === file.uploadedBy || u.email === file.uploadedBy
        );
        
        return {
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize || 0,
          uploadDate: new Date(file.uploadDate),
          year: file.year,
          checklistId: file.checklistId,
          checklistDescription: file.checklistDescription,
          aspect: file.aspect,
          status: file.status || 'uploaded',
          subdirektorat: file.subdirektorat,
          uploadedBy: file.uploadedBy || 'Unknown',
          userRole: fileUser?.role || 'admin',
          userDirektorat: fileUser?.direktorat || file.userDirektorat,
          userSubdirektorat: fileUser?.subdirektorat || file.userSubdirektorat,
          userDivisi: fileUser?.divisi || file.userDivisi,
          userWhatsApp: fileUser?.whatsapp,
          userEmail: fileUser?.email,
          source: 'REGULAR' as const
        };
      });
      
      return documentsWithUsers;
    } catch (error) {
      console.error('Error processing documents:', error);
      return [];
    }
  }, [selectedYear, apiFiles, isLoadingFiles]);

  // Filter documents for current year (admin's subdirektorat only)
  const currentYearDocuments = useMemo(() => {
    if (!user?.subdirektorat) return [];
    
    return allDocuments.filter(doc => 
      doc.userSubdirektorat === user.subdirektorat
    );
  }, [allDocuments, user?.subdirektorat]);

  // Filter documents for previous years (all subdirektorat)
  const previousYearDocuments = useMemo(() => {
    return allDocuments;
  }, [allDocuments]);
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
                      <TableHead className="text-blue-900 font-semibold">Deskripsi GCG</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentYearDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={doc.checklistDescription || 'N/A'}>
                            {doc.checklistDescription || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{doc.aspect || 'N/A'}</TableCell>
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
                              onClick={() => handleDownload(doc)}
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

            {/* AOI Documents Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Dokumen AOI
              </h3>
              
              {/* Get AOI documents for the current year and user's subdirektorat */}
              {(() => {
                const aoiDocs = getDocumentsByYear(selectedYear || 0)
                  .filter(doc => doc.userSubdirektorat === user?.subdirektorat);
                
                return aoiDocs.length > 0 ? (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Jenis</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {aoiDocs.map((doc) => (
                          <TableRow key={doc.id} className="hover:bg-blue-50/50">
                            <TableCell className="font-medium">{doc.fileName}</TableCell>
                            <TableCell className="text-sm text-blue-700">
                              AOI Document
                            </TableCell>
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
                                  onClick={() => handleDownload({
                                    id: doc.id,
                                    fileName: doc.fileName,
                                    fileSize: 0,
                                    uploadDate: doc.uploadDate,
                                    year: doc.tahun,
                                    status: 'uploaded',
                                    uploadedBy: 'AOI User',
                                    userRole: 'admin',
                                    source: 'AOI'
                                  } as UserDocument)}
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
                    <p className="text-blue-700 text-sm">Belum ada dokumen AOI</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Dokumen yang diupload dari panel AOI akan muncul di sini
                  </p>
                </div>
                );
              })()}
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
            {previousYearDocuments.length > 0 ? (
              <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Deskripsi GCG</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Subdirektorat</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousYearDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={doc.checklistDescription || 'N/A'}>
                            {doc.checklistDescription || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{doc.aspect || 'N/A'}</TableCell>
                        <TableCell>{doc.userSubdirektorat || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              onClick={() => handleDownload(doc)}
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

            {/* AOI Documents Section for Previous Years */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Dokumen AOI
              </h3>
              
              {/* Get AOI documents for the selected year */}
              {(() => {
                const aoiDocs = getDocumentsByYear(selectedYear || 0);
                
                return aoiDocs.length > 0 ? (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-900 font-semibold">Nama File</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Jenis</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Subdirektorat</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Tanggal Upload</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {aoiDocs.map((doc) => (
                          <TableRow key={doc.id} className="hover:bg-blue-50/50">
                            <TableCell className="font-medium">{doc.fileName}</TableCell>
                            <TableCell className="text-sm text-blue-700">
                              AOI Document
                            </TableCell>
                            <TableCell>{doc.userSubdirektorat || 'N/A'}</TableCell>
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
                                  onClick={() => handleDownload({
                                    id: doc.id,
                                    fileName: doc.fileName,
                                    fileSize: 0,
                                    uploadDate: doc.uploadDate,
                                    year: doc.tahun,
                                    status: 'uploaded',
                                    uploadedBy: 'AOI User',
                                    userRole: 'admin',
                                    source: 'AOI'
                                  } as UserDocument)}
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
                    <p className="text-blue-700 text-sm">Belum ada dokumen AOI</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Dokumen yang diupload dari panel AOI akan muncul di sini
                  </p>
                </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default AdminArchivePanel;
