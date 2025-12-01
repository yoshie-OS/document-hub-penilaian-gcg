-- GCG Document Hub - SQLite Database Schema
-- Complete migration from localStorage + Excel to SQLite
-- Includes Excel export functionality for non-tech stakeholders

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Will use bcrypt instead of plaintext
    role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'user')),
    name TEXT NOT NULL,
    direktorat TEXT,
    subdirektorat TEXT,
    divisi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. YEAR MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS years (
    year INTEGER PRIMARY KEY,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. ORGANIZATIONAL STRUCTURE
-- ============================================

-- Direktorat (Directorate)
CREATE TABLE IF NOT EXISTS direktorat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    tahun INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE
);

CREATE INDEX idx_direktorat_tahun ON direktorat(tahun);
CREATE INDEX idx_direktorat_active ON direktorat(is_active);

-- Subdirektorat (Sub-directorate)
CREATE TABLE IF NOT EXISTS subdirektorat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    direktorat_id INTEGER,
    deskripsi TEXT,
    tahun INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (direktorat_id) REFERENCES direktorat(id) ON DELETE SET NULL,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE
);

CREATE INDEX idx_subdirektorat_direktorat ON subdirektorat(direktorat_id);
CREATE INDEX idx_subdirektorat_tahun ON subdirektorat(tahun);

-- Divisi (Division)
CREATE TABLE IF NOT EXISTS divisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    subdirektorat_id INTEGER,
    deskripsi TEXT,
    tahun INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (subdirektorat_id) REFERENCES subdirektorat(id) ON DELETE SET NULL,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE
);

CREATE INDEX idx_divisi_subdirektorat ON divisi(subdirektorat_id);
CREATE INDEX idx_divisi_tahun ON divisi(tahun);

-- Anak Perusahaan (Subsidiary Companies)
CREATE TABLE IF NOT EXISTS anak_perusahaan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL CHECK(kategori IN ('Anak Perusahaan', 'Badan Afiliasi', 'Joint Venture', 'Unit Bisnis')),
    deskripsi TEXT,
    tahun INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE
);

CREATE INDEX idx_anak_perusahaan_kategori ON anak_perusahaan(kategori);
CREATE INDEX idx_anak_perusahaan_tahun ON anak_perusahaan(tahun);

-- ============================================
-- 4. GCG CHECKLIST & DOCUMENTS
-- ============================================

-- Aspek Master (per year, customizable)
CREATE TABLE IF NOT EXISTS aspek_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    tahun INTEGER NOT NULL,
    urutan INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE,
    UNIQUE(nama, tahun)
);

CREATE INDEX idx_aspek_master_tahun ON aspek_master(tahun);
CREATE INDEX idx_aspek_master_active ON aspek_master(is_active);

-- GCG Checklist (268 items per year)
CREATE TABLE IF NOT EXISTS checklist_gcg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aspek TEXT NOT NULL, -- "ASPEK I. Komitmen", etc.
    deskripsi TEXT NOT NULL,
    tahun INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE
);

CREATE INDEX idx_checklist_aspek ON checklist_gcg(aspek);
CREATE INDEX idx_checklist_tahun ON checklist_gcg(tahun);

-- Document Metadata
CREATE TABLE IF NOT EXISTS document_metadata (
    id TEXT PRIMARY KEY, -- UUID
    title TEXT NOT NULL,
    document_number TEXT,
    document_date TEXT,
    description TEXT,
    gcg_principle TEXT,
    document_type TEXT,
    document_category TEXT,
    direksi TEXT,
    subdirektorat TEXT,
    division TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT,
    status TEXT DEFAULT 'active',
    confidentiality TEXT,
    year INTEGER NOT NULL,
    uploaded_by TEXT,
    upload_date TEXT,
    checklist_id INTEGER,
    checklist_description TEXT,
    aspect TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (year) REFERENCES years(year) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklist_gcg(id) ON DELETE SET NULL
);

CREATE INDEX idx_document_year ON document_metadata(year);
CREATE INDEX idx_document_type ON document_metadata(document_type);
CREATE INDEX idx_document_checklist ON document_metadata(checklist_id);

-- Uploaded Files Tracking
CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY, -- UUID
    file_name TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    year INTEGER NOT NULL,
    checklist_id INTEGER,
    checklist_description TEXT,
    aspect TEXT,
    status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'pending')),
    FOREIGN KEY (year) REFERENCES years(year) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklist_gcg(id) ON DELETE SET NULL
);

CREATE INDEX idx_uploaded_files_year ON uploaded_files(year);
CREATE INDEX idx_uploaded_files_status ON uploaded_files(status);

-- ============================================
-- 5. GCG PERFORMANCE ASSESSMENT (from Excel)
-- ============================================

