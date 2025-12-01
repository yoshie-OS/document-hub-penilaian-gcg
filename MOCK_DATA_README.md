# Mock Data untuk Dokumentasi Aplikasi Document Hub Penilaian GCG

## Overview

Script ini menghasilkan data mock yang lengkap untuk mengisi aplikasi dengan data yang realistis untuk keperluan dokumentasi. Data yang dihasilkan mencakup:

1. **GCG Assessment Data** - Data penilaian GCG untuk tahun 2014-2025 dengan semua 6 aspek
2. **Users** - User admin untuk berbagai divisi
3. **Checklist Assignments** - Checklist items untuk multiple years
4. **AOI Tables & Recommendations** - Area of Improvement data
5. **Document Metadata** - Metadata dokumen untuk dashboard

## Cara Menggunakan

### 1. Generate Mock Data

Jalankan script Python untuk generate semua data mock:

```bash
python generate_mock_data.py
```

Script akan menghasilkan file-file berikut di folder `data/config/`:

- `gcg-assessments-mock.csv` - Data penilaian GCG (445 rows)
- `users.csv` - Data users (15 users)
- `checklist.csv` - Checklist items (665 items)
- `aoi-tables.csv` - AOI tables (19 tables)
- `aoi-recommendations.csv` - AOI recommendations (103 recommendations)
- `document-metadata-mock.json` - Document metadata (303 documents)

### 2. Import Data ke Aplikasi

#### GCG Assessment Data

Data GCG dapat diimport melalui:

1. **File Upload di Halaman Penilaian GCG**
   - Buka halaman "Penilaian GCG"
   - Upload file Excel yang sesuai format
   - Atau gunakan file CSV yang sudah di-generate

2. **Backend API** (jika tersedia)
   - Import melalui endpoint `/api/gcg/import`
   - Atau langsung insert ke database

#### Users

Users dapat ditambahkan melalui:

1. **Admin Panel**
   - Login sebagai superadmin
   - Buka menu "Pengaturan" > "Kelola Akun"
   - Tambah user baru atau import dari CSV

2. **Backend API**
   - POST ke `/api/users` dengan data dari `users.csv`

#### Checklist Items

Checklist items dapat diimport melalui:

1. **Admin Panel**
   - Login sebagai superadmin
   - Buka menu "Checklist Management"
   - Import dari CSV atau tambah manual

2. **Backend API**
   - POST ke `/api/checklists` dengan data dari `checklist.csv`

#### AOI Data

AOI Tables dan Recommendations dapat diimport melalui:

1. **Admin Panel**
   - Login sebagai superadmin
   - Buka menu "AOI Management"
   - Import atau tambah manual

2. **Backend API**
   - POST ke `/api/aoiTables` dan `/api/aoiRecommendations`

## Struktur Data

### GCG Assessment Data Format

File `gcg-assessments-mock.csv` memiliki format:

```csv
Tahun,Level,Section,Deskripsi,Bobot,Skor,Capaian,Jumlah_Parameter,Penjelasan,Penilai,Jenis_Penilaian
2024,1,I,ASPEK I. Komitmen...,20,0,0,0,Header untuk...,PT. KAP Audit Indonesia,Self Assessment
2024,2,I,Detail 1 untuk Aspek I,6.67,4.2,63.0,6,Penjelasan detail...,PT. KAP Audit Indonesia,Self Assessment
2024,3,I,Subtotal Aspek I,20,12.5,62.5,20,Total capaian...,PT. KAP Audit Indonesia,Self Assessment
2024,4,,TOTAL,100,75.5,75.5,120,Total skor GCG...,PT. KAP Audit Indonesia,Self Assessment
```

**Levels:**
- Level 1: Header untuk setiap aspek
- Level 2: Detail penjelasan (multiple rows per aspek)
- Level 3: Subtotal per aspek (I-VI)
- Level 4: Total keseluruhan

### Users Format

File `users.csv` memiliki format:

