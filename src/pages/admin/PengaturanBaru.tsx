import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useUser, UserRole } from '@/contexts/UserContext';
import { useChecklist, ChecklistGCG } from '@/contexts/ChecklistContext';
import { useToast } from '@/hooks/use-toast';
import { seedUser } from '@/lib/seed/seedUser';
import { seedChecklistGCG } from '@/lib/seed/seedChecklistGCG';

// Data subdirektorat untuk assignment
const SUBDIREKTORAT_OPTIONS = [
  { value: "Sub Direktorat Government and Corporate Business", label: "Government & Corporate Business" },
  { value: "Sub Direktorat Consumer Business", label: "Consumer Business" },
  { value: "Sub Direktorat Enterprise Business", label: "Enterprise Business" },
  { value: "Sub Direktorat Retail Business", label: "Retail Business" },
  { value: "Sub Direktorat Wholesale and International Business", label: "Wholesale & International Business" },
  { value: "Sub Direktorat Courier and Logistic Operation", label: "Courier & Logistic Operation" },
  { value: "Sub Direktorat International Post Services", label: "International Post Services" },
  { value: "Sub Direktorat Digital Services", label: "Digital Services" },
  { value: "Sub Direktorat Frontino Management and Financial Transaction Services", label: "Frontino Management & Financial Transaction" },
  { value: "Sub Direktorat Financial Operation and Business Partner", label: "Financial Operation & Business Partner" },
  { value: "Sub Direktorat Financial Policy and Asset Management", label: "Financial Policy & Asset Management" },
  { value: "Sub Direktorat Risk Management", label: "Risk Management" },
  { value: "Sub Direktorat Human Capital Policy and Strategy", label: "Human Capital Policy & Strategy" },
  { value: "Sub Direktorat Human Capital Service and Business Partner", label: "Human Capital Service & Business Partner" },
  { value: "Sub Direktorat Strategic Planning and Business Development", label: "Strategic Planning & Business Development" },
  { value: "Sub Direktorat Portfolio Management", label: "Portfolio Management" }
];
import { Toaster } from '@/components/ui/toaster';
import { Calendar, Building2, Users, FileText, Settings, Plus, CheckCircle, Trash2, Edit, Copy, Eye, X } from 'lucide-react';
import { PageHeaderPanel } from '@/components/panels';

