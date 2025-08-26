# Komponen Panel

Dokumentasi untuk komponen panel yang dapat digunakan ulang di seluruh aplikasi.

## YearSelectorPanel

Panel untuk memilih tahun buku yang dapat digunakan di berbagai halaman.

### Props
- `selectedYear: number` - Tahun yang sedang dipilih
- `onYearChange: (year: number) => void` - Callback ketika tahun berubah
- `availableYears: number[]` - Array tahun yang tersedia
- `title?: string` - Judul panel (default: "Tahun Buku")
- `description?: string` - Deskripsi panel (default: "Pilih tahun buku untuk mengelola data")
- `className?: string` - Class CSS tambahan

### Contoh Penggunaan
```tsx
import { YearSelectorPanel } from '@/components/panels';

<YearSelectorPanel
  selectedYear={selectedYear}
  onYearChange={setSelectedYear}
  availableYears={[2024, 2023, 2022, 2021, 2020]}
  title="Tahun Buku"
  description="Pilih tahun buku untuk mengelola data"
/>
```

## AdminYearPanel

Panel khusus untuk admin yang menampilkan tahun aktif dengan icon upload dan tahun-tahun sebelumnya dengan icon mata.

### Props
- `selectedYear: number | null` - Tahun yang sedang dipilih
- `onYearChange: (year: number) => void` - Callback ketika tahun berubah
- `availableYears: number[]` - Array tahun yang tersedia
- `currentYear: number` - Tahun saat ini untuk menentukan tahun aktif
- `className?: string` - Class CSS tambahan

### Fitur
- **Tahun Aktif**: Menampilkan tahun terkini dengan icon upload (hijau)
- **Tahun Sebelumnya**: Menampilkan tahun-tahun sebelumnya dengan icon mata (abu-abu)
- **Auto-sorting**: Tahun aktif selalu di atas, tahun sebelumnya diurutkan descending
- **Visual Feedback**: Badge untuk membedakan tahun aktif dan arsip
- **Responsive**: Layout yang responsif dengan flexbox

### Contoh Penggunaan
```tsx
import { AdminYearPanel } from '@/components/panels';

<AdminYearPanel
  selectedYear={selectedYear}
  onYearChange={setSelectedYear}
  availableYears={availableYears}
  currentYear={new Date().getFullYear()}
/>
```

## StatsPanel

Panel untuk menampilkan statistik dalam format grid atau list.

### Props
- `title?: string` - Judul panel
- `description?: string` - Deskripsi panel
- `stats: StatItem[]` - Array data statistik
- `layout?: 'grid' | 'list'` - Layout tampilan (default: 'grid')
- `showProgress?: boolean` - Tampilkan progress bar (default: false)
- `className?: string` - Class CSS tambahan

### StatItem Interface
```tsx
interface StatItem {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
}
```

### Contoh Penggunaan
```tsx
import { StatsPanel } from '@/components/panels';

<StatsPanel
  title="Statistik Dashboard"
  description="Overview data dashboard"
  stats={[
    { title: "Total Dokumen", value: 150, icon: <FileText /> },
    { title: "Selesai", value: 120, progress: 80, color: "green" }
  ]}
  layout="grid"
  showProgress={true}
/>
```

## PageHeaderPanel

Panel header halaman dengan title, subtitle, dan action buttons.

### Props
- `title: string` - Judul halaman
- `subtitle?: string` - Subtitle halaman
- `badge?: { text: string; variant?: string }` - Badge informasi
- `actions?: ActionButton[]` - Array tombol aksi
- `showSearch?: boolean` - Tampilkan search input (default: false)
- `searchPlaceholder?: string` - Placeholder search (default: "Cari...")
- `onSearch?: (value: string) => void` - Callback search
- `showFilters?: boolean` - Tampilkan tombol filter (default: false)
- `onFilterClick?: () => void` - Callback filter
- `className?: string` - Class CSS tambahan

### ActionButton Interface
```tsx
interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}
```

