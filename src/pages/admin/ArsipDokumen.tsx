import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Trash2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Search
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
  localFilePath?: string;
  uploadedBy: string;
  userRole?: string;
  userDirektorat?: string;
  userSubdirektorat?: string;
  userDivisi?: string;
  userWhatsApp?: string;
  userEmail?: string;
}

const ArsipDokumen: React.FC = () => {
  console.log('🔍 ArsipDokumen component rendering...');
  
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { user } = useUser();
  const { direktorat: direktoratData, subdirektorat: subDirektoratData, divisi: divisiData } = useStrukturPerusahaan();
  const { getDocumentsByYear, deleteDocument: deleteAOIDocument } = useAOIDocument();
  const { toast } = useToast();

  // Filter states
  const [selectedDirektorat, setSelectedDirektorat] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [selectedSubdirektorat, setSelectedSubdirektorat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting and view states
  const [sortBy, setSortBy] = useState<'fileName' | 'aspect' | 'subdirektorat' | 'uploadDate' | 'uploadedBy' | 'direktorat'>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // State for loading and API data
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [apiFiles, setApiFiles] = useState<any[]>([]);

  // State for highlight functionality
  const [highlightCriteria, setHighlightCriteria] = useState<any>(null);

  // Fetch files function
  const fetchFilesFromAPI = useCallback(async () => {
      console.log('🔍 ArsipDokumen fetchFilesFromAPI triggered, selectedYear:', selectedYear);
      
      if (!selectedYear) {
      console.log('❌ No selected year, skipping API fetch');
        return;
      }

      setIsLoadingFiles(true);
      try {
      const response = await fetch(`http://localhost:5000/api/uploaded-files?year=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response received:', data);
        setApiFiles(data.files || []);
      } else {
        console.error('❌ API response error:', response.status, response.statusText);
        setApiFiles([]);
      }
      } catch (error) {
      console.error('❌ API fetch error:', error);
        setApiFiles([]);
      } finally {
        setIsLoadingFiles(false);
    }
  }, [selectedYear]);

  // Check for highlight criteria from localStorage on component mount
  useEffect(() => {
    const storedHighlight = localStorage.getItem('archiveHighlight');
    if (storedHighlight) {
      try {
        const criteria = JSON.parse(storedHighlight);
        console.log('🎯 Highlight criteria loaded from localStorage:', criteria);
        
        // Apply the highlight criteria to filters first
        if (criteria.aspect) {
          setSelectedAspect(criteria.aspect);
        }
        if (criteria.description) {
          setSearchTerm(criteria.description);
        }
        
        // Set highlight criteria after a short delay to ensure filters are applied
        setTimeout(() => {
          setHighlightCriteria(criteria);
          console.log('🎯 Highlight criteria set after delay:', criteria);
          
          toast({
            title: "Highlight Aktif",
            description: `Mencari dokumen berdasarkan kriteria dari Monitoring GCG`,
          });
        }, 100);
        
        // Clear the stored criteria after reading
        localStorage.removeItem('archiveHighlight');
        
      } catch (error) {
        console.error('Error parsing highlight criteria:', error);
      }
    }
  }, []);

  // Fetch files from Supabase API when year changes
  useEffect(() => {
    fetchFilesFromAPI();
  }, [fetchFilesFromAPI]);

  // Event listeners for synchronization
  useEffect(() => {
    const handleUploadedFilesChanged = async (event: CustomEvent) => {
      console.log('📢 ArsipDokumen: Received uploadedFilesChanged event', event.detail);
      // Refresh files when other components make changes
      try {
        await fetchFilesFromAPI();
        console.log('✅ ArsipDokumen: Data refreshed after uploadedFilesChanged');
      } catch (error) {
        console.error('❌ ArsipDokumen: Error refreshing after uploadedFilesChanged:', error);
      }
    };

    const handleDocumentsUpdated = async (event: CustomEvent) => {
      console.log('📢 ArsipDokumen: Received documentsUpdated event', event.detail);
      // Refresh files when other components make changes
      try {
        await fetchFilesFromAPI();
        console.log('✅ ArsipDokumen: Data refreshed after documentsUpdated');
      } catch (error) {
        console.error('❌ ArsipDokumen: Error refreshing after documentsUpdated:', error);
      }
    };

    window.addEventListener('uploadedFilesChanged', handleUploadedFilesChanged as EventListener);
    window.addEventListener('documentsUpdated', handleDocumentsUpdated as EventListener);

    return () => {
      window.removeEventListener('uploadedFilesChanged', handleUploadedFilesChanged as EventListener);
      window.removeEventListener('documentsUpdated', handleDocumentsUpdated as EventListener);
    };
  }, [fetchFilesFromAPI]);

  // Process API files into DocumentWithUser format
  const allDocuments = useMemo(() => {
    console.log('🔄 Processing API files into DocumentWithUser format...');
    console.log('📊 API files count:', apiFiles.length);
    
    try {
      const enrichedDocuments = apiFiles.map((file, index) => {
        console.log(`Processing file ${index + 1}:`, file.fileName);
        
        // Get user data from localStorage for contact info
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        return {
          id: file.id || `file-${index}`,
          fileName: file.fileName || 'Unknown File',
          fileSize: file.fileSize || 0,
          uploadDate: new Date(file.uploadDate || new Date()),
          year: file.year || selectedYear || 2024,
          checklistId: file.checklistId,
          checklistDescription: file.checklistDescription,
          aspect: file.aspect || 'Dokumen Tanpa Aspek',
          status: 'uploaded' as const,
          subdirektorat: file.subdirektorat,
          localFilePath: file.localFilePath,
          uploadedBy: file.uploadedBy || 'Unknown User',
          userRole: file.userRole || 'admin',
          userDirektorat: file.userDirektorat || userData?.direktorat || 'Unknown',
          userSubdirektorat: file.userSubdirektorat || userData?.subdirektorat || 'Unknown',
          userDivisi: file.userDivisi || userData?.divisi || 'Unknown',
          userWhatsApp: file.userWhatsApp || userData?.whatsapp || '',
          userEmail: file.userEmail || userData?.email || ''
        };
      });
      
      console.log(`✅ Successfully processed ${enrichedDocuments.length} documents`);
      return enrichedDocuments.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } catch (error) {
      console.error('Error processing API files:', error);
      return [];
    }
  }, [selectedYear, apiFiles, isLoadingFiles]);

  // Filter and sort documents based on selected criteria
  const filteredAndSortedDocuments = useMemo(() => {
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'fileName':
          aValue = a.fileName.toLowerCase();
          bValue = b.fileName.toLowerCase();
          break;
        case 'aspect':
          aValue = (a.aspect || 'Dokumen Tanpa Aspek').toLowerCase();
          bValue = (b.aspect || 'Dokumen Tanpa Aspek').toLowerCase();
          break;
        case 'subdirektorat':
          aValue = (a.userSubdirektorat || 'Unknown').toLowerCase();
          bValue = (b.userSubdirektorat || 'Unknown').toLowerCase();
          break;
        case 'direktorat':
          aValue = (a.userDirektorat || 'Unknown').toLowerCase();
          bValue = (b.userDirektorat || 'Unknown').toLowerCase();
          break;
        case 'uploadDate':
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
        case 'uploadedBy':
          aValue = a.uploadedBy.toLowerCase();
          bValue = b.uploadedBy.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allDocuments, selectedDirektorat, selectedAspect, selectedSubdirektorat, searchTerm, sortBy, sortOrder]);

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

  // Handle sorting
  const handleSort = (field: 'fileName' | 'aspect' | 'subdirektorat' | 'uploadDate' | 'uploadedBy' | 'direktorat') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Check if document should be highlighted
  const shouldHighlightDocument = (doc: DocumentWithUser) => {
    if (!highlightCriteria) return false;
    
    console.log('🔍 Checking highlight for document:', {
      docId: doc.id,
      fileName: doc.fileName,
      checklistId: doc.checklistId,
      aspect: doc.aspect,
      highlightCriteria
    });
    
    // Primary match by checklistId if available (most reliable)
    if (highlightCriteria.checklistId && doc.checklistId) {
      const checklistMatch = doc.checklistId === highlightCriteria.checklistId;
      console.log('🎯 Checklist ID match:', checklistMatch);
      return checklistMatch;
    }
    
    // Fallback to aspect and description matching
    const matchesAspect = !highlightCriteria.aspect || 
      (doc.aspect && doc.aspect === highlightCriteria.aspect) ||
      (!doc.aspect && highlightCriteria.aspect === 'Dokumen Tanpa Aspek');
    
    // More flexible description matching
    const matchesDescription = !highlightCriteria.description || 
      (doc.checklistDescription && doc.checklistDescription.toLowerCase().includes(highlightCriteria.description.toLowerCase())) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(highlightCriteria.description.toLowerCase()));
    
    const shouldHighlight = matchesAspect && matchesDescription;
    
    console.log('🎯 Highlight check result:', {
      matchesAspect,
      matchesDescription,
      shouldHighlight
    });
    
    return shouldHighlight;
  };

  // Auto-scroll to highlighted document after data loads
  useEffect(() => {
    if (highlightCriteria && filteredAndSortedDocuments.length > 0) {
      // Find the highlighted document
      const highlightedDoc = filteredAndSortedDocuments.find(doc => shouldHighlightDocument(doc));
      
      if (highlightedDoc) {
        console.log('🎯 Found highlighted document, scrolling to it:', {
          fileName: highlightedDoc.fileName,
          id: highlightedDoc.id,
          checklistId: highlightedDoc.checklistId
        });
        
        // Scroll to the document after a delay to ensure DOM is rendered
        const scrollToDocument = () => {
          const docElement = document.querySelector(`[data-doc-id="${highlightedDoc.id}"]`);
          if (docElement) {
            docElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            console.log('✅ Scrolled to highlighted document');
            
            // Add a temporary highlight animation
            docElement.classList.add('animate-pulse');
            setTimeout(() => {
              docElement.classList.remove('animate-pulse');
            }, 2000);
          } else {
            console.warn('⚠️ Could not find document element for scrolling, retrying...');
            // Retry after a longer delay
            setTimeout(scrollToDocument, 1000);
          }
        };
        
        setTimeout(scrollToDocument, 800);
      } else {
        console.log('⚠️ No highlighted document found in filtered results');
        console.log('Available documents:', filteredAndSortedDocuments.map(d => ({
          id: d.id,
          fileName: d.fileName,
          checklistId: d.checklistId,
          aspect: d.aspect
        })));
      }
    }
  }, [highlightCriteria, filteredAndSortedDocuments]);

  // Handle delete document
  const handleDeleteDocument = useCallback(async (doc: DocumentWithUser) => {
    console.log('🗑️ ArsipDokumen: Starting delete process', { 
      id: doc.id, 
      fileName: doc.fileName, 
      checklistId: doc.checklistId 
    });
    
    try {
      console.log(`🌐 ArsipDokumen: Sending DELETE request to /api/delete-file/${doc.id}`);
      const response = await fetch(`http://localhost:5000/api/delete-file/${doc.id}`, {
        method: 'DELETE',
      });

      console.log(`📡 ArsipDokumen: Delete response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ ArsipDokumen: Delete successful', responseData);
        
      toast({
          title: "Berhasil",
          description: "Dokumen berhasil dihapus",
        });
        
        // Dispatch events to notify other components
        console.log('📢 ArsipDokumen: Dispatching events for sync');
        window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
          detail: { 
            type: 'fileDeleted', 
            fileId: doc.id,
            checklistId: doc.checklistId,
            timestamp: new Date().toISOString()
          }
        }));
        
        window.dispatchEvent(new CustomEvent('documentsUpdated', {
          detail: { 
            type: 'documentsUpdated', 
            year: selectedYear,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Refresh the files to update the UI
        console.log('🔄 ArsipDokumen: Refreshing data after delete');
        setIsLoadingFiles(true);
        await fetchFilesFromAPI();
        
        console.log('✅ ArsipDokumen: Delete process completed successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ ArsipDokumen: Delete failed', { status: response.status, error: errorData });
        throw new Error(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('❌ ArsipDokumen: Delete error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus dokumen: ${error}`,
        variant: "destructive",
      });
    }
  }, [toast, selectedYear, fetchFilesFromAPI]);

  // Handle download all documents with folder structure
  const handleDownloadAll = async () => {
    if (!selectedYear) {
        toast({
        title: "Peringatan",
        description: "Pilih tahun terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (filteredAndSortedDocuments.length === 0) {
        toast({
        title: "Peringatan",
        description: "Tidak ada dokumen untuk didownload",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress(0);

    try {
      console.log('🗂️ Starting download all documents with folder structure...');
      
      const zip = new JSZip();
      const totalDocs = filteredAndSortedDocuments.length;
      let processedDocs = 0;

      // Group documents by aspect and subdirektorat
      const groupedDocs: { [key: string]: { [key: string]: DocumentWithUser[] } } = {};
      
      filteredAndSortedDocuments.forEach(doc => {
        const aspect = doc.aspect || 'Dokumen Tanpa Aspek';
        const subdirektorat = doc.subdirektorat || 'Tanpa Subdirektorat';
        
        if (!groupedDocs[aspect]) {
          groupedDocs[aspect] = {};
        }
        if (!groupedDocs[aspect][subdirektorat]) {
          groupedDocs[aspect][subdirektorat] = [];
        }
        groupedDocs[aspect][subdirektorat].push(doc);
      });

      console.log('📁 Document grouping:', groupedDocs);

      // Download each document and add to ZIP with folder structure
      for (const [aspect, subdirektorats] of Object.entries(groupedDocs)) {
        console.log(`📂 Processing aspect: ${aspect}`);
        
        for (const [subdirektorat, docs] of Object.entries(subdirektorats)) {
          console.log(`📁 Processing subdirektorat: ${subdirektorat} (${docs.length} docs)`);
          
          for (const doc of docs) {
            try {
              console.log(`⬇️ Downloading: ${doc.fileName}`);
              
              const response = await fetch(`http://localhost:5000/api/download-file/${doc.id}`);
              
              if (!response.ok) {
                console.warn(`⚠️ Failed to download ${doc.fileName}: ${response.status}`);
                continue;
              }

              const blob = await response.blob();
              
              if (blob.size === 0) {
                console.warn(`⚠️ Empty file: ${doc.fileName}`);
                continue;
              }

              // Create folder structure: Aspect/Subdirektorat/Filename
              const folderPath = `${aspect}/${subdirektorat}`;
              const filePath = `${folderPath}/${doc.fileName}`;
              
              zip.file(filePath, blob);
              
              processedDocs++;
              setDownloadProgress((processedDocs / totalDocs) * 100);
              
              console.log(`✅ Added to ZIP: ${filePath}`);
              
            } catch (error) {
              console.error(`❌ Error downloading ${doc.fileName}:`, error);
              continue;
            }
          }
        }
      }

      console.log(`📦 Generating ZIP with ${processedDocs} documents...`);
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      // Download ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Arsip_Dokumen_${selectedYear}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Berhasil",
        description: `Semua dokumen berhasil didownload dalam ZIP dengan struktur folder (${processedDocs} dokumen)`,
      });

      console.log('✅ Download all completed successfully');

        } catch (error) {
      console.error('❌ Error in download all:', error);
      toast({
        title: "Download Gagal",
        description: `Gagal mendownload semua dokumen: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(0);
    }
  };

  // Handle download single document
  const handleDownload = async (doc: DocumentWithUser) => {
    try {
      console.log(`🔍 Downloading file: ${doc.fileName} (ID: ${doc.id})`);
      
      const response = await fetch(`http://localhost:5000/api/download-file/${doc.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to download file`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
      link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Berhasil",
        description: `File ${doc.fileName} berhasil didownload`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Gagal",
        description: `Gagal mendownload file: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Handle revision (WhatsApp or Email)
  const handleRevision = (document: DocumentWithUser) => {
    if (document.userWhatsApp) {
      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${document.userWhatsApp.replace(/[^0-9]/g, '')}`;
      window.open(whatsappUrl, '_blank');
    } else if (document.userEmail) {
      // Open email client
      const emailUrl = `mailto:${document.userEmail}`;
      window.open(emailUrl, '_blank');
    } else {
      alert('Tidak ada kontak WhatsApp atau email yang tersedia untuk user ini.');
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!selectedYear) return;
    
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`http://localhost:5000/api/uploaded-files?year=${selectedYear}`);
          if (response.ok) {
        const data = await response.json();
        setApiFiles(data.files || []);
        toast({
          title: "Refresh Berhasil",
          description: "Data dokumen berhasil diperbarui",
        });
          }
        } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Gagal",
        description: "Gagal memperbarui data dokumen",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFiles(false);
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

  console.log('🔍 ArsipDokumen render state:', {
    selectedYear,
    allDocumentsCount: allDocuments.length,
    filteredCount: filteredAndSortedDocuments.length,
    isLoadingFiles,
    apiFilesCount: apiFiles.length
  });

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
                      <PageHeaderPanel
              title="Arsip Dokumen"
            />

            <YearSelectorPanel
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={availableYears}
          />

          {selectedYear ? (
            <div className="space-y-6">
              {/* Enhanced Filter, Sort & Download Controls */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                        <span>Filter, Sort & Download</span>
                  </CardTitle>
                  <CardDescription>
                        Filter, urutkan, dan download dokumen sesuai kriteria yang diinginkan
                  </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleDownloadAll}
                        disabled={isDownloadingAll || filteredAndSortedDocuments.length === 0}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white border-0 flex items-center space-x-2"
                      >
                        {isDownloadingAll ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Downloading... {downloadProgress.toFixed(0)}%</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Download All ({filteredAndSortedDocuments.length})</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleManualRefresh}
                        disabled={isLoadingFiles}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </Button>
                      <div className="flex items-center space-x-1 border rounded-lg p-1">
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className="h-8 w-8 p-0"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="h-8 w-8 p-0"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
              </CardHeader>
                <CardContent>
                  {/* Download Progress Bar */}
                  {isDownloadingAll && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">
                          Downloading semua dokumen...
                        </span>
                        <span className="text-sm text-blue-600">
                          {downloadProgress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Membuat struktur folder dan mengemas dalam ZIP...
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
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

                    {/* Sort Controls */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <ArrowUpDown className="h-4 w-4 mr-2 text-orange-600" />
                        Urutkan Berdasarkan
                      </label>
                      <div className="flex space-x-2">
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uploadDate">Tanggal Upload</SelectItem>
                            <SelectItem value="fileName">Nama File</SelectItem>
                            <SelectItem value="aspect">Aspek</SelectItem>
                            <SelectItem value="subdirektorat">Subdirektorat</SelectItem>
                            <SelectItem value="direktorat">Direktorat</SelectItem>
                            <SelectItem value="uploadedBy">Pengunggah</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3"
                        >
                          {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Search className="h-4 w-4 mr-2 text-orange-600" />
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

                  {/* Results Summary */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold text-blue-600">{filteredAndSortedDocuments.length}</span> dari <span className="font-semibold">{allDocuments.length}</span> dokumen
                      </span>
                      {highlightCriteria && (
                        <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                          🎯 Highlight aktif dari Monitoring GCG
                        </span>
                      )}
                      {(searchTerm || selectedAspect || selectedSubdirektorat || selectedDirektorat) && (
                      <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedAspect(null);
                            setSelectedSubdirektorat(null);
                            setSelectedDirektorat(null);
                            setHighlightCriteria(null);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reset Filter
                      </Button>
                    )}
                  </div>
                      </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <Archive className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Daftar Dokumen Tahun {selectedYear}</span>
                      <div className="text-blue-100 text-sm font-normal mt-1">
                        Total {filteredAndSortedDocuments.length} dokumen ditemukan
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredAndSortedDocuments.length > 0 ? (
                    viewMode === 'table' ? (
                      // Table View
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('fileName')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Nama File</span>
                                  {getSortIcon('fileName')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('aspect')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Aspek</span>
                                  {getSortIcon('aspect')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('subdirektorat')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Subdirektorat</span>
                                  {getSortIcon('subdirektorat')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('direktorat')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Direktorat</span>
                                  {getSortIcon('direktorat')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('uploadedBy')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Pengunggah</span>
                                  {getSortIcon('uploadedBy')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('uploadDate')}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>Tanggal Upload</span>
                                  {getSortIcon('uploadDate')}
                                </div>
                              </TableHead>
                              <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedDocuments.map((doc) => {
                              const isHighlighted = shouldHighlightDocument(doc);
                              return (
                              <TableRow 
                                key={doc.id}
                                data-doc-id={doc.id}
                                className={`hover:bg-gray-50 ${isHighlighted ? 'bg-yellow-50 border-yellow-200 border-2' : ''}`}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="truncate max-w-xs" title={doc.fileName}>
                                      {doc.fileName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {doc.aspect || 'Dokumen Tanpa Aspek'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {doc.userSubdirektorat || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {doc.userDirektorat || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{doc.uploadedBy}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">
                                      {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownload(doc)}
                                      className="border-green-200 text-green-600 hover:bg-green-50"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRevision(doc)}
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Revisi
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.fileName}"?`)) {
                                          handleDeleteDocument(doc);
                                        }
                                      }}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Hapus
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      // Grid View
                    <div className="grid gap-4">
                        {filteredAndSortedDocuments.map((doc) => {
                          const isHighlighted = shouldHighlightDocument(doc);
                          return (
                          <div 
                            key={doc.id}
                            data-doc-id={doc.id}
                            className={`group bg-white border rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 transform ${
                              isHighlighted 
                                ? 'border-yellow-400 border-2 bg-yellow-50 hover:border-yellow-500' 
                                : 'border-gray-200 hover:border-blue-400'
                            }`}
                          >
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
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs px-2 py-1">
                                      {formatFileSize(doc.fileSize)}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs px-2 py-1">
                                      {doc.status}
                                    </Badge>
                                  </div>
                                </div>
                        </div>
                              <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                  variant="outline"
                                onClick={() => handleDownload(doc)}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevision(doc)}
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Revisi
                              </Button>
                              <Button
                                size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.fileName}"?`)) {
                                      handleDeleteDocument(doc);
                                    }
                                  }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </Button>
                            </div>
                          </div>

                            {/* Content Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* User Information */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Pengirim</span>
                                </div>
                              <div className="pl-6 space-y-1">
                                <div className="text-sm font-semibold text-gray-900">{doc.uploadedBy}</div>
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
                                    {doc.aspect || 'Dokumen Tanpa Aspek'}
                                </Badge>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                              {/* Contact Information */}
                            <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">Kontak</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                  {doc.userWhatsApp ? (
                                    <div className="flex items-center space-x-1 text-xs text-green-600">
                                      <Phone className="h-3 w-3" />
                                      <span>{doc.userWhatsApp}</span>
                                    </div>
                                  ) : null}
                                  {doc.userEmail ? (
                                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{doc.userEmail}</span>
                                    </div>
                                  ) : null}
                                  {!doc.userWhatsApp && !doc.userEmail ? (
                                  <div className="text-sm text-gray-500 italic">
                                      Kontak tidak tersedia
                                  </div>
                                  ) : null}
                              </div>
                            </div>

                              {/* Additional Info */}
                            <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                                  <FolderOpen className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">Info Tambahan</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                  {doc.checklistDescription && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Deskripsi:</span> {doc.checklistDescription}
                                    </div>
                                  )}
              </div>
            </div>
            </div>
                              </div>
                          );
                        })}
                            </div>
                    )
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
                    </div>
                  ) : (
                  <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                Pilih Tahun Terlebih Dahulu
                      </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                Silakan pilih tahun buku untuk melihat arsip dokumen yang tersedia.
                      </p>
                    </div>
                  )}
          </div>
                  </div>
    </>
  );
};

export default ArsipDokumen;
