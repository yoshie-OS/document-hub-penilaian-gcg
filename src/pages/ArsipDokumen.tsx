import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel, YearSelectorPanel } from '@/components/panels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useToast } from '@/hooks/use-toast';
import { CatatanDialog } from '@/components/dialogs';
import {
  Archive,
  Search,
  FileText,
  Download,
  Eye,
  Calendar,
  Users,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Building,
  UserCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface CatatanDocumentState {
  catatan?: string;
  title?: string;
  fileName?: string;
}

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { documents } = useDocumentMetadata();
  const { getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();
  const { toast } = useToast();

  // State for bulk download and refresh
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedSubdirektorat, setSelectedSubdirektorat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // State for catatan dialog
  const [isCatatanDialogOpen, setIsCatatanDialogOpen] = useState(false);
  const [selectedDocumentForCatatan, setSelectedDocumentForCatatan] = useState<CatatanDocumentState | null>(null);

  // State to track actual file existence from Supabase
  const [supabaseFileStatus, setSupabaseFileStatus] = useState<{[key: string]: boolean}>({});
  const [supabaseFileInfo, setSupabaseFileInfo] = useState<{[key: string]: any}>({});
  const [fileStatusLoading, setFileStatusLoading] = useState<boolean>(false);

  // Check if dokumen GCG item is uploaded - now uses Supabase file status
  const isChecklistUploaded = useCallback((checklistId: number) => {
    if (!selectedYear) return false;
    
    // Check Supabase file status first (authoritative)
    const supabaseExists = supabaseFileStatus[checklistId.toString()] || false;
    
    if (supabaseExists) {
      return true;
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const localFileExists = yearFiles.some(file => file.checklistId === checklistIdInt);
    
    return localFileExists;
  }, [supabaseFileStatus, getFilesByYear, selectedYear]);

  // Get uploaded document for dokumen GCG - now uses Supabase file status with localStorage fallback
  const getUploadedDocument = useCallback((checklistId: number) => {
    if (!selectedYear) return null;
    
    // First check if file exists in Supabase
    const supabaseExists = supabaseFileStatus[checklistId.toString()];
    if (supabaseExists && supabaseFileInfo[checklistId.toString()]) {
      return supabaseFileInfo[checklistId.toString()];
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const foundFile = yearFiles.find(file => file.checklistId === checklistIdInt);
    
    return foundFile;
  }, [supabaseFileStatus, supabaseFileInfo, getFilesByYear, selectedYear]);

  // Load file status from backend when year changes
  useEffect(() => {
    if (!selectedYear || availableYears.length === 0) return;

    const loadAllFileStatuses = async () => {
      try {
        setFileStatusLoading(true);
        
        // Get all checklist items for the selected year
        const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
        
        if (yearChecklist.length === 0) {
          setFileStatusLoading(false);
          return;
        }

        // Group by subdirektorat for batch API calls
        const subdirektoratGroups = yearChecklist.reduce((groups, item) => {
          // Try to get subdirektorat from assignment data or from PIC
          let subdirektorat = 'Unknown';
          
          // Check if there are assignments for this item
          const storedAssignments = localStorage.getItem('checklistAssignments');
          if (storedAssignments) {
            try {
              const allAssignments = JSON.parse(storedAssignments);
              const itemAssignment = allAssignments.find((assignment: any) => 
                assignment.checklistId === item.id && assignment.tahun === selectedYear
              );
              
              if (itemAssignment) {
                subdirektorat = itemAssignment.subdirektorat || itemAssignment.divisi || 'Unknown';
              }
            } catch (error) {
              console.error('Error parsing assignments:', error);
            }
          }
          
          if (!groups[subdirektorat]) {
            groups[subdirektorat] = [];
          }
          groups[subdirektorat].push(item.id);
          return groups;
        }, {} as Record<string, number[]>);

        // Process each subdirektorat group
        const newFileStatus: Record<string, boolean> = {};
        const newFileInfo: Record<string, any> = {};

        for (const [subdirektorat, checklistIds] of Object.entries(subdirektoratGroups)) {
          try {
            const response = await fetch('http://localhost:5000/api/check-gcg-files', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
              },
              body: JSON.stringify({
                picName: subdirektorat,
                year: selectedYear,
                checklistIds: checklistIds
              })
            });

            if (response.ok) {
              const result = await response.json();
              
              // Process file statuses for this subdirektorat
              Object.entries(result.fileStatuses || {}).forEach(([checklistId, fileStatus]: [string, any]) => {
                const fileExists = fileStatus?.exists || false;
                newFileStatus[checklistId] = fileExists;
                
                if (fileExists && fileStatus) {
                  newFileInfo[checklistId] = {
                    id: fileStatus.id || `supabase_${checklistId}`,
                    fileName: fileStatus.fileName,
                    fileSize: fileStatus.size,
                    uploadDate: new Date(fileStatus.lastModified),
                    checklistId: parseInt(checklistId),
                    catatan: fileStatus.catatan || '',
                    uploadedBy: fileStatus.uploadedBy || 'Unknown',
                    subdirektorat: fileStatus.subdirektorat || subdirektorat,
                    aspect: fileStatus.aspect || '',
                    checklistDescription: fileStatus.checklistDescription || ''
                  };
                }
              });
            }
          } catch (error) {
            console.error(`Error checking files for subdirektorat ${subdirektorat}:`, error);
          }
        }

        // Update state with all collected data
        setSupabaseFileStatus(newFileStatus);
        setSupabaseFileInfo(newFileInfo);
        
      } catch (error) {
        console.error('Error loading file statuses:', error);
      } finally {
        setFileStatusLoading(false);
      }
    };

    loadAllFileStatuses();
  }, [selectedYear, checklist, availableYears]);

  // Get all uploaded documents for the selected year
  const allUploadedDocuments = useMemo(() => {
    if (!selectedYear) return [];
    
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    
    return yearChecklist
      .map(item => {
        const uploadedDocument = getUploadedDocument(item.id);
        if (!uploadedDocument) return null;
        
        return {
          ...item,
          uploadedDocument,
          status: 'uploaded' as const
        };
      })
      .filter(Boolean);
  }, [selectedYear, checklist, getUploadedDocument, supabaseFileStatus, supabaseFileInfo]);

  // Get unique values for filters
  const uniqueAspects = useMemo(() => {
    const aspects = allUploadedDocuments.map(doc => doc?.aspek).filter(Boolean);
    return ['all', ...Array.from(new Set(aspects))];
  }, [allUploadedDocuments]);

  const uniqueSubdirektorats = useMemo(() => {
    const subdirektorats = allUploadedDocuments.map(doc => doc?.uploadedDocument?.subdirektorat).filter(Boolean);
    return ['all', ...Array.from(new Set(subdirektorats))];
  }, [allUploadedDocuments]);

  // Filter documents based on search and filter criteria
  const filteredDocuments = useMemo(() => {
    if (!allUploadedDocuments) return [];

    let filtered = allUploadedDocuments.filter(doc => {
      if (!doc) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          doc.deskripsi?.toLowerCase().includes(searchLower) ||
          doc.uploadedDocument?.fileName?.toLowerCase().includes(searchLower) ||
          doc.uploadedDocument?.uploadedBy?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Aspek filter
      if (selectedAspek !== 'all' && doc.aspek !== selectedAspek) {
        return false;
      }

      // Subdirektorat filter
      if (selectedSubdirektorat !== 'all' && doc.uploadedDocument?.subdirektorat !== selectedSubdirektorat) {
        return false;
      }

      return true;
    });

    // Sort by upload date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a?.uploadedDocument?.uploadDate || 0);
      const dateB = new Date(b?.uploadedDocument?.uploadDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [allUploadedDocuments, searchTerm, selectedAspek, selectedSubdirektorat]);

  // Handle view document
  const handleViewDocument = useCallback(async (checklistId: number) => {
    const uploadedFile = getUploadedDocument(checklistId);
    if (uploadedFile) {
      try {
        // Get file URL from backend API
        const response = await fetch(`http://localhost:5000/api/files/${uploadedFile.id}/view`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.url) {
            // Open file in new tab/window
            window.open(result.url, '_blank');
          } else {
            throw new Error(result.error || 'Failed to get file URL');
          }
        } else {
          throw new Error(`Failed to view document: ${response.status}`);
        }
      } catch (error) {
        console.error('Error viewing document:', error);
        alert(`Gagal membuka dokumen: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      alert('Dokumen tidak ditemukan');
    }
  }, [getUploadedDocument]);

  // Handle download document
  const handleDownloadDocument = useCallback(async (checklistId: number) => {
    const uploadedFile = getUploadedDocument(checklistId);
    if (uploadedFile) {
      try {
        // Download file through backend API
        const response = await fetch(`http://localhost:5000/api/files/${uploadedFile.id}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
          },
        });
        
        if (response.ok) {
          // Get the file blob
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = uploadedFile.fileName;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error(`Failed to download document: ${response.status}`);
        }
      } catch (error) {
        console.error('Error downloading document:', error);
        alert(`Gagal mendownload dokumen: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      alert('Dokumen tidak ditemukan');
    }
  }, [getUploadedDocument]);

  // Handle show catatan
  const handleShowCatatan = useCallback((checklistId: number) => {
    const uploadedDocument = getUploadedDocument(checklistId);
    const checklistItem = checklist.find(item => item.id === checklistId);
    
    if (uploadedDocument) {
      setSelectedDocumentForCatatan({
        catatan: uploadedDocument.catatan,
        title: checklistItem?.deskripsi,
        fileName: uploadedDocument.fileName
      });
      setIsCatatanDialogOpen(true);
    }
  }, [getUploadedDocument, checklist]);

  // Handle bulk download of all documents
  const handleBulkDownload = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch('http://localhost:5000/api/bulk-download-all-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          includeGCG: true,
          includeAOI: true,
          includeChecklist: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `All_Documents_${selectedYear}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2];
        }
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadProgress(100);
      toast({
        title: "✅ Download Berhasil",
        description: `File ${filename} berhasil didownload`,
        duration: 5000
      });

    } catch (error) {
      console.error('Bulk download error:', error);
      toast({
        title: "❌ Download Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat download",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Handle refresh tracking tables
  const handleRefreshTables = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:5000/api/refresh-tracking-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "✅ Refresh Berhasil",
        description: `Dibersihkan: ${result.gcgCleaned || 0} record GCG, ${result.aoiCleaned || 0} record AOI`,
        duration: 5000
      });

      // Refresh the file status after cleaning
      setSupabaseFileStatus({});
      setSupabaseFileInfo({});

    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "❌ Refresh Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat refresh",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get aspect icon
  const getAspectIcon = useCallback((aspekName: string) => {
    if (aspekName === 'KESELURUHAN') return TrendingUp;
    if (aspekName.includes('ASPEK I')) return FileText;
    if (aspekName.includes('ASPEK II')) return Building;
    if (aspekName.includes('ASPEK III')) return Users;
    if (aspekName.includes('ASPEK IV')) return UserCheck;
    if (aspekName.includes('ASPEK V')) return CheckCircle;
    return FileText;
  }, []);

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
            actions={[
              {
                label: isRefreshing ? "Refreshing..." : "Refresh Tabel",
                onClick: handleRefreshTables,
                icon: <RefreshCw className="w-4 h-4" />,
                variant: "outline" as const,
                disabled: isRefreshing || fileStatusLoading || isDownloading
              },
              {
                label: isDownloading ? `Downloading... ${downloadProgress}%` : "Download Semua",
                onClick: handleBulkDownload,
                icon: <Download className="w-4 h-4" />,
                variant: "outline" as const,
                disabled: isDownloading || isRefreshing || fileStatusLoading
              }
            ]}
          />

          {/* Year Selector Panel */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            title="Tahun Buku"
            description="Pilih tahun buku untuk mengakses arsip dokumen"
          />

          {selectedYear && (
            <div className="space-y-6">
              {/* Statistics Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 text-blue-600" />
                    <span>Statistik Arsip Dokumen {selectedYear}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Dokumen</p>
                          <p className="text-xl font-bold text-blue-600">{allUploadedDocuments.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Sudah Diarsipkan</p>
                          <p className="text-xl font-bold text-green-600">{filteredDocuments.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subdirektorat</p>
                          <p className="text-xl font-bold text-purple-600">{uniqueSubdirektorats.length - 1}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Aspek GCG</p>
                          <p className="text-xl font-bold text-orange-600">{uniqueAspects.length - 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search and Filter Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span>Filter & Pencarian</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Pencarian
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Cari dokumen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Aspek
                      </label>
                      <select
                        value={selectedAspek}
                        onChange={(e) => setSelectedAspek(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {uniqueAspects.map(aspek => (
                          <option key={aspek} value={aspek}>
                            {aspek === 'all' ? 'Semua Aspek' : aspek}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Subdirektorat
                      </label>
                      <select
                        value={selectedSubdirektorat}
                        onChange={(e) => setSelectedSubdirektorat(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {uniqueSubdirektorats.map(subdir => (
                          <option key={subdir} value={subdir}>
                            {subdir === 'all' ? 'Semua Subdirektorat' : subdir}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Hasil
                      </label>
                      <div className="p-2 bg-gray-50 rounded-md text-center">
                        <span className="text-sm font-medium text-gray-600">
                          {filteredDocuments.length} dokumen ditemukan
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Daftar Dokumen Arsip</span>
                    {fileStatusLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">
                        Tidak ada dokumen ditemukan
                      </h3>
                      <p className="text-gray-400">
                        {allUploadedDocuments.length === 0 
                          ? 'Belum ada dokumen yang diupload untuk tahun ini' 
                          : 'Coba ubah filter pencarian Anda'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead className="w-[80px]">Aspek</TableHead>
                            <TableHead className="min-w-[300px]">Deskripsi Dokumen</TableHead>
                            <TableHead className="w-[200px]">Subdirektorat</TableHead>
                            <TableHead className="w-[250px]">Informasi File</TableHead>
                            <TableHead className="w-[150px]">Tanggal Upload</TableHead>
                            <TableHead className="w-[200px]">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map((doc, index) => {
                            if (!doc) return null;
                            
                            const IconComponent = getAspectIcon(doc.aspek);
                            const uploadedDocument = doc.uploadedDocument;
                            
                            return (
                              <TableRow key={doc.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-center">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1.5 rounded-md bg-blue-100">
                                      <IconComponent className="w-3 h-3 text-blue-600" />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-900 leading-tight">
                                      {doc.deskripsi}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {doc.aspek}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1.5 rounded-md bg-green-100">
                                      <Building className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-green-700">
                                      {uploadedDocument?.subdirektorat || 'Unknown'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <span 
                                        className="text-sm font-medium text-gray-900 truncate block max-w-[200px]" 
                                        title={uploadedDocument?.fileName}
                                      >
                                        {uploadedDocument?.fileName}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Oleh: {uploadedDocument?.uploadedBy || 'Unknown'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {new Date(uploadedDocument?.uploadDate || '').toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {/* View Button */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewDocument(doc.id)}
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                      title="Lihat dokumen"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Download Button */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDownloadDocument(doc.id)}
                                      className="border-green-200 text-green-600 hover:bg-green-50"
                                      title="Download dokumen"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Catatan Button */}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleShowCatatan(doc.id)}
                                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                      title="Lihat catatan dokumen"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
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

