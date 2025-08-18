import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Download, 
  Search, 
  FileText, 
  Users, 
  Settings,
  BarChart3,
  FolderOpen,
  Plus,
  Eye,
  Building2
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  color?: string;
}

interface QuickActionsSectionProps {
  actions: QuickAction[];
  showAdminActions?: boolean;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  actions,
  showAdminActions = false
}) => {
  const defaultActions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Upload Dokumen',
      description: 'Upload dokumen GCG baru',
      icon: <Upload className="w-6 h-6" />,
      action: () => console.log('Upload Dokumen clicked'),
      variant: 'default',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'search',
      title: 'Cari Dokumen',
      description: 'Cari dokumen berdasarkan kriteria',
      icon: <Search className="w-6 h-6" />,
      action: () => console.log('Cari Dokumen clicked'),
      variant: 'outline',
      color: 'border-green-600 text-green-600 hover:bg-green-50'
    },
    {
      id: 'download',
      title: 'Download Dokumen',
      description: 'Download dokumen dalam format ZIP',
      icon: <Download className="w-6 h-6" />,
      action: () => console.log('Download Dokumen clicked'),
      variant: 'outline',
      color: 'border-purple-600 text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'view',
      title: 'Lihat Arsip',
      description: 'Lihat arsip dokumen tahun sebelumnya',
      icon: <FolderOpen className="w-6 h-6" />,
      action: () => console.log('Lihat Arsip clicked'),
      variant: 'outline',
      color: 'border-orange-600 text-orange-600 hover:bg-orange-50'
    }
  ];

  const adminActions: QuickAction[] = [
    {
      id: 'manage-users',
      title: 'Kelola User',
      description: 'Manajemen akun admin dan user',
      icon: <Users className="w-6 h-6" />,
      action: () => console.log('Kelola User clicked'),
      variant: 'outline',
      color: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
    },
    {
      id: 'manage-structure',
      title: 'Struktur Organisasi',
      description: 'Kelola struktur direktorat dan divisi',
      icon: <Building2 className="w-6 h-6" />,
      action: () => console.log('Struktur Organisasi clicked'),
      variant: 'outline',
      color: 'border-teal-600 text-teal-600 hover:bg-teal-50'
    },
    {
      id: 'manage-metadata',
      title: 'Pengaturan Metadata',
              description: 'Kelola aspek GCG',
      icon: <Settings className="w-6 h-6" />,
      action: () => console.log('Pengaturan Metadata clicked'),
      variant: 'outline',
      color: 'border-cyan-600 text-cyan-600 hover:bg-cyan-50'
    },
    {
      id: 'reports',
      title: 'Laporan & Analisis',
      description: 'Lihat laporan dan analisis performa',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => console.log('Laporan & Analisis clicked'),
      variant: 'outline',
      color: 'border-rose-600 text-rose-600 hover:bg-rose-50'
    }
  ];

  const allActions = showAdminActions ? [...defaultActions, ...adminActions] : actions.length > 0 ? actions : defaultActions;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-gray-600" />
          <span>Aksi Cepat</span>
        </CardTitle>
        <CardDescription>
          Akses cepat ke fitur-fitur utama aplikasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              onClick={action.action}
              className={`h-auto p-6 flex flex-col items-center space-y-3 text-center ${
                action.color || 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="p-3 bg-white rounded-full shadow-sm">
                {action.icon}
              </div>
              <div>
                <div className="font-medium text-sm mb-1">
                  {action.title}
                </div>
                <div className="text-xs opacity-75 leading-relaxed">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>
              Gunakan aksi cepat di atas untuk mengakses fitur-fitur utama dengan mudah
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsSection;
