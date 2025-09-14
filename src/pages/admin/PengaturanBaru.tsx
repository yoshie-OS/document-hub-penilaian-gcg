import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useUser } from '@/contexts/UserContext';
import { useChecklist, ChecklistGCG } from '@/contexts/ChecklistContext';
import { useToast } from '@/hooks/use-toast';
import { ActionButton } from '@/components/panels';

// Pilihan subdirektorat sekarang diambil dari StrukturPerusahaanContext (berdasarkan tahun aktif)
import { Toaster } from '@/components/ui/toaster';
import { Calendar, Building2, Users, FileText, Settings, Plus, CheckCircle, Trash2, Edit, Copy, Eye, EyeOff, X, Briefcase, Building, UserCheck, FileCheck, ChevronRight, ArrowRight, Target, ChevronUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { PageHeaderPanel } from '@/components/panels';
import { DEFAULT_STRUKTUR_ORGANISASI, getStrukturOrganisasiSummary } from '../../data/defaultStrukturOrganisasi';
import { PICChangeConfirmationDialog } from '@/components/ui/pic-change-confirmation-dialog';
import { BulkDeleteConfirmationDialog } from '@/components/ui/bulk-delete-confirmation-dialog';

// Helper functions untuk password
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Helper function untuk generate checklist ID (year + row format)
const generateChecklistId = (year: number, rowNumber: number): number => {
  const yearDigits = year % 100; // Get last two digits of year
  return parseInt(`${yearDigits}${rowNumber}`);
};

// Helper function untuk debounce
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
};

// Komponen Assignment Dropdown
const AssignmentDropdown = ({ 
  item, 
  onAssign, 
  isSuperAdmin,
  currentAssignmentLabel,
  assignmentType,
  assignments,
  selectedYear
}: { 
  item: { id: number; aspek: string; deskripsi: string }; 
  onAssign: (checklistId: number, targetName: string, aspek: string, deskripsi: string) => void;
  isSuperAdmin: boolean;
  currentAssignmentLabel?: string | null;
  assignmentType: 'divisi' | 'subdirektorat';
  assignments: ChecklistAssignment[];
  selectedYear: number | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { divisi, subdirektorat } = useStrukturPerusahaan();
  
  // Check if files exist for a checklist item
  const checkIfFilesExist = async (checklistId: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/check-files-exist/${checklistId}?year=${selectedYear}`);
      const data = await response.json();
      return data.hasFiles || false;
    } catch (error) {
      console.error('Error checking files:', error);
      return false; // Assume no files on error to avoid blocking
    }
  };
  
  // Filter dan sort berdasarkan assignment type
  const optionNames = useMemo(() => {
    const source = assignmentType === 'divisi' ? divisi : subdirektorat;
    const names = (source || [])
      .map(d => d.nama)
      .filter((n): n is string => !!n && n.trim() !== '');
    
    // Deduplicate names using Set and then sort
    const uniqueNames = [...new Set(names)]
      .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })); // Sort A-Z dengan locale Indonesia
    
    return uniqueNames;
  }, [assignmentType, divisi, subdirektorat]);

  // Filter berdasarkan search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return optionNames;
    
    return optionNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [optionNames, searchTerm]);

  const handleAssign = async (value: string) => {
    setIsLoading(true);
    try {
      // Check if files exist for this checklist item before assignment
      const hasFiles = await checkIfFilesExist(item.id);
      
      if (hasFiles && currentAssignmentLabel && value !== currentAssignmentLabel) {
        // Show custom confirmation dialog for existing files
        setPendingAssignment(value);
        setShowConfirmDialog(true);
        setIsLoading(false);
        return; // Wait for user confirmation
      }
      
      // If no files exist or same assignment, proceed directly
      await proceedWithAssignment(value);
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithAssignment = async (value: string) => {
    try {
      // Simulate async operation untuk menghindari lag
      await new Promise(resolve => setTimeout(resolve, 10));
      onAssign(item.id, value, item.aspek, item.deskripsi);
      setIsOpen(false);
      setSearchTerm(''); // Reset search term setelah assign
    } catch (error) {
      console.error('Error during assignment:', error);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!pendingAssignment) return;
    
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      await proceedWithAssignment(pendingAssignment);
    } finally {
      setPendingAssignment(null);
      setIsLoading(false);
    }
  };

  const handleCancelAssignment = () => {
    setShowConfirmDialog(false);
    setPendingAssignment(null);
    setIsLoading(false);
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      setSearchTerm(''); // Reset search term saat dropdown dibuka
    }
    setIsOpen(!isOpen);
  };

  const clearSearch = () => {
    setSearchTerm('');
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

  // Cek apakah dokumen terkunci karena sudah di-assign dengan tipe yang berbeda
  const isLocked = useMemo(() => {
    // Cari assignment dengan tipe yang berbeda
    const otherTypeAssignment = assignments.find(a => 
      a.checklistId === item.id && 
      a.tahun === selectedYear && 
      a.assignmentType !== assignmentType
    );
    
    // Jika ada assignment dengan tipe yang berbeda, maka terkunci
    return !!otherTypeAssignment;
  }, [assignments, item.id, selectedYear, assignmentType]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
          onClick={handleToggleDropdown}
          disabled={isLoading || isLocked}
          className={`w-64 justify-between disabled:opacity-50 ${
            isLocked 
              ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed' 
              : currentAssignmentLabel 
                ? 'border-blue-300 bg-blue-50 text-blue-700' 
                : ''
          }`}
        >
        <span className="text-left flex-1 mr-2 min-w-0">
          <span className="block truncate" title={isLoading 
            ? 'Assigning...'
            : isLocked
              ? `Terkunci (${assignmentType === 'divisi' ? 'Divisi' : 'Subdirektorat'})`
              : currentAssignmentLabel 
                ? currentAssignmentLabel
                : `Tugas ${assignmentType === 'divisi' ? 'Divisi' : 'Subdirektorat'}`}>
          {isLoading 
            ? 'Assigning...'
              : isLocked
                ? `Terkunci (${assignmentType === 'divisi' ? 'Divisi' : 'Subdirektorat'})`
            : currentAssignmentLabel 
                  ? currentAssignmentLabel
                  : `Tugas ${assignmentType === 'divisi' ? 'Divisi' : 'Subdirektorat'}`}
          </span>
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
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <Input
                type="text"
                placeholder={`Cari ${assignmentType === 'divisi' ? 'divisi' : 'subdirektorat'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-sm pr-8"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                {searchTerm.trim() 
                  ? `Tidak ada ${assignmentType === 'divisi' ? 'divisi' : 'subdirektorat'} yang cocok` 
                  : `Belum ada ${assignmentType === 'divisi' ? 'divisi' : 'subdirektorat'}`}
              </div>
            ) : (
              filteredOptions.map((name) => (
                <button
                  key={name}
                  onClick={() => handleAssign(name)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {name}
                </button>
              ))
            )}
          </div>
          
          {/* Footer dengan info jumlah */}
          {filteredOptions.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
              {searchTerm.trim() 
                ? `${filteredOptions.length} dari ${optionNames.length} ${assignmentType === 'divisi' ? 'divisi' : 'subdirektorat'}`
                : `${optionNames.length} ${assignmentType === 'divisi' ? 'divisi' : 'subdirektorat'} tersedia`
              }
            </div>
                      )}
            
            {/* Reset Assignment Option */}
            {currentAssignmentLabel && (
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => handleAssign('')}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Tidak Memilih (Reset)</span>
                </button>
              </div>
            )}
        </div>
      )}
      
      {/* Custom Confirmation Dialog */}
      <PICChangeConfirmationDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmAssignment}
        onCancel={handleCancelAssignment}
        newPIC={pendingAssignment || ''}
        checklistDescription={item.deskripsi}
      />
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
  role: 'superadmin' | 'admin' | 'user';
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
  whatsapp?: string;
  tahun: number;
}

interface ChecklistItem extends ChecklistGCG {
  status?: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  catatan?: string;
  pic?: string;
  tahun: number;
}

interface ChecklistAssignment {
  id: number;
  checklistId: number;
  divisi?: string;
  subdirektorat?: string;
  assignmentType: 'divisi' | 'subdirektorat';
  aspek: string;
  deskripsi: string;
  tahun: number;
  assignedBy: string;
  assignedAt: Date;
  status: 'assigned' | 'in_progress' | 'completed';
  notes?: string;
}

