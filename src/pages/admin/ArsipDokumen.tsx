import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel } from '@/components/panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useYear } from '@/contexts/YearContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { YearSelectorPanel } from '@/components/panels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentList from '@/components/dashboard/DocumentList';
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
  Clock
} from 'lucide-react';

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { checklist } = useChecklist();
  const { direktorat: direktoratData, subdirektorat: subDirektoratData } = useStrukturPerusahaan();
  
  // Transform object arrays to string arrays for display
  const direktorats = useMemo(() => {
    if (!direktoratData || !Array.isArray(direktoratData)) return [];
    if (!selectedYear) return [];
    
    try {
      return direktoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing direktorat data:', error);
      return [];
    }
  }, [direktoratData, selectedYear]);
  
  const subDirektorats = useMemo(() => {
    if (!subDirektoratData || !Array.isArray(subDirektoratData)) return [];
    if (!selectedYear) return [];
    
    try {
      return subDirektoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing subdirektorat data:', error);
      return [];
    }
  }, [subDirektoratData, selectedYear]);
  const [downloadType, setDownloadType] = useState<'all' | 'aspect' | 'direktorat' | 'subdirektorat'>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('');
  const [selectedDirektorat, setSelectedDirektorat] = useState<string>('');
  const [selectedSubDirektorat, setSelectedSubDirektorat] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

      // Get documents for selected year
  const yearDocuments = useMemo(() => {
    return documents.filter(doc => doc.year === selectedYear);
  }, [documents, selectedYear]);

  // Get unique values for download options
  const aspects = useMemo(() => {
    if (!checklist || !Array.isArray(checklist)) return [];
    if (!selectedYear) return [];
    
    try {
      const yearChecklist = checklist.filter(item => item && item.tahun === selectedYear);
      return Array.from(new Set(yearChecklist.map(item => item.aspek).filter(Boolean)));
    } catch (error) {
      console.error('Error processing checklist data:', error);
      return [];
    }
  }, [checklist, selectedYear]);

  // Data direktorat dan subdirektorat sudah didapat dari context

  // Filter documents based on download type and selection
  const getFilteredDocumentsForDownload = () => {
    let filtered = yearDocuments;

    switch (downloadType) {
      case 'aspect':
        if (selectedAspect) {
          filtered = filtered.filter(doc => {
            if (!doc.checklistId) return false;
            const checklistItem = checklist.find(item => item.id === doc.checklistId);
            return checklistItem && checklistItem.aspek === selectedAspect;
          });
        }
        break;
      case 'direktorat':
        if (selectedDirektorat) {
          filtered = filtered.filter(doc => doc.direktorat === selectedDirektorat);
        }
        break;
      case 'subdirektorat':
        if (selectedSubDirektorat) {
          filtered = filtered.filter(doc => doc.subdirektorat === selectedSubDirektorat);
        }
        break;
      default:
        // 'all' - no filtering needed
        break;
    }

    return filtered;
  };

  const filteredDocuments = getFilteredDocumentsForDownload();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = (docs: any[]) => {
    return docs.reduce((total, doc) => total + (doc.fileSize || 0), 0);
  };

  const handleDownload = async () => {
    if (filteredDocuments.length === 0) {
      alert('Tidak ada dokumen yang dapat diunduh berdasarkan kriteria yang dipilih.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create download filename based on type
      let filename = `GCG_Documents_${selectedYear}`;
      switch (downloadType) {
        case 'aspect':
          filename += `_Aspek_${selectedAspect}`;
          break;
        case 'direktorat':
          filename += `_Direktorat_${selectedDirektorat}`;
          break;
        case 'subdirektorat':
          filename += `_SubDirektorat_${selectedSubDirektorat}`;
          break;
        default:
          filename += '_Semua';
      }
      filename += '.zip';

      // Create and download ZIP file (simulated)
      const link = document.createElement('a');
      link.href = 'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Success message
      const totalSize = getTotalSize(filteredDocuments);
      alert(`Download berhasil!\n\nFile: ${filename}\nDokumen: ${filteredDocuments.length} file\nUkuran: ${formatFileSize(totalSize)}`);
    } catch (error) {
      alert('Terjadi kesalahan saat mengunduh file.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const getDownloadTypeInfo = () => {
    switch (downloadType) {
      case 'all':
        return {
          title: 'Unduh Semua Dokumen',
          description: 'Mengunduh semua dokumen GCG untuk tahun yang dipilih',
          icon: <Archive className="w-5 h-5" />,
          color: 'bg-blue-500'
        };
      case 'aspect':
        return {
          title: 'Unduh Per Aspek',
          description: 'Mengunduh dokumen berdasarkan aspek dokumen GCG',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'bg-green-500'
        };
      case 'direktorat':
        return {
          title: 'Unduh Per Direktorat',
          description: 'Mengunduh dokumen berdasarkan direktorat',
          icon: <Building2 className="w-5 h-5" />,
          color: 'bg-purple-500'
        };
      case 'subdirektorat':
        return {
          title: 'Unduh Per Sub Direktorat',
          description: 'Mengunduh dokumen berdasarkan sub direktorat',
          icon: <Users className="w-5 h-5" />,
          color: 'bg-pink-500'
        };
    }
  };

  const downloadInfo = getDownloadTypeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />
      <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
                      <PageHeaderPanel
              title="Arsip Dokumen"
              subtitle="Kelola dokumen GCG berdasarkan tahun buku"
            />

          {/* Year Selector Panel */}
          <div className="mb-8">
            <YearSelectorPanel
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={availableYears}
              title="Tahun Buku"
              description="Pilih tahun buku untuk mengelola dokumen GCG"
            />
          </div>

          {/* Warning when no year is selected */}
          {!selectedYear && (
            <div className="mb-6">
              <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800">Tahun Buku Belum Dipilih</h3>
                      <p className="text-yellow-700">
                        Silakan pilih tahun buku terlebih dahulu untuk mengakses fitur arsip dokumen.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Download Panel */}
          <div className="mb-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${downloadInfo.color} text-white`}>
                      {downloadInfo.icon}
                  </div>
                  <div>
                      <CardTitle className="text-base">{downloadInfo.title}</CardTitle>
                      <CardDescription className="text-xs">{downloadInfo.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {filteredDocuments.length} dokumen
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Download Type Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant={downloadType === 'all' ? 'default' : 'outline'}
                      onClick={() => setDownloadType('all')}
                      className="h-auto p-2 flex flex-col items-center space-y-1 text-xs"
                    >
                      <Archive className="w-4 h-4" />
                      <span className="text-xs font-medium">Semua</span>
                    </Button>
                    <Button
                      variant={downloadType === 'aspect' ? 'default' : 'outline'}
                      onClick={() => setDownloadType('aspect')}
                      className="h-auto p-2 flex flex-col items-center space-y-1 text-xs"
                      disabled={aspects.length === 0}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Per Aspek</span>
                      {aspects.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                          {aspects.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={downloadType === 'direktorat' ? 'default' : 'outline'}
                      onClick={() => setDownloadType('direktorat')}
                      className="h-auto p-2 flex flex-col items-center space-y-1 text-xs"
                      disabled={direktorats.length === 0}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Per Direktorat</span>
                      {direktorats.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                          {direktorats.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant={downloadType === 'subdirektorat' ? 'default' : 'outline'}
                      onClick={() => setDownloadType('subdirektorat')}
                      className="h-auto p-2 flex flex-col items-center space-y-1 text-xs"
                      disabled={subDirektorats.length === 0}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium">Per Sub Direktorat</span>
                      {subDirektorats.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                          {subDirektorats.length}
                        </Badge>
                      )}
                    </Button>
                       </div>
                      
                  {/* Specific Selection */}
                  {downloadType !== 'all' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-gray-700">
                          Pilih {downloadType === 'aspect' ? 'Aspek' : downloadType === 'direktorat' ? 'Direktorat' : 'Sub Direktorat'}:
                        </span>
                      </div>
                      
                      {downloadType === 'aspect' && aspects.length > 0 && (
                        <Select value={selectedAspect} onValueChange={setSelectedAspect}>
                          <SelectTrigger className="w-full md:w-64 h-8 text-xs">
                            <SelectValue placeholder="Pilih aspek dokumen GCG" />
                          </SelectTrigger>
                          <SelectContent>
                            {aspects.map(aspect => (
                              <SelectItem key={aspect} value={aspect} className="text-xs">{aspect}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {downloadType === 'direktorat' && direktorats.length > 0 && (
                        <Select value={selectedDirektorat} onValueChange={setSelectedDirektorat}>
                          <SelectTrigger className="w-full md:w-64 h-8 text-xs">
                            <SelectValue placeholder="Pilih direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                            {direktorats.map(direktorat => (
                              <SelectItem key={direktorat} value={direktorat} className="text-xs">{direktorat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {downloadType === 'subdirektorat' && subDirektorats.length > 0 && (
                        <Select value={selectedSubDirektorat} onValueChange={setSelectedSubDirektorat}>
                          <SelectTrigger className="w-full md:w-64 h-8 text-xs">
                            <SelectValue placeholder="Pilih sub direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                            {subDirektorats.map(subDirektorat => (
                              <SelectItem key={subDirektorat} value={subDirektorat} className="text-xs">{subDirektorat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* No Data Available */}
                      {((downloadType === 'aspect' && aspects.length === 0) ||
                        (downloadType === 'direktorat' && direktorats.length === 0) ||
                        (downloadType === 'subdirektorat' && subDirektorats.length === 0)) && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              Belum ada data {downloadType === 'aspect' ? 'aspek' : downloadType === 'direktorat' ? 'direktorat' : 'sub direktorat'} yang tersedia.
                            </span>
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                      
                  {/* Download Summary */}
                  {filteredDocuments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Ringkasan Download</span>
                          </div>
                          <div className="text-xs text-blue-600 space-y-0.5">
                            <div>• Jumlah dokumen: {filteredDocuments.length} file</div>
                            <div>• Total ukuran: {formatFileSize(getTotalSize(filteredDocuments))}</div>
                            <div>• Tahun: {selectedYear}</div>
                            {downloadType !== 'all' && (
                              <div>• Filter: {downloadType === 'aspect' ? selectedAspect : downloadType === 'direktorat' ? selectedDirektorat : selectedSubDirektorat}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                        <Button 
                            onClick={handleDownload}
                            disabled={isDownloading || (downloadType !== 'all' && !selectedAspect && !selectedDirektorat && !selectedSubDirektorat)}
                            className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                          >
                            {isDownloading ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                {downloadProgress}%
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                Unduh ZIP
                              </>
                            )}
                        </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Documents Warning */}
                  {filteredDocuments.length === 0 && yearDocuments.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs text-yellow-800">
                          Tidak ada dokumen yang sesuai dengan kriteria yang dipilih.
                        </span>
              </div>
            </div>
                  )}

                  {/* No Documents at All */}
                  {yearDocuments.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-600">
                          Belum ada dokumen untuk tahun {selectedYear}.
                        </span>
          </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List Panel */}
          <div className="mb-8">
            <DocumentList 
              year={selectedYear}
              showFilters={true}
              filterYear={selectedYear}
            />
                  </div>

          {/* Additional Content Area - Placeholder untuk fitur yang akan dikembangkan */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-white" />
                      </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Fitur Arsip Dokumen
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                Panel daftar dokumen dan fitur download fleksibel telah berhasil ditambahkan. 
                Fitur arsip dokumen lainnya sedang dalam pengembangan.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-2 text-green-800">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Tahun Buku Aktif: {selectedYear}</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Panel daftar dokumen dan fitur download terintegrasi dengan tahun buku dan siap untuk fitur arsip dokumen yang akan datang.
                    </p>
                  </div>
                  </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArsipDokumen;
