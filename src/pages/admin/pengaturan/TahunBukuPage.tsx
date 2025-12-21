import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Calendar,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';

const TahunBukuPage = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { availableYears, addYear, removeYear, selectedYear, setSelectedYear } = useYear();
  const { toast } = useToast();

  const [showTahunDialog, setShowTahunDialog] = useState(false);
  const [tahunForm, setTahunForm] = useState({
    tahun: new Date().getFullYear()
  });
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceYear, setCopySourceYear] = useState<number | null>(null);
  const [copyOptions, setCopyOptions] = useState({
    strukturOrganisasi: false,
    manajemenAkun: false,
    kelolaDokumen: false
  });

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tahunForm.tahun) {
      toast({
        title: "Error",
        description: "Tahun buku wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    if (availableYears.includes(tahunForm.tahun)) {
      toast({
        title: "Error",
        description: `Tahun ${tahunForm.tahun} sudah ada!`,
        variant: "destructive"
      });
      return;
    }

    try {
      await addYear(tahunForm.tahun);
      setSelectedYear(tahunForm.tahun);

      // Check if there's a previous year for copy options
      const previousYear = availableYears
        .filter(year => year < tahunForm.tahun)
        .sort((a, b) => b - a)[0];

      if (previousYear) {
        setCopySourceYear(previousYear);
        setShowCopyDialog(true);
      } else {
        toast({
          title: "Berhasil!",
          description: `Tahun buku ${tahunForm.tahun} berhasil ditambahkan`,
        });
      }

      setTahunForm({ tahun: new Date().getFullYear() });
      setShowTahunDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan tahun buku";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteYear = async (year: number) => {
    setIsDeleting(year);
    try {
      await removeYear(year);
      toast({
        title: "Berhasil!",
        description: `Tahun buku ${year} berhasil dihapus`,
      });

      // If deleted year was selected, select another year
      if (selectedYear === year) {
        const remainingYears = availableYears.filter(y => y !== year);
        if (remainingYears.length > 0) {
          setSelectedYear(remainingYears[0]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus tahun buku",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleCopyData = async () => {
    // Implementation for copying data from previous year
    toast({
      title: "Info",
      description: "Fitur copy data akan segera tersedia",
    });
    setShowCopyDialog(false);
    setCopySourceYear(null);
    setCopyOptions({
      strukturOrganisasi: false,
      manajemenAkun: false,
      kelolaDokumen: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <Sidebar />

      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-5xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/pengaturan')}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pengaturan
            </Button>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Tahun Buku</h1>
                  <p className="text-gray-500">Kelola periode tahun buku untuk penilaian GCG</p>
                </div>
              </div>

              <Dialog open={showTahunDialog} onOpenChange={setShowTahunDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Tahun
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Tahun Buku Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan tahun buku yang akan ditambahkan ke sistem
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddYear} className="space-y-4">
                    <div>
                      <Label htmlFor="tahun">Tahun</Label>
                      <Input
                        id="tahun"
                        type="number"
                        min="2000"
                        max="2100"
                        value={tahunForm.tahun}
                        onChange={(e) => setTahunForm({ tahun: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowTahunDialog(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                        Tambah
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Years Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableYears
              .sort((a, b) => b - a)
              .map((year) => (
                <Card
                  key={year}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedYear === year
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedYear(year)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedYear === year ? 'bg-orange-200' : 'bg-gray-100'
                        }`}>
                          <Calendar className={`w-5 h-5 ${
                            selectedYear === year ? 'text-orange-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{year}</h3>
                          <p className="text-sm text-gray-500">Tahun Buku</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedYear === year && (
                          <Badge className="bg-orange-500">Aktif</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(year);
                          }}
                          disabled={isDeleting === year}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {availableYears.length === 0 && (
              <Card className="col-span-full border-dashed border-2 border-gray-300">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Tahun Buku</h3>
                  <p className="text-gray-500 mb-4">Tambahkan tahun buku pertama untuk memulai</p>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowTahunDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Tahun Buku
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Konfirmasi Hapus</span>
                </DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus tahun buku {showDeleteConfirm}?
                  Semua data terkait tahun ini akan ikut terhapus.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => showDeleteConfirm && handleDeleteYear(showDeleteConfirm)}
                  disabled={isDeleting !== null}
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Copy Data Dialog */}
          <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Copy className="w-5 h-5 text-orange-600" />
                  <span>Copy Data dari Tahun Sebelumnya</span>
                </DialogTitle>
                <DialogDescription>
                  Pilih data yang ingin di-copy dari tahun {copySourceYear}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyOptions.strukturOrganisasi}
                    onChange={(e) => setCopyOptions({...copyOptions, strukturOrganisasi: e.target.checked})}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span>Struktur Organisasi</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyOptions.manajemenAkun}
                    onChange={(e) => setCopyOptions({...copyOptions, manajemenAkun: e.target.checked})}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span>Manajemen Akun</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyOptions.kelolaDokumen}
                    onChange={(e) => setCopyOptions({...copyOptions, kelolaDokumen: e.target.checked})}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span>Kelola Dokumen (Checklist)</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                  Lewati
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleCopyData}
                >
                  Copy Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Info Section */}
          <Card className="mt-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Tips</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Tahun buku yang aktif akan digunakan sebagai default saat mengakses menu lainnya.
                    Klik pada kartu tahun untuk mengaktifkannya.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TahunBukuPage;
