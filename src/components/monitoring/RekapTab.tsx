import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Filter, TrendingUp, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import YearStatisticsPanel from '@/components/dashboard/YearStatisticsPanel';

interface ChecklistItem {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
  status?: 'uploaded' | 'not_uploaded';
  file?: string;
}

interface AssignmentSummary {
  display: string;
  total: number;
  completed: number;
  percent: number;
}

interface RekapTabProps {
  selectedYear: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedAspek: string;
  setSelectedAspek: (aspek: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  aspects: string[];
  filteredChecklist: ChecklistItem[];
  assignmentSummary: AssignmentSummary[];
  getAspectStats: any[];
  getOverallProgress: any;
  getAspectIcon: (aspek: string) => any;
  getAspectColor: (aspek: string, progress: number) => string;
  isSidebarOpen: boolean;
}

const RekapTab: React.FC<RekapTabProps> = ({
  selectedYear,
  searchTerm,
  setSearchTerm,
  selectedAspek,
  setSelectedAspek,
  selectedStatus,
  setSelectedStatus,
  aspects,
  filteredChecklist,
  assignmentSummary,
  getAspectStats,
  getOverallProgress,
  getAspectIcon,
  getAspectColor,
  isSidebarOpen
}) => {
  return (
    <div className="space-y-6">
      {/* Statistik Tahun Buku */}
      {selectedYear && (
        <YearStatisticsPanel 
          selectedYear={selectedYear}
          aspectStats={getAspectStats}
          overallProgress={getOverallProgress}
          getAspectIcon={getAspectIcon}
          getAspectColor={getAspectColor}
          onAspectClick={(aspectName) => setSelectedAspek(aspectName)}
          isSidebarOpen={isSidebarOpen}
          title="Statistik Tahun Buku"
          description={`Overview dokumen dan assessment dokumen GCG tahun ${selectedYear}`}
          showOverallProgress={true}
        />
      )}

      {/* Breakdown Penugasan Subdirektorat */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-indigo-900">Breakdown Penugasan Subdirektorat</CardTitle>
          <CardDescription>
            Ringkasan jumlah dokumen GCG yang ditugaskan dan selesai per subdirektorat pada tahun {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignmentSummary.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada penugasan untuk tahun ini.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignmentSummary.map((row, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 mb-1 text-center truncate">{row.display}</div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-base font-bold text-blue-600">{row.completed}/{row.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daftar Dokumen GCG */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="flex items-center space-x-2 text-indigo-900">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Daftar Dokumen GCG - Tahun {selectedYear}</span>
              </CardTitle>
              <CardDescription className="text-indigo-700 mt-2">
                {searchTerm ? (
                  <span>
                    <span className="font-semibold text-indigo-600">{filteredChecklist.length}</span> item ditemukan untuk pencarian "{searchTerm}"
                  </span>
                ) : (
                  <span>
                    <span className="font-semibold text-indigo-600">{filteredChecklist.length}</span> item ditemukan
                  </span>
                )}
              </CardDescription>
            </div>
          </div>

          {/* All Filters Integrated */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                <Search className="w-4 h-4 mr-2 text-blue-600" />
                Pencarian Dokumen
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Cari berdasarkan deskripsi dokumen GCG..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Aspek Filter */}
              <div className="flex-1 min-w-0">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-orange-600" />
                  Filter Aspek
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedAspek === 'all' ? "default" : "outline"}
                    onClick={() => setSelectedAspek('all')}
                    size="sm"
                    className={selectedAspek === 'all' 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                      : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    }
                  >
                    Semua Aspek
                  </Button>
                  {aspects.map(aspek => {
                    const IconComponent = getAspectIcon(aspek);
                    return (
                      <Button
                        key={aspek}
                        variant={selectedAspek === aspek ? "default" : "outline"}
                        onClick={() => setSelectedAspek(aspek)}
                        size="sm"
                        className={`text-xs flex items-center space-x-2 ${
                          selectedAspek === aspek 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className={`w-3 h-3 ${selectedAspek === aspek ? 'text-white' : 'text-gray-600'}`} />
                        <span>{aspek.replace('ASPEK ', '').replace('. ', ' - ')}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex-1 min-w-0">
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                  Filter Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === 'all' ? "default" : "outline"}
                    onClick={() => setSelectedStatus('all')}
                    size="sm"
                    className={selectedStatus === 'all' 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                      : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    }
                  >
                    Semua Status
                  </Button>
                  <Button
                    variant={selectedStatus === 'uploaded' ? "default" : "outline"}
                    onClick={() => setSelectedStatus('uploaded')}
                    size="sm"
                    className={selectedStatus === 'uploaded' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                    }
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sudah Upload
                  </Button>
                  <Button
                    variant={selectedStatus === 'not_uploaded' ? "default" : "outline"}
                    onClick={() => setSelectedStatus('not_uploaded')}
                    size="sm"
                    className={selectedStatus === 'not_uploaded' 
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                      : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'
                    }
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Belum Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Content akan diisi oleh parent component */}
        </CardContent>
      </Card>
    </div>
  );
};

export default RekapTab;
