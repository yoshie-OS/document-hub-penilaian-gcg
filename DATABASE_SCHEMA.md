# 📊 **Database Schema for SQLite Migration**

This document outlines all the tabular data currently stored in Excel/CSV files that should be migrated to SQLite.

---

## **📁 Current Data Storage (Excel/CSV)**

### **1. GCG_MAPPING.csv** - Template/Configuration Data
**Location:** `backend/GCG_MAPPING.csv`
**Purpose:** Maps Excel columns to GCG aspects and defines the standard structure

### **2. web-output/output.xlsx** - Main "Database" File
**Location:** `backend/web-output/output.xlsx`
**Purpose:** Stores all processed GCG assessment data across all years

---

## **📋 Table Schemas for SQLite**

### **Table 1: `gcg_assessments` (Main Assessment Data)**

**Source:** `web-output/output.xlsx`

```sql
CREATE TABLE gcg_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Assessment Metadata
    tahun INTEGER NOT NULL,                    -- Year (e.g., 2024)
    penilai VARCHAR(255),                      -- Auditor/Assessor (e.g., "BPKP")
    jenis_penilaian VARCHAR(255),              -- Assessment Type (e.g., "External Audit", "Internal", "Self Assessment")
    export_date DATE,                          -- Date when assessment was exported

    -- GCG Structure
    level INTEGER,                             -- Level (1=header, 2=indicator, 3=subtotal, 4=total)
    type VARCHAR(50),                          -- Type: 'header', 'indicator', 'subtotal', 'total'
    section VARCHAR(10),                       -- Aspect Roman numeral (I, II, III, IV, V, VI)
    no REAL,                                   -- Item number (e.g., 1.0, 2.0, etc.)
    deskripsi TEXT,                            -- Description of the aspect/indicator

    -- Assessment Scores
    jumlah_parameter INTEGER,                  -- Number of parameters
    bobot REAL,                                -- Weight/bobot (e.g., 1.218, 15.0)
    skor REAL,                                 -- Score achieved (e.g., 13.5, 8.2)
    capaian REAL,                              -- Achievement percentage (skor/bobot * 100)
    penjelasan VARCHAR(100),                   -- Qualitative assessment ("Sangat Baik", "Baik", etc.)

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for fast querying
    UNIQUE(tahun, section, no, type)           -- Prevent duplicates
);

CREATE INDEX idx_assessments_year ON gcg_assessments(tahun);
CREATE INDEX idx_assessments_section ON gcg_assessments(section);
CREATE INDEX idx_assessments_type ON gcg_assessments(type);
CREATE INDEX idx_assessments_year_section ON gcg_assessments(tahun, section);
```

**Sample Data:**
```sql
-- Example row for ASPEK I indicator
INSERT INTO gcg_assessments (
    tahun, penilai, jenis_penilaian, level, type, section, no,
    deskripsi, jumlah_parameter, bobot, skor, capaian, penjelasan
) VALUES (
    2024, 'BPKP', 'External Audit', 2, 'indicator', 'I', 1.0,
    'Perusahaan memiliki Pedoman Tata Kelola Perusahaan yang Baik (GCG Code) dan pedoman perilaku (code of conduct).',
    2, 1.218, 1.1, 90.3, 'Sangat Baik'
);

-- Example row for ASPEK I subtotal
INSERT INTO gcg_assessments (
    tahun, penilai, jenis_penilaian, level, type, section, no,
    deskripsi, jumlah_parameter, bobot, skor, capaian, penjelasan
) VALUES (
    2024, 'BPKP', 'External Audit', 3, 'subtotal', 'I', 0.0,
    'JUMLAH I', 15, 7.0, 6.3, 90.0, 'Sangat Baik'
);

-- Example row for TOTAL
INSERT INTO gcg_assessments (
    tahun, penilai, jenis_penilaian, level, type, section, no,
    deskripsi, jumlah_parameter, bobot, skor, capaian, penjelasan
) VALUES (
    2024, 'BPKP', 'External Audit', 4, 'total', 'TOTAL', 0.0,
    'TOTAL', 153, 100.0, 85.3, 85.3, 'Baik'
);
```

