import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Direktorat {
  id: number;
  nama: string;
}

export interface Subdirektorat {
  id: number;
  nama: string;
}

interface DirektoratContextType {
  direktorat: Direktorat[];
  subdirektorat: Subdirektorat[];
  addDirektorat: (nama: string) => void;
  editDirektorat: (id: number, nama: string) => void;
  deleteDirektorat: (id: number) => void;
  addSubdirektorat: (nama: string) => void;
  editSubdirektorat: (id: number, nama: string) => void;
  deleteSubdirektorat: (id: number) => void;
  getAllSubdirektorat: () => Subdirektorat[];
}

const DirektoratContext = createContext<DirektoratContextType | undefined>(undefined);

export const DirektoratProvider = ({ children }: { children: ReactNode }) => {
  const [direktorat, setDirektorat] = useState<Direktorat[]>([]);
  const [subdirektorat, setSubdirektorat] = useState<Subdirektorat[]>([]);

  useEffect(() => {
    const direktoratData = JSON.parse(localStorage.getItem("direktorat") || "null");
    const subdirektoratData = JSON.parse(localStorage.getItem("subdirektorat") || "null");
    
    if (!direktoratData) {
      localStorage.setItem("direktorat", JSON.stringify([]));
      setDirektorat([]);
    } else {
      setDirektorat(direktoratData);
    }
    
    if (!subdirektoratData) {
      localStorage.setItem("subdirektorat", JSON.stringify([]));
      setSubdirektorat([]);
    } else {
      setSubdirektorat(subdirektoratData);
    }
  }, []);

  const addDirektorat = (nama: string) => {
    const newDirektorat = { id: Date.now(), nama };
    const updated = [...direktorat, newDirektorat];
    setDirektorat(updated);
    localStorage.setItem("direktorat", JSON.stringify(updated));
  };

  const editDirektorat = (id: number, nama: string) => {
    const updated = direktorat.map((d) => (d.id === id ? { ...d, nama } : d));
    setDirektorat(updated);
    localStorage.setItem("direktorat", JSON.stringify(updated));
  };

  const deleteDirektorat = (id: number) => {
    const updated = direktorat.filter((d) => d.id !== id);
    setDirektorat(updated);
    localStorage.setItem("direktorat", JSON.stringify(updated));
    

  };

  const addSubdirektorat = (nama: string) => {
    const newSubdirektorat = { id: Date.now(), nama };
    const updated = [...subdirektorat, newSubdirektorat];
    setSubdirektorat(updated);
    localStorage.setItem("subdirektorat", JSON.stringify(updated));
  };

  const editSubdirektorat = (id: number, nama: string) => {
    const updated = subdirektorat.map((s) => (s.id === id ? { ...s, nama } : s));
    setSubdirektorat(updated);
    localStorage.setItem("subdirektorat", JSON.stringify(updated));
  };

  const deleteSubdirektorat = (id: number) => {
    const updated = subdirektorat.filter((s) => s.id !== id);
    setSubdirektorat(updated);
    localStorage.setItem("subdirektorat", JSON.stringify(updated));
  };

  const getAllSubdirektorat = () => {
    return subdirektorat;
  };

  return (
    <DirektoratContext.Provider value={{ 
      direktorat, 
      subdirektorat,
      addDirektorat, 
      editDirektorat, 
      deleteDirektorat,
      addSubdirektorat,
      editSubdirektorat,
      deleteSubdirektorat,
      getAllSubdirektorat
    }}>
      {children}
    </DirektoratContext.Provider>
  );
};

export const useDirektorat = () => {
  const ctx = useContext(DirektoratContext);
  if (!ctx) throw new Error("useDirektorat must be used within DirektoratProvider");
  return ctx;
}; 