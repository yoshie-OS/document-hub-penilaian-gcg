# 📥 Download Button Locations

## 📍 **Download Buttons Exist on 4 Pages**

---

## **1. Dashboard Main** (`/dashboard`)

**File:** `src/pages/dashboard/DashboardMain.tsx`

**Location:** Top-right corner of page header

**Button Type:** `<DownloadAllDataButton>`

**What it downloads:** Complete export of ALL data for selected year
- Users
- Checklist GCG
- Documents
- Direktorat
- Subdirektorat
- Anak Perusahaan
- GCG Assessment

**Visual Location:**
```
┌────────────────────────────────────────────────────┐
│  Dashboard                    [Download All Data ⬇]│
│  Statistik GCG - Tahun 2024                        │
├────────────────────────────────────────────────────┤
│  [Year Selector: 2024 ▼]                           │
│                                                     │
│  [Stats Cards...]                                  │
│  [Charts...]                                       │
└────────────────────────────────────────────────────┘
```

**File Downloaded:** `complete_export_2024_YYYYMMDD_HHMMSS.xlsx`

**URL:** http://localhost:8080/dashboard

---

## **2. Monitoring & Upload GCG** (`/list-gcg`)

**File:** `src/pages/MonitoringUploadGCG.tsx`

**Location:** Top-right corner next to page header

**Button Type:** `<DownloadChecklistButton>`

**What it downloads:** GCG Checklist with completion status
- All 268 checklist items for selected year
- Document upload status for each item
- Summary by aspect (completion percentages)

**Visual Location:**
```
┌────────────────────────────────────────────────────┐
│  Monitoring & Upload GCG  [Download Checklist ⬇]  │
│  Tahun: 2024              [Upload Dokumen]         │
├────────────────────────────────────────────────────┤
│  [Year Selector Panel]                             │
│                                                     │
│  [Tabs: Rekap | Kelola Aspek | Kelola Dokumen]    │
│  [Table with checklist items...]                   │
└────────────────────────────────────────────────────┘
```

**File Downloaded:** `checklist_gcg_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. Checklist GCG - All items with status
2. Summary by Aspect - Completion percentages

**URL:** http://localhost:8080/list-gcg

---

## **3. Performa GCG** (`/performa-gcg`)

**File:** `src/pages/PerformaGCG.tsx`

**Location:** Year selection card header (top-right)

**Button Type:** `<DownloadGCGAssessmentButton>`

**What it downloads:** GCG Performance Assessment
- Detailed assessment data
- Scores by aspect
- Summary with categories
- Visualization data

**Visual Location:**
```
┌────────────────────────────────────────────────────┐
│  Performa GCG Page                                 │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐ │
│  │ 📅 Pilih Tahun  [Download GCG Assessment ⬇] │ │
│  │ Tahun Buku: [2024 ▼]                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [Filter Controls...]                              │
│  [Assessment Table...]                             │
│  [Charts and Visualizations...]                    │
└────────────────────────────────────────────────────┘
```

**File Downloaded:** `gcg_assessment_2024_YYYYMMDD_HHMMSS.xlsx`

**Sheets:**
1. Assessment Detail - Complete assessment data
2. Summary - Aggregated scores by aspect

**URL:** http://localhost:8080/performa-gcg

---

## **4. Export Page** (`/export`) - Full Featured ⭐

**File:** `src/pages/ExportPage.tsx`

**Location:** Dedicated export page with multiple buttons

**Component:** `<ExcelExportPanel>`

**What it has:** 6 different export buttons
1. **Users** - Download all users
2. **Checklist GCG** - Download checklist
3. **Documents** - Download documents
4. **Organizational Structure** - Download org structure
5. **GCG Assessment** - Download assessment
6. **Complete Export** - Download ALL data

**Visual Location:**
```
┌────────────────────────────────────────────────────┐
│  📊 Excel Export Center                            │
│  Download data as Excel files for reports          │
├────────────────────────────────────────────────────┤
│  Export Year: [2024 ▼]                             │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 👥 Users │  │ ✅ Check │  │ 📄 Docs  │        │
│  │[Download]│  │[Download]│  │[Download]│        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 🏢 Org   │  │ 📊 GCG   │  │ 📁 All   │        │
│  │[Download]│  │[Download]│  │[Download]│        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│  [Export History Table...]                         │
└────────────────────────────────────────────────────┘
```

**URL:** http://localhost:8080/export

**Note:** This page is accessible but NOT in navigation yet (access via direct URL)

---

## 📊 **Summary Table**

| Page | URL | Button Location | Button Type | Downloads |
|------|-----|----------------|-------------|-----------|
| **Dashboard** | `/dashboard` | Top-right header | Download All Data | Complete export |
| **Monitoring GCG** | `/list-gcg` | Top-right header | Download Checklist | Checklist + status |
| **Performa GCG** | `/performa-gcg` | Year card header | Download GCG Assessment | Assessment data |
| **Export Page** | `/export` | Multiple locations | 6 different buttons | Any export type |

---

## 🎯 **Button Placement Strategy**

### **Consistent Pattern:**
All download buttons are placed in **top-right** areas for consistency:

1. **Dashboard** → Header right corner
2. **Monitoring** → Header right corner (next to Upload button)
3. **Performa** → Card header right corner
4. **Export** → Grid layout with multiple buttons

### **Why Top-Right?**
- ✅ Consistent location across pages
- ✅ Easy to find
- ✅ Doesn't interfere with main content
- ✅ Common pattern in web applications

---

## 🔍 **How to Find the Buttons**

### **If You're on Dashboard:**
```
1. Look at the very top of the page
2. Right side of "Dashboard" title
3. You'll see: [Download All Data ⬇]
```

### **If You're on Monitoring GCG:**
```
1. Look at the page header
2. Right side, next to "Upload Dokumen" button
3. You'll see: [Download Checklist Excel ⬇]
```

### **If You're on Performa GCG:**
```
1. Look at the "Pilih Tahun" card
2. Top-right corner of that card
3. You'll see: [Download GCG Assessment ⬇]
```

### **If You're on Export Page:**
```
1. You'll see 6 cards in a grid
2. Each card has a Download button
3. Choose the export type you want
```

---

## 🎨 **Button Appearance**

All download buttons have the same design:

```
┌─────────────────────────────┐
│  ⬇ Download [Type] Excel    │
└─────────────────────────────┘

