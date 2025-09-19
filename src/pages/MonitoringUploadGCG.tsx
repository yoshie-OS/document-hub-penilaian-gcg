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

import { useToast } from '@/hooks/use-toast';
import { AdminUploadDialog } from '@/components/dialogs';
import { CatatanDialog } from '@/components/dialogs/CatatanDialog';
import { YearSelectorPanel, PageHeaderPanel } from '@/components/panels';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';

import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Upload, 
  Filter,
  Eye,
  TrendingUp,
  RotateCcw,
  Search,
  Download,
  Plus,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const MonitoringUploadGCG = () => {
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

  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPIC, setSelectedPIC] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    id: number;
    aspek: string;
    deskripsi: string;
    rowNumber?: number;
    pic?: string;
  } | null>(null);
  // Force re-render state untuk memastikan data terupdate
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // State untuk CatatanDialog
  const [isCatatanDialogOpen, setIsCatatanDialogOpen] = useState(false);
  
  // State to track actual file existence from Supabase
  const [supabaseFileStatus, setSupabaseFileStatus] = useState<{[key: string]: boolean}>({});
  // State to store file information from Supabase
  const [supabaseFileInfo, setSupabaseFileInfo] = useState<{[key: string]: any}>({});
  // State to track which files are being checked for loading spinners
  const [fileStatusLoading, setFileStatusLoading] = useState<boolean>(false);
  // State to track individual items being checked
  const [itemsBeingChecked, setItemsBeingChecked] = useState<Set<number>>(new Set());
  // State to track batch progress
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  // State to track refresh/rescan progress
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDocumentForCatatan, setSelectedDocumentForCatatan] = useState<{
    catatan?: string;
    title?: string;
    fileName?: string;
  } | null>(null);
  

  // Ensure all years have dokumen GCG data when component mounts
  useEffect(() => {
    ensureAllYearsHaveData();
  }, [ensureAllYearsHaveData]);

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
        }, 1000); // Wait a bit for Supabase to sync
      } else {
        // Fallback: full rescan if no specific details
        setTimeout(() => {
          checkSupabaseFileStatus();
        }, 1000);
      }
      
      // Force re-render using setSelectedYear like admin dashboard
      if (selectedYear) {
        setTimeout(() => {
          setSelectedYear(selectedYear);
        }, 100);
      }
    };

    const handleDocumentsUpdated = () => {
      console.log('MonitoringUploadGCG: Received documentsUpdated event from FileUploadDialog');
      // Force re-render using setSelectedYear like admin dashboard
      if (selectedYear) {
        setTimeout(() => {
          setSelectedYear(selectedYear);
        }, 100);
      }
    };

    const handleUploadedFilesChanged = () => {
      console.log('MonitoringUploadGCG: Received uploadedFilesChanged event from FileUploadDialog');
      // Force re-render using setSelectedYear like admin dashboard
      if (selectedYear) {
        setTimeout(() => {
          setSelectedYear(selectedYear);
        }, 100);
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
    return [...new Set(yearChecklist.map(item => item.aspek))];
  }, [checklist, selectedYear]);

  // Get unique PIC values for filter
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

  // Check if dokumen GCG item is uploaded - now uses Supabase file status
  const isChecklistUploaded = useCallback((checklistId: number) => {
    if (!selectedYear) return false;
    
    // Check Supabase file status first (authoritative)
    const supabaseExists = supabaseFileStatus[checklistId.toString()] || false;
    // Uncomment for detailed debugging:
    // console.log('MonitoringUploadGCG: isChecklistUploaded called for checklistId:', checklistId, 'supabaseExists:', supabaseExists);
    
    if (supabaseExists) {
      return true;
    }
    
    // Fallback to localStorage for backward compatibility
    const yearFiles = getFilesByYear(selectedYear);
    const checklistIdInt = Math.floor(checklistId);
    const localFileExists = yearFiles.some(file => file.checklistId === checklistIdInt);
    // Uncomment for detailed debugging:
    // console.log('MonitoringUploadGCG: localStorage fallback for checklistId:', checklistId, 'localFileExists:', localFileExists);
    
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

  // Function to check file existence from Supabase
  const checkSupabaseFileStatus = useCallback(async () => {
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
              checklistIds: batch.map(item => item.id)  // Use checklist IDs instead of row numbers
            };
            
            const response = await fetch('http://localhost:5000/api/check-gcg-files', {
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
                    id: `supabase_${item.id}`,
                    fileName: fileStatus.fileName,
                    fileSize: fileStatus.size,
                    uploadDate: new Date(fileStatus.lastModified),
                    year: selectedYear,
                    checklistId: item.id,
                    status: 'uploaded',
                    catatan: fileStatus.catatan || '' // Catatan from uploaded-files.xlsx
                  };
                  batchFileInfo[item.id.toString()] = fileInfoObj;
                  newFileInfo[item.id.toString()] = fileInfoObj; // Keep for final state
                }
                
                console.log('MonitoringUploadGCG: Mapped file status - ID:', item.id, 'Row:', item.rowNumber, 'Exists:', fileExists);
              });
              
              // Update state immediately after each batch for progressive loading
              setSupabaseFileStatus(prev => ({...prev, ...batchFileStatus}));
              setSupabaseFileInfo(prev => ({...prev, ...batchFileInfo}));
              
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
            setSupabaseFileStatus(prev => ({...prev, ...batchErrorStatus}));
            
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
      console.log('MonitoringUploadGCG: Updated Supabase file info - Files with info:', Object.keys(newFileInfo).length);
      
    } catch (error) {
      console.error('Error checking Supabase file status:', error);
    } finally {
      // Clear loading and progress states
      setFileStatusLoading(false);
      setBatchProgress(null);
      setItemsBeingChecked(new Set()); // Clear all checking states
    }
  }, [selectedYear, checklist, getAssignmentData, user]);

  // Check Supabase file status when year or checklist changes
  useEffect(() => {
    checkSupabaseFileStatus();
  }, [checkSupabaseFileStatus]);

  // Filter dokumen GCG berdasarkan aspek, status, dan PIC - menggunakan data yang sama dengan DashboardStats
  const filteredChecklist = useMemo(() => {
    if (!selectedYear) return [];
    
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    let filtered = yearChecklist.map(item => ({
      ...item,
      status: isChecklistUploaded(item.id) ? 'uploaded' : 'not_uploaded' as 'uploaded' | 'not_uploaded'
    }));

    if (selectedAspek !== 'all') {
      filtered = filtered.filter(item => item.aspek === selectedAspek);
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
  }, [checklist, selectedAspek, selectedStatus, selectedPIC, selectedYear, debouncedSearchTerm, isChecklistUploaded, getAssignmentData, forceUpdate, supabaseFileStatus, supabaseFileInfo]);

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
      const response = await fetch('http://localhost:5000/api/download-gcg-file', {
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
      
      // 3. Rescan Supabase storage for file changes
      await checkSupabaseFileStatus();
      
      toast({
        title: "Data berhasil diperbarui",
        description: "Daftar dokumen dan storage telah dipindai ulang",
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
  }, [isRefreshing, ensureAllYearsHaveData, refreshFiles, checkSupabaseFileStatus, toast]);

  // Function to rescan a single row after upload
  const rescanSingleRow = useCallback(async (checklistId: number, rowNumber: number) => {
    if (!selectedYear) return;
    
    // Find the specific item
    const item = checklist.find(item => item.id === checklistId);
    if (!item) return;
    
    // Get PIC from checklist item, fallback to current user's subdirektorat
    const picName = item.pic || user?.subdirektorat || 'UNKNOWN_PIC';
    
    console.log('MonitoringUploadGCG: Rescanning single row - ID:', checklistId, 'Row:', rowNumber, 'PIC:', picName);
    
    // Add this item to being checked
    setItemsBeingChecked(prev => new Set(prev.add(checklistId)));
    
    try {
      const requestBody = {
        picName,
        year: selectedYear,
        checklistIds: [checklistId]  // Use checklist ID instead of row number
      };
      
      const response = await fetch('http://localhost:5000/api/check-gcg-files', {
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
        setSupabaseFileStatus(prev => ({...prev, [checklistId.toString()]: fileExists}));
        
        if (fileExists && fileStatus) {
          const fileInfoObj = {
            id: `supabase_${checklistId}`,
            fileName: fileStatus.fileName,
            fileSize: fileStatus.size,
            uploadDate: new Date(fileStatus.lastModified),
            year: selectedYear,
            checklistId: checklistId,
            status: 'uploaded',
            catatan: fileStatus.catatan || ''
          };
          setSupabaseFileInfo(prev => ({...prev, [checklistId.toString()]: fileInfoObj}));
        }
        
        console.log('MonitoringUploadGCG: Single row rescan complete - ID:', checklistId, 'Exists:', fileExists);
      }
    } catch (error) {
      console.error('Error rescanning single row:', error);
      // Set as not uploaded on error
      setSupabaseFileStatus(prev => ({...prev, [checklistId.toString()]: false}));
    } finally {
      // Remove from being checked
      setItemsBeingChecked(prev => {
        const newSet = new Set(prev);
        newSet.delete(checklistId);
        return newSet;
      });
    }
  }, [selectedYear, checklist, getAssignmentData, user]);

  // Handle show catatan
  const handleShowCatatan = useCallback((checklistId: number) => {
    const uploadedDocument = getUploadedDocument(checklistId);
    const checklistItem = checklist.find(item => item.id === checklistId);
    
    console.log('MonitoringUploadGCG: handleShowCatatan called for checklistId:', checklistId);
    console.log('MonitoringUploadGCG: uploadedDocument:', uploadedDocument);
    console.log('MonitoringUploadGCG: catatan value:', uploadedDocument?.catatan);
    console.log('MonitoringUploadGCG: catatan type:', typeof uploadedDocument?.catatan);
    console.log('MonitoringUploadGCG: catatan length:', uploadedDocument?.catatan?.length);
    
    // Debug: Check localStorage directly
    const localStorageFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const localFile = localStorageFiles.find((f: any) => f.checklistId === checklistId);
    console.log('MonitoringUploadGCG: localStorage file:', localFile);
    console.log('MonitoringUploadGCG: localStorage catatan:', localFile?.catatan);
    
    if (uploadedDocument) {
      setSelectedDocumentForCatatan({
        catatan: uploadedDocument.catatan,
        title: checklistItem?.deskripsi,
        fileName: uploadedDocument.fileName
      });
      setIsCatatanDialogOpen(true);
    }
  }, [getUploadedDocument, checklist]);

  // Get aspect icon - konsisten dengan dashboard
  const getAspectIcon = useCallback((aspekName: string) => {
    if (aspekName === 'KESELURUHAN') return TrendingUp;
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
      progress
    };
  }, [selectedYear, checklist, isChecklistUploaded, supabaseFileStatus]);

  // Get aspect statistics for year book
  const getAspectStats = useMemo(() => {
    if (!selectedYear) return [];

    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    const yearDocuments = getDocumentsByYear(selectedYear);

    // Get unique aspects
    const uniqueAspects = Array.from(new Set(yearChecklist.map(item => item.aspek)));

    return uniqueAspects.map(aspek => {
      const aspectItems = yearChecklist.filter(item => item.aspek === aspek);
      const totalItems = aspectItems.length;
      const uploadedCount = aspectItems.filter(item => isChecklistUploaded(item.id)).length;
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

      return {
        aspek,
        totalItems,
        uploadedCount,
        progress
      };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
  }, [selectedYear, checklist, getDocumentsByYear, isChecklistUploaded, supabaseFileStatus]);

  // Handle upload button click
  const handleUploadClick = useCallback((item: { id: number; aspek: string; deskripsi: string; rowNumber?: number; pic?: string }, rowNumber: number) => {
    setSelectedChecklistItem({ ...item, rowNumber: item.rowNumber || rowNumber });
    setIsUploadDialogOpen(true);
  }, []);

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
            title="Monitoring & Upload GCG"
                          subtitle="Monitoring dan pengelolaan dokumen GCG berdasarkan tahun buku"
            badge={{ 
              text: selectedYear ? selectedYear.toString() : 'Belum dipilih', 
              variant: selectedYear ? "default" : "secondary" 
            }}
            actions={[
              {
                label: "Upload Dokumen",
                onClick: () => setIsUploadDialogOpen(true),
                icon: <Upload className="w-4 h-4" />
              }
            ]}
          />

          {/* Enhanced Year Selection */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={years}
            title="Tahun Buku"
                            description="Pilih tahun buku untuk melihat dokumen GCG"
          />

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
          {selectedYear ? (
            <>
                              {/* Statistik Tahun Buku */}
                  <YearStatisticsPanel 
                    selectedYear={selectedYear}
                    aspectStats={getAspectStats}
                    overallProgress={getOverallProgress}
                    getAspectIcon={getAspectIcon}
                    getAspectColor={getAspectColor}
                    onAspectClick={(aspectName) => setSelectedAspek(aspectName)}
                    isSidebarOpen={isSidebarOpen}
                    title="Statistik Tahun Buku"
                    description={`Overview dokumen dan assessment dokumen GCG tahun ${selectedYear}`}
                    showOverallProgress={true}
                  />

              {/* Breakdown Penugasan Subdirektorat */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Breakdown Penugasan Subdirektorat</CardTitle>
                  <CardDescription>
                    Ringkasan jumlah dokumen GCG yang ditugaskan dan selesai per subdirektorat pada tahun {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 text-center py-8">
                    Fitur penugasan dokumen GCG telah dipindahkan ke menu "Pengaturan Baru" → "Kelola Dokumen"
                          </div>
                </CardContent>
              </Card>

              {/* Daftar Dokumen GCG */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-indigo-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-indigo-900">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span>Daftar Dokumen GCG - Tahun {selectedYear}</span>
                      </CardTitle>
                      <CardDescription className="text-indigo-700 mt-2">
                        {searchTerm ? (
                          <span>
                            <span className="font-semibold text-indigo-600">{filteredChecklist.length}</span> item ditemukan untuk pencarian "{searchTerm}"
                          </span>
                        ) : (
                          <span>
                            <span className="font-semibold text-indigo-600">{filteredChecklist.length}</span> item ditemukan
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>

              {/* All Filters Integrated */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                    <Search className="w-4 h-4 mr-2 text-blue-600" />
                    Pencarian Dokumen
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Cari berdasarkan deskripsi dokumen GCG..."
                      className="pl-10 pr-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Aspek Filter */}
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                      <Filter className="w-4 h-4 mr-2 text-orange-600" />
                      Filter Aspek
                    </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedAspek === 'all' ? "default" : "outline"}
                      onClick={() => setSelectedAspek('all')}
                      size="sm"
                        className={selectedAspek === 'all' 
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                          : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                        }
                    >
                      Semua Aspek
                    </Button>
                      {aspects.map(aspek => {
                        const IconComponent = getAspectIcon(aspek);
                        return (
                      <Button
                        key={aspek}
                        variant={selectedAspek === aspek ? "default" : "outline"}
                        onClick={() => setSelectedAspek(aspek)}
                        size="sm"
                            className={`text-xs flex items-center space-x-2 ${
                              selectedAspek === aspek 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <IconComponent className={`w-3 h-3 ${selectedAspek === aspek ? 'text-white' : 'text-gray-600'}`} />
                            <span>{aspek.replace('ASPEK ', '').replace('. ', ' - ')}</span>
                      </Button>
                        );
                      })}
                  </div>
                </div>

                  {/* Status Filter */}
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                      Filter Status
                    </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedStatus === 'all' ? "default" : "outline"}
                      onClick={() => setSelectedStatus('all')}
                      size="sm"
                        className={selectedStatus === 'all' 
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                          : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                        }
                    >
                      Semua Status
                    </Button>
                    <Button
                      variant={selectedStatus === 'uploaded' ? "default" : "outline"}
                      onClick={() => setSelectedStatus('uploaded')}
                      size="sm"
                        className={selectedStatus === 'uploaded' 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                        }
                    >
                        <CheckCircle className="w-3 h-3 mr-1" />
                      Sudah Upload
                    </Button>
                    <Button
                      variant={selectedStatus === 'not_uploaded' ? "default" : "outline"}
                      onClick={() => setSelectedStatus('not_uploaded')}
                      size="sm"
                        className={selectedStatus === 'not_uploaded' 
                              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                        }
                    >
                        <Clock className="w-3 h-3 mr-1" />
                      Belum Upload
                    </Button>
                  </div>
                </div>

                  {/* PIC Filter */}
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                      <User className="w-4 h-4 mr-2 text-green-600" />
                      Filter PIC
                    </label>
                    <Select value={selectedPIC} onValueChange={setSelectedPIC}>
                      <SelectTrigger className="w-full border-green-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Pilih PIC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua PIC</SelectItem>
                        {picValues.map((pic: string) => (
                          <SelectItem key={pic} value={pic}>
                            {pic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                      {/* Reset Filter */}
                      <div className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedAspek('all');
                      setSelectedStatus('all');
                      setSelectedPIC('all');
                      setSearchTerm('');
                    }}
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                          <RotateCcw className="w-4 h-4 mr-1" />
                    Reset Filter
                  </Button>
                </div>

                      {/* Refresh/Rescan Button */}
                      <div className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshRescan}
                    disabled={isRefreshing || fileStatusLoading}
                          size="sm"
                          className={`${
                            isRefreshing || fileStatusLoading
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Muat ulang daftar dokumen dan pindai ulang storage"
                  >
                          {isRefreshing ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-1" />
                          )}
                    {isRefreshing ? 'Memuat...' : 'Rescan'}
                  </Button>
                </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div id="checklist-table" className="overflow-hidden rounded-lg border border-indigo-100">
              <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                      <TableHead className="text-indigo-900 font-semibold">No</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">Deskripsi Dokumen GCG</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">PIC</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">Status</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">File</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">Aksi</TableHead>
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
                        <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                          <TableCell className="font-medium text-gray-700">
                            {index + 1}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 rounded-md bg-gray-100">
                                <IconComponent className="w-3 h-3 text-gray-600" />
                              </div>
                              <span className="text-xs text-gray-600 truncate">
                                {item.aspek}
                              </span>
                            </div>
                          </TableCell>
                      <TableCell className="max-w-md">
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed" title={item.deskripsi}>
                          {item.deskripsi}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {assignmentData ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 rounded-md bg-green-100">
                                <User className="w-3 h-3 text-green-600" />
                              </div>
                              <span className="text-xs font-medium text-green-700">
                                {assignmentData.divisi || assignmentData.subdirektorat}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Assigned: {new Date(assignmentData.assignedAt).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-md bg-gray-100">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-500 italic">
                              Belum di-assign
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                            {itemsBeingChecked.has(item.id) ? (
                              <span className="flex items-center text-blue-500 text-sm font-medium">
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                {batchProgress ? `Checking... (${batchProgress.current}/${batchProgress.total})` : 'Checking...'}
                              </span>
                            ) : item.status === 'uploaded' ? (
                              <span className="flex items-center text-green-600 text-sm font-medium">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Sudah Upload
                              </span>
                            ) : (
                              <span className="flex items-center text-gray-400 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                Belum Upload
                              </span>
                            )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {uploadedDocument ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span 
                                className="text-sm font-medium text-gray-900 truncate block max-w-[200px]" 
                                title={uploadedDocument.fileName}
                              >
                                {uploadedDocument.fileName}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(uploadedDocument.uploadDate).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Belum ada file
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">

                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadDocument(item.id, item.id)}
                                disabled={!isChecklistUploaded(item.id)}
                                className={`${
                                  isChecklistUploaded(item.id)
                                    ? 'border-green-200 text-green-600 hover:bg-green-50'
                                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                title={
                                  isChecklistUploaded(item.id)
                                    ? 'Download dokumen'
                                    : 'Dokumen belum diupload'
                                }
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              {/* Tombol Catatan - hanya muncul jika dokumen sudah diupload */}
                              {isChecklistUploaded(item.id) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleShowCatatan(item.id)}
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  title="Lihat catatan dokumen"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUploadClick(item, item.rowNumber || (index + 1))}
                                disabled={itemsBeingChecked.has(item.id)}
                                className={`${
                                  itemsBeingChecked.has(item.id) 
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                }`}
                                title={
                                  itemsBeingChecked.has(item.id) 
                                    ? "Menunggu pemeriksaan file selesai..." 
                                    : "Upload dokumen baru"
                                }
                              >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {filteredChecklist.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50">
                    <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Tidak ada item yang ditemukan
                    </h3>
                    <p className="text-gray-500">
                      Coba ubah filter atau pilih tahun yang berbeda
                    </p>
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

      {/* Catatan Dialog */}
      <CatatanDialog
        isOpen={isCatatanDialogOpen}
        onClose={() => setIsCatatanDialogOpen(false)}
        catatan={selectedDocumentForCatatan?.catatan}
        documentTitle={selectedDocumentForCatatan?.title}
        fileName={selectedDocumentForCatatan?.fileName}
      />

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
};

export default MonitoringUploadGCG; 