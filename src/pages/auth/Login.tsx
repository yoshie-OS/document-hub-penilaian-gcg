import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  FileText,
  BarChart3,
  Users,
  CheckCircle
} from 'lucide-react';

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

    setTimeout(async () => {
      try {
        const success = await login(email, password);

        if (success) {
          navigate('/dashboard');
        } else {
          setError('Email atau password salah');
        }
      } catch (err) {
        setError('Terjadi kesalahan saat login');
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const features = [
    {
      icon: FileText,
      title: "Manajemen Dokumen",
      description: "Kelola dokumen GCG dengan terstruktur"
    },
    {
      icon: BarChart3,
      title: "Monitoring Real-time",
      description: "Pantau progress upload dan compliance"
    },
    {
      icon: Users,
      title: "Multi-User Access",
      description: "Akses berbasis role dan divisi"
    },
    {
      icon: CheckCircle,
      title: "Compliance Tracking",
      description: "Lacak kepatuhan GCG secara otomatis"
    }
  ];

  return (
    <div className="min-h-screen bg-[#1e3a5f] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1a2f4a]"></div>

        {/* Animated Circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff6b35]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20">
          {/* Logo & Title */}
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-2xl">
                <img
                  src="/logo.png"
                  alt="POS Indonesia Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight">PT POS INDONESIA (PERSERO)</h1>
                <p className="text-[#ff6b35] font-medium">Logistik Indonesia</p>
              </div>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-6">
              Good Corporate Governance
              <span className="block text-[#ff6b35]">Documents Management System</span>
            </h2>

            <p className="text-lg text-white/70 max-w-lg leading-relaxed">
              Platform terintegrasi untuk mengelola, memantau, dan memastikan kepatuhan dokumen
              Good Corporate Governance secara efisien dan transparan.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-[#ff6b35]/30 transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ff6b35]/20 flex items-center justify-center mb-4 group-hover:bg-[#ff6b35]/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#ff6b35]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-2xl mx-auto mb-4">
                <img
                  src="/logo.png"
                  alt="POS Indonesia Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Good Corporate Governance
                <span className="block text-[#ff6b35]">Documents Management System</span>
              </h1>
              <p className="text-white/80 mt-2">PT POS INDONESIA (PERSERO)</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              {/* Card Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff6b35]/30">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang</h2>
                <p className="text-white/60">Masuk ke sistem manajemen GCG</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email/Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                    Email / Username
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-white/40 group-focus-within:text-[#ff6b35] transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Masukkan email atau username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-[#ff6b35] focus:ring-[#ff6b35]/20 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="w-5 h-5 text-white/40 group-focus-within:text-[#ff6b35] transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 h-14 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-4 text-white/40 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm animate-shake">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff5722] hover:to-[#ff7043] text-white font-semibold rounded-xl shadow-lg shadow-[#ff6b35]/30 hover:shadow-xl hover:shadow-[#ff6b35]/40 transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-white/40 bg-transparent">Sistem Aman & Terenkripsi</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center space-x-6 text-white/40 text-xs">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-white/40 text-sm">
                &copy; 2024 PT POS INDONESIA (PERSERO). All rights reserved.
              </p>
              <p className="text-white/30 text-xs mt-1">
                Good Corporate Governance Documents Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
        >
          <path
            d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
            className="fill-white/5"
          />
        </svg>
      </div>

      {/* CSS for shake animation and hide browser password reveal */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        /* Hide browser's built-in password reveal button */
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

export default Login;
