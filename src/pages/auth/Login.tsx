import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUser } from '@/contexts/UserContext';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, Building2, Users, FileText, CheckCircle, Globe, Award, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Email atau password salah');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-emerald-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="POS Indonesia Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-blue-900">Good Corporate Governance Documents Management System</h1>
                <p className="text-sm text-blue-600">PT POS INDONESIA (PERSERO)</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Daftar
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Landing Content */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-5xl font-bold mb-6 leading-tight">
                  Sistem Manajemen Dokumen
                  <span className="block text-blue-200">Good Corporate Governance</span>
                </h2>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Platform terintegrasi untuk mengelola dokumen GCG dengan efisien, terstruktur, dan aman. 
                  Dukung implementasi Good Corporate Governance yang transparan dan akuntabel.
                </p>
              </div>
              
              {/* Key Features */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Manajemen Dokumen</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Upload, organize, dan kelola dokumen GCG dengan struktur folder yang terorganisir.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Struktur Organisasi</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Kelola struktur Direktorat, Subdirektorat, dan Divisi sesuai organisasi.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Compliance GCG</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Dukung implementasi Good Corporate Governance yang sesuai standar.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Keamanan Data</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        Dokumen tersimpan dengan aman dan hanya dapat diakses oleh pihak berwenang.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/logo.png" 
                  alt="POS Indonesia Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Good Corporate Governance Documents Management System</h2>
              <p className="text-blue-600">PT POS INDONESIA (PERSERO)</p>
            </div>

            {/* Login Form */}
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">Masuk ke Sistem</h2>
                  <p className="text-blue-600">Akses sistem manajemen dokumen Good Corporate Governance</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-blue-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Masukkan email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-blue-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-12 h-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-blue-400 hover:text-blue-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memproses...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Demo Account Info */}
                                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Super Admin Account</span>
                    </h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><span className="font-medium">Email:</span> arsippostgcg@gmail.com</p>
                      <p><span className="font-medium">Password:</span> postarsipGCG.</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                        Reset Data (jika login bermasalah)
                      </button>
                    </div>
                  </div>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-blue-600">
                    Belum punya akun?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                      Daftar sebagai User
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-blue-500">
              <p>© 2024 POS Indonesia. All rights reserved.</p>
                              <p className="mt-1">Sistem Manajemen Dokumen Good Corporate Governance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 