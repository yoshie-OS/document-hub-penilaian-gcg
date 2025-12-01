# 🔄 localStorage → SQLite Complete Migration Plan

## 📊 **Current Situation Analysis**

### **localStorage Usage Audit:**

Found **10 localStorage keys** storing application data:

| localStorage Key | Context | Purpose | Records | Priority |
|------------------|---------|---------|---------|----------|
| `users` | UserContext | User accounts | ~3 | 🔴 HIGH |
| `currentUser` | UserContext | Login session | 1 | 🟢 LOW (keep) |
| `checklistGCG` | ChecklistContext | GCG checklist items | ~3,216 | 🔴 HIGH |
| `documentMetadata` | DocumentMetadataContext | Document metadata | Variable | 🔴 HIGH |
| `uploadedFiles` | FileUploadContext | File tracking | Variable | 🔴 HIGH |
| `direktorat` | StrukturPerusahaanContext | Direktorat data | ~96 | 🔴 HIGH |
| `subdirektorat` | StrukturPerusahaanContext | Subdirektorat data | ~120 | 🔴 HIGH |
| `divisi` | StrukturPerusahaanContext | Divisi data | Variable | 🔴 HIGH |
| `anakPerusahaan` | StrukturPerusahaanContext | Subsidiary companies | ~84 | 🔴 HIGH |
| `availableYears` | YearContext | Available years | ~12 | 🔴 HIGH |

**Total localStorage data:** ~3,600+ records

---

## ✅ **What Should Stay in localStorage:**

**ONLY authentication/session data:**
- `currentUser` - Currently logged in user (session)
- `authToken` - JWT token (if implemented)

**Everything else → SQLite database!**

---

## 🎯 **Migration Strategy**

### **Phase 1: Preparation** (1-2 hours)
✅ Already done:
- SQLite database created
- Schema defined (14 tables)
- Backend API created (30+ endpoints)

### **Phase 2: API Implementation** (2-3 hours)
- Add missing CRUD endpoints
- Add batch operations for performance
- Implement proper error handling
- Add request validation

### **Phase 3: Context Migration** (3-4 hours)
- Update 7 React contexts to use API
- Replace localStorage calls with fetch/axios
- Add loading states
- Add error handling
- Implement optimistic updates

### **Phase 4: Data Migration** (1 hour)
- Export existing localStorage data
- Import into SQLite database
- Verify data integrity
- Clear localStorage (except auth)

### **Phase 5: Testing** (2-3 hours)
- Test all CRUD operations
- Test across multiple users
- Test year switching
- Test data persistence
- Performance testing

**Total Estimated Time:** 9-13 hours

---

## 🗄️ **Database Status**

### **Already in SQLite:**
✅ Schema created (14 tables)
✅ Database initialized
✅ Seed data loaded (3,216 checklist items)
✅ Export API working

### **Need to Add:**
- CRUD endpoints for all contexts
- Batch operations
- Transaction support
- Error handling

---

## 📋 **Detailed Migration Plan**

### **Context 1: UserContext** 🔴 CRITICAL

**Current localStorage:**
```typescript
localStorage.getItem('users')
localStorage.setItem('users', JSON.stringify(users))
localStorage.getItem('currentUser')  // ✅ Keep this (session)
```

**Migration to SQLite API:**
```typescript
// GET users
GET /api/users
Response: { success: true, data: User[] }

// CREATE user
POST /api/users
Body: { email, password, role, name, ... }
Response: { success: true, id: number }

// UPDATE user
PUT /api/users/:id
Body: { email, role, name, ... }
Response: { success: true }

// DELETE user
DELETE /api/users/:id
Response: { success: true }
```

**Keep in localStorage:**
- ✅ `currentUser` - Session data only

**Changes needed:**
1. Update `UserContext.tsx` to fetch from API
2. Keep `currentUser` in localStorage for session
3. Remove `users` from localStorage

---

### **Context 2: ChecklistContext** 🔴 CRITICAL

**Current localStorage:**
```typescript
localStorage.getItem('checklistGCG')  // ~3,216 items
localStorage.setItem('checklistGCG', JSON.stringify(checklist))
```

