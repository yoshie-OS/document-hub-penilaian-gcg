import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useChecklist, ChecklistGCG } from '@/contexts/ChecklistContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useYear } from '@/contexts/YearContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import FileUploadDialog from '@/components/dashboard/FileUploadDialog';
import { YearSelectorPanel, PageHeaderPanel, FormDialog, ConfirmDialog, IconButton } from '@/components/panels';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';
import { OverviewTab, KelolaAspekTab, KelolaDokumenTab } from '@/components/monitoring';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Upload, 
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Search,
  BookOpen,
  Zap,
  Plus,
  Download,
  Edit,
  Trash2,
  Settings,
  List,
} from 'lucide-react';



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

// Data subdirektorat yang dioptimasi - dipindah ke luar komponen
const SUBDIREKTORAT_OPTIONS = [
  { value: "Sub Direktorat Government and Corporate Business", label: "Government & Corporate Business" },
  { value: "Sub Direktorat Consumer Business", label: "Consumer Business" },
  { value: "Sub Direktorat Enterprise Business", label: "Enterprise Business" },
  { value: "Sub Direktorat Retail Business", label: "Retail Business" },
  { value: "Sub Direktorat Wholesale and International Business", label: "Wholesale & International Business" },
  { value: "Sub Direktorat Courier and Logistic Operation", label: "Courier & Logistic Operation" },
  { value: "Sub Direktorat International Post Services", label: "International Post Services" },
  { value: "Sub Direktorat Digital Services", label: "Digital Services" },
  { value: "Sub Direktorat Frontino Management and Financial Transaction Services", label: "Frontino Management & Financial Transaction" },
  { value: "Sub Direktorat Financial Operation and Business Partner", label: "Financial Operation & Business Partner" },
  { value: "Sub Direktorat Financial Policy and Asset Management", label: "Financial Policy & Asset Management" },
  { value: "Sub Direktorat Risk Management", label: "Risk Management" },
  { value: "Sub Direktorat Human Capital Policy and Strategy", label: "Human Capital Policy & Strategy" },
  { value: "Sub Direktorat Human Capital Service and Business Partner", label: "Human Capital Service & Business Partner" },
  { value: "Sub Direktorat Strategic Planning and Business Development", label: "Strategic Planning & Business Development" },
  { value: "Sub Direktorat Portfolio Management", label: "Portfolio Management" }
];