// Default checklist data untuk demo (256 items)
const DEFAULT_CHECKLIST_ITEMS = [
  "Pedoman Tata Kelola Perusahaan yang Baik/CoCG",
  "Pedoman Perilaku/CoC",
  "Penetapan Direksi sbg Penanggungjawab GCG dan SK Penunjukan Tim Komite Pemantau GCG (Bila ada)",
  "Board Manual",
  "Pedoman Pengendalian Gratifikasi",
  "Pedoman WBS",
  "Peraturan Disiplin Pegawai",
  "PKB Terupdate",
  "Dokumentasi Sosialisasi CoCG, CoC dan panduan pelaksanaan CoC kepada Organ perusahaan",
  "Pernyataan Kepatuhan kepada CoC Tahun 2022 dan sebelumnya",
  "Program penguatan kepemimpinan, kompetensi, dan etika kepemimpinan",
  "Uraian Jabatan/Job Description (JD) Dewan Komisaris dan Direksi",
  "Pakta Integritas / Letter of Undertaking (LoU) Direksi dan Dewan Komisaris (periode 2023 dan 2024)",
  "Pakta Integritas / Letter of Undertaking (LoU) Komite yang berada di bawah Dewan Komisaris Tahun 2023 dan 2024",
  "Pakta Integritas / Letter of Undertaking (LoU) Seluruh Karyawan Tahun 2023 dan 2024",
  "Laporan Penerapan GCG",
  "Surat Pernyataan Tanggung Jawab atas Laporan Pelaksanaan GCG",
  "Struktur organisasi Dewan Komisaris",
  "Piagam (Board Charter) Dewan Komisaris",
  "Surat Keputusan Anggota Dewan Komisaris",
  "Laporan Pelaksanaan Tugas Dewan Komisaris",
  "Jadwal dan Risalah Rapat Dewan Komisaris dan Rapat Gabungan dengan Direksi Tahun 2023 dan 2024",
  "Form Laporan Keberadaan Dewan Komisaris Tahun 2023 dan 2024",
  "Struktur organisasi Direksi",
  "Piagam (Board Charter) Direksi",
  "Surat Keputusan Anggota Direksi",
  "Laporan Pelaksanaan Tugas Direksi",
  "Jadwal dan Risalah Rapat Direksi Tahun 2023 dan 2024",
  "Laporan Keberadaan Direksi Tahun 2023 dan 2024",
  "Piagam Komite Audit",
  "Struktur organisasi Komite Audit",
  "SK Komite Audit",
  "Laporan Pelaksanaan Tugas Komite Audit",
  "Jadwal dan Risalah Rapat Komite Audit Tahun 2023 dan 2024",
  "Piagam Komite Nominasi dan Remunerasi",
  "Struktur organisasi Komite Nominasi dan Remunerasi",
  "SK Komite Nominasi dan Remunerasi",
  "Laporan Pelaksanaan Tugas Komite Nominasi dan Remunerasi",
  "Jadwal dan Risalah Rapat Komite Nominasi dan Remunerasi Tahun 2023 dan 2024",
  "Piagam Komite Lain (Bila ada)",
  "Struktur Organisasi Komite Lain (Bila ada)",
  "SK Komite Lain (Bila ada)",
  "Laporan Pelaksanaan Tugas Komite Lain (Bila ada)",
  "Jadwal dan Risalah Rapat Komite Lain (Bila ada) Tahun 2023 dan 2024",
  "Profil Anggota Dewan Komisaris, Direksi, dan Komite",
  "Kompetensi Dewan Komisaris, Direksi, dan Komite",
  "Laporan Indeks Kepuasan Pemangku Kepentingan",
  "Program pelatihan dan peningkatan kompetensi untuk Dewan Komisaris, Direksi, dan Komite yang berada di bawah Dewan Komisaris",
  "Laporan Keterbatasan Akses Dewan Komisaris dan Komite terhadap Informasi (jika ada)",
  "Piagam Satuan Pengawasan Intern (SPI)",
  "Struktur Organisasi SPI",
  "SK Ketua dan Anggota SPI",
  "Uraian tugas dan tanggung jawab SPI",
  "Laporan Pelaksanaan Tugas SPI",
  "Jadwal dan Risalah Rapat SPI Tahun 2023 dan 2024",
  "Rencana Kerja dan Anggaran (RKA) SPI",
  "Dokumen hasil audit internal dan eksternal",
  "Bukti tindak lanjut hasil audit internal dan eksternal",
  "Piagam Sekretaris Perusahaan",
  "SK Sekretaris Perusahaan",
  "Uraian tugas dan tanggung jawab Sekretaris Perusahaan",
  "Program kerja Sekretaris Perusahaan Tahun 2023 dan 2024",
  "Laporan pelaksanaan tugas Sekretaris Perusahaan",
  "Kebijakan Manajemen Risiko",
  "Daftar profil risiko tahun 2024",
  "Pedoman Manajemen Risiko",
  "Laporan penerapan manajemen risiko secara berkelanjutan",
  "Pedoman Sistem Pengendalian Internal",
  "Piagam Audit Internal",
  "Kebijakan dan prosedur tentang Anti Fraud",
  "Kebijakan mengenai whistleblowing system (WBS)",
  "Laporan penanganan WBS",
  "Pedoman pengelolaan benturan kepentingan",
  "Pedoman Pengendalian Gratifikasi",
  "Laporan pengendalian gratifikasi",
  "Kebijakan dan prosedur transaksi yang mengandung benturan kepentingan",
  "Kebijakan dan prosedur terkait transaksi dengan pihak berelasi",
  "Laporan transaksi dengan pihak berelasi",
  "Kebijakan Manajemen Komplain",
  "Laporan pengelolaan komplain",
  "Kebijakan Perlindungan Konsumen",
  "Laporan perlindungan konsumen",
  "Kebijakan Manajemen Keberlanjutan",
  "Laporan Keberlanjutan",
  "Program dan Pelaksanaan CSR",
  "Laporan Pelaksanaan CSR",
  "Pedoman Penyelenggaraan Rapat Dewan Komisaris",
  "Pedoman Penyelenggaraan Rapat Direksi",
  "Piagam Komite-Komite di bawah Dewan Komisaris",
  "Daftar anggota Komite-Komite di bawah Dewan Komisaris",
  "Laporan pelaksanaan tugas Komite-Komite di bawah Dewan Komisaris",
  "Laporan Rapat Gabungan Dewan Komisaris dan Direksi",
  "Laporan Keberadaan Dewan Komisaris, Direksi, dan Komite di bawah Dewan Komisaris",
  "Kebijakan Perekrutan dan Seleksi Dewan Komisaris",
  "Kebijakan Perekrutan dan Seleksi Direksi",
  "Kebijakan Penilaian Kinerja Dewan Komisaris dan Direksi",
  "Laporan Penilaian Kinerja Dewan Komisaris dan Direksi",
  "Laporan Remunerasi Dewan Komisaris dan Direksi",
  "Laporan Keterbukaan Informasi Perusahaan",
  "Kebijakan Komunikasi dengan Pemegang Saham",
  "Laporan Komunikasi dengan Pemegang Saham",
  "Kebijakan Pengelolaan Informasi dan Pengungkapan Informasi Publik",
  "Laporan Pengungkapan Informasi Publik",
  "Kebijakan Pengelolaan Website Perusahaan",
  "Laporan Pengelolaan Website Perusahaan",
  "Kebijakan Pemanfaatan Teknologi Informasi",
  "Laporan Pemanfaatan Teknologi Informasi",
  "Kebijakan Perlindungan Data Pribadi",
  "Laporan Perlindungan Data Pribadi",
  "Kebijakan Lingkungan Hidup",
  "Laporan Lingkungan Hidup",
  "Program Pengelolaan Lingkungan Hidup",
  "Laporan Kepatuhan terhadap Peraturan Lingkungan Hidup",
  "Kebijakan Kesehatan dan Keselamatan Kerja (K3)",
  "Laporan Pelaksanaan K3",
  "Program Pelaksanaan K3",
  "Laporan Kepatuhan terhadap Peraturan K3",
  "Kebijakan Hak Asasi Manusia (HAM)",
  "Laporan Pelaksanaan HAM",
  "Program Pelaksanaan HAM",
  "Kebijakan Pengadaan Barang dan Jasa",
  "Laporan Pengadaan Barang dan Jasa",
  "Kebijakan Manajemen Keuangan",
  "Laporan Keuangan",
  "Kebijakan Perencanaan Strategis",
  "Rencana Strategis Perusahaan",
  "Kebijakan Manajemen Kinerja",
  "Laporan Manajemen Kinerja",
  "Kebijakan Manajemen SDM",
  "Kebijakan Remunerasi Karyawan",
  "Laporan Remunerasi Karyawan",
  "Kebijakan Pendidikan dan Pelatihan",
  "Laporan Pendidikan dan Pelatihan",
  "Program Pendidikan dan Pelatihan",
  "Kebijakan Kesejahteraan Karyawan",
  "Laporan Kesejahteraan Karyawan",
  "Kebijakan Hubungan Industrial",
  "Laporan Hubungan Industrial",
  "Kebijakan Pemberdayaan Karyawan",
  "Laporan Pemberdayaan Karyawan",
  "Kebijakan Keberagaman dan Inklusi",
  "Laporan Keberagaman dan Inklusi",
  "Kebijakan Pensiun",
  "Laporan Pensiun",
  "Kebijakan Keselamatan dan Keamanan",
  "Laporan Keselamatan dan Keamanan",
  "Kebijakan Pengelolaan Aset",
  "Laporan Pengelolaan Aset",
  "Kebijakan Manajemen Proyek",
  "Laporan Manajemen Proyek",
  "Kebijakan Teknologi Informasi",
  "Laporan Teknologi Informasi",
  "Kebijakan Inovasi",
  "Laporan Inovasi",
  "Kebijakan Manajemen Mutu",
  "Laporan Manajemen Mutu",
  "Kebijakan Pemasaran",
  "Laporan Pemasaran",
  "Kebijakan Penjualan",
  "Laporan Penjualan",
  "Kebijakan Pelayanan Pelanggan",
  "Laporan Pelayanan Pelanggan",
  "Kebijakan Riset dan Pengembangan",
  "Laporan Riset dan Pengembangan",
  "Kebijakan Kemitraan",
  "Laporan Kemitraan",
  "Kebijakan Komunikasi",
  "Laporan Komunikasi",
  "Kebijakan Hubungan Masyarakat",
  "Laporan Hubungan Masyarakat",
  "Kebijakan Hubungan Investor",
  "Laporan Hubungan Investor",
  "Kebijakan Kepatuhan",
  "Laporan Kepatuhan",
  "Kebijakan Hukum",
  "Laporan Hukum",
  "Kebijakan Etika",
  "Laporan Etika",
  "Kebijakan Integritas",
  "Laporan Integritas",
  "Kebijakan Anti-Korupsi",
  "Laporan Anti-Korupsi",
  "Kebijakan Anti-Pencucian Uang",
  "Laporan Anti-Pencucian Uang",
  "Kebijakan Manajemen Reputasi",
  "Laporan Manajemen Reputasi",
  "Kebijakan Manajemen Krisis",
  "Laporan Manajemen Krisis",
  "Kebijakan Keberlanjutan Bisnis",
  "Laporan Keberlanjutan Bisnis",
  "Kebijakan Keamanan Siber",
  "Laporan Keamanan Siber",
  "Kebijakan Perlindungan Data",
  "Laporan Perlindungan Data",
  "Kebijakan Pengelolaan Risiko",
  "Laporan Pengelolaan Risiko",
  "Kebijakan Pengendalian Internal",
  "Laporan Pengendalian Internal",
  "Kebijakan Audit Internal",
  "Laporan Audit Internal",
  "Kebijakan Anti-Fraud",
  "Laporan Anti-Fraud",
  "Kebijakan WBS",
  "Laporan WBS",
  "Kebijakan Anti-Gratifikasi",
  "Laporan Anti-Gratifikasi",
  "Kebijakan Benturan Kepentingan",
  "Laporan Benturan Kepentingan",
  "Kebijakan Pihak Berelasi",
  "Laporan Pihak Berelasi",
  "Kebijakan Komplain",
  "Laporan Komplain",
  "Kebijakan Pelindungan Konsumen",
  "Laporan Perlindungan Konsumen",
  "Kebijakan CSR",
  "Laporan CSR",
  "Kebijakan Lingkungan",
  "Laporan Lingkungan",
  "Kebijakan K3",
  "Laporan K3",
  "Kebijakan HAM",
  "Laporan HAM",
  "Kebijakan Pengadaan",
  "Laporan Pengadaan",
  "Kebijakan Keuangan",
  "Laporan Keuangan",
  "Kebijakan Manajemen",
  "Laporan Manajemen",
  "Kebijakan SDM",
  "Laporan SDM",
  "Kebijakan Remunerasi",
  "Laporan Remunerasi",
  "Kebijakan Pelatihan",
  "Laporan Pelatihan",
  "Kebijakan Kesejahteraan",
  "Laporan Kesejahteraan",
  "Kebijakan Industrial",
  "Laporan Industrial",
  "Kebijakan Pemberdayaan",
  "Laporan Pemberdayaan",
  "Kebijakan Keberagaman",
  "Laporan Keberagaman",
  "Kebijakan Pensiun",
  "Laporan Pensiun",
  "Kebijakan Keamanan",
  "Laporan Keamanan",
  "Kebijakan Aset",
  "Laporan Aset",
  "Kebijakan Proyek",
  "Laporan Proyek",
  "Kebijakan TI",
  "Laporan TI",
  "Annual Report",
  "Penghargaan di bidang CSR, bidang publikasi dan keterbukaan Informasi",
  "Penghargaan-penghargaan lainnya yang diperoleh perusahaan selama tahun 2024",
  "Dekom/Direksi/Manajemen Kunci menjadi Pembicara mewakili Perusahaan"
];

