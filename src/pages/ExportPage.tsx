import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExcelExportPanel } from '@/components/ExcelExportPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileDown } from 'lucide-react';

interface ExportHistory {
  id: number;
  export_type: string;
  file_name: string;
  year: number | null;
  exported_by_name: string | null;
  export_date: string;
  row_count: number;
  file_size: number;
}

const ExportPage: React.FC = () => {
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/export/history');
      const data = await response.json();
      if (data.success) {
        setExportHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExportTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'users': 'Users',
      'checklist': 'Checklist GCG',
      'documents': 'Documents',
      'org_structure': 'Organizational Structure',
      'gcg_assessment': 'GCG Assessment',
      'all': 'Complete Export'
    };
    return labels[type] || type;
  };

  const getExportTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'users': 'default',
      'checklist': 'secondary',
      'documents': 'outline',
      'org_structure': 'default',
      'gcg_assessment': 'destructive',
      'all': 'secondary'
    };
    return variants[type] || 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Excel Export Center</h1>
        <p className="text-muted-foreground">
          Download your data as Excel files for reports, analysis, or sharing with stakeholders
        </p>
      </div>

      {/* Export Panel */}
      <ExcelExportPanel />

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Export History
          </CardTitle>
          <CardDescription>
            Recent exports from all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading export history...
            </div>
          ) : exportHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exports yet. Click the buttons above to create your first export!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Exported By</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportHistory.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <Badge variant={getExportTypeBadge(exp.export_type)}>
                          {getExportTypeLabel(exp.export_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <FileDown className="h-4 w-4 text-muted-foreground" />
                          {exp.file_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exp.year || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(exp.export_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {exp.exported_by_name || 'System'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {exp.row_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFileSize(exp.file_size)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Excel Exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">📊 For Reports & Analysis:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Download "GCG Assessment" for yearly performance reports</li>
              <li>Download "Checklist GCG" to track document completion</li>
              <li>Download "Complete Export" for comprehensive backups</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">👔 For Stakeholders (Your Boss):</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All files are formatted with headers and auto-sized columns</li>
              <li>Multi-sheet files include summary tabs</li>
              <li>Files open directly in Microsoft Excel or Google Sheets</li>
              <li>No technical knowledge required to view the data</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">🔒 Data Security:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All exports are logged with timestamp and user information</li>
              <li>Exported files are stored temporarily on the server</li>
              <li>Sensitive information (passwords) is never included in exports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPage;
