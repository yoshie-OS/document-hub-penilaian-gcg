# 🚀 Backend Implementation - JSON Server

## 📋 **Overview**
Backend untuk **Good Corporate Governance Documents Management System** menggunakan JSON Server sebagai rapid prototyping solution.

## 🛠️ **Technology Stack**
- **JSON Server**: Lightweight REST API server
- **Node.js**: Runtime environment
- **CORS**: Cross-Origin Resource Sharing middleware
- **Concurrently**: Run multiple commands simultaneously

## 📁 **File Structure**
```
├── db.json                    # Database schema & sample data
├── json-server.json          # JSON Server configuration
├── middleware/
│   └── cors.js              # CORS middleware
├── routes.json               # Custom API routes
└── src/services/
    └── api.ts               # Frontend API service layer
```

## 🗄️ **Database Schema**

### **Users Collection**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "superadmin | admin",
  "direktorat": "string",
  "subdirektorat": "string",
  "divisi": "string",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### **Struktur Perusahaan Collection**
```json
{
  "direktorat": [
    {
      "id": "string",
      "nama": "string",
      "kode": "string"
    }
  ],
  "subdirektorat": [
    {
      "id": "string",
      "direktoratId": "string",
      "nama": "string",
      "kode": "string"
    }
  ],
  "divisi": [
    {
      "id": "string",
      "subdirektoratId": "string",
      "nama": "string",
      "kode": "string"
    }
  ]
}
```

### **AOI Tables Collection**
```json
{
  "id": "number",
  "nama": "string",
  "tahun": "number",
  "targetType": "direktorat | subdirektorat | divisi",
  "targetDirektorat": "string",
  "targetSubdirektorat": "string",
  "targetDivisi": "string",
  "deskripsi": "string",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### **AOI Recommendations Collection**
```json
{
  "id": "number",
  "aoiTableId": "number",
  "no": "number",
  "jenis": "REKOMENDASI | SARAN",
  "isi": "string",
  "tingkatUrgensi": "string",
  "aspekAOI": "string",
  "pihakTerkait": "string",
  "organPerusahaan": "string",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### **AOI Documents Collection**
```json
{
  "id": "string",
  "fileName": "string",
  "fileSize": "number",
  "uploadDate": "ISO date",
  "aoiRecommendationId": "number",
  "aoiJenis": "REKOMENDASI | SARAN",
  "aoiUrutan": "number",
  "userId": "string",
  "userDirektorat": "string",
  "userSubdirektorat": "string",
  "userDivisi": "string",
  "fileType": "string",
  "status": "active | archived",
  "tahun": "number"
}
```

### **User Documents Collection**
```json
{
  "id": "string",
  "fileName": "string",
  "fileSize": "number",
  "uploadDate": "ISO date",
  "userId": "string",
  "userDirektorat": "string",
  "userSubdirektorat": "string",
  "userDivisi": "string",
  "fileType": "string",
  "status": "uploaded | pending",
  "tahun": "number",
  "checklistId": "string",
  "checklistDescription": "string",
  "source": "REGULAR | AOI"
}
```

## 🔌 **API Endpoints**

### **Base URL**: `http://localhost:3001/api`

### **User Management**
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/:id/documents` - Get user documents
- `GET /users/:id/aoi-documents` - Get user AOI documents

### **Struktur Perusahaan**
- `GET /struktur-perusahaan/direktorat` - Get all direktorat
- `GET /struktur-perusahaan/subdirektorat` - Get all subdirektorat
- `GET /struktur-perusahaan/divisi` - Get all divisi
- `GET /struktur-perusahaan/cascade` - Get cascading structure

### **AOI Management**
- `GET /aoi-tables` - Get all AOI tables
- `GET /aoi-tables/:id` - Get AOI table by ID
- `POST /aoi-tables` - Create AOI table
- `PUT /aoi-tables/:id` - Update AOI table
- `DELETE /aoi-tables/:id` - Delete AOI table
- `GET /aoi-tables/:id/recommendations` - Get recommendations by table
- `GET /aoi-recommendations` - Get all recommendations
- `POST /aoi-recommendations` - Create recommendation
- `PUT /aoi-recommendations/:id` - Update recommendation
- `DELETE /aoi-recommendations/:id` - Delete recommendation

### **Document Management**
- `GET /user-documents` - Get all documents
- `GET /user-documents/:id` - Get document by ID
- `POST /user-documents` - Create document
- `PUT /user-documents/:id` - Update document
- `DELETE /user-documents/:id` - Delete document
- `GET /documents/by-year/:year` - Get documents by year

### **AOI Documents**
- `GET /aoi-documents` - Get all AOI documents
- `GET /aoi-documents/:id` - Get AOI document by ID
- `POST /aoi-documents` - Create AOI document
- `PUT /aoi-documents/:id` - Update AOI document
- `DELETE /aoi-documents/:id` - Delete AOI document
- `GET /aoi-documents/by-year/:year` - Get AOI documents by year

### **Checklist GCG**
- `GET /checklist-gcg` - Get all checklists
- `GET /checklist-gcg/:id` - Get checklist by ID
- `POST /checklist-gcg` - Create checklist
- `PUT /checklist-gcg/:id` - Update checklist
- `DELETE /checklist-gcg/:id` - Delete checklist

### **Years**
- `GET /years` - Get all available years

## 🚀 **Getting Started**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start Backend Server Only**
```bash
npm run server
```

### **3. Start Frontend Only**
```bash
npm run dev
```

### **4. Start Both Frontend & Backend**
```bash
npm start
```

## 🔧 **Configuration**

### **Port Configuration**
- **Backend**: Port 3001
- **Frontend**: Port 5173 (default Vite)

### **CORS Configuration**
- All origins allowed (`*`)
- All HTTP methods supported
- Custom headers supported

## 📊 **Sample Data**
Database sudah dilengkapi dengan sample data untuk:
- 2 users (Super Admin & Admin GCG)
- Struktur perusahaan (3 direktorat, 3 subdirektorat, 3 divisi)
- 1 AOI table dengan 2 recommendations
- Sample documents dan checklist

## 🔒 **Security Notes**
⚠️ **Important**: JSON Server adalah development tool, tidak untuk production!
- No authentication/authorization
- No input validation
- No rate limiting
- Data stored in plain JSON

## 🚧 **Production Considerations**
Untuk production, pertimbangkan:
1. **Database**: PostgreSQL, MySQL, atau MongoDB
2. **Authentication**: JWT, OAuth, atau session-based
3. **Validation**: Input sanitization & validation
4. **Security**: HTTPS, CORS restrictions, rate limiting
5. **Monitoring**: Logging, error tracking, performance monitoring

## 📝 **API Documentation**
Full API documentation tersedia di:
- **Swagger/OpenAPI**: Bisa di-generate dari JSON Server
- **Postman Collection**: Export dari JSON Server
- **Frontend Service Layer**: `src/services/api.ts`

## 🆘 **Troubleshooting**

### **Port Already in Use**
```bash
# Kill process on port 3001
npx kill-port 3001
```

### **CORS Issues**
- Pastikan middleware CORS sudah terpasang
- Check browser console untuk error details

### **Database Reset**
```bash
# Reset ke sample data
cp db.json.backup db.json
```

## 📞 **Support**
Untuk pertanyaan atau masalah:
1. Check console logs
2. Verify API endpoints
3. Check database schema
4. Review CORS configuration

---
**Backend siap untuk development dan testing! 🎉**