### Contoh Penggunaan
```tsx
import { PageHeaderPanel } from '@/components/panels';

<PageHeaderPanel
  title="List GCG"
  subtitle="Daftar checklist Good Corporate Governance"
  badge={{ text: "2024", variant: "default" }}
  actions={[
    {
      label: "Tambah Baru",
      onClick: () => setIsAddDialogOpen(true),
      icon: <Plus className="w-4 h-4" />
    },
    {
      label: "Download",
      onClick: handleDownload,
      variant: "outline"
    }
  ]}
  showSearch={true}
  searchPlaceholder="Cari checklist..."
  onSearch={handleSearch}
/>
```

## EmptyStatePanel

Panel untuk menampilkan keadaan kosong dengan icon dan action.

### Props
- `title: string` - Judul empty state
- `description: string` - Deskripsi empty state
- `icon?: React.ReactNode` - Icon custom
- `action?: { label: string; onClick: () => void; icon?: React.ReactNode }` - Action button
- `variant?: 'default' | 'upload' | 'search' | 'calendar' | 'folder'` - Variant icon (default: 'default')
- `className?: string` - Class CSS tambahan

### Contoh Penggunaan
```tsx
import { EmptyStatePanel } from '@/components/panels';

<EmptyStatePanel
  title="Belum ada dokumen"
  description="Mulai dengan mengupload dokumen pertama Anda"
  variant="upload"
  action={{
    label: "Upload Dokumen",
    onClick: () => setIsUploadDialogOpen(true)
  }}
/>
```

## Keuntungan Penggunaan Komponen Panel

1. **Konsistensi UI**: Semua panel menggunakan desain yang konsisten
2. **Reusability**: Komponen dapat digunakan ulang di berbagai halaman
3. **Maintainability**: Perubahan desain cukup dilakukan di satu tempat
4. **Type Safety**: Menggunakan TypeScript untuk type checking
5. **Flexibility**: Props yang fleksibel untuk berbagai kebutuhan
6. **Performance**: Komponen yang dioptimasi dengan React.memo dan hooks

## ConfirmDialog

Dialog konfirmasi untuk aksi yang memerlukan konfirmasi user.

### Props
- `isOpen: boolean` - Status dialog terbuka/tertutup
- `onClose: () => void` - Callback untuk menutup dialog
- `onConfirm: () => void` - Callback untuk konfirmasi
- `title: string` - Judul dialog
- `description: string` - Deskripsi dialog
- `variant?: 'danger' | 'warning' | 'info' | 'success'` - Variant dialog (default: 'danger')
- `confirmText?: string` - Teks tombol konfirmasi
- `cancelText?: string` - Teks tombol batal (default: 'Batal')
- `isLoading?: boolean` - Status loading (default: false)
- `disabled?: boolean` - Status disabled (default: false)

### Contoh Penggunaan
```tsx
import { ConfirmDialog } from '@/components/panels';

<ConfirmDialog
  isOpen={isDeleteDialogOpen}
  onClose={() => setIsDeleteDialogOpen(false)}
  onConfirm={handleDelete}
  title="Hapus Data"
  description="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
  variant="danger"
  confirmText="Hapus"
  isLoading={isDeleting}
/>
```

## FormDialog

Dialog form untuk menambah atau mengedit data.

### Props
- `isOpen: boolean` - Status dialog terbuka/tertutup
- `onClose: () => void` - Callback untuk menutup dialog
- `title: string` - Judul dialog
- `description?: string` - Deskripsi dialog
- `children: React.ReactNode` - Konten form
- `onSubmit?: () => void` - Callback untuk submit form
- `submitText?: string` - Teks tombol submit
- `cancelText?: string` - Teks tombol batal (default: 'Batal')
- `isLoading?: boolean` - Status loading (default: false)
- `disabled?: boolean` - Status disabled (default: false)
- `variant?: 'add' | 'edit' | 'custom'` - Variant dialog (default: 'custom')
- `showCloseButton?: boolean` - Tampilkan tombol close (default: true)
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Ukuran dialog (default: 'md')
- `className?: string` - Class CSS tambahan

