# SQLite Migration Guide 📊

## Overview

This project has been migrated from **localStorage + Excel** to **SQLite database** with **Excel export** functionality for non-technical stakeholders.

### Why SQLite?

- ✅ **Proper data persistence** (no more localStorage limits)
- ✅ **Data integrity** (foreign keys, constraints, transactions)
- ✅ **Better performance** (indexed queries, views)
- ✅ **Audit trails** (who changed what, when)
- ✅ **Multi-user support** (concurrent access)
- ✅ **Excel export** (your boss can still get Excel files!)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Contexts (API calls instead of localStorage)       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Python Flask Backend                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  api_sqlite.py   │  │ excel_exporter.py │               │
│  │  (CRUD + Auth)   │  │ (Excel exports)   │               │
│  └──────────────────┘  └──────────────────┘               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite Database (gcg_database.db)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 10+ Tables: users, checklist_gcg, documents, etc.   │   │
│  │ 3 Views: organizational structure, completeness     │   │
│  │ Audit logs, Excel export tracking                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables (10+)

1. **users** - User accounts with bcrypt password hashing
2. **years** - Available years (2014-current)
3. **checklist_gcg** - GCG checklist items (268 per year)
4. **document_metadata** - Document tracking
5. **uploaded_files** - File upload tracking
6. **direktorat** - Directorate structure
7. **subdirektorat** - Sub-directorate structure
8. **divisi** - Division structure
9. **anak_perusahaan** - Subsidiary companies
10. **gcg_aspects_config** - GCG assessment configuration
11. **gcg_assessments** - Assessment results (replaces Excel)
12. **gcg_assessment_summary** - Aggregated results
13. **audit_log** - Change tracking
14. **excel_exports** - Export history

### Views

- **v_organizational_structure** - Complete hierarchy
- **v_gcg_assessment_detail** - Assessment with details
- **v_document_completeness** - Completion percentages

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies:
- `bcrypt>=4.0.0` - Password hashing
- `xlsxwriter>=3.1.0` - Excel export enhancement

### 2. Initialize Database

**Option A: Fresh database with seed data**
```bash
python backend/database.py
```

**Option B: Reset database (⚠️ destroys all data)**
```bash
python backend/database.py reset
```

### 3. Migrate Existing localStorage Data

**Step 1: Export localStorage from browser**

Open your browser console and run:
```javascript
const exportLocalStorage = () => {
    const data = {};
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localstorage_export_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
};
exportLocalStorage();
```

**Step 2: Run migration script**
```bash
python backend/migrate_localstorage.py path/to/localstorage_export.json
```

### 4. Start the Server

**New SQLite API:**
```bash
python backend/api_sqlite.py
```

Or update package.json to use the new API:
```json
{
  "scripts": {
    "dev": "concurrently \"python backend/api_sqlite.py\" \"vite\"",
    "dev:backend": "python backend/api_sqlite.py"
  }
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/users` - Get all users
- `POST /api/users` - Create user

### Checklist GCG
- `GET /api/checklist/<year>` - Get checklist by year
- `POST /api/checklist` - Add checklist item
- `PUT /api/checklist/<id>` - Update checklist item
- `DELETE /api/checklist/<id>` - Delete checklist item

### Documents
- `GET /api/documents/<year>` - Get documents by year
- `POST /api/documents` - Create document

### Organizational Structure
- `GET /api/direktorat/<year>` - Get direktorat
- `GET /api/subdirektorat/<year>` - Get subdirektorat
- `GET /api/divisi/<year>` - Get divisi
- `GET /api/anak-perusahaan/<year>` - Get anak perusahaan

### GCG Assessment (replaces Excel)
- `GET /api/gcg-assessment/<year>` - Get assessment data
- `POST /api/gcg-assessment` - Save assessment data

### **Excel Export (for your boss!)** 📊
- `GET /api/export/users` - Export users to Excel
- `GET /api/export/checklist?year=2024` - Export checklist
- `GET /api/export/documents?year=2024` - Export documents
- `GET /api/export/org-structure?year=2024` - Export org structure
- `GET /api/export/gcg-assessment?year=2024` - Export GCG assessment
- `GET /api/export/all?year=2024` - Export ALL data
- `GET /api/export/history` - Get export history

### Utility
- `GET /api/years` - Get available years
- `GET /api/stats/<year>` - Get statistics
- `POST /api/init-db` - Initialize database (admin only)

---

## Excel Export Features

### Export Types

1. **Users Export**
   - All users with roles and departments
   - Active/inactive status

2. **Checklist Export**
   - GCG checklist items
   - Document completion status
   - Summary by aspect

3. **Documents Export**
   - All document metadata
   - Summary by type

4. **Organizational Structure Export**
   - Direktorat, Subdirektorat, Divisi
   - Anak Perusahaan categorized
   - Multi-sheet Excel file

5. **GCG Assessment Export** (replaces output.xlsx)
   - Detailed assessment data
   - Summary by aspect
   - Charts and visualizations
   - **This is what your boss wants!**

6. **Complete Export**
   - ALL data in one Excel file
   - Separate sheet for each data type
   - Perfect for backups or comprehensive reports

### Export Location
All exports are saved to: `backend/exports/`

### Export Tracking
- Every export is logged in `excel_exports` table
- Track: who exported, when, what filters, file size
- View export history via `/api/export/history`

---

## Frontend Migration