When downloading:
┌─────────────────────────────┐
│  ⏳ Downloading...           │
└─────────────────────────────┘
```

**Features:**
- Download icon (⬇)
- Clear label
- Loading spinner when active
- Toast notification on success

---

## 🧪 **Quick Test**

### **Test Each Button:**

1. **Dashboard Button:**
   ```
   Navigate to: http://localhost:8080/dashboard
   Look for: Top-right corner
   Click: "Download All Data"
   Result: complete_export_2024_*.xlsx downloads
   ```

2. **Monitoring Button:**
   ```
   Navigate to: http://localhost:8080/list-gcg
   Look for: Next to page title
   Click: "Download Checklist Excel"
   Result: checklist_gcg_2024_*.xlsx downloads
   ```

3. **Performa Button:**
   ```
   Navigate to: http://localhost:8080/performa-gcg
   Look for: Year selection card, top-right
   Click: "Download GCG Assessment"
   Result: gcg_assessment_2024_*.xlsx downloads
   ```

4. **Export Page:**
   ```
   Navigate to: http://localhost:8080/export
   Look for: Grid of 6 cards
   Click: Any "Download" button
   Result: Respective Excel file downloads
   ```

---

## 📱 **Responsive Behavior**

### **Desktop:**
- Buttons appear in top-right corner
- Full label visible: "Download [Type] Excel"

### **Mobile/Tablet:**
- Buttons may stack below header
- Label might be shortened
- Icon always visible

---

## ⚠️ **Important Notes**

### **Export Page NOT in Navigation Yet:**
- The `/export` page exists and works
- But there's NO menu link to it yet
- Access via direct URL: http://localhost:8080/export
- See `ADDING_EXPORT_BUTTON.md` for how to add navigation link

### **All Other Pages Have Visible Buttons:**
- ✅ Dashboard - Button visible
- ✅ Monitoring - Button visible
- ✅ Performa - Button visible
- ⏳ Export - Page exists but not linked in menu

---

## 🎓 **For Your Boss (Non-Technical)**

**"Where can I download Excel files?"**

1. **Dashboard Page** → Look top-right → Click "Download All Data"
2. **Monitoring Page** → Look top-right → Click "Download Checklist"
3. **Performa Page** → Look in year selector → Click "Download GCG Assessment"

**Files go to your Downloads folder automatically!**

---

## 🔧 **For Developers**

### **Component Used:**
```typescript
import {
  DownloadChecklistButton,
  DownloadGCGAssessmentButton,
  DownloadAllDataButton
} from '@/components/ExportButton';
```

### **Implementation:**
```typescript
// In MonitoringUploadGCG.tsx
<DownloadChecklistButton year={selectedYear} />

// In PerformaGCG.tsx
<DownloadGCGAssessmentButton year={selectedYear} />

// In DashboardMain.tsx
<DownloadAllDataButton year={selectedYear} />
```

---

## 📋 **Files Modified**

1. ✅ `src/pages/dashboard/DashboardMain.tsx` - Added DownloadAllDataButton
2. ✅ `src/pages/MonitoringUploadGCG.tsx` - Added DownloadChecklistButton
3. ✅ `src/pages/PerformaGCG.tsx` - Added DownloadGCGAssessmentButton
4. ✅ `src/pages/ExportPage.tsx` - Created (full export page)
5. ✅ `src/components/ExportButton.tsx` - Created (reusable component)
6. ✅ `src/components/ExcelExportPanel.tsx` - Created (export panel)

---

**Last Updated:** 2024-11-30
**Total Pages with Buttons:** 4
**Total Download Buttons:** 9 (3 on main pages + 6 on export page)
