import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Shield,
  ListTodo,
  LogOut,
  BarChart3,
  PanelLeft,
  FileText,
  Settings,
  User,
  Building2,
  Layers,
  Briefcase
} from 'lucide-react';

interface MenuItem {
  name: string;
  icon: any;
  path: string;
  badge?: string | null;
  badgeIcon?: any;
}

// No longer need SubMenuItem interface since there are no submenus

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  // No longer need expandedMenus state since there are no submenus

  // No longer need auto-expand logic since there are no submenus

  const menuItems: MenuItem[] = [];

  // Tambahkan menu Super Admin dengan urutan yang diminta
  if (user?.role === 'superadmin') {
    menuItems.push(
      {
        name: 'Pengaturan Baru',
        icon: Settings,
        path: '/admin/pengaturan-baru'
      },
      { 
        name: 'Dashboard', 
        icon: LayoutDashboard, 
        path: '/dashboard'
      },
      {
        name: 'Monitoring & Upload GCG',
        icon: PanelLeft,
        path: '/list-gcg'
      },
      {
        name: 'Arsip Dokumen',
        icon: FileText,
        path: '/admin/arsip-dokumen'
      },
      { 
        name: 'Performa GCG', 
        icon: BarChart3, 
        path: '/performa-gcg'
      }
    );
  } else if (user?.role === 'admin') {
    // Untuk admin, hanya dashboard admin
    menuItems.push(
      { 
        name: 'Dashboard', 
        icon: LayoutDashboard, 
        path: '/admin/dashboard'
      }
    );
  } else {
    // Untuk user non-admin, hanya dashboard
    menuItems.push(
      { 
        name: 'Dashboard', 
        icon: LayoutDashboard, 
        path: '/dashboard'
      }
    );
  }

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleMainMenuClick = (item: MenuItem) => {
    // Navigate directly to the page
    navigate(item.path);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  // No longer need handleSubItemClick since there are no submenus

  // No longer need isMenuExpanded since there are no submenus

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-900 z-40 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 shadow-xl overflow-y-auto
      `}>
        {/* Profile Section for Admin */}
        {user?.role === 'admin' && (
          <div className="px-4 pb-6 mt-8">
            {/* Profile Header */}
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                Informasi Akun
              </h3>
            </div>
            
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
              {/* Profile Header with Avatar */}
              <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
                        Admin
                      </Badge>
                      <span className="text-xs text-gray-400">• Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Account Information */}
              <div className="p-4 space-y-3">
                {/* Direktorat */}
                <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Direktorat</p>
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {user.direktorat || 'Tidak ada'}
                    </p>
                  </div>
                </div>
                
                {/* Subdirektorat */}
                <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Layers className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Subdirektorat</p>
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {user.subdirektorat || 'Tidak ada'}
                    </p>
                  </div>
                </div>
                
                {/* Divisi */}
                <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Divisi</p>
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {user.divisi || 'Tidak ada'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="px-4 pb-4">
                <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Status Akun</span>
                    <span className="text-green-400 font-medium">• Aktif</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Terakhir login: {new Date().toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="pt-2 pb-20">
          <div className="px-4 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <div key={item.name}>
                  {/* Main Menu Item */}
                  <div className="relative">
                    <Link
                      to={item.path}
                      onClick={() => handleMainMenuClick(item)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                        active 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.badgeIcon && (
                          <item.badgeIcon className="w-4 h-4 text-blue-400" />
                        )}
                        {item.badge && (
                          <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                  
                  {/* Add separator after Pengaturan Baru */}
                  {item.name === 'Pengaturan Baru' && (
                    <div className="my-3 px-4">
                      <div className="h-px bg-gray-700"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 