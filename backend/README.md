# 🐍 **GCG Performa Backend - Python API**

Backend API untuk fitur **Performa GCG** (GCG Performance Assessment) yang memproses file Excel BPKP.

---

## **📋 Fitur**

- ✅ **Upload & Process Excel Files** - Otomatis extract data dari file Excel BPKP
- ✅ **Data Storage** - Simpan data ke Excel file (web-output/output.xlsx)
- ✅ **API Endpoints** - RESTful API untuk frontend
- ✅ **File Management** - Upload, process, dan retrieve processed files

---

## **🛠️ Tech Stack**

- **Python** 3.8+
- **Flask** - Web framework
- **pandas** - Excel processing
- **openpyxl** - Excel read/write
- **CORS** - Cross-origin requests

---

## **📋 Prerequisites**

- Python 3.8 atau lebih baru
- pip (Python package manager)

---

## **🚀 Setup & Installation**

### **1. Install Python Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

### **2. Verify Installation**

```bash
python --version  # Should be 3.8+
pip list | grep -E "Flask|pandas|openpyxl"
```

---

## **▶️ Running the Backend**

### **Development Mode**

```bash
cd backend
python app.py
```

Server akan berjalan di: **http://localhost:5000**

### **Production Mode (optional)**

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## **📡 API Endpoints**

### **1. Upload Excel File**
```
POST /api/upload-excel
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Excel file (.xlsx)
  - `year` (optional): Year for the assessment

**Response:**
```json
{
  "success": true,
  "message": "File processed successfully",
  "data": [
    {
      "Tahun": 2024,
      "Section": "ASPEK I",
      "Deskripsi": "Komitmen GCG",
      "Bobot": 15.0,
      "Skor": 13.5,
      "Capaian": 90.0,
      "Penjelasan": "Sangat Baik"
    }
  ]
}
```

### **2. Get GCG Chart Data**
```
GET /api/gcg-chart-data?year=2024
```

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### **3. Get Processed Files List**
```
GET /api/processed-files
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "processed_UUID_Penilaian_BPKP_2024.xlsx",
      "size": 12345,
      "created_at": "2024-11-30T12:00:00"
    }
  ]
}
```

---

## **📁 Directory Structure**

```
backend/
├── app.py                   # Main Flask application
├── requirements.txt         # Python dependencies
├── GCG_MAPPING.csv         # Excel column mapping config
├── storage_service.py      # File storage utilities
├── windows_utils.py        # Windows compatibility utilities
├── uploads/                # Uploaded Excel files
├── outputs/                # Processed Excel files
└── web-output/             # Centralized data file
    └── output.xlsx         # Main data file (Excel "database")
```

---

## **📊 How Excel Processing Works**

### **Input File Format (BPKP)**

Excel file dengan struktur:

| Section | Deskripsi | Jumlah Parameter | Bobot | Skor | Capaian | Penjelasan |
|---------|-----------|------------------|-------|------|---------|------------|
| ASPEK I | Komitmen GCG | 15 | 15.0 | 13.5 | 90.0% | Sangat Baik |
| ASPEK II | RUPS | 8 | 10.0 | 8.2 | 82.0% | Baik |
| ... | ... | ... | ... | ... | ... | ... |

### **Processing Flow**

```
1. User uploads: Penilaian_BPKP_2024.xlsx
   ↓
2. Backend saves to: uploads/UUID_Penilaian_BPKP_2024.xlsx
   ↓
3. Python extracts data using GCG_MAPPING.csv
   ↓
4. Saves processed data to:
   - outputs/processed_UUID_Penilaian_BPKP_2024.xlsx
   - web-output/output.xlsx (centralized)
   ↓
5. Frontend fetches via: GET /api/gcg-chart-data
   ↓
6. Table auto-populates with data
```

---

## **⚙️ Configuration**

### **GCG_MAPPING.csv**

Maps Excel columns to data fields:

```csv
Column,Field,Description
A,Section,Aspek (I, II, III, etc.)
B,Deskripsi,Description of aspect
C,Jumlah_Parameter,Number of parameters
D,Bobot,Weight/bobot
E,Skor,Score achieved
F,Capaian,Achievement percentage
G,Penjelasan,Qualitative assessment
```

Modify this file to adapt to different Excel formats.

---

## **🔧 Troubleshooting**

### **Issue: Port 5000 already in use**

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
# Edit app.py, change: app.run(port=5001)
```

### **Issue: CORS errors**

Make sure CORS is enabled in `app.py`:

```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### **Issue: Module not found**

```bash
pip install -r requirements.txt
```

---

## **📝 Development Notes**

### **Adding New Endpoints**

```python
@app.route('/api/your-endpoint', methods=['GET', 'POST'])
def your_endpoint():
    # Your logic here
    return jsonify({
        'success': True,
        'data': your_data
    })
```

### **Modifying Excel Processing**

Edit the processing logic in `app.py`:

```python
def process_bpkp_file(file_path, year):
    df = pd.read_excel(file_path)
    # Your custom processing logic
    return processed_data
```

---

## **🚀 Next Steps**

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Run the backend: `python app.py`
3. ✅ Test upload endpoint: Use frontend or Postman
4. ✅ Check `web-output/output.xlsx` for processed data

---

## **📞 Support**

For issues or questions:
- Check the main project documentation
- Review the code comments in `app.py`
- Check error logs in console output

---

**Happy Coding! 🎉**
