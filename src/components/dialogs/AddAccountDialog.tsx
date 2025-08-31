import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Users,
  User,
  Shield,
  UserCheck,
  Lock
} from 'lucide-react';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (accountData: AccountFormData) => void;
  isLoading?: boolean;
}

interface AccountFormData {
  email: string;
  password: string;
  name: string;
  role: 'admin';
  direktorat: string;
  subdirektorat: string;
  divisi: string;
}

const AddAccountDialog: React.FC<AddAccountDialogProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  isLoading = false
}) => {
  const { availableYears } = useYear();
  const { direktorat: direktoratOptions, subdirektorat: subDirektoratOptions } = useStrukturPerusahaan();
  
  const [formData, setFormData] = useState<AccountFormData>({
    email: '',
    password: '',
    name: '',
            role: 'admin',
    direktorat: '',
    subdirektorat: '',
    divisi: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'admin',
        direktorat: '',
        subdirektorat: '',
        divisi: ''
      });
      setShowPassword(false);
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [isOpen]);

  const generateStrongPassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
    checkPasswordStrength(password);
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let label = '';
    let color = '';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        label = 'Sangat Lemah';
        color = 'bg-red-500';
        break;
      case 2:
        label = 'Lemah';
        color = 'bg-orange-500';
        break;
      case 3:
        label = 'Sedang';
        color = 'bg-yellow-500';
        break;
      case 4:
        label = 'Kuat';
        color = 'bg-blue-500';
        break;
      case 5:
        label = 'Sangat Kuat';
        color = 'bg-green-500';
        break;
    }

    setPasswordStrength({ score, label, color });
  };

  const handleInputChange = (field: keyof AccountFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      alert('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password minimal 8 karakter.');
      return;
    }

    if (passwordStrength.score < 3) {
      alert('Password terlalu lemah. Gunakan password yang lebih kuat.');
      return;
    }

    onAddAccount(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Tambah PIC Baru</span>
          </DialogTitle>
          <DialogDescription>
                            Buat akun PIC baru untuk pengguna sistem Good Corporate Governance Documents Management System
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contoh@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Password
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateStrongPassword}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Generate
                </Button>
              </div>
              
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimal 8 karakter"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Kekuatan Password:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${passwordStrength.color} text-white`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-3 h-3 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Minimal 8 karakter</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Huruf kecil (a-z)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Huruf besar (A-Z)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Angka (0-9)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-3 h-3 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Karakter khusus (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Role & Organisasi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'admin') => handleInputChange('role', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Role Description */}
                <div className="mt-2">
                  <Badge variant="outline" className={getRoleColor(formData.role)}>
                    {getRoleIcon(formData.role)}
                    <span className="ml-1">
                      Akses admin terbatas
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direktorat">
                  Direktorat
                </Label>
                <Select 
                  value={formData.direktorat} 
                  onValueChange={(value) => handleInputChange('direktorat', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={direktoratOptions.length > 0 ? "Pilih direktorat" : "Belum ada data direktorat"} />
                  </SelectTrigger>
                  <SelectContent>
                    {direktoratOptions.map((direktorat) => (
                      <SelectItem key={direktorat} value={direktorat}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span>{direktorat}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdirektorat">
                  Sub Direktorat
                </Label>
                <Select 
                  value={formData.subdirektorat} 
                  onValueChange={(value) => handleInputChange('subdirektorat', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subDirektoratOptions.length > 0 ? "Pilih sub direktorat" : "Belum ada data sub direktorat"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subDirektoratOptions.map((subDirektorat) => (
                      <SelectItem key={subDirektorat} value={subDirektorat}>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{subDirektorat}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="divisi">
                  Divisi
                </Label>
                <Input
                  id="divisi"
                  value={formData.divisi}
                  onChange={(e) => handleInputChange('divisi', e.target.value)}
                  placeholder="Masukkan divisi"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password || !formData.name}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah PIC
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;
