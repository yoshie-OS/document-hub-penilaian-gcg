# MANUAL BOOK APLIKASI GOOD CORPORATE GOVERNANCE (GCG) DOCUMENTS MANAGEMENT SYSTEM

## DAFTAR ISI
1. [Pendahuluan](#pendahuluan)
2. [Struktur Aplikasi](#struktur-aplikasi)
3. [Login dan Autentikasi](#login-dan-autentikasi)
4. [Menu Super Admin](#menu-super-admin)
5. [Menu Admin](#menu-admin)
6. [Fitur Umum](#fitur-umum)
7. [Troubleshooting](#troubleshooting)

---

## PENDAHULUAN

### Deskripsi Aplikasi
Aplikasi Good Corporate Governance (GCG) Documents Management System adalah sistem manajemen dokumen yang dirancang untuk mengelola dokumen-dokumen terkait tata kelola perusahaan yang baik. Aplikasi ini memiliki dua level pengguna utama:
- **Super Admin**: Memiliki akses penuh ke semua fitur dan pengaturan sistem
- **Admin**: Memiliki akses terbatas untuk mengelola dokumen sesuai dengan direktorat/subdirektorat yang ditugaskan

### Tujuan Manual
Manual ini dibuat untuk membantu pengguna memahami cara menggunakan aplikasi GCG secara efektif dan efisien.

---

## STRUKTUR APLIKASI

### Hierarki Pengguna
```
Super Admin (Level Tertinggi)
├── Pengaturan Baru
├── Dashboard
├── Monitoring & Upload GCG
├── Arsip Dokumen
├── Performa GCG
└── AOI Management

Admin (Level Menengah)
└── Dashboard

User (Level Dasar)
└── Dashboard
```

### Fitur Utama
- Manajemen dokumen GCG
- Monitoring upload dokumen
- Pengaturan aspek dan checklist
- Manajemen AOI (Area of Improvement)
- Arsip dokumen
- Dashboard statistik

---

## LOGIN DAN AUTENTIKASI

### Langkah Login
1. **Buka Browser** dan akses URL aplikasi
2. **Halaman Login** akan muncul
3. **Masukkan kredensial**:
   - Email/Username
   - Password
4. **Klik tombol "Login"**
5. **Sistem akan memverifikasi** dan mengarahkan ke dashboard sesuai role

### Placeholder Gambar
**[GAMBAR: Halaman Login - Tampilkan form login dengan field email dan password]**

### Catatan Keamanan
- Jangan bagikan kredensial login
- Logout setelah selesai menggunakan aplikasi
- Gunakan password yang kuat

---

## MENU SUPER ADMIN

### 1. PENGATURAN BARU

#### Deskripsi
Menu ini berfungsi untuk mengatur konfigurasi dasar sistem, termasuk manajemen tahun buku, struktur perusahaan, dan checklist GCG.

#### Fitur Utama
- **Manajemen Tahun Buku**: Menambah, mengedit, dan menghapus tahun buku
- **Struktur Perusahaan**: Mengatur hierarki direktorat, subdirektorat, dan divisi
- **Checklist GCG**: Membuat dan mengatur checklist dokumen yang diperlukan
- **Manajemen Aspek**: Mengatur aspek-aspek GCG yang akan dimonitor

#### Langkah Penggunaan

##### A. Manajemen Tahun Buku
1. **Klik menu "Pengaturan Baru"**
2. **Pilih tab "Tahun Buku"**
3. **Untuk menambah tahun baru**:
   - Klik tombol "Tambah Tahun Baru"
   - Masukkan tahun (contoh: 2024)
   - Klik "Simpan"
4. **Untuk mengedit tahun**:
   - Klik ikon edit pada tahun yang ingin diubah
   - Ubah tahun sesuai kebutuhan
   - Klik "Simpan"
5. **Untuk menghapus tahun**:
   - Klik ikon hapus pada tahun yang ingin dihapus
   - Konfirmasi penghapusan

##### B. Struktur Perusahaan
1. **Pilih tab "Struktur Perusahaan"**
2. **Manajemen Direktorat**:
   - Klik "Tambah Direktorat" untuk menambah direktorat baru
   - Isi nama direktorat dan tahun aktif
   - Klik "Simpan"
3. **Manajemen Subdirektorat**:
   - Pilih direktorat dari dropdown
   - Klik "Tambah Subdirektorat"
   - Isi nama subdirektorat
   - Klik "Simpan"
4. **Manajemen Divisi**:
   - Pilih subdirektorat dari dropdown
   - Klik "Tambah Divisi"
   - Isi nama divisi
   - Klik "Simpan"

##### C. Checklist GCG
1. **Pilih tab "Checklist GCG"**
2. **Untuk menambah checklist baru**:
   - Klik "Tambah Checklist"
   - Pilih tahun buku
   - Pilih aspek GCG
   - Isi deskripsi checklist
   - Klik "Simpan"
3. **Untuk mengedit checklist**:
   - Klik ikon edit pada checklist yang ingin diubah
   - Ubah informasi sesuai kebutuhan
   - Klik "Simpan"
4. **Untuk menghapus checklist**:
   - Klik ikon hapus pada checklist yang ingin dihapus
   - Konfirmasi penghapusan

#### Placeholder Gambar
**[GAMBAR: Halaman Pengaturan Baru - Tampilkan 4 tab utama: Tahun Buku, Struktur Perusahaan, Checklist GCG, dan Manajemen Aspek]**

**[GAMBAR: Tab Tahun Buku - Tampilkan tabel tahun buku dengan tombol tambah, edit, dan hapus]**

**[GAMBAR: Tab Struktur Perusahaan - Tampilkan hierarki direktorat, subdirektorat, dan divisi]**

**[GAMBAR: Tab Checklist GCG - Tampilkan tabel checklist dengan tombol tambah, edit, dan hapus]**

### 2. DASHBOARD

#### Deskripsi
Dashboard Super Admin menampilkan overview statistik dan performa sistem secara keseluruhan.

#### Fitur Utama
- **Statistik Dokumen**: Total dokumen, dokumen selesai, dan dokumen pending
- **Grafik Performa**: Visualisasi data dalam bentuk chart dan grafik
- **Trend Bulanan**: Perkembangan upload dokumen per bulan
- **Spider Chart**: Radar chart untuk aspek GCG

#### Langkah Penggunaan
1. **Klik menu "Dashboard"**
2. **Pilih tahun buku** dari dropdown tahun
3. **Lihat statistik** yang ditampilkan
4. **Analisis grafik** untuk memahami trend dan performa

#### Placeholder Gambar
**[GAMBAR: Dashboard Super Admin - Tampilkan statistik dokumen, grafik performa, dan chart]**

### 3. MONITORING & UPLOAD GCG

#### Deskripsi
Menu ini berfungsi untuk memonitor status upload dokumen GCG dari berbagai subdirektorat dan melakukan upload dokumen.

#### Fitur Utama
- **Monitoring Status**: Melihat status upload dokumen per subdirektorat
- **Upload Dokumen**: Mengunggah dokumen GCG
- **Filter dan Pencarian**: Mencari dokumen berdasarkan kriteria tertentu
- **Download Dokumen**: Mengunduh dokumen yang telah diupload

#### Langkah Penggunaan

##### A. Monitoring Status
1. **Klik menu "Monitoring & Upload GCG"**
2. **Pilih tahun buku** dari dropdown
3. **Lihat tabel status** dokumen per subdirektorat
4. **Gunakan filter** untuk melihat dokumen berdasarkan:
   - Aspek GCG
   - Status (Selesai/Pending)
   - Subdirektorat
5. **Gunakan pencarian** untuk mencari dokumen tertentu

##### B. Upload Dokumen
1. **Klik tombol "Upload Dokumen"** pada checklist yang ingin diupload
2. **Pilih file** dokumen yang akan diupload
3. **Pastikan format file** sesuai (PDF, DOC, DOCX)
4. **Klik "Upload"**
5. **Tunggu proses upload** selesai
6. **Konfirmasi upload** berhasil

##### C. Download Dokumen
1. **Klik ikon download** pada dokumen yang ingin diunduh
2. **Pilih lokasi penyimpanan** di komputer
3. **Konfirmasi download**

#### Placeholder Gambar
**[GAMBAR: Halaman Monitoring & Upload GCG - Tampilkan tabel status dokumen dengan tombol upload dan download]**

**[GAMBAR: Dialog Upload Dokumen - Tampilkan form upload file dengan tombol browse dan upload]**

### 4. ARSIP DOKUMEN

#### Deskripsi
Menu ini berfungsi untuk mengarsipkan dan mengelola dokumen GCG yang telah diupload.

#### Fitur Utama
- **Arsip Dokumen**: Menyimpan dokumen dalam arsip terorganisir
- **Pencarian Arsip**: Mencari dokumen dalam arsip
- **Filter Arsip**: Menyaring dokumen berdasarkan kriteria
- **Download Arsip**: Mengunduh dokumen dari arsip

#### Langkah Penggunaan
1. **Klik menu "Arsip Dokumen"**
2. **Pilih tahun buku** dari dropdown
3. **Gunakan filter** untuk menyaring dokumen:
   - Direktorat
   - Subdirektorat
   - Aspek GCG
4. **Gunakan pencarian** untuk mencari dokumen tertentu
5. **Klik ikon download** untuk mengunduh dokumen
6. **Lihat detail dokumen** dengan mengklik nama file

#### Placeholder Gambar
**[GAMBAR: Halaman Arsip Dokumen - Tampilkan tabel arsip dengan filter dan tombol download]**

### 5. PERFORMA GCG

#### Deskripsi
Menu ini menampilkan analisis performa GCG dalam bentuk grafik dan statistik.

#### Fitur Utama
- **Grafik Performa**: Visualisasi performa GCG
- **Statistik Detail**: Data statistik yang mendalam
- **Analisis Trend**: Analisis perkembangan performa

#### Langkah Penggunaan
1. **Klik menu "Performa GCG"**
2. **Pilih periode** yang ingin dianalisis
3. **Lihat grafik** dan statistik yang ditampilkan
4. **Analisis trend** dan performa

#### Placeholder Gambar
**[GAMBAR: Halaman Performa GCG - Tampilkan grafik performa dan statistik detail]**

### 6. AOI MANAGEMENT

#### Deskripsi
Menu ini berfungsi untuk mengelola Area of Improvement (AOI) dan rekomendasi perbaikan.

#### Fitur Utama
- **Manajemen AOI**: Membuat dan mengelola tabel AOI
- **Rekomendasi**: Menambah dan mengelola rekomendasi perbaikan
- **Tracking**: Melacak status implementasi rekomendasi
- **Prioritas**: Mengatur tingkat prioritas rekomendasi

#### Langkah Penggunaan

##### A. Manajemen Tabel AOI
1. **Klik menu "AOI Management"**
2. **Pilih tahun buku** dari dropdown
3. **Untuk menambah tabel AOI baru**:
   - Klik "Tambah Tabel AOI"
   - Isi deskripsi tabel
   - Pilih target direktorat, subdirektorat, dan divisi
   - Klik "Simpan"
4. **Untuk mengedit tabel**:
   - Klik ikon edit pada tabel yang ingin diubah
   - Ubah informasi sesuai kebutuhan
   - Klik "Simpan"
5. **Untuk menghapus tabel**:
   - Klik ikon hapus pada tabel yang ingin dihapus
   - Konfirmasi penghapusan

##### B. Manajemen Rekomendasi
1. **Klik pada tabel AOI** yang ingin dikelola
2. **Untuk menambah rekomendasi**:
   - Klik "Tambah Rekomendasi"
   - Isi detail rekomendasi:
     - Nomor urut
     - Jenis (Rekomendasi/Saran)
     - Deskripsi rekomendasi
     - Pihak terkait
     - Tingkat urgensi (1-5)
     - Jangka waktu
   - Klik "Simpan"
3. **Untuk mengedit rekomendasi**:
   - Klik ikon edit pada rekomendasi yang ingin diubah
   - Ubah informasi sesuai kebutuhan
   - Klik "Simpan"
4. **Untuk menghapus rekomendasi**:
   - Klik ikon hapus pada rekomendasi yang ingin dihapus
   - Konfirmasi penghapusan

#### Placeholder Gambar
**[GAMBAR: Halaman AOI Management - Tampilkan tabel AOI dengan tombol tambah, edit, dan hapus]**

**[GAMBAR: Dialog Tambah Rekomendasi - Tampilkan form rekomendasi dengan field lengkap]**

---

## MENU ADMIN

### 1. DASHBOARD ADMIN

#### Deskripsi
Dashboard Admin menampilkan informasi dan statistik dokumen sesuai dengan subdirektorat yang ditugaskan.

#### Fitur Utama
- **Statistik Pribadi**: Statistik dokumen yang diupload oleh admin
- **Daftar Dokumen**: Daftar dokumen yang telah diupload
- **Upload Dokumen**: Fitur untuk mengupload dokumen baru
- **Progress Tracking**: Melacak progress upload dokumen

#### Langkah Penggunaan
1. **Klik menu "Dashboard"** (akan otomatis ke Dashboard Admin)
2. **Pilih tahun buku** dari dropdown tahun
3. **Lihat statistik** dokumen pribadi
4. **Upload dokumen baru** dengan mengklik tombol "Upload Dokumen"
5. **Lihat daftar dokumen** yang telah diupload
6. **Download dokumen** jika diperlukan

#### Placeholder Gambar
**[GAMBAR: Dashboard Admin - Tampilkan statistik pribadi, tombol upload, dan daftar dokumen]**

**[GAMBAR: Dialog Upload Dokumen Admin - Tampilkan form upload dengan pilihan checklist]**

---

## FITUR UMUM

### 1. MANAJEMEN PROFIL

#### Langkah Penggunaan
1. **Klik nama pengguna** di pojok kanan atas
2. **Pilih "Profil"** dari dropdown menu
3. **Edit informasi** yang diperlukan
4. **Klik "Simpan"** untuk menyimpan perubahan

#### Placeholder Gambar
**[GAMBAR: Menu Profil - Tampilkan dropdown menu dengan opsi profil, pengaturan, dan logout]**

### 2. LOGOUT

#### Langkah Penggunaan
1. **Klik nama pengguna** di pojok kanan atas
2. **Pilih "Logout"** dari dropdown menu
3. **Konfirmasi logout**
4. **Sistem akan mengarahkan** ke halaman login

### 3. RESPONSIVE DESIGN

#### Fitur Mobile
- **Sidebar Collapsible**: Sidebar dapat di-collapse di layar kecil
- **Touch Friendly**: Tombol dan menu yang mudah disentuh
- **Adaptive Layout**: Layout yang menyesuaikan ukuran layar

#### Fitur Desktop
- **Full Sidebar**: Sidebar selalu terbuka di layar besar
- **Hover Effects**: Efek hover pada tombol dan menu
- **Keyboard Navigation**: Navigasi menggunakan keyboard

---

## TROUBLESHOOTING

### Masalah Umum dan Solusi

#### 1. Tidak Bisa Login
**Gejala**: Error saat memasukkan username/password
**Solusi**:
- Pastikan username dan password benar
- Periksa koneksi internet
- Clear cache browser
- Hubungi administrator sistem

#### 2. File Upload Gagal
**Gejala**: File tidak bisa diupload
**Solusi**:
- Periksa ukuran file (maksimal 10MB)
- Pastikan format file didukung (PDF, DOC, DOCX)
- Periksa koneksi internet
- Coba upload file lain

#### 3. Halaman Tidak Muncul
**Gejala**: Halaman kosong atau error
**Solusi**:
- Refresh halaman (F5)
- Clear cache browser
- Periksa koneksi internet
- Logout dan login kembali

#### 4. Data Tidak Terupdate
**Gejala**: Perubahan data tidak muncul
**Solusi**:
- Refresh halaman
- Periksa tahun buku yang dipiliheu
- Logout dan login kembali
- Hubungi administrator sistem

### Kontak Support
Jika mengalami masalah yang tidak dapat diselesaikan:
- **Email**: support@gcg-system.com
- **Telepon**: (021) 1234-5678
- **WhatsApp**: +62 812-3456-7890

---

## KESIMPULAN

Manual book ini telah menjelaskan secara lengkap cara menggunakan aplikasi GCG Documents Management System. Pengguna diharapkan dapat:

1. **Memahami struktur** aplikasi dan hierarki pengguna
2. **Menggunakan fitur** sesuai dengan role yang dimiliki
3. **Mengelola dokumen** GCG secara efektif
4. **Memecahkan masalah** umum yang mungkin terjadi

### Tips Penggunaan
- **Baca manual** sebelum menggunakan aplikasi
- **Simpan dokumen** secara teratur
- **Backup data** penting secara berkala
- **Update password** secara berkala
- **Logout** setelah selesai menggunakan aplikasi

### Update Manual
Manual ini akan diupdate secara berkala sesuai dengan perkembangan aplikasi. Pastikan selalu menggunakan versi manual yang terbaru.

---

**Dibuat oleh**: Tim Pengembangan Aplikasi GCG  
**Versi**: 1.0  
**Tanggal**: Desember 2024  
**Status**: Final

