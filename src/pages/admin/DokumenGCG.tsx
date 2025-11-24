import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useYear } from '@/contexts/YearContext';
import { useUser } from '@/contexts/UserContext';
import { Plus, Edit, Trash2, ListTodo, Calendar, FileText, CheckCircle, Target, Filter } from 'lucide-react';
import { ConfirmDialog, FormDialog, ActionButton, IconButton } from '@/components/panels';

interface ChecklistItem {
  id: number;
  aspek: string;
  deskripsi: string;
  tahun?: number;
  status?: 'uploaded' | 'not_uploaded';
  file?: string;
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

const DokumenGCG = () => {
  const { 
    checklist, 
    getChecklistByYear, 
    addChecklist, 
    editChecklist, 
    deleteChecklist,
    addAspek,
    editAspek,
    deleteAspek,
    initializeYearData
  } = useChecklist();
  const { isSidebarOpen } = useSidebar();
  const { user } = useUser();
  
  // State untuk tahun
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // State untuk aspek
  const [isAspekDialogOpen, setIsAspekDialogOpen] = useState(false);
  const [editingAspek, setEditingAspek] = useState<{ id: number; nama: string } | null>(null);
  const [aspekForm, setAspekForm] = useState({ nama: '' });
  
  // State untuk dokumen GCG item
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem | null>(null);
  const [checklistForm, setChecklistForm] = useState({ aspek: '', deskripsi: '' });
  
  // State untuk filter aspek
  const [selectedAspek, setSelectedAspek] = useState('all');
  
  // State untuk assignment dokumen GCG
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedChecklistForAssignment, setSelectedChecklistForAssignment] = useState<ChecklistItem | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    subdirektorat: '',
    notes: ''
  });

  // Load assignments from backend
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/config/assignments');
        if (response.ok) {
          const data = await response.json();
          // Filter assignments for selected year
          const yearAssignments = data.assignments.filter((assignment: any) => 
            assignment.tahun === selectedYear
          );
          setAssignments(yearAssignments);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      }
    };

    loadAssignments();
  }, [selectedYear]);
  
  // Use years from global context
  const { availableYears } = useYear();
  const years = availableYears;

  // Initialize year data when year changes
  useEffect(() => {
    initializeYearData(selectedYear);
  }, [selectedYear, initializeYearData]);

  // Filter dokumen GCG berdasarkan tahun
  const filteredChecklist = useMemo(() => {
    const yearData = getChecklistByYear(selectedYear);
    return yearData.map(item => ({
      ...item,
      status: 'not_uploaded' as 'uploaded' | 'not_uploaded'
    }));
  }, [getChecklistByYear, selectedYear]);

  // Group dokumen GCG berdasarkan aspek
  const groupedChecklist = useMemo(() => {
    const grouped: { [key: string]: ChecklistItem[] } = {};
    filteredChecklist.forEach(item => {
      if (!grouped[item.aspek]) {
        grouped[item.aspek] = [];
      }
      grouped[item.aspek].push(item);
    });
    return grouped;
  }, [filteredChecklist]);

  // Get unique aspects for selected year
  const aspects = useMemo(() => {
    return [...new Set(filteredChecklist.map(item => item.aspek))];
  }, [filteredChecklist]);

  const handleAspekSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aspekForm.nama.trim()) {
      alert('Nama aspek tidak boleh kosong!');
      return;
    }

    // Check if aspek already exists for the selected year (excluding current editing aspek)
    const existingAspek = aspects.find(aspek => 
      aspek.toLowerCase() === aspekForm.nama.toLowerCase() && 
      (!editingAspek || aspek !== editingAspek.nama)
    );
    
    if (existingAspek) {
      alert('Aspek sudah ada untuk tahun ini!');
      return;
    }

    if (editingAspek) {
      // Update existing aspek
      editAspek(editingAspek.nama, aspekForm.nama, selectedYear);
      alert('Aspek berhasil diupdate!');
    } else {
      // Add new aspek
      addAspek(aspekForm.nama, selectedYear);
      alert('Aspek berhasil ditambahkan!');
    }

    setAspekForm({ nama: '' });
    setEditingAspek(null);
    setIsAspekDialogOpen(false);
  };

  const handleChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checklistForm.aspek || !checklistForm.deskripsi.trim()) {
      alert('Aspek dan deskripsi wajib diisi!');
      return;
    }

    if (editingChecklist) {
      // Update existing checklist
      editChecklist(editingChecklist.id, checklistForm.aspek, checklistForm.deskripsi, selectedYear);
              alert('Dokumen GCG berhasil diupdate!');
    } else {
      // Add new checklist
      addChecklist(checklistForm.aspek, checklistForm.deskripsi, selectedYear);
              alert('Dokumen GCG berhasil ditambahkan!');
    }

    setChecklistForm({ aspek: '', deskripsi: '' });
    setEditingChecklist(null);
    setIsChecklistDialogOpen(false);
  };



  const getProgressPercentage = (items: ChecklistItem[]) => {
    const uploaded = items.filter(item => item.status === 'uploaded').length;
    return Math.round((uploaded / items.length) * 100);
  };

  const getAspectIcon = (aspekName: string) => {
    const aspectIcons = {
      'ASPEK I. Komitmen': { icon: Target, color: 'text-red-500' },
      'ASPEK II. Implementasi': { icon: CheckCircle, color: 'text-green-500' },
      'ASPEK III. Pengawasan': { icon: FileText, color: 'text-blue-500' },
      'ASPEK IV. Pelaporan': { icon: ListTodo, color: 'text-purple-500' },
      'ASPEK V. Evaluasi': { icon: Calendar, color: 'text-orange-500' }
    };
    
    return aspectIcons[aspekName] || { icon: Target, color: 'text-gray-500' };
  };

  const handleEditAspek = (aspek: string) => {
    setEditingAspek({ id: Date.now(), nama: aspek });
    setAspekForm({ nama: aspek });
    setIsAspekDialogOpen(true);
  };

  const handleDeleteAspek = (aspek: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus aspek "${aspek}"? Semua checklist dalam aspek ini juga akan dihapus.`)) {
      deleteAspek(aspek, selectedYear);
      alert('Aspek berhasil dihapus!');
    }
  };

  const handleEditDokumenGCG = (item: ChecklistItem) => {
    setEditingChecklist(item);
    setChecklistForm({ aspek: item.aspek, deskripsi: item.deskripsi });
    setIsChecklistDialogOpen(true);
  };

  const handleDeleteDokumenGCG = (item: ChecklistItem) => {
            if (confirm(`Apakah Anda yakin ingin menghapus dokumen GCG ini?`)) {
      deleteChecklist(item.id, selectedYear);
              alert('Dokumen GCG berhasil dihapus!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      
      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dokumen GCG</h1>
            <p className="text-gray-600 mt-2">Manajemen dokumen Good Corporate Governance per tahun</p>
          </div>

          {/* Year Selection */}
          <div id="year-selection">
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Tahun Buku</span>
                </CardTitle>
                <CardDescription>Pilih tahun buku untuk mengelola dokumen GCG</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? 'default' : 'outline'}
                      className={selectedYear === year ? 'bg-blue-600 text-white' : ''}
                      onClick={() => setSelectedYear(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="aspek" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Kelola Aspek</span>
              </TabsTrigger>
              <TabsTrigger value="dokumen" className="flex items-center space-x-2">
                <ListTodo className="w-4 h-2" />
                <span>Kelola Dokumen</span>
              </TabsTrigger>
            </TabsList>

            {/* Assignment Tab */}
            <TabsContent value="overview" id="overview-tab">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Assignment Dokumen GCG - Tahun {selectedYear}</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Atur assignment dokumen GCG untuk setiap subdirektorat pada tahun {selectedYear}
                </p>
              </div>
              
              {/* Assignment Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Assignment</p>
                        <p className="text-2xl font-bold">{assignments.length}</p>
                      </div>
                      <Target className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Completed</p>
                        <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'completed').length}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">In Progress</p>
                        <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'in_progress').length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Assigned</p>
                        <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'assigned').length}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignment by Aspect */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aspects.map((aspek) => {
                  const items = groupedChecklist[aspek] || [];
                  const aspectAssignments = assignments.filter(a => a.aspek === aspek);
                  const completedAssignments = aspectAssignments.filter(a => a.status === 'completed').length;
                  const progress = aspectAssignments.length > 0 ? (completedAssignments / aspectAssignments.length) * 100 : 0;
                  
                  return (
                    <Card key={aspek} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{aspek}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAspek(aspek);
                              // Scroll to checklist tab
                              document.getElementById('checklist-tab')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                        <CardDescription>
                          {aspectAssignments.length} assignment dari {items.length} checklist
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress Assignment</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{completedAssignments} sudah upload</span>
                            <span>{aspectAssignments.length - completedAssignments} belum upload</span>
                          </div>
                          
                          {/* Subdirektorat List */}
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Subdirektorat yang Ditugaskan:</p>
                            <div className="space-y-1">
                              {aspectAssignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                  <span className="truncate">{assignment.subdirektorat}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    assignment.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {assignment.status}
                                  </span>
                                </div>
                              ))}
                              {aspectAssignments.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{aspectAssignments.length - 3} subdirektorat lainnya
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Aspek Tab */}
            <TabsContent value="aspek" id="aspek-tab">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Kelola Aspek GCG - Tahun {selectedYear}</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Tambah, edit, atau hapus aspek dokumen GCG untuk tahun {selectedYear}
                </p>
              </div>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <span>Daftar Aspek</span>
                      </CardTitle>
                      <CardDescription>
                        {aspects.length} aspek ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <ActionButton
                      onClick={() => {
                        setEditingAspek(null);
                        setAspekForm({ nama: '' });
                        setIsAspekDialogOpen(true);
                      }}
                      variant="default"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Tambah Aspek
                    </ActionButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Aspek</TableHead>
                        <TableHead>Jumlah Item</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aspects.map((aspek, index) => (
                        <TableRow key={aspek}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{aspek}</TableCell>
                          <TableCell>{groupedChecklist[aspek]?.length || 0}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditAspek(aspek)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDeleteAspek(aspek)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

                          {/* Dokumen Tab */}
            <TabsContent value="dokumen" id="dokumen-tab">
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ListTodo className="w-5 h-5 text-purple-600" />
                                          <span className="font-semibold text-purple-900">Kelola Dokumen Item - Tahun {selectedYear}</span>
                </div>
                <p className="text-purple-700 text-sm mt-1">
                  Tambah, edit, atau hapus item dokumen GCG untuk tahun {selectedYear}
                </p>
              </div>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <ListTodo className="w-5 h-5 text-purple-600" />
                        <span>Daftar Checklist</span>
                      </CardTitle>
                      <CardDescription>
                        {filteredChecklist.length} item dokumen GCG ditemukan untuk tahun {selectedYear}
                      </CardDescription>
                    </div>
                    <ActionButton
                      onClick={() => {
                        setEditingChecklist(null);
                        setChecklistForm({ aspek: '', deskripsi: '' });
                        setIsChecklistDialogOpen(true);
                      }}
                      variant="default"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Tambah Checklist
                    </ActionButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Aspek Filter */}
                      <div className="flex-1 min-w-0">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                          <Filter className="w-4 h-4 mr-2 text-orange-600" />
                          Filter Aspek - Tahun {selectedYear}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedAspek === 'all' ? "default" : "outline"}
                            onClick={() => setSelectedAspek('all')}
                            size="sm"
                            className={selectedAspek === 'all' 
                              ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' 
                              : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                            }
                          >
                            Semua Aspek
                          </Button>
                          {aspects.map(aspek => {
                            const aspectInfo = getAspectIcon(aspek);
                            const IconComponent = aspectInfo.icon;
                            return (
                              <Button
                                key={aspek}
                                variant={selectedAspek === aspek ? "default" : "outline"}
                                onClick={() => setSelectedAspek(aspek)}
                                size="sm"
                                className={`text-xs flex items-center space-x-2 ${
                                  selectedAspek === aspek 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <IconComponent className={`w-3 h-3 ${selectedAspek === aspek ? 'text-white' : aspectInfo.color}`} />
                                <span>{aspek.replace('ASPEK ', '').replace('. ', ' - ')}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Table Content */}
                    <div className="mt-4">
                      {selectedAspek === 'all' ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>No</TableHead>
                              <TableHead>Aspek</TableHead>
                              <TableHead>Deskripsi</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredChecklist.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.aspek}</TableCell>
                                <TableCell className="max-w-md truncate">{item.deskripsi}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === 'uploaded' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status === 'uploaded' ? 'Sudah Upload' : 'Belum Upload'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditDokumenGCG(item)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => handleDeleteDokumenGCG(item)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>No</TableHead>
                              <TableHead>Deskripsi</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedChecklist[selectedAspek]?.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="max-w-md truncate">{item.deskripsi}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === 'uploaded' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status === 'uploaded' ? 'Sudah Upload' : 'Belum Upload'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditDokumenGCG(item)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => handleDeleteDokumenGCG(item)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* FormDialog untuk Aspek */}
      <FormDialog
        isOpen={isAspekDialogOpen}
        onClose={() => setIsAspekDialogOpen(false)}
        onSubmit={() => {
          const event = { preventDefault: () => {} } as React.FormEvent;
          handleAspekSubmit(event);
        }}
        title={`${editingAspek ? 'Edit Aspek' : 'Tambah Aspek Baru'} - Tahun ${selectedYear}`}
                        description={editingAspek ? `Edit aspek dokumen GCG untuk tahun ${selectedYear}` : `Tambahkan aspek baru untuk dokumen GCG tahun ${selectedYear}`}
        variant={editingAspek ? 'edit' : 'add'}
        submitText={editingAspek ? 'Update' : 'Simpan'}
      >
        <div>
          <Label htmlFor="aspek">Nama Aspek</Label>
          <Input
            id="aspek"
            value={aspekForm.nama}
            onChange={(e) => setAspekForm({ nama: e.target.value })}
            placeholder="Contoh: ASPEK I. Komitmen"
            required
          />
        </div>
      </FormDialog>

      {/* FormDialog untuk Checklist */}
      <FormDialog
        isOpen={isChecklistDialogOpen}
        onClose={() => setIsChecklistDialogOpen(false)}
        onSubmit={() => {
          const event = { preventDefault: () => {} } as React.FormEvent;
          handleChecklistSubmit(event);
        }}
        title={`${editingChecklist ? 'Edit Dokumen GCG' : 'Tambah Dokumen GCG Baru'} - Tahun ${selectedYear}`}
                        description={editingChecklist ? `Edit item dokumen GCG untuk tahun ${selectedYear}` : `Tambahkan item baru untuk dokumen GCG tahun ${selectedYear}`}
        variant={editingChecklist ? 'edit' : 'add'}
        submitText={editingChecklist ? 'Update' : 'Simpan'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="aspek">Aspek</Label>
            <Select value={checklistForm.aspek} onValueChange={(value) => setChecklistForm({ ...checklistForm, aspek: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih aspek" />
              </SelectTrigger>
              <SelectContent>
                {aspects.map(aspek => (
                  <SelectItem key={aspek} value={aspek}>
                    {aspek}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deskripsi">Deskripsi Dokumen GCG</Label>
            <Textarea
              id="deskripsi"
              value={checklistForm.deskripsi}
              onChange={(e) => setChecklistForm({ ...checklistForm, deskripsi: e.target.value })}
              placeholder="Masukkan deskripsi dokumen GCG"
              rows={4}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* FormDialog untuk Assignment */}
      <FormDialog
        isOpen={isAssignmentDialogOpen}
        onClose={() => setIsAssignmentDialogOpen(false)}
        onSubmit={async () => {
          if (!assignmentForm.subdirektorat.trim()) {
            alert('Pilih subdirektorat!');
            return;
          }
          
          const newAssignment = {
            checklistId: selectedChecklistForAssignment?.id || 0,
            subdirektorat: assignmentForm.subdirektorat,
            aspek: selectedChecklistForAssignment?.aspek || '',
            deskripsi: selectedChecklistForAssignment?.deskripsi || '',
            tahun: selectedYear,
            assignedBy: user?.name || 'Super Admin',
            status: 'assigned',
            notes: assignmentForm.notes
          };

          try {
            const response = await fetch('http://localhost:5001/api/config/assignments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newAssignment),
            });

            if (response.ok) {
              // Reload assignments from backend
              const assignmentsResponse = await fetch('http://localhost:5001/api/config/assignments');
              if (assignmentsResponse.ok) {
                const data = await assignmentsResponse.json();
                const yearAssignments = data.assignments.filter((assignment: any) => 
                  assignment.tahun === selectedYear
                );
                setAssignments(yearAssignments);
              }
              
              setIsAssignmentDialogOpen(false);
              setAssignmentForm({ subdirektorat: '', notes: '' });
              alert('Assignment berhasil dibuat!');
            } else {
              throw new Error('Failed to create assignment');
            }
          } catch (error) {
            console.error('Error creating assignment:', error);
            alert('Gagal membuat assignment!');
          }
        }}
        title="Assign Dokumen GCG"
        description="Tugaskan dokumen GCG ini kepada subdirektorat tertentu"
        variant="custom"
        submitText="Assign Dokumen GCG"
      >
        {selectedChecklistForAssignment && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="checklist-info">Dokumen GCG Info</Label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p><strong>Aspek:</strong> {selectedChecklistForAssignment.aspek}</p>
                <p><strong>Deskripsi:</strong> {selectedChecklistForAssignment.deskripsi}</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="subdirektorat">Subdirektorat</Label>
              <Select 
                value={assignmentForm.subdirektorat} 
                onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, subdirektorat: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih subdirektorat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sub Direktorat Government and Corporate Business">Sub Direktorat Government and Corporate Business</SelectItem>
                  <SelectItem value="Sub Direktorat Business Development">Sub Direktorat Business Development</SelectItem>
                  <SelectItem value="Sub Direktorat Operations">Sub Direktorat Operations</SelectItem>
                  <SelectItem value="Sub Direktorat Finance">Sub Direktorat Finance</SelectItem>
                  <SelectItem value="Sub Direktorat Human Capital">Sub Direktorat Human Capital</SelectItem>
                  <SelectItem value="Sub Direktorat Technology">Sub Direktorat Technology</SelectItem>
                  <SelectItem value="Sub Direktorat Legal and Compliance">Sub Direktorat Legal and Compliance</SelectItem>
                  <SelectItem value="Sub Direktorat Risk Management">Sub Direktorat Risk Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Tambahkan catatan untuk assignment ini..."
                rows={3}
              />
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
};

export default DokumenGCG; 