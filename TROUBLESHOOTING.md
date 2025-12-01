# Troubleshooting Guide

## ✅ **Current Status**

Your system is now running correctly!

- ✅ **SQLite Database**: Initialized with 3,216 checklist items
- ✅ **Backend API**: Running on http://localhost:5000
- ✅ **Frontend**: Running on http://localhost:8080
- ✅ **Excel Export**: Ready to use

---

## 🧪 **Quick Tests**

### Test 1: Check if Backend is Running
```bash
curl http://localhost:5000/api/years
```

**Expected Output:**
```json
{
  "success": true,
  "data": [2025, 2024, 2023, ..., 2014]
}
```

### Test 2: Check Checklist Data
```bash
curl http://localhost:5000/api/checklist/2024 | python3 -m json.tool | head -20
```

**Expected Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2681,
      "aspek": "ASPEK I. Komitmen",
      "deskripsi": "Pedoman Tata Kelola...",
      "tahun": 2024,
      "document_count": 0
    },
    ...
  ]
}
```

### Test 3: Access Export Page
Open browser: http://localhost:8080/export

**Expected:** You should see the Export page with download buttons

### Test 4: Download Excel File
Click any "Download" button on the export page

**Expected:** Excel file downloads to your Downloads folder

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Cannot GET /export" or 404 Error

**Cause:** Route added but frontend hasn't reloaded

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Restart
npm run dev
```

### Issue 2: Export Page Blank or Error

**Cause:** Missing component or import error

**Solution:**
Check browser console (F12) for errors. Most likely:
- Missing YearContext import
- Missing toast/hooks

### Issue 3: Download Button Does Nothing

**Cause:** CORS issue or backend not running

**Solution:**
```bash
# Check if backend is running
curl http://localhost:5000/api/years

# If not responding, restart:
npm run dev
```

### Issue 4: Excel File Empty or Error

**Cause:** Database has no data

**Solution:**
```bash
# Reset database with full seed data
npm run db:reset
# When prompted, type: yes
```

### Issue 5: "Database locked" Error

**Cause:** Multiple processes accessing database

**Solution:**
```bash
# Kill all Python processes
pkill -f python

# Restart
npm run dev
```

---

## 📊 **How to Access Export Page**

### Method 1: Direct URL
```
http://localhost:8080/export
```

### Method 2: Add to Navigation (Recommended)

Find your navigation component and add:
```typescript
<Link to="/export">
  <FileSpreadsheet /> Export Excel
</Link>
```

---

## 🎯 **What Works Right Now**

Even without adding navigation, you can:

1. **Go directly to export page:**
   - Open: http://localhost:8080/export

2. **Download any export:**
   - Click "Download" button
   - File downloads automatically

3. **View export history:**
   - Scroll down on export page
   - See all previous exports

4. **Test with curl:**
   ```bash
   curl "http://localhost:5000/api/export/users" > users.xlsx
   curl "http://localhost:5000/api/export/checklist?year=2024" > checklist.xlsx
   ```

---

## 🔍 **Verify Everything**

Run this complete test:

```bash
# 1. Check years
curl http://localhost:5000/api/years

# 2. Check users
curl http://localhost:5000/api/users

# 3. Check checklist count
curl -s http://localhost:5000/api/checklist/2024 | python3 -c "import sys, json; print(f'Checklist items: {len(json.load(sys.stdin)[\"data\"])}')"

# 4. Download test export
curl "http://localhost:5000/api/export/users" -o test_export.xlsx

# 5. Check file size
ls -lh test_export.xlsx
```

**Expected:** All commands succeed, test_export.xlsx is created

---

## 🎓 **Login Credentials**

To access the app:

**Superadmin:**
- Email: arsippostgcg@gmail.com
- Password: postarsipGCG.

**Admin:**
- Email: admin@posindonesia.co.id
- Password: admin123

**User:**
- Email: user@posindonesia.co.id
- Password: user123

---

## 📁 **File Locations**

- **Database:** `backend/gcg_database.db`
- **Excel Exports:** `backend/exports/`
- **Logs:** Terminal output

---

## 🚀 **Next Steps**

1. ✅ Backend is running
2. ✅ Frontend is running
3. ✅ Database is seeded
4. ✅ Export page exists at `/export`
5. ❌ **Need to add navigation link** (see ADDING_EXPORT_BUTTON.md)

---

## 💡 **Quick Summary**

**What's Working:**
- ✅ SQLite database with 3,216 items
- ✅ All API endpoints
- ✅ Excel export functionality
- ✅ Export page UI

**What's Missing:**
- ❌ Navigation link to export page

**To Test Now:**
1. Open: http://localhost:8080/export
2. Select year: 2024
3. Click any "Download" button
4. Excel file downloads!

**That's it!** Everything works, you just need to add a menu link for easy access.

---

## 🆘 **Still Having Issues?**

Check:
1. Is `npm run dev` running? (both processes should show)
2. Does http://localhost:5000/api/years respond?
3. Does http://localhost:8080 show your app?
4. Does http://localhost:8080/export show export page?

If all YES → Everything works! Just add navigation.
If any NO → See specific issue above.
