import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock,
  AlertCircle, 
  Download, 
  Upload,
  Eye,
  Calendar,
  Users,
  FolderOpen,
  BarChart3,
  Archive
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useYear } from '@/contexts/YearContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { 
  YearSelectorPanel, 
  AdminDocumentListPanel, 
  AdminStatisticsPanel, 
  AdminArchivePanel, 
  AdminHeaderPanel,
  AOIPanel
} from '@/components/panels';
import { AdminUploadDialog } from '@/components/dialogs';

interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  progressPercentage: number;
}

const DashboardAdmin: React.FC = () => {
  const { user } = useUser();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { documents } = useDocumentMetadata();
  const { checklist, getChecklistByYear } = useChecklist();
  const { getFilesByYear } = useFileUpload();
  const { isSidebarOpen } = useSidebar();
  const { divisi, subdirektorat } = useStrukturPerusahaan();

  // Get current year for upload restrictions - use the most recent year from available years
  const currentYear = availableYears.length > 0 ? Math.max(...availableYears).toString() : new Date().getFullYear().toString();

  // Dashboard statistics
  const dashboardStats = useMemo((): DashboardStats => {
    if (!user?.subdirektorat || !documents || !Array.isArray(documents)) return {
      totalDocuments: 0,
      completedDocuments: 0,
      pendingDocuments: 0,
      progressPercentage: 0
    };

    const userDocuments = documents.filter(doc => 
      doc.subdirektorat === user.subdirektorat && 
      doc.year === selectedYear
    );

    const total = userDocuments.length;
    const completed = userDocuments.filter(doc => doc.status === 'completed').length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalDocuments: total,
      completedDocuments: completed,
      pendingDocuments: pending,
      progressPercentage: progress
    };
  }, [documents, user?.subdirektorat, selectedYear]);

  // Get user documents for current year and previous years
  const userDocuments = useMemo(() => {
    if (!user?.subdirektorat) return [];

    // Use real data from context
    return documents
      .filter(doc => doc.subdirektorat === user.subdirektorat)
      .map(doc => ({
        id: doc.id,
        namaFile: doc.fileName,
        aspek: doc.aspect || 'Unknown Aspect',
        subdirektorat: doc.subdirektorat,
        uploadDate: doc.uploadDate,
        status: doc.status,
        tahunBuku: doc.year?.toString() || 'Unknown'
      }))
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, user?.subdirektorat]);

  // Filter documents by year
  const currentYearDocuments = useMemo(() => {
    if (!selectedYear) return [];
    return userDocuments.filter(doc => doc.tahunBuku === selectedYear.toString());
  }, [userDocuments, selectedYear]);

  const previousYearDocuments = useMemo(() => {
    if (!selectedYear) return [];
    // For previous years, show all documents from all subdirektorats
    return documents
      .filter(doc => doc.year === selectedYear)
      .map(doc => ({
        id: doc.id,
        namaFile: doc.fileName,
        aspek: doc.aspect || 'Unknown Aspect',
        subdirektorat: doc.subdirektorat,
        uploadDate: doc.uploadDate,
        status: doc.status,
        tahunBuku: doc.year?.toString() || 'Unknown'
      }));
  }, [documents, selectedYear]);

  // Check if current year allows uploads - only the most recent year allows uploads
  const canUploadInCurrentYear = selectedYear === Math.max(...availableYears);

  // Get checklist items berdasarkan tahun dan subdirektorat admin dari context
  const checklistItems = useMemo(() => {
    if (!selectedYear || !user?.subdirektorat) return [];
    
    try {
      // Get checklist items for selected year
      const yearChecklist = getChecklistByYear(selectedYear);
      console.log('Year checklist data:', yearChecklist);
      
      if (!yearChecklist || yearChecklist.length === 0) {
        console.log('No checklist data for year:', selectedYear);
        return [];
      }
      
            // Get assignments untuk tahun dan subdirektorat admin
      const storedAssignments = localStorage.getItem('checklistAssignments');
      let adminAssignments: any[] = [];
      
      if (storedAssignments) {
        try {
          const allAssignments = JSON.parse(storedAssignments);
          adminAssignments = allAssignments.filter((assignment: any) => {
            if (assignment.tahun !== selectedYear) return false;
            
            // Assignment langsung ke subdirektorat admin
            if (assignment.assignmentType === 'subdirektorat' && assignment.subdirektorat === user.subdirektorat) {
              return true;
            }
            
            // Assignment ke divisi yang berada di bawah subdirektorat admin
            if (assignment.assignmentType === 'divisi' && assignment.divisi) {
              // Cari divisi yang berada di bawah subdirektorat admin
              const divisiUnderSubdir = divisi.filter(d => {
                const subdir = subdirektorat.find(s => s.id === d.subdirektoratId);
                return subdir && subdir.nama === user.subdirektorat;
              });
              return divisiUnderSubdir.some(d => d.nama === assignment.divisi);
            }
            
            return false;
          });
        } catch (error) {
          console.error('Error parsing assignments:', error);
        }
      }
      
      // Filter checklist items berdasarkan assignments admin
      const assignedChecklistIds = new Set(adminAssignments.map(a => a.checklistId));
      const assignedItems = yearChecklist.filter(item => assignedChecklistIds.has(item.id));
      
      console.log('Admin assignments for year and subdirektorat:', {
        year: selectedYear,
        subdirektorat: user.subdirektorat,
        totalAssignments: adminAssignments.length,
        assignedItems: assignedItems.length
      });
      
      // Check if items are uploaded using FileUploadContext (real-time)
      const itemsWithStatus = assignedItems.map(item => {
        // Allow items without aspek (like superadmin does)
        if (!item.deskripsi) {
          console.warn('Invalid checklist item - missing deskripsi:', item);
          return null;
        }
        
        // Get real-time upload status and file info
        const uploadedFile = getFilesByYear(selectedYear).find(file => file.checklistId === item.id);
        
        return {
          ...item,
          // Handle items without aspek gracefully
          aspek: item.aspek || '',
          status: uploadedFile ? 'completed' : 'pending',
          // Add file information for real-time updates
          uploadedFile: uploadedFile || null
        };
      }).filter(Boolean); // Remove null items
      
      console.log('Processed checklist items with file info for admin:', itemsWithStatus);
      return itemsWithStatus;
    } catch (error) {
      console.error('Error processing checklist items:', error);
      return [];
    }
  }, [selectedYear, getChecklistByYear, getFilesByYear, user?.subdirektorat]);



  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isReUploadDialogOpen, setIsReUploadDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    id: number;
    aspek?: string; // Make aspek optional
    deskripsi: string;
    tahun?: number;
    status: string;
  } | null>(null);

  // Handler functions
  const handleUpload = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      setSelectedChecklistItem(item);
      setIsUploadDialogOpen(true);
    }
  };

  const handleReUpload = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      setSelectedChecklistItem(item);
      setIsReUploadDialogOpen(true);
    }
  };

  // Refresh data after upload
  const handleUploadSuccess = useCallback(() => {
    // Dispatch custom event for real-time updates without page restart
    console.log('DashboardAdmin: Upload success, dispatching refresh event');
    window.dispatchEvent(new CustomEvent('fileUploaded', {
      detail: { 
        type: 'fileUploaded', 
        year: selectedYear,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Also dispatch specific events for different contexts
    window.dispatchEvent(new CustomEvent('uploadedFilesChanged', {
      detail: { 
        type: 'uploadedFilesChanged', 
        year: selectedYear,
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
  }, [selectedYear]);

  const handleViewDocument = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      // TODO: Implement document view dialog or redirect
      const uploadedFile = getFilesByYear(selectedYear || new Date().getFullYear())
        .find(file => file.checklistId === itemId);
      if (uploadedFile) {
        alert(`Lihat dokumen: ${uploadedFile.fileName}`);
      } else {
        alert('Belum ada dokumen yang diupload untuk item ini');
      }
    }
  };

  const handleDownloadDocument = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      // TODO: Implement document download
      const uploadedFile = getFilesByYear(selectedYear || new Date().getFullYear())
        .find(file => file.checklistId === itemId);
      if (uploadedFile) {
        alert(`Download dokumen: ${uploadedFile.fileName}`);
      } else {
        alert('Belum ada dokumen yang diupload untuk item ini');
      }
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Terlambat</Badge>;
      case 'revision':
        return <Badge className="bg-orange-100 text-orange-800">Revisi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'revision':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
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
          <AdminHeaderPanel 
            userName={user.name}
            userDivisi={user.divisi}
          />

          {/* Year Selector Panel - Konsisten dengan menu lain */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            title="Tahun Buku"
            description="Pilih tahun buku untuk mengakses dashboard admin"
          />

          {/* Conditional Display based on selected year */}
          {selectedYear === Math.max(...availableYears) ? (
            // Tahun Terkini (Paling Baru) - Tampilkan semua panel
            <div className="space-y-6">
              {/* Statistik Progress Penugasan - UI sama dengan superadmin */}
              <AdminStatisticsPanel 
                selectedYear={selectedYear}
                checklistItems={checklistItems}
                userDivisi={user.divisi}
                isSidebarOpen={isSidebarOpen}
              />

              {/* Admin Document List Panel */}
              <AdminDocumentListPanel
                checklistItems={checklistItems}
                onUpload={handleUpload}
                onReUpload={handleReUpload}
                onViewDocument={handleViewDocument}
                onDownloadDocument={handleDownloadDocument}
                selectedYear={selectedYear}
              />

              {/* Area of Improvement (AOI) Panel */}
              <AOIPanel
                selectedYear={selectedYear}
              />

              {/* Arsip Dokumen - Hanya tab Tahun Terkini */}
              <AdminArchivePanel
                selectedYear={selectedYear}
                canUploadInCurrentYear={canUploadInCurrentYear}
                isCurrentYear={true}
              />
            </div>
          ) : (
            // Tahun Lama - Hanya tampilkan panel Arsip Dokumen
            <AdminArchivePanel
              selectedYear={selectedYear}
              canUploadInCurrentYear={canUploadInCurrentYear}
              isCurrentYear={false}
            />
          )}
        </div>
      </div>

      {/* Admin Upload Dialog */}
      <AdminUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        checklistItem={selectedChecklistItem}
        isReUpload={false}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Admin Re-upload Dialog */}
      <AdminUploadDialog
        isOpen={isReUploadDialogOpen}
        onOpenChange={setIsReUploadDialogOpen}
        checklistItem={selectedChecklistItem}
        isReUpload={true}
        existingFileName={selectedChecklistItem ? 
          getFilesByYear(selectedYear || new Date().getFullYear())
            .find(file => file.checklistId === selectedChecklistItem.id)?.fileName || '' 
          : ''
        }
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};

export default DashboardAdmin;