**Migration to SQLite API:**
```typescript
// GET checklist by year
GET /api/checklist/:year
Response: { success: true, data: ChecklistGCG[] }

// ADD checklist item
POST /api/checklist
Body: { aspek, deskripsi, tahun }

// EDIT checklist item
PUT /api/checklist/:id
Body: { aspek, deskripsi, tahun }

// DELETE checklist item
DELETE /api/checklist/:id

// ADD aspek (adds to all items with that aspek)
POST /api/checklist/aspek
Body: { aspek, tahun }

// EDIT aspek (updates all items with that aspek)
PUT /api/checklist/aspek
Body: { oldAspek, newAspek, tahun }

// DELETE aspek (deletes all items with that aspek)
DELETE /api/checklist/aspek/:aspek/:tahun
```

**Status:**
- ✅ Database table exists
- ✅ Data seeded (3,216 items)
- ✅ GET endpoint exists
- ❌ CRUD endpoints need implementation

---

### **Context 3: DocumentMetadataContext** 🔴 HIGH

**Current localStorage:**
```typescript
localStorage.getItem('documentMetadata')
localStorage.setItem('documentMetadata', JSON.stringify(documents))
```

**Migration to SQLite API:**
```typescript
// GET documents by year
GET /api/documents/:year
Response: { success: true, data: DocumentMetadata[] }

// CREATE document
POST /api/documents
Body: { title, documentNumber, year, ... }

// UPDATE document
PUT /api/documents/:id
Body: { title, documentNumber, ... }

// DELETE document
DELETE /api/documents/:id
```

**Status:**
- ✅ Database table exists
- ✅ GET endpoint exists
- ✅ POST endpoint exists
- ❌ PUT/DELETE endpoints need implementation

---

### **Context 4: FileUploadContext** 🔴 HIGH

**Current localStorage:**
```typescript
localStorage.getItem('uploadedFiles')
localStorage.setItem('uploadedFiles', JSON.stringify(files))
```

**Migration to SQLite API:**
```typescript
// GET files by year
GET /api/uploaded-files/:year
Response: { success: true, data: UploadedFile[] }

// CREATE file record
POST /api/uploaded-files
Body: { fileName, fileSize, year, ... }

// DELETE file record
DELETE /api/uploaded-files/:id
```

**Status:**
- ✅ Database table exists
- ❌ All endpoints need implementation

---

### **Context 5: StrukturPerusahaanContext** 🔴 HIGH

**Current localStorage (4 keys):**
```typescript
localStorage.getItem('direktorat')
localStorage.getItem('subdirektorat')
localStorage.getItem('divisi')
localStorage.getItem('anakPerusahaan')
```

**Migration to SQLite API:**
```typescript
// Direktorat
GET /api/direktorat/:year
POST /api/direktorat
PUT /api/direktorat/:id
DELETE /api/direktorat/:id

// Subdirektorat
GET /api/subdirektorat/:year
POST /api/subdirektorat
PUT /api/subdirektorat/:id
DELETE /api/subdirektorat/:id

// Divisi
GET /api/divisi/:year
POST /api/divisi
PUT /api/divisi/:id
DELETE /api/divisi/:id

// Anak Perusahaan
GET /api/anak-perusahaan/:year
POST /api/anak-perusahaan
PUT /api/anak-perusahaan/:id
DELETE /api/anak-perusahaan/:id
```

**Status:**
- ✅ Database tables exist
- ✅ GET endpoints exist (all)
- ❌ POST/PUT/DELETE endpoints need implementation

---

### **Context 6: YearContext** 🟡 MEDIUM

**Current localStorage:**
```typescript
localStorage.getItem('availableYears')
localStorage.setItem('availableYears', JSON.stringify(years))
```

**Migration to SQLite API:**
```typescript
// GET all years
GET /api/years
Response: { success: true, data: number[] }

// ADD year
POST /api/years
Body: { year: number }

// DELETE year
DELETE /api/years/:year
```

**Status:**
- ✅ Database table exists
- ✅ GET endpoint exists
- ❌ POST/DELETE endpoints need implementation

---

## 🔧 **Implementation Steps**

### **Step 1: Complete API Endpoints** (2-3 hours)

