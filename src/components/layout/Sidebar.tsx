import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  LayoutDashboard, 
  Shield,
  LogOut,
  BarChart3,
  PanelLeft,
  FileText,
  Settings,
  Building2,
  Folder,
  Download,
  RotateCcw,
  Plus,
  Lock,
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
      },
    );
  } else {
    // Untuk user non-superadmin, hanya dashboard
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
        {/* Menu Items */}
        <nav className="pt-6 pb-20">
          <div className="px-4 space-y-1">
            {menuItems
              .filter(item => {
                // Hide Performa GCG menu if user is not superadmin
                if (item.name === 'Performa GCG' && user?.role !== 'superadmin') {
                  return false;
                }
                return true;
              })
              .map((item, index) => {
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