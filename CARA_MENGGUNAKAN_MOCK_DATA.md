# Cara Menggunakan Mock Data - Panduan Lengkap

## 🚀 Cara Menjalankan Script Generate Mock Data

### Langkah 1: Pastikan Python Terinstall

Cek apakah Python sudah terinstall:
```bash
python --version
```

Jika belum terinstall, download dari [python.org](https://www.python.org/downloads/)

### Langkah 2: Jalankan Script Generate Data

Buka terminal/command prompt di folder project, lalu jalankan:

```bash
python generate_mock_data.py
```

**Atau jika menggunakan Python 3:**
```bash
python3 generate_mock_data.py
```

**Output yang diharapkan:**
```
============================================================
Generating Comprehensive Mock Data for Document Hub GCG
============================================================

Generating GCG Data...
[OK] Generated 445 GCG data rows -> data\config\gcg-assessments-mock.csv
Generating Users...
[OK] Generated 12 new users, total 15 users -> data\config\users.csv
Generating Checklist Assignments...
[OK] Generated 98 new checklist items, total 665 -> data\config\checklist.csv
Generating AOI Data...
[OK] Generated 19 AOI tables -> data\config\aoi-tables.csv
[OK] Generated 103 AOI recommendations -> data\config\aoi-recommendations.csv
Generating Document Metadata...
[OK] Generated 303 document metadata -> data\config\document-metadata-mock.json

============================================================
[OK] Mock Data Generation Complete!
============================================================
```

### Langkah 3: Verifikasi File yang Dihasilkan

Setelah script selesai, cek folder `data/config/`:

```
data/config/
├── gcg-assessments-mock.csv      ✅
├── users.csv                     ✅
├── checklist.csv                 ✅
├── aoi-tables.csv               ✅
├── aoi-recommendations.csv      ✅
└── document-metadata-mock.json  ✅
```

---

## 📥 Cara Import Data ke Aplikasi

### Opsi 1: Import via Aplikasi (Recommended)

#### A. Import GCG Data

1. **Jalankan aplikasi:**
   ```bash
   # Terminal 1: Backend
   cd backend
   python start_api.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Login sebagai Super Admin:**
   - Email: `admin@posindo.id`
   - Password: `admin123`

3. **Buka halaman Penilaian GCG:**
   - Klik menu "Penilaian GCG" di sidebar
   - Atau akses langsung: `http://localhost:5173/penilaian-gcg`

4. **Upload File GCG:**
   - Klik tombol "Upload File" atau "Import Data"
   - Pilih file `data/config/gcg-assessments-mock.csv`
   - **ATAU** convert CSV ke Excel terlebih dahulu:
     - Buka CSV di Excel
     - Save As → Excel Workbook (.xlsx)
     - Upload file Excel tersebut

#### B. Import Users

1. **Buka Admin Panel:**
   - Login sebagai Super Admin
   - Klik menu "Pengaturan" → "Kelola Akun"

2. **Import Users:**
   - Klik tombol "Import Users" atau "Tambah User"
   - Upload file `data/config/users.csv`
   - Atau tambah manual satu per satu menggunakan data dari CSV

#### C. Import Checklist

1. **Buka Checklist Management:**
   - Login sebagai Super Admin
   - Klik menu "Checklist" atau "Pengaturan" → "Checklist"

2. **Import Checklist:**
   - Klik tombol "Import Checklist"
   - Upload file `data/config/checklist.csv`
   - Data akan otomatis ter-import

#### D. Import AOI Data

1. **Buka AOI Management:**
   - Login sebagai Super Admin
   - Klik menu "AOI Management" atau "Area of Improvement"

2. **Import AOI Tables:**
   - Klik "Import AOI Tables"
   - Upload file `data/config/aoi-tables.csv`

3. **Import AOI Recommendations:**
   - Klik "Import Recommendations"
   - Upload file `data/config/aoi-recommendations.csv`

### Opsi 2: Import via Backend API (Advanced)

Jika backend API mendukung import langsung:

```bash
# Import GCG Data
curl -X POST http://localhost:5000/api/gcg/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @data/config/gcg-assessments-mock.csv

# Import Users
curl -X POST http://localhost:5000/api/users/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @data/config/users.csv
```

### Opsi 3: Import via Database (Jika menggunakan SQL)

Jika aplikasi menggunakan database SQL, bisa import langsung:

```sql
-- Contoh untuk PostgreSQL
COPY gcg_assessments FROM 'data/config/gcg-assessments-mock.csv' WITH CSV HEADER;

COPY users FROM 'data/config/users.csv' WITH CSV HEADER;
```

---

## 🔄 Regenerate Data (Jika Perlu)

Jika ingin generate data baru dengan variasi berbeda:

```bash
# Backup data lama (opsional)
cp -r data/config data/config_backup

# Generate data baru
python generate_mock_data.py
```

**Catatan:** Script akan overwrite file yang ada, jadi backup dulu jika perlu.

---

## ✅ Verifikasi Data Sudah Ter-import

### 1. Cek Dashboard

1. Buka halaman Dashboard
2. Pilih tahun (misalnya 2024)
3. Pastikan chart GCG menampilkan data
4. Pastikan statistik terisi

### 2. Cek Penilaian GCG

1. Buka halaman "Penilaian GCG"
2. Pastikan chart menampilkan data untuk multiple years
3. Klik tahun untuk melihat detail aspek
4. Pastikan semua 6 aspek (I-VI) terisi data

### 3. Cek User Management

1. Buka "Pengaturan" → "Kelola Akun"
2. Pastikan ada multiple users
3. Cek users dengan berbagai divisi

### 4. Cek Checklist

1. Buka halaman Checklist atau Admin Dashboard
2. Pilih tahun
3. Pastikan checklist items terisi
4. Pastikan ada assignments ke berbagai divisi

### 5. Cek AOI Management

1. Buka "AOI Management"
2. Pastikan ada AOI tables
3. Pastikan ada recommendations untuk setiap table

---

## 🐛 Troubleshooting

### Problem: Script tidak jalan

**Solusi:**
```bash
# Cek Python version
python --version

# Install dependencies jika perlu
pip install pathlib

# Jalankan dengan full path
python "d:\000 dokumen\002 magang\001 project\000 demo\document-hub-penilaian-gcg\generate_mock_data.py"
```

### Problem: File tidak ter-generate

**Solusi:**
- Pastikan folder `data/config/` ada
- Cek permission folder (harus bisa write)
- Cek disk space

### Problem: Data tidak muncul di aplikasi

**Solusi:**
1. **Pastikan backend running:**
   ```bash
   cd backend
   python start_api.py
   ```

2. **Cek database connection:**
   - Pastikan database terhubung
   - Cek connection string di `backend/src/config/database.ts`

3. **Clear cache:**
   - Clear browser cache
   - Restart backend server
   - Restart frontend dev server

4. **Cek format file:**
   - Pastikan CSV menggunakan UTF-8 encoding
   - Pastikan field names sesuai dengan yang diharapkan

### Problem: Import gagal

**Solusi:**
1. **Cek format CSV:**
   - Buka dengan text editor
   - Pastikan encoding UTF-8
   - Pastikan tidak ada karakter aneh

2. **Cek field names:**
   - Bandingkan dengan struktur di `src/types/`
   - Pastikan semua field required ada

3. **Cek log error:**
   - Buka browser console (F12)
   - Cek backend logs
   - Cari error message

---

## 📝 Quick Start (TL;DR)

```bash
# 1. Generate data
python generate_mock_data.py

# 2. Start aplikasi
cd backend && python start_api.py  # Terminal 1
npm run dev                          # Terminal 2

# 3. Login sebagai superadmin
# Email: admin@posindo.id
# Password: admin123

# 4. Import data via aplikasi
# - Buka Penilaian GCG → Upload file gcg-assessments-mock.csv
# - Buka Pengaturan → Import users.csv
# - Buka Checklist → Import checklist.csv
# - Buka AOI Management → Import aoi-tables.csv dan aoi-recommendations.csv

# 5. Verifikasi
# - Cek Dashboard → Pastikan ada data
# - Cek Chart GCG → Pastikan menampilkan multiple years
# - Cek semua komponen → Pastikan terisi data
```

---

## 🎯 Tips

1. **Backup Data Sebelum Import:**
   - Backup database atau file CSV yang ada
   - Jika ada data penting, jangan langsung overwrite

2. **Test dengan Data Kecil Dulu:**
   - Import 1-2 tahun data dulu
   - Test apakah format sesuai
   - Baru import semua data

3. **Gunakan Excel untuk Review:**
   - Buka CSV di Excel untuk review data
   - Pastikan data terlihat benar
   - Baru import ke aplikasi

4. **Document Screenshots:**
   - Ambil screenshot setelah import
   - Dokumentasikan hasil untuk reference

---

## 📞 Butuh Bantuan?

Jika masih ada masalah:
1. Cek file `MOCK_DATA_README.md` untuk dokumentasi lengkap
2. Cek file `RINGKASAN_MOCK_DATA.md` untuk ringkasan
3. Review error messages di console/logs
4. Pastikan semua dependencies terinstall

---

**Selamat menggunakan mock data! 🎉**


