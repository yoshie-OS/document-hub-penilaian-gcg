import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Upload, 
  RotateCcw,
  Search, 
  Filter,
  Clock,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';
interface ChecklistItem {
  id: number;
  aspek?: string; // Make aspek optional
  deskripsi: string;
  tahun?: number;
  status: string;
  uploadedFile?: {
    id: string;
    fileName: string;
    fileSize: number;
    uploadDate: Date;
    checklistId?: number;
    checklistDescription?: string;
    aspect?: string;
    status: 'uploaded' | 'pending';
  } | null;
}

interface AdminDocumentListPanelProps {
  checklistItems: ChecklistItem[];
  onUpload: (itemId: number) => void;
  onReUpload: (itemId: number) => void;
  onViewDocument: (itemId: number) => void;
  onDownloadDocument: (itemId: number) => void;
  selectedYear: number | null;
  className?: string;
}

const AdminDocumentListPanel: React.FC<AdminDocumentListPanelProps> = ({
  checklistItems,
  onUpload,
  onReUpload,
  onViewDocument,
  onDownloadDocument,
  selectedYear,
  className = ""
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAspect, setSelectedAspect] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Debug logging
  console.log('AdminDocumentListPanel props:', {
    checklistItems,
    selectedYear,
    itemsCount: checklistItems?.length
  });

  // Safety check for checklistItems
  if (!checklistItems || !Array.isArray(checklistItems)) {
    console.warn('Invalid checklistItems:', checklistItems);
    return (
      <div className={`mb-6 ${className}`}>
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Data checklist tidak valid atau kosong</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique aspects for filter
  const aspects = useMemo(() => {
    try {
      // Include items with valid aspek and also items without aspek
      const allAspects = checklistItems
        .filter(item => item && item.aspek && typeof item.aspek === 'string' && item.aspek.trim() !== '')
        .map(item => item.aspek);
      
      // Add "Tidak Diberikan Aspek" option if there are items without aspek
      const hasItemsWithoutAspect = checklistItems.some(item => !item.aspek || item.aspek === '' || item.aspek.trim() === '');
      
      const uniqueAspects = [...new Set(allAspects)];
      if (hasItemsWithoutAspect) {
        uniqueAspects.push('Tidak Diberikan Aspek');
      }
      
      const sortedAspects = uniqueAspects.sort();
      console.log('All aspects including "Tidak Diberikan Aspek":', sortedAspects);
      return sortedAspects;
    } catch (error) {
      console.error('Error processing aspects:', error);
      return [];
    }
  }, [checklistItems]);

  // Filtered checklist items
  const filteredItems = useMemo(() => {
    try {
      return checklistItems.filter(item => {
        if (!item || !item.deskripsi || !item.status) {
          console.warn('Invalid item in filter:', item);
          return false;
        }
        
        // Handle items without aspek
        const itemAspek = item.aspek || '';
        const hasValidAspek = itemAspek && typeof itemAspek === 'string' && itemAspek.trim() !== '';
        
        const matchesSearch = item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (hasValidAspek ? itemAspek.toLowerCase().includes(searchTerm.toLowerCase()) : false);
        
        // Handle aspect filtering for items without aspek
        let matchesAspect = true;
        if (selectedAspect === 'all') {
          matchesAspect = true;
        } else if (selectedAspect === 'Tidak Diberikan Aspek') {
          matchesAspect = !hasValidAspek;
        } else {
          matchesAspect = hasValidAspek && itemAspek === selectedAspect;
        }
        
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
        
        return matchesSearch && matchesAspect && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering items:', error);
      return [];
    }
  }, [checklistItems, searchTerm, selectedAspect, selectedStatus]);



  // Get status display
  const getStatusDisplay = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 w-4 mr-1" />
            Selesai
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center text-blue-600 text-sm font-medium">
            <Clock className="w-4 w-4 mr-1" />
            Dalam Proses
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center text-red-600 text-sm font-medium">
            <Clock className="w-4 w-4 mr-1" />
            Terlambat
          </span>
        );
      default:
        return (
          <span className="flex items-center text-gray-400 text-sm">
            <Clock className="w-4 w-4 mr-1" />
            Pending
          </span>
        );
    }
  };

  // Check if item can be uploaded
  const canUpload = (item: ChecklistItem) => {
    return item.status !== 'completed';
  };

  // Check if item can be re-uploaded
  const canReUpload = (item: ChecklistItem) => {
    return item.status === 'completed';
  };

  return (
    <div className={`mb-6 ${className}`}>
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Daftar Dokumen GCG yang Di-assign</span>
            {selectedYear && (
              <Badge variant="outline" className="ml-2">
                Tahun {selectedYear}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>


          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan deskripsi atau aspek dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedAspect} onValueChange={setSelectedAspect}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pilih Aspek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aspek</SelectItem>
                  {aspects.map((aspect) => (
                    <SelectItem key={aspect} value={aspect}>{aspect}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Terlambat</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAspect('all');
                  setSelectedStatus('all');
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="py-4">No</TableHead>
                  <TableHead className="py-4">Aspek</TableHead>
                  <TableHead className="py-4">Deskripsi Dokumen GCG</TableHead>
                  <TableHead className="py-4">Status</TableHead>
                  <TableHead className="py-4">File</TableHead>
                  <TableHead className="py-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="py-4 font-medium text-gray-700">
                        {index + 1}
                      </TableCell>
                                              <TableCell className="py-4">
                                          {item.aspek && item.aspek.trim() !== '' ? (
                  <Badge variant="outline">{item.aspek}</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Tidak Diberikan Aspek
                  </Badge>
                )}
                        </TableCell>
                      <TableCell className="py-4 max-w-md">
                        <div className="text-sm font-semibold text-gray-900 leading-relaxed" title={item.deskripsi}>
                          {item.deskripsi}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusDisplay(item.status)}
                      </TableCell>
                      <TableCell className="py-4 max-w-xs">
                        {item.status === 'completed' && item.uploadedFile ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 w-4 text-blue-600 flex-shrink-0" />
                              <span 
                                className="text-sm font-medium text-gray-900 truncate block max-w-[200px]" 
                                title={item.uploadedFile.fileName}
                              >
                                {item.uploadedFile.fileName}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.uploadedFile.uploadDate).toLocaleDateString('id-ID')} • 
                              {(item.uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Belum ada file
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex space-x-2">
                          {canUpload(item) && (
                            <Button
                              size="sm"
                              onClick={() => onUpload(item.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Upload className="w-4 w-4 mr-2" />
                              Upload
                            </Button>
                          )}
                          {canReUpload(item) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReUpload(item.id)}
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-4 w-4 mr-2" />
                              Re-upload
                            </Button>
                          )}
                          {item.status === 'completed' && item.uploadedFile && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadDocument(item.id)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              <Download className="w-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        <FileText className="w-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Tidak ada dokumen yang ditemukan</p>
                        <p className="text-xs mt-1">
                          {searchTerm || selectedAspect !== 'all' || selectedStatus !== 'all' 
                            ? 'Coba ubah filter pencarian' 
                            : 'Belum ada dokumen GCG yang di-assign untuk tahun ini'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Menampilkan {filteredItems.length} dari {checklistItems.length} dokumen
            {selectedYear && ` untuk tahun ${selectedYear}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocumentListPanel;