const PengaturanBaru = () => {
  const { isSidebarOpen } = useSidebar();
  const { availableYears, addYear, setSelectedYear, selectedYear, removeYear } = useYear();
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
  const { 
    checklist, 
    aspects,
    addChecklist, 
    editChecklist, 
    deleteChecklist, 
    addAspek, 
    editAspek, 
    deleteAspek, 
    initializeYearData,
    getAspectsByYear,
    ensureAspectsForAllYears,
    useDefaultChecklistData
  } = useChecklist();
  const { toast } = useToast();

  // State untuk users
  const [users, setUsers] = useState<User[]>([]);
  
  // State untuk checklist management
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showAspekDialog, setShowAspekDialog] = useState(false);
  const [newAspek, setNewAspek] = useState('');
  
  // State untuk assignment management
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [assignmentType, setAssignmentType] = useState<'divisi' | 'subdirektorat'>('divisi');
  
  // State untuk manajemen aspek
  const [showAspekManagementPanel, setShowAspekManagementPanel] = useState(false);
  const [editingAspek, setEditingAspek] = useState<{ id: number; nama: string } | null>(null);
  const [aspekForm, setAspekForm] = useState({ nama: '' });
  const [currentYearAspects, setCurrentYearAspects] = useState<Array<{ id: number; nama: string; tahun: number }>>([]);
  
  // State untuk mengontrol visibility button data default
  const [showDefaultDataButton, setShowDefaultDataButton] = useState(false);
  
  // State untuk tracking changes dan actions
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalChecklistItems, setOriginalChecklistItems] = useState<ChecklistItem[]>([]);
  
  // State untuk tracking individual item changes
  const [itemChanges, setItemChanges] = useState<Set<number>>(new Set());
  
  // State untuk tracking item baru (untuk highlight)
  const [newItems, setNewItems] = useState<Set<number>>(new Set());
  
  // Ref untuk tabel checklist
  const checklistTableRef = useRef<HTMLDivElement>(null);
  
  // Ref untuk item baru yang ditambahkan
  const newItemRef = useRef<HTMLTableRowElement>(null);
  
  // Floating actions visibility
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // State untuk tracking tab yang aktif
  const [activeTab, setActiveTab] = useState('tahun-buku');
  
  // State untuk copy options dialogs
  const [showCopyOptionsDialog, setShowCopyOptionsDialog] = useState(false);
  const [newYearToSetup, setNewYearToSetup] = useState<number | null>(null);
  const [copyOptions, setCopyOptions] = useState({
    strukturOrganisasi: false,
    manajemenAkun: false,
    kelolaDokumen: false
  });
  const [copySourceYear, setCopySourceYear] = useState<number | null>(null);

  // State untuk bulk delete functionality
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // State untuk dialog tambah tahun
  const [showTahunDialog, setShowTahunDialog] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Effect untuk mengupdate progress struktur organisasi
  useEffect(() => {
    // Progress struktur organisasi tidak bergantung pada tahun tertentu
    // Bisa diakses meskipun belum ada tahun yang dipilih
    if (direktorat && direktorat.length > 0 && 
        subdirektorat && subdirektorat.length > 0 && 
        anakPerusahaan && anakPerusahaan.length > 0 && 
        divisi && divisi.length > 0) {
      setSetupProgress(prev => ({ ...prev, strukturOrganisasi: true }));
    }
  }, [direktorat, subdirektorat, anakPerusahaan, divisi]);

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
    // Progress manajemen akun tidak bergantung pada tahun tertentu
    // Bisa diakses meskipun belum ada tahun yang dipilih
    if (users && users.length > 0) {
      setSetupProgress(prev => ({ ...prev, manajemenAkun: true }));
    }
  }, [users]);

  // Effect untuk memastikan aspects tersedia untuk semua tahun
  useEffect(() => {
    console.log('PengaturanBaru: Ensuring aspects are available for all years');
    ensureAspectsForAllYears();
  }, [ensureAspectsForAllYears]);

  // Effect untuk load checklist dari context (removed localStorage dependency)
  useEffect(() => {
    console.log('PengaturanBaru: Loading checklist data for year', selectedYear);
    console.log('PengaturanBaru: Context checklist data:', {
      total: checklist?.length || 0,
      selectedYear: selectedYear
    });
    
    let allChecklist: ChecklistItem[] = [];
    
    // Load from ChecklistContext (Supabase data)
    if (checklist && selectedYear) {
      // Filter data context berdasarkan tahun yang dipilih
      const contextFiltered = checklist.filter(item => item.tahun === selectedYear);
      allChecklist = contextFiltered.map(item => ({
        ...item,
        status: 'pending' as const,
        catatan: '',
        tahun: item.tahun || selectedYear,
        id: item.id,
        aspek: item.aspek || '',
        deskripsi: item.deskripsi || '',
        pic: item.pic || '',
        rowNumber: item.rowNumber
      }));
      console.log('PengaturanBaru: Loaded from ChecklistContext', {
        contextTotal: checklist.length,
        selectedYear: selectedYear,
        filteredForYear: allChecklist.length
      });
    }
    
    console.log('PengaturanBaru: Setting checklist items', {
      count: allChecklist.length,
      items: allChecklist.slice(0, 3) // Show first 3 items for debugging
    });
    
    // Update state
    setChecklistItems(allChecklist);
    setOriginalChecklistItems(allChecklist);
    
  }, [selectedYear]); // Only reload when year changes, not when checklist context updates
  
  // Effect untuk auto-save checklist items saat ada perubahan
  // Gunakan useCallback untuk mencegah re-render berlebihan
  const debouncedSave = useCallback(
    debounce((items: ChecklistItem[]) => {
      if (items.length > 0 && selectedYear) {
        // Auto-save ke localStorage setiap kali ada perubahan
        // REMOVED localStorage.setItem - data goes to Supabase via ChecklistContext
        
        // Trigger update di ChecklistContext untuk konsistensi data
        // Pastikan data dalam format yang benar untuk ChecklistContext
        const contextData = items.map(item => ({
          id: item.id,
          aspek: item.aspek,
          deskripsi: item.deskripsi,
          pic: item.pic,
          tahun: item.tahun
        }));
        
        window.dispatchEvent(new CustomEvent('checklistUpdated', {
          detail: { type: 'checklistUpdated', data: contextData }
        }));
        
        console.log('PengaturanBaru: Auto-saved checklist items', {
          count: items.length,
          year: selectedYear,
          contextData: contextData
        });
      }
    }, 500), // Delay 500ms untuk mencegah save berlebihan
    [selectedYear]
  );

  // Effect untuk auto-save dengan debouncing - DISABLED TO PREVENT INFINITE LOOP
  // useEffect(() => {
  //   debouncedSave(checklistItems);
  // }, [checklistItems, debouncedSave]);
  
  // Effect untuk load assignments dari database (not localStorage)
  useEffect(() => {
    const fetchAssignmentsFromDatabase = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/config/assignments');
        if (response.ok) {
          const data = await response.json();
          const allAssignments = data.assignments || [];
          
          // Filter assignments berdasarkan tahun yang dipilih
          if (selectedYear) {
            const yearAssignments = allAssignments.filter((a: any) => a.tahun === selectedYear);
            setAssignments(yearAssignments);
          } else {
            setAssignments(allAssignments);
          }
        } else {
          console.error('Failed to fetch assignments from database');
          setAssignments([]);
        }
      } catch (error) {
        console.error('Error fetching assignments from database:', error);
        setAssignments([]);
      }
    };

    fetchAssignmentsFromDatabase();
  }, [selectedYear]);

  // Effect to load aspects for selected year
  useEffect(() => {
    const loadAspects = async () => {
      if (selectedYear) {
        try {
          const aspectsData = await getAspectsByYear(selectedYear);
          setCurrentYearAspects(aspectsData);
        } catch (error) {
          console.error('Error loading aspects for PengaturanBaru:', error);
          setCurrentYearAspects([]);
        }
      }
    };
    loadAspects();
  }, [selectedYear, getAspectsByYear]);

  // Effect untuk mengupdate progress kelola dokumen
  useEffect(() => {
    // Progress kelola dokumen tidak bergantung pada tahun tertentu
    // Bisa diakses meskipun belum ada tahun yang dipilih
    if (checklistItems && checklistItems.length > 0) {
      setSetupProgress(prev => ({ ...prev, kelolaDokumen: true }));
    }
  }, [checklistItems]);

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

  // Effect untuk refresh assignments saat tahun berubah
  useEffect(() => {
    if (selectedYear) {
      const storedAssignments = localStorage.getItem('checklistAssignments');
      if (storedAssignments) {
        try {
          const parsedAssignments = JSON.parse(storedAssignments);
          const yearAssignments = parsedAssignments.filter((a: any) => a.tahun === selectedYear);
          setAssignments(yearAssignments);
        } catch (error) {
          console.error('Error parsing assignments for year change:', error);
          setAssignments([]);
        }
      } else {
        setAssignments([]);
      }
    }
  }, [selectedYear]);
  
  // Effect untuk mendengarkan event fresh year creation
  useEffect(() => {
    const handleYearCreatedFresh = (event: CustomEvent) => {
      const { year } = event.detail;
      console.log('PengaturanBaru: Handling fresh year creation for year', year);
      
      // Force reload checklist data untuk tahun baru yang fresh
      if (selectedYear === year) {
        setChecklistItems([]);
        setOriginalChecklistItems([]);
        setItemChanges(new Set());
        setHasUnsavedChanges(false);
        
        // Clear assignments untuk tahun baru
        setAssignments([]);
        
        console.log('PengaturanBaru: Cleared all checklist data for fresh year', year);
      }
    };

    const handleYearRemoved = (event: CustomEvent) => {
      const { year } = event.detail;
      console.log('PengaturanBaru: Handling year removal for year', year);
      
      // Clear data jika tahun yang dihapus adalah tahun aktif
      if (selectedYear === year) {
        setChecklistItems([]);
        setOriginalChecklistItems([]);
        setItemChanges(new Set());
        setHasUnsavedChanges(false);
        
        // Clear assignments untuk tahun yang dihapus
        setAssignments([]);
        
        console.log('PengaturanBaru: Cleared all checklist data for removed year', year);
      }
    };

    window.addEventListener('yearCreatedFresh', handleYearCreatedFresh as EventListener);
    window.addEventListener('yearRemoved', handleYearRemoved as EventListener);
    
    return () => {
      window.removeEventListener('yearCreatedFresh', handleYearCreatedFresh as EventListener);
      window.removeEventListener('yearRemoved', handleYearRemoved as EventListener);
    };
  }, [selectedYear]);
  
  // State untuk form tahun buku
  const [tahunForm, setTahunForm] = useState({
    tahun: new Date().getFullYear(),
    nama: '',
    deskripsi: ''
  });

  // State untuk form struktur organisasi
  const [strukturForm, setStrukturForm] = useState({
    direktorat: { nama: '', deskripsi: '' },
    subdirektorat: { nama: '', direktoratId: '', deskripsi: '' },
    anakPerusahaan: { nama: '', deskripsi: '' },
    divisi: { nama: '', subdirektoratId: '', deskripsi: '' }
  });

  // State untuk form user
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'superadmin' | 'admin' | 'user',
    direktorat: '',
    subdirektorat: '',
    divisi: '',
    whatsapp: ''
  });



  // State untuk dialog
  const [showDirektoratDialog, setShowDirektoratDialog] = useState(false);
  const [showSubdirektoratDialog, setShowSubdirektoratDialog] = useState(false);
  const [showAnakPerusahaanDialog, setShowAnakPerusahaanDialog] = useState(false);
  const [showDivisiDialog, setShowDivisiDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
      const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
  const [showSuperAdminDialog, setShowSuperAdminDialog] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({
    email: 'arsippostgcg@gmail.com',
    password: 'postarsipGCG.'
  });
    
    // State untuk editing struktur organisasi
    const [editingDirektorat, setEditingDirektorat] = useState<{ id: number; nama: string; deskripsi: string } | null>(null);
    const [editingSubdirektorat, setEditingSubdirektorat] = useState<{ id: number; nama: string; deskripsi: string; direktoratId: number } | null>(null);
    const [editingAnakPerusahaan, setEditingAnakPerusahaan] = useState<{ id: number; nama: string; deskripsi: string } | null>(null);
    const [editingDivisi, setEditingDivisi] = useState<{ id: number; nama: string; deskripsi: string; subdirektoratId: number } | null>(null);
    
    // State untuk tracking progress
  const [setupProgress, setSetupProgress] = useState({
    tahunBuku: false,
    strukturOrganisasi: false,
    manajemenAkun: false,
    kelolaDokumen: false
  });

  // Consolidate progress recomputation based on data presence per selected year
  useEffect(() => {
    // Progress untuk tahun buku selalu berdasarkan availableYears
    const hasYear = availableYears && availableYears.length > 0;
    
    // Progress untuk struktur organisasi - bisa diakses meskipun belum ada tahun
    const hasStruktur = Boolean(
      direktorat && direktorat.length > 0 && 
      subdirektorat && subdirektorat.length > 0 && 
      anakPerusahaan && anakPerusahaan.length > 0 && 
      divisi && divisi.length > 0
    );
    
    // Progress untuk manajemen akun - EXCLUDE superadmin dan hanya hitung admin untuk tahun yang dipilih
    const hasUsers = selectedYear ? Boolean(
      users && users.filter(u => u.tahun === selectedYear && u.role === 'admin').length > 0
    ) : Boolean(users && users.filter(u => u.role === 'admin').length > 0);
    
    // Progress untuk kelola dokumen - bisa diakses meskipun belum ada tahun
    const hasChecklist = Boolean(checklistItems && checklistItems.length > 0);

    setSetupProgress({
      tahunBuku: hasYear,
      strukturOrganisasi: hasStruktur,
      manajemenAkun: hasUsers,
      kelolaDokumen: hasChecklist,
    });
  }, [availableYears, direktorat, subdirektorat, anakPerusahaan, divisi, users, checklistItems, selectedYear]);

  // Handler untuk submit tahun buku
  const handleTahunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tahunForm.tahun) {
      toast({
        title: "Error",
        description: "Tahun buku wajib diisi!",
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
      // Add new year (now calls Supabase API)
      await addYear(tahunForm.tahun);
      
      // Set as active year
      setSelectedYear(tahunForm.tahun);
      
      // Find previous year for copy options
      const previousYear = availableYears
        .filter(year => year < tahunForm.tahun)
        .sort((a, b) => b - a)[0];
      
      if (previousYear) {
        // Show copy options dialog
        setCopySourceYear(previousYear);
        setNewYearToSetup(tahunForm.tahun);
        setCopyOptions({
          strukturOrganisasi: false,
          manajemenAkun: false,
          kelolaDokumen: false
        });
        setShowCopyOptionsDialog(true);
      } else {
        // No previous year, just update progress
        setSetupProgress(prev => ({ ...prev, tahunBuku: true }));
        toast({
          title: "Berhasil!",
          description: `Tahun buku ${tahunForm.tahun} berhasil ditambahkan`,
        });
      }

      // Reset form
      setTahunForm({
        tahun: new Date().getFullYear(),
        nama: '',
        deskripsi: ''
      });
      
      // Close dialog
      setShowTahunDialog(false);

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan tahun buku",
        variant: "destructive"
      });
    }
  };

  // Function untuk copy data dari tahun sebelumnya
  const copyDataFromPreviousYear = async (newYear: number, options: typeof copyOptions) => {
    try {
      if (!copySourceYear) return;

      // Copy data berdasarkan opsi yang dipilih
      if (options.strukturOrganisasi) {
        await copyStrukturOrganisasi(copySourceYear, newYear);
      }
      
      if (options.manajemenAkun) {
        await copyManajemenAkun(copySourceYear, newYear);
      }
      
      if (options.kelolaDokumen) {
        await copyKelolaDokumen(copySourceYear, newYear);
      }

      // Update progress berdasarkan data yang di-copy
      const newProgress = { ...setupProgress };
      if (options.strukturOrganisasi) newProgress.strukturOrganisasi = true;
      if (options.manajemenAkun) newProgress.manajemenAkun = true;
      if (options.kelolaDokumen) newProgress.kelolaDokumen = true;
      
      setSetupProgress(newProgress);

      toast({
        title: "Berhasil!",
        description: `Data yang dipilih berhasil di-copy dari tahun ${copySourceYear} ke tahun ${newYear}`,
      });
    } catch (error) {
      console.error('Error copying data:', error);
      toast({
        title: "Error",
        description: "Gagal copy data dari tahun sebelumnya",
        variant: "destructive"
      });
    }
  };

  // Handler untuk memproses copy options
  const handleCopyOptionsSubmit = async () => {
    if (!newYearToSetup) return;
    
    try {
      // Jika ada opsi yang dipilih, copy data
      if (Object.values(copyOptions).some(Boolean)) {
        await copyDataFromPreviousYear(newYearToSetup, copyOptions);
      } else {
        // Jika tidak ada yang dipilih, pastikan data benar-benar fresh
        await ensureFreshYearData(newYearToSetup);
        
        // Reset progress untuk tahun baru (fresh start)
        setSetupProgress({
          tahunBuku: true,
          strukturOrganisasi: false,
          manajemenAkun: false,
          kelolaDokumen: false
        });
        
        toast({
          title: "Berhasil!",
          description: `Tahun buku ${newYearToSetup} berhasil ditambahkan dengan data fresh`,
        });
      }
      
      // Close dialog
      setShowCopyOptionsDialog(false);
      setNewYearToSetup(null);
      setCopySourceYear(null);
      setCopyOptions({
        strukturOrganisasi: false,
        manajemenAkun: false,
        kelolaDokumen: false
      });
      
    } catch (error) {
      console.error('Error processing copy options:', error);
    }
  };

  // Copy Struktur Organisasi
  const copyStrukturOrganisasi = async (fromYear: number, toYear: number) => {
    try {
      // Copy Direktorat
      const direktoratFromYear = direktorat?.filter(d => d.tahun === fromYear) || [];
      for (const d of direktoratFromYear) {
        await addDirektorat({
          nama: d.nama,
          deskripsi: d.deskripsi,
          tahun: toYear
        });
      }

      // Copy Subdirektorat
      const subdirektoratFromYear = subdirektorat?.filter(s => s.tahun === fromYear) || [];
      for (const s of subdirektoratFromYear) {
        await addSubdirektorat({
          nama: s.nama,
          direktoratId: s.direktoratId,
          deskripsi: s.deskripsi,
          tahun: toYear
        });
      }

      // Copy Anak Perusahaan
      const anakPerusahaanFromYear = anakPerusahaan?.filter(a => a.tahun === fromYear) || [];
      anakPerusahaanFromYear.forEach(a => {
        addAnakPerusahaan({
          nama: a.nama,
          deskripsi: a.deskripsi,
          tahun: toYear
        });
      });

      // Copy Divisi
      const divisiFromYear = divisi?.filter(d => d.tahun === fromYear) || [];
      divisiFromYear.forEach(d => {
        addDivisi({
          nama: d.nama,
          subdirektoratId: d.subdirektoratId,
          deskripsi: d.deskripsi,
          tahun: toYear
        });
      });

      console.log(`Struktur organisasi berhasil di-copy dari tahun ${fromYear} ke ${toYear}`);
    } catch (error) {
      console.error('Error copying struktur organisasi:', error);
      throw error;
    }
  };

  // Copy Manajemen Akun
  const copyManajemenAkun = async (fromYear: number, toYear: number) => {
    try {
      const usersFromYear = users?.filter(u => u.tahun === fromYear) || [];
      
      // Pastikan selalu ada super admin untuk tahun baru
      const hasSuperAdmin = usersFromYear.some(u => u.role === 'superadmin');
      
      usersFromYear.forEach((user: User) => {
        const newUser: User = {
          ...user,
          id: generateChecklistId(toYear, Math.floor(Math.random() * 10000) + 1), // Generate proper year+row ID
          tahun: toYear
        };
        
        // Update users state
        setUsers(prev => [...prev, newUser]);
      });

      // Jika tidak ada super admin, tambahkan
      if (!hasSuperAdmin) {
        const superAdminUser = {
          id: generateChecklistId(toYear, 9999), // Super admin gets high row number
          tahun: toYear,
          email: 'arsippostgcg@gmail.com',
          password: 'postarsipGCG.',
          role: 'superadmin' as 'superadmin' | 'admin' | 'user',
          name: 'Super Administrator',
          direktorat: 'Direksi',
          subdirektorat: 'Direksi Utama',
          divisi: 'Direksi'
        };
        setUsers(prev => [...prev, superAdminUser]);
      }

      // Persist ke localStorage
      const allUsers: User[] = [...(users || []), ...usersFromYear.map((u: User, index: number) => ({ ...u, id: generateChecklistId(toYear, 10000 + index), tahun: toYear }))];
      if (!hasSuperAdmin) {
        allUsers.push({
          id: generateChecklistId(toYear, 9998), // Super admin gets high row number
          tahun: toYear,
          email: 'arsippostgcg@gmail.com',
          password: 'postarsipGCG.',
          role: 'superadmin' as 'superadmin' | 'admin' | 'user',
          name: 'Super Administrator',
          direktorat: 'Direksi',
          subdirektorat: 'Direksi Utama',
          divisi: 'Direksi'
        });
      }
      // REMOVED localStorage.setItem - users should be stored in Supabase

      console.log(`Manajemen akun berhasil di-copy dari tahun ${fromYear} ke ${toYear}`);
    } catch (error) {
      console.error('Error copying manajemen akun:', error);
      throw error;
    }
  };

  // Copy Kelola Dokumen
  const copyKelolaDokumen = async (fromYear: number, toYear: number) => {
    try {
      // Get checklist items from previous year
      const checklistFromYear = checklist?.filter(c => c.tahun === fromYear) || [];
      
      // Copy checklist items dengan tahun baru
      const newChecklistItems = checklistFromYear.map((item, index) => ({
        ...item,
        id: generateChecklistId(toYear, (index + 1)), // Generate proper year+row ID
        tahun: toYear,
        rowNumber: index + 1
      }));

      // Update checklist items state
      setChecklistItems(prev => [...prev, ...newChecklistItems]);
      
      // Persist ke localStorage dengan key yang sama dengan ChecklistContext
      const allChecklistItems = [...(checklistItems || []), ...newChecklistItems];
      // REMOVED localStorage.setItem - data goes to Supabase via ChecklistContext
      
      // Trigger update di ChecklistContext
      window.dispatchEvent(new CustomEvent('checklistUpdated', {
        detail: { type: 'checklistUpdated', data: allChecklistItems }
      }));

      // Copy aspects from previous year
      const aspectsFromYear = getAspectsByYear(fromYear);
      aspectsFromYear.forEach(aspek => {
        addAspek(aspek.nama, toYear);
      });

      // Copy assignments jika ada
      const assignmentsFromYear = assignments?.filter(a => a.tahun === fromYear) || [];
      const newAssignments = assignmentsFromYear.map((assignment, index) => ({
        ...assignment,
        id: generateChecklistId(toYear, 20000 + index), // Generate proper year+row ID for assignments
        tahun: toYear,
        assignedAt: new Date()
      }));

      setAssignments(prev => [...prev, ...newAssignments]);
      // REMOVED localStorage.setItem - assignments should be stored in Supabase

      console.log(`Kelola dokumen berhasil di-copy dari tahun ${fromYear} ke ${toYear}`);
    } catch (error) {
      console.error('Error copying kelola dokumen:', error);
      throw error;
    }
  };



  // Function untuk memastikan tahun baru benar-benar fresh (tanpa data dari tahun sebelumnya)
  const ensureFreshYearData = async (year: number) => {
    try {
      console.log(`PengaturanBaru: Ensuring fresh data for year ${year}`);
      
      // Pastikan tidak ada data yang tersisa dari tahun sebelumnya
      // Ini akan memastikan bahwa ketika user tidak memilih copy, data benar-benar kosong
      
      // Reset semua data untuk tahun baru
      setChecklistItems(prev => prev.filter(item => item.tahun !== year));
      setAssignments(prev => prev.filter(assignment => assignment.tahun !== year));
      
      // Reset localStorage untuk tahun baru (hapus data yang mungkin tersisa)
      const checklistData = localStorage.getItem('checklistGCG');
      if (checklistData) {
        const parsed = JSON.parse(checklistData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        // REMOVED localStorage.setItem - data goes to Supabase via ChecklistContext
      }
      
      const assignmentsData = localStorage.getItem('checklistAssignments');
      if (assignmentsData) {
        const parsed = JSON.parse(assignmentsData);
        const filtered = parsed.filter((item: any) => item.tahun !== year);
        // REMOVED localStorage.setItem - assignments should be stored in Supabase
      }
      
      // Dispatch event untuk memberitahu context lain bahwa tahun baru dibuat tanpa copy
      window.dispatchEvent(new CustomEvent('yearCreatedFresh', { 
        detail: { year, type: 'yearCreatedFresh' } 
      }));
      
      console.log(`PengaturanBaru: Fresh year ${year} data ensured`);
    } catch (error) {
      console.error(`PengaturanBaru: Error ensuring fresh data for year ${year}:`, error);
    }
  };

  // Handler untuk struktur organisasi
  const handleDirektoratSubmit = async (e: React.FormEvent) => {
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
      await addDirektorat({
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

  const handleSubdirektoratSubmit = async (e: React.FormEvent) => {
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
      await addSubdirektorat({
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
    
    if (!strukturForm.anakPerusahaan.nama) {
      toast({
        title: "Error",
        description: "Nama wajib diisi!",
        variant: "destructive"
      });
      return;
    }

    try {
      addAnakPerusahaan({
        nama: strukturForm.anakPerusahaan.nama,
        deskripsi: strukturForm.anakPerusahaan.deskripsi,
        tahun: selectedYear || new Date().getFullYear()
      });
      
      setStrukturForm(prev => ({ ...prev, anakPerusahaan: { nama: '', deskripsi: '' } }));
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



  // Fungsi-fungsi untuk editing struktur organisasi
  const openEditDirektorat = (id: number, nama: string, deskripsi: string) => {
    setEditingDirektorat({ id, nama, deskripsi });
    setStrukturForm(prev => ({
      ...prev,
      direktorat: { nama, deskripsi }
    }));
    setShowDirektoratDialog(true);
  };

  const openEditSubdirektorat = (id: number, nama: string, deskripsi: string, direktoratId: number) => {
    setEditingSubdirektorat({ id, nama, deskripsi, direktoratId });
    setStrukturForm(prev => ({
      ...prev,
      subdirektorat: { nama, direktoratId: direktoratId.toString(), deskripsi }
    }));
    setShowSubdirektoratDialog(true);
  };

  const openEditAnakPerusahaan = (id: number, nama: string, deskripsi: string) => {
    setEditingAnakPerusahaan({ id, nama, deskripsi });
    setStrukturForm(prev => ({
      ...prev,
      anakPerusahaan: { nama, deskripsi }
    }));
    setShowAnakPerusahaanDialog(true);
  };

  const openEditDivisi = (id: number, nama: string, deskripsi: string, subdirektoratId: number) => {
    setEditingDivisi({ id, nama, deskripsi, subdirektoratId });
    setStrukturForm(prev => ({
      ...prev,
      divisi: { nama, subdirektoratId: subdirektoratId.toString(), deskripsi }
    }));
    setShowDivisiDialog(true);
  };

  // Handler untuk user management
  const handleUserSubmit = async (e: React.FormEvent) => {
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
      const userData = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        direktorat: userForm.direktorat || '',
        subdirektorat: userForm.subdirektorat || '',
        divisi: userForm.divisi || '',
        whatsapp: userForm.whatsapp || '',
        tahun: selectedYear || new Date().getFullYear()
      };

      if (editingUser) {
        // For updates, we'd need a PUT endpoint - for now just show message
        toast({
          title: "Info",
          description: "Edit user belum diimplementasikan dengan Supabase sync",
          variant: "default"
        });
        return;
      } else {
        // Create new user via API
        const response = await fetch('http://localhost:5000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newUser = await response.json();
        
        // Update local state
        setUsers(prev => [...prev, newUser]);
        
        // Update localStorage for consistency
        const updatedUsers = [...users, newUser];
        // REMOVED localStorage.setItem - users should be stored in Supabase

        toast({
          title: "Berhasil!",
          description: "User baru berhasil ditambahkan dan disync ke Supabase",
        });

        console.log('PengaturanBaru: Successfully created user via API', newUser);
      }

      // Reset form and close dialog
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        direktorat: '',
        subdirektorat: '',
        divisi: '',
        whatsapp: ''
      });
      setEditingUser(null);
      setShowUserDialog(false);

    } catch (error) {
      console.error('PengaturanBaru: Error creating user:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan user ke Supabase",
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
      divisi: user.divisi || '',
      whatsapp: user.whatsapp || ''
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // Delete from Supabase via API
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // Update localStorage for consistency
      const updatedUsers = users.filter(u => u.id !== userId);
      // REMOVED localStorage.setItem - users should be stored in Supabase
      
      toast({
        title: "Berhasil!",
        description: "User berhasil dihapus dari Supabase",
      });

      console.log('PengaturanBaru: Successfully deleted user via API', userId);
    } catch (error) {
      console.error('PengaturanBaru: Error deleting user:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus user dari Supabase",
        variant: "destructive"
      });
    }
  };

  // Handler untuk generate password
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setUserForm(prev => ({ ...prev, password: newPassword }));
  };

  const handleUseDefaultUsers = () => {
    try {
      // Create empty user data - FRESH START
      const defaultUsers: User[] = [];

      setUsers(prev => [...prev, ...defaultUsers]);
      // REMOVED localStorage.setItem - users should be stored in Supabase
      
      setSetupProgress(prev => ({ ...prev, manajemenAkun: true }));
      
      toast({
        title: "Berhasil!",
        description: "User data initialized - FRESH START",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menginisialisasi user data",
        variant: "destructive"
      });
    }
  };

  // Handler untuk update super admin credentials
  const handleSuperAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Find super admin user
      const superAdminUser = users?.find(user => user.role === 'superadmin');
      if (!superAdminUser) {
        throw new Error('Super admin user not found');
      }

      // Update via database API instead of localStorage
      const response = await fetch(`http://localhost:5000/api/users/${superAdminUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: superAdminForm.email,
          password: superAdminForm.password
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json();

      // Update local state
      const updatedUsers = users?.map(user => 
        user.id === superAdminUser.id ? { 
          ...user, 
          email: superAdminForm.email, 
          password: superAdminForm.password 
        } : user
      ) || [];
      
      setUsers(updatedUsers);
      
      setShowSuperAdminDialog(false);
      
      toast({
        title: "Berhasil!",
        description: "Kredensial Super Admin berhasil diperbarui ke database",
      });

      console.log('Super admin updated via API:', updatedUser);
    } catch (error) {
      console.error('Error updating super admin:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kredensial Super Admin ke database",
        variant: "destructive"
      });
    }
  };

  // Handler untuk checklist management dengan data default 256 items
  const handleUseDefaultChecklist = async () => {
    console.log('PengaturanBaru: handleUseDefaultChecklist called');
    console.log('PengaturanBaru: useDefaultChecklistData function:', typeof useDefaultChecklistData);
    
    if (!selectedYear) {
        toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu!",
        variant: "destructive"
      });
      return;
    }

    // Konfirmasi sebelum menggunakan data default
    if (!confirm(`Apakah Anda yakin ingin menggunakan data default untuk tahun ${selectedYear}? Ini akan menambahkan ${DEFAULT_CHECKLIST_ITEMS.length} item checklist.`)) {
      return;
    }

    try {
      console.log('PengaturanBaru: About to call useDefaultChecklistData with year:', selectedYear);
      
      // Use the context's useDefaultChecklistData function (same pattern as struktur organisasi)
      await useDefaultChecklistData(selectedYear);
      
      console.log('PengaturanBaru: useDefaultChecklistData completed successfully');
      
      toast({
        title: "Berhasil",
        description: `Data default checklist telah ditambahkan untuk tahun ${selectedYear}`,
      });

      console.log('PengaturanBaru: Used default checklist data via context', {
        year: selectedYear
      });

    } catch (error) {
      console.error('PengaturanBaru: Failed to use default checklist data', error);
      toast({
        title: "Error",
        description: "Gagal menggunakan data default checklist",
        variant: "destructive"
      });
    }
  };

  // Handle menggunakan data default struktur organisasi
  const handleUseDefaultStruktur = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu!",
        variant: "destructive"
      });
      return;
    }

    // Konfirmasi sebelum menggunakan data default
    const summary = getStrukturOrganisasiSummary();
    if (!confirm(`Apakah Anda yakin ingin menggunakan data default struktur organisasi untuk tahun ${selectedYear}? Ini akan menambahkan:\n\n` +
      `• ${summary.totalDirektorat} Direktorat\n` +
      `• ${summary.totalSubdirektorat} Sub Direktorat\n` +
      `• ${summary.totalDivisi} Divisi\n` +
      `• ${summary.totalSpecialUnits} Special Units\n` +
      `• ${summary.totalRegional} Regional\n\n` +
      `Total: ${summary.totalStruktur} struktur organisasi`)) {
      return;
    }

    try {
      // Use the context's useDefaultData function which syncs to Supabase
      await useDefaultData(selectedYear);
      
      toast({
        title: "Berhasil",
        description: `Data default struktur organisasi telah ditambahkan untuk tahun ${selectedYear}`,
      });

      console.log('PengaturanBaru: Used default struktur organisasi data via context', {
        year: selectedYear
      });

    } catch (error) {
      console.error('PengaturanBaru: Failed to use default struktur organisasi data', error);
      toast({
        title: "Error",
        description: "Gagal menggunakan data default struktur organisasi",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChecklist = async (id: number) => {
    const item = checklistItems.find(item => item.id === id);
    if (!item) return;

    try {
      // Check if files exist for this row
      const rowNumber = item.rowNumber || checklistItems.indexOf(item) + 1;
      const picName = 'UNKNOWN_PIC'; // We'd need to determine this properly
      const year = selectedYear || new Date().getFullYear();

      const response = await fetch(`http://localhost:5000/api/check-row-files/${year}/${picName}/${rowNumber}`);
      const result = await response.json();

      if (result.success && result.hasFiles) {
        // Show warning dialog for rows with files
        const confirmed = window.confirm(
          `⚠️ PERINGATAN: Row ini memiliki ${result.fileCount} file yang sudah diupload.\n\n` +
          `File yang akan dihapus:\n${result.files.map((f: any) => `• ${f.name}`).join('\n')}\n\n` +
          `Apakah Anda yakin ingin menghapus row ini beserta semua filenya?\n\n` +
          `TINDAKAN INI TIDAK DAPAT DIBATALKAN!`
        );

        if (!confirmed) {
          return;
        }

        // Delete files from storage
        const deleteResponse = await fetch(`http://localhost:5000/api/delete-row-files/${year}/${picName}/${rowNumber}`, {
          method: 'DELETE'
        });
        const deleteResult = await deleteResponse.json();

        if (!deleteResult.success) {
          toast({
            title: "Error",
            description: "Gagal menghapus file dari storage",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "File Dihapus",
          description: `${deleteResult.deletedCount} file berhasil dihapus dari storage`,
        });
      }

      // Proceed with row deletion
      const updatedItems = checklistItems.filter(item => item.id !== id);
      setChecklistItems(updatedItems);
      
      // Update original items
      setOriginalChecklistItems(prev => prev.filter(item => item.id !== id));
      
      // Remove from item changes
      setItemChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Persist to localStorage
      // REMOVED localStorage.setItem - data goes to Supabase via ChecklistContext
      
      // Trigger update di ChecklistContext dengan format yang benar
      const contextData = updatedItems.map(item => ({
        id: item.id,
        aspek: item.aspek,
        deskripsi: item.deskripsi,
        tahun: item.tahun,
        rowNumber: item.rowNumber
      }));
      
      window.dispatchEvent(new CustomEvent('checklistUpdated', {
        detail: { type: 'checklistUpdated', data: contextData }
      }));
      
      // Delete from context
      deleteChecklist(id, year);
      
      toast({
        title: "Berhasil!",
        description: result.hasFiles 
          ? `Row dan ${result.fileCount} file berhasil dihapus`
          : "Checklist item berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus checklist item",
        variant: "destructive"
      });
    }
  };



  // Handle assignment checklist ke divisi atau subdirektorat
  const handleAssignment = async (checklistId: number, targetName: string, aspek: string, deskripsi: string) => {
    const year = selectedYear || new Date().getFullYear();
    
    // Jika targetName kosong, reset PIC field dan hapus assignment
    if (!targetName || targetName.trim() === '') {
      try {
        await editChecklist(checklistId, aspek, deskripsi, '', year);
        
        // Update local state
        setChecklistItems(prev => prev.map(item => 
          item.id === checklistId ? { ...item, pic: '' } : item
        ));
        
        // Remove assignment dari localStorage
        const storedAssignments = localStorage.getItem('checklistAssignments');
        if (storedAssignments) {
          try {
            const allAssignments = JSON.parse(storedAssignments);
            const filteredAssignments = allAssignments.filter((assignment: any) => 
              !(assignment.checklistId === checklistId && assignment.tahun === year)
            );
            // REMOVED localStorage.setItem - assignments should be stored in Supabase
            
            // Update local assignments state
            setAssignments(prev => prev.filter(a => a.checklistId !== checklistId));
            
            // Dispatch custom event untuk memberitahu dashboard components
            window.dispatchEvent(new CustomEvent('assignmentsUpdated', { 
              detail: { checklistId, targetName: '', year } 
            }));
          } catch (error) {
            console.error('Error removing assignment:', error);
          }
        }
        
        // Track the change for consistency
        trackItemChange(checklistId);
        
        toast({
          title: "Assignment Direset",
          description: "PIC berhasil dihapus dari checklist.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error resetting PIC:', error);
        toast({
          title: "Error",
          description: "Gagal mereset PIC. Silakan coba lagi.",
          variant: "destructive",
        });
      }
      return;
    }

    // Allow direct reassignment - no conflict check needed
    // Users can change assignments directly without resetting first

    // Save PIC assignment to backend
    try {
      await editChecklist(checklistId, aspek, deskripsi, targetName, year);
      
      // Update local state
      setChecklistItems(prev => prev.map(item => 
        item.id === checklistId ? { ...item, pic: targetName } : item
      ));
      
      // Determine assignment type and create assignment record for dashboard
      const isDivisi = divisi?.some(d => d.nama === targetName);
      const isSubdirektorat = subdirektorat?.some(s => s.nama === targetName);
      
      if (isDivisi || isSubdirektorat) {
        // Create assignment record untuk dashboard components
        const newAssignment = {
          checklistId,
          tahun: year,
          aspek,
          deskripsi,
          assignmentType: isDivisi ? 'divisi' : 'subdirektorat' as 'divisi' | 'subdirektorat',
          ...(isDivisi ? { divisi: targetName } : { subdirektorat: targetName })
        };
        
        // Update checklistAssignments localStorage
        const storedAssignments = localStorage.getItem('checklistAssignments');
        let allAssignments: any[] = [];
        
        if (storedAssignments) {
          try {
            allAssignments = JSON.parse(storedAssignments);
          } catch (error) {
            console.error('Error parsing stored assignments:', error);
            allAssignments = [];
          }
        }
        
        // Remove existing assignment for this checklist item (if any)
        allAssignments = allAssignments.filter((assignment: any) => 
          !(assignment.checklistId === checklistId && assignment.tahun === year)
        );
        
        // Add new assignment
        allAssignments.push(newAssignment);
        // REMOVED localStorage.setItem - assignments should be stored in Supabase
        
        // Update local assignments state
        setAssignments(prev => {
          const filtered = prev.filter(a => a.checklistId !== checklistId);
          return [...filtered, newAssignment];
        });
        
        // Dispatch custom event untuk memberitahu dashboard components
        window.dispatchEvent(new CustomEvent('assignmentsUpdated', { 
          detail: { checklistId, targetName, year } 
        }));
        
        console.log('Assignment saved to localStorage:', newAssignment);
      }
      
      // Track the change for consistency
      trackItemChange(checklistId);
      
      // Always dispatch event untuk dashboard update (even if no formal assignment was created)
      window.dispatchEvent(new CustomEvent('assignmentsUpdated', { 
        detail: { checklistId, targetName, year } 
      }));
      
      toast({
        title: "Assignment Berhasil",
        description: `Dokumen berhasil ditugaskan ke ${targetName}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error assigning PIC:', error);
      toast({
        title: "Error",
        description: "Gagal menugaskan dokumen. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  // Helper function untuk konversi angka ke angka romawi
  const getRomanNumeral = (num: number): string => {
    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    let remaining = num;
    
    for (const { value, numeral } of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }
    
    return result;
  };

  // Handle manajemen aspek
  const handleAddAspek = async () => {
    if (!aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Deskripsi aspek tidak boleh kosong!",
        variant: "destructive"
      });
      return;
    }

    // Generate full aspek name with prefix
    const yearAspects = await getAspectsByYear(selectedYear);
    const nextNumber = yearAspects.length + 1;
    const romanNumeral = getRomanNumeral(nextNumber);
    const fullAspekName = `ASPEK ${romanNumeral}. ${aspekForm.nama.trim()}`;

    // Check if aspek already exists for the selected year
    const existingAspek = yearAspects.find(aspek => 
      aspek.nama.toLowerCase() === fullAspekName.toLowerCase()
    );
    
    if (existingAspek) {
      toast({
        title: "Error",
        description: "Aspek sudah ada untuk tahun ini!",
        variant: "destructive"
      });
      return;
    }

    // Add new aspek using context with full name
    try {
      await addAspek(fullAspekName, selectedYear);
      
      // Refresh aspects after successful add
      const updatedAspects = await getAspectsByYear(selectedYear);
      setCurrentYearAspects(updatedAspects);
      
      // Reset form
      setAspekForm({ nama: '' });
      
      toast({
        title: "Berhasil!",
        description: `Aspek "${fullAspekName}" berhasil ditambahkan`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal menambah aspek: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleEditAspek = async () => {
    if (!editingAspek || !aspekForm.nama.trim()) {
      toast({
        title: "Error",
        description: "Deskripsi aspek tidak boleh kosong!",
        variant: "destructive"
      });
      return;
    }

    // Extract the current aspek number from the existing aspek name
    const currentAspekName = editingAspek.nama;
    const aspekNumberMatch = currentAspekName.match(/^ASPEK\s+([IVX]+)\.\s+/);
    
    if (!aspekNumberMatch) {
      toast({
        title: "Error",
        description: "Format aspek tidak valid untuk diedit!",
        variant: "destructive"
      });
      return;
    }

    const romanNumeral = aspekNumberMatch[1];
    const fullAspekName = `ASPEK ${romanNumeral}. ${aspekForm.nama.trim()}`;

    // Check if the new name conflicts with existing aspek
    const yearAspects = await getAspectsByYear(selectedYear);
    const existingAspek = yearAspects.find(aspek => 
      aspek.id !== editingAspek.id && 
      aspek.nama.toLowerCase() === fullAspekName.toLowerCase()
    );
    
    if (existingAspek) {
      toast({
        title: "Error",
        description: "Nama aspek sudah ada untuk tahun ini!",
        variant: "destructive"
      });
      return;
    }

    // Update aspek using context with full name
    editAspek(editingAspek.id, fullAspekName, selectedYear);

    // Refresh aspects after successful edit
    try {
      const updatedAspects = await getAspectsByYear(selectedYear);
      setCurrentYearAspects(updatedAspects);
    } catch (error) {
      console.error('Error refreshing aspects after edit:', error);
    }

    // Reset form and close edit mode
    setAspekForm({ nama: '' });
    setEditingAspek(null);
    
    toast({
      title: "Berhasil!",
      description: `Aspek berhasil diperbarui menjadi "${fullAspekName}"`,
    });
  };

  const handleDeleteAspek = async (aspekId: number) => {
    // Delete aspek using context
    deleteAspek(aspekId, selectedYear);
    
    // Refresh aspects after successful delete
    try {
      const updatedAspects = await getAspectsByYear(selectedYear);
      setCurrentYearAspects(updatedAspects);
    } catch (error) {
      console.error('Error refreshing aspects after delete:', error);
    }
    
    toast({
      title: "Berhasil!",
      description: "Aspek berhasil dihapus",
    });
  };

  const openEditAspek = (aspekId: number, aspekName: string) => {
    setEditingAspek({ id: aspekId, nama: aspekName });
    
    // Extract only the description part (without "ASPEK X." prefix)
    const descriptionMatch = aspekName.match(/^ASPEK\s+[IVX]+\.\s+(.+)$/);
    const description = descriptionMatch ? descriptionMatch[1] : aspekName;
    
    setAspekForm({ nama: description });
  };

  // Handle save changes
  const handleSaveChanges = () => {
    try {
      // Update original data
      setOriginalChecklistItems([...checklistItems]);
      setHasUnsavedChanges(false);
      
      // Sync data dengan context menggunakan helper function
      syncDataWithContext(checklistItems);
      
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

  // Handle delete year
  const handleDeleteYear = (year: number) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tahun ${year}?`)) {
      removeYear(year);
      toast({
        title: "Berhasil!",
        description: `Tahun ${year} berhasil dihapus!`,
      });
    }
  };

  // Handle bulk delete confirmation
  const handleBulkDelete = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Pilih tahun terlebih dahulu!",
        variant: "destructive"
      });
      return;
    }

    setIsBulkDeleting(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/bulk-delete/${selectedYear}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete year data');
      }

      const result = await response.json();
      
      // Remove year from available years
      removeYear(selectedYear);
      
      // Clear all local state for the deleted year
      setChecklistItems([]);
      setOriginalChecklistItems([]);
      setAssignments([]);
      setCurrentYearAspects([]);
      setHasUnsavedChanges(false);
      setItemChanges(new Set());
      
      // Close dialog
      setShowBulkDeleteDialog(false);
      
      // Show success message with summary
      toast({
        title: "Data berhasil dihapus!",
        description: `Semua data untuk tahun ${selectedYear} telah dihapus secara permanen.`,
      });
      
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle save individual item
  const handleSaveItem = async (itemId: number) => {
    try {
      const currentItem = checklistItems.find(item => item.id === itemId);
      if (!currentItem) return;
      
      const year = selectedYear || new Date().getFullYear();
      
      // Check if this is a new item or existing item
      if (newItems.has(itemId)) {
        // NEW ITEM: Call addChecklist to create in backend
        await addChecklist(
          currentItem.aspek || '', 
          currentItem.deskripsi || '', 
          currentItem.pic || '',
          year
        );
        
        // Remove from newItems since it's now saved to backend
        setNewItems(prev => {
          const updated = new Set(prev);
          updated.delete(itemId);
          return updated;
        });
      } else {
        // EXISTING ITEM: Call editChecklist to update in backend
        await editChecklist(
          currentItem.id, 
          currentItem.aspek || '', 
          currentItem.deskripsi || '', 
          currentItem.pic || '',
          year
        );
      }
      
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
      
      // Sync data dengan context menggunakan helper function
      syncDataWithContext(checklistItems);
      
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
  
  // Helper function untuk sync data dengan ChecklistContext
  const syncDataWithContext = (data: ChecklistItem[]) => {
    // Simpan ke localStorage
    // REMOVED localStorage.setItem - data goes to Supabase via ChecklistContext
    
    // Format data untuk context
    const contextData = data.map(item => ({
      id: item.id,
      aspek: item.aspek,
      deskripsi: item.deskripsi,
      pic: item.pic,
      tahun: item.tahun
    }));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: contextData }
    }));
    
    console.log('PengaturanBaru: Synced data with context', {
      originalCount: data.length,
      contextCount: contextData.length,
      year: selectedYear
    });
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

          {/* Progress Stepper */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Setup Progress</span>
              </CardTitle>
              <CardDescription>
                {overallProgress} dari {totalSteps} tahap telah selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {/* Step 1: Tahun Buku */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    setupProgress.tahunBuku 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {setupProgress.tahunBuku ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">1</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600">Tahun Buku</span>
                </div>

                {/* Line 1 */}
                <div className={`flex-1 h-0.5 mx-2 ${
                  setupProgress.tahunBuku ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 2: Struktur Organisasi */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    setupProgress.strukturOrganisasi 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {setupProgress.strukturOrganisasi ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">2</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600">Struktur</span>
                </div>

                {/* Line 2 */}
                <div className={`flex-1 h-0.5 mx-2 ${
                  setupProgress.strukturOrganisasi ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 3: Manajemen Akun */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    setupProgress.manajemenAkun 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {setupProgress.manajemenAkun ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">3</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600">Akun</span>
                </div>

                {/* Line 3 */}
                <div className={`flex-1 h-0.5 mx-2 ${
                  setupProgress.kelolaDokumen ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 4: Kelola Dokumen */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    setupProgress.kelolaDokumen 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {setupProgress.kelolaDokumen ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">4</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600">Dokumen</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Tabs */}
          <Tabs 
            defaultValue="tahun-buku" 
            className="space-y-6"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-4 gap-2 p-1 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm">
              <TabsTrigger 
                value="tahun-buku" 
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 
                          data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 
                          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                          hover:bg-gradient-to-r hover:from-orange-100 hover:to-orange-200 hover:text-orange-700 hover:shadow-md hover:scale-102 cursor-pointer
                          bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 border border-orange-200
                          data-[state=active]:border-orange-300"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Tahun Buku</span>
                {setupProgress.tahunBuku && <CheckCircle className="w-4 h-4 text-green-500" />}
              </TabsTrigger>
              <TabsTrigger 
                value="struktur-organisasi" 
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300
                          data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 
                          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                          hover:bg-gradient-to-r hover:from-emerald-100 hover:to-emerald-200 hover:text-emerald-700 hover:shadow-md hover:scale-102 cursor-pointer
                          bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-200
                          data-[state=active]:border-emerald-300"
              >
                <Building2 className="w-4 h-4" />
                <span className="font-semibold">Struktur Organisasi</span>
                {setupProgress.strukturOrganisasi && <CheckCircle className="w-4 h-4 text-green-500" />}
              </TabsTrigger>
              <TabsTrigger 
                value="manajemen-akun" 
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300
                          data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
                          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                          hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:text-blue-700 hover:shadow-md hover:scale-102 cursor-pointer
                          bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200
                          data-[state=active]:border-blue-300"
              >
                <Users className="w-4 h-4" />
                <span className="font-semibold">Manajemen Akun</span>
                {setupProgress.manajemenAkun && <CheckCircle className="w-4 h-4 text-green-500" />}
              </TabsTrigger>
              <TabsTrigger 
                value="kelola-dokumen" 
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300
                          data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 
                          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                          hover:bg-gradient-to-r hover:from-purple-100 hover:to-purple-200 hover:text-purple-700 hover:shadow-md hover:scale-102 cursor-pointer
                          bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 border border-purple-200
                          data-[state=active]:border-purple-300"
              >
                <FileText className="w-4 h-4" />
                <span className="font-semibold">Kelola Dokumen</span>
                {setupProgress.kelolaDokumen && <CheckCircle className="w-4 h-4 text-green-500" />}
              </TabsTrigger>
            </TabsList>

            {/* Tahun Buku Tab */}
            <TabsContent value="tahun-buku">
              <div className="space-y-6">
                {/* Header */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 via-blue-25 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">Kelola Tahun Buku</h2>
                      <p className="text-blue-700 text-sm">
                        Tambah atau hapus tahun buku untuk sistem GCG
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {selectedYear && (
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full border border-blue-300 shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm font-semibold text-blue-800">
                          Tahun Aktif: {selectedYear}
                        </span>
                      </div>
                    )}
                    
                    {selectedYear && (
                      <Button
                        onClick={() => setShowBulkDeleteDialog(true)}
                        variant="destructive"
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                 text-white shadow-md hover:shadow-lg transition-all duration-200 
                                 border-0 px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Hapus Semua Data Tahun {selectedYear}
                      </Button>
                    )}
                  </div>
                  {!selectedYear && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full border border-yellow-300 shadow-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm font-semibold text-yellow-800">
                        Status: Belum ada tahun yang dipilih
                      </span>
                    </div>
                  )}
                </div>

                {/* Tahun Table */}
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-3 text-xl">
                          <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-800">Daftar Tahun Buku</span>
                        </CardTitle>
                        <CardDescription className="text-base mt-2 text-gray-600">
                          <span className="font-semibold text-blue-600">{availableYears?.length || 0}</span> tahun buku tersedia dalam sistem
                        </CardDescription>
                      </div>
                      <div className="flex gap-3">
                        {availableYears && availableYears.length > 0 && (
                          <Select value={selectedYear?.toString() || ''} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Pilih Tahun Aktif" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableYears.sort((a, b) => b - a).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Dialog open={showTahunDialog} onOpenChange={setShowTahunDialog}>
                          <DialogTrigger asChild>
                            <ActionButton
                              variant="default"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setShowTahunDialog(true)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                                       text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0
                                       px-6 py-2.5 rounded-lg font-semibold"
                            >
                              Tambah Tahun
                            </ActionButton>
                          </DialogTrigger>
                          <DialogContent className="bg-white border border-blue-200 shadow-xl">
                            <DialogHeader>
                              <DialogTitle className="text-blue-900">Tambah Tahun Buku Baru</DialogTitle>
                              <DialogDescription className="text-blue-700">
                                Masukkan tahun buku yang akan ditambahkan ke sistem
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleTahunSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="year" className="text-blue-800 font-medium">Tahun Buku</Label>
                                <Input
                                  id="year"
                                  type="number"
                                  min="2020"
                                  max="2030"
                                  value={tahunForm.tahun || ''}
                                  onChange={(e) => setTahunForm({ ...tahunForm, tahun: parseInt(e.target.value) })}
                                  placeholder="Contoh: 2025"
                                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button type="submit" variant="default" className="bg-blue-600 hover:bg-blue-700">
                                  Tambah Tahun
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Tahun Buku</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableYears?.sort((a, b) => b - a).map((year, index) => (
                          <TableRow key={year}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{year}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Aktif
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDeleteYear(year)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Empty State */}
                {(!availableYears || availableYears.length === 0) && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tahun buku</h3>
                    <p className="text-gray-500">
                      Mulai dengan menambahkan tahun buku pertama ke sistem
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

                         {/* Struktur Organisasi Tab */}
             <TabsContent value="struktur-organisasi">
               <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                 <CardHeader className="pb-4">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                       <Building2 className="w-7 h-7 text-blue-600" />
                     </div>
                     <div>
                       <CardTitle className="text-2xl font-bold text-blue-900">Setup Struktur Organisasi</CardTitle>
                       <CardDescription className="text-base text-blue-700">
                         Setup struktur organisasi untuk sistem GCG. Bisa diakses meskipun belum ada tahun buku yang dipilih.
                       </CardDescription>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     {selectedYear && (
                       <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full border border-blue-300 shadow-sm">
                         <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                         <span className="text-sm font-semibold text-blue-800">
                           Tahun Aktif: {selectedYear}
                         </span>
                       </div>
                     )}
                     
                     {selectedYear && (
                       <Button
                         onClick={() => setShowBulkDeleteDialog(true)}
                         variant="destructive"
                         size="sm"
                         className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                  text-white shadow-md hover:shadow-lg transition-all duration-200 
                                  border-0 px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                       >
                         <AlertTriangle className="w-4 h-4" />
                         Hapus Semua Data Tahun {selectedYear}
                       </Button>
                     )}
                   </div>
                   {!selectedYear && (
                     <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full border border-yellow-300 shadow-sm">
                       <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                       <span className="text-sm font-semibold text-yellow-800">
                         Status: Belum ada tahun yang dipilih - data akan disimpan untuk tahun default
                       </span>
                     </div>
                   )}
                 </CardHeader>
                 <CardContent className="space-y-6">
                   {/* Quick Actions */}
                   <div className="flex flex-wrap gap-3">
                     <Button 
                       onClick={() => setShowDirektoratDialog(true)}
                       className="bg-blue-600 hover:bg-blue-700"
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
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Anak Perusahaan
                     </Button>
                     <Button 
                       onClick={() => setShowDivisiDialog(true)}
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah Divisi
                     </Button>
                     <Button 
                       onClick={handleUseDefaultStruktur}
                       variant="outline"
                       className="border-blue-600 text-blue-600 hover:bg-blue-50"
                     >
                       <Copy className="w-4 h-4 mr-2" />
                       Gunakan Data Default
                     </Button>
                   </div>

                                       {/* Data Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{direktorat && direktorat.length || 0}</div>
                        <div className="text-sm text-blue-600">Direktorat</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{subdirektorat && subdirektorat.length || 0}</div>
                        <div className="text-sm text-blue-600">Subdirektorat</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{anakPerusahaan && anakPerusahaan.length || 0}</div>
                        <div className="text-sm text-blue-600">Anak Perusahaan</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{divisi && divisi.length || 0}</div>
                        <div className="text-sm text-blue-600">Divisi</div>
                      </div>
                    </div>

                                       {/* Struktur Organisasi Tables - Layout Sejajar */}
                    <div className="space-y-6">
                     {/* Direktorat Section */}
                     <Card className="border border-blue-200 bg-blue-50/30">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                         <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                         Direktorat
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-gray-50">
                             <TableHead className="text-gray-700 font-medium w-1/5">Nama</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Parent</TableHead>
                             <TableHead className="text-gray-700 font-medium w-2/5">Deskripsi</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Tahun</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Aksi</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {direktorat && direktorat.length > 0 ? direktorat.map((item) => (
                             <TableRow key={item.id} className="hover:bg-blue-50/50 py-4">
                               <TableCell className="font-medium py-4">{item.nama}</TableCell>
                               <TableCell className="py-4">
                                 <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">Tingkat Atas</Badge>
                               </TableCell>
                               <TableCell className="py-4">{item.deskripsi}</TableCell>
                               <TableCell className="py-4">{item.tahun}</TableCell>
                               <TableCell className="py-4">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => openEditDirektorat(item.id, item.nama, item.deskripsi)}
                                     className="text-blue-600 hover:text-blue-700"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteDirektorat(item.id)}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
                               </TableCell>
                             </TableRow>
                           )) : (
                             <TableRow>
                               <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                 Belum ada data direktorat untuk tahun {selectedYear}
                               </TableCell>
                             </TableRow>
                           )}
                         </TableBody>
                       </Table>
                     </CardContent>
                   </Card>

                   {/* Subdirektorat Section */}
                   <Card className="border border-blue-200 bg-blue-50/30">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                         <Users className="w-5 h-5 text-blue-600 mr-2" />
                         Subdirektorat
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-gray-50">
                             <TableHead className="text-gray-700 font-medium w-1/5">Nama</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Parent</TableHead>
                             <TableHead className="text-gray-700 font-medium w-2/5">Deskripsi</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Tahun</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Aksi</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {subdirektorat && subdirektorat.length > 0 ? subdirektorat.map((item) => {
                             const parentDirektorat = direktorat && direktorat.find(d => d.id === item.direktoratId);
                             return (
                               <TableRow key={item.id} className="hover:bg-blue-50/50 py-4">
                                 <TableCell className="font-medium py-4">{item.nama}</TableCell>
                                 <TableCell className="py-4">
                                   <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{parentDirektorat ? parentDirektorat.nama : 'N/A'}</Badge>
                                 </TableCell>
                                 <TableCell className="py-4">{item.deskripsi}</TableCell>
                                 <TableCell className="py-4">{item.tahun}</TableCell>
                                                                <TableCell className="py-4">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => openEditSubdirektorat(item.id, item.nama, item.deskripsi, item.direktoratId)}
                                     className="text-blue-600 hover:text-blue-700"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteSubdirektorat(item.id)}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
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
                     </CardContent>
                   </Card>

                   {/* Anak Perusahaan Section */}
                   <Card className="border border-blue-200 bg-blue-50/30">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                         <Building className="w-5 h-5 text-blue-600 mr-2" />
                         Anak Perusahaan & Badan Afiliasi
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-gray-50">
                             <TableHead className="text-gray-700 font-medium w-1/5">Nama</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Parent</TableHead>
                             <TableHead className="text-gray-700 font-medium w-2/5">Deskripsi</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Tahun</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Aksi</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {anakPerusahaan && anakPerusahaan.length > 0 ? anakPerusahaan.map((item) => (
                             <TableRow key={item.id} className="hover:bg-blue-50/50 py-4">
                               <TableCell className="font-medium py-4">{item.nama}</TableCell>
                               <TableCell className="py-4">
                                 <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">Mandiri</Badge>
                               </TableCell>
                               <TableCell className="py-4">{item.deskripsi}</TableCell>
                               <TableCell className="py-4">{item.tahun}</TableCell>
                               <TableCell className="py-4">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => openEditAnakPerusahaan(item.id, item.nama, item.deskripsi)}
                                     className="text-blue-600 hover:text-blue-700"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteAnakPerusahaan(item.id)}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
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
                     </CardContent>
                   </Card>

                   {/* Divisi Section */}
                   <Card className="border border-blue-200 bg-blue-50/30">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                         <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                         Divisi
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-gray-50">
                             <TableHead className="text-gray-700 font-medium w-1/5">Nama</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Parent</TableHead>
                             <TableHead className="text-gray-700 font-medium w-2/5">Deskripsi</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Tahun</TableHead>
                             <TableHead className="text-gray-700 font-medium w-1/5">Aksi</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {divisi && divisi.length > 0 ? divisi.map((item) => {
                             const parentSubdirektorat = subdirektorat && subdirektorat.find(s => s.id === item.subdirektoratId);
                             return (
                               <TableRow key={item.id} className="hover:bg-blue-50/50 py-4">
                                 <TableCell className="font-medium py-4">{item.nama}</TableCell>
                                 <TableCell className="py-4">
                                   <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{parentSubdirektorat ? parentSubdirektorat.nama : 'N/A'}</Badge>
                                 </TableCell>
                                 <TableCell className="py-4">{item.deskripsi}</TableCell>
                                 <TableCell className="py-4">{item.tahun}</TableCell>
                                                                <TableCell className="py-4">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => openEditDivisi(item.id, item.nama, item.deskripsi, item.subdirektoratId)}
                                     className="text-blue-600 hover:text-blue-700"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteDivisi(item.id)}
                                     className="text-red-600 hover:text-red-700"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
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
                     </CardContent>
                   </Card>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

                         {/* Manajemen Akun Tab */}
             <TabsContent value="manajemen-akun">
               <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                 <CardHeader className="pb-4">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                       <Users className="w-7 h-7 text-blue-600" />
                     </div>
                     <div>
                       <CardTitle className="text-2xl font-bold text-blue-900">Setup Manajemen Akun</CardTitle>
                       <CardDescription className="text-base text-blue-700">
                         Setup akun untuk sistem GCG dengan role dan struktur organisasi. Bisa diakses meskipun belum ada tahun buku yang dipilih.
                       </CardDescription>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     {selectedYear && (
                       <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full border border-blue-300 shadow-sm">
                         <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                         <span className="text-sm font-semibold text-blue-800">
                           Tahun Aktif: {selectedYear}
                         </span>
                       </div>
                     )}
                     
                     {selectedYear && (
                       <Button
                         onClick={() => setShowBulkDeleteDialog(true)}
                         variant="destructive"
                         size="sm"
                         className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                  text-white shadow-md hover:shadow-lg transition-all duration-200 
                                  border-0 px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                       >
                         <AlertTriangle className="w-4 h-4" />
                         Hapus Semua Data Tahun {selectedYear}
                       </Button>
                     )}
                   </div>
                   {!selectedYear && (
                     <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full border border-yellow-300 shadow-sm">
                       <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                       <span className="text-sm font-semibold text-yellow-800">
                         Status: Belum ada tahun yang dipilih - data akan disimpan untuk tahun default
                       </span>
                     </div>
                   )}
                 </CardHeader>
                 <CardContent className="space-y-6">
                   {/* Quick Actions */}
                   <div className="flex flex-wrap gap-3">
                     <Button 
                       onClick={() => setShowUserDialog(true)}
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Tambah PIC Baru
                     </Button>
                     <Button 
                       onClick={handleUseDefaultUsers}
                       variant="outline"
                       className="border-blue-600 text-blue-600 hover:bg-blue-50"
                     >
                       <Copy className="w-4 h-4 mr-2" />
                       Gunakan Data Default
                     </Button>
                     <Button 
                       onClick={() => setShowSuperAdminDialog(true)}
                       variant="outline"
                       className="border-orange-600 text-orange-600 hover:bg-orange-50"
                     >
                       <Settings className="w-4 h-4 mr-2" />
                       Edit Super Admin
                     </Button>
                   </div>

                   {/* Data Overview */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">
                         {users && users.filter(u => selectedYear ? u.tahun === selectedYear : true).length || 0}
                       </div>
                       <div className="text-sm text-blue-600">Total Users</div>
                     </div>
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">
                         {users && users.filter(u => selectedYear ? u.tahun === selectedYear && u.role === 'admin' : u.role === 'admin').length || 0}
                       </div>
                       <div className="text-sm text-blue-600">Admin</div>
                     </div>

                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">
                         {users && users.filter(u => selectedYear ? u.tahun === selectedYear && u.role === 'superadmin' : u.role === 'superadmin').length || 0}
                       </div>
                       <div className="text-sm text-blue-600">Super Admin</div>
                     </div>
                   </div>

                   {/* Users Table */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Daftar User</h3>
                     <Table>
                       <TableHeader>
                         <TableRow className="bg-gray-50">
                           <TableHead className="text-gray-700 font-medium">Nama</TableHead>
                           <TableHead className="text-gray-700 font-medium">Email</TableHead>
                           <TableHead className="text-gray-700 font-medium">Role</TableHead>
                           <TableHead className="text-gray-700 font-medium">Direktorat</TableHead>
                           <TableHead className="text-gray-700 font-medium">Subdirektorat</TableHead>
                           <TableHead className="text-gray-700 font-medium">Divisi</TableHead>
                           <TableHead className="text-gray-700 font-medium">WhatsApp</TableHead>
                           <TableHead className="text-gray-700 font-medium">Tahun</TableHead>
                           <TableHead className="text-gray-700 font-medium">Aksi</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {users && users.filter(u => selectedYear ? u.tahun === selectedYear : true).length > 0 ? 
                           users.filter(u => selectedYear ? u.tahun === selectedYear : true).map((item) => (
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
                                 {item.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                               </Badge>
                             </TableCell>
                             <TableCell>{item.direktorat || 'N/A'}</TableCell>
                             <TableCell>{item.subdirektorat || 'N/A'}</TableCell>
                             <TableCell>{item.divisi || 'N/A'}</TableCell>
                             <TableCell>{item.whatsapp || 'N/A'}</TableCell>
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
                             <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                               {selectedYear ? `Belum ada data user untuk tahun ${selectedYear}` : 'Belum ada data user dalam sistem'}
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
               <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                 <CardHeader className="pb-4">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                       <FileText className="w-7 h-7 text-blue-600" />
                     </div>
                     <div>
                       <CardTitle className="text-2xl font-bold text-blue-900">Setup Kelola Dokumen GCG</CardTitle>
                       <CardDescription className="text-base text-blue-700">
                         Setup dokumen GCG dan aspek untuk tahun buku baru dengan tabel inline editing
                       </CardDescription>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     {selectedYear && (
                       <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full border border-blue-300 shadow-sm">
                         <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                         <span className="text-sm font-semibold text-blue-800">
                           Tahun Aktif: {selectedYear}
                         </span>
                       </div>
                     )}
                     
                     {selectedYear && (
                       <Button
                         onClick={() => setShowBulkDeleteDialog(true)}
                         variant="destructive"
                         size="sm"
                         className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                  text-white shadow-md hover:shadow-lg transition-all duration-200 
                                  border-0 px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                       >
                         <AlertTriangle className="w-4 h-4" />
                         Hapus Semua Data Tahun {selectedYear}
                       </Button>
                     )}
                   </div>
                   {!selectedYear && (
                     <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full border border-yellow-300 shadow-sm">
                       <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                       <span className="text-sm font-semibold text-yellow-800">
                         Status: Belum ada tahun yang dipilih - data akan disimpan untuk tahun default
                       </span>
                     </div>
                   )}
                 </CardHeader>
                 <CardContent className="space-y-6">
                                                           {/* Quick Actions */}
                     <div className="flex flex-wrap gap-3 items-center justify-between">
                       <div className="flex flex-wrap gap-3">
                       <Button 
                         onClick={() => {
                           const currentYear = selectedYear || new Date().getFullYear();
                           const nextRowNumber = Math.max(...checklistItems.filter(item => item.tahun === currentYear).map(item => item.rowNumber || 0), 0) + 1;
                           const newItem: ChecklistItem = {
                             id: generateChecklistId(currentYear, nextRowNumber),
                             aspek: '',
                             deskripsi: '',
                             status: 'pending',
                             catatan: '',
                             tahun: currentYear,
                             rowNumber: nextRowNumber
                           };
                           setChecklistItems(prev => [...prev, newItem]);
                           setNewItems(prev => new Set(prev).add(newItem.id));
                           
                           // Auto-scroll ke item baru setelah state update
                           setTimeout(() => {
                             if (newItemRef.current) {
                               newItemRef.current.scrollIntoView({ 
                                 behavior: 'smooth', 
                                 block: 'center' 
                               });
                             }
                           }, 100);
                           
                           // Remove highlight after 5 seconds
                           setTimeout(() => {
                             setNewItems(prev => {
                               const updated = new Set(prev);
                               updated.delete(newItem.id);
                               return updated;
                             });
                           }, 5000);
                         }}
                         className="bg-blue-600 hover:bg-blue-700"
                       >
                         <Plus className="w-4 h-4 mr-2" />
                         Tambah Item Baru
                       </Button>
                                               <Button 
                          onClick={() => setShowAspekManagementPanel(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Kelola Aspek
                        </Button>
                       {!showDefaultDataButton ? (
                         <Button 
                           onClick={() => setShowDefaultDataButton(true)}
                           variant="outline"
                           className="border-blue-600 text-blue-600 hover:bg-blue-50"
                         >
                           <Eye className="w-4 h-4 mr-2" />
                           Tampilkan Data Default
                         </Button>
                       ) : (
                         <div className="flex gap-2">
                         <Button 
                           onClick={handleUseDefaultChecklist}
                           variant="outline"
                           className="border-blue-600 text-blue-600 hover:bg-blue-700"
                         >
                           <Copy className="w-4 h-4 mr-2" />
                             Gunakan Data Default (256 Items)
                         </Button>
                           
                           <Button
                             onClick={handleUseDefaultStruktur}
                             variant="outline"
                             className="border-green-600 text-green-600 hover:bg-green-700"
                           >
                             <Copy className="w-4 h-4 mr-2" />
                             Gunakan Data Default Struktur Organisasi
                           </Button>
                         </div>
                       )}


                       </div>
                     </div>

                   {/* Data Overview */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">{checklistItems && checklistItems.length || 0}</div>
                       <div className="text-sm text-blue-600">Total Item</div>
                     </div>
                     
                     {/* Assignment Overview */}
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="text-2xl font-bold text-blue-600">
                         {(() => {
                           const yearAssignments = assignments?.filter(a => a.tahun === selectedYear) || [];
                           // Filter assignments berdasarkan assignment type
                           const validAssignments = yearAssignments.filter(a => {
                             if (assignmentType === 'divisi') {
                               return a.divisi && 
                                      a.divisi.trim() !== '' && 
                                      a.divisi !== 'undefined' && 
                                      a.divisi !== 'null';
                             } else {
                               return a.subdirektorat && 
                                      a.subdirektorat.trim() !== '' && 
                                      a.subdirektorat !== 'undefined' && 
                                      a.subdirektorat !== 'null';
                             }
                           });
                           
                           const uniqueTargets = [...new Set(validAssignments.map(a => {
                             return assignmentType === 'divisi' ? a.divisi.trim() : a.subdirektorat.trim();
                           }))];
                           return uniqueTargets.length;
                         })()}
                       </div>
                       <div className="text-sm text-blue-600">
                         {assignmentType === 'divisi' ? 'Divisi Aktif' : 'Subdirektorat Aktif'}
                       </div>
                     </div>
                   </div>

                   {/* Assignment Breakdown */}
                   {(() => {
                     const yearAssignments = assignments?.filter(a => a.tahun === selectedYear) || [];
                     
                     // Jika tidak ada assignments untuk tahun ini, jangan tampilkan breakdown
                     if (yearAssignments.length === 0) {
                       return null;
                     }
                     
                     // Filter hanya assignments dengan target valid berdasarkan assignment type
                     const validAssignments = yearAssignments.filter(a => {
                       if (assignmentType === 'divisi') {
                         return a.divisi && 
                                a.divisi.trim() !== '' && 
                                a.divisi !== 'undefined' && 
                                a.divisi !== 'null';
                       } else {
                         return a.subdirektorat && 
                                a.subdirektorat.trim() !== '' && 
                                a.subdirektorat !== 'undefined' && 
                                a.subdirektorat !== 'null';
                       }
                     });
                     
                     // Jika tidak ada valid assignments, jangan tampilkan breakdown
                     if (validAssignments.length === 0) {
                       return null;
                     }
                     
                     const targetCounts = validAssignments.reduce((acc, assignment) => {
                       const target = assignmentType === 'divisi' 
                         ? assignment.divisi?.trim() 
                         : assignment.subdirektorat?.trim();
                       if (target) {
                         acc[target] = (acc[target] || 0) + 1;
                       }
                       return acc;
                     }, {} as Record<string, number>);
                     
                     const sortedTargets = Object.entries(targetCounts)
                       .filter(([target]) => target && target.trim() !== '') // Extra safety filter
                       .sort(([,a], [,b]) => b - a);
                     
                     return sortedTargets.length > 0 ? (
                       <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                         <h4 className="font-semibold text-blue-800 mb-3">
                           Breakdown Penugasan {assignmentType === 'divisi' ? 'Divisi' : 'Subdirektorat'}
                         </h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                           {sortedTargets.map(([target, count]) => (
                             <div key={target} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                               <span className="text-sm font-medium text-blue-700 text-left flex-1 mr-2" title={target}>
                                 {target}
                               </span>
                               <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                                 {count} tugas
                               </Badge>
                             </div>
                           ))}
                         </div>
                       </div>
                     ) : null;
                   })()}



                                                           {/* Checklist Items Table with Enhanced Design */}
                    <div ref={checklistTableRef}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Dokumen GCG Checklist</h3>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">Tipe Penugasan:</label>
                          <Select value={assignmentType} onValueChange={setAssignmentType}>
                            <SelectTrigger className="w-48 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="divisi">Divisi</SelectItem>
                              <SelectItem value="subdirektorat">Subdirektorat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-blue-100 shadow-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-gray-700 font-medium w-20 text-center">No</TableHead>
                              <TableHead className="text-gray-700 font-medium w-64 text-center">Aspek (Opsional)</TableHead>
                              <TableHead className="text-gray-700 font-medium w-80 text-center">Deskripsi</TableHead>
                              <TableHead className="text-gray-700 font-medium w-64 text-center">Tugaskan Ke</TableHead>
                              <TableHead className="text-gray-700 font-medium w-40 text-center">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {checklistItems && checklistItems.length > 0 ? checklistItems.map((item, index) => (
                              <TableRow 
                                key={item.id} 
                                ref={newItems.has(item.id) ? newItemRef : null}
                                className={`transition-all duration-200 border-b border-gray-100 ${
                                  newItems.has(item.id) 
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-md' 
                                    : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100'
                                }`}
                              >
                                <TableCell className="font-bold text-gray-700 text-center bg-gray-50">
                                  <div className="flex items-center justify-center gap-2">
                                    {item.rowNumber || (index + 1)}
                                    {newItems.has(item.id) && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                                        NEW
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.aspek || 'none'}
                                    onValueChange={(value) => {
                                      const newValue = value === 'none' ? '' : value;
                                      setChecklistItems(prev => prev.map(i => 
                                        i.id === item.id ? { ...i, aspek: newValue } : i
                                      ));
                                      trackItemChange(item.id);
                                    }}
                                  >
                                    <SelectTrigger className="w-44 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors">
                                      <SelectValue placeholder="Pilih Aspek (Opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Tidak Ada Aspek</SelectItem>
                                      {currentYearAspects.map((aspek) => (
                                        <SelectItem key={aspek.id} value={aspek.nama}>
                                          {aspek.nama}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Textarea
                                    value={item.deskripsi || ''}
                                    placeholder="Masukkan deskripsi dokumen GCG..."
                                    className="min-h-[80px] resize-none border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 transition-colors rounded-md"
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      setChecklistItems(prev => prev.map(i => 
                                        i.id === item.id ? { ...i, deskripsi: newValue } : i
                                      ));
                                      trackItemChange(item.id);
                                    }}
                                    onBlur={() => {
                                      // Hanya track changes saat user selesai mengetik
                                      if (hasItemChanges(item.id)) {
                                        console.log('PengaturanBaru: User finished typing for item', item.id);
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <AssignmentDropdown 
                                    item={item}
                                    onAssign={handleAssignment}
                                    isSuperAdmin={currentUser?.role === 'superadmin'}
                                    assignmentType={assignmentType}
                                    assignments={assignments}
                                    selectedYear={selectedYear}
                                    currentAssignmentLabel={item.pic || null}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {/* Save Button - Only show when item has changes */}
                                    {hasItemChanges(item.id) && (
                                      <Button
                                        variant="ghost"
                                        size="default"
                                        onClick={() => handleSaveItem(item.id)}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="Simpan perubahan"
                                      >
                                        <CheckCircle className="w-6 h-6" />
                                      </Button>
                                    )}
                                    
                                    {/* Cancel Button - Only show when item has changes */}
                                    {hasItemChanges(item.id) && (
                                      <Button
                                        variant="ghost"
                                        size="default"
                                        onClick={() => handleCancelItemChanges(item.id)}
                                        className="text-orange-600 hover:text-orange-700"
                                        title="Batal perubahan"
                                      >
                                        <X className="w-6 h-6" />
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

            {/* Floating Actions - Only show on Kelola Dokumen tab */}
            {activeTab === 'kelola-dokumen' && (
              <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
                {/* Tambah Item Baru floating - Icon only */}
                <Button
                  onClick={() => {
                    const currentYear = selectedYear || new Date().getFullYear();
                    const nextRowNumber = Math.max(...checklistItems.filter(item => item.tahun === currentYear).map(item => item.rowNumber || 0), 0) + 1;
                    const newItem: ChecklistItem = {
                      id: generateChecklistId(currentYear, nextRowNumber),
                      aspek: '',
                      deskripsi: '',
                      status: 'pending',
                      catatan: '',
                      tahun: currentYear,
                      rowNumber: nextRowNumber
                    };
                    setChecklistItems(prev => [...prev, newItem]);
                    setNewItems(prev => new Set(prev).add(newItem.id));
                    
                    // Simpan ke localStorage dan update context
                    const updatedItems = [...checklistItems, newItem];
                    
                    // Update original items untuk tracking changes
                    setOriginalChecklistItems(prev => [...prev, newItem]);
                    
                    // Sync data dengan context menggunakan helper function
                    syncDataWithContext(updatedItems);
                    
                    console.log('PengaturanBaru: Added new item', {
                      newItem,
                      totalItems: updatedItems.length,
                      year: selectedYear
                    });
                    
                    // Auto-scroll ke item baru setelah state update
                    setTimeout(() => {
                      if (newItemRef.current) {
                        newItemRef.current.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                      }
                    }, 100);
                    
                    // Remove highlight after 5 seconds
                    setTimeout(() => {
                      setNewItems(prev => {
                        const updated = new Set(prev);
                        updated.delete(newItem.id);
                        return updated;
                      });
                    }, 5000);
                  }}
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-lg w-12 h-12 rounded-full"
                  title="Tambah Item Baru"
                >
                  <Plus className="w-5 h-5" />
                </Button>

                {/* Back to Top - Icon only */}
                {showBackToTop && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-white border-gray-300 shadow-md w-12 h-12 rounded-full"
                    title="Kembali ke Atas"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

                      {/* Dialog Copy Options */}
            {showCopyOptionsDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pilih Data yang Ingin Di-copy
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tahun {newYearToSetup} akan mengcopy data dari tahun {copySourceYear}. 
                    Pilih data mana yang ingin di-copy:
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {/* Struktur Organisasi */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="copy-struktur"
                        checked={copyOptions.strukturOrganisasi}
                        onChange={(e) => setCopyOptions(prev => ({ 
                          ...prev, 
                          strukturOrganisasi: e.target.checked 
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="copy-struktur" className="text-sm font-medium text-blue-700">
                        Struktur Organisasi
                      </label>
                    </div>
                    
                    {/* Manajemen Akun */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="copy-manajemen"
                        checked={copyOptions.manajemenAkun}
                        onChange={(e) => setCopyOptions(prev => ({ 
                          ...prev, 
                          manajemenAkun: e.target.checked 
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="copy-manajemen" className="text-sm font-medium text-blue-700">
                        Manajemen Akun
                      </label>
                    </div>
                    
                    {/* Kelola Dokumen */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="copy-dokumen"
                        checked={copyOptions.kelolaDokumen}
                        onChange={(e) => setCopyOptions(prev => ({ 
                          ...prev, 
                          kelolaDokumen: e.target.checked 
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="copy-dokumen" className="text-sm font-medium text-blue-700">
                        Kelola Dokumen
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                                          <Button
                        onClick={handleCopyOptionsSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {Object.values(copyOptions).some(Boolean) ? 'Copy Data' : 'Lanjut Tanpa Copy'}
                      </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCopyOptionsDialog(false);
                        setNewYearToSetup(null);
                        setCopySourceYear(null);
                        setCopyOptions({
                          strukturOrganisasi: false,
                          manajemenAkun: false,
                          kelolaDokumen: false
                        });
                      }}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog untuk Struktur Organisasi */}
            
            {/* Dialog Direktorat */}
          {showDirektoratDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md border border-blue-200 shadow-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tambah Direktorat</h3>
                <form onSubmit={handleDirektoratSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="direktorat-nama" className="text-blue-800 font-medium">Nama Direktorat *</Label>
                    <Input
                      id="direktorat-nama"
                      value={strukturForm.direktorat.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        direktorat: { ...prev.direktorat, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: Direktorat Keuangan"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="direktorat-deskripsi" className="text-blue-800 font-medium">Deskripsi</Label>
                    <Textarea
                      id="direktorat-deskripsi"
                      value={strukturForm.direktorat.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        direktorat: { ...prev.direktorat, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi direktorat (opsional)"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
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
                      onClick={() => setShowDirektoratDialog(false)}
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
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
              <div className="bg-white rounded-lg p-6 w-full max-w-md border border-blue-200 shadow-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tambah Subdirektorat</h3>
                <form onSubmit={handleSubdirektoratSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subdirektorat-nama" className="text-blue-800 font-medium">Nama Subdirektorat *</Label>
                    <Input
                      id="subdirektorat-nama"
                      value={strukturForm.subdirektorat.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: Subdirektorat Akuntansi"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subdirektorat-direktorat" className="text-blue-800 font-medium">Direktorat *</Label>
                    <Select
                      value={strukturForm.subdirektorat.direktoratId}
                      onValueChange={(value) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, direktoratId: value } 
                      }))}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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
                    <Label htmlFor="subdirektorat-deskripsi" className="text-blue-800 font-medium">Deskripsi</Label>
                    <Textarea
                      id="subdirektorat-deskripsi"
                      value={strukturForm.subdirektorat.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        subdirektorat: { ...prev.subdirektorat, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi subdirektorat (opsional)"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
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
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
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
              <div className="bg-white rounded-lg p-6 w-full max-w-md border border-blue-200 shadow-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tambah Anak Perusahaan</h3>
                <form onSubmit={handleAnakPerusahaanSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="anakperusahaan-nama" className="text-blue-800 font-medium">Nama *</Label>
                    <Input
                      id="anakperusahaan-nama"
                      value={strukturForm.anakPerusahaan.nama}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        anakPerusahaan: { ...prev.anakPerusahaan, nama: e.target.value } 
                      }))}
                      placeholder="Contoh: PT Pos Logistik Indonesia"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="anakperusahaan-deskripsi" className="text-blue-800 font-medium">Deskripsi</Label>
                    <Textarea
                      id="anakperusahaan-deskripsi"
                      value={strukturForm.anakPerusahaan.deskripsi}
                      onChange={(e) => setStrukturForm(prev => ({ 
                        ...prev, 
                        anakPerusahaan: { ...prev.anakPerusahaan, deskripsi: e.target.value } 
                      }))}
                      placeholder="Deskripsi (opsional)"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
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
                      onClick={() => setShowAnakPerusahaanDialog(false)}
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
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
               <div className="bg-white rounded-lg p-6 w-full max-w-md border border-blue-200 shadow-xl">
                 <h3 className="text-lg font-semibold text-blue-900 mb-4">Tambah Divisi</h3>
                 <form onSubmit={handleDivisiSubmit} className="space-y-4">
                   <div>
                     <Label htmlFor="divisi-nama" className="text-blue-800 font-medium">Nama Divisi *</Label>
                     <Input
                       id="divisi-nama"
                       value={strukturForm.divisi.nama}
                       onChange={(e) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, nama: e.target.value } 
                       }))}
                       placeholder="Contoh: Divisi Akuntansi"
                       className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="divisi-subdirektorat" className="text-blue-800 font-medium">Subdirektorat *</Label>
                     <Select
                       value={strukturForm.divisi.subdirektoratId}
                       onValueChange={(value) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, subdirektoratId: value } 
                       }))}
                     >
                       <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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
                     <Label htmlFor="divisi-deskripsi" className="text-blue-800 font-medium">Deskripsi</Label>
                     <Textarea
                       id="divisi-deskripsi"
                       value={strukturForm.divisi.deskripsi}
                       onChange={(e) => setStrukturForm(prev => ({ 
                         ...prev, 
                         divisi: { ...prev.divisi, deskripsi: e.target.value } 
                       }))}
                       placeholder="Deskripsi divisi (opsional)"
                       className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
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
                       onClick={() => setShowDivisiDialog(false)}
                       className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
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
                <div className="bg-white rounded-lg p-6 w-full max-w-md border border-blue-200 shadow-xl">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    {editingUser ? 'Edit PIC' : 'Tambah PIC Baru'}
                  </h3>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="user-name" className="text-blue-800 font-medium">Nama Lengkap *</Label>
                      <Input
                        id="user-name"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: John Doe"
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-email" className="text-blue-800 font-medium">Email *</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Contoh: john@example.com"
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-password" className="text-blue-800 font-medium">Password *</Label>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <Input
                            id="user-password"
                            type={showPassword ? 'text' : 'password'}
                            value={userForm.password}
                            onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Minimal 6 karakter"
                            required
                            className="pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGeneratePassword}
                          className="px-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                          title="Generate password"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* Password Strength Indicator */}
                      {userForm.password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-blue-600">Kekuatan Password:</span>
                            <span className={`text-sm font-medium ${
                              getPasswordStrength(userForm.password) === 'weak' ? 'text-red-600' :
                              getPasswordStrength(userForm.password) === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {getPasswordStrength(userForm.password) === 'weak' ? 'Lemah' :
                               getPasswordStrength(userForm.password) === 'medium' ? 'Sedang' :
                               'Kuat'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getPasswordStrength(userForm.password) === 'weak' ? 'bg-red-500 w-1/3' :
                                getPasswordStrength(userForm.password) === 'medium' ? 'bg-yellow-500 w-2/3' :
                                'bg-green-500 w-full'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="user-direktorat" className="text-blue-800 font-medium">Direktorat *</Label>
                      <Select
                        value={direktorat.find(d => d.nama === userForm.direktorat)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const d = direktorat.find(x => x.id.toString() === value);
                          setUserForm(prev => ({ 
                            ...prev, 
                            direktorat: d?.nama || '', 
                            subdirektorat: '', 
                            divisi: '' 
                          }));
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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
                      <Label htmlFor="user-subdirektorat" className="text-blue-800 font-medium">Subdirektorat</Label>
                      <Select
                        disabled={!userForm.direktorat}
                        value={subdirektorat.find(s => s.nama === userForm.subdirektorat)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const s = subdirektorat.find(x => x.id.toString() === value);
                          setUserForm(prev => ({ 
                            ...prev, 
                            subdirektorat: s?.nama || '', 
                            divisi: '' 
                          }));
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Pilih Subdirektorat" />
                        </SelectTrigger>
                        <SelectContent>
                          {userForm.direktorat ? subdirektorat
                            .filter(s => s.direktoratId === direktorat.find(d => d.nama === userForm.direktorat)?.id)
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                              {item.nama}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user-divisi" className="text-blue-800 font-medium">Divisi</Label>
                      <Select
                        disabled={!userForm.subdirektorat}
                        value={divisi.find(d => d.nama === userForm.divisi)?.id.toString() || ''}
                        onValueChange={(value) => {
                          const d = divisi.find(x => x.id.toString() === value);
                          setUserForm(prev => ({ 
                            ...prev, 
                            divisi: d?.nama || '' 
                          }));
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Pilih Divisi" />
                        </SelectTrigger>
                        <SelectContent>
                          {userForm.subdirektorat ? divisi
                            .filter(d => d.subdirektoratId === subdirektorat.find(s => s.nama === userForm.subdirektorat)?.id)
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                              {item.nama}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user-whatsapp" className="text-blue-800 font-medium">Nomor WhatsApp (Opsional)</Label>
                      <Input
                        id="user-whatsapp"
                        type="tel"
                        value={userForm.whatsapp}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Hapus semua karakter non-digit
                          value = value.replace(/\D/g, '');
                          // Jika dimulai dengan 0, ganti dengan 62
                          if (value.startsWith('0')) {
                            value = '62' + value.substring(1);
                          }
                          // Jika belum ada kode negara, tambahkan 62
                          if (value.length > 0 && !value.startsWith('62')) {
                            value = '62' + value;
                          }
                          setUserForm(prev => ({ ...prev, whatsapp: value }));
                        }}
                        placeholder="Contoh: 08123456789 (akan otomatis menjadi 628123456789)"
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Format: 08xxx akan otomatis menjadi 628xxx (format internasional)
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingUser ? 'Update' : 'Tambah PIC'}
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
                            role: 'admin',
                            direktorat: '',
                            subdirektorat: '',
                            divisi: '',
                            whatsapp: ''
                          });
                        }}
                        className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Dialog Super Admin Edit */}
            {showSuperAdminDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md border border-orange-200 shadow-xl">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Edit Kredensial Super Admin
                  </h3>
                  <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="superadmin-email" className="text-sm font-medium text-orange-700">
                        Email Super Admin
                      </Label>
                      <Input
                        id="superadmin-email"
                        type="email"
                        value={superAdminForm.email}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="Email super admin"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="superadmin-password" className="text-sm font-medium text-orange-700">
                        Password Super Admin
                      </Label>
                      <Input
                        id="superadmin-password"
                        type="password"
                        value={superAdminForm.password}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="border-orange-200 focus:border-orange-500"
                        placeholder="Password super admin"
                        required
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <Button 
                        type="submit"
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Simpan Perubahan
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowSuperAdminDialog(false);
                          setSuperAdminForm({
                            email: 'arsippostgcg@gmail.com',
                            password: 'postarsipGCG.'
                          });
                        }}
                        className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50"
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
                              <Label htmlFor="aspek-nama">Deskripsi Aspek *</Label>
                              <div className="mt-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-blue-600">ASPEK {(() => {
                                    const yearAspects = currentYearAspects;
                                    return yearAspects.length > 0 ? 
                                      getRomanNumeral(yearAspects.length + 1) : 'I';
                                  })()}. </span>
                                  <Input
                                    id="aspek-nama"
                                    value={aspekForm.nama}
                                    onChange={(e) => setAspekForm(prev => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Masukkan deskripsi aspek (contoh: Komitmen)"
                                    className="flex-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                                <p className="text-xs text-blue-600">
                                  Hasil akhir: ASPEK {(() => {
                                    const yearAspects = currentYearAspects;
                                    return yearAspects.length > 0 ? 
                                      getRomanNumeral(yearAspects.length + 1) : 'I';
                                  })()}. {aspekForm.nama || '[Deskripsi Aspek]'}
                                </p>
                              </div>
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
                                      setAspekForm({ nama: '' });
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
                            const yearAspects = currentYearAspects;
                            return yearAspects.length > 0 ? (
                              <div className="space-y-2">
                                {yearAspects.map((aspek) => (
                                  <div key={aspek.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{aspek.nama}</div>
                                      <div className="text-sm text-gray-500">
                                        {checklistItems.filter(item => item.aspek === aspek.nama).length} item checklist
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditAspek(aspek.id, aspek.nama)}
                                        className="text-blue-600 hover:text-blue-700 border-blue-200"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteAspek(aspek.id)}
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
       
       {/* Bulk Delete Confirmation Dialog */}
       <BulkDeleteConfirmationDialog
         isOpen={showBulkDeleteDialog}
         onConfirm={handleBulkDelete}
         onCancel={() => setShowBulkDeleteDialog(false)}
         selectedYear={selectedYear || 0}
         isLoading={isBulkDeleting}
       />
       
       <Toaster />
     </div>
   );
 };

export default PengaturanBaru;