-- GCG Aspects Configuration (from GCG_MAPPING.csv)
CREATE TABLE IF NOT EXISTS gcg_aspects_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER NOT NULL, -- 1, 2, 3
    type TEXT, -- "ASPEK", "JENIS", "BAGIAN"
    section TEXT,
    no TEXT,
    deskripsi TEXT NOT NULL,
    jumlah_parameter INTEGER,
    bobot REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gcg_config_level ON gcg_aspects_config(level);
CREATE INDEX idx_gcg_config_type ON gcg_aspects_config(type);

-- GCG Assessment Results (replaces output.xlsx)
CREATE TABLE IF NOT EXISTS gcg_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config_id INTEGER NOT NULL, -- Links to gcg_aspects_config
    nilai REAL, -- Score value
    skor REAL, -- Weighted score
    keterangan TEXT,
    evidence TEXT, -- Documentation/evidence
    uploaded_file_id TEXT, -- If from Excel upload
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (year) REFERENCES years(year) ON DELETE CASCADE,
    FOREIGN KEY (config_id) REFERENCES gcg_aspects_config(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_gcg_assessments_year ON gcg_assessments(year);
CREATE INDEX idx_gcg_assessments_config ON gcg_assessments(config_id);

-- GCG Assessment Summary (aggregated results)
CREATE TABLE IF NOT EXISTS gcg_assessment_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    aspek TEXT NOT NULL,
    total_nilai REAL,
    total_skor REAL,
    percentage REAL,
    category TEXT, -- "Sangat Baik", "Baik", etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (year) REFERENCES years(year) ON DELETE CASCADE,
    UNIQUE(year, aspek)
);

CREATE INDEX idx_summary_year ON gcg_assessment_summary(year);

-- ============================================
-- 6. CHECKLIST ASSIGNMENTS (from PengaturanBaru)
-- ============================================

-- Checklist Assignments - tracks which subdirektorat is assigned to each checklist item
CREATE TABLE IF NOT EXISTS checklist_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL,
    subdirektorat TEXT NOT NULL,
    aspek TEXT,
    tahun INTEGER NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    FOREIGN KEY (checklist_id) REFERENCES checklist_gcg(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun) REFERENCES years(year) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(checklist_id, tahun)
);

CREATE INDEX idx_assignments_checklist ON checklist_assignments(checklist_id);
CREATE INDEX idx_assignments_tahun ON checklist_assignments(tahun);
CREATE INDEX idx_assignments_subdirektorat ON checklist_assignments(subdirektorat);

-- ============================================
-- 7. AUDIT & CHANGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE', 'EXPORT')),
    old_value TEXT, -- JSON
    new_value TEXT, -- JSON
    user_id INTEGER,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- 8. EXCEL EXPORT TRACKING (for your boss!)
-- ============================================

CREATE TABLE IF NOT EXISTS excel_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_type TEXT NOT NULL, -- 'users', 'checklist', 'gcg_assessment', etc.
    file_name TEXT NOT NULL,
    file_path TEXT,
    year INTEGER, -- If year-specific
    filters TEXT, -- JSON of applied filters
    exported_by INTEGER,
    export_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    row_count INTEGER,
    file_size INTEGER,
    FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_exports_type ON excel_exports(export_type);
CREATE INDEX idx_exports_date ON excel_exports(export_date);

-- ============================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================

-- Complete organizational hierarchy view
CREATE VIEW IF NOT EXISTS v_organizational_structure AS
SELECT
    d.id as direktorat_id,
    d.nama as direktorat_nama,
    s.id as subdirektorat_id,
    s.nama as subdirektorat_nama,
    div.id as divisi_id,
    div.nama as divisi_nama,
    d.tahun,
    d.is_active
FROM direktorat d
LEFT JOIN subdirektorat s ON d.id = s.direktorat_id AND d.tahun = s.tahun
LEFT JOIN divisi div ON s.id = div.subdirektorat_id AND s.tahun = div.tahun
WHERE d.is_active = 1;

-- GCG Assessment with details
CREATE VIEW IF NOT EXISTS v_gcg_assessment_detail AS
SELECT
    a.id,
    a.year,
    a.assessment_date,
    c.level,
    c.type,
    c.section,
    c.deskripsi,
    c.bobot,
    a.nilai,
    a.skor,
    a.keterangan,
    u.name as created_by_name
FROM gcg_assessments a
JOIN gcg_aspects_config c ON a.config_id = c.id
LEFT JOIN users u ON a.created_by = u.id;

-- Document completeness per year
CREATE VIEW IF NOT EXISTS v_document_completeness AS
SELECT
    c.tahun,
    c.aspek,
    COUNT(c.id) as total_required,
    COUNT(d.id) as total_uploaded,
    ROUND(CAST(COUNT(d.id) AS REAL) / COUNT(c.id) * 100, 2) as completion_percentage
FROM checklist_gcg c
LEFT JOIN document_metadata d ON c.id = d.checklist_id AND c.tahun = d.year
GROUP BY c.tahun, c.aspek;
