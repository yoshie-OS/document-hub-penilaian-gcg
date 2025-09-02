import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';

interface CatatanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  catatan?: string;
  documentTitle?: string;
  fileName?: string;
}

export const CatatanDialog: React.FC<CatatanDialogProps> = ({
  isOpen,
  onClose,
  catatan,
  documentTitle,
  fileName
}) => {
  // Debug logging
  console.log('CatatanDialog: Received props:', {
    catatan,
    catatanType: typeof catatan,
    catatanLength: catatan?.length,
    catatanTrimmed: catatan?.trim(),
    documentTitle,
    fileName
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Catatan Dokumen
          </DialogTitle>
          <DialogDescription>
            {documentTitle && (
              <div className="mb-2">
                <span className="font-medium">Judul:</span> {documentTitle}
              </div>
            )}
            {fileName && (
              <div className="mb-2">
                <span className="font-medium">File:</span> {fileName}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {catatan && catatan.trim() ? (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Catatan dari pengunggah:</div>
              <div className="text-gray-800 whitespace-pre-wrap">{catatan}</div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada catatan untuk dokumen ini</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};



