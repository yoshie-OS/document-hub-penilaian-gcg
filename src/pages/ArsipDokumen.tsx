import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel } from '@/components/panels';
import { Card, CardContent } from '@/components/ui/card';
import { useSidebar } from '@/contexts/SidebarContext';
import { Archive } from 'lucide-react';

const ArsipDokumen = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <>
      <Sidebar />
      <Topbar />
      
      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Arsip Dokumen"
            subtitle="Kelola dan unduh dokumen yang telah diupload"
          />

          {/* Content - Kosong */}
          <div className="space-y-6">
            {/* Placeholder Content */}
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    Menu Arsip Dokumen
                  </h3>
                  <p className="text-gray-400">
                    Konten menu ini sedang dalam pengembangan
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArsipDokumen;
