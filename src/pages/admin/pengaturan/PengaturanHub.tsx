import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useUser } from '@/contexts/UserContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Building2,
  Users,
  FileText,
  ChevronRight,
  CheckCircle,
  Settings,
  ArrowRight
} from 'lucide-react';

const PengaturanHub = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { availableYears, selectedYear } = useYear();
  const { direktorat, subdirektorat, anakPerusahaan, divisi } = useStrukturPerusahaan();
  const { user } = useUser();
  const { checklist } = useChecklist();

  // Calculate progress for each section
  const setupProgress = {
    tahunBuku: availableYears && availableYears.length > 0,
    strukturOrganisasi: Boolean(
      direktorat?.length > 0 &&
      subdirektorat?.length > 0 &&
      anakPerusahaan?.length > 0 &&
      divisi?.length > 0
    ),
    manajemenAkun: true, // Always has superadmin
    kelolaDokumen: Boolean(checklist && checklist.length > 0)
  };

  const menuItems = [
    {
      id: 'tahun-buku',
      title: 'Tahun Buku',
      description: 'Kelola periode tahun buku untuk penilaian GCG',
      icon: Calendar,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBorderColor: 'hover:border-orange-400',
      path: '/admin/pengaturan/tahun-buku',
      stats: `${availableYears?.length || 0} tahun terdaftar`,
      isCompleted: setupProgress.tahunBuku
    },
    {
      id: 'struktur-organisasi',
      title: 'Struktur Organisasi',
      description: 'Kelola direktorat, subdirektorat, dan divisi',
      icon: Building2,
      color: 'green',
      bgColor: 'bg-green-50',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBorderColor: 'hover:border-green-400',
      path: '/admin/pengaturan/struktur-organisasi',
      stats: `${direktorat?.length || 0} direktorat, ${divisi?.length || 0} divisi`,
      isCompleted: setupProgress.strukturOrganisasi
    },
    {
      id: 'manajemen-akun',
      title: 'Manajemen Akun',
      description: 'Kelola akun pengguna dan hak akses',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBorderColor: 'hover:border-blue-400',
      path: '/admin/pengaturan/manajemen-akun',
      stats: 'Kelola pengguna sistem',
      isCompleted: setupProgress.manajemenAkun
    },
    {
      id: 'kelola-dokumen',
      title: 'Kelola Dokumen',
      description: 'Kelola checklist dan aspek penilaian GCG',
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBorderColor: 'hover:border-purple-400',
      path: '/admin/pengaturan/kelola-dokumen',
      stats: selectedYear ? `${checklist?.filter(c => c.tahun === selectedYear).length || 0} item checklist` : 'Pilih tahun terlebih dahulu',
      isCompleted: setupProgress.kelolaDokumen
    }
  ];

  const completedCount = Object.values(setupProgress).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <Sidebar />

      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8" data-tour="pengaturan-header">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
                <p className="text-gray-500 mt-1">Konfigurasi dan kelola sistem GCG Document Hub</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div data-tour="progress-pengaturan" className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress Pengaturan</span>
                <span className="text-sm font-semibold text-[#1e3a5f]">{completedCount}/4 selesai</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#1e3a5f] to-[#ff6b35] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Menu Cards Grid */}
          <div data-tour="menu-cards" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  data-tour={index === 0 ? "tahun-buku-card" : index === 1 ? "struktur-card" : index === 2 ? "akun-card" : index === 3 ? "dokumen-card" : undefined}
                  className={`cursor-pointer transition-all duration-300 ${item.bgColor} ${item.borderColor} ${item.hoverBorderColor} hover:shadow-lg group`}
                  onClick={() => navigate(item.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${item.iconBgColor}`}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.isCompleted && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Selesai
                          </Badge>
                        )}
                        <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:${item.iconColor} group-hover:translate-x-1 transition-all`} />
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gray-900 mt-4">{item.title}</CardTitle>
                    <CardDescription className="text-gray-600">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{item.stats}</span>
                      <span className={`text-sm font-medium ${item.iconColor} opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                        Buka <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Info */}
          <div data-tour="panduan-pengaturan" className="mt-8 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Panduan Pengaturan</h3>
            <p className="text-white/80 text-sm mb-4">
              Untuk memulai, pastikan Anda telah mengatur semua komponen sistem secara berurutan:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-sm">Tahun Buku</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-sm">Struktur Organisasi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-sm">Manajemen Akun</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <span className="text-sm">Kelola Dokumen</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PengaturanHub;
