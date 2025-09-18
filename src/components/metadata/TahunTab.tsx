import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { ActionButton } from '@/components/panels';

interface TahunTabProps {
  years: number[];
  newYear: string;
  setNewYear: (year: string) => void;
  onAddYear: (e: React.FormEvent) => void;
  onDeleteYear: (year: number) => void;
}

const TahunTab: React.FC<TahunTabProps> = ({
  years,
  newYear,
  setNewYear,
  onAddYear,
  onDeleteYear
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-orange-900">Kelola Tahun Buku</span>
        </div>
        <p className="text-orange-700 text-sm mt-1">
          Tambah atau hapus tahun buku untuk sistem GCG
        </p>
      </div>

      {/* Tahun Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span>Daftar Tahun Buku</span>
              </CardTitle>
              <CardDescription>
                {years.length} tahun buku tersedia dalam sistem
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <ActionButton
                  variant="default"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Tambah Tahun
                </ActionButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Tahun Buku Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan tahun buku yang akan ditambahkan ke sistem
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onAddYear} className="space-y-4">
                  <div>
                    <Label htmlFor="year">Tahun Buku</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1746"
                      max="2030"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder="Contoh: 2025"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="submit" variant="default">
                      Tambah Tahun
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
              {years.sort((a, b) => b - a).map((year, index) => (
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
                      onClick={() => onDeleteYear(year)}
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
      {years.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tahun buku</h3>
          <p className="text-gray-500">
            Mulai dengan menambahkan tahun buku pertama ke sistem
          </p>
        </div>
      )}
    </div>
  );
};

export default TahunTab;
