import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileX, Trash2, Loader2 } from 'lucide-react';

interface BulkDeleteData {
  year: number;
  checklist_items: number;
  aspects: number;
  users: number;
  organizational_data: {
    direktorat: number;
    subdirektorat: number;
    divisi: number;
  };
  uploaded_files: number;
  total_items: number;
}

interface BulkDeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  selectedYear: number;
  isLoading?: boolean;
}

export const BulkDeleteConfirmationDialog: React.FC<BulkDeleteConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  selectedYear,
  isLoading = false
}) => {
  const [previewData, setPreviewData] = useState<BulkDeleteData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && selectedYear) {
      fetchPreviewData();
    }
  }, [isOpen, selectedYear]);

  const fetchPreviewData = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch(`http://localhost:5001/api/bulk-delete/${selectedYear}/preview`);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        console.error('Failed to fetch preview data');
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatCount = (count: number, label: string) => {
    if (count === 0) return null;
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
        <span className="text-sm font-medium text-red-800">{label}</span>
        <span className="text-sm font-bold text-red-900 bg-red-100 px-2 py-1 rounded">
          {count} item{count !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  const hasData = previewData && (
    previewData.checklist_items > 0 ||
    previewData.aspects > 0 ||
    previewData.users > 0 ||
    previewData.organizational_data.direktorat > 0 ||
    previewData.organizational_data.subdirektorat > 0 ||
    previewData.organizational_data.divisi > 0 ||
    previewData.uploaded_files > 0
  );

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-red-900 text-left text-xl">
                ⚠️ PERINGATAN: Hapus Semua Data
              </AlertDialogTitle>
              <p className="text-red-700 text-sm mt-1">
                Tahun Buku: <span className="font-bold">{selectedYear}</span>
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <AlertDialogDescription className="text-gray-700 text-left">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Memuat data preview...</span>
              </div>
            ) : !hasData ? (
              <div className="text-center py-6">
                <FileX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Tidak ada data untuk tahun {selectedYear} yang dapat dihapus.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-start gap-2">
                    <Trash2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-red-800">
                        Data berikut akan dihapus PERMANEN:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {previewData && (
                    <>
                      {formatCount(previewData.checklist_items, '📋 Checklist Items')}
                      {formatCount(previewData.aspects, '🎯 Aspek GCG')}
                      {formatCount(previewData.users, '👤 User Assignments')}
                      {formatCount(previewData.organizational_data.direktorat, '🏢 Direktorat')}
                      {formatCount(previewData.organizational_data.subdirektorat, '🏬 Subdirektorat')}
                      {formatCount(previewData.organizational_data.divisi, '🏪 Divisi')}
                      {formatCount(previewData.uploaded_files, '📁 File Terupload')}
                    </>
                  )}
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    TINDAKAN INI TIDAK DAPAT DIBATALKAN
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Semua data dan file yang terkait dengan tahun {selectedYear} akan dihapus secara permanen dari sistem.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="hover:bg-gray-100"
            disabled={isLoading}
          >
            Batal
          </AlertDialogCancel>
          {hasData && (
            <AlertDialogAction 
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading || loadingPreview}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ya, Hapus Semua Data
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};