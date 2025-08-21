import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BackendProvider } from './contexts/BackendContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardMain from './pages/dashboard/DashboardMain';
import MonitoringUploadGCG from './pages/MonitoringUploadGCG';
import ArsipDokumen from './pages/admin/ArsipDokumen';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import PengaturanBaru from './pages/admin/PengaturanBaru';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardMain />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <DashboardAdmin />
          </ProtectedRoute>
        } />
        
        <Route path="/list-gcg" element={
          <ProtectedRoute>
            <MonitoringUploadGCG />
          </ProtectedRoute>
        } />
        
        <Route path="/performa-gcg" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Performa GCG</h1>
                <p className="text-gray-600">Halaman performa GCG akan dikembangkan selanjutnya</p>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
                <p className="text-gray-600">Pilih menu di sidebar untuk mengakses fitur admin</p>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/arsip-dokumen" element={
          <ProtectedRoute requiredRole="ADMIN">
            <ArsipDokumen />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/pengaturan-baru" element={
          <ProtectedRoute requiredRole="ADMIN">
            <PengaturanBaru />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <BackendProvider>
          <SidebarProvider>
            <AppRoutes />
            <Toaster />
          </SidebarProvider>
        </BackendProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

