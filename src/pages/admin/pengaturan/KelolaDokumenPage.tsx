import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useChecklist, ChecklistGCG } from '@/contexts/ChecklistContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Calendar,
  ChevronsUpDown,
  Check,
  Users,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

interface ChecklistItem extends ChecklistGCG {
  status?: string;
  catatan?: string;
  pic?: string;
  tahun: number;
}

// Helper function to convert number to roman numeral
const toRomanNumeral = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

const KelolaDokumenPage = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { selectedYear, availableYears, setSelectedYear } = useYear();
  const { divisi, subdirektorat } = useStrukturPerusahaan();
  const { checklist, addChecklist, editChecklist, deleteChecklist, addAspek, deleteAspek, getAspectsByYear, useDefaultChecklistData } = useChecklist();
  const { toast } = useToast();

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [assignmentType, setAssignmentType] = useState<'divisi' | 'subdirektorat'>('divisi');
  const [currentYearAspects, setCurrentYearAspects] = useState<Array<{ id: number; nama: string; tahun: number }>>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // PIC dropdown states
  const [picSearchTerm, setPicSearchTerm] = useState('');
  const [openPicPopover, setOpenPicPopover] = useState<number | null>(null);

  // Dialog states
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showAspekDialog, setShowAspekDialog] = useState(false);
  const [showManageAspekDialog, setShowManageAspekDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [deletingAspekId, setDeletingAspekId] = useState<number | null>(null);

  // Collapsible panel state
  const [isPicPanelOpen, setIsPicPanelOpen] = useState(false);

  // Form states
  const [checklistForm, setChecklistForm] = useState({ aspek: '', deskripsi: '' });
  const [aspekForm, setAspekForm] = useState({ nama: '' });

  // Inline editing state
  const [inlineNewRow, setInlineNewRow] = useState({ aspek: '', deskripsi: '' });
  const [isAddingInline, setIsAddingInline] = useState(false);

  // Ref for scrolling to inline add row
  const inlineAddRowRef = useRef<HTMLTableRowElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Function to reload checklist data from backend
  const reloadChecklistData = async () => {
    if (!selectedYear) return;

    try {
      const response = await fetch(`http://localhost:5001/api/config/checklist?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        const items = data.checklist || [];
        const mapped = items.map((item: any) => ({
          id: item.id,
          aspek: item.aspek || '',
          deskripsi: item.deskripsi || '',
          pic: item.pic || '',
          tahun: item.tahun || selectedYear,
          rowNumber: item.rowNumber || item.id
        }));
        setChecklistItems(mapped);
      }
    } catch (error) {
      console.error('Error reloading checklist:', error);
    }
  };

  // Load aspects for selected year
  useEffect(() => {
    const loadAspects = async () => {
      if (selectedYear) {
        try {
          const aspectsData = await getAspectsByYear(selectedYear);
          setCurrentYearAspects(aspectsData);
        } catch (error) {
          console.error('Error loading aspects:', error);
        }
      }
    };
    loadAspects();
  }, [selectedYear, getAspectsByYear]);

  // Load checklist data from backend on year change
  useEffect(() => {
    if (selectedYear) {
      reloadChecklistData();
    }
  }, [selectedYear]);

  // Load checklist items from context
  useEffect(() => {
    if (checklist && checklist.length > 0 && selectedYear) {
      const filtered = checklist.filter(item => item.tahun === selectedYear);
      const mapped = filtered.map(item => ({
        ...item,
        status: 'pending',
        catatan: '',
        pic: item.pic || '',
        tahun: item.tahun || selectedYear
      }));
      setChecklistItems(mapped);
    } else {
      setChecklistItems([]);
    }
  }, [checklist, selectedYear]);

  // Filtered and paginated items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return checklistItems;
    return checklistItems.filter(item =>
      item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.aspek?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [checklistItems, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistForm.deskripsi.trim()) {
      toast({ title: "Error", description: "Deskripsi wajib diisi!", variant: "destructive" });
      return;
    }
    if (!selectedYear) {
      toast({ title: "Error", description: "Pilih tahun terlebih dahulu!", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Aspect is optional - use empty string if not selected
      const aspekValue = checklistForm.aspek || '';
      await addChecklist(aspekValue, checklistForm.deskripsi, '', selectedYear);
      toast({ title: "Berhasil!", description: "Item checklist berhasil ditambahkan" });
      setChecklistForm({ aspek: '', deskripsi: '' });
      setShowChecklistDialog(false);

      // Reload data from backend
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error adding checklist:', error);
      toast({ title: "Error", description: "Gagal menambahkan item checklist", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !selectedYear) return;

    setIsLoading(true);
    try {
      const aspekValue = checklistForm.aspek || '';
      await editChecklist(editingItem.id, aspekValue, checklistForm.deskripsi, editingItem.pic || '', selectedYear);
      toast({ title: "Berhasil!", description: "Item checklist berhasil diperbarui" });
      setChecklistForm({ aspek: '', deskripsi: '' });
      setEditingItem(null);
      setShowChecklistDialog(false);

      // Reload data from backend
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error editing checklist:', error);
      toast({ title: "Error", description: "Gagal memperbarui item checklist", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChecklist = async (id: number) => {
    if (!selectedYear) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

    setIsLoading(true);
    try {
      await deleteChecklist(id, selectedYear);
      toast({ title: "Berhasil!", description: "Item checklist berhasil dihapus" });

      // Reload data from backend
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast({ title: "Error", description: "Gagal menghapus item checklist", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAspek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspekForm.nama.trim()) {
      toast({ title: "Error", description: "Deskripsi aspek wajib diisi!", variant: "destructive" });
      return;
    }
    if (!selectedYear) {
      toast({ title: "Error", description: "Pilih tahun terlebih dahulu!", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Auto-generate aspect format: "Aspek {roman numeral}. {description}"
      const nextNumber = currentYearAspects.length + 1;
      const romanNumeral = toRomanNumeral(nextNumber);
      const generatedName = `Aspek ${romanNumeral}. ${aspekForm.nama}`;

      await addAspek(generatedName, selectedYear);
      toast({ title: "Berhasil!", description: `Aspek "${generatedName}" berhasil ditambahkan` });
      setAspekForm({ nama: '' });
      setShowAspekDialog(false);

      // Refresh aspects from backend
      setTimeout(async () => {
        const aspectsData = await getAspectsByYear(selectedYear);
        setCurrentYearAspects(aspectsData);
      }, 500);
    } catch (error) {
      console.error('Error adding aspect:', error);
      toast({ title: "Error", description: "Gagal menambahkan aspek", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAspek = async (aspekId: number, aspekName: string) => {
    if (!selectedYear) return;

    // Check if any checklist items use this aspect
    const itemsUsingAspect = checklistItems.filter(item => item.aspek === aspekName);
    if (itemsUsingAspect.length > 0) {
      toast({
        title: "Tidak dapat menghapus",
        description: `Aspek ini digunakan oleh ${itemsUsingAspect.length} item checklist. Hapus atau ubah item tersebut terlebih dahulu.`,
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus aspek "${aspekName}"?`)) return;

    setDeletingAspekId(aspekId);
    try {
      await deleteAspek(aspekId, selectedYear);
      toast({ title: "Berhasil!", description: "Aspek berhasil dihapus" });

      // Refresh aspects from backend
      setTimeout(async () => {
        const aspectsData = await getAspectsByYear(selectedYear);
        setCurrentYearAspects(aspectsData);
      }, 500);
    } catch (error) {
      console.error('Error deleting aspect:', error);
      toast({ title: "Error", description: "Gagal menghapus aspek", variant: "destructive" });
    } finally {
      setDeletingAspekId(null);
    }
  };

  const handleAssign = async (checklistId: number, targetName: string) => {
    if (!selectedYear) return;

    try {
      // Find the current item to get its current data
      const currentItem = checklistItems.find(item => item.id === checklistId);
      if (!currentItem) return;

      // Update local state first for immediate UI feedback
      setChecklistItems(prev => prev.map(item =>
        item.id === checklistId ? { ...item, pic: targetName } : item
      ));

      // Update via editChecklist function to persist PIC to backend
      await editChecklist(checklistId, currentItem.aspek, currentItem.deskripsi, targetName, selectedYear);

      toast({ title: "Berhasil!", description: "PIC berhasil disimpan" });

      // Reload data from backend to ensure consistency
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error updating PIC:', error);
      toast({ title: "Error", description: "Gagal menyimpan PIC", variant: "destructive" });
      // Revert local state on error
      reloadChecklistData();
    }
  };

  // Handle aspek assignment (inline dropdown change)
  const handleAspekAssign = async (checklistId: number, aspekName: string) => {
    if (!selectedYear) return;

    try {
      // Find the current item to get its current data
      const currentItem = checklistItems.find(item => item.id === checklistId);
      if (!currentItem) return;

      // Update local state first for immediate UI feedback
      setChecklistItems(prev => prev.map(item =>
        item.id === checklistId ? { ...item, aspek: aspekName } : item
      ));

      // Update via editChecklist function
      await editChecklist(checklistId, aspekName, currentItem.deskripsi, currentItem.pic || '', selectedYear);

      toast({ title: "Berhasil!", description: "Aspek berhasil diperbarui" });

      // Reload data from backend to ensure consistency
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error updating aspek:', error);
      toast({ title: "Error", description: "Gagal memperbarui aspek", variant: "destructive" });
      // Revert local state on error
      reloadChecklistData();
    }
  };

  const handleUseDefaultData = async () => {
    if (!selectedYear) {
      toast({ title: "Error", description: "Pilih tahun terlebih dahulu!", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await useDefaultChecklistData(selectedYear);
      toast({ title: "Berhasil!", description: "Data checklist default berhasil dimuat" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data default", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: ChecklistItem) => {
    setEditingItem(item);
    setChecklistForm({ aspek: item.aspek, deskripsi: item.deskripsi }); // Keep aspek in form but don't show in edit dialog
    setShowChecklistDialog(true);
  };

  // Scroll to inline add row
  const scrollToInlineAddRow = () => {
    if (inlineAddRowRef.current) {
      inlineAddRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus on the deskripsi input after scrolling
      setTimeout(() => {
        const input = inlineAddRowRef.current?.querySelector('input[placeholder="Ketik deskripsi item baru..."]') as HTMLInputElement;
        if (input) input.focus();
      }, 500);
    }
  };

  // Handle inline add
  const handleInlineAdd = async () => {
    if (!inlineNewRow.deskripsi.trim()) {
      toast({ title: "Error", description: "Deskripsi wajib diisi!", variant: "destructive" });
      return;
    }
    if (!selectedYear) {
      toast({ title: "Error", description: "Pilih tahun terlebih dahulu!", variant: "destructive" });
      return;
    }

    setIsAddingInline(true);
    try {
      const aspekValue = inlineNewRow.aspek || '';
      await addChecklist(aspekValue, inlineNewRow.deskripsi, '', selectedYear);
      toast({ title: "Berhasil!", description: "Item checklist berhasil ditambahkan" });
      setInlineNewRow({ aspek: '', deskripsi: '' });

      // Reload data from backend
      setTimeout(() => reloadChecklistData(), 500);
    } catch (error) {
      console.error('Error adding inline checklist:', error);
      toast({ title: "Error", description: "Gagal menambahkan item checklist", variant: "destructive" });
    } finally {
      setIsAddingInline(false);
    }
  };

  const optionNames = useMemo(() => {
    const source = assignmentType === 'divisi' ? divisi : subdirektorat;
    const names = (source || []).map((d: { nama: string }) => d.nama).filter((n): n is string => !!n && n.trim() !== '');
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));
  }, [assignmentType, divisi, subdirektorat]);

  // Filtered PIC options based on search
  const filteredPicOptions = useMemo(() => {
    if (!picSearchTerm.trim()) return optionNames;
    return optionNames.filter(name =>
      name.toLowerCase().includes(picSearchTerm.toLowerCase())
    );
  }, [optionNames, picSearchTerm]);

  // PIC assignment distribution statistics
  const picDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    let assignedCount = 0;
    let unassignedCount = 0;

    checklistItems.forEach(item => {
      if (item.pic && item.pic.trim() !== '') {
        distribution[item.pic] = (distribution[item.pic] || 0) + 1;
        assignedCount++;
      } else {
        unassignedCount++;
      }
    });

    // Sort by count descending
    const sorted = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return {
      items: sorted,
      totalPics: sorted.length,
      assignedCount,
      unassignedCount
    };
  }, [checklistItems]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <Sidebar />

      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/pengaturan')}
              className="mb-4 text-gray-600 hover:text-gray-900"
              data-tour="dokumen-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pengaturan
            </Button>

            <div className="flex items-center justify-between flex-wrap gap-4" data-tour="dokumen-header">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kelola Dokumen</h1>
                  <p className="text-gray-500">Kelola checklist dan aspek penilaian GCG</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Year Selector */}
                <Select
                  value={selectedYear?.toString() || ''}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]" data-tour="dokumen-year-selector">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleUseDefaultData}
                  disabled={isLoading || !selectedYear}
                  data-tour="dokumen-default-btn"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Data Default'}
                </Button>

                {/* Manage Aspects Dialog */}
                <Dialog open={showManageAspekDialog} onOpenChange={setShowManageAspekDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedYear} data-tour="kelola-aspek-btn">
                      <Edit className="w-4 h-4 mr-2" />
                      Kelola Aspek
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Kelola Aspek - Tahun {selectedYear}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {currentYearAspects.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          Belum ada aspek untuk tahun {selectedYear}
                        </p>
                      ) : (
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                          {currentYearAspects.map((aspek, index) => (
                            <div
                              key={aspek.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {aspek.nama}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {checklistItems.filter(item => item.aspek === aspek.nama).length} item menggunakan aspek ini
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteAspek(aspek.id, aspek.nama)}
                                disabled={deletingAspekId === aspek.id}
                              >
                                {deletingAspekId === aspek.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowManageAspekDialog(false);
                            setShowAspekDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Aspek Baru
                        </Button>
                        <Button variant="outline" onClick={() => setShowManageAspekDialog(false)}>
                          Tutup
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Add Aspect Dialog - opened from Kelola Aspek dialog */}
                <Dialog open={showAspekDialog} onOpenChange={setShowAspekDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Aspek Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAspek} className="space-y-4">
                      <div>
                        <Label>Deskripsi Aspek</Label>
                        <Input
                          value={aspekForm.nama}
                          onChange={(e) => setAspekForm({ nama: e.target.value })}
                          placeholder="Contoh: Komitmen terhadap Good Corporate Governance"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Format otomatis: <span className="font-medium text-purple-600">
                            Aspek {toRomanNumeral(currentYearAspects.length + 1)}. {aspekForm.nama || '(deskripsi anda)'}
                          </span>
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAspekDialog(false)}>Batal</Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Tambah</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Tambah Item button - scrolls to inline add row */}
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedYear}
                  onClick={scrollToInlineAddRow}
                  data-tour="tambah-item-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>

                {/* Edit Checklist Dialog - Only for editing deskripsi */}
                <Dialog open={showChecklistDialog} onOpenChange={(open) => {
                  setShowChecklistDialog(open);
                  if (!open) {
                    setEditingItem(null);
                    setChecklistForm({ aspek: '', deskripsi: '' });
                  }
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Deskripsi Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditChecklist} className="space-y-4">
                      {/* Show current aspek as read-only info */}
                      {editingItem && (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-xs text-gray-500 mb-1">Aspek saat ini:</p>
                          <p className="text-sm font-medium text-gray-700">
                            {editingItem.aspek || <span className="italic text-gray-400">Tanpa Aspek</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            (Ubah aspek langsung dari dropdown di tabel)
                          </p>
                        </div>
                      )}
                      <div>
                        <Label>Deskripsi <span className="text-red-500">*</span></Label>
                        <Textarea
                          value={checklistForm.deskripsi}
                          onChange={(e) => setChecklistForm({...checklistForm, deskripsi: e.target.value})}
                          placeholder="Masukkan deskripsi item checklist"
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => {
                          setShowChecklistDialog(false);
                          setEditingItem(null);
                          setChecklistForm({ aspek: '', deskripsi: '' });
                        }}>
                          Batal
                        </Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                          Simpan
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-4" data-tour="dokumen-stats">
            {/* Total Item Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">{checklistItems.length} Item</span>
            </div>

            {/* PIC Distribution Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPicPanelOpen(!isPicPanelOpen)}
              className={`flex items-center gap-2 transition-colors ${
                isPicPanelOpen ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
              }`}
              data-tour="distribusi-pic-toggle"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Distribusi PIC</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {picDistribution.totalPics}
              </Badge>
              {isPicPanelOpen ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Collapsible PIC Distribution Panel */}
          {isPicPanelOpen && (
            <Card className="mb-4 border-blue-200 bg-blue-50/30" data-tour="distribusi-pic-panel">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Summary Stats */}
                  <div className="flex gap-3 shrink-0">
                    <div className="px-4 py-2 bg-white rounded-lg border text-center min-w-[80px]">
                      <p className="text-xl font-bold text-blue-700">{picDistribution.totalPics}</p>
                      <p className="text-xs text-gray-500">Total PIC</p>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border text-center min-w-[80px]">
                      <p className="text-xl font-bold text-green-600">{picDistribution.assignedCount}</p>
                      <p className="text-xs text-gray-500">Ditugaskan</p>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border text-center min-w-[80px]">
                      <p className="text-xl font-bold text-orange-600">{picDistribution.unassignedCount}</p>
                      <p className="text-xs text-gray-500">Belum</p>
                    </div>
                  </div>

                  {/* Distribution List */}
                  <div className="flex-1 bg-white rounded-lg border max-h-[150px] overflow-y-auto">
                    {picDistribution.items.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p className="text-sm">Belum ada penugasan PIC</p>
                      </div>
                    ) : (
                      <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                        {picDistribution.items.map((item, idx) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 text-sm"
                          >
                            <span className="truncate flex-1 text-gray-700" title={item.name}>
                              {idx + 1}. {item.name}
                            </span>
                            <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                              {item.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checklist Table */}
          <Card data-tour="dokumen-table">
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Daftar Checklist GCG {selectedYear && `- Tahun ${selectedYear}`}</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Menampilkan {paginatedItems.length} dari {filteredItems.length} item
                  </span>
                </div>
              </div>
              {/* Search */}
              <div className="flex-1 relative max-w-md" data-tour="dokumen-search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari item checklist..."
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedYear ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Pilih Tahun Buku</p>
                  <p className="text-sm">Pilih tahun buku untuk melihat dan mengelola checklist</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead className="w-48">Aspek</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead className="w-56">PIC</TableHead>
                          <TableHead className="w-24 text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell>
                              <Select
                                value={item.aspek || '_none_'}
                                onValueChange={(value) => handleAspekAssign(item.id, value === '_none_' ? '' : value)}
                              >
                                <SelectTrigger className="h-8 text-sm w-full min-w-[120px]">
                                  <SelectValue placeholder="Pilih Aspek" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none_">
                                    <span className="text-gray-400 italic">Tanpa Aspek</span>
                                  </SelectItem>
                                  {currentYearAspects.map((a) => (
                                    <SelectItem key={a.id} value={a.nama}>
                                      <span className="truncate max-w-[200px]">{a.nama}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <span className="line-clamp-2">{item.deskripsi}</span>
                            </TableCell>
                            <TableCell>
                              <Popover
                                open={openPicPopover === item.id}
                                onOpenChange={(open) => {
                                  setOpenPicPopover(open ? item.id : null);
                                  if (!open) setPicSearchTerm('');
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="h-8 w-full justify-between text-sm font-normal"
                                    title={item.pic || ''}
                                  >
                                    <span className="truncate max-w-[180px]">
                                      {item.pic || <span className="text-gray-400">Pilih PIC...</span>}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0" align="start">
                                  <div className="p-2 border-b">
                                    {/* Type selector */}
                                    <div className="flex gap-1 mb-2">
                                      <Button
                                        size="sm"
                                        variant={assignmentType === 'divisi' ? 'default' : 'outline'}
                                        className="flex-1 h-7 text-xs"
                                        onClick={() => setAssignmentType('divisi')}
                                      >
                                        Divisi
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={assignmentType === 'subdirektorat' ? 'default' : 'outline'}
                                        className="flex-1 h-7 text-xs"
                                        onClick={() => setAssignmentType('subdirektorat')}
                                      >
                                        Subdirektorat
                                      </Button>
                                    </div>
                                    {/* Search input */}
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                      <Input
                                        placeholder="Cari..."
                                        value={picSearchTerm}
                                        onChange={(e) => setPicSearchTerm(e.target.value)}
                                        className="h-8 pl-7 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-[200px] overflow-y-auto">
                                    {/* Clear option */}
                                    <div
                                      className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
                                      onClick={() => {
                                        handleAssign(item.id, '');
                                        setOpenPicPopover(null);
                                        setPicSearchTerm('');
                                      }}
                                    >
                                      <Check className={`mr-2 h-4 w-4 ${!item.pic ? 'opacity-100' : 'opacity-0'}`} />
                                      <span className="text-gray-400 italic">Tidak ada</span>
                                    </div>
                                    {/* Options */}
                                    {filteredPicOptions.length === 0 ? (
                                      <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                        Tidak ditemukan
                                      </div>
                                    ) : (
                                      filteredPicOptions.map((name) => (
                                        <div
                                          key={name}
                                          className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
                                          onClick={() => {
                                            handleAssign(item.id, name);
                                            setOpenPicPopover(null);
                                            setPicSearchTerm('');
                                          }}
                                          title={name}
                                        >
                                          <Check className={`mr-2 h-4 w-4 shrink-0 ${item.pic === name ? 'opacity-100' : 'opacity-0'}`} />
                                          <span className="truncate">{name}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(item)}
                                  data-tour={index === 0 ? "edit-checklist-btn" : undefined}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteChecklist(item.id)}
                                  data-tour={index === 0 ? "delete-checklist-btn" : undefined}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedItems.length === 0 && !searchTerm && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              Belum ada data checklist. Mulai tambahkan item di bawah.
                            </TableCell>
                          </TableRow>
                        )}
                        {paginatedItems.length === 0 && searchTerm && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              Tidak ada item yang sesuai pencarian
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Inline Add Row */}
                        {!searchTerm && (
                          <TableRow ref={inlineAddRowRef} className="bg-blue-50/50 border-t-2 border-blue-200">
                            <TableCell className="text-gray-400 text-sm">
                              <Plus className="w-4 h-4 text-blue-500" />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={inlineNewRow.aspek}
                                onValueChange={(value) => setInlineNewRow({...inlineNewRow, aspek: value === '_none_' ? '' : value})}
                              >
                                <SelectTrigger className="h-8 text-sm bg-white">
                                  <SelectValue placeholder="Pilih Aspek" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none_">
                                    <span className="text-gray-400 italic">Tanpa Aspek</span>
                                  </SelectItem>
                                  {currentYearAspects.map((a) => (
                                    <SelectItem key={a.id} value={a.nama}>{a.nama}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={inlineNewRow.deskripsi}
                                onChange={(e) => setInlineNewRow({...inlineNewRow, deskripsi: e.target.value})}
                                placeholder="Ketik deskripsi item baru..."
                                className="h-8 text-sm bg-white"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && inlineNewRow.deskripsi.trim()) {
                                    handleInlineAdd();
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-400">-</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 h-8"
                                onClick={handleInlineAdd}
                                disabled={!inlineNewRow.deskripsi.trim() || isAddingInline}
                              >
                                {isAddingInline ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Item per halaman:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => setItemsPerPage(parseInt(value))}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Halaman {currentPage} dari {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default KelolaDokumenPage;
