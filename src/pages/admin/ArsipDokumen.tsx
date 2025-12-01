import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel } from '@/components/panels';
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
import { CatatanDialog, DetailDocumentDialog } from '@/components/dialogs';
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
  RefreshCw,
  Info,
  Trash2,
  MessageSquare,
  Upload,
  Phone,
  Mail,
  StickyNote,
  FolderUp
} from 'lucide-react';


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

  // State for search and filters (for TABLE only)
  const [searchTerm, setSearchTerm] = useState('');
  const [tableSelectedAspek, setTableSelectedAspek] = useState<string>('all');
  const [tableSelectedSubdirektorat, setTableSelectedSubdirektorat] = useState<string>('all');
  const [tableSelectedStatus, setTableSelectedStatus] = useState<string>('all');

  // State for Download Dokumen section filters (separate from table)
  const [downloadSelectedAspek, setDownloadSelectedAspek] = useState<string>('all');
  const [downloadSelectedSubdirektorat, setDownloadSelectedSubdirektorat] = useState<string>('all');

  // State for catatan dialog
  const [isCatatanDialogOpen, setIsCatatanDialogOpen] = useState(false);
  const [selectedDocumentForCatatan, setSelectedDocumentForCatatan] = useState<{
    catatan?: string;
    title?: string;
    fileName?: string;
    uploadedBy?: string;
    uploadDate?: Date;
    subdirektorat?: string;
  } | null>(null);

  // State for detail dialog
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDocumentForDetail, setSelectedDocumentForDetail] = useState<{
    id: number;
    aspek: string;
    deskripsi: string;
    tahun: number;
    fileName?: string;
    fileSize?: number;
    uploadDate?: Date;
    uploadedBy?: string;
    subdirektorat?: string;
    catatan?: string;
    status?: string;
  } | null>(null);

  // State for delete operation
  const [deletingDocuments, setDeletingDocuments] = useState<Set<number>>(new Set());

  // State to track actual file existence from Supabase
  const [supabaseFileStatus, setSupabaseFileStatus] = useState<{[key: string]: boolean}>({});
  const [supabaseFileInfo, setSupabaseFileInfo] = useState<{[key: string]: any}>({});
  const [fileStatusLoading, setFileStatusLoading] = useState<boolean>(false);

  // State for random document upload
  const [isUploadingRandom, setIsUploadingRandom] = useState(false);
  const [randomUploadYear, setRandomUploadYear] = useState<number | null>(null);

  // State for random documents (Dokumen Lainnya)
  const [randomDocuments, setRandomDocuments] = useState<any[]>([]);

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

  // Load random documents from backend
  useEffect(() => {
    if (!selectedYear) return;

    const loadRandomDocuments = async () => {
      try {
        console.log(`📂 Loading random documents for year ${selectedYear}...`);
        const response = await fetch(`http://localhost:5001/api/random-documents/${selectedYear}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Loaded ${data.documents?.length || 0} random documents`);
          setRandomDocuments(data.documents || []);
        } else {
          console.warn('⚠️ Failed to load random documents:', response.status);
          setRandomDocuments([]);
        }
      } catch (error) {
        console.error('❌ Error loading random documents:', error);
        setRandomDocuments([]);
      }
    };

    loadRandomDocuments();
  }, [selectedYear]);

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
            const response = await fetch('http://localhost:5001/api/check-gcg-files', {
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

  // Function to reload file statuses - extracted for reuse
  const reloadFileStatuses = useCallback(async () => {
    if (!selectedYear || availableYears.length === 0) return;

    console.log('🔄 ArsipDokumen: Reloading file statuses...');

    try {
      setFileStatusLoading(true);

      const yearChecklist = checklist.filter(item => item.tahun === selectedYear);

      if (yearChecklist.length === 0) {
        setFileStatusLoading(false);
        return;
      }

      // Group by subdirektorat for batch API calls
      const subdirektoratGroups = yearChecklist.reduce((groups, item) => {
        let subdirektorat = 'Unknown';

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

      const newFileStatus: Record<string, boolean> = {};
      const newFileInfo: Record<string, any> = {};

      for (const [subdirektorat, checklistIds] of Object.entries(subdirektoratGroups)) {
        try {
          const response = await fetch('http://localhost:5001/api/check-gcg-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
            },
            body: JSON.stringify({
              year: selectedYear,
              picName: subdirektorat.replace(/ /g, '_'),
              checklistIds: checklistIds
            }),
          });

          if (response.ok) {
            const result = await response.json();

            if (result.fileStatuses) {
              Object.entries(result.fileStatuses).forEach(([checklistId, fileStatus]: [string, any]) => {
                newFileStatus[checklistId] = fileStatus.exists || false;

                if (fileStatus.exists && fileStatus.fileName) {
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
          }
        } catch (error) {
          console.error(`Error checking files for subdirektorat ${subdirektorat}:`, error);
        }
      }

      setSupabaseFileStatus(newFileStatus);
      setSupabaseFileInfo(newFileInfo);
      console.log('✅ ArsipDokumen: File statuses reloaded successfully');

    } catch (error) {
      console.error('Error reloading file statuses:', error);
    } finally {
      setFileStatusLoading(false);
    }
  }, [selectedYear, checklist, availableYears]);

  // Listen for file changes from other components (Monitoring, FileUploadContext)
  useEffect(() => {
    const handleFilesChanged = (event: CustomEvent) => {
      console.log('📢 ArsipDokumen: Received uploadedFilesChanged event', event.detail);

      // If file was deleted, immediately mark as NOT existing
      // and DO NOT reload from backend to avoid race condition
      if (event.detail?.type === 'fileDeleted' && event.detail?.checklistId) {
        const checklistId = event.detail.checklistId;
        console.log('🧹 ArsipDokumen: Marking deleted checklistId as false:', checklistId);
        setSupabaseFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setSupabaseFileInfo(prev => {
          const newInfo = { ...prev };
          delete newInfo[checklistId.toString()];  // Remove file info
          return newInfo;
        });
        console.log('✅ ArsipDokumen: File marked as deleted (no backend refresh)');
        return; // Don't reload from backend - state is already correct
      }

      // Reload file statuses only for non-delete events (upload, etc)
      reloadFileStatuses();
    };

    const handleDocumentsUpdated = (event: CustomEvent) => {
      console.log('📢 ArsipDokumen: Received documentsUpdated event', event.detail);

      // Skip reload for delete events to avoid race condition
      if (event.detail?.type === 'documentsUpdated' && event.detail?.skipRefresh) {
        console.log('ArsipDokumen: Skipping reload (delete operation)');
        return;
      }

      // Reload file statuses when documents are updated
      reloadFileStatuses();
    };

    window.addEventListener('uploadedFilesChanged', handleFilesChanged as EventListener);
    window.addEventListener('documentsUpdated', handleDocumentsUpdated as EventListener);

    return () => {
      window.removeEventListener('uploadedFilesChanged', handleFilesChanged as EventListener);
      window.removeEventListener('documentsUpdated', handleDocumentsUpdated as EventListener);
    };
  }, [reloadFileStatuses]);

  // Get all uploaded documents for the selected year
  const allUploadedDocuments = useMemo(() => {
    if (!selectedYear) return [];

    // Get checklist-based documents
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const checklistDocs = yearChecklist
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

    // Get random documents (Dokumen Lainnya)
    const randomDocs = randomDocuments.map(doc => {
      return {
        id: doc.id || Math.random(),
        aspek: 'DOKUMEN_LAINNYA',
        deskripsi: doc.fileName || 'Dokumen Lainnya',
        tahun: selectedYear,
        uploadedDocument: {
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          uploadDate: doc.uploadDate,
          uploadedBy: doc.uploadedBy || 'Unknown',
          subdirektorat: 'Super Admin', // Changed from 'Dokumen_Lainnya' to 'Super Admin'
          catatan: doc.catatan || '',
          checklistId: null,
          localFilePath: doc.localFilePath
        },
        status: 'uploaded' as const
      };
    });

    // Combine both arrays
    return [...checklistDocs, ...randomDocs];
  }, [selectedYear, checklist, getUploadedDocument, supabaseFileStatus, supabaseFileInfo, randomDocuments]);

  // Get unique values for filters
  const uniqueAspects = useMemo(() => {
    const aspects = allUploadedDocuments.map(doc => doc?.aspek).filter(Boolean);
    return ['all', ...Array.from(new Set(aspects))];
  }, [allUploadedDocuments]);

  const uniqueSubdirektorats = useMemo(() => {
    const subdirektorats = allUploadedDocuments.map(doc => doc?.uploadedDocument?.subdirektorat).filter(Boolean);
    return ['all', ...Array.from(new Set(subdirektorats))];
  }, [allUploadedDocuments]);

  // Filter documents for DOWNLOAD section only
  const downloadFilteredDocuments = useMemo(() => {
    if (!allUploadedDocuments) return [];

    let filtered = allUploadedDocuments.filter(doc => {
      if (!doc) return false;

      // Aspek filter for download
      if (downloadSelectedAspek !== 'all' && doc.aspek !== downloadSelectedAspek) {
        return false;
      }

      // Subdirektorat filter for download
      if (downloadSelectedSubdirektorat !== 'all') {
        if (downloadSelectedSubdirektorat === 'dokumen_lainnya') {
          if (doc.uploadedDocument?.subdirektorat !== 'Dokumen_Lainnya') {
            return false;
          }
        } else {
          if (doc.uploadedDocument?.subdirektorat !== downloadSelectedSubdirektorat) {
            return false;
          }
        }
      }

      return true;
    });

    return filtered;
  }, [allUploadedDocuments, downloadSelectedAspek, downloadSelectedSubdirektorat]);

  // Filter documents for TABLE display (separate from download filters)
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

      // Aspek filter for table
      if (tableSelectedAspek !== 'all' && doc.aspek !== tableSelectedAspek) {
        return false;
      }

      // Subdirektorat filter for table
      if (tableSelectedSubdirektorat !== 'all') {
        if (tableSelectedSubdirektorat === 'dokumen_lainnya') {
          if (doc.uploadedDocument?.subdirektorat !== 'Dokumen_Lainnya') {
            return false;
          }
        } else {
          if (doc.uploadedDocument?.subdirektorat !== tableSelectedSubdirektorat) {
            return false;
          }
        }
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
  }, [allUploadedDocuments, searchTerm, tableSelectedAspek, tableSelectedSubdirektorat]);

  // Handle view document
  const handleViewDocument = useCallback(async (checklistId: number) => {
    const uploadedFile = getUploadedDocument(checklistId);
    if (uploadedFile) {
      try {
        // Get file URL from backend API
        const response = await fetch(`http://localhost:5001/api/files/${uploadedFile.id}/view`, {
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
  const handleDownloadDocument = useCallback(async (documentId: number | string, uploadedDocument?: any) => {
    console.log(`📥 Download request - documentId: ${documentId}`, uploadedDocument);

    // Try to get document info
    let fileToDownload = uploadedDocument;

    if (!fileToDownload) {
      // For checklist documents, try to get from getUploadedDocument
      if (typeof documentId === 'number') {
        fileToDownload = getUploadedDocument(documentId);
      }
    }

    console.log(`📄 File to download:`, fileToDownload);

    if (!fileToDownload) {
      console.error('❌ Document not found');
      toast({
        title: "Error",
        description: "Dokumen tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`🌐 Downloading file: ${fileToDownload.fileName} (ID: ${fileToDownload.id})`);

      // Download file through backend API
      const response = await fetch(`http://localhost:5001/api/files/${fileToDownload.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
        },
      });

      console.log(`📡 Download response status: ${response.status}`);

      if (response.ok) {
        // Get the file blob
        const blob = await response.blob();
        console.log(`📦 Downloaded blob size: ${blob.size} bytes`);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileToDownload.fileName;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log(`✅ Download completed: ${fileToDownload.fileName}`);

        toast({
          title: "✅ Download Berhasil",
          description: `File ${fileToDownload.fileName} berhasil didownload`,
          duration: 3000
        });
      } else {
        const errorText = await response.text();
        console.error(`❌ Download failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to download document: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast({
        title: "Error Download",
        description: `Gagal mendownload dokumen: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }, [getUploadedDocument, toast]);

  // Handle show catatan
  const handleShowCatatan = useCallback((checklistId: number | string, uploadedDoc?: any, docDescription?: string) => {
    // Use provided uploadedDoc if available, otherwise try to get from checklist
    const uploadedDocument = uploadedDoc || (typeof checklistId === 'number' ? getUploadedDocument(checklistId) : null);
    const checklistItem = typeof checklistId === 'number' ? checklist.find(item => item.id === checklistId) : null;

    if (uploadedDocument) {
      setSelectedDocumentForCatatan({
        catatan: uploadedDocument.catatan || '',
        title: docDescription || checklistItem?.deskripsi || uploadedDocument.fileName || 'Dokumen',
        fileName: uploadedDocument.fileName || 'Unknown File',
        uploadedBy: uploadedDocument.uploadedBy || 'Unknown',
        uploadDate: uploadedDocument.uploadDate,
        subdirektorat: uploadedDocument.subdirektorat || 'Unknown'
      });
      setIsCatatanDialogOpen(true);
    } else {
      toast({
        title: "Dokumen tidak ditemukan",
        description: "Dokumen belum diupload atau tidak tersedia",
        variant: "destructive"
      });
    }
  }, [getUploadedDocument, checklist, toast]);

  // Handle show detail
  const handleShowDetail = useCallback((checklistId: number) => {
    const uploadedDocument = getUploadedDocument(checklistId);
    const checklistItem = checklist.find(item => item.id === checklistId);

    if (uploadedDocument && checklistItem) {
      setSelectedDocumentForDetail({
        id: checklistId,
        aspek: checklistItem.aspek || 'Dokumen GCG',
        deskripsi: checklistItem.deskripsi || '',
        tahun: selectedYear || new Date().getFullYear(),
        fileName: uploadedDocument.fileName || 'Unknown File',
        fileSize: uploadedDocument.fileSize,
        uploadDate: uploadedDocument.uploadDate,
        uploadedBy: uploadedDocument.uploadedBy || 'Unknown',
        subdirektorat: uploadedDocument.subdirektorat || 'Unknown',
        catatan: uploadedDocument.catatan || '',
        status: 'uploaded'
      });
      setIsDetailDialogOpen(true);
    } else {
      toast({
        title: "Dokumen tidak ditemukan",
        description: "Dokumen belum diupload atau tidak tersedia",
        variant: "destructive"
      });
    }
  }, [getUploadedDocument, checklist, selectedYear, toast]);

  // Handle delete document
  const handleDeleteDocument = useCallback(async (checklistId: number) => {
    const uploadedDocument = getUploadedDocument(checklistId);

    if (!uploadedDocument) {
      toast({
        title: "Error",
        description: "Dokumen tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    // Prevent double deletion
    if (deletingDocuments.has(checklistId)) {
      return;
    }

    // Confirm deletion
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      return;
    }

    setDeletingDocuments(prev => new Set(prev).add(checklistId));

    try {
      console.log('🗑️ ArsipDokumen: Starting delete process', { checklistId, documentId: uploadedDocument.id });

      const response = await fetch(`http://localhost:5001/api/delete-file/${uploadedDocument.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ ArsipDokumen: Delete successful', responseData);

        toast({
          title: "Berhasil",
          description: "Dokumen berhasil dihapus",
        });

        // IMMEDIATELY mark as NOT existing (false) instead of deleting key
        // This ensures UI knows file was explicitly deleted
        console.log('🧹 ArsipDokumen: Marking file as deleted for checklistId:', checklistId);
        setSupabaseFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setSupabaseFileInfo(prev => {
          const newInfo = { ...prev };
          delete newInfo[checklistId.toString()];  // Remove file info
          return newInfo;
        });

        // Dispatch events to notify other components (Monitoring)
        console.log('📢 ArsipDokumen: Dispatching events for sync');
        window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
          detail: {
            type: 'fileDeleted',
            fileId: uploadedDocument.id,
            checklistId: checklistId,
            timestamp: new Date().toISOString()
          }
        }));

        window.dispatchEvent(new CustomEvent('documentsUpdated', {
          detail: {
            type: 'documentsUpdated',
            year: selectedYear,
            skipRefresh: true, // Tell event handler to skip refresh for delete
            timestamp: new Date().toISOString()
          }
        }));

        // DO NOT call reloadFileStatuses() here - this causes race condition
        // where backend hasn't fully processed delete but we're already fetching
        // The local state is already cleared above
        console.log('🚫 ArsipDokumen: Skipping reloadFileStatuses (race condition prevention)');

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
    } finally {
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(checklistId);
        return newSet;
      });
    }
  }, [getUploadedDocument, deletingDocuments, selectedYear, toast, reloadFileStatuses]);

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

    if (downloadFilteredDocuments.length === 0) {
      toast({
        title: "Tidak Ada Dokumen",
        description: "Tidak ada dokumen untuk didownload dengan filter yang dipilih",
        variant: "destructive"
      });
      return;
    }

    console.log(`📥 Starting bulk download for year ${selectedYear}`);
    console.log(`📊 Download filters - Aspek: ${downloadSelectedAspek}, Subdir: ${downloadSelectedSubdirektorat}`);
    console.log(`📋 Documents to download: ${downloadFilteredDocuments.length}`);

    setIsDownloading(true);
    setDownloadProgress(10);

    try {
      console.log('🌐 Sending request to backend...');
      const response = await fetch('http://localhost:5001/api/bulk-download-all-documents', {
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

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      setDownloadProgress(50);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `All_Documents_${selectedYear}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1] || filenameMatch[2];
        }
      }

      console.log(`📦 Downloading file: ${filename}`);
      setDownloadProgress(75);

      // Download the ZIP file
      const blob = await response.blob();
      console.log(`📦 Blob size: ${blob.size} bytes`);

      if (blob.size === 0) {
        throw new Error('File kosong - tidak ada dokumen untuk didownload');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadProgress(100);
      console.log('✅ Download completed successfully');

      toast({
        title: "✅ Download Berhasil",
        description: `File ${filename} berhasil didownload (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
        duration: 5000
      });

    } catch (error) {
      console.error('❌ Bulk download error:', error);
      toast({
        title: "❌ Download Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat download. Cek console untuk detail.",
        variant: "destructive",
        duration: 7000
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
      const response = await fetch('http://localhost:5001/api/refresh-tracking-tables', {
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

  // Handle random document upload (dokumen lainnya)
  const handleRandomDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('❌ No files selected');
      return;
    }

    console.log(`📁 Selected ${files.length} files for upload`);

    const uploadYear = randomUploadYear || selectedYear;
    if (!uploadYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingRandom(true);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', uploadYear.toString());
        formData.append('category', 'dokumen_lainnya');
        formData.append('uploadedBy', JSON.parse(localStorage.getItem('user') || '{}').name || 'Unknown');

        // Preserve folder structure if file has webkitRelativePath
        // @ts-ignore - webkitRelativePath is not in standard File type
        const relativePath = file.webkitRelativePath || '';
        if (relativePath) {
          console.log(`📂 Folder path: ${relativePath}`);
          formData.append('folderPath', relativePath);
        }

        try {
          const response = await fetch('http://localhost:5001/api/upload-random-document', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Upload failed for ${file.name}:`, response.status, errorText);
            failedCount++;
          } else {
            console.log(`✅ Successfully uploaded: ${file.name}`);
            successCount++;
          }
        } catch (fileError) {
          console.error(`❌ Network error uploading ${file.name}:`, fileError);
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "✅ Upload Selesai",
          description: `${successCount} dokumen berhasil diupload${failedCount > 0 ? `, ${failedCount} gagal` : ''}`,
          duration: 5000
        });

        console.log('🔄 Reloading documents after upload...');

        // Clear existing data first
        setSupabaseFileStatus({});
        setSupabaseFileInfo({});

        // Reload random documents
        try {
          const response = await fetch(`http://localhost:5001/api/random-documents/${uploadYear}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Reloaded ${data.documents?.length || 0} random documents`);
            setRandomDocuments(data.documents || []);
          }
        } catch (reloadError) {
          console.error('⚠️ Error reloading random documents:', reloadError);
        }

        // Also trigger reload of file statuses for checklist documents
        await reloadFileStatuses();

        console.log('✅ All documents reloaded - should now appear in table');
      } else {
        throw new Error('Semua file gagal diupload');
      }

    } catch (error) {
      console.error('❌ Random upload error:', error);
      toast({
        title: "❌ Upload Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat upload",
        variant: "destructive"
      });
    } finally {
      setIsUploadingRandom(false);
      // Reset file input
      event.target.value = '';
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
          />

          {/* Year Selection - Single Line with Upload/View indication */}
          <div className="mb-6 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            {/* Main Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Tahun Buku:</span>
              </div>

              {/* Year Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {availableYears.sort((a, b) => b - a).map((year, index) => {
                  const isLatestYear = index === 0;
                  const isSelected = selectedYear === year;

                  return (
                    <Button
                      key={year}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedYear(year)}
                      title={isLatestYear ? `${year} - Tahun Aktif (Upload, View, Download)` : `${year} - Arsip (View & Download saja)`}
                      className={`h-8 px-3 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : isLatestYear
                            ? 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-1.5">{year}</span>
                      {isLatestYear ? (
                        <Upload className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Status Indicator */}
              {selectedYear && (
                <div className="flex items-center gap-2 ml-auto">
                  {selectedYear === availableYears.sort((a, b) => b - a)[0] ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      <Upload className="w-3 h-3 mr-1" />
                      Tahun Aktif - Upload
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      <Eye className="w-3 h-3 mr-1" />
                      Arsip - View/Download
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Legend Row - Below buttons */}
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Upload className="w-3 h-3 text-green-600" />
                <span>= Tahun Aktif (Upload, View, Download)</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-gray-500" />
                <span>= Arsip (View & Download)</span>
              </span>
            </div>
          </div>

          {selectedYear && (
            <div className="space-y-6">
              {/* Upload & Download Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Upload Dokumen */}
                <Card className="border-2 border-green-200 bg-green-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-green-600" />
                      <span className="text-green-900">Upload Dokumen</span>
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">
                      Upload dokumen arsip yang tidak memiliki struktur organisasi
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Year Selection for Upload */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Pilih Tahun
                        </label>
                        <select
                          value={randomUploadYear || selectedYear || ''}
                          onChange={(e) => setRandomUploadYear(Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Pilih Tahun</option>
                          {availableYears.sort((a, b) => b - a).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Folder Upload Input - Focus on folder only */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FolderUp className="w-4 h-4 text-blue-600" />
                          Upload Folder
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            // @ts-ignore - webkitdirectory is not in TypeScript types but works
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleRandomDocumentUpload}
                            disabled={isUploadingRandom || !randomUploadYear}
                            className="w-full p-3 border-2 border-dashed border-blue-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400 transition-colors"
                            id="folder-upload"
                          />
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold mb-1">Cara Upload Folder:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>Klik tombol "Choose Files" atau "Browse"</li>
                              <li>Pilih folder yang ingin diupload</li>
                              <li>Struktur folder akan dipertahankan di <span className="font-semibold">"Dokumen Lainnya"</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Upload Status */}
                      {isUploadingRandom && (
                        <div className="flex items-center space-x-2 p-3 bg-green-100 rounded-md">
                          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Download Dokumen */}
                <Card className="border-2 border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Download className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-900">Download Dokumen</span>
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">
                      Filter dan unduh dokumen berdasarkan kategori
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Filter by Aspek (Download section only) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Filter Aspek
                        </label>
                        <select
                          value={downloadSelectedAspek}
                          onChange={(e) => setDownloadSelectedAspek(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {uniqueAspects.map(aspek => (
                            <option key={aspek} value={aspek}>
                              {aspek === 'all' ? 'Semua Aspek' : aspek}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Subdirektorat (Download section only) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Filter PIC / Subdirektorat
                        </label>
                        <select
                          value={downloadSelectedSubdirektorat}
                          onChange={(e) => setDownloadSelectedSubdirektorat(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {uniqueSubdirektorats.map(subdir => (
                            <option key={subdir} value={subdir}>
                              {subdir === 'all' ? 'Semua PIC' : subdir}
                            </option>
                          ))}
                          <option value="dokumen_lainnya">Dokumen Lainnya</option>
                        </select>
                      </div>

                      {/* Download Result Count and Button */}
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-100 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-700">
                              {downloadFilteredDocuments.length} dokumen tersedia
                            </span>
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>

                        {/* Download All Button */}
                        <Button
                          onClick={handleBulkDownload}
                          disabled={isDownloading || downloadFilteredDocuments.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Downloading... {downloadProgress}%
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download Semua ({downloadFilteredDocuments.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents Table with Integrated Filters */}
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
                <CardContent className="space-y-4">
                  {/* Search & Filters in same panel */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Cari dokumen berdasarkan nama, deskripsi, atau uploader..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 bg-white"
                      />
                    </div>

                    {/* Table Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          Filter Aspek
                        </label>
                        <select
                          value={tableSelectedAspek}
                          onChange={(e) => setTableSelectedAspek(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {uniqueAspects.map(aspek => (
                            <option key={aspek} value={aspek}>
                              {aspek === 'all' ? 'Semua Aspek' : aspek}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Filter PIC / Subdirektorat
                        </label>
                        <select
                          value={tableSelectedSubdirektorat}
                          onChange={(e) => setTableSelectedSubdirektorat(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {uniqueSubdirektorats.map(subdir => (
                            <option key={subdir} value={subdir}>
                              {subdir === 'all' ? 'Semua PIC' : subdir}
                            </option>
                          ))}
                          <option value="dokumen_lainnya">Dokumen Lainnya</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
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
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px] text-center">No</TableHead>
                            <TableHead className="min-w-[200px]">Deskripsi</TableHead>
                            <TableHead className="w-[150px]">Divisi</TableHead>
                            <TableHead className="w-[140px]">Nama Pengirim</TableHead>
                            <TableHead className="w-[100px] text-center">Status</TableHead>
                            <TableHead className="w-[180px]">File</TableHead>
                            <TableHead className="w-[200px] text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map((doc, index) => {
                            if (!doc) return null;

                            const IconComponent = getAspectIcon(doc.aspek);
                            const uploadedDocument = doc.uploadedDocument;

                            return (
                              <TableRow key={doc.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                                <TableCell className="text-center text-xs text-gray-600 py-2">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="py-2">
                                  <div>
                                    <p className="text-xs text-gray-900 line-clamp-2" title={doc.deskripsi}>
                                      {doc.deskripsi}
                                    </p>
                                    <span className="text-[10px] text-gray-500">
                                      {doc.aspek.replace('ASPEK ', '').substring(0, 20)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  {uploadedDocument?.subdirektorat ? (
                                    <div className="flex items-center space-x-1.5">
                                      <div className="p-1 rounded bg-purple-100">
                                        <Building className="w-2.5 h-2.5 text-purple-600" />
                                      </div>
                                      <span className="text-xs font-medium text-purple-700 truncate max-w-[120px]" title={uploadedDocument.subdirektorat}>
                                        {uploadedDocument.subdirektorat}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  {uploadedDocument?.uploadedBy ? (
                                    <div className="flex items-center space-x-1.5">
                                      <div className="p-1 rounded bg-blue-100">
                                        <UserCheck className="w-2.5 h-2.5 text-blue-600" />
                                      </div>
                                      <span className="text-xs font-medium text-blue-700 truncate max-w-[100px]" title={uploadedDocument.uploadedBy}>
                                        {uploadedDocument.uploadedBy}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  {uploadedDocument ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Upload
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Belum
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  {uploadedDocument ? (
                                    <div>
                                      <span className="text-xs text-blue-600 font-medium truncate block max-w-[140px]" title={uploadedDocument.fileName}>
                                        {uploadedDocument.fileName}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        {new Date(uploadedDocument.uploadDate).toLocaleDateString('id-ID')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    {/* Catatan Button - disabled if no catatan */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleShowCatatan(doc.id, uploadedDocument, doc.deskripsi)}
                                      disabled={!uploadedDocument || !uploadedDocument.catatan}
                                      title={uploadedDocument?.catatan ? "Lihat catatan" : "Tidak ada catatan"}
                                    >
                                      <StickyNote className={`w-3.5 h-3.5 ${uploadedDocument?.catatan ? 'text-amber-600' : 'text-gray-300'}`} />
                                    </Button>

                                    {/* Contact Button - WhatsApp or Email */}
                                    {uploadedDocument && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          const whatsapp = uploadedDocument.userWhatsApp;
                                          const email = uploadedDocument.userEmail;
                                          if (whatsapp) {
                                            window.open(`https://wa.me/${whatsapp}`, '_blank');
                                          } else if (email) {
                                            window.location.href = `mailto:${email}`;
                                          }
                                        }}
                                        disabled={!uploadedDocument.userWhatsApp && !uploadedDocument.userEmail}
                                        title={uploadedDocument.userWhatsApp ? "Chat WhatsApp" : uploadedDocument.userEmail ? "Kirim Email" : "Kontak tidak tersedia"}
                                      >
                                        {uploadedDocument.userWhatsApp ? (
                                          <Phone className="w-3.5 h-3.5 text-green-600" />
                                        ) : (
                                          <Mail className={`w-3.5 h-3.5 ${uploadedDocument.userEmail ? 'text-blue-600' : 'text-gray-300'}`} />
                                        )}
                                      </Button>
                                    )}

                                    {/* Download Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDownloadDocument(doc.id, uploadedDocument)}
                                      disabled={!uploadedDocument}
                                      title={uploadedDocument ? "Download" : "Belum ada file"}
                                    >
                                      <Download className={`w-3.5 h-3.5 ${uploadedDocument ? 'text-green-600' : 'text-gray-300'}`} />
                                    </Button>

                                    {/* Delete Button */}
                                    {uploadedDocument && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          if (confirm(`Hapus "${uploadedDocument.fileName}"?`)) {
                                            handleDeleteDocument(doc.id);
                                          }
                                        }}
                                        title="Hapus"
                                        disabled={deletingDocuments.has(doc.id)}
                                      >
                                        {deletingDocuments.has(doc.id) ? (
                                          <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        )}
                                      </Button>
                                    )}
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
        documentInfo={selectedDocumentForCatatan ? {
          fileName: selectedDocumentForCatatan.fileName || 'Unknown File',
          checklistDescription: selectedDocumentForCatatan.title || 'Dokumen GCG',
          aspect: 'GCG Document',
          uploadedBy: selectedDocumentForCatatan.uploadedBy || 'Unknown',
          uploadDate: selectedDocumentForCatatan.uploadDate ? new Date(selectedDocumentForCatatan.uploadDate).toISOString() : new Date().toISOString(),
          catatan: selectedDocumentForCatatan.catatan || '',
          subdirektorat: selectedDocumentForCatatan.subdirektorat
        } : null}
      />

      {/* Detail Document Dialog */}
      <DetailDocumentDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        document={selectedDocumentForDetail}
        onView={() => {
          if (selectedDocumentForDetail) {
            handleViewDocument(selectedDocumentForDetail.id);
          }
        }}
        onDownload={() => {
          if (selectedDocumentForDetail) {
            handleDownloadDocument(selectedDocumentForDetail.id);
          }
        }}
      />
    </>
  );
};

export default ArsipDokumen;

