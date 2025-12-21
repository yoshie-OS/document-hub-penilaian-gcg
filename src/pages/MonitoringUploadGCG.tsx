import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useChecklist } from '@/contexts/ChecklistContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useYear } from '@/contexts/YearContext';
import { useUser } from '@/contexts/UserContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';

import { useToast } from '@/hooks/use-toast';
import { AdminUploadDialog } from '@/components/dialogs';
import { PageHeaderPanel } from '@/components/panels';

import {
  FileText,
  CheckCircle,
  Clock,
  Upload,
  Filter,
  Eye,
  TrendingUp,
  Search,
  Download,
  Plus,
  User,
  Loader2,
  RefreshCw,
  Trash2,
  BarChart3,
  AlertCircle,
  Calendar,
  Replace,
  X,
  ChevronDown,
} from 'lucide-react';

const MonitoringUploadGCG = () => {
  console.log('🔍 MonitoringUploadGCG component rendering...');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    checklist, 
    ensureAllYearsHaveData
  } = useChecklist();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { getFilesByYear, refreshFiles } = useFileUpload();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear } = useYear();
  const { user } = useUser();
  const { toast } = useToast();
  const { subdirektorat: strukturSubdirektorat, divisi: strukturDivisi } = useStrukturPerusahaan();

  console.log('🔍 Context data loaded:', {
    checklistLength: checklist?.length || 0,
    documentsLength: documents?.length || 0,
    selectedYear,
    user: user?.name || 'Unknown'
  });

  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPIC, setSelectedPIC] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // State untuk PIC filter dropdown
  const [isPICDropdownOpen, setIsPICDropdownOpen] = useState(false);
  const [picFilterType, setPicFilterType] = useState<'divisi' | 'subdirektorat'>('divisi');
  const [picSearchTerm, setPicSearchTerm] = useState<string>('');
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    id: number;
    aspek: string;
    deskripsi: string;
    tahun?: number;
    rowNumber?: number;
    pic?: string;
  } | null>(null);
  // Force re-render state untuk memastikan data terupdate
  const [forceUpdate, setForceUpdate] = useState(0);
  
  
  // State to track actual file existence from storage
  const [storageFileStatus, setstorageFileStatus] = useState<{[key: string]: boolean}>({});
  // State to store file information from storage
  const [storageFileInfo, setstorageFileInfo] = useState<{[key: string]: any}>({});
  // State to track which files are being checked for loading spinners
  const [fileStatusLoading, setFileStatusLoading] = useState<boolean>(false);
  // State to track individual items being checked
  const [itemsBeingChecked, setItemsBeingChecked] = useState<Set<number>>(new Set());
  // State to track batch progress
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  // State to track refresh/rescan progress
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  

  // Ensure all years have dokumen GCG data when component mounts
  useEffect(() => {
    ensureAllYearsHaveData();
  }, [ensureAllYearsHaveData]);

  // Close PIC dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isPICDropdownOpen && !target.closest('[data-pic-dropdown]')) {
        setIsPICDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPICDropdownOpen]);

  // Listen for real-time updates from PengaturanBaru and FileUploadDialog
  useEffect(() => {
    const handleChecklistUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'checklistUpdated') {
        console.log('MonitoringUploadGCG: Received checklist update from PengaturanBaru', event.detail.data);
        // Force re-render using setSelectedYear like admin dashboard
        if (selectedYear) {
          setTimeout(() => {
            setSelectedYear(selectedYear);
          }, 100);
        }
      }
    };

    const handleAspectsUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'aspectsUpdated') {
        console.log('MonitoringUploadGCG: Received aspects update from PengaturanBaru', event.detail.data);
        // Force re-render using setSelectedYear like admin dashboard
        if (selectedYear) {
          setTimeout(() => {
            setSelectedYear(selectedYear);
          }, 100);
        }
      }
    };

    // Listen for file upload events from FileUploadDialog
    const handleFileUploaded = (event: CustomEvent) => {
      console.log('MonitoringUploadGCG: Received fileUploaded event from FileUploadDialog');
      
      // If we have specific upload details, rescan only that row
      const uploadDetails = event.detail;
      if (uploadDetails?.checklistId && uploadDetails?.rowNumber) {
        setTimeout(() => {
          rescanSingleRow(uploadDetails.checklistId, uploadDetails.rowNumber);
        }, 1000); // Wait a bit for storage to sync
      } else {
        // Fallback: full rescan if no specific details
        setTimeout(() => {
          checkstorageFileStatus();
        }, 1000);
      }
      
      // Force re-render using setSelectedYear like admin dashboard
      if (selectedYear) {
        setTimeout(() => {
          setSelectedYear(selectedYear);
        }, 100);
      }
    };

    const handleDocumentsUpdated = async (event: CustomEvent) => {
      console.log('MonitoringUploadGCG: Received documentsUpdated event', event.detail);

      // Skip full refresh if this is triggered by delete - state already cleared
      if (event.detail?.type === 'documentsUpdated' && event.detail?.skipRefresh) {
        console.log('MonitoringUploadGCG: Skipping refresh (delete operation)');
        return;
      }

      // Refresh files and checklist status
      try {
        await refreshFiles();
        // Only check storage status if not a delete event (delete already handled by uploadedFilesChanged)
        console.log('✅ MonitoringUploadGCG: Data refreshed after documentsUpdated');
      } catch (error) {
        console.error('❌ MonitoringUploadGCG: Error refreshing after documentsUpdated:', error);
      }
    };

    const handleUploadedFilesChanged = async (event: CustomEvent) => {
      console.log('MonitoringUploadGCG: Received uploadedFilesChanged event', event.detail);

      // If file was deleted, immediately mark as NOT existing
      // and DO NOT call checkstorageFileStatus to avoid race condition
      if (event.detail?.type === 'fileDeleted' && event.detail?.checklistId) {
        const checklistId = event.detail.checklistId;
        console.log('🧹 MonitoringUploadGCG: Marking deleted checklistId as false:', checklistId);
        setstorageFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setstorageFileInfo(prev => {
          const newInfo = { ...prev };
          delete newInfo[checklistId.toString()];  // Remove file info
          return newInfo;
        });
      }

      // For delete events, just force UI update - don't refresh from backend
      // This prevents race condition where backend data isn't updated yet
      if (event.detail?.type === 'fileDeleted') {
        setForceUpdate(prev => prev + 1);
        console.log('✅ MonitoringUploadGCG: UI updated after delete (no backend refresh)');
        return;
      }

      // For other events (upload), refresh from backend
      try {
        await refreshFiles();
        setForceUpdate(prev => prev + 1);
        console.log('✅ MonitoringUploadGCG: Data refreshed after uploadedFilesChanged');
      } catch (error) {
        console.error('❌ MonitoringUploadGCG: Error refreshing after uploadedFilesChanged:', error);
      }
    };

    const handleAssignmentsUpdated = () => {
      console.log('MonitoringUploadGCG: Received assignmentsUpdated event from FileUploadDialog');
      // Force re-render using setSelectedYear like admin dashboard
      setForceUpdate(prev => prev + 1);
    };

    const handleChecklistAssignmentsChanged = () => {
      console.log('MonitoringUploadGCG: Received checklistAssignmentsChanged event from FileUploadDialog');
      // Force re-render using setSelectedYear like admin dashboard
      setForceUpdate(prev => prev + 1);
    };

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'uploadedFiles' || event.key === 'checklistAssignments') {
        console.log('MonitoringUploadGCG: Detected localStorage change:', event.key);
        // Force re-render using setSelectedYear like admin dashboard
        if (selectedYear) {
          setTimeout(() => {
            setSelectedYear(selectedYear);
          }, 100);
        }
      }
    };

    window.addEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
    window.addEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    window.addEventListener('fileUploaded', handleFileUploaded);
    window.addEventListener('documentsUpdated', handleDocumentsUpdated);
    window.addEventListener('uploadedFilesChanged', handleUploadedFilesChanged);
    window.addEventListener('assignmentsUpdated', handleAssignmentsUpdated);
    window.addEventListener('checklistAssignmentsChanged', handleChecklistAssignmentsChanged);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
      window.removeEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
      window.removeEventListener('fileUploaded', handleFileUploaded);
      window.removeEventListener('documentsUpdated', handleDocumentsUpdated);
      window.removeEventListener('uploadedFilesChanged', handleUploadedFilesChanged);
      window.removeEventListener('assignmentsUpdated', handleAssignmentsUpdated);
      window.removeEventListener('checklistAssignmentsChanged', handleChecklistAssignmentsChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedYear]);

  // Auto-set filters from URL parameters
  useEffect(() => {
    const yearParam = searchParams.get('year');
    const aspectParam = searchParams.get('aspect');
    const scrollParam = searchParams.get('scroll');
    
    if (yearParam) {
      setSelectedYear(parseInt(yearParam));
    }
    
    if (aspectParam) {
      setSelectedAspek(aspectParam);
    }

    // Auto-scroll to dokumen GCG table if scroll parameter is present
    if (scrollParam === 'checklist') {
      setTimeout(() => {
        const checklistElement = document.getElementById('dokumen-gcg-table');
        if (checklistElement) {
          checklistElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500); // Delay to ensure filters are applied first
    }
  }, [searchParams, setSelectedYear]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Polling untuk memastikan data terupdate dari localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if localStorage has been updated
      const storedData = localStorage.getItem("checklistGCG");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData) && parsedData.length !== checklist.length) {
            console.log('MonitoringUploadGCG: Detected localStorage change, updating...', {
              stored: parsedData.length,
              current: checklist.length
            });
            // Force re-render using setSelectedYear like admin dashboard
            if (selectedYear) {
              setTimeout(() => {
                setSelectedYear(selectedYear);
              }, 100);
            }
          }
        } catch (error) {
          console.error('MonitoringUploadGCG: Error parsing localStorage data', error);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [checklist.length]);

  // Use years from global context
  const { availableYears } = useYear();
  const years = availableYears;

  // Get unique aspects for selected year
  const aspects = useMemo(() => {
    if (!selectedYear) return [];
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const uniqueAspects = [...new Set(yearChecklist.map(item => item.aspek || 'Dokumen Tanpa Aspek'))];
    return uniqueAspects;
  }, [checklist, selectedYear]);

  // Get unique PIC values for filter (legacy - masih digunakan untuk filter logic)
  const picValues = useMemo(() => {
    if (!selectedYear) return [];

    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const allPICs = yearChecklist
      .map(item => item.pic)
      .filter(Boolean)
      .filter(pic => pic.trim() !== '');

    const uniquePICs = Array.from(new Set(allPICs)).sort();

    return uniquePICs;
  }, [selectedYear, checklist]);

  // Get PIC options based on filter type (divisi/subdirektorat)
  const picFilterOptions = useMemo(() => {
    if (picFilterType === 'divisi') {
      return strukturDivisi?.map(d => d.nama).filter(Boolean).sort() || [];
    } else {
      return strukturSubdirektorat?.map(s => s.nama).filter(Boolean).sort() || [];
    }
  }, [picFilterType, strukturDivisi, strukturSubdirektorat]);

  // Filtered PIC options based on search
  const filteredPicOptions = useMemo(() => {
    if (!picSearchTerm.trim()) return picFilterOptions;
    return picFilterOptions.filter(name =>
      name.toLowerCase().includes(picSearchTerm.toLowerCase())
    );
  }, [picFilterOptions, picSearchTerm]);

  // Check storage file status
  const isChecklistUploaded = useCallback((checklistId: number) => {
    if (!selectedYear) return false;
    
    // Check storage file status first (authoritative)
    const storageExists = storageFileStatus[checklistId.toString()] || false;
    // Uncomment for detailed debugging:
    // console.log('MonitoringUploadGCG: isChecklistUploaded called for checklistId:', checklistId, 'storageExists:', storageExists);
    
    if (storageExists) {
      return true;
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const localFileExists = yearFiles.some(file => file.checklistId === checklistIdInt);
    // Uncomment for detailed debugging:
    // console.log('MonitoringUploadGCG: localStorage fallback for checklistId:', checklistId, 'localFileExists:', localFileExists);
    
    return localFileExists;
  }, [storageFileStatus, getFilesByYear, selectedYear]);

  // Get uploaded document for dokumen GCG - now uses storage file status with localStorage fallback
  const getUploadedDocument = useCallback((checklistId: number) => {
    if (!selectedYear) return null;

    const checklistIdStr = checklistId.toString();

    // Check if explicitly marked as NOT existing in storage (deleted or never uploaded)
    if (checklistIdStr in storageFileStatus && !storageFileStatus[checklistIdStr]) {
      // Explicitly marked as not existing - return null (no fallback)
      return null;
    }

    // Check if file exists in storage with info
    if (storageFileStatus[checklistIdStr] && storageFileInfo[checklistIdStr]) {
      return storageFileInfo[checklistIdStr];
    }

    // Only fallback to context if we haven't explicitly checked this checklist yet
    // (storageFileStatus doesn't have this key at all)
    if (!(checklistIdStr in storageFileStatus)) {
      const yearFiles = getFilesByYear(selectedYear);
      const checklistIdInt = Math.floor(checklistId);
      const foundFile = yearFiles.find(file => file.checklistId === checklistIdInt);
      return foundFile;
    }

    // Default: no document found
    return null;
  }, [storageFileStatus, storageFileInfo, getFilesByYear, selectedYear]);

  // Get assignment data for checklist item
  const getAssignmentData = useCallback((checklistId: number) => {
    if (!selectedYear) return null;
    
    const checklistItem = checklist.find(item => 
      item.id === checklistId && item.tahun === selectedYear
    );
    
    if (!checklistItem || !checklistItem.pic) return null;
    
    // Return simplified assignment data structure for backward compatibility
    return {
      checklistId: checklistId,
      subdirektorat: checklistItem.pic,
      divisi: checklistItem.pic, // For compatibility with existing code
      assignmentType: 'subdirektorat',
      tahun: selectedYear,
      assignedAt: new Date().toISOString()
    };
  }, [selectedYear, checklist]);

  // Function to check file existence from storage
  // verifyFiles: when true, checks filesystem to detect orphaned records (slower but accurate)
  const checkstorageFileStatus = useCallback(async (verifyFiles: boolean = false) => {
    if (!selectedYear || !checklist.length) return;

    // Set loading state
    setFileStatusLoading(true);
    setBatchProgress(null);
    
    // Initialize all items as being checked
    const allItemIds = new Set(checklist.map(item => item.id));
    setItemsBeingChecked(allItemIds);

    try {
      // Group checklist items by PIC to minimize API calls
      const itemsByPIC = new Map<string, Array<{id: number, rowNumber: number}>>();
      
      checklist
        .filter(item => item.tahun === selectedYear)
        .forEach((item, index) => {
          // Get PIC from checklist item, fallback to current user's subdirektorat
          const picName = item.pic || user?.subdirektorat || 'UNKNOWN_PIC';
          
          if (!itemsByPIC.has(picName)) {
            itemsByPIC.set(picName, []);
          }
          itemsByPIC.get(picName)!.push({
            id: item.id,
            rowNumber: item.rowNumber || (index + 1) // Use stable rowNumber or fallback to index+1
          });
        });

      console.log('MonitoringUploadGCG: Checking file status for PICs:', Array.from(itemsByPIC.keys()));

      // Check files for each PIC in batches of 10
      const newFileStatus: {[key: string]: boolean} = {};
      const newFileInfo: {[key: string]: any} = {};
      const BATCH_SIZE = 10;
      
      // Calculate total batches for progress tracking
      let totalBatches = 0;
      for (const [picName, items] of itemsByPIC) {
        totalBatches += Math.ceil(items.length / BATCH_SIZE);
      }
      setBatchProgress({current: 0, total: totalBatches});
      
      let currentBatch = 0;
      
      for (const [picName, items] of itemsByPIC) {
        // Split items into batches of 10
        const batches = [];
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          batches.push(items.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`MonitoringUploadGCG: Processing ${items.length} files for ${picName} in ${batches.length} batches`);
        
        // Process each batch
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          currentBatch++;
          setBatchProgress({current: currentBatch, total: totalBatches});
          
          console.log(`MonitoringUploadGCG: Processing batch ${batchIndex + 1}/${batches.length} for ${picName} (${batch.length} files) - Overall: ${currentBatch}/${totalBatches}`);
          
          try {
            const requestBody = {
              picName,
              year: selectedYear,
              checklistIds: batch.map(item => item.id),  // Use checklist IDs instead of row numbers
              verifyFiles  // Pass verification mode to backend
            };

            const response = await fetch('http://localhost:5001/api/check-gcg-files', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              const result = await response.json();
              
              // Create batch-specific updates
              const batchFileStatus: {[key: string]: boolean} = {};
              const batchFileInfo: {[key: string]: any} = {};
              
              // Map results back to checklist IDs
              batch.forEach(item => {
                const fileStatus = result.fileStatuses?.[item.id.toString()];
                const fileExists = fileStatus?.exists || false;
                batchFileStatus[item.id.toString()] = fileExists;
                newFileStatus[item.id.toString()] = fileExists; // Keep for final state
                
                if (fileExists && fileStatus) {
                  // Create file info object compatible with localStorage format
                  const fileInfoObj = {
                    id: fileStatus.id || `storage_${item.id}`,  // Use real UUID from backend
                    fileName: fileStatus.fileName,
                    fileSize: fileStatus.size,
                    uploadDate: new Date(fileStatus.lastModified),
                    year: selectedYear,
                    checklistId: item.id,
                    status: 'uploaded',
                    catatan: fileStatus.catatan || ''
                  };
                  batchFileInfo[item.id.toString()] = fileInfoObj;
                  newFileInfo[item.id.toString()] = fileInfoObj; // Keep for final state
                }
                
                console.log('MonitoringUploadGCG: Mapped file status - ID:', item.id, 'Row:', item.rowNumber, 'Exists:', fileExists);
              });
              
              // Update state immediately after each batch for progressive loading
              setstorageFileStatus(prev => ({...prev, ...batchFileStatus}));
              setstorageFileInfo(prev => ({...prev, ...batchFileInfo}));
              
              // Remove processed items from being checked
              setItemsBeingChecked(prev => {
                const newSet = new Set(prev);
                batch.forEach(item => newSet.delete(item.id));
                return newSet;
              });
              
            } else {
              console.error(`MonitoringUploadGCG: API call failed for ${picName} batch ${batchIndex + 1} with status:`, response.status);
            }
          } catch (error) {
            console.error(`Error checking files for PIC: ${picName} batch ${batchIndex + 1}`, error);
            
            // Create batch-specific error updates
            const batchErrorStatus: {[key: string]: boolean} = {};
            
            // Set all items for this batch as not uploaded on error
            batch.forEach(item => {
              batchErrorStatus[item.id.toString()] = false;
              newFileStatus[item.id.toString()] = false; // Keep for final state
            });
            
            // Update state immediately for this batch
            setstorageFileStatus(prev => ({...prev, ...batchErrorStatus}));
            
            // Remove processed items from being checked even on error
            setItemsBeingChecked(prev => {
              const newSet = new Set(prev);
              batch.forEach(item => newSet.delete(item.id));
              return newSet;
            });
          }
          
          // Small delay between batches to prevent overwhelming the server
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Final update (already done progressively above)
      console.log('MonitoringUploadGCG: Batch processing complete - Total items:', Object.keys(newFileStatus).length, 'True values:', Object.values(newFileStatus).filter(Boolean).length);
      console.log('MonitoringUploadGCG: Updated storage file info - Files with info:', Object.keys(newFileInfo).length);
      
    } catch (error) {
      console.error('Error checking storage file status:', error);
    } finally {
      // Clear loading and progress states
      setFileStatusLoading(false);
      setBatchProgress(null);
      setItemsBeingChecked(new Set()); // Clear all checking states
    }
  }, [selectedYear, checklist, getAssignmentData, user]);

  // Check storage file status when year or checklist changes
  useEffect(() => {
    checkstorageFileStatus();
  }, [checkstorageFileStatus]);

  // Filter dokumen GCG berdasarkan aspek, status, dan PIC - menggunakan data yang sama dengan DashboardStats
  const filteredChecklist = useMemo(() => {
    if (!selectedYear) return [];
    
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    let filtered = yearChecklist.map(item => ({
      ...item,
      status: isChecklistUploaded(item.id) ? 'uploaded' : 'not_uploaded' as 'uploaded' | 'not_uploaded'
    }));

    if (selectedAspek !== 'all') {
      filtered = filtered.filter(item => (item.aspek || 'Dokumen Tanpa Aspek') === selectedAspek);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Filter by PIC
    if (selectedPIC !== 'all') {
      filtered = filtered.filter(item => {
        return item.pic === selectedPIC;
      });
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter(item => 
        item.deskripsi.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [checklist, selectedAspek, selectedStatus, selectedPIC, selectedYear, debouncedSearchTerm, isChecklistUploaded, getAssignmentData, forceUpdate, storageFileStatus, storageFileInfo]);

  // Navigate to dashboard with document highlight
  const handleViewDocument = useCallback((checklistId: number) => {
    if (!selectedYear) return;
    
    const uploadedFile = getUploadedDocument(checklistId);
    if (uploadedFile) {
      // Find the corresponding document in DocumentMetadata using fileName
      const documentMetadata = documents.find(doc => 
        doc.fileName === uploadedFile.fileName && 
        doc.year === selectedYear
      );
      
      if (documentMetadata) {
        navigate(`/dashboard?highlight=${documentMetadata.id}&year=${selectedYear}&filter=year`);
      } else {
        // Fallback: navigate without highlight if document not found in metadata
        navigate(`/dashboard?year=${selectedYear}&filter=year`);
      }
    }
  }, [getUploadedDocument, documents, selectedYear, navigate]);

  // Handle download document
  const handleDownloadDocument = useCallback(async (checklistId: number, rowNumber: number) => {
    if (!selectedYear) return;
    
    try {
      // Get PIC from checklist item, fallback to current user's subdirektorat  
      const checklistItem = checklist.find(item => item.id === checklistId && item.tahun === selectedYear);
      const picName = checklistItem?.pic || user?.subdirektorat || 'UNKNOWN_PIC';
      
      // Use fetch to download the file as a blob
      const response = await fetch('http://localhost:5001/api/download-gcg-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          picName,
          year: selectedYear,
          rowNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document_${selectedYear}_${rowNumber}`; // Default filename without extension
      
      if (contentDisposition) {
        // Match: filename="actual_filename.ext" or filename=actual_filename.ext
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;\s]+)/);
        if (filenameMatch) {
          // Use the captured group that matched (either quoted or unquoted)
          filename = filenameMatch[1] || filenameMatch[2];
        }
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary download link and trigger it
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      
      // For Firefox and other browsers that might try to open PDFs inline,
      // dispatch a proper click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      link.dispatchEvent(clickEvent);
      
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      window.URL.revokeObjectURL(url);
      
      // Show success message
      toast({
        title: "Download berhasil",
        description: `Dokumen untuk ${picName} berhasil diunduh`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat download dokumen",
        variant: "destructive"
      });
    }
  }, [selectedYear, checklist, toast, user]);

  // Handle refresh/rescan - reload checklist data and rescan storage
  const handleRefreshRescan = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      toast({
        title: "Memuat ulang data...",
        description: "Memperbarui daftar dokumen dan memindai ulang storage",
      });

      // 1. Refresh checklist data (reload from backend)
      await ensureAllYearsHaveData();
      
      // 2. Refresh uploaded files data (reload from backend)
      await refreshFiles();
      
      // 3. Rescan storage storage for file changes (with filesystem verification)
      await checkstorageFileStatus(true);  // verifyFiles=true to detect orphaned records

      toast({
        title: "Data berhasil diperbarui",
        description: "Daftar dokumen dan storage telah dipindai ulang (dengan verifikasi)",
      });
      
    } catch (error) {
      console.error('Error during refresh/rescan:', error);
      toast({
        title: "Gagal memperbarui data",
        description: "Terjadi kesalahan saat memperbarui data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, ensureAllYearsHaveData, refreshFiles, checkstorageFileStatus, toast]);

  // Function to rescan a single row after upload
  const rescanSingleRow = useCallback(async (checklistId: number, rowNumber: number) => {
    if (!selectedYear) return;
    
    // Find the specific item
    const item = checklist.find(item => item.id === checklistId);
    if (!item) return;
    
    // Get PIC from checklist item, fallback to current user's subdirektorat
    const picName = item.pic || user?.subdirektorat || 'UNKNOWN_PIC';
    
    
    // Add this item to being checked
    setItemsBeingChecked(prev => new Set(prev.add(checklistId)));
    
    try {
      const requestBody = {
        picName,
        year: selectedYear,
        checklistIds: [checklistId]  // Use checklist ID instead of row number
      };
      
      const response = await fetch('http://localhost:5001/api/check-gcg-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        const fileStatus = result.fileStatuses?.[checklistId.toString()];
        const fileExists = fileStatus?.exists || false;
        
        // Update states for this single item
        setstorageFileStatus(prev => ({...prev, [checklistId.toString()]: fileExists}));
        
        if (fileExists && fileStatus) {
          const fileInfoObj = {
            id: `storage_${checklistId}`,
            fileName: fileStatus.fileName,
            fileSize: fileStatus.size,
            uploadDate: new Date(fileStatus.lastModified),
            year: selectedYear,
            checklistId: checklistId,
            status: 'uploaded',
            catatan: fileStatus.catatan || ''
          };
          setstorageFileInfo(prev => ({...prev, [checklistId.toString()]: fileInfoObj}));
        }
        
        console.log('MonitoringUploadGCG: Single row rescan complete - ID:', checklistId, 'Exists:', fileExists);
      }
    } catch (error) {
      console.error('Error rescanning single row:', error);
      // Set as not uploaded on error
      setstorageFileStatus(prev => ({...prev, [checklistId.toString()]: false}));
    } finally {
      // Remove from being checked
      setItemsBeingChecked(prev => {
        const newSet = new Set(prev);
        newSet.delete(checklistId);
        return newSet;
      });
    }
  }, [selectedYear, checklist, getAssignmentData, user]);


  // Get aspect icon - konsisten dengan dashboard
  const getAspectIcon = useCallback((aspekName: string) => {
    if (aspekName === 'KESELURUHAN') return TrendingUp;
    if (aspekName === 'Dokumen Tanpa Aspek') return Plus;
    if (aspekName.includes('ASPEK I')) return FileText;
    if (aspekName.includes('ASPEK II')) return CheckCircle;
    if (aspekName.includes('ASPEK III')) return TrendingUp;
    if (aspekName.includes('ASPEK IV')) return FileText;
    if (aspekName.includes('ASPEK V')) return Upload;
    // Aspek baru/default
    return Plus;
  }, []);

  // Mapping warna unik untuk tiap aspek - sama dengan dashboard
  const ASPECT_COLORS: Record<string, string> = {
    'KESELURUHAN': '#7c3aed', // ungu gelap untuk keseluruhan
    'Dokumen Tanpa Aspek': '#6b7280', // abu-abu
    'ASPEK I. Komitmen': '#2563eb', // biru
    'ASPEK II. RUPS': '#059669',    // hijau
    'ASPEK III. Dewan Komisaris': '#f59e42', // oranye
    'ASPEK IV. Direksi': '#eab308', // kuning
    'ASPEK V. Pengungkapan': '#d946ef', // ungu
    // fallback
    'default': '#ef4444', // merah
  };

  // Get aspect color based on progress - sama dengan dashboard
  const getAspectColor = useCallback((aspekName: string, progress: number) => {
    if (ASPECT_COLORS[aspekName]) return ASPECT_COLORS[aspekName];
    if (progress >= 80) return '#059669'; // hijau
    if (progress >= 50) return '#eab308'; // kuning
    return '#ef4444'; // merah
  }, []);

  // Get overall progress for all aspects
  const getOverallProgress = useMemo(() => {
    if (!selectedYear) return null;

    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const totalItems = yearChecklist.length;
    const uploadedCount = yearChecklist.filter(item => isChecklistUploaded(item.id)).length;
    const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

    return {
      aspek: 'KESELURUHAN',
      totalItems,
      uploadedCount,
      pendingCount: totalItems - uploadedCount,
      progress
    };
  }, [selectedYear, checklist, isChecklistUploaded, storageFileStatus]);

  // Get color based on progress - sama dengan Dashboard
  const getProgressColor = useCallback((progress: number) => {
    if (progress >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' };
    if (progress >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' };
    if (progress >= 25) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
  }, []);

  // Get aspect statistics for year book
  const getAspectStats = useMemo(() => {
    if (!selectedYear) return [];

    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);

    // Get unique aspects
    const uniqueAspects = Array.from(new Set(yearChecklist.map(item => item.aspek || 'Dokumen Tanpa Aspek')));

    return uniqueAspects.map(aspek => {
      const aspectItems = yearChecklist.filter(item => (item.aspek || 'Dokumen Tanpa Aspek') === aspek);
      const totalItems = aspectItems.length;
      const uploadedCount = aspectItems.filter(item => isChecklistUploaded(item.id)).length;
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

      return {
        aspek,
        totalItems,
        uploadedCount,
        pendingCount: totalItems - uploadedCount,
        progress
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  }, [selectedYear, checklist, isChecklistUploaded, storageFileStatus]);

  // Handle upload button click
  const handleUploadClick = useCallback((item: { id: number; aspek: string; deskripsi: string; rowNumber?: number; pic?: string }, rowNumber: number) => {
    setSelectedChecklistItem({ ...item, rowNumber: item.rowNumber || rowNumber });
    setIsUploadDialogOpen(true);
  }, []);

  // Handle delete document
  const handleDeleteDocument = useCallback(async (checklistId: number, documentId: string) => {
    console.log('🗑️ MonitoringUploadGCG: Starting delete process', { checklistId, documentId });

    try {
      console.log(`🌐 MonitoringUploadGCG: Sending DELETE request to /api/delete-file/${documentId}`);
      const response = await fetch(`http://localhost:5001/api/delete-file/${documentId}`, {
        method: 'DELETE',
      });

      console.log(`📡 MonitoringUploadGCG: Delete response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ MonitoringUploadGCG: Delete successful', responseData);

        toast({
          title: "Berhasil",
          description: "Dokumen berhasil dihapus",
        });

        // IMMEDIATELY mark as NOT existing (false) instead of deleting key
        // This ensures getUploadedDocument knows file was explicitly deleted
        console.log('🧹 MonitoringUploadGCG: Marking file as deleted for checklistId:', checklistId);
        setstorageFileStatus(prev => ({
          ...prev,
          [checklistId.toString()]: false  // Explicitly mark as not existing
        }));
        setstorageFileInfo(prev => {
          const newInfo = { ...prev };
          delete newInfo[checklistId.toString()];  // Remove file info
          return newInfo;
        });

        // Dispatch events to notify other components
        console.log('📢 MonitoringUploadGCG: Dispatching events for sync');
        window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
          detail: {
            type: 'fileDeleted',
            fileId: documentId,
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

        // DO NOT call refreshFiles() here - this causes race condition
        // where backend hasn't fully processed delete but we're already fetching
        // The local state is already cleared above, just force UI update
        console.log('🚫 MonitoringUploadGCG: Skipping refreshFiles (race condition prevention)');

        // Force UI update
        setForceUpdate(prev => prev + 1);

        console.log('✅ MonitoringUploadGCG: Delete process completed successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ MonitoringUploadGCG: Delete failed', { status: response.status, error: errorData });
        throw new Error(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('❌ MonitoringUploadGCG: Delete error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus dokumen: ${error}`,
        variant: "destructive",
      });
    }
  }, [toast, refreshFiles, selectedYear]);

  // Handle navigate to archive with highlight
  const handleViewInArchive = useCallback((item: { id: number; aspek: string; deskripsi: string; pic?: string }) => {
    console.log('🎯 MonitoringUploadGCG: Preparing to navigate to archive', {
      itemId: item.id,
      aspek: item.aspek,
      deskripsi: item.deskripsi,
      pic: item.pic
    });
    
    // Store the search criteria for highlighting
    const searchCriteria = {
      checklistId: item.id,
      aspect: item.aspek || 'Dokumen Tanpa Aspek',
      description: item.deskripsi,
      pic: item.pic || '',
      timestamp: new Date().toISOString() // Add timestamp for uniqueness
    };
    
    console.log('📝 Storing highlight criteria:', searchCriteria);
    
    // Store in localStorage for the archive page to use
    localStorage.setItem('archiveHighlight', JSON.stringify(searchCriteria));
    
    // Verify storage
    const stored = localStorage.getItem('archiveHighlight');
    console.log('✅ Verified storage:', stored);
    
    // Navigate to archive page
    navigate('/admin/arsip-dokumen');
    
    toast({
      title: "Navigasi ke Arsip",
      description: `Membuka arsip dokumen dengan highlight untuk: ${item.deskripsi}`,
    });
  }, [navigate, toast]);

  // Error boundary for rendering
  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Sidebar />
        <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Enhanced Header */}
          <PageHeaderPanel
            title="Monitoring & Upload Dokumen"
            subtitle="Monitoring dan pengelolaan dokumen GCG berdasarkan tahun buku"
            badge={{ 
              text: selectedYear ? selectedYear.toString() : 'Belum dipilih', 
              variant: selectedYear ? "default" : "secondary" 
            }}
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
                {years.sort((a, b) => b - a).map((year, index) => {
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
                  {selectedYear === years.sort((a, b) => b - a)[0] ? (
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

          {/* Warning jika belum ada tahun yang dipilih */}
          {!selectedYear && (
            <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                      Belum Ada Tahun Buku yang Dipilih
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      Silakan pilih tahun buku terlebih dahulu untuk melihat monitoring dan dokumen GCG. 
                      Jika belum ada tahun buku, buat terlebih dahulu di menu "Pengaturan Baru" → "Tahun Buku".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Konten Rekap */}
          {selectedYear && getOverallProgress ? (
            <>
              {/* Progress Keseluruhan - Sama seperti Dashboard */}
              <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Circular Progress */}
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="white"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${getOverallProgress.progress * 2.64} 264`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-2xl font-bold">{getOverallProgress.progress}%</span>
                          <p className="text-[10px] text-purple-200">Selesai</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-lg font-bold mb-1">Progress Keseluruhan</h2>
                      <p className="text-purple-200 text-xs mb-3">Tahun Buku {selectedYear}</p>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <FileText className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{getOverallProgress.totalItems}</p>
                          <p className="text-[10px] text-purple-200">Total Dokumen</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <CheckCircle className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{getOverallProgress.uploadedCount}</p>
                          <p className="text-[10px] text-purple-200">Selesai</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center">
                          <Clock className="w-4 h-4 mx-auto mb-0.5" />
                          <p className="text-lg font-bold">{getOverallProgress.pendingCount}</p>
                          <p className="text-[10px] text-purple-200">Belum Upload</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Per Aspek - Sama seperti Dashboard */}
              <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Progress Per Aspek
                  </CardTitle>
                  <CardDescription>
                    Klik pada aspek untuk memfilter tabel dokumen di bawah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getAspectStats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getAspectStats.map((aspect, index) => {
                        const colors = getProgressColor(aspect.progress);
                        return (
                          <div
                            key={index}
                            onClick={() => setSelectedAspek(aspect.aspek)}
                            className={`p-4 bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer group ${
                              selectedAspek === aspect.aspek ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Mini Circular Progress */}
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="10"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${aspect.progress * 2.64} 264`}
                                    style={{ stroke: colors.bg.includes('green') ? '#22c55e' : colors.bg.includes('yellow') ? '#eab308' : colors.bg.includes('orange') ? '#f97316' : '#ef4444' }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-sm font-bold ${colors.text}`}>{aspect.progress}%</span>
                                </div>
                              </div>

                              {/* Aspect Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={aspect.aspek}>
                                  {aspect.aspek}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {aspect.uploadedCount} / {aspect.totalItems} dokumen
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {aspect.pendingCount > 0 ? (
                                    <span className="inline-flex items-center text-xs text-orange-600">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {aspect.pendingCount} belum
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-xs text-green-600">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Lengkap
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Tidak ada data aspek untuk tahun ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daftar Dokumen GCG */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm" id="dokumen-gcg-table">
                <CardHeader className="pb-4">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Daftar Dokumen GCG
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-semibold text-blue-600">{filteredChecklist.length}</span> dokumen
                        {searchTerm && <span> untuk "{searchTerm}"</span>}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshRescan}
                        disabled={isRefreshing || fileStatusLoading}
                        className="text-xs"
                      >
                        {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Compact Filters */}
                  <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Cari dokumen..."
                        className="pl-9 h-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Aspek Dropdown */}
                      <Select value={selectedAspek} onValueChange={setSelectedAspek}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <Filter className="w-3 h-3 mr-1 text-gray-400" />
                          <SelectValue placeholder="Filter Aspek" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Aspek</SelectItem>
                          {aspects.map(aspek => (
                            <SelectItem key={aspek} value={aspek}>
                              {aspek.replace('ASPEK ', '').substring(0, 30)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                        <Button
                          variant={selectedStatus === 'all' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedStatus('all')}
                          className="h-6 px-2 text-xs"
                        >
                          Semua
                        </Button>
                        <Button
                          variant={selectedStatus === 'uploaded' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedStatus('uploaded')}
                          className={`h-6 px-2 text-xs ${selectedStatus === 'uploaded' ? 'bg-green-600' : ''}`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                        <Button
                          variant={selectedStatus === 'not_uploaded' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedStatus('not_uploaded')}
                          className={`h-6 px-2 text-xs ${selectedStatus === 'not_uploaded' ? 'bg-orange-600' : ''}`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Belum
                        </Button>
                      </div>

                      {/* PIC Dropdown dengan Switch dan Search */}
                      <div className="relative" data-pic-dropdown>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsPICDropdownOpen(!isPICDropdownOpen);
                            setPicSearchTerm('');
                          }}
                          className="w-[180px] h-8 text-xs justify-between"
                        >
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="truncate">
                              {selectedPIC === 'all' ? 'Semua PIC' : selectedPIC.substring(0, 18) + (selectedPIC.length > 18 ? '...' : '')}
                            </span>
                          </div>
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>

                        {isPICDropdownOpen && (
                          <div className="absolute z-50 mt-1 w-[280px] bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
                            {/* Type Switch */}
                            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700">Tipe:</span>
                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                  <button
                                    onClick={() => {
                                      setPicFilterType('divisi');
                                      setSelectedPIC('all');
                                    }}
                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                                      picFilterType === 'divisi'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                    }`}
                                  >
                                    Divisi
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPicFilterType('subdirektorat');
                                      setSelectedPIC('all');
                                    }}
                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                                      picFilterType === 'subdirektorat'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                    }`}
                                  >
                                    Subdirektorat
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Search Input */}
                            <div className="sticky top-[44px] bg-white border-b border-gray-200 p-2">
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder={`Cari ${picFilterType === 'divisi' ? 'divisi' : 'subdirektorat'}...`}
                                  value={picSearchTerm}
                                  onChange={(e) => setPicSearchTerm(e.target.value)}
                                  className="h-7 text-xs pr-7"
                                  autoFocus
                                />
                                {picSearchTerm && (
                                  <button
                                    onClick={() => setPicSearchTerm('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Options List */}
                            <div className="max-h-[180px] overflow-y-auto py-1">
                              {/* Semua PIC option */}
                              <button
                                onClick={() => {
                                  setSelectedPIC('all');
                                  setIsPICDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${
                                  selectedPIC === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                Semua PIC
                              </button>

                              {filteredPicOptions.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  {picSearchTerm.trim()
                                    ? `Tidak ada ${picFilterType === 'divisi' ? 'divisi' : 'subdirektorat'} yang cocok`
                                    : `Belum ada ${picFilterType === 'divisi' ? 'divisi' : 'subdirektorat'}`}
                                </div>
                              ) : (
                                filteredPicOptions.map((name) => (
                                  <button
                                    key={name}
                                    onClick={() => {
                                      setSelectedPIC(name);
                                      setIsPICDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${
                                      selectedPIC === name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                    }`}
                                  >
                                    {name}
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500">
                              {picSearchTerm.trim()
                                ? `${filteredPicOptions.length} dari ${picFilterOptions.length}`
                                : `${picFilterOptions.length} ${picFilterType === 'divisi' ? 'divisi' : 'subdirektorat'}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
            <CardContent className="px-0 pb-0">
              <div id="checklist-table" className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-gray-700 font-medium text-xs w-12">No</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs w-32">Aspek</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs">Deskripsi</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs w-36">PIC</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs w-28">Status</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs w-44">File</TableHead>
                      <TableHead className="text-gray-700 font-medium text-xs w-32 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredChecklist.map((item, index) => {
                      const IconComponent = getAspectIcon(item.aspek);
                      const uploadedDocument = getUploadedDocument(item.id);
                      const assignmentData = getAssignmentData(item.id);
                      
                      // Debug logging for assignment data
                      if (assignmentData) {
                        console.log('MonitoringUploadGCG: Assignment data for item', item.id, ':', {
                          divisi: assignmentData.divisi,
                          subdirektorat: assignmentData.subdirektorat,
                          assignmentType: assignmentData.assignmentType,
                          fullData: assignmentData
                        });
                      }
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                          <TableCell className="text-xs text-gray-600 py-2">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs text-gray-600 line-clamp-2" title={item.aspek || 'Dokumen Tanpa Aspek'}>
                              {(item.aspek || 'Tanpa Aspek').replace('ASPEK ', '').substring(0, 20)}
                            </span>
                          </TableCell>
                      <TableCell className="py-2">
                            <div className="text-xs text-gray-900 line-clamp-2" title={item.deskripsi}>
                          {item.deskripsi}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {assignmentData ? (
                          <span className="text-xs text-purple-600 font-medium line-clamp-1" title={assignmentData.divisi || assignmentData.subdirektorat}>
                            {(assignmentData.divisi || assignmentData.subdirektorat).substring(0, 20)}{(assignmentData.divisi || assignmentData.subdirektorat).length > 20 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                            {itemsBeingChecked.has(item.id) ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Checking
                              </span>
                            ) : uploadedDocument ? (
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDownloadDocument(item.id, item.id)}
                                disabled={!isChecklistUploaded(item.id)}
                                title={isChecklistUploaded(item.id) ? 'Download' : 'Belum ada file'}
                              >
                                <Download className={`w-3.5 h-3.5 ${isChecklistUploaded(item.id) ? 'text-green-600' : 'text-gray-300'}`} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUploadClick(item, item.rowNumber || (index + 1))}
                                disabled={itemsBeingChecked.has(item.id)}
                                title={uploadedDocument ? 'Reupload / Ganti File' : 'Upload'}
                              >
                            {uploadedDocument ? (
                              <Replace className={`w-3.5 h-3.5 ${itemsBeingChecked.has(item.id) ? 'text-gray-300' : 'text-blue-600'}`} />
                            ) : (
                              <Upload className={`w-3.5 h-3.5 ${itemsBeingChecked.has(item.id) ? 'text-gray-300' : 'text-orange-600'}`} />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleViewInArchive(item)}
                            disabled={!uploadedDocument}
                            title={uploadedDocument ? "Lihat di Arsip" : "Belum ada file"}
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
                                  handleDeleteDocument(item.id, uploadedDocument.id);
                                }
                              }}
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {filteredChecklist.length === 0 && (
                  <div className="text-center py-8 border-t border-gray-100">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Tidak ada dokumen ditemukan</p>
                    <p className="text-xs text-gray-400">Ubah filter atau pilih tahun lain</p>
                </div>
              )}
                </div>
              </CardContent>
            </Card>
            </>
          ) : (
            <Card className="border-0 shadow-lg bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Pilih Tahun Buku untuk Melihat Monitoring
                        </h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Setelah memilih tahun buku, Anda akan dapat melihat:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900">Statistik Dokumen</h4>
                        <p className="text-sm text-blue-700">Progress upload per aspek GCG</p>
                    </div>
                  </div>
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900">Overview Progress</h4>
                        <p className="text-sm text-blue-700">Ringkasan keseluruhan dokumen</p>
                        </div>
                      </div>
                    <div className="flex items-start space-x-2">
                      <Upload className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                        <h4 className="font-medium text-blue-900">Upload Dokumen</h4>
                        <p className="text-sm text-blue-700">Upload dan kelola file GCG</p>
                            </div>
                          </div>
                          </div>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </div>


      {/* File Upload Dialog */}
      <AdminUploadDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        checklistItem={selectedChecklistItem}
        rowNumber={selectedChecklistItem?.rowNumber}
        isReUpload={false}
        onUploadSuccess={() => {
          // Rescan only the uploaded row instead of all rows
          if (selectedChecklistItem && selectedChecklistItem.rowNumber) {
            setTimeout(() => {
              rescanSingleRow(selectedChecklistItem.id, selectedChecklistItem.rowNumber);
            }, 500); // Shorter delay for single row
          }
          
          // Dispatch custom event for real-time updates without page restart
          console.log('MonitoringUploadGCG: Upload success, rescanning single row:', selectedChecklistItem?.id);
          
          // Force refresh of all contexts with delay
          setTimeout(() => {
            console.log('MonitoringUploadGCG: Dispatching events after upload success');
            
            // Force refresh files from context
            refreshFiles();
            
          window.dispatchEvent(new CustomEvent('fileUploaded', {
            detail: { 
              type: 'fileUploaded', 
              year: selectedYear,
              checklistId: selectedChecklistItem?.id,
              rowNumber: selectedChecklistItem?.rowNumber,
              timestamp: new Date().toISOString()
            }
          }));
          
          window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
            detail: { 
              type: 'uploadedFilesChanged', 
              year: selectedYear,
              checklistId: selectedChecklistItem?.id,
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
          }, 300);
        }}
      />

    </div>
    );
  } catch (error) {
    console.error('❌ Error rendering MonitoringUploadGCG:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Rendering Page</h1>
          <p className="text-gray-600 mb-4">Terjadi kesalahan saat merender halaman Monitoring & Upload Dokumen.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-red-700 font-mono">{error?.toString()}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }
};

export default MonitoringUploadGCG; 