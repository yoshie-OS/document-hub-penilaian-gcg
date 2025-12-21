import React, { useState, useEffect, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  UserCheck,
  Calendar,
  Phone
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'user';
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
  whatsapp?: string;
}

// Helper function untuk generate password
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
};

// Format WhatsApp number to ensure +62 prefix
const formatWhatsAppNumber = (input: string): string => {
  // Remove all non-digits
  let digits = input.replace(/\D/g, '');

  // Remove leading 0 if present
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Remove 62 prefix if user typed it
  if (digits.startsWith('62')) {
    digits = digits.substring(2);
  }

  return digits;
};

// Get full WhatsApp URL
const getWhatsAppUrl = (number: string): string => {
  const formatted = formatWhatsAppNumber(number);
  return formatted ? `https://wa.me/62${formatted}` : '';
};

const ManajemenAkunPage = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, availableYears, setSelectedYear } = useYear();
  const { direktorat, subdirektorat, divisi } = useStrukturPerusahaan();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    direktorat: '',
    subdirektorat: '',
    divisi: '',
    whatsapp: ''
  });

  // Filtered subdirektorat based on selected direktorat
  const filteredSubdirektorat = useMemo(() => {
    if (!userForm.direktorat) return [];
    const selectedDirektorat = direktorat?.find(d => d.nama === userForm.direktorat);
    if (!selectedDirektorat) return [];
    return subdirektorat?.filter(s => s.direktoratId === selectedDirektorat.id) || [];
  }, [userForm.direktorat, direktorat, subdirektorat]);

  // Filtered divisi based on selected subdirektorat
  const filteredDivisi = useMemo(() => {
    if (!userForm.subdirektorat) return [];
    const selectedSubdirektorat = subdirektorat?.find(s => s.nama === userForm.subdirektorat);
    if (!selectedSubdirektorat) return [];
    return divisi?.filter(d => d.subdirektoratId === selectedSubdirektorat.id) || [];
  }, [userForm.subdirektorat, subdirektorat, divisi]);

  // Load users from API - reload when year changes
  useEffect(() => {
    if (selectedYear) {
      loadUsers();
    }
  }, [selectedYear]);

  const loadUsers = async () => {
    if (!selectedYear) return;

    setIsLoading(true);
    try {
      // Filter users by year
      const response = await fetch(`http://localhost:5001/api/users?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log(`ManajemenAkunPage: Loaded ${data.length} users for year ${selectedYear}`);
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error instanceof TypeError && error.message === 'Failed to fetch'
        ? "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan di port 5001."
        : "Gagal memuat data pengguna";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast({ title: "Error", description: "Nama, email, dan password wajib diisi!", variant: "destructive" });
      return;
    }

    if (!selectedYear) {
      toast({ title: "Error", description: "Pilih tahun terlebih dahulu!", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userForm,
          role: 'admin', // Always set role to admin (PIC)
          tahun: selectedYear // Include year!
        })
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        toast({ title: "Berhasil!", description: "Pengguna berhasil ditambahkan" });
        resetForm();
        setShowUserDialog(false);
        // Reload to ensure consistency
        loadUsers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage = error instanceof TypeError && error.message === 'Failed to fetch'
        ? "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan di port 5000."
        : error instanceof Error ? error.message : "Gagal menambahkan pengguna";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      const updateData: Record<string, string> = {
        name: userForm.name,
        email: userForm.email,
        direktorat: userForm.direktorat,
        subdirektorat: userForm.subdirektorat,
        divisi: userForm.divisi,
        whatsapp: userForm.whatsapp,
        role: 'admin' // Always keep as admin (PIC)
      };

      // Only include password if it's been changed
      if (userForm.password.trim()) {
        updateData.password = userForm.password;
      }

      const response = await fetch(`http://localhost:5001/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updateData } : u));
        toast({ title: "Berhasil!", description: "Pengguna berhasil diperbarui" });
        resetForm();
        setEditingUser(null);
        setShowUserDialog(false);
        // Reload to ensure consistency
        loadUsers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Gagal memperbarui pengguna", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (deletingUsers.has(userId)) return;

    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    setDeletingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast({ title: "Berhasil!", description: "Pengguna berhasil dihapus" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Gagal menghapus pengguna", variant: "destructive" });
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      direktorat: '',
      subdirektorat: '',
      divisi: '',
      whatsapp: ''
    });
    setShowPassword(false);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      direktorat: user.direktorat || '',
      subdirektorat: user.subdirektorat || '',
      divisi: user.divisi || '',
      whatsapp: user.whatsapp || ''
    });
    setShowUserDialog(true);
  };

  // Handle direktorat change - reset subdirektorat and divisi
  const handleDirektoratChange = (value: string) => {
    setUserForm({
      ...userForm,
      direktorat: value,
      subdirektorat: '',
      divisi: ''
    });
  };

  // Handle subdirektorat change - reset divisi
  const handleSubdirektoratChange = (value: string) => {
    setUserForm({
      ...userForm,
      subdirektorat: value,
      divisi: ''
    });
  };

  const passwordStrength = getPasswordStrength(userForm.password);

  // Filter users - only show admin and user roles, hide superadmin
  const displayUsers = users.filter(u => u.role !== 'superadmin');
  const adminUsers = users.filter(u => u.role === 'admin');

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
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Manajemen Akun PIC</h1>
                  <p className="text-gray-500">Kelola akun PIC (Person In Charge) untuk setiap struktur organisasi</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Year Selector */}
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

              <Dialog open={showUserDialog} onOpenChange={(open) => {
                setShowUserDialog(open);
                if (!open) {
                  setEditingUser(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Pengguna
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Perbarui informasi pengguna' : 'Isi data pengguna baru'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
                    <div>
                      <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                      <Input
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        placeholder="Masukkan nama lengkap"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Email / Username <span className="text-red-500">*</span></Label>
                      <Input
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        placeholder="Masukkan email atau username"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Password {editingUser ? '(kosongkan jika tidak diubah)' : <span className="text-red-500">*</span>}</Label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          placeholder="Masukkan password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-20"
                          style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as React.CSSProperties}
                          autoComplete="new-password"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                          <button
                            type="button"
                            className="h-7 w-7 p-0 flex items-center justify-center hover:bg-gray-100 rounded"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 p-0 flex items-center justify-center hover:bg-gray-100 rounded"
                            onClick={() => setUserForm({...userForm, password: generatePassword()})}
                            title="Generate password"
                          >
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      {userForm.password && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                                  passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                                  'w-full bg-green-500'
                                }`}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              passwordStrength === 'weak' ? 'text-red-500' :
                              passwordStrength === 'medium' ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>
                              {passwordStrength === 'weak' ? 'Lemah' :
                               passwordStrength === 'medium' ? 'Sedang' : 'Kuat'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Penugasan Organisasi</p>

                      {/* Direktorat Selection */}
                      <div className="mb-3">
                        <Label>Direktorat</Label>
                        <Select
                          value={userForm.direktorat}
                          onValueChange={handleDirektoratChange}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Pilih Direktorat" />
                          </SelectTrigger>
                          <SelectContent>
                            {direktorat?.map((d) => (
                              <SelectItem key={d.id} value={d.nama}>{d.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subdirektorat Selection */}
                      <div className="mb-3">
                        <Label>Subdirektorat</Label>
                        <Select
                          value={userForm.subdirektorat}
                          onValueChange={handleSubdirektoratChange}
                          disabled={!userForm.direktorat}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={userForm.direktorat ? "Pilih Subdirektorat" : "Pilih Direktorat terlebih dahulu"} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSubdirektorat?.map((s) => (
                              <SelectItem key={s.id} value={s.nama}>{s.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Divisi Selection */}
                      <div>
                        <Label>Divisi</Label>
                        <Select
                          value={userForm.divisi}
                          onValueChange={(value) => setUserForm({...userForm, divisi: value})}
                          disabled={!userForm.subdirektorat}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={userForm.subdirektorat ? "Pilih Divisi" : "Pilih Subdirektorat terlebih dahulu"} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDivisi?.map((d) => (
                              <SelectItem key={d.id} value={d.nama}>{d.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>WhatsApp (Opsional)</Label>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 text-sm font-medium">
                          <Phone className="w-4 h-4 mr-1" />
                          +62
                        </div>
                        <input
                          type="text"
                          value={formatWhatsAppNumber(userForm.whatsapp)}
                          onChange={(e) => setUserForm({...userForm, whatsapp: e.target.value})}
                          placeholder="812xxxxx (tanpa 0 di depan)"
                          className="flex h-10 w-full rounded-md border border-input bg-background pl-16 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Contoh: 812345678 (tanpa awalan 0 atau 62). URL: {userForm.whatsapp && getWhatsAppUrl(userForm.whatsapp) ? (
                          <a href={getWhatsAppUrl(userForm.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {getWhatsAppUrl(userForm.whatsapp)}
                          </a>
                        ) : 'wa.me/62...'}
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setShowUserDialog(false);
                        setEditingUser(null);
                        resetForm();
                      }}>
                        Batal
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingUser ? 'Simpan Perubahan' : 'Tambah'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Admin (PIC)</p>
                    <p className="text-2xl font-bold text-gray-900">{adminUsers.length}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pengguna</p>
                    <p className="text-2xl font-bold text-gray-900">{displayUsers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar PIC (Person In Charge)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Memuat data...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Direktorat</TableHead>
                        <TableHead>Subdirektorat</TableHead>
                        <TableHead>Divisi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayUsers.map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.whatsapp ? (
                              <a
                                href={getWhatsAppUrl(user.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 hover:underline flex items-center"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                +62{formatWhatsAppNumber(user.whatsapp)}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.direktorat ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {user.direktorat}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.subdirektorat ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {user.subdirektorat}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.divisi ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {user.divisi}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                title="Edit pengguna"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deletingUsers.has(user.id)}
                                title="Hapus pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {displayUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            Belum ada data pengguna (PIC)
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* CSS to hide browser's built-in password reveal button */}
      <style>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
        input::-webkit-credentials-auto-fill-button,
        input::-webkit-password-toggle-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default ManajemenAkunPage;
