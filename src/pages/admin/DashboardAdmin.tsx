import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useUser } from '@/contexts/UserContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { PageHeaderPanel } from '@/components/panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock,
  Eye,
  Search
} from 'lucide-react';
import FileUploadDialog from '@/components/dashboard/FileUploadDialog';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';


interface ChecklistAssignment {
  id: number;
  checklistId: number;
  subdirektorat: string;
  aspek: string;
  deskripsi: string;
  tahun: number;
  assignedBy: string;
  assignedAt: Date;
  status: 'assigned' | 'in_progress' | 'completed';
  notes?: string;
}

const DashboardAdmin = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { user } = useUser();
  const { checklist } = useChecklist();
  const { getFilesByYear, refreshFiles } = useFileUpload();
  const { documents, getDocumentsByYear: getDocumentsByYearFromContext, refreshDocuments } = useDocumentMetadata();
  const [searchParams] = useSearchParams();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Search and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('namaFile');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [checklistSearchQuery, setChecklistSearchQuery] = useState('');
  const [checklistSortField, setChecklistSortField] = useState<string>('aspek');
  const [checklistSortDirection, setChecklistSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get user's sub-direktorat and other info
  const userSubDirektorat = user?.subdirektorat || 'Sub Direktorat Keuangan';
  const userDirektorat = user?.direktorat || 'Direktorat Keuangan';
  const userDivisi = user?.divisi || 'Divisi Akuntansi';

  // Get URL parameters
  const filterYear = searchParams.get('year');

  // Set initial year if provided
  useEffect(() => {
    if (filterYear && parseInt(filterYear) !== selectedYear) {
      setSelectedYear(parseInt(filterYear));
    }
  }, [filterYear, selectedYear, setSelectedYear]);

  // Get assigned checklists for this user's subdirektorat
  const getAssignedChecklists = useCallback(() => {
    try {
      const assignments = localStorage.getItem('checklistAssignments');
      if (!assignments) {
        console.log('No checklistAssignments found in localStorage');
        return [];
      }
      
      const assignmentsList = JSON.parse(assignments) as ChecklistAssignment[];
      console.log('All assignments:', assignmentsList);
      
      const filtered = assignmentsList.filter(
        assignment => 
          assignment.subdirektorat === userSubDirektorat && 
          assignment.tahun === selectedYear
      );
      
      console.log('Filtered assignments for', userSubDirektorat, 'year', selectedYear, ':', filtered);
      
      // If no assignments found, create default assignments based on checklist data
      if (filtered.length === 0 && selectedYear) {
        const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
        const defaultAssignments = yearChecklist.map(item => ({
          id: Date.now() + Math.random(),
          checklistId: item.id,
          subdirektorat: userSubDirektorat,
          aspek: item.aspek,
          deskripsi: item.deskripsi,
          tahun: selectedYear,
          assignedBy: 'System',
          assignedAt: new Date(),
          status: 'assigned' as const
        }));
        
        console.log('Created default assignments:', defaultAssignments);
        return defaultAssignments;
      }
      
      return filtered;
    } catch (error) {
      console.error('Error getting assigned checklists:', error);
      return [];
    }
  }, [selectedYear, userSubDirektorat, checklist]);

  // Get user documents for selected year and sub-direktorat
  const getUserDocuments = useCallback(() => {
    try {
      // Get documents from both localStorage and FileUploadContext
      const documents = localStorage.getItem('documentMetadata'); // Fixed: use correct key
      const uploadedFiles = localStorage.getItem('uploadedFiles');
      
      let allDocuments: any[] = [];
      
      // Add documents from localStorage (DocumentMetadataContext)
      if (documents) {
        const documentsList = JSON.parse(documents);
        const mappedDocuments = documentsList
          .filter((doc: any) => doc.year === selectedYear)
          .map((doc: any) => ({
            id: doc.id,
            namaFile: doc.fileName,
            aspek: doc.aspect || doc.documentCategory || 'GCG',
            subdirektorat: doc.subdirektorat,
            tahun: doc.year,
            uploadDate: doc.uploadDate,
            checklistId: doc.checklistId,
            status: 'uploaded'
          }));
        allDocuments = [...allDocuments, ...mappedDocuments];
      }
      
      // Add uploaded files from FileUploadContext
      if (uploadedFiles) {
        const filesList = JSON.parse(uploadedFiles);
        const fileDocuments = filesList
          .filter((file: any) => file.year === selectedYear)
          .map((file: any) => ({
            id: file.id,
            namaFile: file.fileName,
            aspek: file.aspect || 'GCG',
            subdirektorat: userSubDirektorat, // Admin documents are for their subdirektorat
            tahun: file.year,
            uploadDate: file.uploadDate,
            checklistId: file.checklistId,
            status: 'uploaded'
          }));
        allDocuments = [...allDocuments, ...fileDocuments];
      }
      
      console.log('All documents (documentMetadata + uploadedFiles):', allDocuments);
      
      // Filter by year and subdirektorat
      const filtered = allDocuments.filter((doc: any) => 
        doc.tahun === selectedYear && doc.subdirektorat === userSubDirektorat
      );
      
      console.log('Filtered documents for', userSubDirektorat, 'year', selectedYear, ':', filtered);
      return filtered;
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }, [selectedYear, userSubDirektorat]);

  // Get all documents for a specific year (for previous years view)
  const getAllDocumentsForYear = useCallback((year: number) => {
    try {
      const documents = localStorage.getItem('documentMetadata'); // Fixed: use correct key
      if (!documents) {
        console.log('No documents found in localStorage');
        return [];
      }
      const documentsList = JSON.parse(documents);
      
      const filtered = documentsList.filter((doc: any) => doc.year === year);
      console.log('All documents for year', year, ':', filtered);
      return filtered;
    } catch (error) {
      console.error('Error getting all documents for year:', error);
      return [];
    }
  }, []);

  // Check if selected year is the current/latest year
  const isCurrentYear = selectedYear === Math.max(...availableYears);

  // Sorting and filtering functions
  const sortData = (data: any[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // Handle date fields
      if (field === 'uploadDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filterData = (data: any[], query: string, fields: string[]) => {
    if (!query.trim()) return data;
    
    return data.filter(item => 
      fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query.toLowerCase());
        }
        return false;
      })
    );
  };

  // Get user documents with memoization and force update (moved up)
  const userDocuments = useMemo(() => {
    const docs = getUserDocuments();
    console.log('UserDocuments updated:', docs.length, 'documents for', userSubDirektorat, 'year', selectedYear);
    return docs;
  }, [selectedYear, userSubDirektorat, forceUpdate]);

  // Get assigned checklists for table display (moved up)
  const getAssignedChecklistsForTable = useMemo(() => {
    if (!selectedYear) return [];

    const assigned = getAssignedChecklists();
    console.log('Assigned checklists for table:', assigned);

    return assigned.map(assignment => {
      const checklistItem = checklist.find(c => c.id === assignment.checklistId);
      const hasDocument = userDocuments.some(doc => 
        doc.checklistId === assignment.checklistId
      );
      const uploadedDocument = userDocuments.find(doc => 
        doc.checklistId === assignment.checklistId
      );

      const result = {
        ...assignment,
        checklistItem,
        status: hasDocument ? 'uploaded' : 'not_uploaded' as 'uploaded' | 'not_uploaded',
        uploadedDocument
      };
      
      console.log('Mapped checklist item:', result);
      return result;
    });
  }, [selectedYear, checklist, userDocuments, userSubDirektorat, forceUpdate]);

  // Get filtered and sorted documents for current year
  const getFilteredUserDocuments = useCallback(() => {
    const filtered = filterData(userDocuments, searchQuery, ['namaFile', 'aspek', 'subdirektorat']);
    return sortData(filtered, sortField, sortDirection);
  }, [userDocuments, searchQuery, sortField, sortDirection]);

  // Get filtered and sorted documents for previous years
  const getFilteredAllDocuments = useCallback(() => {
    const allDocs = getAllDocumentsForYear(selectedYear);
    const filtered = filterData(allDocs, searchQuery, ['namaFile', 'aspek', 'subdirektorat']);
    return sortData(filtered, sortField, sortDirection);
  }, [getAllDocumentsForYear, selectedYear, searchQuery, sortField, sortDirection]);

  // Get filtered and sorted checklist items
  const getFilteredChecklistItems = useCallback(() => {
    const filtered = filterData(getAssignedChecklistsForTable, checklistSearchQuery, ['aspek', 'deskripsi']);
    return sortData(filtered, checklistSortField, checklistSortDirection);
  }, [getAssignedChecklistsForTable, checklistSearchQuery, checklistSortField, checklistSortDirection]);

  // Mock data for testing
  const generateMockData = () => {
    const mockChecklistAssignments = [
      {
        id: 1,
        checklistId: 1,
        subdirektorat: userSubDirektorat,
        aspek: "Aspek 1 - Komitmen",
        deskripsi: "Implementasi kebijakan GCG dan komitmen manajemen",
        tahun: selectedYear,
        assignedBy: "Super Admin",
        assignedAt: new Date(),
        status: "assigned",
        notes: "Prioritas tinggi"
      },
      {
        id: 2,
        checklistId: 2,
        subdirektorat: userSubDirektorat,
        aspek: "Aspek 2 - Implementasi",
        deskripsi: "Pelaksanaan program GCG dan monitoring kinerja",
        tahun: selectedYear,
        assignedBy: "Super Admin",
        assignedAt: new Date(),
        status: "assigned",
        notes: "Deadline akhir bulan"
      },
      {
        id: 3,
        checklistId: 3,
        subdirektorat: userSubDirektorat,
        aspek: "Aspek 3 - Monitoring",
        deskripsi: "Evaluasi efektivitas implementasi GCG",
        tahun: selectedYear,
        assignedBy: "Super Admin",
        assignedAt: new Date(),
        status: "assigned",
        notes: "Laporan bulanan"
      },
      {
        id: 4,
        checklistId: 4,
        subdirektorat: userSubDirektorat,
        aspek: "Aspek 4 - Evaluasi",
        deskripsi: "Assesment risiko dan kepatuhan GCG",
        tahun: selectedYear,
        assignedBy: "Super Admin",
        assignedAt: new Date(),
        status: "assigned",
        notes: "Review triwulan"
      },
      {
        id: 5,
        checklistId: 5,
        subdirektorat: userSubDirektorat,
        aspek: "Aspek 5 - Pelaporan",
        deskripsi: "Penyusunan laporan GCG dan disclosure",
        tahun: selectedYear,
        assignedBy: "Super Admin",
        assignedAt: new Date(),
        status: "assigned",
        notes: "Laporan tahunan"
      }
    ];

    const mockDocuments = [
      {
        id: 1,
        checklistId: 1,
        subdirektorat: userSubDirektorat,
        direktorat: userDirektorat,
        divisi: userDivisi,
        tahun: selectedYear,
        namaFile: "Kebijakan_GCG_2024.pdf",
        uploadDate: new Date(),
        fileSize: 2048,
        fileType: "application/pdf",
        aspek: "Aspek 1 - Komitmen"
      },
      {
        id: 2,
        checklistId: 2,
        subdirektorat: userSubDirektorat,
        direktorat: userDirektorat,
        divisi: userDivisi,
        tahun: selectedYear,
        namaFile: "Program_Implementasi_GCG_2024.pdf",
        uploadDate: new Date(Date.now() - 86400000),
        fileSize: 1536,
        fileType: "application/pdf",
        aspek: "Aspek 2 - Implementasi"
      },
      {
        id: 3,
        checklistId: 3,
        subdirektorat: userSubDirektorat,
        direktorat: userDirektorat,
        divisi: userDivisi,
        tahun: selectedYear,
        namaFile: "Monitoring_GCG_Jan_2024.pdf",
        uploadDate: new Date(Date.now() - 172800000),
        fileSize: 1024,
        fileType: "application/pdf",
        aspek: "Aspek 3 - Monitoring"
      }
    ];

    // Generate mock data for previous years
    const previousYearsData = [];
    const availableYearsList = availableYears.filter(year => year < selectedYear);
    
    availableYearsList.forEach(year => {
      const yearDocuments = [];
      const subDirektorats = [
        "Sub Direktorat Keuangan",
        "Sub Direktorat Operasional", 
        "Sub Direktorat SDM",
        "Sub Direktorat Teknologi",
        "Sub Direktorat Pemasaran"
      ];
      
      // Generate 8-15 documents per year
      const numDocs = Math.floor(Math.random() * 8) + 8;
      
      for (let i = 1; i <= numDocs; i++) {
        const randomSubDir = subDirektorats[Math.floor(Math.random() * subDirektorats.length)];
        const randomAspek = [
          "Aspek 1 - Komitmen",
          "Aspek 2 - Implementasi", 
          "Aspek 3 - Monitoring",
          "Aspek 4 - Evaluasi",
          "Aspek 5 - Pelaporan"
        ][Math.floor(Math.random() * 5)];
        
        yearDocuments.push({
          id: `${year}_${i}`,
          checklistId: i,
          subdirektorat: randomSubDir,
          direktorat: "Direktorat Umum",
          divisi: "Divisi Umum",
          tahun: year,
          namaFile: `Dokumen_${randomAspek.split(' ')[1]}_${year}_${i}.pdf`,
          uploadDate: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          fileSize: Math.floor(Math.random() * 2048) + 512,
          fileType: "application/pdf",
          aspek: randomAspek
        });
      }
      
      previousYearsData.push(...yearDocuments);
    });

    // Add mock data to localStorage
    localStorage.setItem('checklistAssignments', JSON.stringify(mockChecklistAssignments));
    localStorage.setItem('documents', JSON.stringify([...mockDocuments, ...previousYearsData]));
    
    // Refresh the component
    setForceUpdate(prev => prev + 1);
  };

  // Clear mock data
  const clearMockData = () => {
    localStorage.removeItem('checklistAssignments');
    localStorage.removeItem('documents');
    setForceUpdate(prev => prev + 1);
  };

  // userDocuments sudah dipindah ke atas untuk menghindari error initialization

  // Manual refresh function for statistics
  const refreshStatistics = useCallback(async () => {
    console.log('Manual refresh triggered');
    
    // Show loading state
    setForceUpdate(prev => prev + 1);
    
    // Refresh context data first
    try {
      await Promise.all([
        refreshFiles(),
        refreshDocuments()
      ]);
      console.log('Manual refresh: Context data refreshed successfully');
    } catch (error) {
      console.error('Manual refresh: Error refreshing context data:', error);
    }
    
    // Force multiple updates to ensure all data is processed
    setForceUpdate(prev => prev + 1);
    
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 200);
    
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 500);
  }, [refreshFiles, refreshDocuments]);

  // Enhanced data update handler
  const handleDataUpdate = useCallback(async () => {
    console.log('Enhanced data update triggered');
    
    // Refresh data from contexts first
    try {
      await Promise.all([
        refreshFiles(),
        refreshDocuments()
      ]);
      console.log('Context data refreshed successfully in handleDataUpdate');
    } catch (error) {
      console.error('Error refreshing context data in handleDataUpdate:', error);
    }
    
    // Force immediate re-render
    setForceUpdate(prev => prev + 1);
    
    // Also trigger a delayed update to ensure all data is processed
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);
    
    // Additional update after 500ms to ensure all data is loaded
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 500);
  }, [refreshFiles, refreshDocuments]);

  // Specific handler for file uploads
  const handleFileUploadSuccess = useCallback(async () => {
    console.log('File upload success detected, updating statistics');
    
    // Refresh data from contexts first
    try {
      await Promise.all([
        refreshFiles(),
        refreshDocuments()
      ]);
      console.log('Context data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing context data:', error);
    }
    
    // Force immediate update
    setForceUpdate(prev => prev + 1);
    
    // Additional updates to ensure all data is processed
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 200);
    
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 500);
    
    // Final update after 1 second to ensure all data is loaded
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);
  }, [refreshFiles, refreshDocuments]);

  // Listen for data updates
  useEffect(() => {
    const handleDataUpdateEvent = () => {
      console.log('Data update event triggered, forcing re-render');
      handleDataUpdate();
    };

    const handleFileUpload = () => {
      console.log('File upload event triggered, forcing re-render');
      handleFileUploadSuccess();
    };

    const handleAssignmentUpdate = () => {
      console.log('Assignment update event triggered, forcing re-render');
      handleDataUpdate();
    };

    // Listen to all relevant events
    window.addEventListener('assignmentsUpdated', handleAssignmentUpdate);
    window.addEventListener('documentsUpdated', handleDataUpdateEvent);
    window.addEventListener('fileUploaded', handleFileUpload);
    window.addEventListener('checklistUpdated', handleDataUpdateEvent);
    window.addEventListener('userDataUpdated', handleDataUpdateEvent);
    
    // Listen to additional events for better synchronization
    window.addEventListener('uploadedFilesChanged', handleDataUpdateEvent);
    window.addEventListener('checklistAssignmentsChanged', handleDataUpdateEvent);

    // Also listen to storage changes for real-time updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'checklistAssignments' || e.key === 'documentMetadata' || e.key === 'checklist' || e.key === 'uploadedFiles') {
        console.log('Storage change detected:', e.key, 'forcing re-render');
        handleDataUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('assignmentsUpdated', handleAssignmentUpdate);
      window.removeEventListener('documentsUpdated', handleDataUpdateEvent);
      window.removeEventListener('fileUploaded', handleFileUpload);
      window.removeEventListener('checklistUpdated', handleDataUpdateEvent);
      window.removeEventListener('userDataUpdated', handleDataUpdateEvent);
      window.removeEventListener('uploadedFilesChanged', handleDataUpdateEvent);
      window.removeEventListener('checklistAssignmentsChanged', handleDataUpdateEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleDataUpdate, handleFileUploadSuccess]);

  // Force update when user data changes
  useEffect(() => {
    if (user && userSubDirektorat) {
      console.log('User data changed, forcing re-render');
      setForceUpdate(prev => prev + 1);
    }
  }, [user, userSubDirektorat]);

  // Force update when year changes
  useEffect(() => {
    if (selectedYear) {
      console.log('Year changed to', selectedYear, 'forcing re-render');
      setForceUpdate(prev => prev + 1);
    }
  }, [selectedYear]);

  // Periodic refresh for real-time updates (every 3 seconds for better responsiveness)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check if there are any changes in localStorage
      const currentAssignments = localStorage.getItem('checklistAssignments');
      const currentDocuments = localStorage.getItem('documentMetadata'); // Fixed: use correct key
      const currentFiles = localStorage.getItem('uploadedFiles');
      
      // Compare with previous values and update if changed
      if (currentAssignments !== localStorage.getItem('checklistAssignments_prev') ||
          currentDocuments !== localStorage.getItem('documentMetadata_prev') ||
          currentFiles !== localStorage.getItem('uploadedFiles_prev')) {
        
        console.log('Periodic check detected changes, updating statistics');
        
        // Refresh context data first
        try {
          await Promise.all([
            refreshFiles(),
            refreshDocuments()
          ]);
          console.log('Periodic refresh: Context data refreshed successfully');
        } catch (error) {
          console.error('Periodic refresh: Error refreshing context data:', error);
        }
        
        // Force update
        setForceUpdate(prev => prev + 1);
        
        // Store current values for next comparison
        localStorage.setItem('checklistAssignments_prev', currentAssignments || '');
        localStorage.setItem('documentMetadata_prev', currentDocuments || '');
        localStorage.setItem('uploadedFiles_prev', currentFiles || '');
      }
    }, 3000); // Check every 3 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [refreshFiles, refreshDocuments]);

  // Debug: Log data for troubleshooting
  useEffect(() => {
    if (selectedYear && userSubDirektorat) {
      console.log('Admin Dashboard Debug:', {
        selectedYear,
        userSubDirektorat,
        assignments: getAssignedChecklists(),
        documents: getUserDocuments(),
        allAssignments: localStorage.getItem('checklistAssignments'),
        allDocuments: localStorage.getItem('documentMetadata'), // Fixed: use correct key
        checklist: checklist.filter(item => item.tahun === selectedYear),
        forceUpdate
      });
    }
  }, [selectedYear, userSubDirektorat, forceUpdate, checklist]);

  // Calculate progress statistics
  const progressStats = useMemo(() => {
    const assigned = getAssignedChecklists();
    
    // Group by aspect
    const aspectStats: { [key: string]: { total: number; completed: number; documents: any[] } } = {};
    
    assigned.forEach(assignment => {
      if (!aspectStats[assignment.aspek]) {
        aspectStats[assignment.aspek] = { total: 0, completed: 0, documents: [] };
      }
      aspectStats[assignment.aspek].total++;
      
      // Check if document exists for this checklist
      const hasDocument = userDocuments.some(doc => 
        doc.checklistId === assignment.checklistId
      );
      if (hasDocument) {
        aspectStats[assignment.aspek].completed++;
      }
    });

    // Calculate overall progress
    const totalAssigned = assigned.length;
    const totalCompleted = userDocuments.length;
    const overallProgress = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

    return {
      overallProgress,
      totalAssigned,
      totalCompleted,
      aspectStats
    };
  }, [userDocuments, forceUpdate, selectedYear, userSubDirektorat]);

          // Helper: status upload per dokumen GCG (berdasarkan semua dokumen tahun ini)
  const isChecklistUploaded = React.useCallback((checklistId: number) => {
    const yearFiles = getFilesByYear(selectedYear);
    return yearFiles.some(file => file.checklistId === checklistId);
  }, [getFilesByYear, selectedYear, forceUpdate]);

  const getUploadedDocumentByYear = React.useCallback((checklistId: number) => {
    const yearFiles = getFilesByYear(selectedYear);
    return yearFiles.find(file => file.checklistId === checklistId);
  }, [getFilesByYear, selectedYear, forceUpdate]);

  // Get overall progress for admin (based on assigned checklists)
  const getOverallProgress = useMemo(() => {
    if (!selectedYear) return null;

    const assigned = getAssignedChecklists();
    const totalItems = assigned.length;
    const uploadedCount = userDocuments.length;
    const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;

    console.log('Overall progress calculation:', { 
      totalItems, 
      uploadedCount, 
      progress, 
      userSubDirektorat, 
      selectedYear,
      forceUpdate 
    });

    return {
      aspek: 'KESELURUHAN',
      totalItems,
      uploadedCount,
      progress
    };
  }, [selectedYear, userDocuments, forceUpdate, userSubDirektorat]);

  // Get aspect statistics for admin (showing all aspects like super admin)
  const getAspectStats = useMemo(() => {
    if (!selectedYear) return [];

    // Get all aspects from checklist data (like super admin)
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    console.log('Year checklist for', selectedYear, ':', yearChecklist);
    
    const allAspects = [...new Set(yearChecklist.map(item => item.aspek))];
    console.log('All aspects:', allAspects);
    
    // Group assigned checklists by aspect
    const aspectGroups: { [key: string]: any[] } = {};
    const assigned = getAssignedChecklists();
    assigned.forEach(assignment => {
      if (!aspectGroups[assignment.aspek]) {
        aspectGroups[assignment.aspek] = [];
      }
      aspectGroups[assignment.aspek].push(assignment);
    });

    console.log('Aspect groups:', aspectGroups);

    // Return all aspects with their progress (including unassigned aspects)
    return allAspects.map(aspek => {
      const assignments = aspectGroups[aspek] || [];
      const totalItems = assignments.length;
      const uploadedCount = assignments.filter(assignment => 
        userDocuments.some(doc => doc.checklistId === assignment.checklistId)
      ).length;
      const progress = totalItems > 0 ? Math.round((uploadedCount / totalItems) * 100) : 0;
      
      console.log(`Aspect ${aspek} progress:`, { totalItems, uploadedCount, progress });
      
      return {
        aspek,
        totalItems,
        uploadedCount,
        progress,
        isAssigned: totalItems > 0
      };
    });
  }, [selectedYear, checklist, userDocuments, forceUpdate, userSubDirektorat]);

  // getAssignedChecklistsForTable sudah dipindah ke atas untuk menghindari error initialization

  // Get aspect colors - Sinkronkan dengan super admin
  const getAspectColor = (aspect: string, progress: number = 0) => {
    const colors: { [key: string]: string } = {
      'Aspek 1 - Komitmen': 'bg-red-500',
      'Aspek 2 - Implementasi': 'bg-blue-500',
      'Aspek 3 - Monitoring': 'bg-green-500',
      'Aspek 4 - Evaluasi': 'bg-yellow-500',
      'Aspek 5 - Pelaporan': 'bg-purple-500'
    };
    
    // Fallback color berdasarkan progress (seperti super admin)
    if (colors[aspect]) return colors[aspect];
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get aspect icons
  const getAspectIcon = (aspect: string) => {
    const icons: { [key: string]: any } = {
      'Aspek 1 - Komitmen': CheckCircle,
      'Aspek 2 - Implementasi': Clock,
      'Aspek 3 - Monitoring': CheckCircle,
      'Aspek 4 - Evaluasi': CheckCircle,
      'Aspek 5 - Pelaporan': FileText
    };
    return icons[aspect] || CheckCircle;
  };

  const handleUploadDocument = (checklist: any) => {
    setSelectedChecklist(checklist);
    setIsUploadDialogOpen(true);
  };

  const handleDownloadDocument = (document: any) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['Document content'], { type: 'application/pdf' }));
    link.download = document.namaFile;
    link.click();
  };

  const handleViewDocument = (checklistId: number) => {
    const uploadedDocument = userDocuments.find(doc => doc.checklistId === checklistId);
    if (uploadedDocument) {
      // For admin, just show a message or could navigate to document view
      console.log('View document:', uploadedDocument);
    }
  };

  return (
    <>
      <AdminSidebar />
      <Topbar />
      
      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'ml-72' : 'ml-0'}
        lg:ml-72
        relative z-10
      `}>
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Dashboard Admin"
            subtitle={`Selamat datang, ${user?.name} - ${userSubDirektorat}`}
          />

          {/* Test Data Buttons - Hanya untuk development */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-900">
                  <span>🧪 Development Tools</span>
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Tombol untuk testing data (hanya muncul di development mode)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateMockData}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    Generate Mock Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMockData}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    Clear Mock Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Year Selector Panel */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Tahun Buku</span>
              </CardTitle>
              <CardDescription>
                Pilih tahun buku untuk mengakses data dan tugas upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(year)}
                    className={`transition-all duration-200 ${
                      selectedYear === year 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {year}
                  </Button>
                ))}
              </div>
              {selectedYear && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tahun Buku {selectedYear}:</strong> 
                    {selectedYear === Math.max(...availableYears) 
                      ? ' Tahun aktif - dapat upload dokumen' 
                      : ' Tahun sebelumnya - hanya dapat melihat dan mengunduh dokumen'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show content only when year is selected */}
          {selectedYear ? (
            <>
              {/* Current Year: Show all panels */}
              {isCurrentYear ? (
                <>
                  {/* Statistik Tahun Buku */}
                  <div className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50 rounded-lg">
                    <div className="flex items-center justify-between p-4 border-b border-blue-100">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Statistik Tahun Buku</h3>
                        <p className="text-sm text-blue-700">
                          Overview dokumen dan assessment dokumen GCG tahun {selectedYear} untuk {userSubDirektorat}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshStatistics}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                    </div>
                    <YearStatisticsPanel 
                      selectedYear={selectedYear}
                      aspectStats={getAspectStats}
                      overallProgress={getOverallProgress}
                      getAspectIcon={getAspectIcon}
                      getAspectColor={getAspectColor}
                      onAspectClick={() => {}} // Admin tidak perlu click untuk filter
                      isSidebarOpen={isSidebarOpen}
                      title=""
                      description=""
                      showOverallProgress={true}
                    />
                  </div>

                  {/* Panel: Daftar Dokumen GCG (integrated with upload functionality) */}
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-indigo-50 mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <CardTitle className="flex items-center space-x-2 text-indigo-900">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <span>Daftar Dokumen GCG - Tahun {selectedYear}</span>
                          </CardTitle>
                          <CardDescription className="text-indigo-700 mt-2">
                            Dokumen GCG yang ditugaskan untuk {userSubDirektorat} pada tahun {selectedYear}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cari dokumen..."
                              value={checklistSearchQuery}
                              onChange={(e) => setChecklistSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                            />
                          </div>
                          <select
                            value={checklistSortField}
                            onChange={(e) => setChecklistSortField(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="aspek">Aspek</option>
                            <option value="deskripsi">Deskripsi</option>
                          </select>
                          <select
                            value={checklistSortDirection}
                            onChange={(e) => setChecklistSortDirection(e.target.value as 'asc' | 'desc')}
                            className="p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="asc">A-Z</option>
                            <option value="desc">Z-A</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {getAssignedChecklistsForTable.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Belum ada checklist
                          </h3>
                          <p className="text-gray-600">
                            Belum ada dokumen GCG yang ditugaskan untuk {userSubDirektorat} pada tahun {selectedYear}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Aspek</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[150px]">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getFilteredChecklistItems().map((item: any, index: number) => {
                                const hasDocument = userDocuments.some(doc => doc.checklistId === item.checklistId);
                                const uploadedDocument = userDocuments.find(doc => doc.checklistId === item.checklistId);
                                
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="outline" 
                                        className={`${getAspectColor(item.aspek, hasDocument ? 100 : 0)} text-white border-0`}
                                      >
                                        {item.aspek}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                      {item.deskripsi}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={hasDocument ? "default" : "secondary"}
                                        className={hasDocument ? "bg-green-500 hover:bg-green-600" : ""}
                                      >
                                        {hasDocument ? 'Uploaded' : 'Not Uploaded'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        {hasDocument ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadDocument(uploadedDocument)}
                                          >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleUploadDocument(item)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                          >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload
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

                  {/* Panel: Daftar Arsip Dokumen (filtered by sub-direktorat for current year) */}
                  <Card className="border-0 shadow-lg mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>Daftar Arsip Dokumen - {userSubDirektorat}</span>
                          </CardTitle>
                          <CardDescription>
                            Dokumen yang telah diupload oleh {userSubDirektorat} pada tahun {selectedYear}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cari dokumen..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                            />
                          </div>
                          <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="namaFile">Nama File</option>
                            <option value="aspek">Aspek</option>
                            <option value="uploadDate">Tanggal Upload</option>
                          </select>
                          <select
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                            className="p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="asc">A-Z</option>
                            <option value="desc">Z-A</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {userDocuments.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Belum ada dokumen
                          </h3>
                          <p className="text-gray-600">
                            Belum ada dokumen yang diupload oleh {userSubDirektorat}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredUserDocuments().map((document: any, index: number) => (
                            <Card key={index} className="border border-gray-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge variant="default">Dokumen</Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {document.aspek}
                                      </Badge>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">
                                      {document.namaFile}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Upload pada: {new Date(document.uploadDate).toLocaleDateString('id-ID')}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadDocument(document)}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Unduh
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Previous Years: Show only Daftar Arsip Dokumen with all documents */
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span>Daftar Arsip Dokumen - Tahun {selectedYear}</span>
                        </CardTitle>
                        <CardDescription>
                          Semua dokumen yang tersedia untuk tahun {selectedYear} (hanya dapat diunduh)
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Cari dokumen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                          />
                        </div>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                          className="p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="namaFile">Nama File</option>
                          <option value="aspek">Aspek</option>
                          <option value="subdirektorat">Sub-direktorat</option>
                          <option value="uploadDate">Tanggal Upload</option>
                        </select>
                        <select
                          value={sortDirection}
                          onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                          className="p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="asc">A-Z</option>
                          <option value="desc">Z-A</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredAllDocuments().length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Belum ada dokumen
                        </h3>
                        <p className="text-gray-600">
                          Belum ada dokumen yang tersedia untuk tahun {selectedYear}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredAllDocuments().map((document: any, index: number) => (
                          <Card key={index} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="default">Dokumen</Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {document.aspek}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {document.subdirektorat}
                                    </Badge>
                                  </div>
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {document.namaFile}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Upload pada: {new Date(document.uploadDate).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(document)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Unduh
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Empty State when no year selected */
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku di atas untuk melihat tugas upload dan progress Anda
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Dialog */}
      {selectedChecklist && (
        <FileUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          prefillData={{
            checklistId: selectedChecklist.checklistId,
            aspek: selectedChecklist.aspek,
            deskripsi: selectedChecklist.checklistItem?.deskripsi || selectedChecklist.deskripsi,
            direktorat: userDirektorat,
            subdirektorat: userSubDirektorat, // Changed to lowercase to match interface
            divisi: userDivisi,
            tahun: selectedYear
          }}
        />
      )}
    </>
  );
};

export default DashboardAdmin;