### Contoh Penggunaan
```tsx
import { FormDialog } from '@/components/panels';

<FormDialog
  isOpen={isAddDialogOpen}
  onClose={() => setIsAddDialogOpen(false)}
  onSubmit={handleSubmit}
  title="Tambah Aspek Baru"
  description="Masukkan informasi aspek baru"
  variant="add"
  isLoading={isSubmitting}
>
  <div className="space-y-4">
    <Input
      placeholder="Nama Aspek"
      value={formData.nama}
      onChange={(e) => setFormData({...formData, nama: e.target.value})}
    />
    <Textarea
      placeholder="Deskripsi Aspek"
      value={formData.deskripsi}
      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
    />
  </div>
</FormDialog>
```

## ActionButton & IconButton

Komponen button dengan berbagai aksi yang dapat dikustomisasi.

### ActionButton Props
- `onClick: () => void` - Callback ketika button diklik
- `variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'` - Variant button
- `size?: 'default' | 'sm' | 'lg' | 'icon'` - Ukuran button
- `disabled?: boolean` - Status disabled (default: false)
- `isLoading?: boolean` - Status loading (default: false)
- `loadingText?: string` - Teks saat loading (default: 'Memproses...')
- `type?: 'button' | 'submit' | 'reset'` - Type button (default: 'button')
- `className?: string` - Class CSS tambahan
- `children?: React.ReactNode` - Konten button
- `icon?: React.ReactNode` - Icon button
- `iconPosition?: 'left' | 'right'` - Posisi icon (default: 'left')
- `tooltip?: string` - Tooltip button

### IconButton Props
- `action: string` - Jenis aksi (add, edit, delete, download, upload, view, dll.)
- `label?: string` - Label button
- Semua props dari ActionButton

### Contoh Penggunaan
```tsx
import { ActionButton, IconButton } from '@/components/panels';

// ActionButton dengan custom content
<ActionButton
  onClick={handleClick}
  variant="default"
  icon={<Plus className="w-4 h-4" />}
>
  Tambah Baru
</ActionButton>

// IconButton dengan predefined action
<IconButton
  action="edit"
  onClick={() => handleEdit(item.id)}
  tooltip="Edit item"
/>

<IconButton
  action="delete"
  onClick={() => handleDelete(item.id)}
  variant="destructive"
  tooltip="Hapus item"
/>
```

## TableActions

Komponen untuk menampilkan aksi dalam tabel dengan berbagai variant.

### Props
- `actions: TableAction[]` - Array aksi yang akan ditampilkan
- `variant?: 'buttons' | 'dropdown' | 'mixed'` - Variant tampilan (default: 'dropdown')
- `showLabels?: boolean` - Tampilkan label (default: false)
- `size?: 'sm' | 'md' | 'lg'` - Ukuran button (default: 'sm')
- `className?: string` - Class CSS tambahan

### TableAction Interface
```tsx
interface TableAction {
  label: string;
  action: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
  separator?: boolean;
}
```

### Contoh Penggunaan
```tsx
import { TableActions } from '@/components/panels';

<TableActions
  actions={[
    {
      label: 'Edit',
      action: 'edit',
      onClick: () => handleEdit(item.id)
    },
    {
      label: 'Hapus',
      action: 'delete',
      onClick: () => handleDelete(item.id),
      variant: 'destructive',
      separator: true
    },
    {
      label: 'Download',
      action: 'download',
      onClick: () => handleDownload(item.id)
    }
  ]}
  variant="dropdown"
  size="sm"
/>
```

## Cara Import

```tsx
// Import individual component
import { YearSelectorPanel } from '@/components/panels/YearSelectorPanel';

// Import from index
import { 
  YearSelectorPanel, 
  StatsPanel, 
  PageHeaderPanel, 
  EmptyStatePanel,
  ConfirmDialog,
  FormDialog,
  ActionButton,
  IconButton,
  TableActions
} from '@/components/panels';
``` 