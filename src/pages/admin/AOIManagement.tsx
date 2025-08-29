import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useAOI } from '@/contexts/AOIContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeaderPanel, YearSelectorPanel } from '@/components/panels';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const AOIManagement = () => {
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { 
    aoiTables, 
    recommendations, 
    createAOITable, 
    updateAOITable, 
    deleteAOITable,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation
  } = useAOI();
  const { direktorat, subdirektorat, divisi } = useStrukturPerusahaan();
  const { toast } = useToast();

  // State untuk dialog
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editingRecommendation, setEditingRecommendation] = useState<any>(null);
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());

  // State untuk form table
  const [tableForm, setTableForm] = useState({
    deskripsi: '',
    tahun: selectedYear || new Date().getFullYear(),
    isActive: true,
    targetDirektorat: '',
    targetSubdirektorat: '',
    targetDivisi: '',
    recommendations: [],
    tracking: []
  });

  // State untuk form recommendation
  const [recommendationForm, setRecommendationForm] = useState({
    no: 1,
    aoiTableId: 0,
    jenis: 'REKOMENDASI' as 'REKOMENDASI' | 'SARAN',
    rekomendasi: '',
    saran: '',
    pihakTerkait: 'DIREKSI' as 'RUPS' | 'DEWAN KOMISARIS' | 'SEKDEKOM' | 'KOMITE' | 'DIREKSI' | 'SEKRETARIS PERUSAHAAN',
    pihakTerkaitTindakLanjut: {
      direktorat: '',
      subdirektorat: '',
      divisi: ''
    },
    aspekAOI: '',
    tingkatUrgensi: 3 as 1 | 2 | 3 | 4 | 5,
    jangkaWaktu: '',
    tahun: selectedYear || new Date().getFullYear(),
    status: 'active' as 'active' | 'completed' | 'archived'
  });

  // Filter tables berdasarkan tahun
  const yearTables = selectedYear ? aoiTables.filter(table => table.tahun === selectedYear) : [];

  // Filter data struktur perusahaan berdasarkan tahun yang dipilih
  const yearDirektorat = selectedYear ? direktorat.filter(dir => dir.tahun === selectedYear) : [];
  const yearSubdirektorat = selectedYear ? subdirektorat.filter(sub => sub.tahun === selectedYear) : [];
  const yearDivisi = selectedYear ? divisi.filter(div => div.tahun === selectedYear) : [];

  // Get subdirektorat berdasarkan direktorat yang dipilih
  const getSubdirektoratByDirektorat = (direktoratId: number) => {
    return yearSubdirektorat.filter(sub => sub.direktoratId === direktoratId);
  };

  // Get divisi berdasarkan subdirektorat yang dipilih
  const getDivisiBySubdirektorat = (subdirektoratId: number) => {
    return yearDivisi.filter(div => div.subdirektoratId === subdirektoratId);
  };

  // Handle table form submission
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedYear || !tableForm.targetDirektorat.trim()) {
      toast({
        title: "Data tidak lengkap",
        description: "Minimal pilih tahun dan direktorat tujuan AOI",
        variant: "destructive"
      });
      return;
    }

    // Compute targetType based on deepest selection
    const computedTargetType = tableForm.targetDivisi
      ? 'divisi'
      : tableForm.targetSubdirektorat
        ? 'subdirektorat'
        : 'direktorat';

    // Auto-generate table name: AOI GCG <tahun> - <target path>
    const targetPath = [tableForm.targetDirektorat, tableForm.targetSubdirektorat, tableForm.targetDivisi]
      .filter(Boolean)
      .join(' / ');
    const autoName = `AOI GCG ${selectedYear} - ${targetPath}`;

    const payload = {
      nama: autoName,
      deskripsi: tableForm.deskripsi,
      tahun: selectedYear,
      isActive: tableForm.isActive,
      targetType: computedTargetType as 'direktorat' | 'subdirektorat' | 'divisi',
      targetDirektorat: tableForm.targetDirektorat,
      targetSubdirektorat: tableForm.targetSubdirektorat,
      targetDivisi: tableForm.targetDivisi,
      recommendations: [] as any[],
      tracking: [] as any[]
    };

    if (editingTable) {
      updateAOITable(editingTable.id, payload);
      toast({
        title: "Tabel AOI berhasil diupdate",
        description: "Data telah diperbarui"
      });
    } else {
      createAOITable(payload as any);
      toast({
        title: "Tabel AOI berhasil dibuat",
        description: "Tabel baru telah ditambahkan"
      });
    }

    // Reset form
    setTableForm({ 
      deskripsi: '', 
      tahun: selectedYear || new Date().getFullYear(),
      isActive: true,
      targetDirektorat: '',
      targetSubdirektorat: '',
      targetDivisi: '',
      recommendations: [],
      tracking: []
    });
    setEditingTable(null);
    setIsTableDialogOpen(false);
  };

  // Handle recommendation form submission
  const handleRecommendationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isRekomendasi = recommendationForm.jenis === 'REKOMENDASI';
    const hasText = isRekomendasi
      ? !!recommendationForm.rekomendasi.trim()
      : !!recommendationForm.saran.trim();

    if (!hasText || !recommendationForm.aoiTableId) {
      toast({
        title: "Data tidak lengkap",
        description: "Isi teks sesuai jenis dan pastikan tabel dipilih",
        variant: "destructive"
      });
      return;
    }

    if (editingRecommendation) {
      updateRecommendation(editingRecommendation.id, recommendationForm);
      toast({
        title: "Rekomendasi berhasil diupdate",
        description: "Data telah diperbarui"
      });
    } else {
      addRecommendation(recommendationForm);
      toast({
        title: "Rekomendasi berhasil ditambahkan",
        description: "Rekomendasi baru telah ditambahkan"
      });
    }

    // Reset form
    setRecommendationForm({
      no: 1,
      aoiTableId: 0,
      jenis: 'REKOMENDASI',
      rekomendasi: '',
      saran: '',
      pihakTerkait: 'DIREKSI',
      pihakTerkaitTindakLanjut: {
        direktorat: '',
        subdirektorat: '',
        divisi: ''
      },
      aspekAOI: '',
      tingkatUrgensi: 3,
      jangkaWaktu: '',
      tahun: selectedYear || new Date().getFullYear(),
      status: 'active'
    });
    setEditingRecommendation(null);
    setIsRecommendationDialogOpen(false);
  };

  // Handle edit table
  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setTableForm({
      deskripsi: table.deskripsi,
      tahun: table.tahun,
      isActive: table.isActive,
      targetDirektorat: table.targetDirektorat || '',
      targetSubdirektorat: table.targetSubdirektorat || '',
      targetDivisi: table.targetDivisi || '',
      recommendations: table.recommendations || [],
      tracking: table.tracking || []
    });
    setIsTableDialogOpen(true);
  };

  // Handle edit recommendation
  const handleEditRecommendation = (recommendation: any) => {
    setEditingRecommendation(recommendation);
    setRecommendationForm({
      no: recommendation.no,
      rekomendasi: recommendation.rekomendasi,
      saran: recommendation.saran,
      pihakTerkait: recommendation.pihakTerkait,
      pihakTerkaitTindakLanjut: recommendation.pihakTerkaitTindakLanjut,
      aspekAOI: recommendation.aspekAOI,
      tingkatUrgensi: recommendation.tingkatUrgensi,
      jangkaWaktu: recommendation.jangkaWaktu,
      tahun: recommendation.tahun,
      status: recommendation.status
    });
    setIsRecommendationDialogOpen(true);
  };

  // Handle delete table
  const handleDeleteTable = (tableId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus tabel ini? Semua rekomendasi akan ikut terhapus.')) {
      deleteAOITable(tableId);
      toast({
        title: "Tabel AOI berhasil dihapus",
        description: "Data telah dihapus"
      });
    }
  };

  // Handle delete recommendation
  const handleDeleteRecommendation = (recommendationId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus rekomendasi ini?')) {
      deleteRecommendation(recommendationId);
      toast({
        title: "Rekomendasi berhasil dihapus",
        description: "Data telah dihapus"
      });
    }
  };

  // Toggle table expansion
  const toggleTableExpansion = (tableId: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Get recommendations for a specific table
  const getTableRecommendations = (tableId: number) => {
    return recommendations.filter(rec => rec.aoiTableId === tableId);
  };

  // Get next recommendation number for a table
  const getNextRecommendationNumber = (tableId: number) => {
    const tableRecs = getTableRecommendations(tableId);
    return tableRecs.length + 1;
  };

  if (!selectedYear) {
    return (
      <>
        <Sidebar />
        <Topbar />
        <div className={`transition-all duration-300 ease-in-out pt-16 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          <div className="p-6">
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pilih Tahun Buku
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Silakan pilih tahun buku untuk mengelola Area of Improvement (AOI)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <Topbar />
      
      <div className={`transition-all duration-300 ease-in-out pt-16 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <div className="p-6">
          {/* Header */}
          <YearSelectorPanel
            className="mb-4"
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            title="Tahun Buku"
            description="Pilih tahun buku untuk mengelola AOI"
          />
          <PageHeaderPanel
            title="Area of Improvement (AOI) Management"
            subtitle={`Kelola rekomendasi perbaikan GCG untuk tahun ${selectedYear}`}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tabel AOI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTable ? 'Edit Tabel AOI' : 'Buat Tabel AOI Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    Buat tabel AOI untuk mengelola rekomendasi perbaikan GCG
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTableSubmit} className="space-y-4">
                  {/* Nama tabel di-generate otomatis: AOI GCG <tahun> - <target> */}
                  <div className="text-xs text-blue-700">Nama tabel akan dibuat otomatis: "AOI GCG &lt;tahun&gt; - &lt;target&gt;"</div>
                  {/* Deskripsi dihapus sesuai permintaan */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Direktorat</Label>
                      <Select
                        value={yearDirektorat.find(d => d.nama === tableForm.targetDirektorat)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const d = yearDirektorat.find(x => x.id.toString() === value);
                          setTableForm(prev => ({ ...prev, targetDirektorat: d?.nama || '', targetSubdirektorat: '', targetDivisi: '' }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Direktorat" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearDirektorat.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subdirektorat</Label>
                      <Select
                        disabled={!tableForm.targetDirektorat}
                        value={yearSubdirektorat.find(s => s.nama === tableForm.targetSubdirektorat)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const s = yearSubdirektorat.find(x => x.id.toString() === value);
                          setTableForm(prev => ({ ...prev, targetSubdirektorat: s?.nama || '', targetDivisi: '' }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Subdirektorat" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubdirektoratByDirektorat(yearDirektorat.find(d => d.nama === tableForm.targetDirektorat)?.id || 0).map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Divisi</Label>
                      <Select
                        disabled={!tableForm.targetSubdirektorat}
                        value={yearDivisi.find(v => v.nama === tableForm.targetDivisi)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const v = yearDivisi.find(x => x.id.toString() === value);
                          setTableForm(prev => ({ ...prev, targetDivisi: v?.nama || '' }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Divisi" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDivisiBySubdirektorat(yearSubdirektorat.find(s => s.nama === tableForm.targetSubdirektorat)?.id || 0).map(v => (
                            <SelectItem key={v.id} value={v.id.toString()}>{v.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Tahun dihapus dari dialog; memakai selectedYear dari context */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsTableDialogOpen(false);
                        setEditingTable(null);
                        setTableForm({ 
                          nama: '', 
                          deskripsi: '', 
                          tahun: selectedYear || new Date().getFullYear(),
                          isActive: true,
                          targetType: 'direktorat',
                          targetDirektorat: '',
                          targetSubdirektorat: '',
                          targetDivisi: '',
                          recommendations: [],
                          tracking: []
                        });
                      }}
                    >
                      Batal
                    </Button>
                    <Button type="submit">
                      {editingTable ? 'Update' : 'Buat'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* AOI Tables */}
          <div className="space-y-6">
            {yearTables.map((table) => (
              <Card key={table.id} className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTableExpansion(table.id)}
                        className="p-1 h-8 w-8"
                      >
                        {expandedTables.has(table.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 text-blue-900">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>{(table.nama?.split(' - ')[0]) || table.nama}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {table.targetDirektorat ? (
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-500">Direktorat</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[11px]">
                                  {table.targetDirektorat}
                                </span>
                              </div>
                            ) : null}
                            {table.targetSubdirektorat ? (
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-500">Subdirektorat</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 text-[11px]">
                                  {table.targetSubdirektorat}
                                </span>
                              </div>
                            ) : null}
                            {table.targetDivisi ? (
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-500">Divisi</span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[11px]">
                                  {table.targetDivisi}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </CardTitle>
                        <CardDescription className="text-blue-700 mt-2">
                          {table.deskripsi}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTable(table)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTable(table.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedTables.has(table.id) && (
                  <CardContent>
                    {/* Table Actions */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-blue-900">
                        Rekomendasi ({getTableRecommendations(table.id).length})
                      </h4>
                      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-200 text-green-600 hover:bg-green-50"
                            onClick={() => {
                              setRecommendationForm(prev => ({
                                ...prev,
                                aoiTableId: table.id,
                                no: getNextRecommendationNumber(table.id),
                                tahun: table.tahun,
                                jenis: 'REKOMENDASI',
                                rekomendasi: '',
                                saran: ''
                              }));
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Item AOI
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingRecommendation ? 'Edit Item AOI' : 'Tambah Item AOI'}
                            </DialogTitle>
                            <DialogDescription>
                              Isi data sesuai jenis yang dipilih
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleRecommendationSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Jenis</Label>
                                <Select
                                  value={recommendationForm.jenis}
                                  onValueChange={(v) => setRecommendationForm(prev => ({ ...prev, jenis: v as 'REKOMENDASI' | 'SARAN' }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="REKOMENDASI">Rekomendasi</SelectItem>
                                    <SelectItem value="SARAN">Saran</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="tingkatUrgensi">Tingkat Urgensi</Label>
                                <Select
                                  value={recommendationForm.tingkatUrgensi.toString()}
                                  onValueChange={(value) => setRecommendationForm(prev => ({ ...prev, tingkatUrgensi: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 ⭐ (Rendah)</SelectItem>
                                    <SelectItem value="2">2 ⭐⭐ (Sedang)</SelectItem>
                                    <SelectItem value="3">3 ⭐⭐⭐ (Tinggi)</SelectItem>
                                    <SelectItem value="4">4 ⭐⭐⭐⭐ (Sangat Tinggi)</SelectItem>
                                    <SelectItem value="5">5 ⭐⭐⭐⭐⭐ (Kritis)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {recommendationForm.jenis === 'REKOMENDASI' ? (
                              <div>
                                <Label htmlFor="rekomendasi">Rekomendasi</Label>
                                <Textarea
                                  id="rekomendasi"
                                  value={recommendationForm.rekomendasi}
                                  onChange={(e) => setRecommendationForm(prev => ({ ...prev, rekomendasi: e.target.value }))}
                                  placeholder="Deskripsi rekomendasi perbaikan"
                                  rows={3}
                                />
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor="saran">Saran</Label>
                                <Textarea
                                  id="saran"
                                  value={recommendationForm.saran}
                                  onChange={(e) => setRecommendationForm(prev => ({ ...prev, saran: e.target.value }))}
                                  placeholder="Saran perbaikan"
                                  rows={3}
                                />
                              </div>
                            )}
                            <div>
                              <Label>Organ Perusahaan yang menindak lanjuti</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  onValueChange={(value) => setRecommendationForm(prev => ({ ...prev, pihakTerkait: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih (opsional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RUPS">RUPS</SelectItem>
                                    <SelectItem value="DEWAN KOMISARIS">Dewan Komisaris</SelectItem>
                                    <SelectItem value="SEKDEKOM">Sekdekom</SelectItem>
                                    <SelectItem value="KOMITE">Komite</SelectItem>
                                    <SelectItem value="DIREKSI">Direksi</SelectItem>
                                    <SelectItem value="SEKRETARIS PERUSAHAAN">Sekretaris Perusahaan</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={recommendationForm.pihakTerkait}
                                  onChange={(e) => setRecommendationForm(prev => ({ ...prev, pihakTerkait: e.target.value }))}
                                  placeholder="Atau ketik manual (opsional)"
                                />
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1">Jika memilih dari daftar akan otomatis terisi; Anda juga bisa mengetik manual.</p>
                            </div>
                            {/* Direktorat/Subdirektorat/Divisi dihapus dari dialog item; sudah ditentukan di tabel */}
                            <div>
                              <Label htmlFor="aspekAOI">Aspek AOI (Optional)</Label>
                              <Input
                                id="aspekAOI"
                                value={recommendationForm.aspekAOI}
                                onChange={(e) => setRecommendationForm(prev => ({ ...prev, aspekAOI: e.target.value }))}
                                placeholder="Aspek AOI yang terkait"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsRecommendationDialogOpen(false);
                                  setEditingRecommendation(null);
                                  setRecommendationForm({
                                    no: 1,
                                    aoiTableId: 0,
                                    jenis: 'REKOMENDASI',
                                    rekomendasi: '',
                                    saran: '',
                                    pihakTerkait: 'DIREKSI',
                                    pihakTerkaitTindakLanjut: {
                                      direktorat: '',
                                      subdirektorat: '',
                                      divisi: ''
                                    },
                                    aspekAOI: '',
                                    tingkatUrgensi: 3,
                                    jangkaWaktu: '',
                                    tahun: selectedYear || new Date().getFullYear(),
                                    status: 'active'
                                  });
                                }}
                              >
                                Batal
                              </Button>
                              <Button type="submit">
                                {editingRecommendation ? 'Update' : 'Tambah'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Recommendations & Suggestions Tables per Group */}
                    {getTableRecommendations(table.id).length > 0 ? (
                      <div className="border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        {/* Header informasi target dihapus sesuai permintaan */}
                        <div className="flex flex-col gap-6">
                          {/* Rekomendasi */}
                          <div>
                            <div className="px-4 py-2 bg-blue-100 text-blue-900 font-semibold">Rekomendasi</div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-blue-50">
                                    <TableHead className="text-blue-900 font-semibold w-16 text-center">NO</TableHead>
                                    <TableHead className="text-blue-900 font-semibold">ISI</TableHead>
                                    <TableHead className="text-blue-900 font-semibold w-28 text-center">URGENSI</TableHead>
                                    <TableHead className="text-blue-900 font-semibold w-40 text-center">ORGAN MENINDAKLANJUTI</TableHead>
                                    <TableHead className="text-blue-900 font-semibold w-32 text-center">ASPEK</TableHead>
                                    <TableHead className="text-blue-900 font-semibold w-28 text-center">AKSI</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getTableRecommendations(table.id).filter(r => r.jenis === 'REKOMENDASI').map((rec) => (
                                    <TableRow key={rec.id} className="hover:bg-blue-50/50 border-b border-blue-100">
                                      <TableCell className="font-medium text-center text-blue-900">{rec.no}</TableCell>
                                      <TableCell>
                                        <div className="text-sm leading-relaxed text-gray-800">{rec.rekomendasi || '-'}</div>
                                        <div className="text-[10px] text-blue-700 mt-1">Pihak: {rec.pihakTerkait}</div>
                                        <div className="text-[10px] text-gray-500">Dir: {rec.pihakTerkaitTindakLanjut?.direktorat || '-'} | Subdir: {rec.pihakTerkaitTindakLanjut?.subdirektorat || '-'} | Div: {rec.pihakTerkaitTindakLanjut?.divisi || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-center">{renderStars(rec.tingkatUrgensi)}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-xs text-center">{rec.pihakTerkait || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-xs text-center">{rec.aspekAOI || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2 justify-center">
                                          <Button size="sm" variant="outline" onClick={() => handleEditRecommendation(rec)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                            <Edit className="w-3 h-3 mr-1" />Edit
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => handleDeleteRecommendation(rec.id)} className="border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 className="w-3 h-3 mr-1" />Hapus
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {/* Saran */}
                          <div>
                            <div className="px-4 py-2 bg-yellow-100 text-yellow-900 font-semibold">Saran</div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-yellow-50">
                                    <TableHead className="text-yellow-900 font-semibold w-16 text-center">NO</TableHead>
                                    <TableHead className="text-yellow-900 font-semibold">ISI</TableHead>
                                    <TableHead className="text-yellow-900 font-semibold w-28 text-center">URGENSI</TableHead>
                                    <TableHead className="text-yellow-900 font-semibold w-40 text-center">ORGAN MENINDAKLANJUTI</TableHead>
                                    <TableHead className="text-yellow-900 font-semibold w-32 text-center">ASPEK</TableHead>
                                    <TableHead className="text-yellow-900 font-semibold w-28 text-center">AKSI</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getTableRecommendations(table.id).filter(r => r.jenis === 'SARAN').map((rec) => (
                                    <TableRow key={rec.id} className="hover:bg-yellow-50/50 border-b border-yellow-100">
                                      <TableCell className="font-medium text-center text-yellow-900">{rec.no}</TableCell>
                                      <TableCell>
                                        <div className="text-sm leading-relaxed text-gray-800">{rec.saran || '-'}</div>
                                        <div className="text-[10px] text-blue-700 mt-1">Pihak: {rec.pihakTerkait}</div>
                                        <div className="text-[10px] text-gray-500">Dir: {rec.pihakTerkaitTindakLanjut?.direktorat || '-'} | Subdir: {rec.pihakTerkaitTindakLanjut?.subdirektorat || '-'} | Div: {rec.pihakTerkaitTindakLanjut?.divisi || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-center">{renderStars(rec.tingkatUrgensi)}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-xs text-center">{rec.pihakTerkait || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-xs text-center">{rec.aspekAOI || '-'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2 justify-center">
                                          <Button size="sm" variant="outline" onClick={() => handleEditRecommendation(rec)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                            <Edit className="w-3 h-3 mr-1" />Edit
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => handleDeleteRecommendation(rec.id)} className="border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 className="w-3 h-3 mr-1" />Hapus
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                        <p className="text-sm font-medium">Belum ada rekomendasi untuk tabel ini</p>
                        <p className="text-xs mt-1 text-blue-500">Tambahkan rekomendasi untuk memulai</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}

            {yearTables.length === 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
                <CardContent className="p-8">
                  <div className="text-center text-blue-600">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Tabel AOI</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Buat tabel AOI pertama untuk mengelola rekomendasi perbaikan GCG
                    </p>
                    <Button
                      onClick={() => setIsTableDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Tabel AOI Pertama
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AOIManagement;
