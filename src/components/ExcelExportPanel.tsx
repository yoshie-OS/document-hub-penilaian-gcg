import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';

const API_BASE_URL = 'http://localhost:5000/api/export';

interface ExportOption {
  type: string;
  label: string;
  description: string;
  icon: string;
}

const exportOptions: ExportOption[] = [
  {
    type: 'users',
    label: 'Users',
    description: 'Export all users with roles and departments',
    icon: '👥'
  },
  {
    type: 'checklist',
    label: 'Checklist GCG',
    description: 'Export GCG checklist with completion status',
    icon: '✅'
  },
  {
    type: 'documents',
    label: 'Documents',
    description: 'Export all document metadata',
    icon: '📄'
  },
  {
    type: 'org-structure',
    label: 'Organizational Structure',
    description: 'Export Direktorat, Subdirektorat, Divisi, Anak Perusahaan',
    icon: '🏢'
  },
  {
    type: 'gcg-assessment',
    label: 'GCG Assessment',
    description: 'Export GCG performance assessment results',
    icon: '📊'
  },
  {
    type: 'all',
    label: 'Complete Export',
    description: 'Export ALL data in one comprehensive Excel file',
    icon: '📁'
  }
];

export const ExcelExportPanel: React.FC = () => {
  const { selectedYear, availableYears } = useYear();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [exportYear, setExportYear] = useState<number>(selectedYear || new Date().getFullYear());

  const downloadExcel = async (exportType: string) => {
    setIsDownloading(exportType);

    try {
      // Build URL with parameters
      const yearParam = ['checklist', 'documents', 'org-structure', 'gcg-assessment', 'all'].includes(exportType)
        ? `?year=${exportYear}`
        : '';

      const url = `${API_BASE_URL}/${exportType}${yearParam}`;

      // Fetch the file
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Export_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `${filename} has been downloaded`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to download Excel file',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Export Center
        </CardTitle>
        <CardDescription>
          Download data as Excel files for reports and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Export Year:</label>
          <Select
            value={exportYear.toString()}
            onValueChange={(value) => setExportYear(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <Card key={option.type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">{option.icon}</span>
                  {option.label}
                </CardTitle>
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => downloadExcel(option.type)}
                  disabled={isDownloading === option.type}
                  className="w-full"
                  variant="outline"
                >
                  {isDownloading === option.type ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => downloadExcel('gcg-assessment')}
              disabled={!!isDownloading}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              GCG Assessment {exportYear}
            </Button>
            <Button
              onClick={() => downloadExcel('all')}
              disabled={!!isDownloading}
              variant="secondary"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Complete Backup {exportYear}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-medium mb-1">💡 For Your Boss:</p>
          <p className="text-muted-foreground">
            All exports are formatted Excel files (.xlsx) with headers, auto-sized columns,
            and multiple sheets where applicable. Files are downloaded directly to your Downloads folder.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelExportPanel;
