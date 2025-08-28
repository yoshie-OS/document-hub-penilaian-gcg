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
import { useAOI, AOITable, AOIRecommendation } from '@/contexts/AOIContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeaderPanel } from '@/components/panels';
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
  const { selectedYear } = useYear();
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
  const { toast } = useToast();

  // State untuk dialog
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AOITable | null>(null);
  const [editingRecommendation, setEditingRecommendation] = useState<AOIRecommendation | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());

  // State untuk form table
  const [tableForm, setTableForm] = useState({
    nama: '',
    deskripsi: '',
    tahun: selectedYear || new Date().getFullYear(),
    isActive: true,
    recommendations: [],
    tracking: []
  });

  // State untuk form recommendation
  const [recommendationForm, setRecommendationForm] = useState({
    no: 1,
    rekomendasi: '',
    pihakTerkait: '',
    tingkatUrgensi: 3 as 1 | 2 | 3 | 4 | 5,
    jangkaWaktu: '',
    tahun: selectedYear || new Date().getFullYear()
  });

  // Filter tables berdasarkan tahun
  const yearTables = selectedYear ? aoiTables.filter(table => table.tahun === selectedYear) : [];

  // Handle table form submission
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableForm.nama.trim() || !tableForm.deskripsi.trim()) {
      toast({
        title: "Data tidak lengkap",
        description: "Nama dan deskripsi harus diisi",
        variant: "destructive"
      });
      return;
    }

    if (editingTable) {
      updateAOITable(editingTable.id, tableForm);
      toast({
        title: "Tabel AOI berhasil diupdate",
        description: "Data telah diperbarui"
      });
    } else {
      createAOITable(tableForm);
      toast({
        title: "Tabel AOI berhasil dibuat",
        description: "Tabel baru telah ditambahkan"
      });
    }

    // Reset form
    setTableForm({ 
      nama: '', 
      deskripsi: '', 
      tahun: selectedYear || new Date().getFullYear(),
      isActive: true,
      recommendations: [],
      tracking: []
    });
    setEditingTable(null);
    setIsTableDialogOpen(false);
  };

  // Handle recommendation form submission
  const handleRecommendationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recommendationForm.rekomendasi.trim() || !recommendationForm.pihakTerkait.trim()) {
      toast({
        title: "Data tidak lengkap",
        description: "Rekomendasi dan pihak terkait harus diisi",
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
      rekomendasi: '',
      pihakTerkait: '',
      tingkatUrgensi: 3,
      jangkaWaktu: '',
      tahun: selectedYear || new Date().getFullYear()
    });
    setEditingRecommendation(null);
    setIsRecommendationDialogOpen(false);
  };

  // Handle edit table
  const handleEditTable = (table: AOITable) => {
    setEditingTable(table);
    setTableForm({
      nama: table.nama,
      deskripsi: table.deskripsi,
      tahun: table.tahun,
      isActive: table.isActive,
      recommendations: table.recommendations || [],
      tracking: table.tracking || []
    });
    setIsTableDialogOpen(true);
  };

  // Handle edit recommendation
  const handleEditRecommendation = (recommendation: AOIRecommendation) => {
    setEditingRecommendation(recommendation);
    setRecommendationForm({
      no: recommendation.no,
      rekomendasi: recommendation.rekomendasi,
      pihakTerkait: recommendation.pihakTerkait,
      tingkatUrgensi: recommendation.tingkatUrgensi,
      jangkaWaktu: recommendation.jangkaWaktu,
      tahun: recommendation.tahun
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
    return recommendations.filter(rec => rec.id === tableId);
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
                  <div>
                    <Label htmlFor="nama">Nama Tabel</Label>
                    <Input
                      id="nama"
                      value={tableForm.nama}
                      onChange={(e) => setTableForm(prev => ({ ...prev, nama: e.target.value }))}
                      placeholder="Contoh: AOI GCG 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea
                      id="deskripsi"
                      value={tableForm.deskripsi}
                      onChange={(e) => setTableForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                      placeholder="Deskripsi tabel AOI"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tahun">Tahun</Label>
                    <Input
                      id="tahun"
                      type="number"
                      value={tableForm.tahun}
                      onChange={(e) => setTableForm(prev => ({ ...prev, tahun: parseInt(e.target.value) }))}
                      min={2000}
                      max={2100}
                    />
                  </div>
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
                        <CardTitle className="flex items-center space-x-2 text-blue-900">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span>{table.nama}</span>
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
                                no: getNextRecommendationNumber(table.id),
                                tahun: table.tahun
                              }));
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Rekomendasi
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingRecommendation ? 'Edit Rekomendasi' : 'Tambah Rekomendasi Baru'}
                            </DialogTitle>
                            <DialogDescription>
                              Tambah rekomendasi perbaikan GCG baru
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleRecommendationSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="no">Nomor</Label>
                                <Input
                                  id="no"
                                  type="number"
                                  value={recommendationForm.no}
                                  onChange={(e) => setRecommendationForm(prev => ({ ...prev, no: parseInt(e.target.value) }))}
                                  min={1}
                                />
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
                            <div>
                              <Label htmlFor="pihakTerkait">Pihak Terkait Tindak Lanjut</Label>
                              <Input
                                id="pihakTerkait"
                                value={recommendationForm.pihakTerkait}
                                onChange={(e) => setRecommendationForm(prev => ({ ...prev, pihakTerkait: e.target.value }))}
                                placeholder="Contoh: Direksi, Dewan Komisaris"
                              />
                            </div>
                            <div>
                              <Label htmlFor="jangkaWaktu">Jangka Waktu</Label>
                              <Input
                                id="jangkaWaktu"
                                value={recommendationForm.jangkaWaktu}
                                onChange={(e) => setRecommendationForm(prev => ({ ...prev, jangkaWaktu: e.target.value }))}
                                placeholder="Contoh: 3 bulan, Q4 2024"
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
                                    rekomendasi: '',
                                    pihakTerkait: '',
                                    tingkatUrgensi: 3,
                                    jangkaWaktu: '',
                                    tahun: selectedYear || new Date().getFullYear()
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

                    {/* Recommendations Table */}
                    {getTableRecommendations(table.id).length > 0 ? (
                      <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-50">
                              <TableHead className="text-blue-900 font-semibold w-16">NO</TableHead>
                              <TableHead className="text-blue-900 font-semibold">Rekomendasi</TableHead>
                              <TableHead className="text-blue-900 font-semibold">Pihak Terkait</TableHead>
                              <TableHead className="text-blue-900 font-semibold w-32">Tingkat Urgensi</TableHead>
                              <TableHead className="text-blue-900 font-semibold w-32">Jangka Waktu</TableHead>
                              <TableHead className="text-blue-900 font-semibold w-32">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTableRecommendations(table.id).map((rec) => (
                              <TableRow key={rec.id} className="hover:bg-blue-50/50">
                                <TableCell className="font-medium text-center">{rec.no}</TableCell>
                                <TableCell className="max-w-md">
                                  <div className="text-sm leading-relaxed">{rec.rekomendasi}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{rec.pihakTerkait}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    {renderStars(rec.tingkatUrgensi)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-center">{rec.jangkaWaktu}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditRecommendation(rec)}
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteRecommendation(rec.id)}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Hapus
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-blue-600">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                        <p className="text-sm">Belum ada rekomendasi untuk tabel ini</p>
                        <p className="text-xs mt-1">Tambahkan rekomendasi untuk memulai</p>
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
