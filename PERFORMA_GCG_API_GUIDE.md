# PerformaGCG API Guide

## Summary

Successfully migrated `output.xlsx` data into SQLite database for the PerformaGCG page.

- **Data imported**: 63 rows
- **Years covered**: 2014-2024
- **Database table**: `performa_gcg`
- **API endpoints**: 4 new endpoints added

---

## Database Schema

### Table: `performa_gcg`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| level | INTEGER | Level indicator (1, 2, 4) |
| type | TEXT | Type (header, etc.) |
| section | TEXT | Section identifier (I, II, III, etc.) |
| no | TEXT | Unique identifier |
| deskripsi | TEXT | Description of the assessment item |
| jumlah_parameter | INTEGER | Number of parameters |
| bobot | REAL | Weight/importance score |
| skor | REAL | Actual score achieved |
| capaian | REAL | Achievement percentage |
| penjelasan | TEXT | Explanation/rating (Baik, Sangat Baik, etc.) |
| tahun | INTEGER | Year of assessment |
| penilai | TEXT | Assessor name |
| jenis_asesmen | TEXT | Assessment type |
| export_date | TEXT | Export date |
| jenis_penilaian | TEXT | Evaluation type |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

---

## API Endpoints

### 1. Get PerformaGCG Data

```
GET /api/performa-gcg
```

**Query Parameters:**
- `year` (optional): Filter by specific year
- `level` (optional): Filter by level (1, 2, or 4)

**Example:**
```bash
# Get all data
curl http://localhost:5000/api/performa-gcg

# Get data for 2024
curl http://localhost:5000/api/performa-gcg?year=2024

# Get level 1 data for 2023
curl http://localhost:5000/api/performa-gcg?year=2023&level=1
```

**Response:**
```json
[
  {
    "id": 1,
    "level": 1,
    "type": "header",
    "section": "I",
    "no": "brief-2014-I-0",
    "deskripsi": "Komitmen terhadap Penerapan Tata Kelola secara Berkelanjutan",
    "bobot": 7.0,
    "skor": 5.783,
    "capaian": 83.0,
    "penjelasan": "Baik",
    "tahun": 2014,
    "penilai": "BPKP Provinsi Jawa Barat",
    ...
  }
]
```

---

### 2. Get Available Years

```
GET /api/performa-gcg/years
```

**Example:**
```bash
curl http://localhost:5000/api/performa-gcg/years
```

**Response:**
```json
[2024, 2023, 2022, 2020, 2019, 2018, 2017, 2016, 2015, 2014]
```

---

### 3. Get Summary for Specific Year

```
GET /api/performa-gcg/summary/<year>
```

**Example:**
```bash
curl http://localhost:5000/api/performa-gcg/summary/2024
```

**Response:**
```json
{
  "year": 2024,
  "overall": {
    "total_items": 7,
    "total_bobot": 100.0,
    "total_skor": 87.5,
    "avg_capaian": 87.5,
    "min_capaian": 75.0,
    "max_capaian": 95.0
  },
  "sections": [
    {
      "section": "I",
      "deskripsi": "Komitmen terhadap Penerapan Tata Kelola",
      "bobot": 7.0,
      "skor": 5.783,
      "capaian": 83.0,
      "penjelasan": "Baik"
    },
    ...
  ]
}
```

---

### 4. Export to Excel

```
GET /api/performa-gcg/export
```

**Query Parameters:**
- `year` (optional): Export specific year only

**Example:**
```bash
# Export all data
curl http://localhost:5000/api/performa-gcg/export -o performa_gcg_all.xlsx

# Export 2024 data only
curl http://localhost:5000/api/performa-gcg/export?year=2024 -o performa_gcg_2024.xlsx
```

---

## Migration Script

To re-run the migration or import new data:

```bash
cd backend
python3 migrate_performa_gcg.py
```

The script will:
1. Create the `performa_gcg` table if it doesn't exist
2. Ask if you want to skip/append/clear existing data
3. Import all rows from `output.xlsx`
4. Verify the migration with statistics

---

## Data Statistics

Current data imported from `output.xlsx`:

- **Total rows**: 63
- **Years**: 2014-2024 (10 years)
- **Distribution by year**:
  - 2014-2019: 7 rows each
  - 2020: 6 rows
  - 2022-2023: 7 rows each
  - 2024: 1 row

- **Distribution by level**:
  - Level 1: 54 rows (headers/main sections)
  - Level 2: 1 row
  - Level 4: 8 rows

---

## Frontend Integration

To use these endpoints in your PerformaGCG page:

```typescript
// Fetch all data for a specific year
const fetchPerformaData = async (year: number) => {
  const response = await fetch(`http://localhost:5000/api/performa-gcg?year=${year}`);
  const data = await response.json();
  return data;
};

// Get available years
const fetchYears = async () => {
  const response = await fetch('http://localhost:5000/api/performa-gcg/years');
  const years = await response.json();
  return years;
};

// Get summary for year
const fetchSummary = async (year: number) => {
  const response = await fetch(`http://localhost:5000/api/performa-gcg/summary/${year}`);
  const summary = await response.json();
  return summary;
};

// Export to Excel
const exportToExcel = (year?: number) => {
  const url = year
    ? `http://localhost:5000/api/performa-gcg/export?year=${year}`
    : 'http://localhost:5000/api/performa-gcg/export';

  window.open(url, '_blank');
};
```

---

## Notes

- The data is stored in the same `gcg_database.db` file
- Indexes created on `tahun`, `level`, and `section` for fast queries
- The migration script can be run multiple times safely
- Export functionality works for both single year and all years
