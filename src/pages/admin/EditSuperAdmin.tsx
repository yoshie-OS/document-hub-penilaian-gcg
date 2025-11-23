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
}

const EditSuperAdmin = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [superAdminList, setSuperAdminList] = useState<SuperAdminUser[]>([]);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<SuperAdminUser | null>(null);
  const [superAdminForm, setSuperAdminForm] = useState({
    email: '',
    password: ''
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
      const response = await fetch('http://localhost:5000/api/users');
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
      console.error('Error fetching superadmins from API, trying fallback:', error);

      // Fallback: Try localStorage first
      try {
        const localUsers = localStorage.getItem('users');
        if (localUsers) {
          const users = JSON.parse(localUsers);
          const superAdmins = users
            .filter((u: any) => u.role === 'superadmin')
            .slice(0, 2) as SuperAdminUser[];

          if (superAdmins.length > 0) {
            setSuperAdminList(superAdmins);
            return;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse localStorage users:', parseError);
      }

      // Fallback: Use default superadmins
      const defaultSuperAdmins: SuperAdminUser[] = [
        { id: 1, name: 'Super Admin 1', email: 'admin1', role: 'superadmin' },
        { id: 2, name: 'Super Admin 2', email: 'admin2', role: 'superadmin' }
      ];
      setSuperAdminList(defaultSuperAdmins);
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
        email: selected.email,
        password: ''
      });
    }
  };

  // Helper function to update localStorage (keeps it in sync with API)
  const updateLocalStorage = () => {
    if (!selectedSuperAdmin) return;

    try {
      const localUsers = localStorage.getItem('users');
      if (localUsers) {
        const users = JSON.parse(localUsers);
        const updatedUsers = users.map((u: any) => {
          if (String(u.id) === String(selectedSuperAdmin.id) || u.email === selectedSuperAdmin.email) {
            return { ...u, email: superAdminForm.email, password: superAdminForm.password };
          }
          return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } else {
        // Create new users in localStorage with updated superadmin
        const defaultUsers = [
          { id: 1, name: 'Super Admin 1', email: selectedSuperAdmin.id === 1 ? superAdminForm.email : 'admin1', password: selectedSuperAdmin.id === 1 ? superAdminForm.password : 'admin123', role: 'superadmin' },
          { id: 2, name: 'Super Admin 2', email: selectedSuperAdmin.id === 2 ? superAdminForm.email : 'admin2', password: selectedSuperAdmin.id === 2 ? superAdminForm.password : 'admin123', role: 'superadmin' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error('Failed to update localStorage:', error);
    }
  };

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

    if (!superAdminForm.email || !superAdminForm.password) {
      toast({
        title: "Error",
        description: "Email dan password wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Try update via database API
      const response = await fetch(`http://localhost:5000/api/users/${selectedSuperAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: superAdminForm.email,
          password: superAdminForm.password
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Also update localStorage to keep it in sync (for login fallback)
      updateLocalStorage();

      toast({
        title: "Berhasil!",
        description: `Kredensial ${selectedSuperAdmin.name || selectedSuperAdmin.email} berhasil diperbarui`,
      });

      // Reset form after success
      setSuperAdminForm({ email: '', password: '' });
      setSelectedSuperAdmin(null);

    } catch (error) {
      console.error('Error updating super admin via API, trying localStorage fallback:', error);

      // Fallback: Update localStorage only
      updateLocalStorage();

      toast({
        title: "Berhasil!",
        description: `Kredensial ${selectedSuperAdmin.name || selectedSuperAdmin.email} berhasil diperbarui (lokal)`,
      });

      // Reset form after success
      setSuperAdminForm({ email: '', password: '' });
      setSelectedSuperAdmin(null);
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
                      <Label htmlFor="superadmin-email" className="text-sm font-medium text-gray-700">
                        Email / Username
                      </Label>
                      <Input
                        id="superadmin-email"
                        type="text"
                        value={superAdminForm.email}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-2 border-gray-300 focus:border-orange-500"
                        placeholder="Masukkan email atau username baru"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="superadmin-password" className="text-sm font-medium text-gray-700">
                        Password Baru
                      </Label>
                      <Input
                        id="superadmin-password"
                        type="password"
                        value={superAdminForm.password}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="mt-2 border-gray-300 focus:border-orange-500"
                        placeholder="Masukkan password baru"
                        required
                      />
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
                          setSuperAdminForm({ email: '', password: '' });
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
