import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  X, 
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/contexts/FileUploadContext';

interface AdminUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklistItem: {
    id: number;
    aspek?: string; // Make aspek optional
    deskripsi: string;
    tahun?: number;
  } | null;
  isReUpload?: boolean;
  existingFileName?: string;
  onUploadSuccess?: () => void; // Callback untuk refresh data
}

interface UploadFormData {
  fileName: string;
  description: string;
  notes: string;
}

const AdminUploadDialog: React.FC<AdminUploadDialogProps> = ({
  isOpen,
  onOpenChange,
  checklistItem,
  isReUpload = false,
  existingFileName,
  onUploadSuccess
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { uploadFile, reUploadFile } = useFileUpload();
  
  // Form state
  const [formData, setFormData] = useState<UploadFormData>({
    fileName: '',
    description: '',
    notes: ''
  });
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Validation state
  const [errors, setErrors] = useState<Partial<UploadFormData>>({});

  // Initialize form data when checklist item changes
  useMemo(() => {
    if (checklistItem) {
      setFormData({
        fileName: existingFileName || '',
        description: checklistItem.deskripsi,
        notes: ''
      });
    }
  }, [checklistItem, existingFileName]);

  // File validation
  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];

    if (file.size > maxSize) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive"
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipe file tidak didukung",
        description: "Hanya file PDF, Word, Excel, dan gambar yang diperbolehkan",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileName: file.name
      }));
      setErrors(prev => ({ ...prev, fileName: undefined }));
    }
  }, [toast]);

  // Handle file removal
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      fileName: ''
    }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<UploadFormData> = {};

    if (!formData.fileName.trim()) {
      newErrors.fileName = 'Nama file harus diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    if (!selectedFile) {
      newErrors.fileName = 'File harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!checklistItem || !selectedFile) {
      toast({
        title: "Data tidak lengkap",
        description: "Pastikan semua field terisi dan file dipilih",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

         try {
       // Simulate upload progress
       const progressInterval = setInterval(() => {
         setUploadProgress(prev => {
           if (prev >= 90) {
             clearInterval(progressInterval);
             return 90;
           }
           return prev + 10;
         });
       }, 200);

       // Simulate upload delay
       await new Promise(resolve => setTimeout(resolve, 2000));

       clearInterval(progressInterval);
       setUploadProgress(100);

               // Actually upload file to context
        if (checklistItem && selectedFile) {
          if (isReUpload) {
            // For re-upload: remove old file and add new one
            await reUploadFile(
              selectedFile,
              checklistItem.tahun || new Date().getFullYear(),
              checklistItem.id,
              checklistItem.deskripsi,
              checklistItem.aspek || 'Tidak Diberikan Aspek',
              user?.subdirektorat,
              formData.notes // Tambahkan catatan
            );
          } else {
            // For new upload: add new file
            await uploadFile(
              selectedFile,
              checklistItem.tahun || new Date().getFullYear(),
              checklistItem.id,
              checklistItem.deskripsi,
              checklistItem.aspek || 'Tidak Diberikan Aspek',
              user?.subdirektorat,
              formData.notes // Tambahkan catatan
            );
          }

        }

       // Show success message
       toast({
         title: isReUpload ? "Re-upload berhasil" : "Upload berhasil",
         description: `Dokumen ${formData.fileName} berhasil diupload`,
       });

       // Reset form and close dialog
       setFormData({
         fileName: '',
         description: '',
         notes: ''
       });
       setSelectedFile(null);
       setUploadProgress(0);
       setIsUploading(false);
       onOpenChange(false);
       
       // Trigger refresh callback
       if (onUploadSuccess) {
         onUploadSuccess();
       }

    } catch (error) {
      console.error('Upload error in AdminUploadDialog:', error);
      toast({
        title: "Upload gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat upload dokumen",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [checklistItem, selectedFile, formData.fileName, isReUpload, toast, onOpenChange]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      setFormData({
        fileName: '',
        description: '',
        notes: ''
      });
      setSelectedFile(null);
      setErrors({});
      setUploadProgress(0);
      onOpenChange(false);
    }
  }, [isUploading, onOpenChange]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (!checklistItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-blue-900">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>
              {isReUpload ? 'Re-upload Dokumen' : 'Upload Dokumen Baru'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-blue-700">
            {isReUpload 
              ? `Upload ulang dokumen untuk ${checklistItem.aspek}`
              : `Upload dokumen baru untuk ${checklistItem.aspek}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checklist Item Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-blue-900">Aspek GCG</Label>
                  <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-800">
                    {checklistItem.aspek}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-900">Tahun</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">{checklistItem.tahun}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-sm font-medium text-blue-900">Deskripsi</Label>
                <p className="text-sm text-blue-700 mt-1">{checklistItem.deskripsi}</p>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Nama</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{user?.name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900">Subdirektorat</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Building className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{user?.subdirektorat}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900">Divisi</Label>
                  <span className="text-sm text-gray-700 mt-1 block">
                    {user?.divisi || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-gray-900">
              Upload File
            </Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Pilih file
                  </span>
                  <span className="text-gray-500"> atau drag and drop</span>
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, Word, Excel, atau gambar (maks. 10MB)
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-sm text-green-700">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* File Name Input */}
          <div className="space-y-2">
            <Label htmlFor="fileName" className="text-sm font-medium text-gray-700">
              Nama File (Opsional)
            </Label>
            <Input
              id="fileName"
              value={formData.fileName}
              onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
              placeholder="Biarkan kosong untuk menggunakan nama file asli"
              className={errors.fileName ? 'border-red-300' : ''}
            />
            <p className="text-xs text-gray-500">
              Jika dikosongkan, akan menggunakan nama file asli
            </p>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Catatan (Opsional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Tambahkan catatan atau keterangan tambahan..."
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Upload Progress</span>
                <span className="text-blue-600 font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                Mohon tunggu, sedang mengupload dokumen...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {isReUpload ? 'Re-upload' : 'Upload'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUploadDialog;
