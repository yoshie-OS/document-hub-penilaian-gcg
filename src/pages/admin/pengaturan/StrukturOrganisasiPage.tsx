import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Layers,
  Building,
  Briefcase,
  Calendar,
  RefreshCw,
  List
} from 'lucide-react';

type ViewType = 'all' | 'direktorat' | 'subdirektorat' | 'anak-perusahaan' | 'divisi';

const StrukturOrganisasiPage = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, availableYears, setSelectedYear } = useYear();
  const {
    direktorat,
    subdirektorat,
    anakPerusahaan,
    divisi,
    addDirektorat,
    addSubdirektorat,
    addAnakPerusahaan,
    addDivisi,
    updateDirektorat,
    updateSubdirektorat,
    updateAnakPerusahaan,
    updateDivisi,
    deleteDirektorat,
    deleteSubdirektorat,
    deleteAnakPerusahaan,
    deleteDivisi,
    useDefaultData
  } = useStrukturPerusahaan();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState<ViewType>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [showDirektoratDialog, setShowDirektoratDialog] = useState(false);
  const [showSubdirektoratDialog, setShowSubdirektoratDialog] = useState(false);
  const [showAnakPerusahaanDialog, setShowAnakPerusahaanDialog] = useState(false);
  const [showDivisiDialog, setShowDivisiDialog] = useState(false);

  // Edit states
  const [editingDirektorat, setEditingDirektorat] = useState<{ id: number; nama: string; deskripsi: string } | null>(null);
  const [editingSubdirektorat, setEditingSubdirektorat] = useState<{ id: number; nama: string; deskripsi: string; direktoratId: number } | null>(null);
  const [editingAnakPerusahaan, setEditingAnakPerusahaan] = useState<{ id: number; nama: string; deskripsi: string } | null>(null);
  const [editingDivisi, setEditingDivisi] = useState<{ id: number; nama: string; deskripsi: string; subdirektoratId: number } | null>(null);

  // Form states
  const [direktoratForm, setDirektoratForm] = useState({ nama: '', deskripsi: '' });
  const [subdirektoratForm, setSubdirektoratForm] = useState({ nama: '', direktoratId: '', deskripsi: '' });
  const [anakPerusahaanForm, setAnakPerusahaanForm] = useState({ nama: '', deskripsi: '' });
  const [divisiForm, setDivisiForm] = useState({ nama: '', subdirektoratId: '', deskripsi: '' });

  // Handle add functions
  const handleAddDirektorat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!direktoratForm.nama.trim()) {
      toast({ title: "Error", description: "Nama direktorat wajib diisi!", variant: "destructive" });
      return;
    }
    try {
      await addDirektorat({
        nama: direktoratForm.nama,
        deskripsi: direktoratForm.deskripsi || '',
        tahun: selectedYear || new Date().getFullYear()
      });
      toast({ title: "Berhasil!", description: "Direktorat berhasil ditambahkan" });
      setDirektoratForm({ nama: '', deskripsi: '' });
      setShowDirektoratDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambahkan direktorat", variant: "destructive" });
    }
  };

  const handleAddSubdirektorat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdirektoratForm.nama.trim()) {
      toast({ title: "Error", description: "Nama subdirektorat wajib diisi!", variant: "destructive" });
      return;
    }
    try {
      await addSubdirektorat({
        nama: subdirektoratForm.nama,
        deskripsi: subdirektoratForm.deskripsi || '',
        tahun: selectedYear || new Date().getFullYear(),
        direktoratId: subdirektoratForm.direktoratId ? parseInt(subdirektoratForm.direktoratId) : undefined
      });
      toast({ title: "Berhasil!", description: "Subdirektorat berhasil ditambahkan" });
      setSubdirektoratForm({ nama: '', direktoratId: '', deskripsi: '' });
      setShowSubdirektoratDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambahkan subdirektorat", variant: "destructive" });
    }
  };

  const handleAddAnakPerusahaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anakPerusahaanForm.nama.trim()) {
      toast({ title: "Error", description: "Nama anak perusahaan wajib diisi!", variant: "destructive" });
      return;
    }
    try {
      await addAnakPerusahaan({
        nama: anakPerusahaanForm.nama,
        deskripsi: anakPerusahaanForm.deskripsi || '',
        tahun: selectedYear || new Date().getFullYear()
      });
      toast({ title: "Berhasil!", description: "Anak perusahaan berhasil ditambahkan" });
      setAnakPerusahaanForm({ nama: '', deskripsi: '' });
      setShowAnakPerusahaanDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambahkan anak perusahaan", variant: "destructive" });
    }
  };

  const handleAddDivisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisiForm.nama.trim()) {
      toast({ title: "Error", description: "Nama divisi wajib diisi!", variant: "destructive" });
      return;
    }
    try {
      await addDivisi({
        nama: divisiForm.nama,
        deskripsi: divisiForm.deskripsi || '',
        tahun: selectedYear || new Date().getFullYear(),
        subdirektoratId: divisiForm.subdirektoratId ? parseInt(divisiForm.subdirektoratId) : undefined
      });
      toast({ title: "Berhasil!", description: "Divisi berhasil ditambahkan" });
      setDivisiForm({ nama: '', subdirektoratId: '', deskripsi: '' });
      setShowDivisiDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambahkan divisi", variant: "destructive" });
    }
  };

  // Handle edit functions
  const handleEditDirektorat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDirektorat) return;
    try {
      await updateDirektorat(editingDirektorat.id, {
        nama: direktoratForm.nama,
        deskripsi: direktoratForm.deskripsi
      });
      toast({ title: "Berhasil!", description: "Direktorat berhasil diperbarui" });
      setEditingDirektorat(null);
      setDirektoratForm({ nama: '', deskripsi: '' });
      setShowDirektoratDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperbarui direktorat", variant: "destructive" });
    }
  };

  const handleEditSubdirektorat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubdirektorat) return;
    try {
      await updateSubdirektorat(editingSubdirektorat.id, {
        nama: subdirektoratForm.nama,
        deskripsi: subdirektoratForm.deskripsi,
        direktoratId: subdirektoratForm.direktoratId ? parseInt(subdirektoratForm.direktoratId) : undefined
      });
      toast({ title: "Berhasil!", description: "Subdirektorat berhasil diperbarui" });
      setEditingSubdirektorat(null);
      setSubdirektoratForm({ nama: '', direktoratId: '', deskripsi: '' });
      setShowSubdirektoratDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperbarui subdirektorat", variant: "destructive" });
    }
  };

  const handleEditAnakPerusahaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnakPerusahaan) return;
    try {
      await updateAnakPerusahaan(editingAnakPerusahaan.id, {
        nama: anakPerusahaanForm.nama,
        deskripsi: anakPerusahaanForm.deskripsi
      });
      toast({ title: "Berhasil!", description: "Anak perusahaan berhasil diperbarui" });
      setEditingAnakPerusahaan(null);
      setAnakPerusahaanForm({ nama: '', deskripsi: '' });
      setShowAnakPerusahaanDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperbarui anak perusahaan", variant: "destructive" });
    }
  };

  const handleEditDivisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivisi) return;
    try {
      await updateDivisi(editingDivisi.id, {
        nama: divisiForm.nama,
        deskripsi: divisiForm.deskripsi,
        subdirektoratId: divisiForm.subdirektoratId ? parseInt(divisiForm.subdirektoratId) : undefined
      });
      toast({ title: "Berhasil!", description: "Divisi berhasil diperbarui" });
      setEditingDivisi(null);
      setDivisiForm({ nama: '', subdirektoratId: '', deskripsi: '' });
      setShowDivisiDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memperbarui divisi", variant: "destructive" });
    }
  };

  // Open edit dialogs
  const openEditDirektorat = (item: any) => {
    setEditingDirektorat({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '' });
    setDirektoratForm({ nama: item.nama, deskripsi: item.deskripsi || '' });
    setShowDirektoratDialog(true);
  };

  const openEditSubdirektorat = (item: any) => {
    setEditingSubdirektorat({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '', direktoratId: item.direktoratId });
    setSubdirektoratForm({ nama: item.nama, direktoratId: item.direktoratId?.toString() || '', deskripsi: item.deskripsi || '' });
    setShowSubdirektoratDialog(true);
  };

  const openEditAnakPerusahaan = (item: any) => {
    setEditingAnakPerusahaan({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '' });
    setAnakPerusahaanForm({ nama: item.nama, deskripsi: item.deskripsi || '' });
    setShowAnakPerusahaanDialog(true);
  };

  const openEditDivisi = (item: any) => {
    setEditingDivisi({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '', subdirektoratId: item.subdirektoratId });
    setDivisiForm({ nama: item.nama, subdirektoratId: item.subdirektoratId?.toString() || '', deskripsi: item.deskripsi || '' });
    setShowDivisiDialog(true);
  };

  const handleUseDefaultData = async () => {
    setIsLoading(true);
    try {
      await useDefaultData(selectedYear || new Date().getFullYear());
      toast({ title: "Berhasil!", description: "Data default berhasil dimuat" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data default", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const viewCards = [
    { id: 'all' as ViewType, label: 'Semua', icon: List, count: (direktorat?.length || 0) + (subdirektorat?.length || 0) + (anakPerusahaan?.length || 0) + (divisi?.length || 0), color: 'gray' },
    { id: 'direktorat' as ViewType, label: 'Direktorat', icon: Building2, count: direktorat?.length || 0, color: 'blue' },
    { id: 'subdirektorat' as ViewType, label: 'Subdirektorat', icon: Layers, count: subdirektorat?.length || 0, color: 'purple' },
    { id: 'anak-perusahaan' as ViewType, label: 'Anak Perusahaan', icon: Building, count: anakPerusahaan?.length || 0, color: 'emerald' },
    { id: 'divisi' as ViewType, label: 'Divisi', icon: Briefcase, count: divisi?.length || 0, color: 'orange' }
  ];

  const getParentName = (type: 'subdirektorat' | 'divisi', item: any) => {
    if (type === 'subdirektorat') {
      const parent = direktorat?.find(d => d.id === item.direktoratId);
      return parent?.nama || '-';
    } else if (type === 'divisi') {
      const parent = subdirektorat?.find(s => s.id === item.subdirektoratId);
      return parent?.nama || '-';
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <Sidebar />

      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/pengaturan')}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pengaturan
            </Button>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Struktur Organisasi</h1>
                  <p className="text-gray-500">Kelola direktorat, subdirektorat, anak perusahaan, dan divisi</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Select value={selectedYear?.toString() || ''} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleUseDefaultData} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Data Default'}
                </Button>
              </div>
            </div>
          </div>

          {/* View Cards - Horizontal */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {viewCards.map((card) => {
              const Icon = card.icon;
              const isActive = activeView === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveView(card.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className={`text-2xl font-bold ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{card.count}</span>
                  </div>
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>{card.label}</p>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={() => { setEditingDirektorat(null); setDirektoratForm({ nama: '', deskripsi: '' }); setShowDirektoratDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Direktorat
            </Button>
            <Button onClick={() => { setEditingSubdirektorat(null); setSubdirektoratForm({ nama: '', direktoratId: '', deskripsi: '' }); setShowSubdirektoratDialog(true); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Subdirektorat
            </Button>
            <Button onClick={() => { setEditingAnakPerusahaan(null); setAnakPerusahaanForm({ nama: '', deskripsi: '' }); setShowAnakPerusahaanDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Anak Perusahaan
            </Button>
            <Button onClick={() => { setEditingDivisi(null); setDivisiForm({ nama: '', subdirektoratId: '', deskripsi: '' }); setShowDivisiDialog(true); }} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Divisi
            </Button>
          </div>

          {/* Tables */}
          <div className="space-y-6">
            {/* Direktorat Table */}
            {(activeView === 'all' || activeView === 'direktorat') && (
              <Card className="border border-blue-200">
                <CardHeader className="bg-blue-50/50">
                  <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                    Direktorat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="w-24">Tahun</TableHead>
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {direktorat && direktorat.length > 0 ? direktorat.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell className="text-gray-500">{item.deskripsi || '-'}</TableCell>
                          <TableCell>{item.tahun}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDirektorat(item)} className="text-blue-600"><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteDirektorat(item.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Belum ada data direktorat</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Subdirektorat Table */}
            {(activeView === 'all' || activeView === 'subdirektorat') && (
              <Card className="border border-purple-200">
                <CardHeader className="bg-purple-50/50">
                  <CardTitle className="text-lg font-semibold text-purple-900 flex items-center">
                    <Layers className="w-5 h-5 text-purple-600 mr-2" />
                    Subdirektorat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Direktorat</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="w-24">Tahun</TableHead>
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subdirektorat && subdirektorat.length > 0 ? subdirektorat.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell><Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{getParentName('subdirektorat', item)}</Badge></TableCell>
                          <TableCell className="text-gray-500">{item.deskripsi || '-'}</TableCell>
                          <TableCell>{item.tahun}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditSubdirektorat(item)} className="text-purple-600"><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteSubdirektorat(item.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Belum ada data subdirektorat</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Anak Perusahaan Table */}
            {(activeView === 'all' || activeView === 'anak-perusahaan') && (
              <Card className="border border-emerald-200">
                <CardHeader className="bg-emerald-50/50">
                  <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center">
                    <Building className="w-5 h-5 text-emerald-600 mr-2" />
                    Anak Perusahaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="w-24">Tahun</TableHead>
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anakPerusahaan && anakPerusahaan.length > 0 ? anakPerusahaan.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell className="text-gray-500">{item.deskripsi || '-'}</TableCell>
                          <TableCell>{item.tahun}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditAnakPerusahaan(item)} className="text-emerald-600"><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteAnakPerusahaan(item.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Belum ada data anak perusahaan</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Divisi Table */}
            {(activeView === 'all' || activeView === 'divisi') && (
              <Card className="border border-orange-200">
                <CardHeader className="bg-orange-50/50">
                  <CardTitle className="text-lg font-semibold text-orange-900 flex items-center">
                    <Briefcase className="w-5 h-5 text-orange-600 mr-2" />
                    Divisi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Subdirektorat</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="w-24">Tahun</TableHead>
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {divisi && divisi.length > 0 ? divisi.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell><Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">{getParentName('divisi', item)}</Badge></TableCell>
                          <TableCell className="text-gray-500">{item.deskripsi || '-'}</TableCell>
                          <TableCell>{item.tahun}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDivisi(item)} className="text-orange-600"><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteDivisi(item.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Belum ada data divisi</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <Dialog open={showDirektoratDialog} onOpenChange={(open) => { setShowDirektoratDialog(open); if (!open) { setEditingDirektorat(null); setDirektoratForm({ nama: '', deskripsi: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDirektorat ? 'Edit Direktorat' : 'Tambah Direktorat'}</DialogTitle>
            <Badge variant="outline" className="w-fit mt-2 bg-blue-50 text-blue-700 border-blue-200">
              <Calendar className="w-3 h-3 mr-1" /> Tahun {selectedYear}
            </Badge>
          </DialogHeader>
          <form onSubmit={editingDirektorat ? handleEditDirektorat : handleAddDirektorat} className="space-y-4">
            <div>
              <Label>Nama Direktorat <span className="text-red-500">*</span></Label>
              <Input value={direktoratForm.nama} onChange={(e) => setDirektoratForm({ ...direktoratForm, nama: e.target.value })} placeholder="Masukkan nama direktorat" className="mt-1" />
            </div>
            <div>
              <Label>Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Textarea value={direktoratForm.deskripsi} onChange={(e) => setDirektoratForm({ ...direktoratForm, deskripsi: e.target.value })} placeholder="Masukkan deskripsi" className="mt-1" rows={3} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDirektoratDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingDirektorat ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubdirektoratDialog} onOpenChange={(open) => { setShowSubdirektoratDialog(open); if (!open) { setEditingSubdirektorat(null); setSubdirektoratForm({ nama: '', direktoratId: '', deskripsi: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubdirektorat ? 'Edit Subdirektorat' : 'Tambah Subdirektorat'}</DialogTitle>
            <Badge variant="outline" className="w-fit mt-2 bg-purple-50 text-purple-700 border-purple-200">
              <Calendar className="w-3 h-3 mr-1" /> Tahun {selectedYear}
            </Badge>
          </DialogHeader>
          <form onSubmit={editingSubdirektorat ? handleEditSubdirektorat : handleAddSubdirektorat} className="space-y-4">
            <div>
              <Label>Nama Subdirektorat <span className="text-red-500">*</span></Label>
              <Input value={subdirektoratForm.nama} onChange={(e) => setSubdirektoratForm({ ...subdirektoratForm, nama: e.target.value })} placeholder="Masukkan nama subdirektorat" className="mt-1" />
            </div>
            <div>
              <Label>Direktorat <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Select value={subdirektoratForm.direktoratId} onValueChange={(value) => setSubdirektoratForm({ ...subdirektoratForm, direktoratId: value })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih Direktorat" /></SelectTrigger>
                <SelectContent>{direktorat?.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.nama}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Textarea value={subdirektoratForm.deskripsi} onChange={(e) => setSubdirektoratForm({ ...subdirektoratForm, deskripsi: e.target.value })} placeholder="Masukkan deskripsi" className="mt-1" rows={3} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowSubdirektoratDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">{editingSubdirektorat ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnakPerusahaanDialog} onOpenChange={(open) => { setShowAnakPerusahaanDialog(open); if (!open) { setEditingAnakPerusahaan(null); setAnakPerusahaanForm({ nama: '', deskripsi: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnakPerusahaan ? 'Edit Anak Perusahaan' : 'Tambah Anak Perusahaan'}</DialogTitle>
            <Badge variant="outline" className="w-fit mt-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              <Calendar className="w-3 h-3 mr-1" /> Tahun {selectedYear}
            </Badge>
          </DialogHeader>
          <form onSubmit={editingAnakPerusahaan ? handleEditAnakPerusahaan : handleAddAnakPerusahaan} className="space-y-4">
            <div>
              <Label>Nama Anak Perusahaan <span className="text-red-500">*</span></Label>
              <Input value={anakPerusahaanForm.nama} onChange={(e) => setAnakPerusahaanForm({ ...anakPerusahaanForm, nama: e.target.value })} placeholder="Masukkan nama anak perusahaan" className="mt-1" />
            </div>
            <div>
              <Label>Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Textarea value={anakPerusahaanForm.deskripsi} onChange={(e) => setAnakPerusahaanForm({ ...anakPerusahaanForm, deskripsi: e.target.value })} placeholder="Masukkan deskripsi" className="mt-1" rows={3} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAnakPerusahaanDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingAnakPerusahaan ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDivisiDialog} onOpenChange={(open) => { setShowDivisiDialog(open); if (!open) { setEditingDivisi(null); setDivisiForm({ nama: '', subdirektoratId: '', deskripsi: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDivisi ? 'Edit Divisi' : 'Tambah Divisi'}</DialogTitle>
            <Badge variant="outline" className="w-fit mt-2 bg-orange-50 text-orange-700 border-orange-200">
              <Calendar className="w-3 h-3 mr-1" /> Tahun {selectedYear}
            </Badge>
          </DialogHeader>
          <form onSubmit={editingDivisi ? handleEditDivisi : handleAddDivisi} className="space-y-4">
            <div>
              <Label>Nama Divisi <span className="text-red-500">*</span></Label>
              <Input value={divisiForm.nama} onChange={(e) => setDivisiForm({ ...divisiForm, nama: e.target.value })} placeholder="Masukkan nama divisi" className="mt-1" />
            </div>
            <div>
              <Label>Subdirektorat <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Select value={divisiForm.subdirektoratId} onValueChange={(value) => setDivisiForm({ ...divisiForm, subdirektoratId: value })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih Subdirektorat" /></SelectTrigger>
                <SelectContent>{subdirektorat?.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></Label>
              <Textarea value={divisiForm.deskripsi} onChange={(e) => setDivisiForm({ ...divisiForm, deskripsi: e.target.value })} placeholder="Masukkan deskripsi" className="mt-1" rows={3} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDivisiDialog(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">{editingDivisi ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StrukturOrganisasiPage;
