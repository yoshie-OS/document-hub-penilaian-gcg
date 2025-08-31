import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  User, 
  Building2,
  Download,
  Eye,
  Calendar
} from 'lucide-react';

interface RecentDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  direktorat: string;
  aspect: string;
  status: 'completed' | 'pending' | 'overdue';
  year: number;
}

interface RecentDocumentsSectionProps {
  recentDocuments: RecentDocument[];
  onViewDocument: (document: RecentDocument) => void;
  onDownloadDocument: (document: RecentDocument) => void;
  showActions?: boolean;
}

const RecentDocumentsSection: React.FC<RecentDocumentsSectionProps> = ({
  recentDocuments,
  onViewDocument,
  onDownloadDocument,
  showActions = true
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Selesai</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Dokumen Terbaru</span>
        </CardTitle>
        <CardDescription>
          {recentDocuments.length} dokumen terbaru yang diupload
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentDocuments.length > 0 ? (
            recentDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* File Icon */}
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.fileName}
                      </h4>
                      {getStatusBadge(document.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Tahun {document.year}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3 h-3" />
                        <span>{document.direktorat}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{document.aspect}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(document.uploadedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{document.uploadedBy}</span>
                      </div>
                      <span>•</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadDocument(document)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada dokumen</h3>
              <p className="text-gray-500">
                Dokumen yang diupload akan muncul di sini
              </p>
            </div>
          )}
        </div>

        {/* View All Button */}
        {recentDocuments.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="text-blue-600 hover:text-blue-700">
              Lihat Semua Dokumen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentDocumentsSection;
