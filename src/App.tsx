
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { DirektoratProvider } from './contexts/DireksiContext';
import { ChecklistProvider } from './contexts/ChecklistContext';
import { FileUploadProvider } from './contexts/FileUploadContext';
import { DocumentMetadataProvider } from './contexts/DocumentMetadataContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { YearProvider } from './contexts/YearContext';
import { KlasifikasiProvider } from './contexts/KlasifikasiContext';
import { StrukturPerusahaanProvider } from './contexts/StrukturPerusahaanContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ListGCG from './pages/ListGCG';
import DocumentManagement from './pages/DocumentManagement';
import PenilaianGCG from './pages/PenilaianGCG';
import GraphView from './pages/GraphView';
import GraphViewTest from './pages/GraphViewTest';
import AdminDocumentManagement from './pages/admin/DocumentManagement';
import StrukturPerusahaan from './pages/admin/StrukturPerusahaan';
import AdminDashboard from './pages/admin/AdminDashboard';
import KelolaAkun from './pages/admin/KelolaAkun';
import MetaData from './pages/admin/MetaData';
import ChecklistGCG from './pages/admin/ChecklistGCG';
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
        
        {/* Dashboard - Different for Super Admin and Admin */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {user.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
            </ProtectedRoute>
          } 
        />

        {/* Admin Dashboard Route */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

      <Route 
        path="/list-gcg" 
        element={
          <SuperAdminRoute>
            <ListGCG />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/penilaian-gcg" 
        element={
          <ProtectedRoute>
            <PenilaianGCG />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/graph-view" 
        element={
          <ProtectedRoute>
            <GraphView />
          </ProtectedRoute>
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
        path="/admin/kelola-akun" 
        element={
          <SuperAdminRoute>
            <KelolaAkun />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/document-management" 
        element={
          <SuperAdminRoute>
            <AdminDocumentManagement />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/struktur-perusahaan" 
        element={
          <SuperAdminRoute>
            <StrukturPerusahaan />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/meta-data" 
        element={
          <SuperAdminRoute>
            <MetaData />
          </SuperAdminRoute>
        } 
      />
      <Route 
        path="/admin/checklist-gcg" 
        element={
          <SuperAdminRoute>
            <ChecklistGCG />
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
                  <KlasifikasiProvider>
                    <StrukturPerusahaanProvider>
                      <SidebarProvider>
                        <AppRoutes />
                        <Toaster />
                      </SidebarProvider>
                    </StrukturPerusahaanProvider>
                  </KlasifikasiProvider>
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
