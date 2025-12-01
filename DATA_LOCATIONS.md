# 📁 Data Directories & File Locations

## 🗄️ **Database & Storage Locations**

### **1. SQLite Database** ⭐ (MAIN DATA STORAGE)
```
📂 Location: backend/gcg_database.db
📊 Size: 708 KB
📝 Contains:
   - 3,216 checklist items
   - 3 users (with hashed passwords)
   - 12 years (2014-2025)
   - 96 direktorat entries
   - 120 subdirektorat entries
   - 84 anak perusahaan entries
   - 58 GCG config parameters
   - All document metadata
   - Audit logs
   - Export history

🔧 Management:
   npm run db:init     # Initialize/create database
   npm run db:reset    # Reset database (⚠️ deletes all data)
```

---

### **2. Excel Exports Directory** 📊 (FOR YOUR BOSS!)
```
📂 Location: backend/exports/
📝 Contains: Auto-generated Excel files from downloads

Example files:
   - users_20251130_234319.xlsx
   - checklist_gcg_2024_20251130_143045.xlsx
   - gcg_assessment_2024_20251130_150000.xlsx
   - complete_export_2024_20251130_160000.xlsx

♻️ Cleanup: These files can be deleted safely (regenerated on download)
📦 Backup: Copy this folder to backup export history
```

---

### **3. File Uploads Directory** 📤
```
📂 Location: backend/uploads/
📝 Contains: User-uploaded files (documents, Excel files)

⚠️ Important: This is where actual uploaded files are stored
📦 Backup: MUST backup this folder to preserve uploaded files
```

---

### **4. Processing Outputs Directory** 🔄
```
📂 Location: backend/outputs/
📝 Contains: Temporary processing files

♻️ Cleanup: Can be deleted (regenerated during processing)
```

---

### **5. Web Output Directory** 🌐 (OLD EXCEL STORAGE)
```
📂 Location: backend/web-output/
📝 Contains: Old Excel-based storage (output.xlsx)

⚠️ Legacy: Used by old system (app.py)
🔄 Status: Replaced by SQLite database
📦 Backup: Keep for migration/reference
```

---

## 🗂️ **Data Directory Structure**

```
pos-data-cleaner-3/
│
├── backend/
│   │
│   ├── gcg_database.db           ⭐ MAIN DATABASE (708 KB)
│   │   └── Contains ALL application data
│   │
│   ├── exports/                  📊 EXCEL EXPORTS
│   │   ├── users_*.xlsx
│   │   ├── checklist_gcg_*.xlsx
│   │   ├── gcg_assessment_*.xlsx
│   │   └── complete_export_*.xlsx
│   │
│   ├── uploads/                  📤 UPLOADED FILES
│   │   └── User uploaded documents
│   │
│   ├── outputs/                  🔄 TEMP PROCESSING
│   │   └── Temporary processing files
│   │
│   └── web-output/               📂 LEGACY (OLD SYSTEM)
│       └── output.xlsx (old Excel storage)
│
└── src/
    └── lib/seed/                 🌱 SEED DATA (TypeScript)
        ├── seedChecklistGCG.ts   (268 items)
        ├── seedUser.ts           (3 users)
        ├── seedDirektorat.ts     (8 items)
        ├── seedSubdirektorat.ts  (16 items)
        └── seedAnakPerusahaan.ts (26 items)
```

---

## 💾 **Data Storage Summary**

| Type | Location | Purpose | Backup Priority |
|------|----------|---------|-----------------|
| **Database** | `backend/gcg_database.db` | Main data storage | 🔴 CRITICAL |
| **Uploads** | `backend/uploads/` | User files | 🔴 CRITICAL |
| **Exports** | `backend/exports/` | Excel exports | 🟡 MEDIUM |
| **Outputs** | `backend/outputs/` | Temp processing | 🟢 LOW |
| **Web Output** | `backend/web-output/` | Legacy storage | 🟡 MEDIUM |

---

## 🔐 **Current Data Storage Method**

### **Old System (app.py):**
```
localStorage (browser) ──> Excel files (web-output/output.xlsx)
   ❌ Limited storage
   ❌ No integrity checks
   ❌ Single user
```

### **New System (api_sqlite.py):** ⭐
```
Browser ──> REST API ──> SQLite Database (gcg_database.db)
   ✅ Unlimited storage
   ✅ Foreign key constraints
   ✅ Multi-user support
   ✅ Audit trails
```

### **Hybrid Current State:**
```
Frontend: Still using localStorage (contexts)
Backend: Using SQLite for exports
Status: Migration in progress
```

---

## 📊 **Where Different Data Lives**

### **User Data:**
- **Current:** localStorage (`users` key) + SQLite database
- **Location:** `backend/gcg_database.db` (table: `users`)
- **Format:** JSON in browser, SQL in database

