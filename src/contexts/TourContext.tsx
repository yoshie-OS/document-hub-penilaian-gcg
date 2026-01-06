import React, { createContext, useContext, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';

interface TourContextType {
  startTour: (pageName: string) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

// Tour steps untuk setiap halaman dan role
export const TOUR_STEPS: Record<string, Record<string, Step[]>> = {
  dashboard: {
    superadmin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat data dan dokumen GCG pada tahun tersebut.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="stats-cards"]',
        content: 'Statistik menampilkan ringkasan dokumen yang telah diupload, total dokumen required, progress keseluruhan, dan jumlah subdirektorat aktif.',
      },
      {
        target: '[data-tour="performance-chart"]',
        content: 'Grafik menampilkan progress dokumen per aspek GCG. Klik pada aspek untuk melihat detail.',
      },
      {
        target: '[data-tour="progress-chart"]',
        content: 'Progres Pengerjaan: menampilkan progress pengerjaan dokumen GCG per subdirektorat dalam bentuk line chart. Chart ini memvisualisasikan persentase penyelesaian dokumen untuk setiap subdirektorat.',
      },
      {
        target: '[data-tour="progress-controls"]',
        content: 'Kontrol tampilan: klik "Fokus" untuk melihat satu subdirektorat dengan animasi otomatis bergantian, atau klik "Tampilkan semua" untuk melihat semua subdirektorat secara bersamaan.',
      },
      {
        target: '[data-tour="progress-legend"]',
        content: 'Legend chart: pemetaan singkatan (abbreviation) ke nama lengkap subdirektorat. Hover pada nama untuk melihat nama lengkap.',
      },
      {
        target: '[data-tour="progress-breakdown"]',
        content: 'Breakdown Penugasan Subdirektorat: menampilkan detail progress setiap subdirektorat dengan informasi jumlah dokumen yang sudah diselesaikan, target dokumen, persentase penyelesaian, dan status (completed/in progress/pending).',
      },
      {
        target: '[data-tour="progress-expand-divisi"]',
        content: 'Tombol "Lihat Detail": klik untuk expand dan melihat breakdown progress per divisi yang berada di bawah subdirektorat. Klik "Sembunyikan" untuk collapse kembali.',
      },
    ],
    admin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat progress dokumen Anda.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="stats-cards"]',
        content: 'Lihat ringkasan dokumen yang sudah dan belum Anda upload.',
      },
      {
        target: '[data-tour="performance-chart"]',
        content: 'Progress dokumen per aspek GCG.',
      },
      {
        target: '[data-tour="progress-chart"]',
        content: 'Progres Pengerjaan: lihat progress pengerjaan dokumen GCG untuk subdirektorat Anda.',
      },
      {
        target: '[data-tour="progress-controls"]',
        content: 'Kontrol tampilan untuk memfokuskan atau menampilkan semua subdirektorat.',
      },
      {
        target: '[data-tour="progress-legend"]',
        content: 'Legend chart menunjukkan singkatan dan nama lengkap subdirektorat.',
      },
      {
        target: '[data-tour="progress-breakdown"]',
        content: 'Breakdown detail progress subdirektorat Anda dengan informasi dokumen yang sudah diselesaikan dan target.',
      },
      {
        target: '[data-tour="progress-expand-divisi"]',
        content: 'Klik untuk melihat breakdown progress per divisi.',
      },
    ],
  },
  monitoring: {
    superadmin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat monitoring dokumen pada tahun tersebut. Tahun dengan ikon upload adalah tahun aktif untuk upload dokumen.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="progress-stats"]',
        content: 'Progress Keseluruhan: menampilkan statistik total dengan circular progress bar, menunjukkan total dokumen, jumlah yang sudah diupload, dan dokumen yang belum diupload untuk tahun yang dipilih.',
      },
      {
        target: '[data-tour="progress-per-aspek"]',
        content: 'Progress Per Aspek: visualisasi progress dokumen untuk setiap aspek GCG (Aspek 1-5). Klik pada card aspek untuk otomatis memfilter tabel dokumen di bawah berdasarkan aspek tersebut.',
      },
      {
        target: '[data-tour="search-box"]',
        content: 'Cari dokumen berdasarkan aspek atau deskripsi dokumen dengan mengetik kata kunci.',
      },
      {
        target: '[data-tour="aspek-filter"]',
        content: 'Filter dokumen berdasarkan aspek GCG (Aspek 1-5) untuk melihat dokumen spesifik per aspek.',
      },
      {
        target: '[data-tour="status-filter"]',
        content: 'Filter dokumen berdasarkan status upload: Semua (tampilkan semua), Sudah Upload (hijau), atau Belum Upload (abu-abu).',
      },
      {
        target: '[data-tour="pic-filter"]',
        content: 'Filter dokumen berdasarkan PIC (Person In Charge). Pilih tipe Divisi atau Subdirektorat, lalu gunakan pencarian untuk menemukan unit yang diinginkan.',
      },
      {
        target: '[data-tour="refresh-button"]',
        content: 'Tombol refresh: klik untuk memperbarui status file dan sinkronisasi data dengan storage. Berguna jika data belum update setelah upload atau perubahan.',
      },
      {
        target: '[data-tour="checklist-table"]',
        content: 'Tabel checklist menampilkan semua dokumen GCG dengan kolom: No, Aspek, Deskripsi, PIC, Status, File (nama dan tanggal upload), dan Aksi.',
      },
      {
        target: '[data-tour="upload-button"]',
        content: 'Tombol upload/replace (oranye/biru): klik untuk upload dokumen baru atau ganti file yang sudah ada. Anda bisa menambahkan catatan saat upload. Jika belum ada data, tombol ini mungkin belum aktif.',
      },
      {
        target: '[data-tour="download-button"]',
        content: 'Tombol download (hijau): klik untuk download dokumen yang sudah diupload. Tombol akan abu-abu (disabled) jika belum ada file yang diupload.',
      },
      {
        target: '[data-tour="view-archive"]',
        content: 'Tombol mata/eye (biru): klik untuk langsung melihat dokumen di halaman arsip dokumen. Hanya aktif jika dokumen sudah diupload.',
      },
    ],
    admin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat dokumen yang ditugaskan kepada Anda.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="progress-stats"]',
        content: 'Progress Keseluruhan: lihat statistik progress dokumen yang ditugaskan kepada Anda dengan tampilan circular progress bar.',
      },
      {
        target: '[data-tour="progress-per-aspek"]',
        content: 'Progress Per Aspek: lihat progress dokumen Anda per aspek GCG. Klik pada card aspek untuk memfilter tabel dokumen.',
      },
      {
        target: '[data-tour="search-box"]',
        content: 'Cari dokumen berdasarkan aspek atau deskripsi dengan mengetik kata kunci.',
      },
      {
        target: '[data-tour="status-filter"]',
        content: 'Filter dokumen berdasarkan status: Semua, Sudah Upload, atau Belum Upload.',
      },
      {
        target: '[data-tour="refresh-button"]',
        content: 'Tombol refresh: perbarui status file untuk memastikan data terkini.',
      },
      {
        target: '[data-tour="checklist-table"]',
        content: 'Lihat daftar dokumen yang ditugaskan kepada unit Anda. Status checklist ditampilkan dengan warna: hijau (uploaded), abu-abu (belum upload).',
      },
      {
        target: '[data-tour="upload-button"]',
        content: 'Upload dokumen sesuai dengan deskripsi checklist yang tertera. Tambahkan catatan jika diperlukan untuk memberikan penjelasan tambahan. Tombol ini akan aktif setelah ada data.',
      },
      {
        target: '[data-tour="download-button"]',
        content: 'Download dokumen yang sudah Anda upload untuk verifikasi atau keperluan lain. Tombol disabled (abu-abu) jika belum ada file.',
      },
    ],
  },
  arsip: {
    superadmin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat arsip dokumen pada tahun tersebut.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="refresh-button"]',
        content: 'Tombol Refresh Tabel: membersihkan record dokumen di database yang sudah tidak ada filenya di storage. Gunakan jika menemukan data yang tidak sinkron.',
      },
      {
        target: '[data-tour="download-all-button"]',
        content: 'Tombol Download Semua: download semua dokumen dalam format ZIP yang terorganisir per divisi/subdirektorat. File akan disimpan dalam struktur folder yang rapi.',
      },
      {
        target: '[data-tour="statistics-panel"]',
        content: 'Statistik Arsip: menampilkan ringkasan total dokumen yang diarsipkan, jumlah subdirektorat aktif, dan aspek GCG yang ter-cover. Panel ini membantu Anda melihat overview arsip dokumen secara cepat.',
      },
      {
        target: '[data-tour="upload-random"]',
        content: 'Upload dokumen lain yang tidak ada di checklist GCG. File akan disimpan di folder "Dokumen Lainnya".',
      },
      {
        target: '[data-tour="filter-aspek"]',
        content: 'Filter Aspek: pilih aspek GCG spesifik untuk melihat dokumen yang terkait dengan aspek tersebut. Pilih "Semua Aspek" untuk menampilkan semua dokumen.',
      },
      {
        target: '[data-tour="filter-pic"]',
        content: 'Filter PIC/Subdirektorat: filter dokumen berdasarkan Person In Charge atau subdirektorat yang mengupload dokumen. Tersedia juga opsi "Dokumen Lainnya" untuk dokumen tanpa struktur organisasi.',
      },
      {
        target: '[data-tour="search-filter"]',
        content: 'Cari dokumen berdasarkan nama file, deskripsi, atau uploader. Gunakan juga filter aspek dan PIC di atas untuk pencarian lebih spesifik.',
      },
      {
        target: '[data-tour="pagination-selector"]',
        content: 'Pagination: atur jumlah item yang ditampilkan per halaman. Pilih "Semua" untuk menampilkan seluruh dokumen tanpa pagination.',
      },
      {
        target: '[data-tour="document-table"]',
        content: 'Tabel arsip dokumen menampilkan semua file yang telah diupload dengan informasi: Aspek, Deskripsi, Subdirektorat, Informasi File, Tanggal Upload, dan Aksi (View, Download, Catatan).',
      },
      {
        target: '[data-tour="view-button"]',
        content: 'Tombol mata (eye): preview dokumen jika memungkinkan.',
      },
      {
        target: '[data-tour="download-doc-button"]',
        content: 'Tombol download: unduh file dengan nama asli dan format yang benar.',
      },
      {
        target: '[data-tour="catatan-button"]',
        content: 'Tombol catatan: lihat catatan yang ditambahkan saat upload dokumen.',
      },
    ],
    admin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat arsip dokumen Anda.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="statistics-panel"]',
        content: 'Statistik Arsip: lihat ringkasan dokumen yang telah Anda arsipkan.',
      },
      {
        target: '[data-tour="filter-aspek"]',
        content: 'Filter dokumen berdasarkan aspek GCG yang Anda inginkan.',
      },
      {
        target: '[data-tour="filter-pic"]',
        content: 'Filter dokumen berdasarkan PIC/subdirektorat.',
      },
      {
        target: '[data-tour="search-filter"]',
        content: 'Cari dokumen yang pernah Anda upload dengan mengetik kata kunci.',
      },
      {
        target: '[data-tour="pagination-selector"]',
        content: 'Atur jumlah dokumen yang ditampilkan per halaman.',
      },
      {
        target: '[data-tour="document-table"]',
        content: 'Daftar semua dokumen yang telah Anda upload beserta informasi lengkap: aspek, deskripsi, file, dan tanggal upload.',
      },
      {
        target: '[data-tour="download-doc-button"]',
        content: 'Download dokumen yang pernah Anda upload.',
      },
      {
        target: '[data-tour="catatan-button"]',
        content: 'Lihat catatan yang Anda tambahkan saat upload.',
      },
    ],
  },
  aoi: {
    superadmin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk mengelola AOI (Area of Improvement) pada tahun tersebut.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="create-table"]',
        content: 'Buat tabel AOI baru: masukkan nama tabel yang sesuai (contoh: "Rekomendasi Q1 2025" atau "Hasil Assessment BPKP 2025") lalu klik "Buat Tabel".',
      },
      {
        target: '[data-tour="expand-table"]',
        content: 'Klik tombol chevron (expand/collapse) untuk membuka atau menutup detail tabel AOI.',
      },
      {
        target: '[data-tour="target-org"]',
        content: 'Pilih target organisasi: pilih tingkat (Direktorat/Subdirektorat/Divisi) lalu pilih unit spesifik yang menjadi target penerima AOI. Klik "Simpan Target Organisasi" setelah memilih.',
      },
      {
        target: '[data-tour="rekomendasi-table"]',
        content: 'Tabel Rekomendasi: tambahkan rekomendasi perbaikan dengan mengisi baris baru di bagian bawah tabel. Isi deskripsi, aspek AOI, tingkat urgensi, pihak terkait, dan organ perusahaan. Klik tombol + untuk menyimpan.',
      },
      {
        target: '[data-tour="saran-table"]',
        content: 'Tabel Saran: tambahkan saran dengan cara yang sama seperti rekomendasi. Saran bersifat optional dan lebih lunak dari rekomendasi.',
      },
      {
        target: '[data-tour="edit-button"]',
        content: 'Tombol edit (pensil): klik untuk edit rekomendasi atau saran yang sudah ada. Klik tombol Save setelah selesai edit.',
      },
      {
        target: '[data-tour="delete-button"]',
        content: 'Tombol hapus (trash): klik untuk menghapus rekomendasi atau saran. Konfirmasi akan muncul sebelum data dihapus.',
      },
      {
        target: '[data-tour="delete-table"]',
        content: 'Tombol "Hapus": menghapus seluruh tabel AOI beserta semua rekomendasi dan saran di dalamnya. Gunakan dengan hati-hati.',
      },
    ],
    admin: [
      {
        target: '[data-tour="year-selector"]',
        content: 'Pilih tahun untuk melihat AOI yang ditugaskan kepada divisi Anda.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="aoi-list"]',
        content: 'Lihat daftar rekomendasi dan saran perbaikan yang ditugaskan kepada divisi Anda.',
      },
      {
        target: '[data-tour="upload-evidence"]',
        content: 'Upload bukti penyelesaian untuk setiap rekomendasi yang telah dilaksanakan. Bukti bisa berupa foto, dokumen, atau laporan.',
      },
    ],
  },
  pengaturan: {
    superadmin: [
      {
        target: '[data-tour="pengaturan-header"]',
        content: 'Selamat datang di Pengaturan Sistem! Halaman ini adalah pusat konfigurasi untuk mengelola seluruh sistem GCG Document Hub. Anda dapat mengatur tahun buku, struktur organisasi, akun pengguna, dan dokumen checklist.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="progress-pengaturan"]',
        content: 'Progress Bar Pengaturan: menampilkan seberapa lengkap konfigurasi sistem Anda. Progress dihitung berdasarkan 4 komponen utama yang sudah diatur. Target: 4/4 selesai untuk sistem yang siap digunakan.',
      },
      {
        target: '[data-tour="menu-cards"]',
        content: 'Menu Pengaturan: 4 kartu menu ini mewakili komponen utama yang perlu dikonfigurasi. Setiap kartu menampilkan status (selesai/belum) dan statistik singkat. Klik kartu untuk masuk ke halaman pengaturan detail.',
      },
      {
        target: '[data-tour="tahun-buku-card"]',
        content: 'Tahun Buku: Kelola periode tahun untuk penilaian GCG. Tambah, edit, atau hapus tahun buku yang tersedia di sistem. Setiap tahun memiliki data terpisah untuk checklist, struktur organisasi, dan dokumentasi.',
      },
      {
        target: '[data-tour="struktur-card"]',
        content: 'Struktur Organisasi: Kelola hierarki organisasi PT POS Indonesia. Atur direktorat (level tertinggi), subdirektorat, anak perusahaan, dan divisi. Struktur ini digunakan untuk assignment dokumen ke PIC.',
      },
      {
        target: '[data-tour="akun-card"]',
        content: 'Manajemen Akun: Kelola akun pengguna sistem. Tambah PIC baru dengan role Admin atau Superadmin. Maksimum 2 superadmin untuk keamanan. Setiap user harus terkait dengan struktur organisasi.',
      },
      {
        target: '[data-tour="dokumen-card"]',
        content: 'Kelola Dokumen: Kelola checklist dokumen GCG dan aspek penilaian. Upload template checklist, atur aspek (Aspek 1-5), dan tentukan requirement dokumen untuk setiap tahun buku.',
      },
      {
        target: '[data-tour="panduan-pengaturan"]',
        content: 'Panduan Setup: Ikuti urutan setup yang disarankan untuk memastikan sistem berfungsi optimal. Mulai dari Tahun Buku → Struktur Organisasi → Manajemen Akun → Kelola Dokumen. Setiap langkah mempengaruhi langkah berikutnya.',
      },
    ],
    admin: [],
  },
  // Sub-pages pengaturan (detailed tours)
  'pengaturan-tahun-buku': {
    superadmin: [
      {
        target: '[data-tour="tahun-buku-header"]',
        content: 'Selamat datang di Halaman Tahun Buku! Di sini Anda dapat mengelola periode tahun untuk penilaian GCG. Tahun buku yang aktif akan menjadi default di seluruh sistem.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="tambah-tahun-btn"]',
        content: 'Klik tombol "Tambah Tahun" untuk menambahkan tahun buku baru ke sistem. Setiap tahun buku akan memiliki data penilaian GCG yang terpisah.',
      },
      {
        target: '[data-tour="tahun-buku-grid"]',
        content: 'Grid Tahun Buku: Area ini menampilkan semua tahun buku yang terdaftar dalam sistem. Tahun terbaru ditampilkan terlebih dahulu.',
      },
      {
        target: '[data-tour="tahun-card"]',
        content: 'Kartu Tahun: Klik pada kartu untuk mengaktifkan tahun tersebut. Tahun aktif akan ditandai dengan badge "Aktif" dan akan menjadi default di menu lainnya.',
      },
      {
        target: '[data-tour="tahun-active-badge"]',
        content: 'Badge "Aktif": Menandakan tahun buku yang sedang aktif. Hanya satu tahun yang bisa aktif pada satu waktu.',
      },
      {
        target: '[data-tour="delete-tahun-btn"]',
        content: 'Tombol Hapus: Klik untuk menghapus tahun buku. Peringatan: menghapus tahun akan menghapus SEMUA data terkait tahun tersebut (dokumen, checklist, dll).',
      },
      {
        target: '[data-tour="tahun-tips"]',
        content: 'Tips Penggunaan: Bacalah tips ini untuk memahami cara kerja sistem tahun buku. Tahun aktif akan otomatis terpilih saat membuka menu lain.',
      },
      {
        target: '[data-tour="tahun-buku-back"]',
        content: 'Tombol Kembali: Klik untuk kembali ke halaman Pengaturan utama dan mengakses menu pengaturan lainnya.',
      },
    ],
    admin: [],
  },
  'pengaturan-struktur': {
    superadmin: [
      {
        target: '[data-tour="struktur-header"]',
        content: 'Selamat datang di Halaman Struktur Organisasi! Di sini Anda mengelola hierarki organisasi PT POS Indonesia: Direktorat, Subdirektorat, Anak Perusahaan, dan Divisi.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="struktur-year-selector"]',
        content: 'Pilih Tahun: Struktur organisasi dapat berbeda tiap tahun. Pilih tahun untuk melihat/mengedit struktur organisasi tahun tersebut.',
      },
      {
        target: '[data-tour="struktur-default-btn"]',
        content: 'Tombol "Data Default": Muat struktur organisasi default PT POS Indonesia untuk tahun yang dipilih. Berguna untuk setup awal.',
      },
      {
        target: '[data-tour="struktur-view-cards"]',
        content: 'Filter View: Kartu-kartu ini menampilkan jumlah total untuk setiap jenis entitas. Klik untuk memfilter tabel di bawah.',
      },
      {
        target: '[data-tour="struktur-view-card"]',
        content: 'Contoh Kartu View: Menampilkan jumlah data dan icon sesuai kategori. Kartu yang aktif akan ditandai dengan warna biru.',
      },
      {
        target: '[data-tour="struktur-quick-actions"]',
        content: 'Quick Actions: Tombol-tombol untuk menambahkan data baru dengan cepat. Setiap tombol memiliki warna berbeda sesuai kategorinya.',
      },
      {
        target: '[data-tour="tambah-direktorat-btn"]',
        content: 'Tambah Direktorat: Klik untuk membuka dialog dan menambahkan direktorat baru ke struktur organisasi.',
      },
      {
        target: '[data-tour="tambah-subdirektorat-btn"]',
        content: 'Tambah Subdirektorat: Tambahkan subdirektorat di bawah direktorat tertentu. Subdirektorat adalah unit struktural di bawah direktorat.',
      },
      {
        target: '[data-tour="tambah-anak-perusahaan-btn"]',
        content: 'Tambah Anak Perusahaan: Tambahkan anak perusahaan PT POS Indonesia. Ini adalah entitas hukum terpisah yang dimiliki oleh PT POS.',
      },
      {
        target: '[data-tour="tambah-divisi-btn"]',
        content: 'Tambah Divisi: Tambahkan divisi di bawah subdirektorat tertentu. Divisi adalah unit operasional terkecil dalam struktur.',
      },
      {
        target: '[data-tour="struktur-direktorat-table"]',
        content: 'Tabel Direktorat: Menampilkan semua direktorat yang terdaftar untuk tahun yang dipilih. Kolom mencakup Nama, Deskripsi, dan Tahun.',
      },
      {
        target: '[data-tour="edit-direktorat-btn"]',
        content: 'Tombol Edit: Klik untuk mengubah nama atau deskripsi direktorat. Tersedia di setiap baris data.',
      },
      {
        target: '[data-tour="delete-direktorat-btn"]',
        content: 'Tombol Hapus: Hapus direktorat dari sistem. Peringatan: menghapus direktorat akan menghapus semua subdirektorat dan divisi di bawahnya!',
      },
      {
        target: '[data-tour="struktur-subdirektorat-table"]',
        content: 'Tabel Subdirektorat: Menampilkan subdirektorat beserta direktorat induknya (parent). Hubungan hierarki ditampilkan dengan badge.',
      },
      {
        target: '[data-tour="struktur-anak-perusahaan-table"]',
        content: 'Tabel Anak Perusahaan: Menampilkan anak perusahaan PT POS Indonesia yang terdaftar.',
      },
      {
        target: '[data-tour="struktur-divisi-table"]',
        content: 'Tabel Divisi: Menampilkan divisi beserta subdirektorat induknya. Divisi adalah unit operasional di bawah subdirektorat.',
      },
      {
        target: '[data-tour="struktur-back"]',
        content: 'Tombol Kembali: Klik untuk kembali ke halaman Pengaturan utama dan mengakses menu pengaturan lainnya.',
      },
    ],
    admin: [],
  },
  'pengaturan-akun': {
    superadmin: [
      {
        target: '[data-tour="akun-header"]',
        content: 'Selamat datang di Halaman Manajemen Akun PIC! PIC (Person In Charge) adalah admin yang bertanggung jawab atas unit organisasi tertentu.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="akun-year-selector"]',
        content: 'Pilih Tahun: Akun PIC berbeda untuk setiap tahun. Pilih tahun untuk melihat dan mengelola akun PIC tahun tersebut.',
      },
      {
        target: '[data-tour="tambah-user-btn"]',
        content: 'Tombol "Tambah Pengguna": Klik untuk membuka dialog dan menambahkan PIC baru. Anda dapat mengatur penugasan mereka ke Direktorat, Subdirektorat, atau Divisi.',
      },
      {
        target: '[data-tour="akun-stats"]',
        content: 'Statistik Pengguna: Kartu ini menampilkan jumlah Admin (PIC) dan Total Pengguna yang terdaftar untuk tahun yang dipilih.',
      },
      {
        target: '[data-tour="akun-table"]',
        content: 'Tabel PIC: Menampilkan daftar lengkap PIC dengan informasi Nama, Email, WhatsApp, dan penugasan organisasi mereka (Direktorat/Subdirektorat/Divisi).',
      },
      {
        target: '[data-tour="edit-user-btn"]',
        content: 'Tombol Edit: Klik untuk mengubah informasi PIC (nama, email, password, penugasan organisasi, nomor WhatsApp).',
      },
      {
        target: '[data-tour="delete-user-btn"]',
        content: 'Tombol Hapus: Hapus PIC dari sistem. Peringatan: menghapus PIC akan menghapus assignment dokumen mereka!',
      },
      {
        target: '[data-tour="akun-back"]',
        content: 'Tombol Kembali: Klik untuk kembali ke halaman Pengaturan utama dan mengakses menu pengaturan lainnya.',
      },
    ],
    admin: [],
  },
  'pengaturan-dokumen': {
    superadmin: [
      {
        target: '[data-tour="dokumen-header"]',
        content: 'Selamat datang di Halaman Kelola Dokumen! Di sini Anda mengelola checklist dokumen GCG dan aspek penilaian. Checklist ini digunakan oleh PIC untuk upload dokumen.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="dokumen-year-selector"]',
        content: 'Pilih Tahun: Checklist berbeda untuk setiap tahun. Pilih tahun untuk melihat dan mengelola checklist tahun tersebut.',
      },
      {
        target: '[data-tour="dokumen-default-btn"]',
        content: 'Tombol "Data Default": Muat checklist GCG default untuk tahun yang dipilih. Berguna untuk setup awal atau standarisasi.',
      },
      {
        target: '[data-tour="kelola-aspek-btn"]',
        content: 'Tombol "Kelola Aspek": Buka dialog untuk mengelola aspek penilaian GCG (misalnya: Aspek I, Aspek II, dll). Aspek mengelompokkan checklist.',
      },
      {
        target: '[data-tour="tambah-item-btn"]',
        content: 'Tombol "Tambah Item": Scroll otomatis ke baris tambah di bawah tabel. Gunakan ini untuk menambahkan item checklist baru dengan cepat.',
      },
      {
        target: '[data-tour="dokumen-stats"]',
        content: 'Statistik Dokumen: Menampilkan total item checklist dan tombol untuk membuka panel distribusi PIC.',
      },
      {
        target: '[data-tour="distribusi-pic-toggle"]',
        content: 'Tombol Distribusi PIC: Klik untuk membuka/tutup panel yang menampilkan distribusi penugasan PIC. Lihat berapa item yang ditugaskan ke setiap PIC.',
      },
      {
        target: '[data-tour="distribusi-pic-panel"]',
        content: 'Panel Distribusi PIC: Menampilkan statistik lengkap penugasan (Total PIC, Item Ditugaskan, Belum Ditugaskan) dan daftar distribusi per PIC.',
      },
      {
        target: '[data-tour="dokumen-search"]',
        content: 'Pencarian Checklist: Cari item checklist berdasarkan deskripsi atau aspek. Hasil pencarian langsung terfilter.',
      },
      {
        target: '[data-tour="dokumen-table"]',
        content: 'Tabel Checklist GCG: Menampilkan semua item checklist dengan kolom Aspek, Deskripsi, dan PIC. Aspek dan PIC dapat diubah langsung di tabel.',
      },
      {
        target: '[data-tour="edit-checklist-btn"]',
        content: 'Tombol Edit: Klik untuk mengedit deskripsi item checklist. Aspek diubah langsung dari dropdown di kolom Aspek.',
      },
      {
        target: '[data-tour="delete-checklist-btn"]',
        content: 'Tombol Hapus: Hapus item checklist dari sistem. Peringatan: menghapus checklist akan menghapus semua dokumen terkait item ini!',
      },
      {
        target: '[data-tour="dokumen-back"]',
        content: 'Tombol Kembali: Klik untuk kembali ke halaman Pengaturan utama dan mengakses menu pengaturan lainnya.',
      },
    ],
    admin: [],
  },
  'pengaturan-baru': {
    superadmin: [
      {
        target: 'body',
        content: 'Halaman Pengaturan (Unified): Versi alternatif dengan tab navigation. Kembali ke /admin/pengaturan untuk tour lengkap.',
        disableBeacon: true,
      },
    ],
    admin: [],
  },
};

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = (pageName: string) => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    let role = 'admin';

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        role = user.role === 'superadmin' || user.role === 'super-admin' ? 'superadmin' : 'admin';
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }

    const pageSteps = TOUR_STEPS[pageName]?.[role] || [];

    console.log(`Tour: pageName=${pageName}, role=${role}, steps found=${pageSteps.length}`);

    if (pageSteps.length === 0) {
      console.warn(`No tour steps found for page: ${pageName}, role: ${role}`);
      alert(`Tour belum tersedia untuk halaman "${pageName}". \n\nHalaman dengan tour lengkap:\n- Dashboard\n- Monitoring & Upload\n- Arsip Dokumen\n- AOI Management\n- Pengaturan (menu utama)`);
      return;
    }

    // Check if first step target exists in DOM
    if (pageSteps.length > 0 && pageSteps[0].target) {
      const firstTarget = document.querySelector(pageSteps[0].target as string);

      if (!firstTarget) {

        // Special handling for Arsip Dokumen page - use MutationObserver
        if (pageName === 'arsip') {
          console.log('📡 Arsip page detected - using MutationObserver to watch for elements...');

          let observerDisconnected = false;

          const startTourWhenReady = () => {
            const target = document.querySelector(pageSteps[0].target as string);
            const availableElements = Array.from(document.querySelectorAll('[data-tour]'))
              .map(el => el.getAttribute('data-tour'));

            if (target && availableElements.length > 0) {
              observerDisconnected = true;
              setSteps(pageSteps);
              setStepIndex(0);
              setRun(true);
              console.log('✅ Tour started for Arsip page - Found', availableElements.length, 'data-tour elements');
              return true;
            }
            return false;
          };

          // Try immediately first
          if (startTourWhenReady()) {
            return;
          }

          // Set up MutationObserver to watch for DOM changes
          const observer = new MutationObserver(() => {
            if (!observerDisconnected && startTourWhenReady()) {
              observer.disconnect();
            }
          });

          // Observe the entire document for added nodes
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-tour']
          });

          // Fallback timeout after 10 seconds
          setTimeout(() => {
            if (!observerDisconnected) {
              observer.disconnect();
              observerDisconnected = true;

              const availableElements = Array.from(document.querySelectorAll('[data-tour]'))
                .map(el => el.getAttribute('data-tour'));

              console.error('❌ Timeout: Elements not found within 10s');
              console.error('   Target:', pageSteps[0].target);
              console.error('   Available elements:', availableElements);
              alert(`Tour tidak dapat dimulai.\n\nElement "${pageSteps[0].target}" tidak ditemukan.\n\nAvailable elements: ${availableElements.join(', ') || 'none'}\n\nCoba refresh halaman (Ctrl+R) dan tunggu hingga konten dimuat sepenuhnya.`);
            }
          }, 10000);

          return;
        }

        // For other pages, use retry logic with progressive delays
        let attempts = 0;
        const maxAttempts = 5;
        const retryIntervals = [300, 500, 800, 1200, 2000]; // Progressive delays

        const tryStartTour = () => {
          const retryTarget = document.querySelector(pageSteps[0].target as string);

          if (retryTarget) {
            setSteps(pageSteps);
            setStepIndex(0);
            setRun(true);
            console.log('✅ Tour started after', attempts + 1, 'retry attempt(s)');
          } else if (attempts < maxAttempts - 1) {
            attempts++;
            setTimeout(tryStartTour, retryIntervals[attempts]);
          } else {
            const availableElements = Array.from(document.querySelectorAll('[data-tour]')).map(el => el.getAttribute('data-tour'));
            console.error('❌ Tour failed to start after', maxAttempts, 'attempts');
            console.error('   Target element:', pageSteps[0].target);
            console.error('   Available data-tour elements:', availableElements);
            alert(`Tour tidak dapat dimulai.\n\nElement "${pageSteps[0].target}" tidak ditemukan di halaman.\n\nCoba refresh halaman (Ctrl+R) dan tunggu beberapa saat sebelum klik User Guide.`);
          }
        };

        setTimeout(tryStartTour, retryIntervals[0]);
        return;
      }
    }

    setSteps(pageSteps);
    setStepIndex(0);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
      return;
    }

    // Handle TARGET_NOT_FOUND - auto skip to next available step
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('⚠️ Target not found for step', index, '- auto-skipping to next step');

      // Try to find next valid step
      let nextValidIndex = index + 1;
      while (nextValidIndex < steps.length) {
        const nextStep = steps[nextValidIndex];
        if (nextStep.target) {
          const nextElement = document.querySelector(nextStep.target as string);
          // Check if element exists and is not disabled
          const isDisabled = nextElement?.hasAttribute('disabled') ||
                           nextElement?.getAttribute('aria-disabled') === 'true' ||
                           nextElement?.classList.contains('disabled');

          if (nextElement && !isDisabled) {
            console.log('✅ Found next valid step at index', nextValidIndex);
            setStepIndex(nextValidIndex);
            return;
          }
        }
        nextValidIndex++;
      }

      // No more valid steps, end tour
      console.log('❌ No more valid steps found, ending tour');
      setRun(false);
      setStepIndex(0);
      return;
    }

    // Handle STEP_AFTER for normal progression
    if (type === EVENTS.STEP_AFTER) {
      console.log('Moving to next step from', index, 'to', index + 1);

      // Check if next step exists and target is valid
      const nextStep = steps[index + 1];
      if (nextStep && nextStep.target) {
        const nextTargetSelector = nextStep.target as string;
        const nextElement = document.querySelector(nextTargetSelector);

        // Skip disabled elements automatically
        if (nextElement) {
          const isDisabled = nextElement.hasAttribute('disabled') ||
                           nextElement.getAttribute('aria-disabled') === 'true' ||
                           nextElement.classList.contains('disabled');

          if (isDisabled) {
            console.log('⚠️ Next element is disabled, skipping to next step');
            // Recursively find next valid step
            let validIndex = index + 2;
            while (validIndex < steps.length) {
              const validStep = steps[validIndex];
              if (validStep.target) {
                const validElement = document.querySelector(validStep.target as string);
                const validIsDisabled = validElement?.hasAttribute('disabled') ||
                                      validElement?.getAttribute('aria-disabled') === 'true';
                if (validElement && !validIsDisabled) {
                  setStepIndex(validIndex);
                  return;
                }
              }
              validIndex++;
            }
            // No valid steps left
            setRun(false);
            setStepIndex(0);
            return;
          }
        }

        // Auto-expand AOI tables if next step targets inside table
        if (nextTargetSelector.includes('rekomendasi-table') ||
            nextTargetSelector.includes('edit-button') ||
            nextTargetSelector.includes('delete-button')) {
          const expandButton = document.querySelector('[data-tour="expand-table"]');
          if (expandButton && expandButton instanceof HTMLElement) {
            const table = expandButton.closest('.space-y-4');
            const isCollapsed = !table?.querySelector('[data-tour="rekomendasi-table"]');
            if (isCollapsed) {
              console.log('Auto-expanding AOI table');
              expandButton.click();
              setTimeout(() => {
                setStepIndex(index + 1);
              }, 400);
              return;
            }
          }
        }

        // Auto-expand divisi breakdown
        if (nextTargetSelector.includes('progress-expand-divisi')) {
          const expandButton = document.querySelector('[data-tour="progress-expand-divisi"]');
          if (expandButton && expandButton instanceof HTMLElement) {
            const buttonText = expandButton.textContent;
            if (buttonText && buttonText.includes('Lihat Detail')) {
              console.log('Auto-expanding divisi breakdown');
              expandButton.click();
              setTimeout(() => {
                setStepIndex(index + 1);
              }, 400);
              return;
            }
          }
        }
      }

      setStepIndex(index + 1);
    }
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        disableOverlayClose={false}
        disableCloseOnEsc={false}
        spotlightClicks={true}
        spotlightPadding={4}
        locale={{
          back: 'Kembali',
          close: 'Tutup',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati',
        }}
        floaterProps={{
          disableAnimation: false,
          styles: {
            arrow: {
              length: 8,
              spread: 12,
            },
          },
        }}
        styles={{
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            textColor: '#333',
            width: 380,
          },
          buttonNext: {
            backgroundColor: '#2563eb',
            fontSize: 14,
            padding: '8px 16px',
            borderRadius: '6px',
          },
          buttonBack: {
            color: '#64748b',
            marginRight: 10,
            fontSize: 14,
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: 13,
          },
          tooltip: {
            borderRadius: '8px',
            fontSize: 14,
            padding: '16px',
          },
          tooltipContent: {
            padding: '8px 0',
          },
        }}
      />
    </TourContext.Provider>
  );
};