Add missing CRUD endpoints to `backend/api_sqlite.py`:

```python
# Checklist CRUD
@app.route('/api/checklist/<int:id>', methods=['PUT'])
def update_checklist(id):
    # Implementation

@app.route('/api/checklist/<int:id>', methods=['DELETE'])
def delete_checklist(id):
    # Implementation

# Documents CRUD
@app.route('/api/documents/<int:id>', methods=['PUT'])
def update_document(id):
    # Implementation

# ... and so on for all contexts
```

**Files to modify:**
- `backend/api_sqlite.py` - Add ~30 new endpoints

---

### **Step 2: Update React Contexts** (3-4 hours)

Update each context to use API instead of localStorage:

**Example: ChecklistContext**

**Before:**
```typescript
const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);

useEffect(() => {
  const data = JSON.parse(localStorage.getItem("checklistGCG") || "[]");
  setChecklist(data);
}, []);

const addChecklist = (aspek: string, deskripsi: string, year: number) => {
  const newChecklist = { id: Date.now(), aspek, deskripsi, tahun: year };
  const updated = [...checklist, newChecklist];
  setChecklist(updated);
  localStorage.setItem("checklistGCG", JSON.stringify(updated));
};
```

**After:**
```typescript
const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchChecklist();
}, []);

const fetchChecklist = async () => {
  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/api/checklist/all');
    const data = await response.json();
    if (data.success) {
      setChecklist(data.data);
    }
  } catch (err) {
    setError('Failed to load checklist');
  } finally {
    setLoading(false);
  }
};

const addChecklist = async (aspek: string, deskripsi: string, year: number) => {
  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aspek, deskripsi, tahun: year })
    });
    const data = await response.json();
    if (data.success) {
      // Refresh data or optimistic update
      fetchChecklist();
    }
  } catch (err) {
    setError('Failed to add checklist');
  } finally {
    setLoading(false);
  }
};
```

**Files to modify:**
1. `src/contexts/ChecklistContext.tsx`
2. `src/contexts/DocumentMetadataContext.tsx`
3. `src/contexts/FileUploadContext.tsx`
4. `src/contexts/StrukturPerusahaanContext.tsx`
5. `src/contexts/YearContext.tsx`
6. `src/contexts/UserContext.tsx`
7. `src/contexts/DireksiContext.tsx`

---

### **Step 3: Data Migration** (1 hour)

**Option A: Automatic Migration (Recommended)**

Create migration endpoint:
```typescript
// Run once to migrate all localStorage data
POST /api/migrate/localstorage
Body: {
  users: [...],
  checklistGCG: [...],
  documentMetadata: [...],
  // ... all localStorage data
}
Response: { success: true, migrated: 3600 }
```

**Option B: Manual Migration**

Use existing `migrate_localstorage.py` script:
```bash
# 1. Export from browser
# (Use browser console script)

# 2. Migrate to database
python backend/migrate_localstorage.py localstorage_export.json
```

---

### **Step 4: Clean Up localStorage** (15 minutes)

After successful migration:

```typescript
// Clear all app data (except session)
const clearAppLocalStorage = () => {
  const currentUser = localStorage.getItem('currentUser');

  // Remove all app keys
  localStorage.removeItem('users');
  localStorage.removeItem('checklistGCG');
  localStorage.removeItem('documentMetadata');
  localStorage.removeItem('uploadedFiles');
  localStorage.removeItem('direktorat');
  localStorage.removeItem('subdirektorat');
  localStorage.removeItem('divisi');
  localStorage.removeItem('anakPerusahaan');
  localStorage.removeItem('availableYears');

  // Keep session
  if (currentUser) {
    localStorage.setItem('currentUser', currentUser);
  }
};
```

---

## 📊 **Before vs After Comparison**

### **Before (Current):**
```
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  ┌─────────────────────────────┐   │
│  │ Contexts use localStorage   │   │
│  │ - 10 different keys         │   │
│  │ - ~3,600 records            │   │
│  │ - 5-10 MB limit             │   │
│  │ - No integrity checks       │   │
│  │ - Single user only          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

❌ Issues:
- Data loss on browser clear
- No multi-user support
- No data validation
- No audit trail
- Storage limit (5-10 MB)
```

