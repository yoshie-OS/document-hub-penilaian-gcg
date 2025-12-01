# Excel Export - User Guide 📊

## 🎯 How Users Get Excel Files

Users have **3 easy ways** to download Excel files:

---

## **Method 1: Export Page UI (Recommended)**

### Step 1: Add Export Page to Your App

Add the route to your `App.tsx`:

```typescript
import ExportPage from './pages/ExportPage';

// In your routes:
<Route
  path="/export"
  element={
    <ProtectedRoute>
      <ExportPage />
    </ProtectedRoute>
  }
/>
```

### Step 2: Add Menu Item

In your navigation/sidebar, add:

```typescript
<NavLink to="/export">
  <FileSpreadsheet className="mr-2 h-4 w-4" />
  Export Excel
</NavLink>
```

### Step 3: Users Navigate and Click

1. User goes to **Export** page
2. Selects year from dropdown
3. Clicks download button for desired export type
4. **Excel file automatically downloads to Downloads folder** 💾

**That's it!** No technical knowledge needed.

---

## **Method 2: Quick Export Button (Anywhere in App)**

Add export buttons anywhere in your app:

```typescript
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const QuickExport = () => {
  const downloadGCGAssessment = () => {
    const year = 2024;
    window.open(`http://localhost:5000/api/export/gcg-assessment?year=${year}`, '_blank');
  };

  return (
    <Button onClick={downloadGCGAssessment}>
      <Download className="mr-2 h-4 w-4" />
      Download GCG Assessment
    </Button>
  );
};
```

**Use cases:**
- Add to dashboard for quick access
- Add to GCG assessment page
- Add to document checklist page

---

## **Method 3: Direct API URL (For Power Users)**

Users can bookmark these URLs:

```
# GCG Assessment 2024
http://localhost:5000/api/export/gcg-assessment?year=2024

# Complete export 2024
http://localhost:5000/api/export/all?year=2024

# Users export
http://localhost:5000/api/export/users

# Checklist 2024
http://localhost:5000/api/export/checklist?year=2024
```

---

## 📁 **What Users Download**

### 1. **Users Export**
File: `users_YYYYMMDD_HHMMSS.xlsx`

**Contains:**
- All users with roles
- Department assignments
- Active/inactive status

**Boss-friendly format:**
```
| ID | Email                  | Role       | Name       | Direktorat     |
|----|------------------------|------------|------------|----------------|
| 1  | admin@example.com      | admin      | Admin      | Keuangan       |
| 2  | user@example.com       | user       | User       | Operasional    |
```

---

### 2. **Checklist GCG Export**
File: `checklist_gcg_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. **Checklist GCG** - All checklist items
2. **Summary by Aspect** - Completion percentage per aspect

**Boss-friendly format:**
```
Sheet 1: Checklist GCG
| ID | Aspek           | Deskripsi                    | Tahun | Documents | Status   |
|----|-----------------|------------------------------|-------|-----------|----------|
| 1  | ASPEK I. ...    | Pedoman Tata Kelola...       | 2024  | 5         | Complete |

Sheet 2: Summary
| Tahun | Aspek           | Total Items | Uploaded | Completion % |
|-------|-----------------|-------------|----------|--------------|
| 2024  | ASPEK I. ...    | 36          | 30       | 83.33%       |
```

---

### 3. **Documents Export**
File: `documents_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. **Documents** - All document metadata
2. **Summary** - Count by type

---

### 4. **Organizational Structure Export**
File: `organizational_structure_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. **Direktorat**
2. **Subdirektorat**
3. **Divisi**
4. **Anak Perusahaan**

---

### 5. **GCG Assessment Export** ⭐ (Most Important for Boss!)
File: `gcg_assessment_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. **Assessment Detail** - Complete assessment data
2. **Summary** - Aggregated scores by aspect

**Boss-friendly format:**
```
Sheet 1: Assessment Detail
| Year | Level | Type  | Section | Deskripsi          | Bobot | Nilai | Skor |
|------|-------|-------|---------|--------------------| ------|-------|------|
| 2024 | 1     | ASPEK | I       | Komitmen           | 0.20  | 85    | 17.0 |