```csv
id,name,email,password,role,direktorat,subdirektorat,divisi,status,tahun,created_at,is_active,whatsapp
1001,Admin Regulation 1,admin.divisi.regulation.1@posindo.id,admin123,admin,Corporate Secretary and ESG,Corporate Secretary and ESG,Divisi Regulation,active,,2025-01-20T10:00:00,1,628112345678
```

### Checklist Format

File `checklist.csv` memiliki format:

```csv
id,aspek,deskripsi,pic,tahun,rowNumber,created_at
2024001,ASPEK I. Komitmen...,Pedoman Tata Kelola...,Divisi Regulation,2024,1,2025-01-20T10:00:00
```

### AOI Tables Format

File `aoi-tables.csv` memiliki format:

```csv
id,nama,tahun,targetType,targetDirektorat,targetSubdirektorat,targetDivisi,createdAt,status
1000,AOI GCG 2024 - Corporate Secretary...,2024,divisi,Corporate Secretary and ESG,Corporate Secretary and ESG,Divisi Regulation,2025-01-20T10:00:00,active
```

### AOI Recommendations Format

File `aoi-recommendations.csv` memiliki format:

```csv
id,aoiTableId,jenis,no,isi,tingkatUrgensi,aspekAOI,pihakTerkait,organPerusahaan,createdAt,status
10000,1000,REKOMENDASI,1,Perlu dilakukan peningkatan...,TINGGI,I,DIREKSI,DIREKSI,2025-01-20T10:00:00,active
```

## Data yang Dihasilkan

### GCG Data (2014-2025)
- **445 rows** data penilaian GCG
- Mencakup semua 6 aspek (I-VI)
- Data untuk 12 tahun (2014-2025)
- Trend peningkatan skor dari tahun ke tahun
- Variasi penilai dan jenis penilaian

### Users
- **15 users** total (3 existing + 12 new)
- Admin users untuk berbagai divisi
- Credentials: email sesuai format, password: `admin123`

### Checklist
- **665 items** total
- Checklist untuk tahun 2020-2025
- Assignments ke berbagai divisi
- Mencakup semua aspek GCG

### AOI Data
- **19 AOI tables** untuk tahun 2020-2025
- **103 recommendations** dengan berbagai tingkat urgensi
- Target berbagai level organisasi (direktorat, subdirektorat, divisi)

### Document Metadata
- **303 documents** untuk berbagai divisi dan tahun
- Status: completed, pending, in_progress
- Mencakup semua aspek GCG

## Tips untuk Dokumentasi

1. **Screenshot Dashboard**
   - Setelah import data, dashboard akan terlihat penuh dengan data
   - Ambil screenshot untuk dokumentasi

2. **Test Semua Fitur**
   - Test upload dokumen
   - Test filter dan search
   - Test chart dan visualisasi
   - Test AOI management

3. **Generate Reports**
   - Export data ke Excel
   - Generate laporan GCG
   - Test semua fitur reporting

## Troubleshooting

### Data tidak muncul di aplikasi

1. **Pastikan backend running**
   ```bash
   cd backend
   python start_api.py
   ```

2. **Check database connection**
   - Pastikan database sudah terhubung
   - Check connection string di `backend/src/config/database.ts`

3. **Clear cache**
   - Clear browser cache
   - Restart backend server

### Format data tidak sesuai

1. **Check CSV encoding**
   - Pastikan file menggunakan UTF-8 encoding
   - Buka dengan text editor dan save as UTF-8

2. **Check field names**
   - Pastikan field names sesuai dengan yang diharapkan aplikasi
   - Check di `src/types/` untuk struktur data yang benar

## Catatan Penting

- Data ini adalah **mock data** untuk dokumentasi
- **Jangan gunakan** untuk production
- Password default: `admin123` (ubah untuk production)
- Data di-generate dengan random values, mungkin perlu adjustment manual

## Support

Jika ada masalah dengan mock data:
1. Check log output dari script
2. Verify file format sesuai dokumentasi
3. Check backend API logs
4. Review aplikasi console untuk error messages


