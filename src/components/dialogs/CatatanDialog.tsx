import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, MessageSquare } from 'lucide-react';

interface CatatanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentInfo: {
    fileName: string;
    checklistDescription: string;
    aspect: string;
    uploadedBy: string;
    uploadDate: string;
    catatan: string;
    subdirektorat?: string;
  } | null;
}

export const CatatanDialog: React.FC<CatatanDialogProps> = ({
  isOpen,
  onClose,
  documentInfo,
}) => {
  if (!documentInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
            Catatan Dokumen
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Detail dan catatan untuk dokumen yang diupload
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Document Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Informasi Dokumen
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-medium text-blue-700">Nama File:</span>
                <span className="text-xs text-blue-900 col-span-2 break-all">{documentInfo.fileName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-medium text-blue-700">Deskripsi:</span>
                <span className="text-xs text-blue-900 col-span-2">{documentInfo.checklistDescription}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-medium text-blue-700">Aspek GCG:</span>
                <span className="text-xs text-blue-900 col-span-2">{documentInfo.aspect}</span>
              </div>
              {documentInfo.subdirektorat && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-xs font-medium text-blue-700">PIC:</span>
                  <span className="text-xs text-blue-900 col-span-2">{documentInfo.subdirektorat}</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Info Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informasi Upload
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-medium text-gray-700 flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  Diupload oleh:
                </span>
                <span className="text-xs text-gray-900 col-span-2">{documentInfo.uploadedBy}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-medium text-gray-700 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Tanggal Upload:
                </span>
                <span className="text-xs text-gray-900 col-span-2">
                  {new Date(documentInfo.uploadDate).toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Catatan
            </h3>
            {documentInfo.catatan ? (
              <div className="bg-white border border-yellow-100 rounded p-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {documentInfo.catatan}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageSquare className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-xs text-yellow-600 italic">Tidak ada catatan untuk dokumen ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="min-w-[100px]"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