### **After (Proposed):**
```
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  ┌─────────────────────────────┐   │
│  │ Contexts use API calls      │   │
│  │ - Loading states            │   │
│  │ - Error handling            │   │
│  │ - Optimistic updates        │   │
│  └──────────┬──────────────────┘   │
└─────────────┼────────────────────────┘
              │ REST API
              ▼
┌─────────────────────────────────────┐
│  Backend (Flask + SQLite)           │
│  ┌─────────────────────────────┐   │
│  │ - Unlimited storage         │   │
│  │ - Data integrity (FK)       │   │
│  │ - Multi-user support        │   │
│  │ - Audit trail               │   │
│  │ - Transactions              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

✅ Benefits:
- Persistent storage
- Multi-user support
- Data validation
- Full audit trail
- Unlimited storage
- Better performance
```

---

## 🎯 **Proposed Timeline**

### **Phase 1: Backend API (2-3 hours)**
- [ ] Add all missing CRUD endpoints
- [ ] Add batch operations
- [ ] Add validation
- [ ] Add error handling
- [ ] Test all endpoints

### **Phase 2: Frontend Contexts (3-4 hours)**
- [ ] Update ChecklistContext
- [ ] Update DocumentMetadataContext
- [ ] Update FileUploadContext
- [ ] Update StrukturPerusahaanContext
- [ ] Update YearContext
- [ ] Update UserContext (keep session in localStorage)
- [ ] Add loading states everywhere
- [ ] Add error handling everywhere

### **Phase 3: Data Migration (1 hour)**
- [ ] Export localStorage data
- [ ] Run migration script
- [ ] Verify data in SQLite
- [ ] Test API access
- [ ] Clear localStorage (except session)

### **Phase 4: Testing (2-3 hours)**
- [ ] Test all pages
- [ ] Test CRUD operations
- [ ] Test multi-user access
- [ ] Test year switching
- [ ] Test download buttons
- [ ] Performance testing

**Total: 8-11 hours**

---

## ⚠️ **Risks & Mitigation**

### **Risk 1: Data Loss During Migration**
**Mitigation:**
- Backup localStorage before migration
- Test migration on development first
- Keep localStorage data until verified
- Implement rollback capability

### **Risk 2: API Performance Issues**
**Mitigation:**
- Implement caching in frontend
- Add loading states
- Use optimistic updates
- Batch operations where possible

### **Risk 3: Breaking Existing Functionality**
**Mitigation:**
- Incremental migration (one context at a time)
- Comprehensive testing
- Keep old code commented out initially
- Easy rollback plan

---

## 🎓 **Recommendation**

### **My Recommendation: ✅ DO IT!**

**Why:**
1. ✅ **Security:** SQLite is more secure than localStorage
2. ✅ **Scalability:** No 5-10 MB limit
3. ✅ **Multi-user:** Supports concurrent access
4. ✅ **Data Integrity:** Foreign keys, constraints
5. ✅ **Audit Trail:** Track all changes
6. ✅ **Better UX:** Proper loading states, error handling
7. ✅ **Future-proof:** Easy to add features later

**Approach:**
- **Incremental migration** - One context at a time
- **Start with:** YearContext (simplest)
- **Then:** ChecklistContext (most data)
- **Finally:** Others
- **Keep:** currentUser in localStorage (session only)

---

## 📋 **Next Steps**

**If you approve this plan:**

1. **I'll implement** all missing API endpoints
2. **I'll update** all React contexts to use API
3. **I'll create** migration script for existing data
4. **I'll add** loading states and error handling
5. **I'll test** everything thoroughly

**Estimated total time:** 8-11 hours of work

---

## 💾 **Final localStorage Usage After Migration**

```typescript
// ONLY these should remain in localStorage:
localStorage.setItem('currentUser', JSON.stringify(user))  // Session only
localStorage.setItem('authToken', token)                    // If using JWT

// Everything else → SQLite database! ✅
```

---

**Do you approve this migration plan?**

Let me know if you want me to:
1. ✅ Proceed with full migration
2. 🔄 Modify the plan
3. 📝 Start with a specific context first
4. ❓ Need more details on any part