### Before (localStorage):
```typescript
// Old way
const [users, setUsers] = useState(() => {
  const saved = localStorage.getItem('users');
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  localStorage.setItem('users', JSON.stringify(users));
}, [users]);
```

### After (SQLite API):
```typescript
// New way
const [users, setUsers] = useState([]);

useEffect(() => {
  fetch('http://localhost:5000/api/users')
    .then(res => res.json())
    .then(data => setUsers(data.data));
}, []);

const addUser = async (userData) => {
  const response = await fetch('http://localhost:5000/api/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userData)
  });
  const result = await response.json();
  if (result.success) {
    // Refresh users
  }
};
```

---

## Security Improvements

### Before
- ❌ Passwords stored in plaintext
- ❌ No audit trail
- ❌ Anyone can access localStorage

### After
- ✅ **Bcrypt password hashing** (industry standard)
- ✅ **Audit logs** (who changed what, when)
- ✅ **Role-based access control** (superadmin, admin, user)
- ✅ **SQL injection protection** (parameterized queries)
- ✅ **Foreign key constraints** (data integrity)

---

## Data Migration Summary

### What Gets Migrated?
- ✅ Users (with password re-hashing)
- ✅ Checklist GCG (all years)
- ✅ Document metadata
- ✅ Uploaded files tracking
- ✅ Organizational structure
- ✅ Available years

### What Doesn't Get Migrated?
- ❌ Actual files (they stay in `uploads/` or wherever they are)
- ❌ Session data (regenerated on login)

---

## Excel vs SQLite Comparison

| Feature | Excel (Old) | SQLite (New) |
|---------|-------------|--------------|
| Data Storage | Excel files | SQLite database |
| Concurrent Access | ❌ File locking | ✅ Multi-user |
| Data Integrity | ❌ Manual | ✅ Constraints |
| Query Speed | ❌ Slow for large data | ✅ Fast with indexes |
| Audit Trail | ❌ None | ✅ Full audit log |
| Relationships | ❌ Manual lookup | ✅ Foreign keys |
| Boss-Friendly Export | ✅ Excel native | ✅ Excel export API |

---

## Testing

### 1. Test Database Initialization
```bash
python backend/database.py
```

Expected output:
```
Initializing database...
Database initialized at: backend/gcg_database.db
Seeding database with initial data...
  ✓ Seeded 12 years
  ✓ Seeded 3 users
  ✓ Seeded 3,216 checklist items (268 per year)
  ...
```

### 2. Test Excel Export
```bash
python backend/excel_exporter.py
```

Expected output:
```
Testing Excel exports...

1. Exporting users...
   ✓ Exported to: backend/exports/users_20241130_143022.xlsx

2. Exporting checklist for 2024...
   ✓ Exported to: backend/exports/checklist_gcg_2024_20241130_143023.xlsx

3. Exporting organizational structure...
   ✓ Exported to: backend/exports/organizational_structure_2024_20241130_143024.xlsx

✅ All exports completed successfully!
```

### 3. Test API
```bash
# Start the API
python backend/api_sqlite.py

# In another terminal, test endpoints
curl http://localhost:5000/api/years
curl http://localhost:5000/api/users
```

---

## Troubleshooting

### Database file not found
```bash
# Initialize database
python backend/database.py
```

### Migration fails
```bash
# Check JSON file format
python -m json.tool localstorage_export.json

# Reset database and try again
python backend/database.py reset
python backend/migrate_localstorage.py localstorage_export.json
```

### Excel export fails
```bash
# Check dependencies
pip install openpyxl xlsxwriter pandas

# Check export directory
ls -la backend/exports/
```

### API connection refused
```bash
# Check if backend is running
ps aux | grep api_sqlite

# Check port
lsof -i :5000
```

---

## Boss-Friendly Features 🎯

Your boss can now:

1. **Get Excel exports anytime** via the UI or API
2. **View export history** - see all previous exports
3. **Download comprehensive reports** - all data in one Excel file
4. **See formatted data** - auto-sized columns, colored headers
5. **Get GCG assessment reports** - replaces manual Excel processing

### Example: Export GCG Assessment for Boss

```bash
curl "http://localhost:5000/api/export/gcg-assessment?year=2024" \
  --output "GCG_Assessment_2024.xlsx"
```

Or in the frontend (you'll implement this):
```typescript
const exportForBoss = () => {
  window.open(`http://localhost:5000/api/export/all?year=2024`, '_blank');
};
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ Migration script created
3. ✅ Excel export module created
4. ✅ New API endpoints created
5. ⏳ Update frontend contexts to use API (next task)
6. ⏳ Add export buttons to UI
7. ⏳ Test end-to-end migration

---

## File Structure

```
backend/
├── database_schema.sql          # SQLite schema
├── database.py                  # Database initialization & seeding
├── migrate_localstorage.py      # Migration from localStorage
├── api_sqlite.py                # New Flask API with SQLite
├── excel_exporter.py            # Excel export module
├── gcg_database.db              # SQLite database file (generated)
├── exports/                     # Excel exports directory (generated)
│   ├── users_*.xlsx
│   ├── checklist_gcg_*.xlsx
│   └── gcg_assessment_*.xlsx
└── requirements.txt             # Updated dependencies
```

---

## Support

For issues or questions:
1. Check this guide
2. Check the code comments
3. Check the database schema (database_schema.sql)
4. Ask the developer (you know who 😎)

---

**Made with ❤️ for your boss who loves Excel** 📊
