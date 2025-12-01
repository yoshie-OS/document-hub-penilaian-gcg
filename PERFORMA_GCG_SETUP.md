# 🚀 **Performa GCG - Setup Guide**

Panduan setup lengkap untuk fitur **Performa GCG** (GCG Performance Assessment).

---

## **📋 What is Performa GCG?**

**Performa GCG** adalah sistem penilaian dan evaluasi performa GCG yang memungkinkan:

1. ✅ **Input manual** atau **upload Excel otomatis** (file BPKP)
2. ✅ **Perhitungan skor** (bobot, skor, capaian, penjelasan)
3. ✅ **Visualisasi chart** (Donut, Capaian Aspek, Skor Tahunan)
4. ✅ **Export PDF** multi-halaman dengan chart & tabel
5. ✅ **Tracking multi-tahun** (2014 - sekarang)

---

## **⚙️ Prerequisites**

### **Frontend**
- ✅ Node.js 18+ (already installed)
- ✅ npm dependencies (already installed)

### **Backend (Python)**
- ⚠️ **Python 3.8+** - **MUST BE INSTALLED**
- ⚠️ **pip** (Python package manager)

---

## **🚀 Quick Start**

### **Step 1: Install Python Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed Flask-2.3.0 pandas-2.0.0 openpyxl-3.1.0 flask-cors-4.0.0 ...
```

### **Step 2: Start Both Servers** (Frontend + Backend)

```bash
# From backend/ directory
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### **Step 3: Access Performa GCG**

```bash
# From project root
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
```

### **Step 4: Access Performa GCG**

1. Open browser: **http://localhost:8080**
2. Login as super admin/admin/user
3. Click **"Performa GCG"** in sidebar
4. Start using the feature! 🎉

---

## **📂 File Structure**

### **Frontend (React + TypeScript)**

```
src/
├── pages/
│   └── PerformaGCG.tsx           # Main page (3105 lines)
├── components/
│   ├── GCGChart.tsx              # Main chart component
│   ├── DeskripsiAutocomplete.tsx # Aspect description autocomplete
│   ├── PenjelasanAutocomplete.tsx# Qualitative assessment autocomplete
│   └── dashboard/
│       └── GCGChartWrapper.tsx   # Chart wrapper with data fetching
├── utils/
│   ├── gcgDataProcessor.ts       # Process table data for charts
│   └── fileParser.ts             # Parse uploaded Excel files
├── services/
│   └── graphDataService.ts       # Fetch graph data from API
└── types/
    ├── gcg.ts                    # GCG data types
    └── graph.ts                  # Graph data types
```

### **Backend (Python + Flask)**

```
backend/
├── app.py                    # Main Flask API (~ 200 lines)
├── requirements.txt          # Python dependencies
├── GCG_MAPPING.csv          # Excel column mapping
├── storage_service.py       # File storage utilities
├── windows_utils.py         # Windows compatibility
├── README.md                # Backend documentation
├── uploads/                 # Original uploaded files
├── outputs/                 # Processed files
└── web-output/              # Centralized data
    └── output.xlsx          # Main "database" file
```

---

## **🎯 Feature Workflows**

### **Workflow 1: Manual Entry**

1. Click **"Performa GCG"** in sidebar
2. Choose **"Manual Entry"** method
3. Select year (2024, 2023, etc.)
4. Fill table manually:
   - Aspek: I, II, III, etc.
   - Bobot: Weight/bobot
   - Skor: Score achieved
   - Penjelasan: Qualitative (dropdown)
5. Click **"Save"**
6. View charts automatically updated
7. Export to PDF

### **Workflow 2: Automated Excel Upload** ⭐

1. Click **"Performa GCG"** in sidebar
2. Choose **"Automated Upload"** method
3. Select year
4. Upload Excel file (format BPKP):
   ```
   Penilaian_BPKP_2024.xlsx
   ```
5. Python backend processes file automatically
6. Table auto-populates in **5 seconds**
7. Charts generated automatically
8. Export to PDF

### **Workflow 3: Multi-Year Comparison**

1. Upload assessments for multiple years:
   - 2020, 2021, 2022, 2023, 2024
2. Switch between years using year selector
3. View **"Skor Tahunan"** chart for year-over-year trends
4. Export comprehensive PDF reports

---

## **📊 API Endpoints**

### **Backend (Python Flask) - http://localhost:5000**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-excel` | Upload & process Excel file |
| GET | `/api/gcg-chart-data?year=2024` | Get processed data for year |
| GET | `/api/processed-files` | List all processed files |

