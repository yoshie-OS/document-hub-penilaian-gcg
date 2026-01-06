import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog, ArrowLeft, Save, Shield } from 'lucide-react';

// Interface untuk SuperAdmin
interface SuperAdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  whatsapp?: string;
  telegram?: string;
}

const EditSuperAdmin = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [superAdminList, setSuperAdminList] = useState<SuperAdminUser[]>([]);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<SuperAdminUser | null>(null);
  const [superAdminForm, setSuperAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    telegram: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      navigate('/dashboard');
      toast({
        title: "Akses Ditolak",
        description: "Halaman ini hanya untuk Super Admin",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  // Fetch superadmin list on mount
  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  // Fetch all superadmin users
  const fetchSuperAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/users');
      if (!response.ok) {
        throw new Error('Gagal mengambil data users');
      }
      const users = await response.json();

      // Filter only superadmin users (max 2)
      const superAdmins = users
        .filter((u: any) => u.role === 'superadmin')
        .slice(0, 2) as SuperAdminUser[];

      setSuperAdminList(superAdmins);
    } catch (error) {
      console.error('Error fetching superadmins from API:', error);

      // FIXED: Removed localStorage fallback - API is source of truth
      // If API fails, show empty list or error state
      setSuperAdminList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is SuperAdmin 1 (first superadmin by ID)
  const isSuperAdmin1 = (): boolean => {
    if (superAdminList.length === 0) return false;
    const sortedSuperAdmins = [...superAdminList].sort((a, b) => a.id - b.id);
    return String(user?.id) === String(sortedSuperAdmins[0]?.id) || user?.email === sortedSuperAdmins[0]?.email;
  };

  // Get list of superadmins that current user can edit
  const getEditableSuperAdmins = (): SuperAdminUser[] => {
    if (superAdminList.length === 0) return [];

    const sortedSuperAdmins = [...superAdminList].sort((a, b) => a.id - b.id);

    // SuperAdmin 1 can edit both SA1 and SA2
    if (isSuperAdmin1()) {
      return sortedSuperAdmins;
    }

    // SuperAdmin 2 can only edit themselves
    const currentUserSA = sortedSuperAdmins.find(
      sa => String(sa.id) === String(user?.id) || sa.email === user?.email
    );
    return currentUserSA ? [currentUserSA] : [];
  };

  // Handle selecting a superadmin to edit
  const handleSelectSuperAdmin = (superAdminId: string) => {
    const selected = superAdminList.find(sa => sa.id.toString() === superAdminId);
    if (selected) {
      setSelectedSuperAdmin(selected);
      setSuperAdminForm({
        name: selected.name || '',
        email: selected.email,
        password: '',
        whatsapp: selected.whatsapp || '',
        telegram: selected.telegram || ''
      });
    }
  };

  // REMOVED: updateLocalStorage function - data managed by backend API only
  // localStorage sync removed to prevent stale cache issues

  // Handler untuk update super admin credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSuperAdmin) {
      toast({
        title: "Error",
        description: "Pilih akun Super Admin yang akan diedit!",
        variant: "destructive"
      });
      return;
    }

    if (!superAdminForm.email) {
      toast({
        title: "Error",
        description: "Email wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Try update via database API
      // Build update payload - only include fields that are filled
      const updatePayload: any = {
        name: superAdminForm.name,
        email: superAdminForm.email,
        whatsapp: superAdminForm.whatsapp,
        telegram: superAdminForm.telegram
      };

      // Only include password if it's filled (optional)
      if (superAdminForm.password) {
        updatePayload.password = superAdminForm.password;
      }

      const response = await fetch(`http://localhost:5001/api/users/${selectedSuperAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // REMOVED: updateLocalStorage() - data managed by backend API only

      toast({
        title: "Berhasil!",
        description: `Kredensial ${selectedSuperAdmin.name || selectedSuperAdmin.email} berhasil diperbarui`,
      });

      // Refresh superadmin list to show updated data
      fetchSuperAdmins();

      // Reset form after success
      setSuperAdminForm({ name: '', email: '', password: '', whatsapp: '', telegram: '' });
      setSelectedSuperAdmin(null);

    } catch (error) {
      console.error('Error updating super admin via API:', error);

      // REMOVED: localStorage fallback - show error instead
      toast({
        title: "Error!",
        description: `Gagal memperbarui kredensial: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <UserCog className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Kredensial Super Admin</h1>
              <p className="text-gray-500">Kelola akun Super Admin sistem</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informasi Akses:</p>
                {isSuperAdmin1() ? (
                  <p>Sebagai Super Admin 1, Anda dapat mengedit kredensial semua akun Super Admin.</p>
                ) : (
                  <p>Sebagai Super Admin 2, Anda hanya dapat mengedit kredensial akun Anda sendiri.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Card */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
            <CardTitle className="text-orange-900 flex items-center">
              <UserCog className="w-5 h-5 mr-2" />
              Form Edit Kredensial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">Memuat data...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pilih Akun Super Admin */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Pilih Akun Super Admin
                  </Label>
                  <Select
                    value={selectedSuperAdmin?.id.toString() || ''}
                    onValueChange={handleSelectSuperAdmin}
                  >
                    <SelectTrigger className="mt-2 border-gray-300 focus:border-orange-500">
                      <SelectValue placeholder="Pilih akun untuk diedit" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEditableSuperAdmins().map((sa) => {
                        const sortedList = [...superAdminList].sort((a, b) => a.id - b.id);
                        const saIndex = sortedList.findIndex(s => s.id === sa.id);
                        const label = `Super Admin ${saIndex + 1}`;
                        return (
                          <SelectItem key={sa.id} value={sa.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{label}</span>
                              <span className="text-xs text-gray-500">{sa.email}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSuperAdmin && (
                  <>
                    <div>
                      <Label htmlFor="superadmin-name" className="text-sm font-medium text-gray-700">
                        Nama Lengkap
                      </Label>
                      <Input
                        id="superadmin-name"
                        type="text"
                        value={superAdminForm.name}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-2 border-gray-300 focus:border-orange-500"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div>
                      <Label htmlFor="superadmin-email" className="text-sm font-medium text-gray-700">
                        Email / Username <span className="text-xs text-gray-500">(Untuk Login)</span>
                      </Label>
                      <Input
                        id="superadmin-email"
                        type="text"
                        value={superAdminForm.email}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-2 border-gray-300 focus:border-orange-500"
                        placeholder="Masukkan email atau username"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="superadmin-password" className="text-sm font-medium text-gray-700">
                        Password Baru <span className="text-xs text-gray-500">(Opsional - kosongkan jika tidak ingin mengubah)</span>
                      </Label>
                      <Input
                        id="superadmin-password"
                        type="password"
                        value={superAdminForm.password}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="mt-2 border-gray-300 focus:border-orange-500"
                        placeholder="Masukkan password baru (opsional)"
                      />
                    </div>

                    {/* Contact Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Kontak (Opsional)</h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Kontak yang diisi akan ditampilkan kepada user untuk memudahkan komunikasi
                      </p>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="superadmin-contact-email" className="text-sm font-medium text-gray-700">
                            Email Kontak
                          </Label>
                          <Input
                            id="superadmin-contact-email"
                            type="email"
                            value={superAdminForm.email}
                            onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-2 border-gray-300 focus:border-orange-500"
                            placeholder="Contoh: admin@posindonesia.co.id"
                            disabled
                          />
                          <p className="text-xs text-gray-400 mt-1">Email login akan digunakan sebagai kontak email</p>
                        </div>
                        <div>
                          <Label htmlFor="superadmin-whatsapp" className="text-sm font-medium text-gray-700">
                            WhatsApp
                          </Label>
                          <Input
                            id="superadmin-whatsapp"
                            type="text"
                            value={superAdminForm.whatsapp}
                            onChange={(e) => setSuperAdminForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                            className="mt-2 border-gray-300 focus:border-orange-500"
                            placeholder="Contoh: 628123456789"
                          />
                          <p className="text-xs text-gray-400 mt-1">Format: 628xxxxxxxxxx (tanpa tanda +)</p>
                        </div>
                        <div>
                          <Label htmlFor="superadmin-telegram" className="text-sm font-medium text-gray-700">
                            Telegram
                          </Label>
                          <Input
                            id="superadmin-telegram"
                            type="text"
                            value={superAdminForm.telegram}
                            onChange={(e) => setSuperAdminForm(prev => ({ ...prev, telegram: e.target.value }))}
                            className="mt-2 border-gray-300 focus:border-orange-500"
                            placeholder="Contoh: @username atau link t.me/username"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Perubahan
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedSuperAdmin(null);
                          setSuperAdminForm({ name: '', email: '', password: '', whatsapp: '', telegram: '' });
                        }}
                        className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                        disabled={isSubmitting}
                      >
                        Reset
                      </Button>
                    </div>
                  </>
                )}

                {!selectedSuperAdmin && (
                  <div className="text-center py-8 text-gray-500">
                    <UserCog className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Pilih akun Super Admin dari dropdown di atas untuk mulai mengedit</p>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditSuperAdmin;
