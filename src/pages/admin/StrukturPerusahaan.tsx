import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { Users, Briefcase, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { seedSubdirektorat } from '@/lib/seed/seedDirektorat';
import { seedAnakPerusahaan } from '@/lib/seed/seedAnakPerusahaan';
import { triggerStrukturPerusahaanUpdate } from '@/lib/strukturPerusahaan';
import { YearSelectorPanel, ConfirmDialog, FormDialog, ActionButton, IconButton, PageHeaderPanel } from '@/components/panels';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface Direktorat {
  id: number;
  nama: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

interface Subdirektorat {
  id: number;
  nama: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
}

interface Divisi {
  id: number;
  nama: string;
  tahun: number;
  kategori?: string;
  createdAt: Date;
  isActive: boolean;
}

interface AnakPerusahaan {
  id: number;
  nama: string;
  tahun: number;
  kategori: string;
  deskripsi: string;
  createdAt: Date;
  isActive: boolean;
}

// Use years from global context instead of local function

const DEFAULT_DIVISI = [
  // Anak Usaha
  { nama: 'PT Pos Logistik', kategori: 'Anak Perusahaan' },
  { nama: 'PT Pos Finansial', kategori: 'Anak Perusahaan' },
  { nama: 'PT Pos Properti', kategori: 'Anak Perusahaan' },
  { nama: 'Dapen Pos', kategori: 'Anak Perusahaan' },
  { nama: 'Dapensi Trio Usaha', kategori: 'Anak Perusahaan' },
  { nama: 'Dapensi Dwikarya', kategori: 'Anak Perusahaan' },
  { nama: 'Yayasan Bhakti Pendidikan Pos Indonesia', kategori: 'Anak Perusahaan' },
  // Divisi Operasional
  { nama: 'Courier', kategori: 'Divisi Operasional' },
  { nama: 'Digital Service', kategori: 'Divisi Operasional' },
  { nama: 'Customer Experience', kategori: 'Divisi Operasional' },
  // Divisi Pendukung
  { nama: 'Legal', kategori: 'Divisi Pendukung' },
  { nama: 'HR', kategori: 'Divisi Pendukung' },
  { nama: 'Finance', kategori: 'Divisi Pendukung' },
  { nama: 'Audit', kategori: 'Divisi Pendukung' },
  { nama: 'Risk Management', kategori: 'Divisi Pendukung' },
];

const StrukturPerusahaan = () => {
  const { isSidebarOpen } = useSidebar();
  const { availableYears } = useYear();
  const { toast } = useToast();
  const [direktorat, setDirektorat] = useState<Direktorat[]>([]);
  const [subdirektorat, setSubdirektorat] = useState<Subdirektorat[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [anakPerusahaan, setAnakPerusahaan] = useState<AnakPerusahaan[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Direktorat states
  const [isDirektoratDialogOpen, setIsDirektoratDialogOpen] = useState(false);
  const [editingDirektorat, setEditingDirektorat] = useState<Direktorat | null>(null);
  const [direktoratToDelete, setDirektoratToDelete] = useState<Direktorat | null>(null);
  const [direktoratForm, setDirektoratForm] = useState({ nama: '' });

  // Subdirektorat states
  const [isSubdirektoratDialogOpen, setIsSubdirektoratDialogOpen] = useState(false);
  const [editingSubdirektorat, setEditingSubdirektorat] = useState<Subdirektorat | null>(null);
  const [subdirektoratToDelete, setSubdirektoratToDelete] = useState<Subdirektorat | null>(null);
  const [subdirektoratForm, setSubdirektoratForm] = useState({ nama: '' });

  // Divisi states
  const [isDivisiDialogOpen, setIsDivisiDialogOpen] = useState(false);
  const [editingDivisi, setEditingDivisi] = useState<Divisi | null>(null);
  const [divisiToDelete, setDivisiToDelete] = useState<Divisi | null>(null);
  const [divisiForm, setDivisiForm] = useState({ nama: '' });

  // Anak Perusahaan states
  const [isAnakPerusahaanDialogOpen, setIsAnakPerusahaanDialogOpen] = useState(false);
  const [editingAnakPerusahaan, setEditingAnakPerusahaan] = useState<AnakPerusahaan | null>(null);
  const [anakPerusahaanToDelete, setAnakPerusahaanToDelete] = useState<AnakPerusahaan | null>(null);
  const [anakPerusahaanForm, setAnakPerusahaanForm] = useState({ nama: '', kategori: '', deskripsi: '' });

  // Tambahkan state untuk trigger reload data per tahun
  const [reloadFlag, setReloadFlag] = useState(0);

  // Helper function untuk toast notification
  const showUpdateToast = (type: 'direktorat' | 'subdirektorat' | 'divisi' | 'anakPerusahaan') => {
    const labels = {
      direktorat: 'Direktorat',
      subdirektorat: 'Sub Direktorat',
      divisi: 'Divisi',
      anakPerusahaan: 'Anak Perusahaan & Badan Afiliasi'
    };
    
    toast({
      title: "Data terupdate",
      description: `Data ${labels[type]} telah diperbarui di semua komponen`,
    });
  };

  // Load data dari localStorage setiap kali tahun berubah atau reloadFlag berubah
  useEffect(() => {
    const direktoratData = localStorage.getItem('direktorat');
    const subdirektoratData = localStorage.getItem('subdirektorat');
    const divisiData = localStorage.getItem('divisi');
    const anakPerusahaanData = localStorage.getItem('anakPerusahaan');
    
    if (direktoratData) {
      const direktoratList = JSON.parse(direktoratData);
      setDirektorat(direktoratList.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt || Date.now())
      })));
    } else {
      setDirektorat([]);
    }
    
    if (subdirektoratData) {
      const subdirektoratList = JSON.parse(subdirektoratData);
      setSubdirektorat(subdirektoratList.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt || Date.now())
      })));
    } else {
      setSubdirektorat([]);
    }
    
    if (divisiData) {
      const divisiList = JSON.parse(divisiData);
      setDivisi(divisiList.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt || Date.now())
      })));
    } else {
      setDivisi([]);
    }

    if (anakPerusahaanData) {
      const anakPerusahaanList = JSON.parse(anakPerusahaanData);
      setAnakPerusahaan(anakPerusahaanList.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt || Date.now())
      })));
    } else {
      setAnakPerusahaan([]);
    }
  }, [selectedYear, reloadFlag]);

  // Direktorat handlers
  const handleDirektoratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!direktoratForm.nama) {
      alert('Nama wajib diisi!');
      return;
    }
    if (editingDirektorat) {
      const updatedDirektorat: Direktorat = {
        ...editingDirektorat,
        nama: direktoratForm.nama,
        tahun: selectedYear
      };
      const updatedDirektoratList = direktorat.map(d => d.id === editingDirektorat.id ? updatedDirektorat : d);
      setDirektorat(updatedDirektoratList);
      localStorage.setItem('direktorat', JSON.stringify(updatedDirektoratList));
      setEditingDirektorat(null);
      alert('Direktorat berhasil diupdate!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('direktorat');
    } else {
      const newDirektorat: Direktorat = {
        id: Date.now(),
        nama: direktoratForm.nama,
        tahun: selectedYear,
        createdAt: new Date(),
        isActive: true
      };
      const updatedDirektoratList = [...direktorat, newDirektorat];
      setDirektorat(updatedDirektoratList);
      localStorage.setItem('direktorat', JSON.stringify(updatedDirektoratList));
      alert('Direktorat berhasil ditambahkan!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('direktorat');
    }
    setDirektoratForm({ nama: '' });
    setIsDirektoratDialogOpen(false);
  };
  const handleDeleteDirektorat = () => {
    if (!direktoratToDelete) return;
    const updatedDirektoratList = direktorat.filter(d => d.id !== direktoratToDelete.id);
    setDirektorat(updatedDirektoratList);
    localStorage.setItem('direktorat', JSON.stringify(updatedDirektoratList));
    setDirektoratToDelete(null);
    alert('Direktorat berhasil dihapus!');
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('direktorat');
  };
  const openEditDirektorat = (direktorat: Direktorat) => {
    setEditingDirektorat(direktorat);
    setDirektoratForm({ nama: direktorat.nama });
    setIsDirektoratDialogOpen(true);
  };
  const openAddDirektorat = () => {
    setEditingDirektorat(null);
    setDirektoratForm({ nama: '' });
    setIsDirektoratDialogOpen(true);
  };

  // Subdirektorat handlers
  const handleSubdirektoratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdirektoratForm.nama) {
      alert('Nama wajib diisi!');
      return;
    }
    if (editingSubdirektorat) {
      const updatedSubdirektorat: Subdirektorat = {
        ...editingSubdirektorat,
        nama: subdirektoratForm.nama,
        tahun: selectedYear
      };
      const updatedSubdirektoratList = subdirektorat.map(d => d.id === editingSubdirektorat.id ? updatedSubdirektorat : d);
      setSubdirektorat(updatedSubdirektoratList);
      localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektoratList));
      setEditingSubdirektorat(null);
      alert('Subdirektorat berhasil diupdate!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('subdirektorat');
    } else {
      const newSubdirektorat: Subdirektorat = {
        id: Date.now(),
        nama: subdirektoratForm.nama,
        tahun: selectedYear,
        createdAt: new Date(),
        isActive: true
      };
      const updatedSubdirektoratList = [...subdirektorat, newSubdirektorat];
      setSubdirektorat(updatedSubdirektoratList);
      localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektoratList));
      alert('Subdirektorat berhasil ditambahkan!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('subdirektorat');
    }
    setSubdirektoratForm({ nama: '' });
    setIsSubdirektoratDialogOpen(false);
  };
  const handleDeleteSubdirektorat = () => {
    if (!subdirektoratToDelete) return;
    const updatedSubdirektoratList = subdirektorat.filter(d => d.id !== subdirektoratToDelete.id);
    setSubdirektorat(updatedSubdirektoratList);
    localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektoratList));
    setSubdirektoratToDelete(null);
    alert('Subdirektorat berhasil dihapus!');
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('subdirektorat');
  };
  const openEditSubdirektorat = (subdirektorat: Subdirektorat) => {
    setEditingSubdirektorat(subdirektorat);
    setSubdirektoratForm({ nama: subdirektorat.nama });
    setIsSubdirektoratDialogOpen(true);
  };
  const openAddSubdirektorat = () => {
    setEditingSubdirektorat(null);
    setSubdirektoratForm({ nama: '' });
    setIsSubdirektoratDialogOpen(true);
  };

  // Divisi handlers
  const handleDivisiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisiForm.nama) {
      alert('Nama divisi wajib diisi!');
      return;
    }
    if (editingDivisi) {
      const updatedDivisi: Divisi = {
        ...editingDivisi,
        nama: divisiForm.nama,
        tahun: selectedYear
      };
      const updatedDivisiList = divisi.map(d => d.id === editingDivisi.id ? updatedDivisi : d);
      setDivisi(updatedDivisiList);
      localStorage.setItem('divisi', JSON.stringify(updatedDivisiList));
      setEditingDivisi(null);
      alert('Divisi berhasil diupdate!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('divisi');
    } else {
      const newDivisi: Divisi = {
        id: Date.now(),
        nama: divisiForm.nama,
        tahun: selectedYear,
        createdAt: new Date(),
        isActive: true
      };
      const updatedDivisiList = [...divisi, newDivisi];
      setDivisi(updatedDivisiList);
      localStorage.setItem('divisi', JSON.stringify(updatedDivisiList));
      alert('Divisi berhasil ditambahkan!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('divisi');
    }
    setDivisiForm({ nama: '' });
    setIsDivisiDialogOpen(false);
  };
  const handleDeleteDivisi = () => {
    if (!divisiToDelete) return;
    const updatedDivisiList = divisi.filter(d => d.id !== divisiToDelete.id);
    setDivisi(updatedDivisiList);
    localStorage.setItem('divisi', JSON.stringify(updatedDivisiList));
    setDivisiToDelete(null);
    alert('Divisi berhasil dihapus!');
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('divisi');
  };
  const openEditDivisi = (divisi: Divisi) => {
    setEditingDivisi(divisi);
    setDivisiForm({ nama: divisi.nama });
    setIsDivisiDialogOpen(true);
  };
  const openAddDivisi = () => {
    setEditingDivisi(null);
    setDivisiForm({ nama: '' });
    setIsDivisiDialogOpen(true);
  };

  // Filter data by selected year
  const filteredDirektorat = direktorat.filter(d => d.tahun === selectedYear);
  const filteredSubdirektorat = subdirektorat.filter(d => d.tahun === selectedYear);
  const filteredDivisi = divisi.filter(d => d.tahun === selectedYear);
  const filteredAnakPerusahaan = anakPerusahaan.filter(d => d.tahun === selectedYear);

  // Handler untuk data default direktorat
  const getAllUniqueDirektoratNames = () => {
    const direktoratData = localStorage.getItem('direktorat');
    if (!direktoratData) return [];
    const direktoratList = JSON.parse(direktoratData);
    const namesSet = new Set<string>();
    direktoratList.forEach((d: any) => {
      if (d.nama && typeof d.nama === 'string') {
        namesSet.add(d.nama.trim());
      }
    });
    return Array.from(namesSet);
  };

  const handleUseDefaultDirektorat = () => {
    const direktoratData = localStorage.getItem('direktorat');
    const direktoratList = direktoratData ? JSON.parse(direktoratData) : [];
    const uniqueNames = getAllUniqueDirektoratNames();
    if (uniqueNames.length === 0) {
      alert('Belum ada data nama direktorat yang pernah diinput. Silakan input manual terlebih dahulu.');
      return;
    }
    const newDirektorat = uniqueNames.map((nama) => ({
      id: Date.now() + Math.random(),
      nama,
      tahun: selectedYear,
      createdAt: new Date(),
      isActive: true
    }));
    const updatedDirektoratList = [...direktoratList, ...newDirektorat];
    localStorage.setItem('direktorat', JSON.stringify(updatedDirektoratList));
    setReloadFlag(f => f + 1);
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('direktorat');
  };

  // Handler untuk data default subdirektorat
  const handleUseDefaultSubdirektorat = () => {
    const subdirektoratData = localStorage.getItem('subdirektorat');
    const subdirektoratList = subdirektoratData ? JSON.parse(subdirektoratData) : [];
    
    const newSubdirektorat = seedSubdirektorat.map((item) => ({
      id: Date.now() + Math.random(),
      nama: item.nama,
      tahun: selectedYear,
      createdAt: new Date(),
      isActive: true
    }));
    const updatedSubdirektoratList = [...subdirektoratList, ...newSubdirektorat];
    localStorage.setItem('subdirektorat', JSON.stringify(updatedSubdirektoratList));
    setReloadFlag(f => f + 1);
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('subdirektorat');
  };

  // Handler untuk data default divisi
  const handleUseDefaultDivisi = () => {
    const divisiData = localStorage.getItem('divisi');
    const divisiList = divisiData ? JSON.parse(divisiData) : [];
    const newDivisi = DEFAULT_DIVISI.map((item) => ({
      id: Date.now() + Math.random(),
      nama: item.nama,
      tahun: selectedYear,
      kategori: item.kategori,
      createdAt: new Date(),
      isActive: true
    }));
    const updatedDivisiList = [...divisiList, ...newDivisi];
    localStorage.setItem('divisi', JSON.stringify(updatedDivisiList));
    setReloadFlag(f => f + 1);
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('divisi');
  };

  // Handler untuk data default anak perusahaan
  const handleUseDefaultAnakPerusahaan = () => {
    const anakPerusahaanData = localStorage.getItem('anakPerusahaan');
    const anakPerusahaanList = anakPerusahaanData ? JSON.parse(anakPerusahaanData) : [];
    
    const newAnakPerusahaan = seedAnakPerusahaan.map((item) => ({
      id: Date.now() + Math.random(),
      nama: item.nama,
      tahun: selectedYear,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      createdAt: new Date(),
      isActive: true
    }));
    const updatedAnakPerusahaanList = [...anakPerusahaanList, ...newAnakPerusahaan];
    localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaanList));
    setReloadFlag(f => f + 1);
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('anakPerusahaan');
  };

  // Anak Perusahaan handlers
  const handleAnakPerusahaanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anakPerusahaanForm.nama || !anakPerusahaanForm.kategori || !anakPerusahaanForm.deskripsi) {
      alert('Semua field wajib diisi!');
      return;
    }
    if (editingAnakPerusahaan) {
      const updatedAnakPerusahaan: AnakPerusahaan = {
        ...editingAnakPerusahaan,
        nama: anakPerusahaanForm.nama,
        kategori: anakPerusahaanForm.kategori,
        deskripsi: anakPerusahaanForm.deskripsi,
        tahun: selectedYear
      };
      const updatedAnakPerusahaanList = anakPerusahaan.map(d => d.id === editingAnakPerusahaan.id ? updatedAnakPerusahaan : d);
      setAnakPerusahaan(updatedAnakPerusahaanList);
      localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaanList));
      setEditingAnakPerusahaan(null);
      alert('Anak Perusahaan berhasil diupdate!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('anakPerusahaan');
    } else {
      const newAnakPerusahaan: AnakPerusahaan = {
        id: Date.now(),
        nama: anakPerusahaanForm.nama,
        kategori: anakPerusahaanForm.kategori,
        deskripsi: anakPerusahaanForm.deskripsi,
        tahun: selectedYear,
        createdAt: new Date(),
        isActive: true
      };
      const updatedAnakPerusahaanList = [...anakPerusahaan, newAnakPerusahaan];
      setAnakPerusahaan(updatedAnakPerusahaanList);
      localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaanList));
      alert('Anak Perusahaan berhasil ditambahkan!');
      triggerStrukturPerusahaanUpdate(); // Trigger update
      showUpdateToast('anakPerusahaan');
    }
    setAnakPerusahaanForm({ nama: '', kategori: '', deskripsi: '' });
    setIsAnakPerusahaanDialogOpen(false);
  };

  const handleDeleteAnakPerusahaan = () => {
    if (!anakPerusahaanToDelete) return;
    const updatedAnakPerusahaanList = anakPerusahaan.filter(d => d.id !== anakPerusahaanToDelete.id);
    setAnakPerusahaan(updatedAnakPerusahaanList);
    localStorage.setItem('anakPerusahaan', JSON.stringify(updatedAnakPerusahaanList));
    setAnakPerusahaanToDelete(null);
    alert('Anak Perusahaan berhasil dihapus!');
    triggerStrukturPerusahaanUpdate(); // Trigger update
    showUpdateToast('anakPerusahaan');
  };

  const openEditAnakPerusahaan = (anakPerusahaan: AnakPerusahaan) => {
    setEditingAnakPerusahaan(anakPerusahaan);
    setAnakPerusahaanForm({
      nama: anakPerusahaan.nama,
      kategori: anakPerusahaan.kategori,
      deskripsi: anakPerusahaan.deskripsi
    });
    setIsAnakPerusahaanDialogOpen(true);
  };

  const openAddAnakPerusahaan = () => {
    setEditingAnakPerusahaan(null);
    setAnakPerusahaanForm({ nama: '', kategori: '', deskripsi: '' });
    setIsAnakPerusahaanDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Sidebar />
      <Topbar />
      <div className={`transition-all duration-300 ease-in-out pt-16 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>  
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Struktur Organisasi"
            subtitle="Kelola struktur organisasi perusahaan berdasarkan tahun buku"
          />

          {/* Panel Tahun Buku */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            title="Tahun Buku"
            description="Pilih tahun buku untuk mengelola struktur perusahaan"
          />

          <Tabs defaultValue="direktorat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="direktorat" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Direktorat</span>
              </TabsTrigger>
              <TabsTrigger value="subdirektorat" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Subdirektorat</span>
              </TabsTrigger>
              <TabsTrigger value="anak-perusahaan" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Anak Perusahaan & Badan Afiliasi</span>
              </TabsTrigger>
              <TabsTrigger value="divisi" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Divisi</span>
              </TabsTrigger>
            </TabsList>

            {/* Direktorat Tab */}
            <TabsContent value="direktorat" id="direktorat-list">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span>Daftar Direktorat</span>
                      </CardTitle>
                      <CardDescription>
                        {filteredDirektorat.length} direktorat ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <Button onClick={openAddDirektorat} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Direktorat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredDirektorat.length === 0 && (
                    <div className="mb-4 flex justify-end">
                      <Button onClick={handleUseDefaultDirektorat} className="bg-amber-600 hover:bg-amber-700 mr-2">
                        Gunakan Data Default Direktorat
                      </Button>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDirektorat.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDirektorat(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setDirektoratToDelete(item)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subdirektorat Tab */}
            <TabsContent value="subdirektorat" id="subdirektorat-list">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        <span>Daftar Subdirektorat</span>
                      </CardTitle>
                      <CardDescription>
                        {filteredSubdirektorat.length} subdirektorat ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                                         <Button onClick={() => openAddSubdirektorat()} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Subdirektorat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSubdirektorat.length === 0 && (
                    <div className="mb-4 flex justify-end">
                      <Button onClick={() => handleUseDefaultSubdirektorat()} className="bg-amber-600 hover:bg-amber-700">
                        Gunakan Data Default Subdirektorat
                      </Button>
                    </div>
                  )}
                                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama Subdirektorat</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubdirektorat.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.nama}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditSubdirektorat(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSubdirektoratToDelete(item)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Anak Perusahaan & Badan Afiliasi Tab */}
            <TabsContent value="anak-perusahaan" id="anak-perusahaan-list">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                        <span>Daftar Anak Perusahaan & Badan Afiliasi</span>
                      </CardTitle>
                      <CardDescription>
                        {filteredAnakPerusahaan.length} anak perusahaan & badan afiliasi ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <Button onClick={openAddAnakPerusahaan} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Anak Perusahaan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAnakPerusahaan.length === 0 && (
                    <div className="mb-4 flex justify-end">
                      <Button onClick={handleUseDefaultAnakPerusahaan} className="bg-amber-600 hover:bg-amber-700">
                        Gunakan Data Default Anak Perusahaan
                      </Button>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnakPerusahaan.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.kategori}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{item.deskripsi}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditAnakPerusahaan(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setAnakPerusahaanToDelete(item)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Divisi Tab */}
            <TabsContent value="divisi" id="divisi-list">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        <span>Daftar Divisi</span>
                      </CardTitle>
                      <CardDescription>
                        {filteredDivisi.length} divisi ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <Button onClick={openAddDivisi} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Divisi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredDivisi.length === 0 && (
                    <div className="mb-4 flex justify-end">
                      <Button onClick={handleUseDefaultDivisi} className="bg-amber-600 hover:bg-amber-700">
                        Gunakan Data Default Divisi
                      </Button>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Divisi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDivisi.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDivisi(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setDivisiToDelete(item)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Direktorat Dialog */}
      <Dialog open={isDirektoratDialogOpen} onOpenChange={setIsDirektoratDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDirektorat ? 'Edit Direktorat' : 'Tambah Direktorat Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingDirektorat ? 'Edit data direktorat' : 'Tambahkan direktorat baru ke struktur perusahaan'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDirektoratSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama">Nama Direktorat *</Label>
              <Input
                id="nama"
                value={direktoratForm.nama}
                onChange={(e) => setDirektoratForm({ ...direktoratForm, nama: e.target.value })}
                placeholder="Masukkan nama direktorat"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDirektoratDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingDirektorat ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subdirektorat Dialog */}
      <Dialog open={isSubdirektoratDialogOpen} onOpenChange={setIsSubdirektoratDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubdirektorat ? 'Edit Subdirektorat' : 'Tambah Subdirektorat Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingSubdirektorat ? 'Edit data subdirektorat' : 'Tambahkan subdirektorat baru ke struktur perusahaan'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubdirektoratSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama">Nama Subdirektorat *</Label>
              <Input
                id="nama"
                value={subdirektoratForm.nama}
                onChange={(e) => setSubdirektoratForm({ ...subdirektoratForm, nama: e.target.value })}
                placeholder="Masukkan nama subdirektorat"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsSubdirektoratDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingSubdirektorat ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Direktorat Dialog */}
      <ConfirmDialog
        isOpen={!!direktoratToDelete}
        onClose={() => setDirektoratToDelete(null)}
        onConfirm={handleDeleteDirektorat}
        title="Hapus Direktorat"
        description={`Apakah Anda yakin ingin menghapus direktorat "${direktoratToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        variant="danger"
        confirmText="Hapus"
      />

             {/* Delete Subdirektorat Dialog */}
       <ConfirmDialog
         isOpen={!!subdirektoratToDelete}
         onClose={() => setSubdirektoratToDelete(null)}
         onConfirm={handleDeleteSubdirektorat}
         title="Hapus Subdirektorat"
         description={`Apakah Anda yakin ingin menghapus subdirektorat "${subdirektoratToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
         variant="danger"
         confirmText="Hapus"
       />

       {/* Divisi Dialog */}
       <Dialog open={isDivisiDialogOpen} onOpenChange={setIsDivisiDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>
               {editingDivisi ? 'Edit Divisi' : 'Tambah Divisi Baru'}
             </DialogTitle>
             <DialogDescription>
               {editingDivisi ? 'Edit data divisi' : 'Tambahkan divisi baru ke struktur perusahaan'}
             </DialogDescription>
           </DialogHeader>
           <form onSubmit={handleDivisiSubmit} className="space-y-4">
             <div>
               <Label htmlFor="nama">Nama Divisi *</Label>
               <Input
                 id="nama"
                 value={divisiForm.nama}
                 onChange={(e) => setDivisiForm({ ...divisiForm, nama: e.target.value })}
                 placeholder="Masukkan nama divisi"
                 required
               />
             </div>
             <div className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={() => setIsDivisiDialogOpen(false)}>
                 Batal
               </Button>
               <Button type="submit">
                 {editingDivisi ? 'Update' : 'Simpan'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

              {/* Delete Divisi Dialog */}
       <ConfirmDialog
         isOpen={!!divisiToDelete}
         onClose={() => setDivisiToDelete(null)}
         onConfirm={handleDeleteDivisi}
         title="Hapus Divisi"
         description={`Apakah Anda yakin ingin menghapus divisi "${divisiToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
         variant="danger"
         confirmText="Hapus"
       />

       {/* Anak Perusahaan Dialog */}
       <Dialog open={isAnakPerusahaanDialogOpen} onOpenChange={setIsAnakPerusahaanDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>
               {editingAnakPerusahaan ? 'Edit Anak Perusahaan' : 'Tambah Anak Perusahaan Baru'}
             </DialogTitle>
             <DialogDescription>
               {editingAnakPerusahaan ? 'Edit data anak perusahaan' : 'Tambahkan anak perusahaan baru ke struktur perusahaan'}
             </DialogDescription>
           </DialogHeader>
           <form onSubmit={handleAnakPerusahaanSubmit} className="space-y-4">
             <div>
               <Label htmlFor="nama">Nama Anak Perusahaan *</Label>
               <Input
                 id="nama"
                 value={anakPerusahaanForm.nama}
                 onChange={(e) => setAnakPerusahaanForm({ ...anakPerusahaanForm, nama: e.target.value })}
                 placeholder="Masukkan nama anak perusahaan"
                 required
               />
             </div>
             <div>
               <Label htmlFor="kategori">Kategori *</Label>
               <select
                 id="kategori"
                 value={anakPerusahaanForm.kategori}
                 onChange={(e) => setAnakPerusahaanForm({ ...anakPerusahaanForm, kategori: e.target.value })}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 required
               >
                 <option value="">Pilih Kategori</option>
                 <option value="Anak Perusahaan">Anak Perusahaan</option>
                 <option value="Badan Afiliasi">Badan Afiliasi</option>
                 <option value="Joint Venture">Joint Venture</option>
                 <option value="Unit Bisnis">Unit Bisnis</option>
               </select>
             </div>
             <div>
               <Label htmlFor="deskripsi">Deskripsi *</Label>
               <textarea
                 id="deskripsi"
                 value={anakPerusahaanForm.deskripsi}
                 onChange={(e) => setAnakPerusahaanForm({ ...anakPerusahaanForm, deskripsi: e.target.value })}
                 placeholder="Masukkan deskripsi anak perusahaan"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                 required
               />
             </div>
             <div className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={() => setIsAnakPerusahaanDialogOpen(false)}>
                 Batal
               </Button>
               <Button type="submit">
                 {editingAnakPerusahaan ? 'Update' : 'Simpan'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

       {/* Delete Anak Perusahaan Dialog */}
       <ConfirmDialog
         isOpen={!!anakPerusahaanToDelete}
         onClose={() => setAnakPerusahaanToDelete(null)}
         onConfirm={handleDeleteAnakPerusahaan}
         title="Hapus Anak Perusahaan"
         description={`Apakah Anda yakin ingin menghapus anak perusahaan "${anakPerusahaanToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
         variant="danger"
         confirmText="Hapus"
       />
      <Toaster />
    </div>
  );
};

export default StrukturPerusahaan; 