### **Frontend Calls**

```typescript
// Upload Excel file
const formData = new FormData();
formData.append('file', file);
formData.append('year', '2024');

const response = await fetch('http://localhost:5000/api/upload-excel', {
  method: 'POST',
  body: formData
});

// Get chart data
const data = await fetch('http://localhost:5000/api/gcg-chart-data?year=2024');
```

---

## **🧪 Testing**

### **Test 1: Backend Running**

```bash
curl http://localhost:5000/api/gcg-chart-data
```

**Expected:** JSON response with data or empty array

### **Test 2: Frontend Access**

1. Open browser: http://localhost:8080
2. Login with any user
3. Check sidebar has **"Performa GCG"** menu
4. Click menu → page should load

### **Test 3: Excel Upload** (if you have a sample file)

1. Go to Performa GCG page
2. Choose "Automated Upload"
3. Upload `Penilaian_BPKP_2024.xlsx`
4. Check `backend/web-output/output.xlsx` is created
5. Table should auto-populate

---

## **🐛 Troubleshooting**

### **Issue 1: Python not found**

```bash
# Check Python installation
python --version
# or
python3 --version

# If not installed:
# macOS: brew install python3
# Ubuntu: sudo apt install python3 python3-pip
# Windows: Download from python.org
```

### **Issue 2: Backend port 5000 in use**

```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change port in app.py:
# app.run(port=5001)
```

### **Issue 3: CORS errors**

Make sure backend is running on port 5000 and CORS is enabled in `backend/app.py`.

### **Issue 4: Missing dependencies**

```bash
# Frontend
npm install jspdf html2canvas

# Backend
pip install -r requirements.txt
```

### **Issue 5: Excel file not processing**

Check:
1. ✅ Backend is running
2. ✅ File format matches BPKP template
3. ✅ `GCG_MAPPING.csv` exists in backend/
4. ✅ Check backend console for errors

---

## **📝 Development Notes**

### **Frontend Dependencies Added**

```json
{
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

### **Backend Dependencies**

```
Flask==2.3.0
pandas==2.0.0
openpyxl==3.1.0
flask-cors==4.0.0
python-dateutil==2.8.2
```

### **Access Levels**

- **Super Admin**: Full access
- **Admin**: Full access
- **User**: Full access

(Route uses `ProtectedRoute`, not `SuperAdminRoute`)

---

## **🎓 Learning Resources**

### **Key Files to Study**

1. **src/pages/PerformaGCG.tsx** - Main page logic (3105 lines)
2. **backend/app.py** - Backend API logic
3. **src/components/GCGChart.tsx** - Chart rendering
4. **backend/README.md** - Backend documentation

### **Understanding the Flow**

```
User uploads Excel
    ↓
POST /api/upload-excel (Python)
    ↓
pandas processes Excel
    ↓
Saves to web-output/output.xlsx
    ↓
Frontend fetches: GET /api/gcg-chart-data
    ↓
Table & Charts update
    ↓
User exports to PDF
```

---

## **✅ Migration Checklist**

- [x] Backend directory created
- [x] Python files copied (app.py, requirements.txt, etc.)
- [x] Frontend page copied (PerformaGCG.tsx)
- [x] Supporting components copied (GCGChart, etc.)
- [x] Utilities & services copied
- [x] Type definitions copied
- [x] Dependencies installed (jspdf, html2canvas)
- [x] App.tsx updated with route
- [x] Sidebar already has menu item
- [x] Backend README created
- [ ] **Python dependencies installed** ⚠️ **YOU NEED TO DO THIS**
- [ ] **Backend tested** ⚠️ **YOU NEED TO DO THIS**

---

## **🚀 Next Steps**

1. **Install Python backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

2. **Start frontend** (separate terminal):
   ```bash
   npm run dev
   ```

3. **Test the feature:**
   - Go to http://localhost:8080
   - Login
   - Click "Performa GCG"
   - Try manual entry or Excel upload

4. **Optional: Get sample BPKP file** for testing Excel upload

---

## **📞 Support**

If you encounter issues:

1. Check backend console for Python errors
2. Check browser console for frontend errors
3. Verify both servers are running (frontend:8080, backend:5000)
4. Check `backend/README.md` for detailed backend docs

---

**Migration Complete! 🎉**

**The Performa GCG feature is now fully integrated into your project!**
