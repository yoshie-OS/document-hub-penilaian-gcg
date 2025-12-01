import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  Building,
  User,
  MessageSquare,
  Download,
  Eye,
  X,
  Clock,
  HardDrive
} from 'lucide-react';

interface DetailDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: number;
    aspek: string;
    deskripsi: string;
    tahun: number;
    fileName?: string;
    fileSize?: number;
    uploadDate?: Date;
    uploadedBy?: string;
    subdirektorat?: string;
    catatan?: string;
    status?: string;
  } | null;
  onView?: () => void;
  onDownload?: () => void;
}

const DetailDocumentDialog: React.FC<DetailDocumentDialogProps> = ({
  isOpen,
  onClose,
  document,
  onView,
  onDownload
}) => {
  if (!document) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg font-semibold">
              <FileText className="w-5 h-5" />
              Detail Dokumen
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-sm mt-1">
              Informasi lengkap dokumen yang diupload
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Document Description */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Deskripsi Dokumen</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {document.deskripsi}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs bg-white">
                {document.aspek}
              </Badge>
              <Badge variant="outline" className="text-xs bg-white">
                Tahun {document.tahun}
              </Badge>
            </div>
          </div>

          {/* File Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Informasi File</h3>

            <div className="grid grid-cols-1 gap-3">
              {/* File Name */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Nama File</p>
                  <p className="text-sm font-medium text-gray-900 break-all">
                    {document.fileName || '-'}
                  </p>
                </div>
              </div>

              {/* File Size */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <HardDrive className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ukuran File</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatFileSize(document.fileSize)}
                  </p>
                </div>
              </div>

              {/* Upload Date */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tanggal Upload</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(document.uploadDate)}
                  </p>
                </div>
              </div>

              {/* Uploaded By */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Diupload Oleh</p>
                  <p className="text-sm font-medium text-gray-900">
                    {document.uploadedBy || '-'}
                  </p>
                </div>
              </div>

              {/* Subdirektorat */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Subdirektorat/PIC</p>
                  <p className="text-sm font-medium text-gray-900">
                    {document.subdirektorat || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              Catatan
            </h3>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              {document.catatan ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {document.catatan}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Tidak ada catatan untuk dokumen ini
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            {onView && (
              <Button
                type="button"
                variant="outline"
                onClick={onView}
                className="flex-1 h-10 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Lihat
              </Button>
            )}
            {onDownload && (
              <Button
                type="button"
                variant="outline"
                onClick={onDownload}
                className="flex-1 h-10 border-green-200 text-green-600 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailDocumentDialog;