// Komponen Assignment Dropdown yang dioptimasi dengan button sederhana
const AssignmentDropdown = memo(({ 
  item, 
  onAssign, 
  isSuperAdmin,
  currentAssignmentLabel
}: { 
  item: { id: number; aspek: string; deskripsi: string }; 
  onAssign: (checklistId: number, subdirektorat: string, aspek: string, deskripsi: string) => void;
  isSuperAdmin: boolean;
  currentAssignmentLabel?: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAssign = useCallback(async (value: string) => {
    setIsLoading(true);
    try {
      // Simulate async operation untuk menghindari lag
      await new Promise(resolve => setTimeout(resolve, 10));
      onAssign(item.id, value, item.aspek, item.deskripsi);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [item, onAssign]);

  // Memoize dropdown options untuk performa
  const dropdownOptions = useMemo(() => (
    SUBDIREKTORAT_OPTIONS.map((option) => (
      <button
        key={option.value}
        onClick={() => handleAssign(option.value)}
        disabled={isLoading}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {option.label}
      </button>
    ))
  ), [handleAssign, isLoading]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isSuperAdmin) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-56 justify-between disabled:opacity-50 ${currentAssignmentLabel ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
      >
        <span className="truncate text-left">
          {isLoading 
            ? 'Assigning...'
            : currentAssignmentLabel 
              ? `Assigned: ${currentAssignmentLabel}`
              : 'Assign ke Subdirektorat'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {dropdownOptions}
          </div>
        </div>
      )}
    </div>
  );
});

AssignmentDropdown.displayName = 'AssignmentDropdown';



const MonitoringUploadGCG = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    checklist, 
    ensureAllYearsHaveData, 
    addChecklist, 
    editChecklist, 
    deleteChecklist,
    addAspek,
    editAspek,
    deleteAspek
  } = useChecklist();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { getYearStats, getFilesByYear } = useFileUpload();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear } = useYear();
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPenjelasan, setSelectedPenjelasan] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    id: number;
    aspek: string;
    deskripsi: string;
  } | null>(null);
  
  // State untuk assignment dokumen GCG
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);

  // Load assignments from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('checklistAssignments');
      if (stored) {
        const parsed = JSON.parse(stored) as ChecklistAssignment[];
        setAssignments(parsed);
      }
    } catch (err) {
      console.error('Failed to load checklistAssignments from localStorage', err);
    }
  }, []);
  
  // State untuk tab
  const [activeTab, setActiveTab] = useState<'rekap' | 'kelola-aspek' | 'kelola-dokumen'>('rekap');
  
  // State untuk kelola aspek
  const [isAddAspekDialogOpen, setIsAddAspekDialogOpen] = useState(false);
  const [isEditAspekDialogOpen, setIsEditAspekDialogOpen] = useState(false);
  const [selectedAspekForEdit, setSelectedAspekForEdit] = useState<string>('');
  const [aspekForm, setAspekForm] = useState({
    nama: '',
    deskripsi: ''
  });
  
  // State untuk kelola dokumen
  const [isAddChecklistDialogOpen, setIsAddChecklistDialogOpen] = useState(false);
  const [isEditChecklistDialogOpen, setIsEditChecklistDialogOpen] = useState(false);
  const [selectedChecklistForEdit, setSelectedChecklistForEdit] = useState<ChecklistGCG | null>(null);
  const [checklistForm, setChecklistForm] = useState({
    aspek: '',
    deskripsi: ''
  });
  const [selectedAspekForChecklist, setSelectedAspekForChecklist] = useState<string>('all');
  const [searchTermChecklist, setSearchTermChecklist] = useState<string>('');



  // Ensure all years have dokumen GCG data when component mounts
  useEffect(() => {
    ensureAllYearsHaveData();
  }, [ensureAllYearsHaveData]);

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

  // Use years from global context
  const { availableYears } = useYear();
  const years = availableYears;

  // Get unique aspects for selected year
  const aspects = useMemo(() => {
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    return [...new Set(yearChecklist.map(item => item.aspek))];
  }, [checklist, selectedYear]);

  // Ringkasan assignment per subdirektorat (Breakdown Penugasan)
  const assignmentSummary = useMemo(() => {
    const yearAssignments = assignments.filter(a => a.tahun === selectedYear);
    if (yearAssignments.length === 0) return [] as Array<{ sub: string; display: string; total: number; completed: number; percent: number }>;
    const bySub: Record<string, number[]> = {};
    yearAssignments.forEach(a => {
      if (!bySub[a.subdirektorat]) bySub[a.subdirektorat] = [];
      bySub[a.subdirektorat].push(a.checklistId);
    });
    const yearFiles = getFilesByYear(selectedYear);
    const isChecklistUploadedId = (checklistId: number) => yearFiles.some(f => f.checklistId === checklistId);
    const clean = (name: string) => name.replace(/^\s*Sub\s*Direktorat\s*/i, '').trim();
    return Object.entries(bySub).map(([sub, checklistIds]) => {
      const total = checklistIds.length;
      const completed = checklistIds.filter(id => isChecklistUploadedId(id)).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { sub, display: clean(sub), total, completed, percent };
    }).sort((a, b) => a.display.localeCompare(b.display));
  }, [assignments, selectedYear, getFilesByYear]);

  // Check if dokumen GCG item is uploaded - menggunakan data yang sama dengan DashboardStats
  const isChecklistUploaded = useCallback((checklistId: number) => {
    const yearFiles = getFilesByYear(selectedYear);
    return yearFiles.some(file => file.checklistId === checklistId);
  }, [getFilesByYear, selectedYear]);

  // Get uploaded document for dokumen GCG - menggunakan data yang sama dengan DashboardStats
  const getUploadedDocument = useCallback((checklistId: number) => {
    const yearFiles = getFilesByYear(selectedYear);
    return yearFiles.find(file => file.checklistId === checklistId);
  }, [getFilesByYear, selectedYear]);

  // Filter dokumen GCG berdasarkan aspek dan status - menggunakan data yang sama dengan DashboardStats
  const filteredChecklist = useMemo(() => {
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

    if (debouncedSearchTerm) {
      filtered = filtered.filter(item => 
        item.deskripsi.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [checklist, selectedAspek, selectedStatus, selectedYear, debouncedSearchTerm, isChecklistUploaded]);





  // Navigate to dashboard with document highlight
  const handleViewDocument = useCallback((checklistId: number) => {
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
  const handleDownloadDocument = useCallback((checklistId: number) => {
    const uploadedDocument = getUploadedDocument(checklistId);
    if (uploadedDocument) {
      try {
        // Create a blob from the file data (simulated for now)
        const blob = new Blob(['Document content'], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = uploadedDocument.fileName || `${uploadedDocument.fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        toast({
          title: "Download berhasil",
          description: `File ${uploadedDocument.fileName} berhasil diunduh`,
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download gagal",
          description: "Terjadi kesalahan saat mengunduh file",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "File tidak ditemukan",
        description: "Dokumen belum diupload atau tidak tersedia",
        variant: "destructive"
      });
    }
  }, [getUploadedDocument, toast]);

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
  }, [selectedYear, checklist, isChecklistUploaded]);

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
  }, [selectedYear, checklist, getDocumentsByYear, isChecklistUploaded]);





  // Get status badge color
  const getStatusBadge = useCallback((status: string) => {
    if (status === 'uploaded') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Sudah Upload
      </Badge>;
    }
    return <Badge variant="secondary" className="border-yellow-200 text-yellow-700 bg-yellow-50">
      <Clock className="w-3 h-3 mr-1" />
      Belum Upload
    </Badge>;
  }, []);

  // Handle upload button click
  const handleUploadClick = useCallback((item: { id: number; aspek: string; deskripsi: string }) => {
    setSelectedChecklistItem(item);
    setIsUploadDialogOpen(true);
  }, []);

  // Handle assignment - dioptimasi dengan useCallback
  const handleAssignment = useCallback((checklistId: number, subdirektorat: string, aspek: string, deskripsi: string) => {
    const newAssignment: ChecklistAssignment = {
      id: Date.now(),
      checklistId,
      subdirektorat,
      aspek,
      deskripsi,
      tahun: selectedYear,
      assignedBy: user?.name || 'Super Admin',
      assignedAt: new Date(),
      status: 'assigned'
    };
    // Update state and persist to localStorage so radar & panels dapat membaca
    setAssignments(prev => {
      // Replace existing assignment for this checklistId & year if any
      const next = [...prev.filter(a => !(a.checklistId === checklistId && a.tahun === selectedYear)), newAssignment];
      try {
        localStorage.setItem('checklistAssignments', JSON.stringify(next));
        // Notify other panels/components to refresh
        try {
          window.dispatchEvent(new Event('assignmentsUpdated'));
        } catch {}
      } catch (err) {
        console.error('Failed to persist checklistAssignments', err);
      }
      return next;
    });
    toast({
      title: "Assignment Berhasil",
              description: `Dokumen GCG berhasil ditugaskan ke ${subdirektorat}`,
    });
  }, [selectedYear, user?.name, toast]);

  // Fungsi untuk mengelola aspek
  const handleAddAspek = () => {
    if (!aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama aspek harus diisi!",
        variant: "destructive"
      });
      return;
    }

    addAspek(aspekForm.nama, selectedYear);
    setAspekForm({ nama: '', deskripsi: '' });
    setIsAddAspekDialogOpen(false);
    toast({
      title: "Berhasil",
      description: "Aspek berhasil ditambahkan!",
    });
  };

  const handleEditAspek = () => {
    if (!selectedAspekForEdit || !aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama aspek harus diisi!",
        variant: "destructive"
      });
      return;
    }

    editAspek(selectedAspekForEdit, aspekForm.nama, selectedYear);
    setAspekForm({ nama: '', deskripsi: '' });
    setIsEditAspekDialogOpen(false);
    setSelectedAspekForEdit('');
    toast({
      title: "Berhasil",
      description: "Aspek berhasil diperbarui!",
    });
  };

  const handleDeleteAspek = (aspekName: string) => {
    deleteAspek(aspekName, selectedYear);
    toast({
      title: "Berhasil",
      description: "Aspek berhasil dihapus!",
    });
  };

  // Fungsi untuk mengelola dokumen GCG
  const handleAddChecklist = () => {
    if (!checklistForm.aspek.trim() || !checklistForm.deskripsi.trim()) {
      toast({
        title: "Error",
        description: "Aspek dan deskripsi harus diisi!",
        variant: "destructive"
      });
      return;
    }

    addChecklist(checklistForm.aspek, checklistForm.deskripsi, selectedYear);
    setChecklistForm({ aspek: '', deskripsi: '' });
    setIsAddChecklistDialogOpen(false);
    toast({
      title: "Berhasil",
              description: "Dokumen GCG berhasil ditambahkan!",
    });
  };

  const handleEditDokumenGCG = () => {
    if (!selectedChecklistForEdit || !checklistForm.aspek.trim() || !checklistForm.deskripsi.trim()) {
      toast({
        title: "Error",
        description: "Aspek dan deskripsi harus diisi!",
        variant: "destructive"
      });
      return;
    }

    editChecklist(selectedChecklistForEdit.id, checklistForm.aspek, checklistForm.deskripsi, selectedYear);
    setChecklistForm({ aspek: '', deskripsi: '' });
    setIsEditChecklistDialogOpen(false);
    setSelectedChecklistForEdit(null);
    toast({
      title: "Berhasil",
              description: "Dokumen GCG berhasil diperbarui!",
    });
  };

  const handleDeleteChecklist = (checklistId: number) => {
    deleteChecklist(checklistId, selectedYear);
    toast({
      title: "Berhasil",
              description: "Dokumen GCG berhasil dihapus!",
    });
  };

  // Filter checklist berdasarkan aspek dan pencarian
  const filteredChecklistItems = useMemo(() => {
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    return yearChecklist.filter(item => {
      const matchesAspek = selectedAspekForChecklist === 'all' || item.aspek === selectedAspekForChecklist;
      const matchesSearch = item.deskripsi.toLowerCase().includes(searchTermChecklist.toLowerCase()) ||
                           item.aspek.toLowerCase().includes(searchTermChecklist.toLowerCase());
      return matchesAspek && matchesSearch;
    });
  }, [checklist, selectedYear, selectedAspekForChecklist, searchTermChecklist]);

  // Virtual scrolling - batasi jumlah item yang ditampilkan untuk performa
  const displayedChecklistItems = useMemo(() => {
    return filteredChecklistItems.slice(0, 100); // Tampilkan maksimal 100 item
  }, [filteredChecklistItems]);

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
            badge={{ text: selectedYear.toString(), variant: "default" }}
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



          {/* Tabs System */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="rekap" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Rekap</span>
              </TabsTrigger>
              <TabsTrigger value="kelola-aspek" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Kelola Aspek</span>
              </TabsTrigger>
                              <TabsTrigger value="kelola-dokumen" className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                                        <span>Kelola Dokumen</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Rekap */}
            <TabsContent value="rekap">
                              {/* Statistik Tahun Buku */}
                {selectedYear && (
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
                    maxCardsInSlider={4}
                    showViewAllButton={true}
                    showOverallProgress={true}
                  />
                )}

              {/* Breakdown Penugasan Subdirektorat */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Breakdown Penugasan Subdirektorat</CardTitle>
                  <CardDescription>
                    Ringkasan jumlah dokumen GCG yang ditugaskan dan selesai per subdirektorat pada tahun {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignmentSummary.length === 0 ? (
                    <div className="text-sm text-gray-500">Belum ada penugasan untuk tahun ini.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignmentSummary.map((row, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-sm font-semibold text-gray-900 mb-1 text-center truncate">{row.display}</div>
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <span className="text-base font-bold text-blue-600">{row.completed}/{row.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                          : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'
                        }
                    >
                        <Clock className="w-3 h-3 mr-1" />
                      Belum Upload
                    </Button>
                  </div>
                </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedAspek('all');
                      setSelectedStatus('all');
                        setSearchTerm('');
                    }}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                      <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Filter
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
                      <TableHead className="text-indigo-900 font-semibold">Status</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">File</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredChecklist.map((item, index) => {
                      const IconComponent = getAspectIcon(item.aspek);
                      const uploadedDocument = getUploadedDocument(item.id);
                      
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
                      <TableCell>
                            {item.status === 'uploaded' ? (
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
                      <TableCell>
                            {uploadedDocument ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-900 truncate" title={uploadedDocument.fileName}>
                                    {uploadedDocument.fileName}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Nama File: {uploadedDocument.fileName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Tanggal Upload: {new Date(uploadedDocument.uploadDate).toLocaleDateString('id-ID')}
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
                                onClick={() => handleViewDocument(item.id)}
                                disabled={!isChecklistUploaded(item.id)}
                                className={`${
                                  isChecklistUploaded(item.id)
                                    ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                title={
                                  isChecklistUploaded(item.id)
                                    ? 'Lihat dokumen di Dashboard'
                                    : 'Dokumen belum diupload'
                                }
                              >
                            <Eye className="w-4 h-4" />
                          </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadDocument(item.id)}
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUploadClick(item)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                title="Upload dokumen baru"
                              >
                            <Upload className="w-4 h-4" />
                          </Button>
                      <AssignmentDropdown 
                        item={item}
                        onAssign={handleAssignment}
                        isSuperAdmin={user?.role === 'superadmin'}
                        currentAssignmentLabel={(() => {
                          const a = assignments.find(a => a.checklistId === item.id && a.tahun === selectedYear);
                          if (!a) return null;
                          const opt = SUBDIREKTORAT_OPTIONS.find(o => o.value === a.subdirektorat);
                          return opt?.label || a.subdirektorat;
                        })()}
                      />
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
            </TabsContent>

            {/* Tab Kelola Aspek */}
            <TabsContent value="kelola-aspek">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-emerald-900">
                        <Settings className="w-5 h-5 text-emerald-600" />
                        <span>Kelola Aspek - Tahun {selectedYear}</span>
                      </CardTitle>
                      <CardDescription className="text-emerald-700 mt-2">
                        Kelola aspek-aspek GCG untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        setAspekForm({ nama: '', deskripsi: '' });
                        setIsAddAspekDialogOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Aspek
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
                      const uniqueAspek = [...new Set(yearChecklist.map(item => item.aspek))];
                      return uniqueAspek.map(aspekName => (
                        <div key={aspekName} className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-200 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-emerald-50">
                              <Settings className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{aspekName}</h3>
                              <p className="text-sm text-gray-600">
                                {yearChecklist.filter(item => item.aspek === aspekName).length} item checklist
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAspekForEdit(aspekName);
                                setAspekForm({ nama: aspekName, deskripsi: '' });
                                setIsEditAspekDialogOpen(true);
                              }}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAspek(aspekName)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                    
                    {(() => {
                      const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
                      const uniqueAspek = [...new Set(yearChecklist.map(item => item.aspek))];
                      return uniqueAspek.length === 0;
                    })() && (
                      <div className="text-center py-12 bg-gradient-to-br from-emerald-50 to-blue-50">
                        <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                          <Settings className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-700 mb-2">
                          Belum ada aspek
                        </h3>
                        <p className="text-emerald-600">
                          Tambahkan aspek pertama untuk tahun {selectedYear}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Kelola Dokumen */}
                          <TabsContent value="kelola-dokumen">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-purple-900">
                        <List className="w-5 h-5 text-purple-600" />
                        <span>Kelola Dokumen - Tahun {selectedYear}</span>
                      </CardTitle>
                      <CardDescription className="text-purple-700 mt-2">
                        Kelola dokumen GCG untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        setChecklistForm({ aspek: '', deskripsi: '' });
                        setIsAddChecklistDialogOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Checklist
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filter dan Pencarian */}
                  <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                        <Search className="w-4 h-4 mr-2 text-purple-600" />
                        Pencarian Deskripsi Dokumen GCG
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Cari berdasarkan deskripsi dokumen GCG..."
                          className="pl-10 pr-10"
                          value={searchTermChecklist}
                          onChange={(e) => setSearchTermChecklist(e.target.value)}
                        />
                        {searchTermChecklist && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTermChecklist('')}
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
                          <Filter className="w-4 h-4 mr-2 text-purple-600" />
                          Filter Aspek
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedAspekForChecklist === 'all' ? "default" : "outline"}
                            onClick={() => setSelectedAspekForChecklist('all')}
                            size="sm"
                            className={selectedAspekForChecklist === 'all' 
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                              : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                            }
                          >
                            Semua Aspek
                          </Button>
                          {(() => {
                            const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
                            const uniqueAspek = [...new Set(yearChecklist.map(item => item.aspek))];
                            return uniqueAspek.map(aspek => {
                              const IconComponent = getAspectIcon(aspek);
                              return (
                                <Button
                                  key={aspek}
                                  variant={selectedAspekForChecklist === aspek ? "default" : "outline"}
                                  onClick={() => setSelectedAspekForChecklist(aspek)}
                                  size="sm"
                                  className={`text-xs flex items-center space-x-2 ${
                                    selectedAspekForChecklist === aspek 
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <IconComponent className={`w-3 h-3 ${selectedAspekForChecklist === aspek ? 'text-white' : 'text-gray-600'}`} />
                                  <span>{aspek.replace('ASPEK ', '').replace('. ', ' - ')}</span>
                                </Button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Checklist */}
                  <div className="space-y-4">
                    {displayedChecklistItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <List className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-600">{item.aspek}</h3>
                              <p className="font-semibold text-gray-900">{item.deskripsi}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Status: {isChecklistUploaded(item.id) ? 'Sudah Upload' : 'Belum Upload'}</span>
                            <span>Tahun: {item.tahun}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChecklistForEdit(item);
                              setChecklistForm({ aspek: item.aspek, deskripsi: item.deskripsi });
                              setIsEditChecklistDialogOpen(true);
                            }}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteChecklist(item.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredChecklistItems.length === 0 && (
                      <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-blue-50">
                        <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                          <List className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-purple-700 mb-2">
                          Tidak ada checklist yang ditemukan
                        </h3>
                        <p className="text-purple-600">
                          {searchTermChecklist || selectedAspekForChecklist !== 'all' 
                            ? 'Coba ubah filter atau pencarian' 
                            : 'Tambahkan dokumen GCG pertama untuk tahun ' + selectedYear}
                        </p>
                      </div>
                    )}
                    
                    {/* Info jumlah item yang ditampilkan */}
                    {filteredChecklistItems.length > 0 && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Menampilkan {displayedChecklistItems.length} dari {filteredChecklistItems.length} checklist
                        {filteredChecklistItems.length > 100 && (
                          <span className="block mt-1 text-xs text-gray-400">
                            (Maksimal 100 item ditampilkan untuk performa optimal)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog Tambah Aspek */}
      <FormDialog
        isOpen={isAddAspekDialogOpen}
        onClose={() => setIsAddAspekDialogOpen(false)}
        onSubmit={handleAddAspek}
        title="Tambah Aspek"
        description={`Tambahkan aspek baru untuk tahun ${selectedYear}`}
        variant="add"
        submitText="Tambah Aspek"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="nama-aspek">Nama Aspek</Label>
            <Input
              id="nama-aspek"
              value={aspekForm.nama}
              onChange={(e) => setAspekForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Masukkan nama aspek..."
              required
            />
          </div>
          <div>
            <Label htmlFor="deskripsi-aspek">Deskripsi (Opsional)</Label>
            <Textarea
              id="deskripsi-aspek"
              value={aspekForm.deskripsi}
              onChange={(e) => setAspekForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Masukkan deskripsi aspek..."
              rows={3}
            />
          </div>
        </div>
      </FormDialog>

      {/* Dialog Edit Aspek */}
      <FormDialog
        isOpen={isEditAspekDialogOpen}
        onClose={() => setIsEditAspekDialogOpen(false)}
        onSubmit={handleEditAspek}
        title="Edit Aspek"
        description={`Edit aspek untuk tahun ${selectedYear}`}
        variant="edit"
        submitText="Update Aspek"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-nama-aspek">Nama Aspek</Label>
            <Input
              id="edit-nama-aspek"
              value={aspekForm.nama}
              onChange={(e) => setAspekForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Masukkan nama aspek..."
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-deskripsi-aspek">Deskripsi (Opsional)</Label>
            <Textarea
              id="edit-deskripsi-aspek"
              value={aspekForm.deskripsi}
              onChange={(e) => setAspekForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Masukkan deskripsi aspek..."
              rows={3}
            />
          </div>
        </div>
      </FormDialog>

      {/* Dialog Tambah Checklist */}
      <FormDialog
        isOpen={isAddChecklistDialogOpen}
        onClose={() => setIsAddChecklistDialogOpen(false)}
        onSubmit={handleAddChecklist}
        title="Tambah Dokumen GCG"
        description={`Tambahkan dokumen GCG baru untuk tahun ${selectedYear}`}
        variant="add"
        submitText="Tambah Dokumen GCG"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="aspek-checklist">Aspek</Label>
            <Select value={checklistForm.aspek} onValueChange={(value) => setChecklistForm(prev => ({ ...prev, aspek: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih aspek" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
                  const uniqueAspek = [...new Set(yearChecklist.map(item => item.aspek))];
                  return uniqueAspek.map(aspekName => (
                    <SelectItem key={aspekName} value={aspekName}>{aspekName}</SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deskripsi-checklist">Deskripsi</Label>
            <Textarea
              id="deskripsi-checklist"
              value={checklistForm.deskripsi}
              onChange={(e) => setChecklistForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Masukkan deskripsi checklist..."
              rows={3}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Dialog Edit Checklist */}
      <FormDialog
        isOpen={isEditChecklistDialogOpen}
        onClose={() => setIsEditChecklistDialogOpen(false)}
        onSubmit={handleEditDokumenGCG}
        title="Edit Dokumen GCG"
        description={`Edit dokumen GCG untuk tahun ${selectedYear}`}
        variant="edit"
        submitText="Update Dokumen GCG"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-aspek-checklist">Aspek</Label>
            <Select value={checklistForm.aspek} onValueChange={(value) => setChecklistForm(prev => ({ ...prev, aspek: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih aspek" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
                  const uniqueAspek = [...new Set(yearChecklist.map(item => item.aspek))];
                  return uniqueAspek.map(aspekName => (
                    <SelectItem key={aspekName} value={aspekName}>{aspekName}</SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-deskripsi-checklist">Deskripsi</Label>
            <Textarea
              id="edit-deskripsi-checklist"
              value={checklistForm.deskripsi}
              onChange={(e) => setChecklistForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Masukkan deskripsi checklist..."
              rows={3}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        checklistId={selectedChecklistItem?.id}
        checklistDescription={selectedChecklistItem?.deskripsi}
        aspect={selectedChecklistItem?.aspek}
      />
    </div>
  );
};

export default MonitoringUploadGCG; 