Sheet 2: Summary
| Year | Aspek           | Total Nilai | Total Skor | Percentage | Category     |
|------|-----------------|-------------|------------|------------|--------------|
| 2024 | ASPEK I. ...    | 850         | 170        | 85%        | Sangat Baik  |
```

---

### 6. **Complete Export** ⭐⭐ (Everything!)
File: `complete_export_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. Users
2. Checklist GCG
3. Documents
4. Direktorat
5. Subdirektorat
6. Anak Perusahaan
7. GCG Assessment

**Perfect for:**
- Year-end reports
- Comprehensive backups
- Board presentations
- Audits

---

## 🎨 **Excel File Features**

All exported Excel files include:

✅ **Colored Headers** - Blue background, white text
✅ **Auto-sized Columns** - Fits content perfectly
✅ **Formatted Data** - Dates, numbers, percentages
✅ **Multiple Sheets** - Organized by data type
✅ **Summary Tabs** - Aggregated statistics

**Opens in:**
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Apple Numbers

---

## 💼 **For Your Boss**

### Quick Guide for Non-Technical Users:

**"How do I get the GCG report in Excel?"**

1. Open the GCG Document Hub
2. Click **"Export"** in the menu
3. Select the year (e.g., 2024)
4. Click **"Download"** under "GCG Assessment"
5. Open the downloaded file in Excel

**That's it!** The file is ready to:
- Open in Excel
- Print for meetings
- Email to stakeholders
- Include in presentations
- Archive for compliance

---

## 📊 **Example: Boss Workflow**

```
Monday Morning:
  Boss: "I need the GCG assessment report for the board meeting"
  You: "Sure, just go to the Export page and click Download"

  [Boss clicks button]

  Boss: "Got it! Opening in Excel now... looks perfect!"
  You: "The file includes detail and summary sheets"
  Boss: "Great, I'll forward this to the board. Thanks!"
```

**No more:**
- ❌ Manual Excel file creation
- ❌ Copy-pasting data
- ❌ Email attachments back and forth
- ❌ Version confusion

**Now:**
- ✅ One-click download
- ✅ Always up-to-date data
- ✅ Properly formatted
- ✅ Instantly available

---

## 🔧 **Technical Details (For Developers)**

### File Storage

Exported files are saved to:
```
backend/exports/
├── users_20241130_143022.xlsx
├── checklist_gcg_2024_20241130_143023.xlsx
├── gcg_assessment_2024_20241130_143045.xlsx
└── complete_export_2024_20241130_150000.xlsx
```

### Export Tracking

Every export is logged in the database:
```sql
SELECT * FROM excel_exports
ORDER BY export_date DESC
LIMIT 10;
```

Tracks:
- Who exported (user_id)
- What exported (export_type)
- When exported (export_date)
- How many rows (row_count)
- File size (file_size)

### API Response

When user clicks download:
```
1. Browser sends: GET http://localhost:5000/api/export/gcg-assessment?year=2024
2. Python receives request
3. Python queries SQLite database
4. Python generates Excel file using pandas
5. Python returns file with headers:
   Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   Content-Disposition: attachment; filename="gcg_assessment_2024_20241130_143045.xlsx"
6. Browser downloads file automatically
```

---

## 🎯 **Summary: 3 Ways to Get Excel**

| Method | Difficulty | Best For |
|--------|-----------|----------|
| **Export Page UI** | ⭐ Easy | All users, your boss |
| **Quick Buttons** | ⭐⭐ Easy | Power users, dashboards |
| **Direct API** | ⭐⭐⭐ Advanced | Developers, automation |

---

## 🚀 **Next Steps**

1. ✅ Add `/export` route to App.tsx
2. ✅ Add "Export" to navigation menu
3. ✅ Test downloading a file
4. ✅ Show your boss how to use it
5. ✅ Enjoy automated Excel exports! 🎉

---

**Made with ❤️ for bosses who love Excel** 📊
