import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserCog, 
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

interface EditAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditAccount: (accountData: AccountFormData) => void;
  account: AccountData | null;
  isLoading?: boolean;
}

interface AccountData {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  direktorat: string;
  subdirektorat: string;
  divisi: string;
}

interface AccountFormData {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin';
  direktorat: string;
  subdirektorat: string;
  divisi: string;
}

const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
  isOpen,
  onClose,
  onEditAccount,
  account,
  isLoading = false
}) => {
  const { availableYears } = useYear();
  const { direktorat: direktoratOptions, subdirektorat: subDirektoratOptions } = useStrukturPerusahaan();
  
  const [formData, setFormData] = useState<AccountFormData>({
    id: 0,
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

  // Reset form when dialog opens/closes or account changes
  useEffect(() => {
    if (isOpen && account) {
      setFormData({
        id: account.id,
        email: account.email,
        password: '', // Password kosong untuk edit
        name: account.name,
        role: account.role === 'superadmin' ? 'admin' : account.role, // Convert superadmin to admin for editing
        direktorat: account.direktorat || '',
        subdirektorat: account.subdirektorat || '',
        divisi: account.divisi || ''
      });
      setShowPassword(false);
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [isOpen, account]);

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
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

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
    if (!formData.email || !formData.name) {
      alert('Mohon lengkapi email dan nama.');
      return;
    }

    // Password validation only if password is provided
    if (formData.password && formData.password.length < 8) {
      alert('Password minimal 8 karakter.');
      return;
    }

    if (formData.password && passwordStrength.score < 3) {
      alert('Password terlalu lemah. Gunakan password yang lebih kuat atau kosongkan untuk tidak mengubah password.');
      return;
    }

    onEditAccount(formData);
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

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>Edit Akun</span>
          </DialogTitle>
          <DialogDescription>
            Edit informasi akun {account.name}
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
              Password (Opsional)
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Password Baru
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
                  placeholder="Kosongkan jika tidak ingin mengubah password"
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

          {/* Super Admin Password Section - Only show if editing super admin account */}
          {account && account.role === 'superadmin' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Super Admin Password Change
                  </h3>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Anda sedang mengedit akun Super Admin. Password yang diisi akan langsung mengganti password Super Admin.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="superadmin-password">
                      Password Baru untuk Super Admin
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateStrongPassword}
                      disabled={isLoading}
                      className="text-xs bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Input
                      id="superadmin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Masukkan password baru untuk Super Admin"
                      disabled={isLoading}
                      className="pr-10 border-yellow-300 focus:border-yellow-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 text-yellow-600 hover:text-yellow-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Password Strength Indicator for Super Admin */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-700 font-medium">Kekuatan Password:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${passwordStrength.color} text-white`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                      <div className="text-xs text-yellow-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className={`w-3 h-3 ${formData.password.length >= 8 ? 'text-green-500' : 'text-yellow-400'}`} />
                          <span>Minimal 8 karakter</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-yellow-400'}`} />
                          <span>Huruf kecil (a-z)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-yellow-400'}`} />
                          <span>Huruf besar (A-Z)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-yellow-400'}`} />
                          <span>Angka (0-9)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className={`w-3 h-3 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-yellow-400'}`} />
                          <span>Karakter khusus (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>User</span>
                      </div>
                    </SelectItem>
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
              disabled={isLoading || !formData.email || !formData.name}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
                             ) : (
                 <>
                   <UserCog className="w-4 h-4 mr-2" />
                   Update Akun
                 </>
               )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountDialog;
