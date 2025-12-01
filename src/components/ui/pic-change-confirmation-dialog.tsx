import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, FileX } from 'lucide-react';

interface PICChangeConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  newPIC: string;
  checklistDescription?: string;
}

export const PICChangeConfirmationDialog: React.FC<PICChangeConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  newPIC,
  checklistDescription
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-blue-900 text-left">
                Konfirmasi Perubahan PIC
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <AlertDialogDescription className="text-gray-700 text-left">
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <FileX className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-800">
                    File akan dipindahkan ke direktori PIC baru
                  </p>
                  <p className="text-sm text-blue-700">
                    Sudah ada file yang terunggah untuk checklist ini. Mengubah PIC akan memindahkan semua file dari direktori PIC lama ke direktori PIC baru secara otomatis.
                  </p>
                </div>
              </div>
              
              {checklistDescription && (
                <div className="text-sm">
                  <p className="font-medium text-gray-800">Checklist:</p>
                  <p className="text-gray-600 mt-1">{checklistDescription}</p>
                </div>
              )}
              
              <div className="text-sm">
                <p className="font-medium text-gray-800">PIC Baru:</p>
                <p className="text-blue-600 mt-1">{newPIC}</p>
              </div>
            </div>
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="hover:bg-gray-100"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ya, Pindahkan File
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};