---

### **Table 2: `gcg_aspects_config` (Aspect Configuration/Mapping)**

**Source:** `backend/GCG_MAPPING.csv`

```sql
CREATE TABLE gcg_aspects_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Structure
    level INTEGER NOT NULL,                    -- 1=header, 2=indicator, 3=subtotal, 4=total
    type VARCHAR(50) NOT NULL,                 -- 'header', 'indicator', 'subtotal', 'total'
    section VARCHAR(10) NOT NULL,              -- Roman numeral (I, II, III, IV, V, VI)
    no REAL,                                   -- Item number

    -- Content
    deskripsi TEXT NOT NULL,                   -- Description
    jumlah_parameter INTEGER,                  -- Standard number of parameters
    bobot REAL,                                -- Standard weight/bobot

    -- Metadata
    is_active BOOLEAN DEFAULT 1,              -- Whether this config is active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(section, no, type)
);

CREATE INDEX idx_aspects_section ON gcg_aspects_config(section);
CREATE INDEX idx_aspects_type ON gcg_aspects_config(type);
```

**Sample Data:**
```sql
-- Aspek I Header
INSERT INTO gcg_aspects_config (level, type, section, no, deskripsi, jumlah_parameter, bobot)
VALUES (1, 'header', 'I', 0.0, 'KOMITMEN TERHADAP PENERAPAN TATA KELOLA PERUSAHAAN YANG BAIK SECARA BERKELANJUTAN', NULL, NULL);

-- Aspek I Indicator 1
INSERT INTO gcg_aspects_config (level, type, section, no, deskripsi, jumlah_parameter, bobot)
VALUES (2, 'indicator', 'I', 1.0, 'Perusahaan memiliki Pedoman Tata Kelola Perusahaan yang Baik (GCG Code) dan pedoman perilaku (code of conduct).', 2, 1.218);

-- Aspek I Subtotal
INSERT INTO gcg_aspects_config (level, type, section, no, deskripsi, jumlah_parameter, bobot)
VALUES (3, 'subtotal', 'I', 0.0, 'JUMLAH I', 15, 7.0);
```

---

### **Table 3: `uploaded_files` (File Upload Tracking)**

**Source:** Currently in `uploads/` directory (file system)

```sql
CREATE TABLE uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- File Info
    file_id VARCHAR(255) UNIQUE NOT NULL,      -- UUID
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,                         -- File size in bytes
    file_type VARCHAR(50),                     -- 'excel', 'pdf', 'image'

    -- Assessment Metadata
    year INTEGER,                              -- Associated year
    checklist_id INTEGER,                      -- Associated checklist item
    aspect VARCHAR(10),                        -- Associated aspect (I, II, III, etc.)

    -- Processing Status
    status VARCHAR(50) DEFAULT 'uploaded',     -- 'uploaded', 'processing', 'completed', 'failed'
    processed_filename VARCHAR(255),           -- Output filename after processing
    error_message TEXT,                        -- Error message if processing failed

    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    -- User tracking (if needed)
    uploaded_by VARCHAR(255)                   -- Username/email who uploaded
);

CREATE INDEX idx_files_year ON uploaded_files(year);
CREATE INDEX idx_files_status ON uploaded_files(status);
CREATE INDEX idx_files_uploaded_at ON uploaded_files(uploaded_at DESC);
```

---

## **🔄 Data Migration Strategy**

### **Phase 1: Read Existing Data**

```python
# Read from Excel
import pandas as pd

# Main assessment data
df = pd.read_excel('backend/web-output/output.xlsx')

# Config data
config_df = pd.read_csv('backend/GCG_MAPPING.csv')
```

### **Phase 2: Create SQLite Database**

```python
import sqlite3

# Create database
conn = sqlite3.connect('backend/gcg_database.db')
cursor = conn.cursor()

# Create tables (execute SQL CREATE TABLE statements)
cursor.executescript('''
    CREATE TABLE gcg_assessments (...);
    CREATE TABLE gcg_aspects_config (...);
    CREATE TABLE uploaded_files (...);
''')
```

