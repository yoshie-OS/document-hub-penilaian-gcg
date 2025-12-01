import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  Building,
  CloudUpload,
  File,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/contexts/FileUploadContext';

interface AdminUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklistItem: {
    id: number;
    aspek?: string;
    deskripsi: string;
    tahun?: number;
    pic?: string;
  } | null;
  rowNumber?: number;
  isReUpload?: boolean;
  existingFileName?: string;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  fileName: string;
  description: string;
  catatan: string;
}

const AdminUploadDialog: React.FC<AdminUploadDialogProps> = ({
  isOpen,
  onOpenChange,
  checklistItem,
  rowNumber,
  isReUpload = false,
  existingFileName,
  onUploadSuccess
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { uploadFile, reUploadFile } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<UploadFormData>({
    fileName: '',
    description: '',
    catatan: '',
  });

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Partial<UploadFormData>>({});

  // Initialize form data when checklist item changes
  useMemo(() => {
    if (checklistItem) {
      setFormData({
        fileName: existingFileName || '',
        description: checklistItem.deskripsi,
        catatan: '',
      });
    }
  }, [checklistItem, existingFileName]);

  // Allowed file types
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt', '.md'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/markdown'
  ];

  // File validation
  const validateFile = useCallback((file: File): boolean => {
    const maxSize = 16 * 1024 * 1024; // 16MB

    if (file.size > maxSize) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 16MB",
        variant: "destructive"
      });
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      toast({
        title: "Tipe file tidak didukung",
        description: "Hanya file PDF, Word, Excel, TXT, dan gambar yang diperbolehkan",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [toast]);

  // Handle file selection from input
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
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [validateFile]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setFormData(prev => ({
          ...prev,
          fileName: file.name
        }));
        setErrors(prev => ({ ...prev, fileName: undefined }));
        toast({
          title: "File dipilih",
          description: `${file.name} siap untuk diupload`,
        });
      }
    }
  }, [validateFile, toast]);

  // Handle click on drop zone
  const handleDropZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
        description: "Pastikan file sudah dipilih",
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

      // Actually upload file to context
      if (isReUpload) {
        await reUploadFile(
          selectedFile,
          checklistItem.tahun || new Date().getFullYear(),
          checklistItem.id,
          checklistItem.deskripsi,
          checklistItem.aspek || 'Dokumen Tanpa Aspek',
          checklistItem.pic || user?.subdirektorat || '',
          formData.catatan || undefined,
          rowNumber
        );
      } else {
        await uploadFile(
          selectedFile,
          checklistItem.tahun || new Date().getFullYear(),
          checklistItem.id,
          checklistItem.deskripsi,
          checklistItem.aspek || 'Dokumen Tanpa Aspek',
          checklistItem.pic || user?.subdirektorat || '',
          formData.catatan || undefined,
          rowNumber
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success message
      toast({
        title: isReUpload ? "Re-upload berhasil" : "Upload berhasil",
        description: `Dokumen ${selectedFile.name} berhasil diupload`,
      });

      // Reset form and close dialog
      setFormData({
        fileName: '',
        description: '',
        catatan: '',
      });
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      onOpenChange(false);

      // Trigger refresh callback
      if (onUploadSuccess) {
        setTimeout(() => {
          console.log('AdminUploadDialog: Calling onUploadSuccess callback');
          onUploadSuccess();
        }, 200);
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
  }, [checklistItem, selectedFile, formData, isReUpload, toast, onOpenChange, uploadFile, reUploadFile, user, rowNumber, onUploadSuccess]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      setFormData({
        fileName: '',
        description: '',
        catatan: '',
      });
      setSelectedFile(null);
      setErrors({});
      setUploadProgress(0);
      setIsDragActive(false);
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

  // Get file icon based on type
  const getFileIcon = useCallback((fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <File className="w-10 h-10 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <File className="w-10 h-10 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <File className="w-10 h-10 text-green-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <File className="w-10 h-10 text-purple-500" />;
    return <FileText className="w-10 h-10 text-gray-500" />;
  }, []);

  if (!checklistItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg font-semibold">
              <CloudUpload className="w-5 h-5" />
              {isReUpload ? 'Re-upload Dokumen' : 'Upload Dokumen'}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              {checklistItem.aspek || 'Dokumen GCG'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-90px)]">
          {/* Document Info - Full width, no truncation */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{checklistItem.deskripsi}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium">{checklistItem.tahun}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium">{checklistItem.pic || user?.subdirektorat || '-'}</span>
              </span>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              File Dokumen <span className="text-red-500">*</span>
            </Label>

            {!selectedFile ? (
              <div
                onClick={handleDropZoneClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
                  ${isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }
                  ${errors.fileName ? 'border-red-300 bg-red-50' : ''}
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <CloudUpload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {isDragActive ? 'Lepaskan file di sini' : 'Drag & drop file'}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">atau</p>
                  <Button type="button" variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                    Pilih File
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">PDF, Word, Excel, Gambar (maks. 16MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-all">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {errors.fileName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.fileName}
              </p>
            )}
          </div>

          {/* Catatan Field */}
          <div className="space-y-2">
            <Label htmlFor="catatan" className="text-sm font-medium text-gray-700">
              Catatan (Opsional)
            </Label>
            <Textarea
              id="catatan"
              value={formData.catatan}
              onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
              placeholder="Tambahkan catatan untuk dokumen ini..."
              className="resize-none h-20 text-sm"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Mengupload dokumen...</span>
                <span className="text-blue-600 font-bold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">Mohon tunggu, sedang mengupload ke server...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 h-10"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Mengupload...
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
