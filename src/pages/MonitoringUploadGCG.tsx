import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';



import { useChecklist } from '@/contexts/ChecklistContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useYear } from '@/contexts/YearContext';

import { useToast } from '@/hooks/use-toast';
import FileUploadDialog from '@/components/dashboard/FileUploadDialog';
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
} from 'lucide-react';



// ChecklistAssignment interface dan SUBDIREKTORAT_OPTIONS removed - fitur assign sudah ada di Pengaturan Baru

// AssignmentDropdown component removed - fitur assign sudah ada di Pengaturan Baru



const MonitoringUploadGCG = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    checklist, 
    ensureAllYearsHaveData
  } = useChecklist();
  const { documents, getDocumentsByYear } = useDocumentMetadata();
  const { getFilesByYear } = useFileUpload();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear } = useYear();
  const { toast } = useToast();

  const [selectedAspek, setSelectedAspek] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    id: number;
    aspek: string;
    deskripsi: string;
  } | null>(null);
  
  // State untuk assignment dokumen GCG removed - fitur assign sudah ada di Pengaturan Baru
  

  

  




  // Ensure all years have dokumen GCG data when component mounts
  useEffect(() => {
    ensureAllYearsHaveData();
  }, [ensureAllYearsHaveData]);

  // Listen for real-time updates from PengaturanBaru
  useEffect(() => {
    const handleChecklistUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'checklistUpdated') {
        console.log('MonitoringUploadGCG: Received checklist update from PengaturanBaru', event.detail.data);
        // Force re-render by updating a dummy state
        setSearchTerm(prev => prev);
      }
    };

    const handleAspectsUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'aspectsUpdated') {
        console.log('MonitoringUploadGCG: Received aspects update from PengaturanBaru', event.detail.data);
        // Force re-render by updating a dummy state
        setSearchTerm(prev => prev);
      }
    };

    window.addEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
    window.addEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
      window.removeEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    };
  }, []);

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
            // Force re-render
            setSearchTerm(prev => prev);
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
    const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
    return [...new Set(yearChecklist.map(item => item.aspek))];
  }, [checklist, selectedYear]);



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







  // Handle upload button click
  const handleUploadClick = useCallback((item: { id: number; aspek: string; deskripsi: string }) => {
    setSelectedChecklistItem(item);
    setIsUploadDialogOpen(true);
  }, []);

  // Handle assignment removed - fitur assign sudah ada di Pengaturan Baru





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



          {/* Konten Rekap */}
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
                  <div className="text-sm text-gray-500 text-center py-8">
                    Fitur penugasan dokumen GCG telah dipindahkan ke menu "Pengaturan Baru" → "Kelola Dokumen"
                          </div>
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
                      {/* AssignmentDropdown removed - fitur assign sudah ada di Pengaturan Baru */}
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







        </div>
      </div>







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