### **Phase 3: Migrate Data**

```python
# Migrate assessment data
df.to_sql('gcg_assessments', conn, if_exists='append', index=False)

# Migrate config data
config_df.to_sql('gcg_aspects_config', conn, if_exists='append', index=False)
```

### **Phase 4: Update Backend API**

Replace pandas Excel operations with SQLite queries:

**Before (Excel):**
```python
df = pd.read_excel('web-output/output.xlsx')
df = df[df['Tahun'] == 2024]
```

**After (SQLite):**
```python
conn = sqlite3.connect('gcg_database.db')
df = pd.read_sql_query("SELECT * FROM gcg_assessments WHERE tahun = ?", conn, params=(2024,))
```

---

## **📊 Query Examples**

### **Get all assessments for a year:**
```sql
SELECT * FROM gcg_assessments
WHERE tahun = 2024
ORDER BY section, no;
```

### **Get aspect summaries (subtotals):**
```sql
SELECT section, deskripsi, bobot, skor, capaian, penjelasan
FROM gcg_assessments
WHERE tahun = 2024 AND type = 'subtotal'
ORDER BY section;
```

### **Get total score for a year:**
```sql
SELECT tahun, skor, capaian, penjelasan
FROM gcg_assessments
WHERE tahun = 2024 AND type = 'total';
```

### **Multi-year comparison:**
```sql
SELECT tahun, section, capaian
FROM gcg_assessments
WHERE type = 'subtotal'
ORDER BY section, tahun;
```

### **Get recent uploads:**
```sql
SELECT original_filename, year, status, uploaded_at
FROM uploaded_files
ORDER BY uploaded_at DESC
LIMIT 10;
```

---

## **🎯 Benefits of SQLite Migration**

### **Performance:**
- ✅ Faster queries (indexed searches)
- ✅ No Excel file locking issues
- ✅ Better for concurrent access

### **Data Integrity:**
- ✅ UNIQUE constraints prevent duplicates
- ✅ Foreign keys maintain relationships
- ✅ Transactions ensure data consistency

### **Scalability:**
- ✅ Handle 10,000+ assessments easily
- ✅ Efficient filtering and aggregation
- ✅ Better for multi-user scenarios

### **Simplicity:**
- ✅ Standard SQL queries
- ✅ Easy to backup (single .db file)
- ✅ No Excel dependencies
- ✅ Works on all platforms

---

## **📁 File Structure After Migration**

```
backend/
├── gcg_database.db          # SQLite database (NEW!)
├── gcg_database_backup.db   # Backup (optional)
├── uploads/                 # Original uploaded files
├── outputs/                 # Processed files
├── GCG_MAPPING.csv         # Keep for reference (optional)
└── web-output/
    └── output.xlsx         # Keep as backup (optional)
```

---

## **🔧 Implementation Notes**

### **Backward Compatibility:**
- Keep Excel export functionality for reports
- Allow importing old Excel files
- Provide migration script to convert existing data

### **API Changes:**
Minimal changes needed - replace pandas Excel operations with SQLite:

```python
# Old: Read from Excel
df = pd.read_excel('web-output/output.xlsx')
filtered = df[df['Tahun'] == year]

# New: Read from SQLite
conn = sqlite3.connect('gcg_database.db')
filtered = pd.read_sql_query(
    "SELECT * FROM gcg_assessments WHERE tahun = ?",
    conn, params=(year,)
)
```

---

## **✅ Summary**

**3 Main Tables:**
1. **`gcg_assessments`** - All assessment data (replaces output.xlsx)
2. **`gcg_aspects_config`** - Template/config (replaces GCG_MAPPING.csv)
3. **`uploaded_files`** - File upload tracking (NEW)

**Total Columns: ~20 columns across 3 tables**

**Migration Effort: Low** - Mostly a 1:1 mapping from Excel to SQLite

**Ready for SQLite migration! 🚀**
