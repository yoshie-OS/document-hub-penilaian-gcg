import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel } from '@/components/panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useYear } from '@/contexts/YearContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { YearSelectorPanel } from '@/components/panels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download,
  Archive,
  CheckCircle,
  Building2,
  Users,
  AlertCircle,
  Calendar,
  FolderOpen,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();
  const { direktorat: direktoratData, subdirektorat: subDirektoratData } = useStrukturPerusahaan();
  
  // State untuk error handling
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Transform object arrays to string arrays for display dengan error handling
  const direktorats = useMemo(() => {
    try {
      if (!direktoratData || !Array.isArray(direktoratData)) return [];
      if (!selectedYear) return [];
      
      return direktoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing direktorat data:', error);
      setHasError(true);
      setErrorMessage('Error memproses data direktorat');
      return [];
    }
  }, [direktoratData, selectedYear]);
  
  const subDirektorats = useMemo(() => {
    try {
      if (!subDirektoratData || !Array.isArray(subDirektoratData)) return [];
      if (!selectedYear) return [];
      
      return subDirektoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing subdirektorat data:', error);
      setHasError(true);
      setErrorMessage('Error memproses data subdirektorat');
      return [];
    }
  }, [subDirektoratData, selectedYear]);

  const [downloadType, setDownloadType] = useState<'all' | 'aspect' | 'direktorat' | 'subdirektorat'>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('');
  const [selectedDirektorat, setSelectedDirektorat] = useState<string>('');
  const [selectedSubDirektorat, setSelectedSubDirektorat] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Get documents for selected year dengan error handling - menggunakan FileUploadContext
  const yearDocuments = useMemo(() => {
    try {
      if (!selectedYear) return [];
      
      // Get files from FileUploadContext instead of DocumentMetadata
      const yearFiles = getFilesByYear(selectedYear);
      return yearFiles.map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        uploadDate: file.uploadDate,
        year: file.year,
        aspect: file.aspect || 'Unknown Aspect',
        subdirektorat: file.subdirektorat || 'Unknown',
        status: file.status,
        checklistId: file.checklistId,
        checklistDescription: file.checklistDescription
      }));
    } catch (error) {
      console.error('Error processing documents:', error);
      setHasError(true);
      setErrorMessage('Error memproses dokumen');
      return [];
    }
  }, [selectedYear, getFilesByYear]);

  // Get unique values for download options dengan error handling
  const aspects = useMemo(() => {
    try {
      if (!yearDocuments || !Array.isArray(yearDocuments)) return [];
      
      const uniqueAspects = [...new Set(yearDocuments.map(doc => doc.aspect))];
      return uniqueAspects.filter(Boolean).sort();
    } catch (error) {
      console.error('Error processing aspects:', error);
      setHasError(true);
      setErrorMessage('Error memproses aspek');
      return [];
    }
  }, [yearDocuments]);

  // Get unique subdirektorats
  const uniqueSubDirektorats = useMemo(() => {
    try {
      if (!yearDocuments || !Array.isArray(yearDocuments)) return [];
      
      const uniqueSubs = [...new Set(yearDocuments.map(doc => doc.subdirektorat))];
      return uniqueSubs.filter(Boolean).sort();
    } catch (error) {
      console.error('Error processing subdirektorats:', error);
      setHasError(true);
      setErrorMessage('Error memproses subdirektorat');
      return [];
    }
  }, [yearDocuments]);

  // Filter documents based on selected criteria
  const filteredDocuments = useMemo(() => {
    try {
      if (!yearDocuments || !Array.isArray(yearDocuments)) return [];
      
      let filtered = yearDocuments;

      // Filter by aspect
      if (selectedAspect && selectedAspect !== 'all') {
        filtered = filtered.filter(doc => doc.aspect === selectedAspect);
      }

      // Filter by direktorat
      if (selectedDirektorat && selectedDirektorat !== 'all') {
        filtered = filtered.filter(doc => {
          // Find subdirektorat that belongs to selected direktorat
          const subDirektoratItem = subDirektoratData?.find(sub => 
            sub.nama === doc.subdirektorat && sub.tahun === selectedYear
          );
          return subDirektoratItem?.direktorat === selectedDirektorat;
        });
      }

      // Filter by subdirektorat
      if (selectedSubDirektorat && selectedSubDirektorat !== 'all') {
        filtered = filtered.filter(doc => doc.subdirektorat === selectedSubDirektorat);
      }

      return filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    } catch (error) {
      console.error('Error filtering documents:', error);
      setHasError(true);
      setErrorMessage('Error memfilter dokumen');
      return [];
    }
  }, [yearDocuments, selectedAspect, selectedDirektorat, selectedSubDirektorat, selectedYear, subDirektoratData]);

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge className="bg-green-100 text-green-800">Uploaded</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (filteredDocuments.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Create download content
      let downloadContent = '';
      
      switch (downloadType) {
        case 'all':
          downloadContent = filteredDocuments.map(doc => 
            `${doc.fileName},${doc.aspect},${doc.subdirektorat},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
          ).join('\n');
          break;
        case 'aspect':
          if (selectedAspect) {
            const aspectDocs = filteredDocuments.filter(doc => doc.aspect === selectedAspect);
            downloadContent = aspectDocs.map(doc => 
              `${doc.fileName},${doc.aspect},${doc.subdirektorat},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
            ).join('\n');
          }
          break;
        case 'direktorat':
          if (selectedDirektorat) {
            const direktoratDocs = filteredDocuments.filter(doc => {
              const subDirektoratItem = subDirektoratData?.find(sub => 
                sub.nama === doc.subdirektorat && sub.tahun === selectedYear
              );
              return subDirektoratItem?.direktorat === selectedDirektorat;
            });
            downloadContent = direktoratDocs.map(doc => 
              `${doc.fileName},${doc.aspect},${doc.subdirektorat},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
            ).join('\n');
          }
          break;
        case 'subdirektorat':
          if (selectedSubDirektorat) {
            const subDirektoratDocs = filteredDocuments.filter(doc => doc.subdirektorat === selectedSubDirektorat);
            downloadContent = subDirektoratDocs.map(doc => 
              `${doc.fileName},${doc.aspect},${doc.subdirektorat},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
            ).join('\n');
          }
          break;
      }

      // Create and download file
      const blob = new Blob([downloadContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arsip_dokumen_${selectedYear}_${downloadType}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Error boundary
  if (hasError) {
    return (
      <>
        <Sidebar />
        <Topbar />
        <div className={`
          transition-all duration-300 ease-in-out pt-16
          ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
        `}>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Terjadi</h3>
              <p className="text-red-600">{errorMessage}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Reload Halaman
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <Topbar />
      
      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Arsip Dokumen"
            subtitle="Kelola dan unduh dokumen yang telah diupload"
          />

          {/* Year Selector */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />

          {/* Content */}
          {selectedYear ? (
            <div className="space-y-6">
              {/* Download Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Download Dokumen</span>
                  </CardTitle>
                  <CardDescription>
                    Pilih jenis download dan filter yang diinginkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Download Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jenis Download</label>
                      <Select value={downloadType} onValueChange={(value: any) => setDownloadType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Dokumen</SelectItem>
                          <SelectItem value="aspect">Berdasarkan Aspek</SelectItem>
                          <SelectItem value="direktorat">Berdasarkan Direktorat</SelectItem>
                          <SelectItem value="subdirektorat">Berdasarkan Subdirektorat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aspect Filter */}
                    {downloadType === 'aspect' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pilih Aspek</label>
                        <Select value={selectedAspect} onValueChange={setSelectedAspect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Aspek" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Aspek</SelectItem>
                            {aspects.map(aspect => (
                              <SelectItem key={aspect} value={aspect}>{aspect}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Direktorat Filter */}
                    {downloadType === 'direktorat' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pilih Direktorat</label>
                        <Select value={selectedDirektorat} onValueChange={setSelectedDirektorat}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Direktorat</SelectItem>
                            {direktorats.map(direktorat => (
                              <SelectItem key={direktorat} value={direktorat}>{direktorat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Subdirektorat Filter */}
                    {downloadType === 'subdirektorat' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pilih Subdirektorat</label>
                        <Select value={selectedSubDirektorat} onValueChange={setSelectedSubDirektorat}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Subdirektorat" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Subdirektorat</SelectItem>
                            {uniqueSubDirektorats.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Download Button */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">&nbsp;</label>
                      <Button 
                        onClick={handleDownload} 
                        disabled={isDownloading || filteredDocuments.length === 0}
                        className="w-full"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Download Progress */}
                  {isDownloading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Download Progress</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Archive className="h-5 w-5" />
                    <span>Daftar Dokumen Tahun {selectedYear}</span>
                  </CardTitle>
                  <CardDescription>
                    Total {filteredDocuments.length} dokumen ditemukan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama File</TableHead>
                            <TableHead>Aspek</TableHead>
                            <TableHead>Subdirektorat</TableHead>
                            <TableHead>Tanggal Upload</TableHead>
                            <TableHead>Ukuran</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="truncate max-w-xs" title={doc.fileName}>
                                    {doc.fileName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{doc.aspect}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                  <span>{doc.subdirektorat}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span>{new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(doc.status)}
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
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada dokumen</h3>
                      <p className="text-gray-500">
                        Tidak ada dokumen yang ditemukan untuk tahun {selectedYear}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Empty State when no year selected */
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Archive className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku di atas untuk melihat arsip dokumen yang tersedia
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArsipDokumen;
