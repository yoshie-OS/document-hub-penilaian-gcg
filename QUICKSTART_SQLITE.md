# Quick Start: SQLite Migration

## 🚀 Quick Setup (5 minutes)

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
npm run db:init
```

This will:
- ✅ Create SQLite database (`backend/gcg_database.db`)
- ✅ Create all tables with proper schema
- ✅ Seed with initial data (users, checklist, org structure)
- ✅ Insert years 2014-current

### 3. Start the Application
```bash
npm run dev
```

This starts:
- 🐍 Python backend (SQLite API) on http://localhost:5000
- ⚛️ React frontend on http://localhost:5173

### 4. Login
Default credentials:
- **Superadmin**: arsippostgcg@gmail.com / postarsipGCG.
- **Admin**: admin@posindonesia.co.id / admin123
- **User**: user@posindonesia.co.id / user123

---

## 📊 Excel Export for Your Boss

### Test Excel Export
```bash
npm run export:test
```

Check exports in: `backend/exports/`

### Export via API

Get GCG Assessment Excel:
```bash
curl "http://localhost:5000/api/export/gcg-assessment?year=2024" \
  --output "GCG_Assessment_2024.xlsx"
```

Get ALL data in one Excel file:
```bash
curl "http://localhost:5000/api/export/all?year=2024" \
  --output "Complete_Export_2024.xlsx"
```

---

## 🔄 Migrate Existing Data

If you have localStorage data:

### 1. Export from Browser
1. Open the app in browser
2. Open developer console (F12)
3. Run this script:

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
    a.download = 'localstorage_export.json';
    a.click();
};
exportLocalStorage();
```

### 2. Run Migration
```bash
python backend/migrate_localstorage.py localstorage_export.json
```

---

## 🎯 NPM Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend & frontend |
| `npm run dev:frontend` | Start only frontend |
| `npm run dev:backend` | Start only SQLite backend |
| `npm run dev:backend:old` | Start old Excel backend |
| `npm run db:init` | Initialize database |
| `npm run db:reset` | ⚠️ Reset database (deletes all data) |
| `npm run db:migrate` | Migrate from localStorage |
| `npm run export:test` | Test Excel exports |

---

## 📁 File Locations

- **Database**: `backend/gcg_database.db`
- **Excel Exports**: `backend/exports/`
- **Uploaded Files**: (wherever they are currently)
- **Logs**: Check terminal output

---

## ✅ Verify Installation

### Check Database
```bash
sqlite3 backend/gcg_database.db "SELECT COUNT(*) FROM users;"
# Should return: 3

sqlite3 backend/gcg_database.db "SELECT COUNT(*) FROM checklist_gcg;"
# Should return: 3216 (268 items × 12 years)
```

### Check API
```bash
curl http://localhost:5000/api/years
# Should return: {"success":true,"data":[2025,2024,2023,...,2014]}

curl http://localhost:5000/api/users
# Should return: 3 users
```

---

## 🐛 Troubleshooting

### "Database locked" error
```bash
# Close all connections and restart
pkill -f api_sqlite
npm run dev
```

### Missing dependencies
```bash
pip install bcrypt openpyxl xlsxwriter pandas flask flask-cors
```

### Database corrupted
```bash
npm run db:reset  # ⚠️ This deletes all data
```

---

## 🎓 What's New?

1. **SQLite Database** replaces localStorage
2. **Bcrypt passwords** replaces plaintext
3. **Excel exports** for stakeholders
4. **Audit logs** track all changes
5. **Foreign keys** ensure data integrity
6. **Views** for complex queries
7. **Better performance** with indexes

---

## 📚 Full Documentation

See [SQLITE_MIGRATION_GUIDE.md](./SQLITE_MIGRATION_GUIDE.md) for:
- Complete API reference
- Database schema details
- Security improvements
- Frontend migration guide
- Troubleshooting

---

**Made for easy Excel exports that your boss will love!** 📊✨
