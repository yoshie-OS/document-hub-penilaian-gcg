import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel, YearSelectorPanel } from '@/components/panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useAOIDocument } from '@/contexts/AOIDocumentContext';
import { useToast } from '@/hooks/use-toast';
import CatatanDialog from '@/components/dialogs/CatatanDialog';
import JSZip from 'jszip';
import { 
  FileText, 
  Download,
  MessageSquare,
  Archive,
  Building2,
  User,
  Calendar,
  Mail,
  Phone,
  FolderOpen,
  Filter,
  CheckCircle,
  Trash2
} from 'lucide-react';

interface DocumentWithUser {
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
  catatan?: string; // Tambahkan field catatan
  // User information
  uploadedBy: string;
  userRole: 'superadmin' | 'admin';
  userDirektorat?: string;
  userSubdirektorat?: string;
  userDivisi?: string;
  userWhatsApp?: string;
  userEmail?: string;
}

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { getFilesByYear } = useFileUpload();
  const { documents } = useDocumentMetadata();
  const { user } = useUser();
  const { direktorat: direktoratData, subdirektorat: subDirektoratData, divisi: divisiData } = useStrukturPerusahaan();
  const { getDocumentsByYear, deleteDocument: deleteAOIDocument } = useAOIDocument();
  const { toast } = useToast();

  // Filter states
  const [selectedDirektorat, setSelectedDirektorat] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [selectedSubdirektorat, setSelectedSubdirektorat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // State for catatan dialog
  const [isCatatanDialogOpen, setIsCatatanDialogOpen] = useState(false);
  const [selectedDocumentForCatatan, setSelectedDocumentForCatatan] = useState<{
    catatan?: string;
    title?: string;
    fileName?: string;
  } | null>(null);
  

  // Get AOI documents for selected year
  const aoiDocuments = useMemo(() => {
    if (!selectedYear) return [];
    return getDocumentsByYear(selectedYear);
  }, [selectedYear, getDocumentsByYear]);

  // State for loading and API data
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [apiFiles, setApiFiles] = useState<any[]>([]);

  // Fetch files from Supabase API when year changes
  useEffect(() => {
    const fetchFilesFromAPI = async () => {
      console.log('🔍 ArsipDokumen fetchFilesFromAPI triggered, selectedYear:', selectedYear);
      
      if (!selectedYear) {
        console.log('🔍 ArsipDokumen: No selectedYear, clearing files');
        setApiFiles([]);
        return;
      }

      console.log('🔍 ArsipDokumen: Starting API fetch for year', selectedYear);
      setIsLoadingFiles(true);
      try {
        const apiUrl = `http://localhost:5000/api/uploaded-files?year=${selectedYear}`;
        console.log('🔍 ArsipDokumen: Calling API:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('🔍 ArsipDokumen: API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 ArsipDokumen: API response data:', data);
        console.log('🔍 ArsipDokumen: Files count:', data.files?.length || 0);
        setApiFiles(data.files || []);
      } catch (error) {
        console.error('❌ Error fetching files from API:', error);
        setApiFiles([]);
      } finally {
        setIsLoadingFiles(false);
        console.log('🔍 ArsipDokumen: Finished API fetch');
      }
    };

    fetchFilesFromAPI();
  }, [selectedYear]);

  // Get all documents with user information from API data
  const allDocuments = useMemo(() => {
    if (!selectedYear || isLoadingFiles) return [];
    
    try {
      // Convert API files to DocumentWithUser format
      const enrichedDocuments: DocumentWithUser[] = apiFiles.map(file => {
        // Get user details from users for contact info
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userData = users.find((u: any) => u.name === file.uploadedBy || u.email === file.uploadedBy);
        
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
          catatan: file.catatan,
          uploadedBy: file.uploadedBy || 'Unknown User',
          userRole: userData?.role || 'admin',
          userDirektorat: userData?.direktorat || file.userDirektorat || 'Unknown',
          userSubdirektorat: userData?.subdirektorat || file.userSubdirektorat || 'Unknown', 
          userDivisi: userData?.divisi || file.userDivisi || 'Unknown',
          userWhatsApp: userData?.whatsapp || '',
          userEmail: userData?.email || ''
        };
      });
      
      return enrichedDocuments.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } catch (error) {
      console.error('Error processing API files:', error);
      return [];
    }
  }, [selectedYear, apiFiles, isLoadingFiles]);

  // Filter documents based on selected criteria
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Filter by direktorat
        if (selectedDirektorat) {
      filtered = filtered.filter(doc => doc.userDirektorat === selectedDirektorat);
    }

    // Filter by aspect
    if (selectedAspect) {
      filtered = filtered.filter(doc => doc.aspect === selectedAspect);
    }

    // Filter by subdirektorat
    if (selectedSubdirektorat) {
      filtered = filtered.filter(doc => doc.userSubdirektorat === selectedSubdirektorat);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.aspect?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.checklistDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allDocuments, selectedDirektorat, selectedAspect, selectedSubdirektorat, searchTerm]);

  // Get unique values for filters
  const uniqueDirektorats = useMemo(() => {
    const direktorats = [...new Set(allDocuments.map(doc => doc.userDirektorat))];
    return direktorats.filter(Boolean).sort();
  }, [allDocuments]);

  const uniqueAspects = useMemo(() => {
    const aspects = [...new Set(allDocuments.map(doc => doc.aspect))];
    return aspects.filter(Boolean).sort();
  }, [allDocuments]);

  const uniqueSubdirektorats = useMemo(() => {
    const subdirektorats = [...new Set(allDocuments.map(doc => doc.userSubdirektorat))];
    return subdirektorats.filter(Boolean).sort();
  }, [allDocuments]);

  // Handle revision (WhatsApp or Email)
  const handleRevision = (document: DocumentWithUser) => {
    if (document.userWhatsApp) {
      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${document.userWhatsApp.replace(/[^0-9]/g, '')}`;
      window.open(whatsappUrl, '_blank');
    } else if (document.userEmail) {
      // Open email client
      const emailUrl = `mailto:${document.userEmail}?subject=Revisi Dokumen: ${document.fileName}&body=Halo, saya ingin merevisi dokumen ${document.fileName} yang telah diupload.`;
      window.open(emailUrl, '_blank');
    } else {
      alert('Tidak ada kontak WhatsApp atau email yang tersedia untuk user ini.');
    }
  };

  // Handle download single document
  const handleDownload = async (doc: DocumentWithUser) => {
    try {
      // Fetch the actual file from Supabase API
      const response = await fetch(`http://localhost:5000/api/download-file/${doc.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mendownload file. Silakan coba lagi.');
    }
  };

  // Handle delete document
  const handleDelete = async (doc: DocumentWithUser) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.fileName}"?\n\nDokumen ini akan dihapus secara permanen dari sistem.`)) {
      try {
        // Delete from Supabase API
        const response = await fetch(`http://localhost:5000/api/uploaded-files/${doc.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete document');
        }
        
        // Refresh the API data
        const refreshResponse = await fetch(`http://localhost:5000/api/uploaded-files?year=${selectedYear}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setApiFiles(refreshData.files || []);
        }
        
        alert('Dokumen berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Gagal menghapus dokumen. Silakan coba lagi.');
      }
    }
  };

  // Handle download AOI document
  const handleDownloadAOI = (fileName: string) => {
    // Create a mock file content for AOI documents
    const mockContent = `Mock AOI file content for ${fileName}\n\nThis is a placeholder file for AOI documents.\nFile: ${fileName}\nType: AOI Document\nDate: ${new Date().toLocaleDateString('id-ID')}`;
    
    // Create blob and download
    const blob = new Blob([mockContent], { type: 'text/plain' });
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

  // Handle revision for AOI document
  const handleRevisionAOI = async (doc: any) => {
    const revisionReason = prompt('Masukkan alasan revisi:');
    if (!revisionReason) return;

    try {
      // Update document status to require revision
      const response = await fetch(`http://localhost:5000/api/aoiDocuments/${doc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'revision_required',
          revision_reason: revisionReason,
          revised_at: new Date().toISOString(),
          revised_by: 'admin' // Should be current user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark document for revision');
      }

      // Show success notification
      toast({
        title: "Dokumen Diminta Revisi",
        description: `Dokumen "${doc.fileName}" telah diminta untuk direvisi`,
      });

      // Refresh documents to show updated status
      // This would trigger a re-fetch in the AOI context
      window.location.reload(); // Simple approach - could be improved with context refresh

    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: "Error",
        description: "Gagal meminta revisi dokumen",
        variant: "destructive"
      });
    }
  };

  // Handle delete AOI document
  const handleDeleteAOI = (doc: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen AOI "${doc.fileName}"?\n\nDokumen ini akan dihapus secara permanen dari sistem.`)) {
      try {
        // Use the AOI context method to delete the document
        // The deleteDocument method expects aoiRecommendationId
        deleteAOIDocument(doc.aoiRecommendationId);
        
        // Show success toast notification
        toast({
          title: "Dokumen berhasil dihapus",
          description: `Dokumen AOI "${doc.fileName}" telah dihapus dari sistem.`,
        });
        
        console.log(`Successfully deleted AOI document: ${doc.fileName}`);
      } catch (error) {
        console.error('Error deleting AOI document:', error);
        
        // Show error toast notification
        toast({
          title: "Gagal menghapus dokumen",
          description: "Terjadi kesalahan saat menghapus dokumen AOI. Silakan coba lagi.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle show catatan
  const handleShowCatatan = (document: any) => {
    setSelectedDocumentForCatatan({
      catatan: document.catatan || '',
      title: document.checklistDescription || document.fileName,
      fileName: document.fileName
    });
    setIsCatatanDialogOpen(true);
  };

  // Handle bulk download
  const handleBulkDownload = async (type: 'all' | 'direktorat' | 'aspect') => {
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

      // Get documents to download based on type
      let documentsToDownload = [];
      let fileName = '';

      switch (type) {
        case 'all':
          documentsToDownload = filteredDocuments;
          fileName = `arsip_dokumen_${selectedYear}_semua`;
          break;
        case 'direktorat':
          if (selectedDirektorat) {
            documentsToDownload = filteredDocuments.filter(doc => doc.userDirektorat === selectedDirektorat);
            fileName = `arsip_dokumen_${selectedYear}_${selectedDirektorat}`;
          }
          break;
        case 'aspect':
          if (selectedAspect) {
            documentsToDownload = filteredDocuments.filter(doc => doc.aspect === selectedAspect);
            fileName = `arsip_dokumen_${selectedYear}_${selectedAspect}`;
          }
          break;
      }

      if (documentsToDownload.length === 0) {
        alert('Tidak ada dokumen yang dapat didownload.');
        return;
      }

      // Create ZIP file
      const zip = new JSZip();
      
      // Add documents to ZIP - fetch real files from API
      for (let index = 0; index < documentsToDownload.length; index++) {
        const doc = documentsToDownload[index];
        try {
          // Fetch the actual file content from Supabase API
          const response = await fetch(`http://localhost:5000/api/download-file/${doc.id}`);
          
          if (response.ok) {
            const fileBlob = await response.blob();
            const folderPath = `${doc.userDirektorat || 'Unknown'}/${doc.userSubdirektorat || 'Unknown'}`;
            zip.file(`${folderPath}/${doc.fileName}`, fileBlob);
          } else {
            // If file fetch fails, add a placeholder with metadata
            const fileContent = `File could not be downloaded: ${doc.fileName}\n\n` +
              `File: ${doc.fileName}\n` +
              `Uploaded by: ${doc.uploadedBy}\n` +
              `Direktorat: ${doc.userDirektorat || 'N/A'}\n` +
              `Subdirektorat: ${doc.userSubdirektorat || 'N/A'}\n` +
              `Divisi: ${doc.userDivisi || 'N/A'}\n` +
              `Aspect: ${doc.aspect || 'N/A'}\n` +
              `Checklist Description: ${doc.checklistDescription || 'N/A'}\n` +
              `Upload Date: ${new Date(doc.uploadDate).toLocaleDateString('id-ID')}\n` +
              `Status: ${doc.status}\n\n` +
              `Error: File could not be retrieved from storage.`;

            const folderPath = `${doc.userDirektorat || 'Unknown'}/${doc.userSubdirektorat || 'Unknown'}`;
            zip.file(`${folderPath}/${doc.fileName}.txt`, fileContent);
          }
        } catch (error) {
          console.error(`Error fetching file ${doc.fileName}:`, error);
          // Add error placeholder
          const errorContent = `Error downloading: ${doc.fileName}\n\nError: ${error}`;
          const folderPath = `${doc.userDirektorat || 'Unknown'}/${doc.userSubdirektorat || 'Unknown'}`;
          zip.file(`${folderPath}/${doc.fileName}_ERROR.txt`, errorContent);
        }
        
        // Update progress
        setDownloadProgress(Math.round(((index + 1) / documentsToDownload.length) * 90));
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Download ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Download berhasil! File ${fileName}.zip berhasil diunduh dengan ${documentsToDownload.length} dokumen.`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Terjadi kesalahan saat download file ZIP.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
              title="Tahun Buku"
            description="Pilih tahun buku untuk melihat arsip dokumen yang tersedia"
          />

          {selectedYear ? (
            <div className="space-y-6">
              {/* Filters and Bulk Download */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Filter dan Download</span>
                  </CardTitle>
                  <CardDescription>
                    Filter dokumen dan download sesuai kriteria yang diinginkan
                  </CardDescription>
              </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Direktorat Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                        Direktorat
                      </label>
                      <Select value={selectedDirektorat || "all"} onValueChange={(value) => setSelectedDirektorat(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                          <SelectValue placeholder="Semua Direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="all">Semua Direktorat</SelectItem>
                          {uniqueDirektorats.map(direktorat => (
                            <SelectItem key={direktorat} value={direktorat}>{direktorat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>

                    {/* Aspect Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                        Aspek
                      </label>
                      <Select value={selectedAspect || "all"} onValueChange={(value) => setSelectedAspect(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-colors">
                          <SelectValue placeholder="Semua Aspek" />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="all">Semua Aspek</SelectItem>
                          {uniqueAspects.map(aspect => (
                            <SelectItem key={aspect} value={aspect}>{aspect}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>

                    {/* Subdirektorat Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-green-600" />
                        Subdirektorat
                      </label>
                      <Select value={selectedSubdirektorat || "all"} onValueChange={(value) => setSelectedSubdirektorat(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-green-300 focus:border-green-500 transition-colors">
                          <SelectValue placeholder="Semua Subdirektorat" />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="all">Semua Subdirektorat</SelectItem>
                          {uniqueSubdirektorats.map(subdirektorat => (
                            <SelectItem key={subdirektorat} value={subdirektorat}>{subdirektorat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-orange-600" />
                        Cari
                      </label>
                      <input
                        type="text"
                        placeholder="Cari dokumen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white hover:border-orange-300"
                      />
                    </div>
                  </div>

                  {/* Bulk Download Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => handleBulkDownload('all')}
                      disabled={isDownloading || filteredDocuments.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Semua ({filteredDocuments.length})
                    </Button>
                    
                    {selectedDirektorat && (
                      <Button 
                        onClick={() => handleBulkDownload('direktorat')}
                        disabled={isDownloading}
                        variant="outline"
                        className="border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download {selectedDirektorat}
                      </Button>
                    )}
                    
                    {selectedAspect && (
                      <Button 
                        onClick={() => handleBulkDownload('aspect')}
                        disabled={isDownloading}
                        variant="outline"
                        className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download {selectedAspect}
                      </Button>
                    )}
                  </div>

                  {/* Download Progress */}
                  {isDownloading && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between text-sm font-medium text-blue-800 mb-3">
                        <span className="flex items-center">
                          <Download className="h-4 w-4 mr-2 animate-pulse" />
                          Download Progress
                            </span>
                        <span className="bg-blue-100 px-3 py-1 rounded-full">{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                          style={{ width: `${downloadProgress}%` }}
                        />
                          </div>
                        </div>
                      )}
                </CardContent>
              </Card>

              {/* Documents List - Modern Card Grid Layout */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3 text-white">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Archive className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Daftar Dokumen Tahun {selectedYear}</span>
                      <div className="text-blue-100 text-sm font-normal mt-1">
                    Total {filteredDocuments.length} dokumen ditemukan
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredDocuments.length > 0 ? (
                    <div className="grid gap-4">
                      {filteredDocuments.map((doc) => (
                        <div key={doc.id} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-400 hover:scale-[1.02] transition-all duration-300 transform">
                          {/* Header Row */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                                <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 truncate max-w-[300px]" title={doc.fileName}>
                                    {doc.fileName}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs px-3 py-1">
                                      {formatFileSize(doc.fileSize)}
                                    </Badge>
                                  <Badge className={`text-xs px-3 py-1 ${
                                    doc.status === 'uploaded' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}>
                                    {doc.status === 'uploaded' ? 'Selesai' : 'Pending'}
                                    </Badge>
                                  </div>
                                </div>
                        </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevision(doc)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Revisi
                              </Button>
                              
                              {/* Tombol Catatan */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowCatatan(doc)}
                                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                title="Lihat catatan dokumen"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Catatan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(doc)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </Button>
                            </div>
                          </div>

                          {/* Content Grid - All sections aligned in one row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* User Information */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Pengirim</span>
                                </div>
                              <div className="pl-6 space-y-1">
                                <div className="text-sm font-semibold text-gray-900">{doc.uploadedBy}</div>
                                {doc.userRole === 'admin' && (
                                  <div className="space-y-1">
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs px-2 py-1">
                                      {doc.userDirektorat}
                                    </Badge>
                                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-xs px-2 py-1">
                                      {doc.userSubdirektorat}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs px-2 py-1">
                                      {doc.userDivisi}
                                    </Badge>
                          </div>
                            )}
                              </div>
                          </div>

                              {/* Document Details */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Detail Dokumen</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs px-2 py-1 max-w-full">
                                  {doc.aspect || 'Tidak Diberikan Aspek'}
                                </Badge>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                            {/* Dokumen GCG (sebelumnya Checklist GCG) */}
                            <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Dokumen GCG</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                {doc.checklistDescription ? (
                                  <div className="text-sm text-gray-900">
                                    <div className="font-medium text-indigo-600 mb-1">
                                      Deskripsi:
                                    </div>
                                    <div className="text-xs text-gray-700 bg-indigo-50 p-2 rounded border border-indigo-100 max-w-full">
                                      {doc.checklistDescription}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 italic">
                                    Deskripsi tidak tersedia
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contact Information - Separate section */}
                            <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Kontak</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                {doc.userRole === 'admin' && (doc.userWhatsApp || doc.userEmail) ? (
                                  <div className="space-y-1">
                                  {doc.userWhatsApp && (
                                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="truncate max-w-24" title={doc.userWhatsApp}>
                                        {doc.userWhatsApp}
                                      </span>
                                    </div>
                                  )}
                                  {doc.userEmail && (
                                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="truncate max-w-32" title={doc.userEmail}>
                                        {doc.userEmail}
                        </span>
              </div>
                                  )}
            </div>
                                ) : (
                                  <div className="text-sm text-gray-500 italic">
                                    Kontak tidak tersedia
            </div>
                  )}
                              </div>
                            </div>


          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Archive className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Belum Ada Dokumen
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Belum ada dokumen yang tersedia untuk tahun {selectedYear}. 
                        Dokumen akan muncul di sini setelah diupload oleh admin.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

            {/* Dokumen Tambahan dari AOI - Modern Card Layout */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-white">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">Dokumen Tambahan dari AOI</span>
                    <div className="text-purple-100 text-sm font-normal mt-1">
                      Total {aoiDocuments.length} dokumen AOI ditemukan
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {aoiDocuments.length > 0 ? (
                  <div className="grid gap-4">
                    {aoiDocuments.map((doc) => (
                      <div key={doc.id} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-purple-400 hover:scale-[1.02] transition-all duration-300 transform">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                              <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 truncate max-w-[300px]" title={doc.fileName}>
                                {doc.fileName}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`text-xs px-3 py-1 ${
                                  doc.aoiJenis === 'REKOMENDASI' 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                    : 'bg-green-100 text-green-800 border-green-200'
                                }`}>
                                  {doc.aoiJenis === 'REKOMENDASI' ? 'Rekomendasi' : 'Saran'} #{doc.aoiUrutan}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs px-3 py-1">
                                  AOI Document
                                </Badge>
                              </div>
                            </div>
                          </div>

                              {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                                <Button
                                  size="sm"
                              variant="outline" 
                              className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-colors"
                              onClick={() => handleDownloadAOI(doc.fileName)}
                                >
                              <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                              variant="outline" 
                              className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                              onClick={() => handleRevisionAOI(doc)}
                                >
                              <MessageSquare className="h-4 w-4 mr-2" />
                                  Revisi
                                </Button>
                                
                                {/* Tombol Catatan untuk AOI */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleShowCatatan(doc)}
                                  className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                  title="Lihat catatan dokumen"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Catatan
                                </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                              onClick={() => handleDeleteAOI(doc)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                                </Button>
                              </div>
                            </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Pengirim Information */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Pengirim</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <div className="space-y-1">
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs px-2 py-1">
                                  {doc.userDirektorat}
                                </Badge>
                                <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-xs px-2 py-1">
                                  {doc.userSubdirektorat}
                                </Badge>
                                {doc.userDivisi && (
                                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs px-2 py-1">
                                    {doc.userDivisi}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Document Details */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Detail Dokumen</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Tanggal Upload:</span>
                                <div className="mt-1 text-xs text-gray-500">
                                  {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                            </div>
                          </div>

                          
          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Belum Ada Dokumen AOI
                      </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Belum ada dokumen tambahan dari AOI. 
                      Dokumen yang diupload dari panel AOI akan muncul di sini.
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

      {/* Catatan Dialog */}
      <CatatanDialog
        isOpen={isCatatanDialogOpen}
        onClose={() => setIsCatatanDialogOpen(false)}
        catatan={selectedDocumentForCatatan?.catatan}
        documentTitle={selectedDocumentForCatatan?.title}
        fileName={selectedDocumentForCatatan?.fileName}
      />
    </>
  );
};

export default ArsipDokumen;
