import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import YearSelector from '@/components/dashboard/YearSelector';
import DashboardStats from '@/components/dashboard/DashboardStats';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';
import SpiderChart from '@/components/dashboard/SpiderChart';
import MonthlyTrends from '@/components/dashboard/MonthlyTrends';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { PageHeaderPanel } from '@/components/panels';

const DashboardMain = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear } = useYear();
  const [searchParams] = useSearchParams();
  
  // Get URL parameters
  const filterYear = searchParams.get('year');

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
            title="Dashboard"
            subtitle={selectedYear ? `Statistik GCG Document Hub - Tahun ${selectedYear}` : "Selamat datang di GCG Document Hub"}
          />

          {/* Year Selector */}
          <div id="year-selector">
            <YearSelector initialYear={filterYear ? parseInt(filterYear) : undefined} />
          </div>

          {/* Show content only when year is selected */}
          {selectedYear ? (
            <>
              {/* Dashboard Stats (Original) */}
              <div id="dashboard-stats">
                <DashboardStats />
              </div>

              {/* Advanced Analytics Panels - stacked (not side-by-side) */}
              <div className="space-y-6 mb-8">
                {/* Progress Panel */}
                <MonthlyTrends />

                {/* Performance Radar */}
                <SpiderChart />
              </div>

            </>
          ) : (
            /* Empty State when no year selected */
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku di atas untuk melihat statistik dashboard yang menarik dan informatif
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardMain; 