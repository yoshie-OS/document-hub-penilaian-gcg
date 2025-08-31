import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useDirektorat } from '@/contexts/DireksiContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useYear } from '@/contexts/YearContext';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Eye, 
  Download, 
  Calendar,
  Building2,
  User,
  FileDown,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle,
  Circle,
  Lock,
  Save,
  Users
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconButton, TableActions, ActionButton, DocumentFilterPanel } from '@/components/panels';

interface DocumentListProps {
  year?: number;
  showFilters?: boolean;
  maxItems?: number;
  highlightDocumentId?: string | null;
  filterYear?: number;
  filterType?: string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  year, 
  showFilters = true, 
  maxItems,
  highlightDocumentId,
  filterYear,
  filterType
}) => {
  const { documents, getDocumentsByYear, deleteDocument, updateDocument, refreshDocuments } = useDocumentMetadata();
  const { deleteFileByFileName, refreshFiles } = useFileUpload();
  const { selectedYear } = useYear();
  const { checklist } = useChecklist();
  const { direktorat } = useDirektorat();
  const { direktorat: direktoratsCtx, subdirektorat: subdirektoratsCtx } = useStrukturPerusahaan();
  
  // Transform object arrays to string arrays for display
  const direktorats = useMemo(() => {
    if (!direktoratsCtx || !Array.isArray(direktoratsCtx)) return [];
    if (!selectedYear) return [];
    
    try {
      return direktoratsCtx
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing direktorat data:', error);
      return [];
    }
  }, [direktoratsCtx, selectedYear]);
  
  const subDirektorats = useMemo(() => {
    if (!subdirektoratsCtx || !Array.isArray(subdirektoratsCtx)) return [];
    if (!selectedYear) return [];
    
    try {
      return subdirektoratsCtx
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing subdirektorat data:', error);
      return [];
    }
  }, [subdirektoratsCtx, selectedYear]);
  

  const { toast } = useToast();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirektorat, setSelectedDirektorat] = useState('all');
  const [selectedSubDirektorat, setSelectedSubDirektorat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [aspectFilter, setAspectFilter] = useState<string | null>(null);
  // Dokumen GCG filter state
  const [filterChecklistStatus, setFilterChecklistStatus] = useState<'all' | 'with' | 'without'>('all');
  const [filterChecklistAspect, setFilterChecklistAspect] = useState<string>('all');
  
  // View document state
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Edit document state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Highlight state for fade effect
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Set year filter if provided
  React.useEffect(() => {
    if (filterYear && filterYear !== selectedYear) {
      // setSelectedYear(filterYear); // This line is removed as per the new_code
    }
  }, [filterYear, selectedYear]); // Removed setSelectedYear from dependency array

  // Handle highlight fade effect
  React.useEffect(() => {
    if (highlightDocumentId) {
      setIsHighlighted(true);
      
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlightDocumentId]);

  // Listen for localStorage changes to refresh documents
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'documentMetadata') {
        refreshDocuments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshDocuments]);

  // Get documents for the specified year or selected year
  const targetYear = year || selectedYear || new Date().getFullYear();
  const yearDocuments = useMemo(() => {
    return getDocumentsByYear(targetYear);
  }, [getDocumentsByYear, targetYear]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = yearDocuments;

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }



    if (selectedDirektorat !== 'all') {
      filtered = filtered.filter(doc => doc.direktorat === selectedDirektorat);
    }

    if (selectedSubDirektorat !== 'all') {
      filtered = filtered.filter(doc => doc.subdirektorat === selectedSubDirektorat);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    // Dokumen GCG status filter
    if (filterChecklistStatus === 'with') {
      filtered = filtered.filter(doc => !!doc.checklistId);
    } else if (filterChecklistStatus === 'without') {
      filtered = filtered.filter(doc => !doc.checklistId);
    }

    // Dokumen GCG aspect filter
    if (filterChecklistAspect !== 'all') {
      filtered = filtered.filter(doc => {
        if (!doc.checklistId) return false;
        const item = checklist.find(c => c.id === doc.checklistId);
        return item && item.aspek === filterChecklistAspect;
      });
    }

    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }, [yearDocuments, searchTerm, selectedPrinciple, selectedType, selectedDirektorat, selectedSubDirektorat, selectedStatus, filterChecklistStatus, filterChecklistAspect, checklist, maxItems]);

  // Scroll to highlighted document
  React.useEffect(() => {
    if (highlightDocumentId && isHighlighted) {
      const element = document.getElementById(`document-${highlightDocumentId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 500); // Delay to ensure component is rendered
      }
    }
  }, [highlightDocumentId, isHighlighted, filteredDocuments]);

  // Get unique values for filters
  const principles = useMemo(() => [...new Set(yearDocuments.map(doc => doc.gcgPrinciple))], [yearDocuments]);
  const types = useMemo(() => [...new Set(yearDocuments.map(doc => doc.documentType))], [yearDocuments]);
  // Data direktorat dan subdirektorat sudah didapat dari context
  const statuses = useMemo(() => [...new Set(yearDocuments.map(doc => doc.status))], [yearDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get checklist information
  const getChecklistInfo = (checklistId: number) => {
    const checklistItem = checklist.find(item => item.id === checklistId);
    return checklistItem;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { variant: 'outline', className: 'text-yellow-600 border-yellow-300' },
      'review': { variant: 'outline', className: 'text-blue-600 border-blue-300' },
      'approved': { variant: 'default', className: 'bg-green-100 text-green-700 border-green-200' },
      'rejected': { variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant as any} className={`text-xs ${config.className}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getConfidentialityBadge = (level: string) => {
    const levelConfig = {
      'public': { variant: 'outline', className: 'text-green-600 border-green-300' },
      'confidential': { variant: 'outline', className: 'text-red-600 border-red-300' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.public;
    
    return (
      <Badge variant={config.variant as any} className={`text-xs ${config.className}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  // Function to check if klasifikasi is active
  const isKlasifikasiActive = (nama: string, tipe: 'prinsip' | 'jenis' | 'kategori') => {
    return klasifikasiData.some(item => 
      item.nama === nama && 
      item.tipe === tipe && 
      item.isActive
    );
  };

  // Function to get klasifikasi badge with proper styling
  const getKlasifikasiBadge = (nama: string, tipe: 'prinsip' | 'jenis' | 'kategori') => {
    const isActive = isKlasifikasiActive(nama, tipe);
    
    const baseClasses = "text-xs";
    const activeClasses = {
      'prinsip': 'bg-purple-50 border-purple-200 text-purple-700',
      'jenis': 'bg-blue-50 border-blue-200 text-blue-700',
      'kategori': 'bg-green-50 border-green-200 text-green-700'
    };
    const inactiveClasses = 'bg-gray-100 border-gray-300 text-gray-500 opacity-60';
    
    const className = isActive 
      ? `${baseClasses} ${activeClasses[tipe]}` 
      : `${baseClasses} ${inactiveClasses}`;
    
    return (
      <Badge variant="outline" className={className}>
        {nama}
      </Badge>
    );
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      // Find the document to get its fileName for FileUploadContext deletion
      const documentToDelete = documents.find(doc => doc.id === id);
      
      if (documentToDelete) {
        // Delete from DocumentMetadataContext
        deleteDocument(id);
        
        // Delete from FileUploadContext using fileName
        deleteFileByFileName(documentToDelete.fileName);
        
        // Also manually remove from localStorage to ensure consistency
        const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
        const updatedFiles = savedFiles.filter((file: any) => file.fileName !== documentToDelete.fileName);
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
        
        // Force refresh both contexts to ensure data is synchronized
        setTimeout(() => {
          refreshDocuments();
          refreshFiles();
        }, 100);
      }
    }
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setEditFormData({
      title: doc.title,
      documentNumber: doc.documentNumber || '',
      description: doc.description || '',
      gcgPrinciple: doc.gcgPrinciple,
      documentType: doc.documentType,
      documentCategory: doc.documentCategory || '',
              direktorat: doc.direktorat,
        subdirektorat: doc.subdirektorat,
      division: doc.division || '',
      status: doc.status,
      confidentiality: doc.confidentiality,
      checklistId: doc.checklistId || null
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingDocument && updateDocument) {
      updateDocument(editingDocument.id, editFormData);
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      setEditFormData({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingDocument(null);
    setEditFormData({});
  };

  // Email revision functionality
  const handleRevisionEmail = (doc: any) => {
    try {
      // Get current user info for sender
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const senderEmail = currentUser.email || 'user@example.com';
      const senderName = currentUser.name || 'User';
      
      // Helper function to format empty values
      const formatValue = (value: any) => {
        return value && value.trim() !== '' ? value : '-';
      };
      
      // Prepare email content with better formatting
      const subject = encodeURIComponent(`Revisi Dokumen: ${doc.title}`);
      const body = encodeURIComponent(`Halo,

Saya ingin mengajukan revisi untuk dokumen berikut:

**INFORMASI DOKUMEN:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Judul Dokumen:** ${formatValue(doc.title)}
• **Nomor Dokumen:** ${formatValue(doc.documentNumber)}
• **Direktorat:** ${formatValue(doc.direktorat)}
• **Subdirektorat:** ${formatValue(doc.subdirektorat)}
• **Divisi:** ${formatValue(doc.division)}
• **Prinsip GCG:** ${formatValue(doc.gcgPrinciple)}
• **Jenis Dokumen:** ${formatValue(doc.documentType)}
• **Kategori:** ${formatValue(doc.documentCategory)}
• **Status:** ${formatValue(doc.status)}
• **Tanggal Upload:** ${new Date(doc.uploadDate).toLocaleDateString('id-ID')}

**ALASAN REVISI:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Silakan isi alasan revisi di sini]

**PERMINTAAN:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Silakan isi permintaan revisi di sini]

Terima kasih atas perhatiannya.

Salam,
${senderName}
${senderEmail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dikirim dari GCG Document Hub
Tahun: ${doc.year || new Date().getFullYear()}`);

      // Open Gmail web directly (default behavior)
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank');
      
      toast({
        title: "Gmail Web dibuka",
        description: `Draft email revisi untuk "${doc.title}" telah dibuka di Gmail Web`,
      });
    } catch (error) {
      console.error('Email revision error:', error);
      toast({
        title: "Gagal membuka Gmail",
        description: "Terjadi kesalahan saat membuka Gmail Web",
        variant: "destructive"
      });
    }
  };



  // Download functionality
  const handleDownloadDocument = useCallback((doc: any) => {
    try {
      // Create a blob from the file data (simulated for now)
      const blob = new Blob(['Document content'], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName || `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success toast
      toast({
        title: "Download berhasil",
        description: `File ${doc.fileName} berhasil diunduh`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download gagal",
        description: "Terjadi kesalahan saat mengunduh file",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Ultra-optimized event handlers with debouncing
  const handleEditInputChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => {
      // Only update if value actually changed
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleEditSelectChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => {
      // Only update if value actually changed
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingDocument(null);
    setEditFormData({});
  }, []);

  const handleOpenEditDialog = useCallback((doc: any) => {
    setEditingDocument(doc);
    setEditFormData({
      title: doc.title || '',
      documentNumber: doc.documentNumber || '',
      documentDate: doc.documentDate || '',
      description: doc.description || '',
      gcgPrinciple: doc.gcgPrinciple || '',
      documentType: doc.documentType || '',
      documentCategory: doc.documentCategory || '',
              direktorat: doc.direktorat || '',
        subdirektorat: doc.subdirektorat || '',
      division: doc.division || '',
      status: doc.status || 'draft',
      confidentiality: doc.confidentiality || 'public'
    });
    setIsEditDialogOpen(true);
  }, []);

  if (!targetYear) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pilih Tahun Buku
          </h3>
          <p className="text-gray-600">
            Silakan pilih tahun buku untuk melihat dokumen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daftar Arsip Dokumen</h2>
            <p className="text-sm text-gray-600">
              {filteredDocuments.length} dokumen ditemukan untuk tahun {targetYear}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <DocumentFilterPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPrinciple={selectedPrinciple}
            onPrincipleChange={setSelectedPrinciple}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedDirektorat={selectedDirektorat}
            onDirektoratChange={setSelectedDirektorat}
            selectedSubDirektorat={selectedSubDirektorat}
            onSubDirektoratChange={setSelectedSubDirektorat}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            filterChecklistStatus={filterChecklistStatus}
            onChecklistStatusChange={setFilterChecklistStatus}
            filterChecklistAspect={filterChecklistAspect}
            onChecklistAspectChange={setFilterChecklistAspect}
            principles={principles}
            types={types}
            direktorats={direktorats}
            subDirektorats={subDirektorats}
            aspects={Array.from(new Set(checklist.map(item => item.aspek)))}
            onResetFilters={() => {
              setSearchTerm('');
              setSelectedPrinciple('all');
              setSelectedType('all');
              setSelectedDirektorat('all');
              setSelectedSubDirektorat('all');
              setSelectedStatus('all');
                  setFilterChecklistStatus('all');
                  setFilterChecklistAspect('all');
                }}
          />
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <div 
            key={doc.id} 
            id={`document-${doc.id}`}
            className={`bg-white border rounded-lg p-6 hover:shadow-md transition-all duration-500 ease-in-out ${
              highlightDocumentId === doc.id && isHighlighted
                ? 'border-2 border-blue-500 shadow-lg bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    {doc.documentNumber && (
                      <p className="text-sm text-gray-600 mt-1">
                        No. {doc.documentNumber}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                {doc.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {doc.description}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadDocument(doc)}
                  className="hover:bg-green-50 hover:border-green-200"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Unduh
                </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenEditDialog(doc)}
                    className="hover:bg-yellow-50 hover:border-yellow-200"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleRevisionEmail(doc)}
                    className="hover:bg-blue-50 hover:border-blue-200"
                    title="Buka Gmail Web untuk revisi dokumen"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Revisi (Gmail)
                  </Button>
                  
                  
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hapus
                  </Button>
                </Dialog>
              </div>
            </div>
            
            {/* Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
              {/* GCG Classification */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Klasifikasi GCG</span>
                </div>
                <div className="space-y-1">
                  {getKlasifikasiBadge(doc.gcgPrinciple, 'prinsip')}
                  {getKlasifikasiBadge(doc.documentType, 'jenis')}
                  {doc.documentCategory && getKlasifikasiBadge(doc.documentCategory, 'kategori')}
                </div>
              </div>
              
              {/* Organization */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Organisasi</span>
                </div>
                <div className="space-y-1">
                  {/* Direktorat */}
                  <div className="text-sm font-medium text-gray-900">
                    <Building2 className="w-3 h-3 inline mr-1" />
                    {doc.direktorat || 'Tidak ada data'}
                  </div>
                  {/* Sub Direktorat */}
                  <div className="text-xs text-gray-700">
                    <Users className="w-3 h-3 inline mr-1" />
                    {doc.subdirektorat || 'Tidak ada data'}
                  </div>
                  {/* Divisi */}
                  <div className="text-xs text-gray-600">
                    <User className="w-3 h-3 inline mr-1" />
                    {doc.division || 'Tidak ada data'}
                  </div>
                </div>
              </div>
              
              {/* Status & Upload Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Status</span>
                </div>
                <div className="space-y-1">
                  {getStatusBadge(doc.status)}
                  {getConfidentialityBadge(doc.confidentiality)}
                </div>
              </div>
              
              {/* Upload Info & Dokumen GCG */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Info Upload</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-900">
                    <User className="w-3 h-3 inline mr-1" />
                    {doc.uploadedBy}
                  </div>
                  <div className="text-xs text-gray-600">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatDate(doc.uploadDate)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {doc.fileName}
                  </div>
                </div>
              </div>
              
              {/* Dokumen GCG */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Dokumen GCG</span>
                </div>
                <div className="space-y-1">
                  {doc.checklistId ? (
                    <div className="space-y-1">
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Terpilih
                      </Badge>
                      {(() => {
                        const checklistInfo = getChecklistInfo(doc.checklistId);
                        return checklistInfo ? (
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div className="font-medium">{checklistInfo.aspek}</div>
                            <div className="text-gray-500 truncate">{checklistInfo.deskripsi}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">ID: {doc.checklistId}</div>
                        );
                      })()}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                      <Circle className="w-3 h-3 mr-1" />
                      Tanpa Dokumen GCG
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada dokumen ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kriteria pencarian atau filter Anda
            </p>
          </div>
        )}

        {/* Document Detail Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Detail Dokumen</span>
              </DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informasi Dasar
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Judul Dokumen</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nomor Dokumen</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.documentNumber || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tanggal Dokumen</Label>
                      <p className="text-sm text-gray-900">{formatDate(selectedDocument.documentDate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.description || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* GCG Classification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Klasifikasi GCG
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Prinsip GCG</Label>
                      <div className="mt-1">
                        {getKlasifikasiBadge(selectedDocument.gcgPrinciple, 'prinsip')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Jenis Dokumen</Label>
                      <div className="mt-1">
                        {getKlasifikasiBadge(selectedDocument.documentType, 'jenis')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                      <div className="mt-1">
                        {selectedDocument.documentCategory ? 
                          getKlasifikasiBadge(selectedDocument.documentCategory, 'kategori') : 
                          <span className="text-sm text-gray-500">-</span>
                        }
                      </div>
                    </div>
                  </div>
                  {/* Dokumen GCG Info */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Dokumen GCG</Label>
                    {selectedDocument.checklistId ? (() => {
                      const checklistItem = checklist.find(item => item.id === selectedDocument.checklistId);
                      return checklistItem ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Dokumen GCG Terpilih</span>
                          </div>
                          <div className="text-sm text-green-700">
                            <div className="font-medium">{checklistItem.aspek}</div>
                            <div>{checklistItem.deskripsi}</div>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">ID: {selectedDocument.checklistId}</Badge>
                      );
                    })() : (
                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                        <Circle className="w-3 h-3 mr-1" />
                        Tanpa Dokumen GCG
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Organisasi
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                                      <Label className="text-sm font-medium text-gray-700">Direktorat</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.direktorat || 'Tidak ada data'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Sub Direktorat</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.subdirektorat || 'Tidak ada data'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Divisi</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.division || 'Tidak ada data'}</p>
                    </div>
                  </div>
                </div>

                {/* File Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informasi File
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nama File</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.fileName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ukuran File</Label>
                      <p className="text-sm text-gray-900">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                  </div>
                </div>

                {/* Document Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Pengelolaan Dokumen
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Kerahasiaan</Label>
                      <div className="mt-1">{getConfidentialityBadge(selectedDocument.confidentiality)}</div>
                    </div>
                  </div>
                </div>

                {/* Upload Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informasi Upload
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Diupload oleh</Label>
                      <p className="text-sm text-gray-900">{selectedDocument.uploadedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tanggal Upload</Label>
                      <p className="text-sm text-gray-900">{formatDate(selectedDocument.uploadDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buka File
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Unduh
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleRevisionEmail(selectedDocument)}
                    className="hover:bg-blue-50 hover:border-blue-200"
                    title="Buka Gmail Web untuk revisi dokumen"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Revisi (Gmail)
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Dokumen</span>
              </DialogTitle>
              <DialogDescription>
                Edit informasi metadata dokumen. File tidak dapat diubah.
              </DialogDescription>
            </DialogHeader>
            
            {editingDocument && (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                  {/* Tahun Buku (Read Only) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      Tahun Buku
                      <span className="group relative">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs bg-gray-700 text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                          Field ini tidak dapat diubah
                        </span>
                      </span>
                    </Label>
                    <Input
                      value={editingDocument.year}
                      disabled
                      className="bg-gray-100 text-gray-500 border-dashed border-2 border-gray-300 cursor-not-allowed"
                    />
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Informasi Dasar
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editTitle">
                          Judul Dokumen <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editTitle"
                          value={editFormData.title || ''}
                          onChange={(e) => {
                            // Debounce the input change
                            const value = e.target.value;
                            setTimeout(() => handleEditInputChange('title', value), 100);
                          }}
                          placeholder="Masukkan judul dokumen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDocumentNumber">
                          Nomor Dokumen
                        </Label>
                        <Input
                          id="editDocumentNumber"
                          value={editFormData.documentNumber || ''}
                          onChange={(e) => {
                            // Debounce the input change
                            const value = e.target.value;
                            setTimeout(() => handleEditInputChange('documentNumber', value), 100);
                          }}
                          placeholder="Masukkan nomor dokumen"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="editDescription">
                          Deskripsi
                        </Label>
                        <Textarea
                          id="editDescription"
                          value={editFormData.description || ''}
                          onChange={(e) => {
                            // Debounce the textarea change
                            const value = e.target.value;
                            setTimeout(() => handleEditInputChange('description', value), 150);
                          }}
                          placeholder="Masukkan deskripsi dokumen"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* GCG Classification */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Klasifikasi GCG
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editGcgPrinciple">
                          Prinsip GCG <span className="text-red-500">*</span>
                        </Label>
                        <Select value={editFormData.gcgPrinciple || ''} onValueChange={(value) => handleEditSelectChange('gcgPrinciple', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih prinsip GCG" />
                          </SelectTrigger>
                          <SelectContent>
                            {klasifikasiPrinsip.map((prinsip) => (
                              <SelectItem key={prinsip} value={prinsip}>{prinsip}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDocumentType">
                          Jenis Dokumen <span className="text-red-500">*</span>
                        </Label>
                        <Select value={editFormData.documentType || ''} onValueChange={(value) => handleEditSelectChange('documentType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis dokumen" />
                          </SelectTrigger>
                          <SelectContent>
                            {klasifikasiJenis.map((jenis) => (
                              <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDocumentCategory">
                          Kategori Dokumen
                        </Label>
                        <Select value={editFormData.documentCategory || ''} onValueChange={(value) => handleEditSelectChange('documentCategory', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori dokumen" />
                          </SelectTrigger>
                          <SelectContent>
                            {klasifikasiKategori.map((kategori) => (
                              <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Organisasi
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editDirektorat">
                          Direktorat <span className="text-red-500">*</span>
                        </Label>
                        <Select value={editFormData.direktorat || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, direktorat: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                            {direktorat && direktorat.length > 0 ? (
                              direktorat.map((dir) => (
                                <SelectItem key={dir.id} value={dir.nama}>
                                  {dir.nama}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-data" disabled>
                                Tidak ada data direktorat
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editSubDirektorat">
                          Sub Direktorat
                        </Label>
                        <Input
                          id="editSubDirektorat"
                          value={editFormData.subdirektorat || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, subdirektorat: e.target.value }))}
                          placeholder="Masukkan sub direktorat"
                          list="subdirektorat-suggestions"
                        />
                        <datalist id="subdirektorat-suggestions">
                          <option value="Subdirektorat Akuntansi" />
                          <option value="Subdirektorat Perpajakan" />
                          <option value="Subdirektorat Rekrutmen" />
                          <option value="Subdirektorat Pengembangan" />
                          <option value="Subdirektorat Infrastruktur" />
                          <option value="Subdirektorat Aplikasi" />
                        </datalist>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDivision">
                          Divisi <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editDivision"
                          value={editFormData.division || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, division: e.target.value }))}
                          placeholder="Masukkan divisi"
                          list="division-suggestions"
                        />
                        <datalist id="division-suggestions">
                          <option value="Divisi Keuangan" />
                          <option value="Divisi SDM" />
                          <option value="Divisi IT" />
                          <option value="Divisi Operasional" />
                          <option value="Divisi Pemasaran" />
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Document Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Pengelolaan Dokumen
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editStatus">
                          Status
                        </Label>
                        <Select value={editFormData.status || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editConfidentiality">
                          Tingkat Kerahasiaan
                        </Label>
                        <Select value={editFormData.confidentiality || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, confidentiality: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat kerahasiaan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="confidential">Rahasia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                                    {/* Dokumen GCG */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Pilih Dokumen GCG (Opsional)
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Pilih satu dokumen GCG yang sesuai dengan dokumen. 
                        Dokumen GCG yang sudah digunakan di tahun {editingDocument.year} tidak akan muncul di daftar.
                      </p>
                      {/* Aspect Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filter berdasarkan Aspek:</Label>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={!aspectFilter ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setAspectFilter('')}
                          >
                            Semua
                          </Badge>
                          {(() => {
                            const aspects = [...new Set(checklist.map(item => item.aspek))];
                            return aspects.map((aspect) => (
                              <Badge
                                key={aspect}
                                variant={aspectFilter === aspect ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => setAspectFilter(aspect)}
                              >
                                {aspect.replace(/^Aspek\s+/i, '')}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>

                      
                      <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                        {(() => {
                          const availableItems = checklist.filter(item => {
                            // Filter out items already used in the same year (kecuali yang sedang diedit)
                            const isUsed = documents.some(doc =>
                              doc.checklistId === item.id &&
                              doc.year === editingDocument.year &&
                              doc.id !== editingDocument.id
                            );
                            // Filter by aspect
                            if (aspectFilter && item.aspek !== aspectFilter) return false;
                            return !isUsed;
                          }).sort((a, b) => a.aspek.localeCompare(b.aspek));
                          return availableItems.length > 0 ? (
                            availableItems.slice(0, 50).map((item) => (
                              <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`edit-checklist-${item.id}`}
                                  checked={editFormData.checklistId === item.id}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditFormData(prev => ({
                                        ...prev,
                                        checklistId: item.id
                                      }));
                                    } else {
                                      setEditFormData(prev => ({
                                        ...prev,
                                        checklistId: null
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`edit-checklist-${item.id}`} className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-gray-900 flex-1">
                                      {item.deskripsi}
                                    </div>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {item.aspek.replace(/^Aspek\s+/i, '')}
                                    </Badge>
                                  </div>
                                </Label>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              {aspectFilter 
                                ? `Tidak ada dokumen GCG tersedia untuk ${aspectFilter.replace(/^Aspek\s+/i, '')}`
                                : `Semua dokumen GCG untuk tahun ${editingDocument.year} sudah digunakan`
                              }
                            </p>
                          );
                        })()}
                      </div>
                      
                      {/* Selected Dokumen GCG Info */}
                      {editFormData.checklistId && (() => {
                        const selectedItem = checklist.find(item => item.id === editFormData.checklistId);
                        return selectedItem ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Checklist Terpilih
                              </span>
                            </div>
                            <div className="text-sm text-green-700">
                              <div className="font-medium">{selectedItem.aspek}</div>
                              <div>{selectedItem.deskripsi}</div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <ActionButton
                onClick={handleCancelEdit}
                variant="outline"
              >
                Batal
              </ActionButton>
              <ActionButton
                onClick={handleSaveEdit}
                variant="default"
                icon={<Save className="w-4 h-4" />}
              >
                Simpan Perubahan
              </ActionButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentList; 