// Komponen Assignment Dropdown
const AssignmentDropdown = ({ 
  item, 
  onAssign, 
  isSuperAdmin,
  currentAssignmentLabel
}: { 
  item: { id: number; aspek: string; deskripsi: string }; 
  onAssign: (checklistId: number, subdirektorat: string, aspek: string, deskripsi: string) => void;
  isSuperAdmin: boolean;
  currentAssignmentLabel?: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAssign = async (value: string) => {
    setIsLoading(true);
    try {
      // Simulate async operation untuk menghindari lag
      await new Promise(resolve => setTimeout(resolve, 10));
      onAssign(item.id, value, item.aspek, item.deskripsi);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isSuperAdmin) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-56 justify-between disabled:opacity-50 ${currentAssignmentLabel ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
      >
        <span className="truncate text-left">
          {isLoading 
            ? 'Assigning...'
            : currentAssignmentLabel 
              ? `Assigned: ${currentAssignmentLabel}`
              : 'Assign ke Subdirektorat'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {SUBDIREKTORAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAssign(option.value)}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface TahunBuku {
  id: number;
  tahun: number;
  nama: string;
  deskripsi: string;
  isActive: boolean;
  createdAt: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
  tahun: number;
}

interface ChecklistItem extends ChecklistGCG {
  status?: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  catatan?: string;
  tahun: number;
}

interface ChecklistAssignment {
  id: number;
  checklistId: number;
  subdirektorat: string;
  aspek: string;
  deskripsi: string;
  tahun: number;
  assignedBy: string;
  assignedAt: Date;
  status: 'assigned' | 'in_progress' | 'completed';
  notes?: string;
}

const PengaturanBaru = () => {
  const { isSidebarOpen } = useSidebar();
  const { availableYears, addYear, setSelectedYear, selectedYear } = useYear();
  const { 
    direktorat, 
    subdirektorat, 
    anakPerusahaan, 
    divisi,
    addDirektorat,
    addSubdirektorat,
    addAnakPerusahaan,
    addDivisi,
    deleteDirektorat,
    deleteSubdirektorat,
    deleteAnakPerusahaan,
    deleteDivisi,
    useDefaultData
  } = useStrukturPerusahaan();
  const { user: currentUser } = useUser();
  const { checklist, addChecklist, editChecklist, deleteChecklist, addAspek, editAspek, deleteAspek, initializeYearData } = useChecklist();
  const { toast } = useToast();

  // State untuk users
  const [users, setUsers] = useState<User[]>([]);
  
  // State untuk checklist management
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showAspekDialog, setShowAspekDialog] = useState(false);
  const [newAspek, setNewAspek] = useState('');
  
  // State untuk assignment management
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  
  // State untuk manajemen aspek
  const [showAspekManagementPanel, setShowAspekManagementPanel] = useState(false);
  const [editingAspek, setEditingAspek] = useState<string | null>(null);
  const [aspekForm, setAspekForm] = useState({ nama: '', deskripsi: '' });
  
  // State untuk mengontrol visibility button data default
  const [showDefaultDataButton, setShowDefaultDataButton] = useState(false);
  
  // State untuk tracking changes dan actions
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalChecklistItems, setOriginalChecklistItems] = useState<ChecklistItem[]>([]);
  
  // State untuk tracking individual item changes
  const [itemChanges, setItemChanges] = useState<Set<number>>(new Set());
  
  // Effect untuk mengupdate progress struktur organisasi
  useEffect(() => {
    if (selectedYear && 
        direktorat && direktorat.length > 0 && 
        subdirektorat && subdirektorat.length > 0 && 
        anakPerusahaan && anakPerusahaan.length > 0 && 
        divisi && divisi.length > 0) {
      setSetupProgress(prev => ({ ...prev, strukturOrganisasi: true }));
    }
  }, [selectedYear, direktorat, subdirektorat, anakPerusahaan, divisi]);

  // Effect untuk load users dari localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
      } catch (error) {
        console.error('Error parsing users:', error);
        setUsers([]);
      }
    }
  }, []);

  // Effect untuk mengupdate progress manajemen akun
  useEffect(() => {
    if (selectedYear && users && users.filter(u => u.tahun === selectedYear).length > 0) {
      setSetupProgress(prev => ({ ...prev, manajemenAkun: true }));
    }
  }, [selectedYear, users]);

  // Effect untuk load checklist dari context
  useEffect(() => {
    if (selectedYear && checklist) {
      const yearChecklist = checklist.filter(item => item.tahun === selectedYear);
      const extendedChecklist: ChecklistItem[] = yearChecklist.map(item => ({
        ...item,
        status: 'pending',
        catatan: ''
      }));
      setChecklistItems(extendedChecklist);
    }
  }, [selectedYear, checklist]);

  // Effect untuk load assignments dari localStorage
  useEffect(() => {
    const storedAssignments = localStorage.getItem('checklistAssignments');
    if (storedAssignments) {
      try {
        const parsedAssignments = JSON.parse(storedAssignments);
        setAssignments(parsedAssignments);
      } catch (error) {
        console.error('Error parsing assignments:', error);
        setAssignments([]);
      }
    }
  }, []);

  // Effect untuk mengupdate progress kelola dokumen
  useEffect(() => {
    if (selectedYear && checklistItems && checklistItems.length > 0) {
      setSetupProgress(prev => ({ ...prev, kelolaDokumen: true }));
    }
  }, [selectedYear, checklistItems]);

  // Effect untuk tracking changes pada checklist items
  useEffect(() => {
    if (checklistItems && originalChecklistItems.length > 0) {
      const hasChanges = JSON.stringify(checklistItems) !== JSON.stringify(originalChecklistItems);
      setHasUnsavedChanges(hasChanges);
    }
  }, [checklistItems, originalChecklistItems]);

  // Effect untuk set original data saat checklist items berubah
  useEffect(() => {
    if (checklistItems && checklistItems.length > 0 && originalChecklistItems.length === 0) {
      setOriginalChecklistItems([...checklistItems]);
    }
  }, [checklistItems, originalChecklistItems]);
  
  // State untuk form tahun buku
  const [tahunForm, setTahunForm] = useState({
    tahun: new Date().getFullYear() + 1,
    nama: '',
    deskripsi: ''
  });

  // State untuk form struktur organisasi
  const [strukturForm, setStrukturForm] = useState({
    direktorat: { nama: '', deskripsi: '' },
    subdirektorat: { nama: '', direktoratId: '', deskripsi: '' },
    anakPerusahaan: { nama: '', kategori: '', deskripsi: '' },
    divisi: { nama: '', subdirektoratId: '', deskripsi: '' }
  });

  // State untuk form user
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    direktorat: '',
    subdirektorat: '',
    divisi: ''
  });



  // State untuk dialog
  const [showDirektoratDialog, setShowDirektoratDialog] = useState(false);
  const [showSubdirektoratDialog, setShowSubdirektoratDialog] = useState(false);
  const [showAnakPerusahaanDialog, setShowAnakPerusahaanDialog] = useState(false);
  const [showDivisiDialog, setShowDivisiDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // State untuk tracking progress
  const [setupProgress, setSetupProgress] = useState({
    tahunBuku: false,
    strukturOrganisasi: false,
    manajemenAkun: false,
    kelolaDokumen: false
  });

  // Handler untuk submit tahun buku
  const handleTahunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tahunForm.tahun || !tahunForm.nama) {
      toast({
        title: "Error",
        description: "Tahun dan nama tahun buku wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    // Check if tahun already exists
    if (availableYears.includes(tahunForm.tahun)) {
      toast({
        title: "Error",
        description: `Tahun ${tahunForm.tahun} sudah ada!`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Add new year
      addYear(tahunForm.tahun);
      
      // Set as active year
      setSelectedYear(tahunForm.tahun);
      
      // Update progress
      setSetupProgress(prev => ({ ...prev, tahunBuku: true }));
      
      toast({
        title: "Berhasil!",
        description: `Tahun buku ${tahunForm.tahun} berhasil ditambahkan dan diaktifkan`,
      });

      // Reset form
      setTahunForm({
        tahun: tahunForm.tahun + 1,
        nama: '',
        deskripsi: ''
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan tahun buku",
        variant: "destructive"
      });
    }
  };

  // Handler untuk struktur organisasi
  const handleDirektoratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strukturForm.direktorat.nama) {
      toast({
        title: "Error",
        description: "Nama direktorat wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      addDirektorat({
        nama: strukturForm.direktorat.nama,
        deskripsi: strukturForm.direktorat.deskripsi,
        tahun: selectedYear || new Date().getFullYear()
      });
      
      setStrukturForm(prev => ({ ...prev, direktorat: { nama: '', deskripsi: '' } }));
      setShowDirektoratDialog(false);
      
      toast({
        title: "Berhasil!",
        description: "Direktorat berhasil ditambahkan",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan direktorat",
        variant: "destructive"
      });
    }
  };

  const handleSubdirektoratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strukturForm.subdirektorat.nama || !strukturForm.subdirektorat.direktoratId) {
      toast({
        title: "Error",
        description: "Nama dan direktorat wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      addSubdirektorat({
        nama: strukturForm.subdirektorat.nama,
        direktoratId: parseInt(strukturForm.subdirektorat.direktoratId),
        deskripsi: strukturForm.subdirektorat.deskripsi,
        tahun: selectedYear || new Date().getFullYear()
      });
      
      setStrukturForm(prev => ({ ...prev, subdirektorat: { nama: '', direktoratId: '', deskripsi: '' } }));
      setShowSubdirektoratDialog(false);
      
      toast({
        title: "Berhasil!",
        description: "Subdirektorat berhasil ditambahkan",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan subdirektorat",
        variant: "destructive"
      });
    }
  };

  const handleAnakPerusahaanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strukturForm.anakPerusahaan.nama || !strukturForm.anakPerusahaan.kategori) {
      toast({
        title: "Error",
        description: "Nama dan kategori wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      addAnakPerusahaan({
        nama: strukturForm.anakPerusahaan.nama,
        kategori: strukturForm.anakPerusahaan.kategori,
        deskripsi: strukturForm.anakPerusahaan.deskripsi,
        tahun: selectedYear || new Date().getFullYear()
      });
      
      setStrukturForm(prev => ({ ...prev, anakPerusahaan: { nama: '', kategori: '', deskripsi: '' } }));
      setShowAnakPerusahaanDialog(false);
      
      toast({
        title: "Berhasil!",
        description: "Anak Perusahaan berhasil ditambahkan",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan anak perusahaan",
        variant: "destructive"
      });
    }
  };

  const handleDivisiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strukturForm.divisi.nama || !strukturForm.divisi.subdirektoratId) {
      toast({
        title: "Error",
        description: "Nama dan subdirektorat wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      addDivisi({
        nama: strukturForm.divisi.nama,
        subdirektoratId: parseInt(strukturForm.divisi.subdirektoratId),
        deskripsi: strukturForm.divisi.deskripsi,
        tahun: selectedYear || new Date().getFullYear()
      });
      
      setStrukturForm(prev => ({ ...prev, divisi: { nama: '', subdirektoratId: '', deskripsi: '' } }));
      setShowDivisiDialog(false);
      
      toast({
        title: "Berhasil!",
        description: "Divisi berhasil ditambahkan",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan divisi",
        variant: "destructive"
      });
    }
  };

  const handleUseDefaultStruktur = () => {
    try {
      useDefaultData(selectedYear || new Date().getFullYear());
      setSetupProgress(prev => ({ ...prev, strukturOrganisasi: true }));
      
      toast({
        title: "Berhasil!",
        description: "Data default struktur organisasi berhasil digunakan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menggunakan data default",
        variant: "destructive"
      });
    }
  };

  // Handler untuk user management
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) {
      toast({
        title: "Error",
        description: "Nama, email, password, dan role wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      const newUser: User = {
        id: editingUser ? editingUser.id : Date.now(),
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        direktorat: userForm.direktorat || undefined,
        subdirektorat: userForm.subdirektorat || undefined,
        divisi: userForm.divisi || undefined,
        tahun: selectedYear || new Date().getFullYear()
      };

      if (editingUser) {
        // Update existing user
        setUsers(prev => prev.map(u => u.id === editingUser.id ? newUser : u));
        toast({
          title: "Berhasil!",
          description: "User berhasil diupdate",
        });
      } else {
        // Add new user
        setUsers(prev => [...prev, newUser]);
        toast({
          title: "Berhasil!",
          description: "User baru berhasil ditambahkan",
        });
      }

      // Update localStorage
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      
      // Reset form and close dialog
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
        direktorat: '',
        subdirektorat: '',
        divisi: ''
      });
      setEditingUser(null);
      setShowUserDialog(false);

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan/update user",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      direktorat: user.direktorat || '',
      subdirektorat: user.subdirektorat || '',
      divisi: user.divisi || ''
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = (userId: number) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      localStorage.setItem('users', JSON.stringify(users.filter(u => u.id !== userId)));
      
      toast({
        title: "Berhasil!",
        description: "User berhasil dihapus",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus user",
        variant: "destructive"
      });
    }
  };

  const handleUseDefaultUsers = () => {
    try {
      // Copy default users dari seedUser dengan tahun yang dipilih
      const defaultUsers = seedUser.map(user => ({
        ...user,
        id: Date.now() + Math.random(), // Generate unique ID
        tahun: selectedYear || new Date().getFullYear()
      }));

      setUsers(prev => [...prev, ...defaultUsers]);
      localStorage.setItem('users', JSON.stringify([...users, ...defaultUsers]));
      
      setSetupProgress(prev => ({ ...prev, manajemenAkun: true }));
      
      toast({
        title: "Berhasil!",
        description: "Data default user berhasil digunakan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menggunakan data default user",
        variant: "destructive"
      });
    }
  };

  // Handler untuk checklist management
  const handleUseDefaultChecklist = () => {
    try {
      if (selectedYear) {
        initializeYearData(selectedYear);
        toast({
          title: "Berhasil!",
          description: "Data default checklist GCG berhasil digunakan",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menggunakan data default checklist",
        variant: "destructive"
      });
    }
  };





  const handleDeleteChecklist = (id: number) => {
    try {
      setChecklistItems(prev => prev.filter(item => item.id !== id));
      deleteChecklist(id, selectedYear || new Date().getFullYear());
      
      toast({
        title: "Berhasil!",
        description: "Checklist item berhasil dihapus",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus checklist item",
        variant: "destructive"
      });
    }
  };



  // Handle assignment checklist ke subdirektorat
  const handleAssignment = (checklistId: number, subdirektorat: string, aspek: string, deskripsi: string) => {
    const newAssignment: ChecklistAssignment = {
      id: Date.now(),
      checklistId,
      subdirektorat,
      aspek,
      deskripsi,
      tahun: selectedYear || new Date().getFullYear(),
      assignedBy: currentUser?.name || 'Super Admin',
      assignedAt: new Date(),
      status: 'assigned'
    };

    // Update state dan persist ke localStorage
    setAssignments(prev => {
      // Replace existing assignment untuk checklistId & year ini jika ada
      const next = [...prev.filter(a => !(a.checklistId === checklistId && a.tahun === selectedYear)), newAssignment];
      try {
        localStorage.setItem('checklistAssignments', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist checklistAssignments', err);
      }
      return next;
    });

    toast({
      title: "Assignment Berhasil",
      description: `Dokumen GCG berhasil ditugaskan ke ${subdirektorat}`,
    });
  };

  // Handle manajemen aspek
  const handleAddAspek = () => {
    if (!aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama aspek tidak boleh kosong!",
        variant: "destructive"
      });
      return;
    }

    // Check if aspek already exists
    const existingAspek = checklistItems.some(item => item.aspek === aspekForm.nama.trim());
    if (existingAspek) {
      toast({
        title: "Error",
        description: "Aspek sudah ada!",
        variant: "destructive"
      });
      return;
    }

    // Add new aspek to checklist items
    const newAspekItem: ChecklistItem = {
      id: Date.now(),
      aspek: aspekForm.nama.trim(),
      deskripsi: aspekForm.deskripsi || '',
      tahun: selectedYear || new Date().getFullYear()
    };

    setChecklistItems(prev => [...prev, newAspekItem]);
    
    // Reset form
    setAspekForm({ nama: '', deskripsi: '' });
    
    toast({
      title: "Berhasil!",
      description: "Aspek baru berhasil ditambahkan",
    });
  };

  const handleEditAspek = () => {
    if (!editingAspek || !aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama aspek tidak boleh kosong!",
        variant: "destructive"
      });
      return;
    }

    // Update aspek in checklist items
    setChecklistItems(prev => prev.map(item => 
      item.aspek === editingAspek 
        ? { ...item, aspek: aspekForm.nama.trim() }
        : item
    ));

    // Reset form and close edit mode
    setAspekForm({ nama: '', deskripsi: '' });
    setEditingAspek(null);
    
    toast({
      title: "Berhasil!",
      description: "Aspek berhasil diperbarui",
    });
  };

  const handleDeleteAspek = (aspekName: string) => {
    // Remove aspek from checklist items
    setChecklistItems(prev => prev.filter(item => item.aspek !== aspekName));
    
    toast({
      title: "Berhasil!",
      description: "Aspek berhasil dihapus",
    });
  };

  const openEditAspek = (aspekName: string) => {
    setEditingAspek(aspekName);
    setAspekForm({ nama: aspekName, deskripsi: '' });
  };

  // Handle save changes
  const handleSaveChanges = () => {
    try {
      // Update original data
      setOriginalChecklistItems([...checklistItems]);
      setHasUnsavedChanges(false);
      
      // Persist to localStorage
      localStorage.setItem('checklistItems', JSON.stringify(checklistItems));
      
      toast({
        title: "Berhasil!",
        description: "Perubahan berhasil disimpan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan perubahan",
        variant: "destructive"
      });
    }
  };

  // Handle cancel changes
  const handleCancelChanges = () => {
    // Reset to original data
    setChecklistItems([...originalChecklistItems]);
    setHasUnsavedChanges(false);
    setItemChanges(new Set());
    
    toast({
      title: "Dibatalkan",
      description: "Perubahan telah dibatalkan",
    });
  };

  // Handle save individual item
  const handleSaveItem = (itemId: number) => {
    try {
      // Update original data for this specific item
      setOriginalChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? checklistItems.find(ci => ci.id === itemId) || item
            : item
        )
      );
      
      // Remove from item changes
      setItemChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Persist to localStorage
      localStorage.setItem('checklistItems', JSON.stringify(checklistItems));
      
      toast({
        title: "Berhasil!",
        description: "Item berhasil disimpan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan item",
        variant: "destructive"
      });
    }
  };

  // Handle cancel individual item changes
  const handleCancelItemChanges = (itemId: number) => {
    const originalItem = originalChecklistItems.find(item => item.id === itemId);
    if (originalItem) {
      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId ? originalItem : item
        )
      );
      
      // Remove from item changes
      setItemChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      toast({
        title: "Dibatalkan",
        description: "Perubahan item telah dibatalkan",
      });
    }
  };

  // Check if specific item has changes
  const hasItemChanges = (itemId: number) => {
    return itemChanges.has(itemId);
  };

  // Track item changes when editing
  const trackItemChange = (itemId: number) => {
    setItemChanges(prev => new Set(prev).add(itemId));
  };

  // Calculate overall progress
  const overallProgress = Object.values(setupProgress).filter(Boolean).length;
  const totalSteps = Object.keys(setupProgress).length;



  return (
    <div className="min-h-screen bg-blue-50">
      <Sidebar />
      <Topbar />
      <div className={`transition-all duration-300 ease-in-out pt-16 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>  
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="Pengaturan Baru"
            subtitle="Setup awal untuk tahun buku baru - Setup tahun, struktur organisasi, akun, dan dokumen GCG"
          />

          {/* Progress Overview */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Progress Setup</span>
              </CardTitle>
              <CardDescription>
                {overallProgress} dari {totalSteps} tahap telah selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border-2 text-center ${
                  setupProgress.tahunBuku 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                    setupProgress.tahunBuku ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Tahun Buku</div>
                  <div className="text-sm">
                    {setupProgress.tahunBuku ? 'Selesai' : 'Belum'}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 text-center ${
                  setupProgress.strukturOrganisasi 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                    setupProgress.strukturOrganisasi ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Struktur Organisasi</div>
                  <div className="text-sm">
                    {setupProgress.strukturOrganisasi ? 'Selesai' : 'Belum'}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 text-center ${
                  setupProgress.manajemenAkun 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <Users className={`w-8 h-8 mx-auto mb-2 ${
                    setupProgress.manajemenAkun ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Manajemen Akun</div>
                  <div className="text-sm">
                    {setupProgress.manajemenAkun ? 'Selesai' : 'Belum'}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 text-center ${
                  setupProgress.kelolaDokumen 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${
                    setupProgress.kelolaDokumen ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Kelola Dokumen</div>
                  <div className="text-sm">
                    {setupProgress.kelolaDokumen ? 'Selesai' : 'Belum'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Tabs */}
          <Tabs defaultValue="tahun-buku" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tahun-buku" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Tahun Buku</span>
                {setupProgress.tahunBuku && <CheckCircle className="w-4 h-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="struktur-organisasi" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Struktur Organisasi</span>
                {setupProgress.strukturOrganisasi && <CheckCircle className="w-4 h-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="manajemen-akun" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Manajemen Akun</span>
                {setupProgress.manajemenAkun && <CheckCircle className="w-4 h-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="kelola-dokumen" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Kelola Dokumen</span>
                {setupProgress.kelolaDokumen && <CheckCircle className="w-4 h-4 text-green-600" />}
              </TabsTrigger>
            </TabsList>

            {/* Tahun Buku Tab */}
            <TabsContent value="tahun-buku">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Setup Tahun Buku Baru</span>
                  </CardTitle>
                  <CardDescription>
                    Tambahkan tahun buku baru untuk memulai setup GCG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTahunSubmit} className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="tahun">Tahun Buku *</Label>
                      <Input
                        id="tahun"
                        type="number"
                        value={tahunForm.tahun}
                        onChange={(e) => setTahunForm({ ...tahunForm, tahun: parseInt(e.target.value) })}
                        placeholder="Contoh: 2025"
                        min={new Date().getFullYear()}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nama">Nama Tahun Buku *</Label>
                      <Input
                        id="nama"
                        value={tahunForm.nama}
                        onChange={(e) => setTahunForm({ ...tahunForm, nama: e.target.value })}
                        placeholder="Contoh: Tahun Buku 2025"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deskripsi">Deskripsi</Label>
                      <Input
                        id="deskripsi"
                        value={tahunForm.deskripsi}
                        onChange={(e) => setTahunForm({ ...tahunForm, deskripsi: e.target.value })}
                        placeholder="Deskripsi tahun buku (opsional)"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Tahun Buku
                    </Button>
                  </form>

                  {/* Info tahun yang sudah ada */}
                  {availableYears.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Tahun Buku yang Tersedia:</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableYears.map((tahun) => (
                          <span key={tahun} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {tahun}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

                         {/* Struktur Organisasi Tab */}
             <TabsContent value="struktur-organisasi">
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Building2 className="w-5 h-5 text-emerald-600" />
                     <span>Setup Struktur Organisasi</span>
                   </CardTitle>
                   <CardDescription>
                     Setup struktur organisasi untuk tahun buku baru
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   {/* Quick Actions */}
                   <div className="flex flex-wrap gap-3">
                     <Button 
                       onClick={() => setShowDirektoratDialog(true)}
                       className="bg-emerald-600 hover:bg-emerald-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Direktorat
                     </Button>
                     <Button 
                       onClick={() => setShowSubdirektoratDialog(true)}
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Subdirektorat
                     </Button>
                     <Button 
                       onClick={() => setShowAnakPerusahaanDialog(true)}
                       className="bg-purple-600 hover:bg-purple-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Anak Perusahaan
                     </Button>
                     <Button 
                       onClick={() => setShowDivisiDialog(true)}
                       className="bg-orange-600 hover:bg-orange-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Divisi
                     </Button>
                     <Button 
                       onClick={handleUseDefaultStruktur}
                       variant="outline"
                       className="border-green-600 text-green-600 hover:bg-green-50"
                     >
                       <Copy className="w-4 h-4 mr-2" />
                       Gunakan Data Default
                     </Button>
                   </div>

                                       {/* Data Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{direktorat && direktorat.length || 0}</div>
                        <div className="text-sm text-emerald-600">Direktorat</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{subdirektorat && subdirektorat.length || 0}</div>
                        <div className="text-sm text-blue-600">Subdirektorat</div>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{anakPerusahaan && anakPerusahaan.length || 0}</div>
                        <div className="text-sm text-purple-600">Anak Perusahaan</div>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{divisi && divisi.length || 0}</div>
                        <div className="text-sm text-orange-600">Divisi</div>
                      </div>
                    </div>

                   {/* Direktorat Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Direktorat</h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Nama</TableHead>
                           <TableHead>Deskripsi</TableHead>
                           <TableHead>Tahun</TableHead>
                           <TableHead>Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                                               <TableBody>
                          {direktorat && direktorat.length > 0 ? direktorat.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.nama}</TableCell>
                              <TableCell>{item.deskripsi}</TableCell>
                              <TableCell>{item.tahun}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteDirektorat(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                Belum ada data direktorat untuk tahun {selectedYear}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                     </Table>
                   </div>

                   {/* Subdirektorat Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Subdirektorat</h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Nama</TableHead>
                           <TableHead>Direktorat</TableHead>
                           <TableHead>Deskripsi</TableHead>
                           <TableHead>Tahun</TableHead>
                           <TableHead>Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                                               <TableBody>
                          {subdirektorat && subdirektorat.length > 0 ? subdirektorat.map((item) => {
                            const parentDirektorat = direktorat && direktorat.find(d => d.id === item.direktoratId);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nama}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{parentDirektorat ? parentDirektorat.nama : 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>{item.deskripsi}</TableCell>
                                <TableCell>{item.tahun}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteSubdirektorat(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          }) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                Belum ada data subdirektorat untuk tahun {selectedYear}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                     </Table>
                   </div>

                   {/* Anak Perusahaan Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Anak Perusahaan & Badan Afiliasi</h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Nama</TableHead>
                           <TableHead>Kategori</TableHead>
                           <TableHead>Deskripsi</TableHead>
                           <TableHead>Tahun</TableHead>
                           <TableHead>Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                                               <TableBody>
                          {anakPerusahaan && anakPerusahaan.length > 0 ? anakPerusahaan.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.nama}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.kategori}</Badge>
                              </TableCell>
                              <TableCell>{item.deskripsi}</TableCell>
                              <TableCell>{item.tahun}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAnakPerusahaan(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                Belum ada data anak perusahaan untuk tahun {selectedYear}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                     </Table>
                   </div>

                   {/* Divisi Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Divisi</h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Nama</TableHead>
                           <TableHead>Subdirektorat</TableHead>
                           <TableHead>Deskripsi</TableHead>
                           <TableCell>Tahun</TableCell>
                           <TableHead>Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                                               <TableBody>
                          {divisi && divisi.length > 0 ? divisi.map((item) => {
                            const parentSubdirektorat = subdirektorat && subdirektorat.find(s => s.id === item.subdirektoratId);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nama}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{parentSubdirektorat ? parentSubdirektorat.nama : 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>{item.deskripsi}</TableCell>
                                <TableCell>{item.tahun}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDivisi(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          }) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                Belum ada data divisi untuk tahun {selectedYear}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                     </Table>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

                         {/* Manajemen Akun Tab */}
             <TabsContent value="manajemen-akun">
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Users className="w-5 h-5 text-purple-600" />
                     <span>Setup Manajemen Akun</span>
                   </CardTitle>
                   <CardDescription>
                     Setup akun untuk tahun buku baru dengan role dan struktur organisasi
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   {/* Quick Actions */}
                   <div className="flex flex-wrap gap-3">
                     <Button 
                       onClick={() => setShowUserDialog(true)}
                       className="bg-purple-600 hover:bg-purple-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah User Baru
                     </Button>
                     <Button 
                       onClick={handleUseDefaultUsers}
                       variant="outline"
                       className="border-green-600 text-green-600 hover:bg-green-50"
                     >
                       <Copy className="w-4 h-4 mr-2" />
                       Gunakan Data Default
                     </Button>
                   </div>

                   {/* Data Overview */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                       <div className="text-2xl font-bold text-purple-600">{users && users.filter(u => u.tahun === selectedYear).length || 0}</div>
                       <div className="text-sm text-purple-600">Total Users</div>
                     </div>
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">{users && users.filter(u => u.tahun === selectedYear && u.role === 'admin').length || 0}</div>
                       <div className="text-sm text-blue-600">Admin</div>
                     </div>
                     <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                       <div className="text-2xl font-bold text-green-600">{users && users.filter(u => u.tahun === selectedYear && u.role === 'user').length || 0}</div>
                       <div className="text-sm text-green-600">User</div>
                     </div>
                     <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                       <div className="text-2xl font-bold text-orange-600">{users && users.filter(u => u.tahun === selectedYear && u.role === 'superadmin').length || 0}</div>
                       <div className="text-sm text-orange-600">Super Admin</div>
                     </div>
                   </div>

                   {/* Users Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Daftar User</h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Nama</TableHead>
                           <TableHead>Email</TableHead>
                           <TableHead>Role</TableHead>
                           <TableHead>Direktorat</TableHead>
                           <TableHead>Subdirektorat</TableHead>
                           <TableHead>Divisi</TableHead>
                           <TableHead>Tahun</TableHead>
                           <TableHead>Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {users && users.filter(u => u.tahun === selectedYear).length > 0 ? users.filter(u => u.tahun === selectedYear).map((item) => (
                           <TableRow key={item.id}>
                             <TableCell className="font-medium">{item.name}</TableCell>
                             <TableCell>{item.email}</TableCell>
                             <TableCell>
                               <Badge 
                                 variant={item.role === 'superadmin' ? 'default' : 
                                         item.role === 'admin' ? 'secondary' : 'outline'}
                                 className={item.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                                           item.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                           'bg-gray-100 text-gray-800'}
                               >
                                 {item.role === 'superadmin' ? 'Super Admin' :
                                  item.role === 'admin' ? 'Admin' : 'User'}
                               </Badge>
                             </TableCell>
                             <TableCell>{item.direktorat || 'N/A'}</TableCell>
                             <TableCell>{item.subdirektorat || 'N/A'}</TableCell>
                             <TableCell>{item.divisi || 'N/A'}</TableCell>
                             <TableCell>{item.tahun}</TableCell>
                             <TableCell>
                               <div className="flex gap-2">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleEditUser(item)}
                                   className="text-blue-600 hover:text-blue-700"
                                 >
                                   <Edit className="w-4 h-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleDeleteUser(item.id)}
                                   className="text-red-600 hover:text-red-700"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             </TableCell>
                           </TableRow>
                         )) : (
                           <TableRow>
                             <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                               Belum ada data user untuk tahun {selectedYear}
                             </TableCell>
                           </TableRow>
                         )}
                       </TableBody>
                     </Table>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

                         {/* Kelola Dokumen Tab */}
             <TabsContent value="kelola-dokumen">
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <FileText className="w-5 h-5 text-orange-600" />
                     <span>Setup Kelola Dokumen GCG</span>
                   </CardTitle>
                   <CardDescription>
                     Setup dokumen GCG dan aspek untuk tahun buku baru dengan tabel inline editing
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                                                           {/* Quick Actions */}
                     <div className="flex flex-wrap gap-3 items-center justify-between">
                       <div className="flex flex-wrap gap-3">
                       <Button 
                         onClick={() => {
                           const newItem: ChecklistItem = {
                             id: Date.now(),
                             aspek: '',
                             deskripsi: '',
                             status: 'pending',
                             catatan: '',
                             tahun: selectedYear || new Date().getFullYear()
                           };
                           setChecklistItems(prev => [...prev, newItem]);
                         }}
                         className="bg-indigo-600 hover:bg-indigo-700"
                       >
                         <Plus className="w-4 h-4 mr-2" />
                         Tambah Item Baru
                       </Button>
                                               <Button 
                          onClick={() => setShowAspekManagementPanel(true)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Kelola Aspek
                        </Button>
                       {!showDefaultDataButton ? (
                         <Button 
                           onClick={() => setShowDefaultDataButton(true)}
                           variant="outline"
                           className="border-green-600 text-green-600 hover:bg-green-50"
                         >
                           <Eye className="w-4 h-4 mr-2" />
                           Tampilkan Data Default
                         </Button>
                       ) : (
                         <Button 
                           onClick={handleUseDefaultChecklist}
                           variant="outline"
                           className="border-green-600 text-green-600 hover:bg-green-50"
                         >
                           <Copy className="w-4 h-4 mr-2" />
                           Gunakan Data Default
                         </Button>
                       )}


                       </div>
                     </div>

                   {/* Data Overview */}
                   <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                     <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                       <div className="text-2xl font-bold text-indigo-600">{checklistItems && checklistItems.length || 0}</div>
                       <div className="text-sm text-indigo-600">Total Item</div>
                     </div>
                   </div>



                                                           {/* Checklist Items Table with Enhanced Design */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Dokumen GCG Checklist</h3>
                      <div className="overflow-hidden rounded-lg border border-indigo-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                              <TableHead className="text-indigo-900 font-semibold w-16">No</TableHead>
                              <TableHead className="text-indigo-900 font-semibold w-48">Aspek (Opsional)</TableHead>
                              <TableHead className="text-indigo-900 font-semibold w-96">Deskripsi</TableHead>
                              <TableHead className="text-indigo-900 font-semibold w-32">Assign To</TableHead>
                              <TableHead className="text-indigo-900 font-semibold w-24">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {checklistItems && checklistItems.length > 0 ? checklistItems.map((item, index) => (
                              <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                                <TableCell className="font-medium text-gray-700">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.aspek || 'none'}
                                    onValueChange={(value) => {
                                      setChecklistItems(prev => prev.map(i => 
                                        i.id === item.id ? { ...i, aspek: value === 'none' ? '' : value } : i
                                      ));
                                      trackItemChange(item.id);
                                    }}
                                  >
                                    <SelectTrigger className="w-44">
                                      <SelectValue placeholder="Pilih Aspek (Opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Tidak Ada Aspek</SelectItem>
                                      {checklistItems && checklistItems.length > 0 ? 
                                        [...new Set(checklistItems.map(item => item.aspek).filter(Boolean))].map((aspek) => (
                                          <SelectItem key={aspek} value={aspek}>
                                            {aspek}
                                          </SelectItem>
                                        )) : []
                                      }
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Textarea
                                    value={item.deskripsi || ''}
                                    placeholder="Masukkan deskripsi dokumen GCG..."
                                    className="min-h-[80px] resize-none border-2 focus:border-blue-500"
                                    onChange={(e) => {
                                      setChecklistItems(prev => prev.map(i => 
                                        i.id === item.id ? { ...i, deskripsi: e.target.value } : i
                                      ));
                                      trackItemChange(item.id);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <AssignmentDropdown 
                                    item={item}
                                    onAssign={handleAssignment}
                                    isSuperAdmin={currentUser?.role === 'superadmin'}
                                    currentAssignmentLabel={(() => {
                                      const a = assignments.find(a => a.checklistId === item.id && a.tahun === selectedYear);
                                      if (!a) return null;
                                      const opt = SUBDIREKTORAT_OPTIONS.find(o => o.value === a.subdirektorat);
                                      return opt?.label || a.subdirektorat;
                                    })()}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {/* Save Button - Only show when item has changes */}
                                    {hasItemChanges(item.id) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSaveItem(item.id)}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="Simpan perubahan"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {/* Cancel Button - Only show when item has changes */}
                                    {hasItemChanges(item.id) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCancelItemChanges(item.id)}
                                        className="text-orange-600 hover:text-orange-700"
                                        title="Batal perubahan"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {/* Delete Button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteChecklist(item.id)}
                                      className="text-red-600 hover:text-red-700"
                                      title="Hapus item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                  Belum ada data checklist untuk tahun {selectedYear}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                 </CardContent>
               </Card>
             </TabsContent>
          </Tabs>

          {/* Dialog untuk Struktur Organisasi */}
          
          {/* Dialog Direktorat */}
          {showDirektoratDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Direktorat</h3>
                <form onSubmit={handleDirektoratSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="direktorat-nama">Nama Direktorat *</Label>
                    <Input
                      id="direktorat-nama"
                      value={strukturForm.direktorat.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        direktorat: { ...prev.direktorat, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: Direktorat Keuangan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="direktorat-deskripsi">Deskripsi</Label>
                    <Textarea
                      id="direktorat-deskripsi"
                      value={strukturForm.direktorat.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        direktorat: { ...prev.direktorat, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi direktorat (opsional)"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowDirektoratDialog(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dialog Subdirektorat */}
          {showSubdirektoratDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Subdirektorat</h3>
                <form onSubmit={handleSubdirektoratSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subdirektorat-nama">Nama Subdirektorat *</Label>
                    <Input
                      id="subdirektorat-nama"
                      value={strukturForm.subdirektorat.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: Subdirektorat Akuntansi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subdirektorat-direktorat">Direktorat *</Label>
                    <Select
                      value={strukturForm.subdirektorat.direktoratId}
                      onValueChange={(value) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, direktoratId: value } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Direktorat" />
                      </SelectTrigger>
                      <SelectContent>
                        {direktorat && direktorat.length > 0 ? direktorat.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.nama}
                          </SelectItem>
                        )) : []}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subdirektorat-deskripsi">Deskripsi</Label>
                    <Textarea
                      id="subdirektorat-deskripsi"
                      value={strukturForm.subdirektorat.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi subdirektorat (opsional)"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowSubdirektoratDialog(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dialog Anak Perusahaan */}
          {showAnakPerusahaanDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Anak Perusahaan</h3>
                <form onSubmit={handleAnakPerusahaanSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="anakperusahaan-nama">Nama *</Label>
                    <Input
                      id="anakperusahaan-nama"
                      value={strukturForm.anakPerusahaan.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        anakPerusahaan: { ...prev.anakPerusahaan, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: PT Pos Logistik Indonesia"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="anakperusahaan-kategori">Kategori *</Label>
                    <Select
                      value={strukturForm.anakPerusahaan.kategori}
                      onValueChange={(value) => setStrukturForm(prev => ({ 
                        ...prev, 
                        anakPerusahaan: { ...prev.anakPerusahaan, kategori: value } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Anak Perusahaan">Anak Perusahaan</SelectItem>
                        <SelectItem value="Badan Afiliasi">Badan Afiliasi</SelectItem>
                        <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                        <SelectItem value="Unit Bisnis">Unit Bisnis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="anakperusahaan-deskripsi">Deskripsi</Label>
                    <Textarea
                      id="anakperusahaan-deskripsi"
                      value={strukturForm.anakPerusahaan.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        anakPerusahaan: { ...prev.anakPerusahaan, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi (opsional)"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAnakPerusahaanDialog(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

                     {/* Dialog Divisi */}
           {showDivisiDialog && (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-lg p-6 w-full max-w-md">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Divisi</h3>
                 <form onSubmit={handleDivisiSubmit} className="space-y-4">
                   <div>
                     <Label htmlFor="divisi-nama">Nama Divisi *</Label>
                     <Input
                       id="divisi-nama"
                       value={strukturForm.divisi.nama}
                       onChange={(e) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, nama: e.target.value } 
                       }))}
                       placeholder="Contoh: Divisi Akuntansi"
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="divisi-subdirektorat">Subdirektorat *</Label>
                     <Select
                       value={strukturForm.divisi.subdirektoratId}
                       onValueChange={(value) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, subdirektoratId: value } 
                       }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Pilih Subdirektorat" />
                       </SelectTrigger>
                                             <SelectContent>
                        {subdirektorat && subdirektorat.length > 0 ? subdirektorat.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.nama}
                          </SelectItem>
                        )) : []}
                      </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label htmlFor="divisi-deskripsi">Deskripsi</Label>
                     <Textarea
                       id="divisi-deskripsi"
                       value={strukturForm.divisi.deskripsi}
                       onChange={(e) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, deskripsi: e.target.value } 
                       }))}
                       placeholder="Deskripsi divisi (opsional)"
                       rows={3}
                     />
                   </div>
                   <div className="flex gap-3">
                     <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah
                     </Button>
                     <Button 
                       type="button" 
                       variant="outline" 
                       onClick={() => setShowDivisiDialog(false)}
                       className="flex-1"
                     >
                       Batal
                     </Button>
                   </div>
                 </form>
               </div>
             </div>
           )}

                       {/* Dialog User Management */}
            {showUserDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingUser ? 'Edit User' : 'Tambah User Baru'}
                  </h3>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="user-name">Nama Lengkap *</Label>
                      <Input
                        id="user-name"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-email">Email *</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Contoh: john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-password">Password *</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimal 6 karakter"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-role">Role *</Label>
                      <Select
                        value={userForm.role}
                        onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user-direktorat">Direktorat</Label>
                      <Select
                        value={userForm.direktorat}
                        onValueChange={(value) => setUserForm(prev => ({ ...prev, direktorat: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Direktorat (Opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {direktorat && direktorat.length > 0 ? direktorat.map((item) => (
                            <SelectItem key={item.id} value={item.nama}>
                              {item.nama}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user-subdirektorat">Subdirektorat</Label>
                      <Select
                        value={userForm.subdirektorat}
                        onValueChange={(value) => setUserForm(prev => ({ ...prev, subdirektorat: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Subdirektorat (Opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {subdirektorat && subdirektorat.length > 0 ? subdirektorat.map((item) => (
                            <SelectItem key={item.id} value={item.nama}>
                              {item.nama}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user-divisi">Divisi</Label>
                      <Select
                        value={userForm.divisi}
                        onValueChange={(value) => setUserForm(prev => ({ ...prev, divisi: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Divisi (Opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisi && divisi.length > 0 ? divisi.map((item) => (
                            <SelectItem key={item.id} value={item.nama}>
                              {item.nama}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingUser ? 'Update' : 'Tambah'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowUserDialog(false);
                          setEditingUser(null);
                          setUserForm({
                            name: '',
                            email: '',
                            password: '',
                            role: 'user',
                            direktorat: '',
                            subdirektorat: '',
                            divisi: ''
                          });
                        }}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
                         )}

                           {/* Panel Manajemen Aspek */}
              {showAspekManagementPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Kelola Aspek GCG</h3>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAspekManagementPanel(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form Section */}
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">
                            {editingAspek ? 'Edit Aspek' : 'Tambah Aspek Baru'}
                          </h4>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="aspek-nama">Nama Aspek *</Label>
                              <Input
                                id="aspek-nama"
                                value={aspekForm.nama}
                                onChange={(e) => setAspekForm(prev => ({ ...prev, nama: e.target.value }))}
                                placeholder="Contoh: ASPEK I. Komitmen"
                                className="mt-1"
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="aspek-deskripsi">Deskripsi (Opsional)</Label>
                              <Textarea
                                id="aspek-deskripsi"
                                value={aspekForm.deskripsi}
                                onChange={(e) => setAspekForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                                placeholder="Deskripsi aspek..."
                                rows={3}
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2">
                              {editingAspek ? (
                                <>
                                  <Button 
                                    onClick={handleEditAspek}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Update Aspek
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      setEditingAspek(null);
                                      setAspekForm({ nama: '', deskripsi: '' });
                                    }}
                                    className="flex-1"
                                  >
                                    Batal Edit
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={handleAddAspek}
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Tambah Aspek
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* List Section */}
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Daftar Aspek Tersedia</h4>
                          
                          {(() => {
                            const uniqueAspek = [...new Set(checklistItems.map(item => item.aspek).filter(Boolean))];
                            return uniqueAspek.length > 0 ? (
                              <div className="space-y-2">
                                {uniqueAspek.map((aspekName) => (
                                  <div key={aspekName} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{aspekName}</div>
                                      <div className="text-sm text-gray-500">
                                        {checklistItems.filter(item => item.aspek === aspekName).length} item checklist
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditAspek(aspekName)}
                                        className="text-blue-600 hover:text-blue-700 border-blue-200"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteAspek(aspekName)}
                                        className="text-red-600 hover:text-red-700 border-red-200"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Belum ada aspek yang tersedia</p>
                                <p className="text-sm">Tambahkan aspek pertama untuk memulai</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


         </div>
       </div>
       <Toaster />
     </div>
   );
 };

export default PengaturanBaru;
