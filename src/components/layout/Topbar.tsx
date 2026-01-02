import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTour } from '@/contexts/TourContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  X,
  ChevronRight,
  Home,
  HelpCircle,
  ChevronDown,
  UserCog
} from 'lucide-react';
import ContactSuperAdminDialog from '@/components/ContactSuperAdminDialog';

const Topbar = () => {
  const { user } = useUser();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { startTour } = useTour();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to refresh page and scroll to top
  const handleLogoClick = () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Refresh page after a short delay to allow scroll animation
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Function to start user guide tour based on current page
  const handleStartUserGuide = () => {
    // Determine page name from current path
    const path = location.pathname;
    let pageName = 'dashboard';

    // Check most specific paths first
    if (path.includes('/list-gcg') || path.includes('/monitoring')) {
      pageName = 'monitoring';
    } else if (path.includes('/pengaturan')) {
      // Check for sub-routes first (more specific)
      if (path.includes('/pengaturan/tahun-buku')) {
        pageName = 'pengaturan-tahun-buku';
      } else if (path.includes('/pengaturan/struktur-organisasi')) {
        pageName = 'pengaturan-struktur';
      } else if (path.includes('/pengaturan/manajemen-akun')) {
        pageName = 'pengaturan-akun';
      } else if (path.includes('/pengaturan/kelola-dokumen')) {
        pageName = 'pengaturan-dokumen';
      } else if (path.includes('/pengaturan-baru')) {
        pageName = 'pengaturan-baru';
      } else {
        // Main pengaturan hub page
        pageName = 'pengaturan';
      }
    } else if (path.includes('/arsip-dokumen') || path.includes('/arsip')) {
      pageName = 'arsip';
    } else if (path.includes('/aoi')) {
      pageName = 'aoi';
    } else if (path.includes('/admin/settings')) {
      pageName = 'pengaturan';
    } else if (path === '/dashboard' || path === '/') {
      pageName = 'dashboard';
    }

    console.log('🔍 Tour Debug - Path:', path, '→ PageName:', pageName, '| User role:', user?.role);
    startTour(pageName);
  };

  // Navigate to Edit Super Admin page
  const handleEditSuperAdmin = () => {
    navigate('/admin/edit-superadmin');
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
      case '/admin/edit-superadmin':
        return { title: 'Edit Super Admin', breadcrumb: ['Dashboard', 'Admin', 'Edit Super Admin'] };
      case '/admin/dashboard':
        return { title: 'Dashboard Admin', breadcrumb: ['Dashboard Admin'] };
      default:
        return { title: 'Dashboard', breadcrumb: ['Dashboard'] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 fixed top-0 left-0 right-0 z-[100] shadow-sm">
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
          <div className="h-8 w-8 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="POS Indonesia Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900">
              Good Corporate Governance Documents Management System
            </h1>
            <p className="text-xs text-gray-500">
              PT POS INDONESIA (PERSERO)
            </p>
          </div>
        </div>
      </div>

      {/* Center - Breadcrumb Navigation - Absolutely Centered */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
      <div className="flex items-center space-x-3 ml-auto">
        {/* Contact Super Admin Button - Hidden for superadmin */}
        {user?.role !== 'superadmin' && <ContactSuperAdminDialog />}

        {/* User Guide Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartUserGuide}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:border-blue-300"
          title="Mulai tutorial panduan halaman ini"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">User Guide</span>
        </Button>

        {/* User Avatar with Dropdown - Hidden for Admin */}
        {user?.role !== 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-100 px-3 py-2 h-auto">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="" alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === 'superadmin' && (
                <DropdownMenuItem
                  onClick={handleEditSuperAdmin}
                  className="cursor-pointer"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Edit Akun Super Admin
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default Topbar;
