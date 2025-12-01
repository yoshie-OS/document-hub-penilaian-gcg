import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';

const FileUploadSection = () => {
  const { uploadFile, uploadedFiles, getFilesByYear } = useFileUpload();
  const { checklist } = useChecklist();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique aspects for the selected year
  const aspects = React.useMemo(() => {
    if (!selectedYear) return [];
    return [...new Set(checklist.filter(item => item.tahun === selectedYear).map(item => item.aspek))];
  }, [checklist, selectedYear]);

  // Get checklist items for selected aspect
  const checklistItems = React.useMemo(() => {
    if (!selectedChecklistId) return [];
    return checklist.filter(item => item.aspek === selectedChecklistId && item.tahun === selectedYear);
  }, [checklist, selectedChecklistId, selectedYear]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedChecklistId || !selectedYear) return;

    const aspect = selectedChecklistId;
    const checklistItem = checklistItems[0]; // For now, we'll use the first item of the aspect

    if (checklistItem) {
      uploadFile(
        selectedFile,
        selectedYear,
        checklistItem.id,
        checklistItem.deskripsi,
        aspect
      );
    }

    // Reset form
    setSelectedFile(null);
    setSelectedChecklistId('');
    setIsDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const yearFiles = selectedYear ? getFilesByYear(selectedYear) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Section */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Upload Dokumen</span>
          </CardTitle>
          <CardDescription>
            Upload dokumen assessment untuk tahun buku yang dipilih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="year">Tahun Buku</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahun buku" />
              </SelectTrigger>
              <SelectContent>
                {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {aspects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Tidak ada aspek checklist yang tersedia untuk tahun {selectedYear}
              </p>
              <Button disabled variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Dokumen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tahun Buku {selectedYear}</strong> - Siap untuk upload dokumen assessment
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dokumen Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Dokumen</DialogTitle>
                    <DialogDescription>
                      Pilih file dan aspek checklist untuk upload
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file">File Dokumen</Label>
                      <Input
                        id="file"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.md,.markdown,text/plain,text/markdown"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, Word, Excel, gambar, txt atau markdown (maks. 16MB)
                      </p>
                      {selectedFile && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <p><strong>Nama File:</strong> {selectedFile.name}</p>
                          <p><strong>Ukuran:</strong> {formatFileSize(selectedFile.size)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="aspect">Aspek Checklist</Label>
                      <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih aspek checklist" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspects.map((aspect) => (
                            <SelectItem key={aspect} value={aspect}>
                              {aspect}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedChecklistId && checklistItems.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Tidak ada item checklist yang tersedia untuk aspek ini
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button 
                        onClick={handleUpload}
                        disabled={!selectedFile || !selectedChecklistId || checklistItems.length === 0}
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List Section */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span>Dokumen Terupload</span>
          </CardTitle>
          <CardDescription>
            Daftar dokumen yang sudah diupload untuk tahun {selectedYear || '...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yearFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada dokumen yang diupload</p>
            </div>
          ) : (
            <div className="space-y-3">
              {yearFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{file.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {file.aspect || 'Tidak ada aspek'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.uploadDate.toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadSection; 