
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { DirektoratProvider } from './contexts/DireksiContext';
import { ChecklistProvider } from './contexts/ChecklistContext';
import { FileUploadProvider } from './contexts/FileUploadContext';
import { DocumentMetadataProvider } from './contexts/DocumentMetadataContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { YearProvider } from './contexts/YearContext';

import { StrukturPerusahaanProvider } from './contexts/StrukturPerusahaanContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/Register';
import DashboardMain from './pages/dashboard/DashboardMain';
import MonitoringUploadGCG from './pages/MonitoringUploadGCG';

import ArsipDokumen from './pages/admin/ArsipDokumen';

import PengaturanBaru from './pages/admin/PengaturanBaru';
import NotFound from './pages/NotFound';
import { useUser } from './contexts/UserContext';

// Super Admin Route Component
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard - All users go to DashboardMain for now */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardMain />
            </ProtectedRoute>
          } 
        />

        {/* Admin Dashboard Route - Redirect to main dashboard */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <Navigate to="/dashboard" replace />
            </AdminRoute>
          } 
        />

      <Route 
        path="/list-gcg" 
        element={
          <SuperAdminRoute>
            <MonitoringUploadGCG />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/performa-gcg" 
        element={
          <SuperAdminRoute>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Performa GCG</h1>
                <p className="text-gray-600">Halaman performa GCG akan dikembangkan selanjutnya</p>
              </div>
            </div>
          </SuperAdminRoute>
        } 
      />
      
      {/* Super Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <SuperAdminRoute>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
                <p className="text-gray-600">Pilih menu di sidebar untuk mengakses fitur admin</p>
              </div>
            </div>
          </SuperAdminRoute>
        } 
      />

      <Route 
        path="/admin/arsip-dokumen" 
        element={
          <SuperAdminRoute>
            <ArsipDokumen />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/pengaturan-baru" 
        element={
          <SuperAdminRoute>
            <PengaturanBaru />
          </SuperAdminRoute>
        } 
      />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <UserProvider>
        <DirektoratProvider>
          <ChecklistProvider>
            <FileUploadProvider>
              <DocumentMetadataProvider>
                <YearProvider>
                    <StrukturPerusahaanProvider>
                      <SidebarProvider>
                        <AppRoutes />
                        <Toaster />
                      </SidebarProvider>
                    </StrukturPerusahaanProvider>
                </YearProvider>
              </DocumentMetadataProvider>
            </FileUploadProvider>
          </ChecklistProvider>
        </DirektoratProvider>
      </UserProvider>
    </Router>
  );
};

export default App;
