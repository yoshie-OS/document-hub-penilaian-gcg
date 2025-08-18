import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSidebar } from '@/contexts/SidebarContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useYear } from '@/contexts/YearContext';

import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { ConfirmDialog, FormDialog, ActionButton, IconButton } from '@/components/panels';

// Import interface from context
interface KlasifikasiItem {
  id: number;
  nama: string;
  tipe: 'prinsip' | 'jenis' | 'kategori';
  createdAt: Date;
  isActive: boolean;
}

const MetaData = () => {
  const { isSidebarOpen } = useSidebar();
  const { initializeYearData } = useChecklist();
  const { availableYears, addYear, removeYear } = useYear();
  // Klasifikasi functionality removed
  const { refreshDocuments } = useDocumentMetadata();
  
  // State untuk tahun
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState('');
  
  // Klasifikasi state removed
  
  // Use years from global context
  const years = availableYears || [];

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (newYear && !years.includes(parseInt(newYear))) {
      const year = parseInt(newYear);
      initializeYearData(year);
      addYear(year);
      alert(`Tahun ${year} berhasil ditambahkan dengan data default!`);
      setNewYear('');
      setIsYearDialogOpen(false);
    } else if (years.includes(parseInt(newYear))) {
      alert('Tahun sudah ada dalam sistem!');
    }
  };

  // Klasifikasi reset function removed

  const handleDeleteYear = (year: number) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tahun ${year}?`)) {
      removeYear(year);
      alert(`Tahun ${year} berhasil dihapus!`);
    }
  };

  // Klasifikasi submit function removed

  // Klasifikasi edit function removed

  // All klasifikasi functions removed

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pengaturan Metadata</h1>
                <p className="text-gray-600 mt-2">
                  Kelola metadata sistem
                </p>
              </div>
            </div>
          </div>

          {/* Tabs untuk Tahun */}
          <Tabs defaultValue="tahun" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="tahun" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Kelola Tahun</span>
              </TabsTrigger>
            </TabsList>

            {/* Tahun Tab */}
            <TabsContent value="tahun">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Kelola Tahun</span>
                  </CardTitle>
                  <CardDescription>
                    Tambah atau hapus tahun untuk sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      {years.length} tahun tersedia
                    </div>
                    <ActionButton
                      onClick={() => setIsYearDialogOpen(true)}
                      variant="default"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Tambah Tahun
                    </ActionButton>
                    <FormDialog
                      isOpen={isYearDialogOpen}
                      onClose={() => setIsYearDialogOpen(false)}
                      onSubmit={handleAddYear}
                      title="Tambah Tahun Baru"
                      description="Tambahkan tahun baru untuk sistem"
                      variant="add"
                      submitText="Tambah Tahun"
                    >
                      <div>
                        <Label htmlFor="year">Tahun *</Label>
                        <Input
                          id="year"
                          type="number"
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                          placeholder="Masukkan tahun (contoh: 2025)"
                          min="2014"
                          max="2100"
                          required
                        />
                      </div>
                    </FormDialog>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tahun</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {years.map((year) => (
                        <TableRow key={year}>
                          <TableCell className="font-medium">{year}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Aktif
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteYear(year)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
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
            </TabsContent>

            {/* Klasifikasi Tab removed */}
          </Tabs>
        </div>
      </div>

      {/* FormDialog untuk Klasifikasi removed */}
    </div>
  );
};

export default MetaData; 