### **Checklist GCG:**
- **Current:** localStorage (`checklistGCG` key) + SQLite database
- **Location:** `backend/gcg_database.db` (table: `checklist_gcg`)
- **Count:** 3,216 items (268 per year × 12 years)

### **Document Metadata:**
- **Current:** localStorage (`documentMetadata` key)
- **Future:** SQLite database (table: `document_metadata`)

### **Uploaded Files (Actual Files):**
- **Location:** `backend/uploads/`
- **Metadata:** In localStorage (for now)
- **⚠️ Important:** These are the ACTUAL files, not just metadata

### **GCG Assessment Results:**
- **Old:** `backend/web-output/output.xlsx`
- **New:** SQLite database (table: `gcg_assessments`)

### **Excel Exports:**
- **Location:** `backend/exports/`
- **Generated on-demand** (not stored in database)
- **Tracked in database** (table: `excel_exports`)

---

## 🗺️ **Data Flow Diagram**

```
┌─────────────────────────────────────────────────┐
│              USER UPLOADS FILE                   │
└───────────────────┬─────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│     Saved to: backend/uploads/filename.pdf       │
│     Metadata: localStorage (for now)             │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              USER CLICKS DOWNLOAD                │
└───────────────────┬─────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│    API queries: backend/gcg_database.db          │
│    Generates: backend/exports/file.xlsx          │
│    Downloads: To user's Downloads folder         │
└─────────────────────────────────────────────────┘
```

---

## 🔍 **How to Find Your Data**

### **All Users:**
```bash
sqlite3 backend/gcg_database.db "SELECT * FROM users;"
```

### **Checklist for 2024:**
```bash
sqlite3 backend/gcg_database.db "SELECT COUNT(*) FROM checklist_gcg WHERE tahun = 2024;"
# Should return: 268
```

### **All Uploaded Files:**
```bash
ls -lh backend/uploads/
```

### **All Excel Exports:**
```bash
ls -lh backend/exports/
```

### **Database Size:**
```bash
du -h backend/gcg_database.db
# Current: 708K
```

---

## 📦 **Backup Strategy**

### **Critical Backups:**
```bash
# Backup database
cp backend/gcg_database.db backup/gcg_database_$(date +%Y%m%d).db

# Backup uploads
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz backend/uploads/

# Backup everything
tar -czf backup/complete_backup_$(date +%Y%m%d).tar.gz \
    backend/gcg_database.db \
    backend/uploads/ \
    backend/web-output/
```

### **What to Backup:**
1. 🔴 **CRITICAL:** `backend/gcg_database.db` (main database)
2. 🔴 **CRITICAL:** `backend/uploads/` (user files)
3. 🟡 **IMPORTANT:** `backend/web-output/` (legacy data)
4. 🟢 **OPTIONAL:** `backend/exports/` (can regenerate)

---

## 🧹 **Safe to Delete**

### **Can Delete Anytime:**
- `backend/exports/*.xlsx` (regenerated on download)
- `backend/outputs/*` (temporary processing)

### **Never Delete:**
- `backend/gcg_database.db` (⚠️ ALL DATA LOST!)
- `backend/uploads/*` (⚠️ USER FILES LOST!)

### **Delete with Caution:**
- `backend/web-output/output.xlsx` (legacy data, might need for migration)

---

## 🔧 **Database Management Commands**

### **View Database:**
```bash
# Open SQLite CLI
sqlite3 backend/gcg_database.db

# List all tables
.tables

# View schema
.schema users

# Count records
SELECT COUNT(*) FROM checklist_gcg;

# Exit
.quit
```

### **Export Database:**
```bash
# Export to SQL file
sqlite3 backend/gcg_database.db .dump > backup.sql

# Restore from SQL file
sqlite3 backend/gcg_database.db < backup.sql
```

---

## 📍 **Quick Reference**

| What | Where | Size |
|------|-------|------|
| **Main Database** | `backend/gcg_database.db` | 708 KB |
| **Excel Exports** | `backend/exports/` | Variable |
| **Uploaded Files** | `backend/uploads/` | Variable |
| **Temp Processing** | `backend/outputs/` | Variable |
| **Legacy Storage** | `backend/web-output/` | Variable |

---

## 🎯 **Summary**

**Your data is in:**
1. ⭐ **SQLite Database:** `backend/gcg_database.db` (main storage)
2. 📤 **Uploaded Files:** `backend/uploads/` (user documents)
3. 📊 **Excel Exports:** `backend/exports/` (auto-generated)
4. 📂 **Legacy Storage:** `backend/web-output/` (old system)

**Always backup:**
- `backend/gcg_database.db`
- `backend/uploads/`

**Everything else can be regenerated!**

---

**Last Updated:** 2024-11-30
**Database Size:** 708 KB
**Total Checklist Items:** 3,216
