import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface CatatanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  catatan?: string;
  documentTitle?: string;
  fileName?: string;
}

const CatatanDialog: React.FC<CatatanDialogProps> = ({
  isOpen,
  onClose,
  catatan,
  documentTitle,
  fileName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-blue-900">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Catatan Dokumen</span>
          </DialogTitle>
          <DialogDescription className="text-blue-700">
            Informasi catatan dan detail dokumen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Judul Dokumen</h4>
                  <p className="text-sm text-blue-700">{documentTitle || 'Tidak ada judul'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Nama File</h4>
                  <p className="text-sm text-blue-700 font-mono">{fileName || 'Tidak ada nama file'}</p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Notes Content */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-3">Catatan</h4>
              {catatan && catatan.trim() ? (
                <div className="bg-white p-3 rounded-md border border-yellow-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{catatan}</p>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-md border border-yellow-200 text-center">
                  <p className="text-sm text-gray-500 italic">Tidak ada catatan untuk dokumen ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatatanDialog;
