import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default terbuka

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <SidebarContext.Provider value={{
      isSidebarOpen,
      toggleSidebar,
      openSidebar,
      closeSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

