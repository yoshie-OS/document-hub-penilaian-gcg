import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useAOI } from '@/contexts/AOIContext';
import { useAOIDocument } from '@/contexts/AOIDocumentContext';
import { useUser } from '@/contexts/UserContext';
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
  ChevronDown,
  ChevronRight,
  Star
} from 'lucide-react';


const ArsipDokumen = () => {
  // CRITICAL TEST: This proves the new code is loaded!
  console.log('🚨🚨🚨 ARSIP DOKUMEN - NEW VERSION LOADED - 2025-12-27 🚨🚨🚨');

  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { documents } = useDocumentMetadata();
  const { getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();
  const { aoiTables, aoiRecommendations } = useAOI();
  const { aoiDocuments } = useAOIDocument();
  const { user } = useUser();
  const { toast } = useToast();

  // State for bulk download and refresh
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [randomDocuments, setRandomDocuments] = useState<any[]>([]);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedSubdirektorat, setSelectedSubdirektorat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // State for pagination
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // State for AOI grouping
  const [expandedAOIGroups, setExpandedAOIGroups] = useState<Set<string>>(new Set());

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

  // State to track actual file existence from storage
  const [storageFileStatus, setstorageFileStatus] = useState<{[key: string]: boolean}>({});
  const [storageFileInfo, setstorageFileInfo] = useState<{[key: string]: any}>({});
  const [fileStatusLoading, setFileStatusLoading] = useState<boolean>(false);

  // State for random document upload
  const [isUploadingRandom, setIsUploadingRandom] = useState(false);
  const [randomUploadYear, setRandomUploadYear] = useState<number | null>(null);

  // Check storage file status
  const isChecklistUploaded = useCallback((checklistId: number) => {
    if (!selectedYear) return false;
    
    // Check storage file status first (authoritative)
    const storageExists = storageFileStatus[checklistId.toString()] || false;
    
    if (storageExists) {
      return true;
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const localFileExists = yearFiles.some(file => file.checklistId === checklistIdInt);
    
    return localFileExists;
  }, [storageFileStatus, getFilesByYear, selectedYear]);

  // Get uploaded document for dokumen GCG - now uses storage file status with localStorage fallback
  const getUploadedDocument = useCallback((checklistId: number) => {
    if (!selectedYear) return null;
    
    // First check if file exists in storage
    const storageExists = storageFileStatus[checklistId.toString()];
    if (storageExists && storageFileInfo[checklistId.toString()]) {
      return storageFileInfo[checklistId.toString()];
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const foundFile = yearFiles.find(file => file.checklistId === checklistIdInt);
    
    return foundFile;
  }, [storageFileStatus, storageFileInfo, getFilesByYear, selectedYear]);

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
                    id: fileStatus.id || `storage_${checklistId}`,
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
        setstorageFileStatus(newFileStatus);
        setstorageFileInfo(newFileInfo);
        
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
                    id: fileStatus.id || `storage_${checklistId}`,
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

      setstorageFileStatus(newFileStatus);
      setstorageFileInfo(newFileInfo);
      console.log('✅ ArsipDokumen: File statuses reloaded successfully');

    } catch (error) {
      console.error('Error reloading file statuses:', error);
    } finally {
      setFileStatusLoading(false);
    }
  }, [selectedYear, checklist, availableYears]);

  // Fetch random documents (Dokumen Lainnya) for selected year
  useEffect(() => {
    const fetchRandomDocuments = async () => {
      if (!selectedYear) return;

      try {
        const response = await fetch(`http://localhost:5001/api/random-documents/${selectedYear}`);
        if (response.ok) {
          const data = await response.json();
          setRandomDocuments(data.documents || []);
        }
      } catch (error) {
        console.error('Error fetching random documents:', error);
        setRandomDocuments([]);
      }
    };

    fetchRandomDocuments();
  }, [selectedYear]);

  // Listen for file changes from other components (Monitoring, FileUploadContext)
  useEffect(() => {
    const handleFilesChanged = (event: CustomEvent) => {
      console.log('📢 ArsipDokumen: Received uploadedFilesChanged event', event.detail);

      // If file was deleted, immediately mark as NOT existing
      // and DO NOT reload from backend to avoid race condition
      if (event.detail?.type === 'fileDeleted' && event.detail?.checklistId) {
        const checklistId = event.detail.checklistId;
        console.log('🧹 ArsipDokumen: Marking deleted checklistId as false:', checklistId);
        setstorageFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setstorageFileInfo(prev => {
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

    // 1. Get checklist-based documents
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const checklistDocs = yearChecklist
      .map(item => {
        const uploadedDocument = getUploadedDocument(item.id);
        if (!uploadedDocument) return null;

        return {
          ...item,
          uploadedDocument,
          status: 'uploaded' as const,
          isRandomDoc: false // Flag to identify checklist docs
        };
      })
      .filter(Boolean);

    // 2. Convert random documents to same format as checklist docs
    const randomDocs = randomDocuments.map((doc, index) => ({
      id: `random_${doc.id || index}`, // Unique ID for random docs
      aspek: 'DOKUMEN_LAINNYA',
      deskripsi: doc.fileName || 'Dokumen Lainnya',
      tahun: selectedYear,
      pic: 'Dokumen_Lainnya',
      uploadedDocument: {
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadDate: new Date(doc.uploadDate),
        uploadedBy: doc.uploadedBy || 'Unknown',
        subdirektorat: 'Dokumen_Lainnya',
        catatan: doc.catatan || ''
      },
      status: 'uploaded' as const,
      isRandomDoc: true // Flag to identify random docs
    }));

    // 3. Merge both types
    return [...checklistDocs, ...randomDocs];
  }, [selectedYear, checklist, getUploadedDocument, storageFileStatus, storageFileInfo, randomDocuments]);

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
      if (selectedSubdirektorat !== 'all') {
        if (selectedSubdirektorat === 'dokumen_lainnya') {
          // Show documents from Dokumen_Lainnya folder
          if (doc.uploadedDocument?.subdirektorat !== 'Dokumen_Lainnya') {
            return false;
          }
        } else {
          // Regular subdirektorat filter
          if (doc.uploadedDocument?.subdirektorat !== selectedSubdirektorat) {
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
  }, [allUploadedDocuments, searchTerm, selectedAspek, selectedSubdirektorat]);

  // Paginated documents for GCG
  const paginatedDocuments = useMemo(() => {
    if (itemsPerPage === 0) return filteredDocuments; // Show all
    return filteredDocuments.slice(0, itemsPerPage);
  }, [filteredDocuments, itemsPerPage]);

  // Group AOI documents by organization
  const groupedAOIDocuments = useMemo(() => {
    if (!selectedYear || !user) return {};

    // Get AOI tables for selected year
    const yearTables = (aoiTables || []).filter(table => table.tahun === selectedYear);

    const groups: { [key: string]: any[] } = {};

    yearTables.forEach(table => {
      // Determine group key based on target organization
      let groupKey = '';
      if (table.targetDivisi && table.targetDivisi.trim()) {
        groupKey = `${table.targetDirektorat || ''} / ${table.targetSubdirektorat || ''} / ${table.targetDivisi}`;
      } else if (table.targetSubdirektorat && table.targetSubdirektorat.trim()) {
        groupKey = `${table.targetDirektorat || ''} / ${table.targetSubdirektorat}`;
      } else if (table.targetDirektorat && table.targetDirektorat.trim()) {
        groupKey = table.targetDirektorat;
      } else {
        groupKey = 'Belum Ditentukan';
      }

      // Get recommendations for this table
      const tableRecommendations = (aoiRecommendations || []).filter(rec => rec.aoiTableId === table.id);

      // Get documents for each recommendation
      tableRecommendations.forEach(rec => {
        const recDocuments = (aoiDocuments || []).filter(doc => doc.aoiRecommendationId === rec.id);

        if (recDocuments.length > 0) {
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }

          recDocuments.forEach(doc => {
            groups[groupKey].push({
              ...doc,
              recommendation: rec,
              table: table
            });
          });
        }
      });
    });

    return groups;
  }, [aoiTables, aoiRecommendations, aoiDocuments, selectedYear, user]);

  // Toggle AOI group expansion
  const toggleAOIGroup = (groupKey: string) => {
    setExpandedAOIGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Render star rating for urgency
  const renderStars = (rating: string) => {
    const ratingMap: Record<string, number> = {
      'RENDAH': 1,
      'SEDANG': 2,
      'TINGGI': 3,
      'SANGAT_TINGGI': 4,
      'KRITIS': 5,
      'TIDAK_ADA': 0
    };
    const starCount = ratingMap[rating] || 0;

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < starCount ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

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
  const handleDownloadDocument = useCallback(async (checklistId: number) => {
    const uploadedFile = getUploadedDocument(checklistId);
    if (uploadedFile) {
      try {
        // Download file through backend API
        const response = await fetch(`http://localhost:5001/api/files/${uploadedFile.id}/download`, {
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
        catatan: uploadedDocument.catatan || '',
        title: checklistItem?.deskripsi || 'Dokumen GCG',
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
        setstorageFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setstorageFileInfo(prev => {
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

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
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
      setstorageFileStatus({});
      setstorageFileInfo({});

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
    if (!files || files.length === 0) return;

    const uploadYear = randomUploadYear || selectedYear;
    if (!uploadYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.map(f =>
        `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`
      ).join(', ');

      toast({
        title: "❌ File Terlalu Besar",
        description: `File berikut melebihi limit 50MB: ${fileList}`,
        variant: "destructive",
        duration: 7000
      });
      event.target.value = ''; // Reset input
      return;
    }

    setIsUploadingRandom(true);
    let successCount = 0;
    let failedFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        console.log(`📤 Uploading file ${successCount + 1}/${files.length}: ${file.name}`);
        console.log(`📦 File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', uploadYear.toString());
        formData.append('category', 'dokumen_lainnya');
        formData.append('uploadedBy', JSON.parse(localStorage.getItem('user') || '{}').name || 'Unknown');

        try {
          const response = await fetch('http://localhost:5001/api/upload-random-document', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`❌ Upload failed for ${file.name}: ${response.status}`, errorData);
            failedFiles.push(`${file.name}: ${errorData.error || response.statusText}`);
          } else {
            successCount++;
            console.log(`✅ Successfully uploaded: ${file.name}`);
          }
        } catch (networkError) {
          console.error(`❌ Network error uploading ${file.name}:`, networkError);
          failedFiles.push(`${file.name}: Network error`);
        }
      }

      // Show result
      if (successCount === files.length) {
        toast({
          title: "✅ Upload Berhasil",
          description: `${files.length} dokumen berhasil diupload`,
          duration: 5000
        });
        // Refresh file list
        setstorageFileStatus({});
        setstorageFileInfo({});
      } else if (successCount > 0) {
        toast({
          title: "⚠️ Upload Sebagian Berhasil",
          description: `${successCount}/${files.length} dokumen berhasil. ${failedFiles.length} gagal.`,
          variant: "destructive",
          duration: 7000
        });
        // Partial refresh
        setstorageFileStatus({});
        setstorageFileInfo({});
      } else {
        throw new Error(`Semua file gagal diupload`);
      }

    } catch (error) {
      console.error('Random upload error:', error);
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

  // Check data-tour elements after mount
  React.useEffect(() => {
    // Run after a delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const allElements = document.querySelectorAll('[data-tour]');
      console.log('🔍 ARSIP: Total data-tour elements found:', allElements.length);
      if (allElements.length > 0) {
        console.log('🔍 ARSIP: Elements:', Array.from(allElements).map(el => el.getAttribute('data-tour')));
      } else {
        console.error('❌ ARSIP: NO data-tour elements found in DOM!');
      }
    }, 1000);

    return () => clearTimeout(timer);
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
          {/* Header with Direct Buttons (NOT using PageHeaderPanel for data-tour compatibility) */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Arsip Dokumen</h1>
                <p className="text-gray-600 mt-2">Kelola dan unduh dokumen yang telah diupload</p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefreshTables}
                  disabled={isRefreshing || fileStatusLoading || isDownloading}
                  className="flex items-center gap-2"
                  data-tour="refresh-button"
                >
                  <RefreshCw className="w-4 h-4" />
                  {isRefreshing ? "Refreshing..." : "Refresh Tabel"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBulkDownload}
                  disabled={isDownloading || isRefreshing || fileStatusLoading}
                  className="flex items-center gap-2"
                  data-tour="download-all-button"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? `Downloading... ${downloadProgress}%` : "Download Semua"}
                </Button>
              </div>
            </div>
          </div>

          {/* Year Selection - Single Line with Upload/View indication */}
          <div className="mb-6 bg-white rounded-lg p-3 shadow-sm border border-gray-100" data-tour="year-selector">
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
              {/* Statistics Panel */}
              <Card data-tour="statistics-panel">
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

              {/* Upload & Download Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Upload Dokumen */}
                <Card className="border-2 border-green-200 bg-green-50/30" data-tour="upload-random">
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

                      {/* File Upload Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Pilih File
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                            onChange={handleRandomDocumentUpload}
                            disabled={isUploadingRandom || !randomUploadYear}
                            className="w-full p-2 border-2 border-dashed border-green-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Dokumen akan disimpan ke folder <span className="font-semibold text-green-600">"Dokumen Lainnya"</span>
                        </p>
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
                      {/* Filter by Aspek */}
                      <div className="space-y-2" data-tour="filter-aspek">
                        <label className="text-sm font-medium text-gray-700">
                          Filter Aspek
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

                      {/* Filter by Subdirektorat */}
                      <div className="space-y-2" data-tour="filter-pic">
                        <label className="text-sm font-medium text-gray-700">
                          Filter PIC / Subdirektorat
                        </label>
                        <select
                          value={selectedSubdirektorat}
                          onChange={(e) => setSelectedSubdirektorat(e.target.value)}
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

                      {/* Download Result Count */}
                      <div className="p-3 bg-blue-100 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">
                            {filteredDocuments.length} dokumen tersedia
                          </span>
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search Bar - Separate Row */}
              <Card data-tour="search-filter">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari dokumen berdasarkan nama, deskripsi, atau uploader..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Documents Table */}
              <Card data-tour="document-table">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Daftar Dokumen Arsip GCG</span>
                      {fileStatusLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                    </div>
                    {/* Pagination Selector */}
                    <div className="flex items-center gap-2" data-tour="pagination-selector">
                      <span className="text-sm text-gray-600">Item per halaman:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => setItemsPerPage(parseInt(value))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="0">Semua</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-gray-500">
                        (Menampilkan {paginatedDocuments.length} dari {filteredDocuments.length})
                      </span>
                    </div>
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
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px] text-center">No</TableHead>
                            <TableHead className="w-[60px]">Aspek</TableHead>
                            <TableHead className="min-w-[250px]">Deskripsi</TableHead>
                            <TableHead className="w-[180px]">PIC</TableHead>
                            <TableHead className="w-[100px] text-center">Status</TableHead>
                            <TableHead className="w-[200px]">File</TableHead>
                            <TableHead className="w-[240px] text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDocuments.map((doc, index) => {
                            if (!doc) return null;

                            const IconComponent = getAspectIcon(doc.aspek);
                            const uploadedDocument = doc.uploadedDocument;

                            return (
                              <TableRow key={doc.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                                <TableCell className="text-center text-xs text-gray-600 py-2">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="p-1.5 rounded-md bg-blue-100">
                                    <IconComponent className="w-3 h-3 text-blue-600" />
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs text-gray-900 line-clamp-2" title={doc.deskripsi}>
                                        {doc.deskripsi}
                                      </p>
                                      {doc.isRandomDoc && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                          Lainnya
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-500">
                                      {doc.aspek.replace('ASPEK ', '').substring(0, 20)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  {doc.pic ? (
                                    <div className="flex items-center space-x-1.5">
                                      <div className="p-1 rounded bg-green-100">
                                        <Building className="w-2.5 h-2.5 text-green-600" />
                                      </div>
                                      <span className="text-xs font-medium text-green-700 truncate max-w-[140px]" title={doc.pic}>
                                        {doc.pic}
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
                                      <span className="text-xs text-blue-600 font-medium truncate block max-w-[150px]" title={uploadedDocument.fileName}>
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
                                    {/* Catatan Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleShowCatatan(doc.id)}
                                      disabled={!uploadedDocument}
                                      title={uploadedDocument ? "Lihat catatan" : "Belum ada file"}
                                      data-tour={index === 0 ? "catatan-button" : undefined}
                                    >
                                      <MessageSquare className={`w-3.5 h-3.5 ${uploadedDocument ? 'text-yellow-600' : 'text-gray-300'}`} />
                                    </Button>

                                    {/* Download Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDownloadDocument(doc.id)}
                                      disabled={!uploadedDocument}
                                      title={uploadedDocument ? "Download" : "Belum ada file"}
                                      data-tour={index === 0 ? "download-doc-button" : undefined}
                                    >
                                      <Download className={`w-3.5 h-3.5 ${uploadedDocument ? 'text-green-600' : 'text-gray-300'}`} />
                                    </Button>

                                    {/* View Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleViewDocument(doc.id)}
                                      disabled={!uploadedDocument}
                                      title={uploadedDocument ? "Lihat di arsip" : "Belum ada file"}
                                      data-tour={index === 0 ? "view-button" : undefined}
                                    >
                                      <Eye className={`w-3.5 h-3.5 ${uploadedDocument ? 'text-blue-600' : 'text-gray-300'}`} />
                                    </Button>

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

              {/* AOI Documents Archive Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 text-purple-600" />
                    <span>Daftar Dokumen AOI Arsip</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Dokumen Area of Improvement (AOI) yang telah diupload, dikelompokkan berdasarkan struktur organisasi
                  </p>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupedAOIDocuments).length === 0 ? (
                    <div className="text-center py-12">
                      <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">
                        Belum ada dokumen AOI
                      </h3>
                      <p className="text-gray-400">
                        Dokumen AOI yang telah diupload akan muncul di sini
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedAOIDocuments).map(([groupKey, docs]) => (
                        <Card key={groupKey} className="border border-gray-200">
                          <CardHeader
                            className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
                            onClick={() => toggleAOIGroup(groupKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedAOIGroups.has(groupKey) ? (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                )}
                                <Building className="w-5 h-5 text-purple-600" />
                                <div>
                                  <h4 className="font-semibold text-gray-900">{groupKey}</h4>
                                  <p className="text-xs text-gray-500">{docs.length} dokumen</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {docs.length}
                              </Badge>
                            </div>
                          </CardHeader>

                          {expandedAOIGroups.has(groupKey) && (
                            <CardContent className="pt-0">
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-purple-50">
                                      <TableHead className="w-[50px] text-center">No</TableHead>
                                      <TableHead className="min-w-[300px]">Rekomendasi</TableHead>
                                      <TableHead className="w-[120px]">Urgensi</TableHead>
                                      <TableHead className="w-[150px]">Aspek AOI</TableHead>
                                      <TableHead className="w-[180px]">Organ Perusahaan</TableHead>
                                      <TableHead className="w-[200px]">File</TableHead>
                                      <TableHead className="w-[180px] text-center">Aksi</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {docs.map((doc, index) => (
                                      <TableRow key={doc.id} className="hover:bg-purple-50/50">
                                        <TableCell className="text-center text-xs">
                                          {index + 1}
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                              {doc.recommendation?.isi || '-'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {doc.table?.nama || 'Tabel AOI'}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1">
                                            {renderStars(doc.recommendation?.tingkatUrgensi || 'TIDAK_ADA')}
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1">
                                            {doc.recommendation?.tingkatUrgensi?.replace(/_/g, ' ') || 'N/A'}
                                          </p>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">
                                            {doc.recommendation?.aspekAOI || '-'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <p className="text-xs text-gray-700">
                                            {doc.recommendation?.organPerusahaan || '-'}
                                          </p>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]" title={doc.fileName}>
                                              {doc.fileName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {doc.uploadedBy || 'Unknown'}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center justify-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              title="Download"
                                            >
                                              <Download className="w-3.5 h-3.5 text-blue-600" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              title="Lihat Detail"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-purple-600" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
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

