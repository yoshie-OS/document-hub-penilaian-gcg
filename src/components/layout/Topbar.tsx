import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Mail, 
  HelpCircle,
  User,
  Menu,
  X,
  ChevronRight,
  Home
} from 'lucide-react';

const Topbar = () => {
  const { user } = useUser();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Function to refresh page and scroll to top
  const handleLogoClick = () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Refresh page after a short delay to allow scroll animation
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Get current page title and breadcrumb
  const getPageInfo = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard', breadcrumb: ['Dashboard'] };
      case '/documents':
        return { title: 'Manajemen Dokumen', breadcrumb: ['Dashboard', 'Manajemen Dokumen'] };
      case '/list-gcg':
        return { title: 'Monitoring & Upload GCG', breadcrumb: ['Dashboard', 'Super Admin', 'Monitoring & Upload GCG'] };
      case '/performa-gcg':
        return { title: 'Performa GCG', breadcrumb: ['Dashboard', 'Performa GCG'] };
      case '/admin/kelola-akun':
        return { title: 'Manajemen User', breadcrumb: ['Dashboard', 'Admin', 'Manajemen User'] };
              case '/admin/checklist-gcg':
          return { title: 'Dokumen GCG', breadcrumb: ['Dashboard', 'Admin', 'Dokumen GCG'] };
      case '/admin/meta-data':
        return { title: 'Pengaturan Metadata', breadcrumb: ['Dashboard', 'Admin', 'Pengaturan Metadata'] };
      case '/admin/struktur-perusahaan':
        return { title: 'Struktur Organisasi', breadcrumb: ['Dashboard', 'Admin', 'Struktur Organisasi'] };
      case '/admin/pengaturan-baru':
        return { title: 'Pengaturan Baru', breadcrumb: ['Dashboard', 'Admin', 'Pengaturan Baru'] };
                      case '/admin/arsip-dokumen':
          return { title: 'Arsip Dokumen', breadcrumb: ['Dashboard', 'Admin', 'Arsip Dokumen'] };
      case '/admin/dashboard':
        return { title: 'Dashboard Admin', breadcrumb: ['Dashboard Admin'] };
      default:
        return { title: 'Dashboard', breadcrumb: ['Dashboard'] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-[60] shadow-sm">
      {/* Left side - Logo, Title, and Hamburger */}
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </Button>

        {/* Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
          onClick={handleLogoClick}
        >
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GCG</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900">
              GCG Document Hub
            </h1>
            <p className="text-xs text-gray-500">
              Good Corporate Governance Management System
            </p>
          </div>
        </div>
      </div>

      {/* Center - Breadcrumb Navigation */}
      <div className="flex-1 flex justify-center">
        <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
          <Home className="w-4 h-4" />
          {pageInfo.breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-400">{item}</span>
              {index < pageInfo.breadcrumb.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="lg:hidden text-sm font-medium text-gray-900">
          {pageInfo.title}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </Button>

        {/* Messages */}
        <Button variant="ghost" size="sm">
          <Mail className="w-5 h-5 text-gray-600" />
        </Button>

        {/* Help */}
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </Button>

        {/* User Avatar - Hidden for Admin */}
        {user?.role !== 'admin' && (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={user?.name || 'User'} />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar; 