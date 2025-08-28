import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel, YearSelectorPanel } from '@/components/panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { 
  FileText, 
  Download,
  MessageSquare,
  Archive,
  Building2,
  User,
  Calendar,
  Mail,
  Phone,
  FolderOpen,
  Filter
} from 'lucide-react';

interface DocumentWithUser {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  year: number;
  checklistId?: number;
  checklistDescription?: string;
  aspect?: string;
  status: 'uploaded' | 'pending';
  subdirektorat?: string;
  // User information
  uploadedBy: string;
  userRole: 'superadmin' | 'admin';
  userDirektorat?: string;
  userSubdirektorat?: string;
  userDivisi?: string;
  userWhatsApp?: string;
  userEmail?: string;
}

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { getFilesByYear } = useFileUpload();
  const { documents } = useDocumentMetadata();
  const { user } = useUser();
  const { direktorat: direktoratData, subdirektorat: subDirektoratData, divisi: divisiData } = useStrukturPerusahaan();

  // Filter states
  const [selectedDirektorat, setSelectedDirektorat] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [selectedSubdirektorat, setSelectedSubdirektorat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Get all documents with user information
  const allDocuments = useMemo(() => {
    try {
      // Get files from FileUploadContext
      const yearFiles = selectedYear ? getFilesByYear(selectedYear) : [];
      
      // Get documents from DocumentMetadataContext
      const yearDocuments = selectedYear ? documents.filter(doc => doc.year === selectedYear) : [];
      
      console.log('=== DEBUG ARSIP DOKUMEN ===');
      console.log('Selected Year:', selectedYear);
      console.log('Year Files (FileUploadContext):', yearFiles);
      console.log('Year Documents (DocumentMetadataContext):', yearDocuments);
      console.log('All Documents (DocumentMetadataContext):', documents);
      
      // Check localStorage for uploaded files
      const localStorageFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const yearLocalStorageFiles = selectedYear ? localStorageFiles.filter((f: any) => f.year === selectedYear) : [];
      console.log('LocalStorage Files for year:', yearLocalStorageFiles);
      
      // Check localStorage for document metadata
      const localStorageMetadata = JSON.parse(localStorage.getItem('documentMetadata') || '[]');
      const yearLocalStorageMetadata = selectedYear ? localStorageMetadata.filter((f: any) => f.year === selectedYear) : [];
      console.log('LocalStorage Metadata for year:', yearLocalStorageMetadata);
      
      // Combine and enrich with user information
      const enrichedDocuments: DocumentWithUser[] = yearFiles.map(file => {
        console.log('\n--- Processing File ---');
        console.log('File:', file);
        
        // Try multiple matching strategies
        console.log('\n--- Matching Process for', file.fileName, '---');
        console.log('File checklistId:', file.checklistId);
        console.log('File year:', file.year);
        
        let docMetadata = yearDocuments.find(doc => 
          doc.fileName === file.fileName && doc.year === file.year
        );
        console.log('Match by fileName + year:', docMetadata);
        
        // If no match found, try matching by checklistId
        if (!docMetadata && file.checklistId) {
          docMetadata = yearDocuments.find(doc => 
            doc.checklistId === file.checklistId && doc.year === file.year
          );
          console.log('Match by checklistId + year:', docMetadata);
        }
        
        // If still no match, try matching by fileName only
        if (!docMetadata) {
          docMetadata = yearDocuments.find(doc => 
            doc.fileName === file.fileName
          );
          console.log('Match by fileName only:', docMetadata);
        }
        
        // If still no match, try matching by checklistId only
        if (!docMetadata && file.checklistId) {
          docMetadata = yearDocuments.find(doc => 
            doc.checklistId === file.checklistId
          );
          console.log('Match by checklistId only:', docMetadata);
        }
        
        console.log('Final metadata match for', file.fileName, ':', docMetadata);

        // Determine user role and information
        let userRole: 'superadmin' | 'admin' = 'admin';
        let uploadedBy = 'Unknown User';
        let userDirektorat = '';
        let userSubdirektorat = '';
        let userDivisi = '';
        let userWhatsApp = '';
        let userEmail = '';

        if (docMetadata) {
          // This is from admin upload
          userRole = 'admin';
          uploadedBy = docMetadata.uploadedBy || 'Unknown Admin';
          userDirektorat = docMetadata.direktorat || '';
          userSubdirektorat = docMetadata.subdirektorat || '';
          userDivisi = docMetadata.division || '';
          
          console.log('✅ Admin upload detected:', {
            uploadedBy,
            userDirektorat,
            userSubdirektorat,
            userDivisi
          });
          
          // Get user details from localStorage or context
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          console.log('Users in localStorage:', users);
          const userData = users.find((u: any) => u.name === docMetadata.uploadedBy);
          if (userData) {
            userWhatsApp = userData.whatsapp || '';
            userEmail = userData.email || '';
            console.log('✅ User data found:', userData);
          } else {
            console.log('❌ User data NOT found for:', docMetadata.uploadedBy);
          }
        } else {
          // This is from superadmin upload
          userRole = 'superadmin';
          uploadedBy = 'Superadmin';
          userDirektorat = 'Superadmin';
          userSubdirektorat = 'Superadmin';
          userDivisi = 'Superadmin';
          
          console.log('❌ Superadmin upload detected for:', file.fileName);
          console.log('Reason: No matching metadata found');
        }

        const enrichedDoc = {
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          uploadDate: file.uploadDate,
          year: file.year,
          checklistId: file.checklistId,
          checklistDescription: file.checklistDescription,
          aspect: file.aspect,
          status: file.status,
          subdirektorat: file.subdirektorat,
          uploadedBy,
          userRole,
          userDirektorat,
          userSubdirektorat,
          userDivisi,
          userWhatsApp,
          userEmail
        };
        
        console.log('Final enriched document:', enrichedDoc);
        return enrichedDoc;
      });

      console.log('\n=== FINAL RESULT ===');
      console.log('Final enriched documents:', enrichedDocuments);
      console.log('=== END DEBUG ===\n');
      
      return enrichedDocuments.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } catch (error) {
      console.error('Error processing documents:', error);
      return [];
    }
  }, [selectedYear, getFilesByYear, documents]);

  // Filter documents based on selected criteria
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Filter by direktorat
    if (selectedDirektorat) {
      filtered = filtered.filter(doc => doc.userDirektorat === selectedDirektorat);
    }

    // Filter by aspect
    if (selectedAspect) {
      filtered = filtered.filter(doc => doc.aspect === selectedAspect);
    }

    // Filter by subdirektorat
    if (selectedSubdirektorat) {
      filtered = filtered.filter(doc => doc.userSubdirektorat === selectedSubdirektorat);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.aspect?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.checklistDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allDocuments, selectedDirektorat, selectedAspect, selectedSubdirektorat, searchTerm]);

  // Get unique values for filters
  const uniqueDirektorats = useMemo(() => {
    const direktorats = [...new Set(allDocuments.map(doc => doc.userDirektorat))];
    return direktorats.filter(Boolean).sort();
  }, [allDocuments]);

  const uniqueAspects = useMemo(() => {
    const aspects = [...new Set(allDocuments.map(doc => doc.aspect))];
    return aspects.filter(Boolean).sort();
  }, [allDocuments]);

  const uniqueSubdirektorats = useMemo(() => {
    const subdirektorats = [...new Set(allDocuments.map(doc => doc.userSubdirektorat))];
    return subdirektorats.filter(Boolean).sort();
  }, [allDocuments]);

  // Handle revision (WhatsApp or Email)
  const handleRevision = (document: DocumentWithUser) => {
    if (document.userWhatsApp) {
      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${document.userWhatsApp.replace(/[^0-9]/g, '')}`;
      window.open(whatsappUrl, '_blank');
    } else if (document.userEmail) {
      // Open email client
      const emailUrl = `mailto:${document.userEmail}?subject=Revisi Dokumen: ${document.fileName}&body=Halo, saya ingin merevisi dokumen ${document.fileName} yang telah diupload.`;
      window.open(emailUrl, '_blank');
    } else {
      alert('Tidak ada kontak WhatsApp atau email yang tersedia untuk user ini.');
    }
  };

  // Handle download single document
  const handleDownload = (doc: DocumentWithUser) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['File content'], { type: 'application/octet-stream' }));
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle bulk download
  const handleBulkDownload = async (type: 'all' | 'direktorat' | 'aspect') => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Create download content based on type
      let downloadContent = '';
      let fileName = '';

      switch (type) {
        case 'all':
          fileName = `arsip_dokumen_${selectedYear}_semua.csv`;
          downloadContent = filteredDocuments.map(doc => 
            `${doc.fileName},${doc.uploadedBy},${doc.userDirektorat},${doc.userSubdirektorat},${doc.userDivisi},${doc.aspect},${doc.checklistDescription},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
          ).join('\n');
          break;
        case 'direktorat':
          if (selectedDirektorat) {
            fileName = `arsip_dokumen_${selectedYear}_${selectedDirektorat}.csv`;
            const direktoratDocs = filteredDocuments.filter(doc => doc.userDirektorat === selectedDirektorat);
            downloadContent = direktoratDocs.map(doc => 
              `${doc.fileName},${doc.uploadedBy},${doc.userDirektorat},${doc.userSubdirektorat},${doc.userDivisi},${doc.aspect},${doc.checklistDescription},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
            ).join('\n');
          }
          break;
        case 'aspect':
          if (selectedAspect) {
            fileName = `arsip_dokumen_${selectedYear}_${selectedAspect}.csv`;
            const aspectDocs = filteredDocuments.filter(doc => doc.aspect === selectedAspect);
            downloadContent = aspectDocs.map(doc => 
              `${doc.fileName},${doc.uploadedBy},${doc.userDirektorat},${doc.userSubdirektorat},${doc.userDivisi},${doc.aspect},${doc.checklistDescription},${new Date(doc.uploadDate).toLocaleDateString('id-ID')},${doc.status}`
            ).join('\n');
          }
          break;
      }

      // Create and download file
      const blob = new Blob([downloadContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Download berhasil! File ${fileName} berhasil diunduh.`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Terjadi kesalahan saat download file.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

          {/* Year Selector */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            title="Tahun Buku"
            description="Pilih tahun buku untuk melihat arsip dokumen yang tersedia"
          />

          {selectedYear ? (
            <div className="space-y-6">
              {/* Filters and Bulk Download */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Filter dan Download</span>
                  </CardTitle>
                  <CardDescription>
                    Filter dokumen dan download sesuai kriteria yang diinginkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Direktorat Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                        Direktorat
                      </label>
                      <Select value={selectedDirektorat || "all"} onValueChange={(value) => setSelectedDirektorat(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                          <SelectValue placeholder="Semua Direktorat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Direktorat</SelectItem>
                          {uniqueDirektorats.map(direktorat => (
                            <SelectItem key={direktorat} value={direktorat}>{direktorat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aspect Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                        Aspek
                      </label>
                      <Select value={selectedAspect || "all"} onValueChange={(value) => setSelectedAspect(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-colors">
                          <SelectValue placeholder="Semua Aspek" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Aspek</SelectItem>
                          {uniqueAspects.map(aspect => (
                            <SelectItem key={aspect} value={aspect}>{aspect}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subdirektorat Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-green-600" />
                        Subdirektorat
                      </label>
                      <Select value={selectedSubdirektorat || "all"} onValueChange={(value) => setSelectedSubdirektorat(value === "all" ? null : value)}>
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-green-300 focus:border-green-500 transition-colors">
                          <SelectValue placeholder="Semua Subdirektorat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Subdirektorat</SelectItem>
                          {uniqueSubdirektorats.map(subdirektorat => (
                            <SelectItem key={subdirektorat} value={subdirektorat}>{subdirektorat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-orange-600" />
                        Cari
                      </label>
                      <input
                        type="text"
                        placeholder="Cari dokumen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white hover:border-orange-300"
                      />
                    </div>
                  </div>

                  {/* Bulk Download Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => handleBulkDownload('all')}
                      disabled={isDownloading || filteredDocuments.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Semua ({filteredDocuments.length})
                    </Button>
                    
                    {selectedDirektorat && (
                      <Button 
                        onClick={() => handleBulkDownload('direktorat')}
                        disabled={isDownloading}
                        variant="outline"
                        className="border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download {selectedDirektorat}
                      </Button>
                    )}
                    
                    {selectedAspect && (
                      <Button 
                        onClick={() => handleBulkDownload('aspect')}
                        disabled={isDownloading}
                        variant="outline"
                        className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download {selectedAspect}
                      </Button>
                    )}
                  </div>

                  {/* Download Progress */}
                  {isDownloading && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between text-sm font-medium text-blue-800 mb-3">
                        <span className="flex items-center">
                          <Download className="h-4 w-4 mr-2 animate-pulse" />
                          Download Progress
                        </span>
                        <span className="bg-blue-100 px-3 py-1 rounded-full">{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Archive className="h-5 w-5" />
                    <span>Daftar Dokumen Tahun {selectedYear}</span>
                  </CardTitle>
                  <CardDescription>
                    Total {filteredDocuments.length} dokumen ditemukan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {filteredDocuments.map((doc) => (
                                                 <div key={doc.id} className="group relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border border-gray-200/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300/60 transition-all duration-500 transform hover:-translate-y-1">
                           {/* Decorative Background Elements */}
                           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                           
                           {/* Header Section with Enhanced Design */}
                           <div className="relative flex items-start justify-between mb-6">
                             <div className="flex items-center space-x-4">
                               <div className="relative">
                                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                                 <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                                   <FileText className="h-7 w-7 text-white" />
                                 </div>
                               </div>
                               <div className="space-y-2">
                                 <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                                   {doc.fileName}
                                 </h3>
                                 <div className="flex items-center space-x-3">
                                   <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 font-medium px-3 py-1">
                                     {formatFileSize(doc.fileSize)}
                                   </Badge>
                                   <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium px-3 py-1 shadow-sm">
                                     {doc.status}
                                   </Badge>
                                   <div className="flex items-center space-x-2 text-sm text-gray-600">
                                     <Calendar className="h-4 w-4" />
                                     <span className="font-medium">
                                       {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Enhanced Content Grid */}
                           <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                             {/* Left Column - User & Document Info */}
                             <div className="space-y-4">
                               {/* User Information Card */}
                               <div className="group/card relative bg-gradient-to-br from-white to-blue-50/50 rounded-xl p-5 border border-blue-100/60 hover:border-blue-200/80 hover:shadow-lg transition-all duration-300">
                                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                                 <div className="relative flex items-center space-x-3 mb-4">
                                   <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                                     <User className="h-5 w-5 text-white" />
                                   </div>
                                   <span className="text-sm font-semibold text-gray-800">Informasi Pengirim</span>
                                 </div>
                                 <div className="relative space-y-3">
                                   <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-blue-100/40">
                                     <span className="text-sm font-medium text-gray-700">Nama:</span>
                                     <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
                                       {doc.uploadedBy}
                                     </Badge>
                                   </div>
                                   {doc.userRole === 'admin' && (
                                     <>
                                       <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-blue-100/40">
                                         <span className="text-sm font-medium text-gray-700">Direktorat:</span>
                                         <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-sm">
                                           {doc.userDirektorat}
                                         </Badge>
                                       </div>
                                       <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-blue-100/40">
                                         <span className="text-sm font-medium text-gray-700">Subdirektorat:</span>
                                         <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium shadow-sm">
                                           {doc.userSubdirektorat}
                                         </Badge>
                                       </div>
                                     </>
                                   )}
                                 </div>
                               </div>

                               {/* Document Details Card */}
                               <div className="group/card relative bg-gradient-to-br from-white to-orange-50/50 rounded-xl p-5 border border-orange-100/60 hover:border-orange-200/80 hover:shadow-lg transition-all duration-300">
                                 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                                 <div className="relative flex items-center space-x-3 mb-4">
                                   <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg shadow-sm">
                                     <FileText className="h-5 w-5 text-white" />
                                   </div>
                                   <span className="text-sm font-semibold text-gray-800">Detail Dokumen</span>
                                 </div>
                                 <div className="relative">
                                   <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-100/40">
                                     <span className="text-sm font-medium text-gray-700">Aspek:</span>
                                     <Badge variant="outline" className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 text-orange-800 font-medium">
                                       {doc.aspect || 'Tidak Diberikan Aspek'}
                                     </Badge>
                                   </div>
                                 </div>
                               </div>
                             </div>

                             {/* Right Column - Contact Info & Additional Details */}
                             <div className="space-y-4">
                               {/* Contact Information Card */}
                               {doc.userRole === 'admin' && (doc.userWhatsApp || doc.userEmail) ? (
                                 <div className="group/card relative bg-gradient-to-br from-white to-green-50/50 rounded-xl p-5 border border-green-100/60 hover:border-green-200/80 hover:shadow-lg transition-all duration-300">
                                   <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                                   <div className="relative flex items-center space-x-3 mb-4">
                                     <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg shadow-sm">
                                       <MessageSquare className="h-5 w-5 text-white" />
                                     </div>
                                     <span className="text-sm font-semibold text-gray-800">Kontak</span>
                                   </div>
                                   <div className="relative space-y-3">
                                     {doc.userWhatsApp && (
                                       <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-100/40">
                                         <div className="flex items-center space-x-2">
                                           <Phone className="h-4 w-4 text-green-600" />
                                           <span className="text-sm font-medium text-gray-700">WhatsApp:</span>
                                         </div>
                                         <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-medium">
                                           {doc.userWhatsApp}
                                         </Badge>
                                       </div>
                                     )}
                                     {doc.userEmail && (
                                       <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-100/40">
                                         <div className="flex items-center space-x-2">
                                           <Mail className="h-4 w-4 text-blue-600" />
                                           <span className="text-sm font-medium text-gray-700">Email:</span>
                                         </div>
                                         <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
                                           {doc.userEmail}
                                         </Badge>
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               ) : (
                                 <div className="group/card relative bg-gradient-to-br from-white to-purple-50/50 rounded-xl p-5 border border-purple-100/60 hover:border-purple-200/80 hover:shadow-lg transition-all duration-300">
                                   <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                                   <div className="relative flex items-center space-x-3 mb-4">
                                     <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg shadow-sm">
                                       <FileText className="h-5 w-5 text-white" />
                                     </div>
                                     <span className="text-sm font-semibold text-gray-800">Status Dokumen</span>
                                   </div>
                                   <div className="relative space-y-3">
                                     <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-purple-100/40">
                                       <span className="text-sm font-medium text-gray-700">Status:</span>
                                       <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-sm">
                                         {doc.status}
                                       </Badge>
                                     </div>
                                     <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-purple-100/40">
                                       <span className="text-sm font-medium text-gray-700">Tahun:</span>
                                       <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-medium">
                                         {doc.year}
                                       </Badge>
                                     </div>
                                   </div>
                                 </div>
                               )}

                               {/* Additional Info Card */}
                               <div className="group/card relative bg-gradient-to-br from-white to-indigo-50/50 rounded-xl p-5 border border-indigo-100/60 hover:border-indigo-200/80 hover:shadow-lg transition-all duration-300">
                                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                                 <div className="relative flex items-center space-x-3 mb-4">
                                   <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-2 rounded-lg shadow-sm">
                                     <Calendar className="h-5 w-5 text-white" />
                                   </div>
                                   <span className="text-sm font-semibold text-gray-800">Informasi Tambahan</span>
                                 </div>
                                 <div className="relative space-y-3">
                                   <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-indigo-100/40">
                                     <span className="text-sm font-medium text-gray-700">Upload Date:</span>
                                     <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                                       {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                                     </span>
                                   </div>
                                   <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-indigo-100/40">
                                     <span className="text-sm font-medium text-gray-700">File Size:</span>
                                     <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium">
                                       {formatFileSize(doc.fileSize)}
                                     </Badge>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Enhanced Document Description */}
                           {doc.checklistDescription && (
                             <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 p-6">
                               <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                               <div className="relative flex items-start space-x-4">
                                 <div className="relative">
                                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-30"></div>
                                   <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                                     <FileText className="h-6 w-6 text-white" />
                                   </div>
                                 </div>
                                 <div className="flex-1">
                                   <h4 className="text-lg font-bold text-blue-900 mb-3">Deskripsi Dokumen</h4>
                                   <p className="text-gray-800 leading-relaxed text-base">{doc.checklistDescription}</p>
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Enhanced Action Buttons */}
                           <div className="relative flex justify-end space-x-4 pt-6 border-t border-gray-200/60">
                             <Button 
                               size="default" 
                               onClick={() => handleDownload(doc)}
                               className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
                             >
                               <Download className="h-5 w-5 mr-2" />
                               Download
                             </Button>
                             
                             <Button 
                               size="default" 
                               variant="outline"
                               onClick={() => handleRevision(doc)}
                               className="relative border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 px-6 py-2.5 rounded-xl transform hover:scale-105 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                             >
                               <MessageSquare className="h-5 w-5 mr-2" />
                               Revisi
                             </Button>
                           </div>
                         </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada dokumen</h3>
                      <p className="text-gray-500">
                        Tidak ada dokumen yang ditemukan untuk kriteria yang dipilih
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Empty State when no year selected */
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Archive className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku di atas untuk melihat arsip dokumen yang tersedia
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArsipDokumen;
