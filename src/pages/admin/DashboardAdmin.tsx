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
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { 
  AdminYearPanel, 
  AdminDocumentListPanel, 
  AdminStatisticsPanel, 
  AdminArchivePanel, 
  AdminHeaderPanel 
} from '@/components/panels';
import { AdminUploadDialog } from '@/components/dialogs';

interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  progressPercentage: number;
}

interface ChecklistItem {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
  status?: 'uploaded' | 'not_uploaded';
  file?: string;
}

const DashboardAdmin: React.FC = () => {
  const { user } = useUser();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { documents } = useDocumentMetadata();
  const { isSidebarOpen } = useSidebar();

  // Get current year for upload restrictions
  const currentYear = new Date().getFullYear().toString();

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
    if (!user?.subdirektorat || !documents || !Array.isArray(documents)) return [];

    return documents
      .filter(doc => doc.subdirektorat === user.subdirektorat)
      .map(doc => ({
        id: doc.id,
        namaFile: doc.fileName || 'Unknown File',
        aspek: doc.aspect || 'Unknown Aspect',
        subdirektorat: doc.subdirektorat,
        uploadDate: doc.uploadDate || new Date().toISOString(),
        status: doc.status || 'pending',
        tahunBuku: doc.year?.toString() || 'Unknown Year'
      }))
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, user?.subdirektorat]);

  // Filter documents by year
  const currentYearDocuments = useMemo(() => 
    userDocuments.filter(doc => doc.tahunBuku === selectedYear?.toString()),
    [userDocuments, selectedYear]
  );

  const previousYearDocuments = useMemo(() => 
    userDocuments.filter(doc => doc.tahunBuku !== selectedYear?.toString()),
    [userDocuments, selectedYear]
  );

  // Check if current year allows uploads
  const canUploadInCurrentYear = selectedYear?.toString() === currentYear;

  // Mock data for checklist items (this should come from checklist context later)
  const checklistItems = useMemo((): ChecklistItem[] => {
    if (!selectedYear) return [];
    
    return [
      {
        id: 1,
        aspek: 'ASPEK I. Komitmen',
        deskripsi: 'Laporan Good Corporate Governance untuk kuartal pertama tahun 2024',
        tahun: selectedYear,
        status: 'not_uploaded'
      },
      {
        id: 2,
        aspek: 'ASPEK II. RUPS',
        deskripsi: 'Penilaian kepatuhan terhadap regulasi yang berlaku',
        tahun: selectedYear,
        status: 'uploaded',
        file: 'Assessment_Kepatuhan_2024.pdf'
      },
      {
        id: 3,
        aspek: 'ASPEK III. Dewan Komisaris',
        deskripsi: 'Dokumen pendukung audit internal tahun 2024',
        tahun: selectedYear,
        status: 'uploaded',
        file: 'Audit_Internal_2024.pdf'
      },
      {
        id: 4,
        aspek: 'ASPEK IV. Direksi',
        deskripsi: 'Laporan identifikasi dan mitigasi risiko operasional',
        tahun: selectedYear,
        status: 'not_uploaded'
      },
      {
        id: 5,
        aspek: 'ASPEK V. Pengungkapan',
        deskripsi: 'Dokumen pengungkapan informasi perusahaan',
        tahun: selectedYear,
        status: 'not_uploaded'
      }
    ];
  }, [selectedYear]);



  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isReUploadDialogOpen, setIsReUploadDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<ChecklistItem | null>(null);

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

  const handleViewDocument = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      // TODO: Implement document view dialog or redirect
      alert(`Lihat dokumen: ${item.file || 'File tidak tersedia'}`);
    }
  };

  const handleDownloadDocument = (itemId: number) => {
    const item = checklistItems.find(item => item.id === itemId);
    if (item) {
      // TODO: Implement document download
      alert(`Download dokumen: ${item.file || 'File tidak tersedia'}`);
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
            userSubdirektorat={user.subdirektorat}
          />

                    {/* Admin Year Panel - Selalu tampil untuk navigasi */}
          <AdminYearPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            currentYear={parseInt(currentYear)}
          />

          {/* Conditional Display based on selected year */}
          {selectedYear === parseInt(currentYear) ? (
            // Tahun Terkini - Tampilkan semua panel
            <>
                            {/* Statistik Progress Penugasan - UI sama dengan superadmin */}
              <AdminStatisticsPanel 
                selectedYear={selectedYear}
                checklistItems={checklistItems}
                userSubdirektorat={user.subdirektorat}
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

                            {/* Arsip Dokumen - Hanya tab Tahun Terkini */}
              <AdminArchivePanel
                selectedYear={selectedYear}
                currentYearDocuments={currentYearDocuments}
                previousYearDocuments={previousYearDocuments}
                canUploadInCurrentYear={canUploadInCurrentYear}
                isCurrentYear={true}
              />
                </>
              ) : (
                        // Tahun Lama - Hanya tampilkan panel Arsip Dokumen
            <AdminArchivePanel
              selectedYear={selectedYear}
              currentYearDocuments={currentYearDocuments}
              previousYearDocuments={previousYearDocuments}
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
      />

      {/* Admin Re-upload Dialog */}
      <AdminUploadDialog
        isOpen={isReUploadDialogOpen}
        onOpenChange={setIsReUploadDialogOpen}
        checklistItem={selectedChecklistItem}
        isReUpload={true}
        existingFileName={selectedChecklistItem?.file}
      />
    </>
  );
};

export default DashboardAdmin;
