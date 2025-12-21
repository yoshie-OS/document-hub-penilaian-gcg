import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  exportType: 'users' | 'checklist' | 'documents' | 'org-structure' | 'gcg-assessment' | 'all';
  year?: number;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const API_BASE_URL = 'http://localhost:5001/api/export';

const defaultLabels: Record<string, string> = {
  'users': 'Download Users',
  'checklist': 'Download Checklist',
  'documents': 'Download Documents',
  'org-structure': 'Download Org Structure',
  'gcg-assessment': 'Download GCG Assessment',
  'all': 'Download All Data'
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  exportType,
  year,
  label,
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Build URL
      const yearParam = year ? `?year=${year}` : '';
      const url = `${API_BASE_URL}/${exportType}${yearParam}`;

      // Fetch the file
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from header or generate
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${exportType}_${year || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) {
          filename = match[1];
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
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to download Excel file',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const buttonLabel = label || defaultLabels[exportType] || 'Download Excel';

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant={variant}
      size={size}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonLabel}
        </>
      )}
    </Button>
  );
};

// Specialized export buttons for common use cases

export const DownloadChecklistButton: React.FC<{ year?: number; className?: string }> = ({ year, className }) => (
  <ExportButton exportType="checklist" year={year} label="Download Checklist Excel" className={className} />
);

export const DownloadGCGAssessmentButton: React.FC<{ year?: number; className?: string }> = ({ year, className }) => (
  <ExportButton exportType="gcg-assessment" year={year} label="Download GCG Assessment" className={className} />
);

export const DownloadDocumentsButton: React.FC<{ year?: number; className?: string }> = ({ year, className }) => (
  <ExportButton exportType="documents" year={year} label="Download Documents" className={className} />
);

export const DownloadUsersButton: React.FC<{ className?: string }> = ({ className }) => (
  <ExportButton exportType="users" label="Download Users" className={className} />
);

export const DownloadOrgStructureButton: React.FC<{ year?: number; className?: string }> = ({ year, className }) => (
  <ExportButton exportType="org-structure" year={year} label="Download Org Structure" className={className} />
);

export const DownloadAllDataButton: React.FC<{ year?: number; className?: string }> = ({ year, className }) => (
  <ExportButton exportType="all" year={year} label="Download All Data" variant="secondary" className={className} />
);

export default ExportButton;
