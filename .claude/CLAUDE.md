# GCG Document Hub - Debugging Session

## Project Overview
Document Hub Penilaian GCG (Good Corporate Governance Document Management System)
- **Tech Stack**: React + TypeScript + Vite (Frontend), Python Flask (Backend)
- **Current Status**: Successfully debugged and fixed critical React errors

## Recent Debugging Session Summary

### Initial Problems Identified
1. **React Hooks Error**: "Rendered more hooks than during the previous render"
2. **CORS Issues**: Frontend connecting to wrong backend port 
3. **Page Crashes**: Blank page when selecting years
4. **Duplicate Key Warnings**: React key conflicts in components
5. **Backend Connectivity**: API endpoint misconfigurations

## Issues Fixed

### 1. React Hooks Violation - MonthlyTrends Component
**Problem**: `useEffect` hook called after early return statement (line 231)
- Violated React Rules of Hooks (hooks must be called in same order every render)
- Caused "Rendered more hooks than during the previous render" error

**Solution**: 
- Moved all hooks (`useRef`, `useState`, `useEffect`) before any early returns
- Proper hook order: Context hooks → State hooks → Effect hooks → Early returns
- **File**: `src/components/dashboard/MonthlyTrends.tsx:50-57`

### 2. ChartData Initialization Order
**Problem**: `useEffect` trying to access `chartData` before declaration
- "can't access lexical declaration 'chartData' before initialization"
- `chartData` declared via `useMemo` later in component

**Solution**:
- Moved `useEffect` to after `chartData` `useMemo` declaration
- **File**: `src/components/dashboard/MonthlyTrends.tsx:233-240`

### 3. Backend Port Configuration
**Problem**: Frontend connecting to wrong port
- Frontend: `localhost:5001` (not running)  
- Backend: `localhost:5000` (actually running)

**Solution**:
- Updated API endpoints from port 5001 → 5000
- **Files**: 
  - `src/contexts/ChecklistContext.tsx:266`
  - `src/contexts/FileUploadContext.tsx:56`

### 4. Duplicate React Keys - SpiderChart Component
**Problem**: Duplicate subdirektorat names causing React key conflicts
- Multiple entries with same name in data
- Using `key={subName}` causing "Encountered two children with the same key" warnings

**Solution**:
- Deduplicated subdirektorat list using `Set`
- Changed key pattern: `key={subdir-${index}-${subName}}`
- **File**: `src/components/dashboard/SpiderChart.tsx:156, 327, 568`

## Current System State

### ✅ Working Components
- Backend API running on port 5000
- Frontend connecting properly to backend
- React components rendering without errors
- Year selection functionality working
- Dashboard components displaying correctly

### 🔧 Backend Services
- **Storage Service**: Dual support (local files + Supabase)
- **File Locking**: Race condition protection implemented
- **API Endpoints**: `/api/files`, `/api/config/aspects` responding correctly

### 📊 Frontend Features
- **Monthly Trends**: Progress tracking per subdirektorat
- **Spider Chart**: Performance radar with distribution visualization
- **Year Context**: Multi-year data switching
- **Struktur Perusahaan**: Organizational structure management

## Testing Checklist

### ✅ Completed
- [x] Fix React hooks error in MonthlyTrends component
- [x] Fix CORS issues - backend port configuration
- [x] Fix duplicate keys warning in SpiderChart component
- [x] Fix chartData initialization order issue
- [x] Test the fixes and page reload

### 🔄 In Progress / Next Steps
- [ ] Test API endpoint responses and fix any missing routes
- [ ] Debug any remaining year selection issues
- [ ] Test frontend-backend integration thoroughly
- [ ] Verify storage service functionality (local/Supabase)
- [ ] Test file upload and processing workflows
- [ ] Test organizational structure CRUD operations
- [ ] Run race condition tests to verify file locking
- [ ] Test admin settings and configuration pages
- [ ] Verify user authentication and authorization
- [ ] Test GCG assessment workflow and data persistence
- [ ] Test responsive design and UI components
- [ ] Run linting and type checking
- [ ] Test error handling and edge cases
- [ ] Performance testing and optimization

## Development Environment
- **OS**: Fedora Linux 42 (Workstation Edition)
- **Node.js**: Frontend development server on port 8080
- **Python**: Backend Flask server on port 5000
- **Development Mode**: Concurrent backend + frontend (`npm run dev`)

## Commands Used

### Development
```bash
# Start both backend and frontend
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
python backend/app.py
```

### Testing
```bash
# Test backend connectivity
curl -I http://localhost:5000
curl -s http://localhost:5000/api/files

# Check running processes
ps aux | grep python
```

### Debugging
```bash
# Check file structure
ls -la
find . -name "*.tsx" | grep -E "(MonthlyTrends|SpiderChart)"

# Search for port references
grep -r "5001" src/
grep -r "localhost:5000" src/
```

## Key Files Modified

1. **src/components/dashboard/MonthlyTrends.tsx**
   - Fixed React hooks order violations
   - Fixed chartData initialization timing
   - Moved useEffect after useMemo declaration

2. **src/components/dashboard/SpiderChart.tsx**
   - Fixed duplicate React keys
   - Deduplicated subdirektorat data
   - Improved key uniqueness

3. **src/contexts/ChecklistContext.tsx**
   - Updated API endpoint port from 5001 to 5000

4. **src/contexts/FileUploadContext.tsx**  
   - Updated API endpoint port from 5001 to 5000

## Architecture Notes

### Data Flow
1. **YearContext** provides selected year to all components
2. **StrukturPerusahaanContext** loads organizational structure
3. **ChecklistContext** manages GCG checklist data
4. **FileUploadContext** handles document uploads
5. **MonthlyTrends** displays progress per subdirektorat
6. **SpiderChart** visualizes performance radar

### Storage System
- **Local Mode**: File-based storage with threading locks
- **Supabase Mode**: Cloud storage integration
- **Race Condition Protection**: File locking mechanism implemented
- **Config Migration**: Excel to CSV format migration on startup

## Error Prevention Tips

### React Hooks Best Practices
1. Always call hooks at top level, before any early returns
2. Never call hooks conditionally or inside loops
3. Maintain consistent hook order across renders
4. Use unique keys for list items, avoid using array indices alone

### API Integration
1. Verify backend port configuration matches frontend calls
2. Test API endpoints manually before frontend integration
3. Check CORS configuration for cross-origin requests
4. Monitor network tab for failed API calls

### Data Handling
1. Deduplicate arrays before mapping to React elements
2. Use Set for removing duplicate entries efficiently
3. Validate data structure before rendering
4. Handle empty states and loading states properly

## Success Metrics
- ✅ No React errors in console
- ✅ Smooth year switching without crashes
- ✅ All dashboard components rendering correctly
- ✅ Backend API responding successfully
- ✅ No duplicate key warnings
- ✅ Proper data flow between contexts

## Future Maintenance
- Monitor for new React hooks violations when adding features
- Keep frontend/backend port configurations in sync
- Test data deduplication when new data sources are added
- Maintain proper error boundaries for robust error handling
- Regular testing of year switching and data persistence

# Latest Session: Tugaskan Ke Dropdown Issue - September 11, 2025

## Problem Report
User reported: "i tried adding a divisi in kelola dokumen in the [tugaskan ke] column and it doesnt work. i tried clicking on the drop down menu, selected a divisi, wow selected only or it to return to 'pilih divisi' or sumn"

## Root Cause Analysis
**ID Format Mismatch**: The system was experiencing a data synchronization issue between frontend and backend:

1. **Backend Data Structure**: Checklist items had timestamp-based IDs (e.g., `1857555632`, `1857555655`) 
2. **Expected Format**: Should use year+row format (e.g., 2025 row 1 = `251`, row 2 = `252`)
3. **Frontend Behavior**: AssignmentDropdown component trying to update items with incorrect ID format
4. **Update Failure**: Backend couldn't find items with timestamp IDs when frontend expected year+row IDs

## Technical Investigation
- **Data Found**: 256 checklist items for 2025 with timestamp-based IDs
- **PIC Assignments**: Items 1 and 2 already assigned to "Divisi Account Management and Corporate Marketing"
- **ID Generation Function**: `generate_checklist_id(year, row_number)` existed but wasn't used in batch creation

## Fixes Implemented

### 1. Backend ID Generation Fix
**File**: `/backend/app.py:2671`
**Change**: Updated batch checklist creation to use proper ID format
```python
# Before
'id': generate_unique_id(),

# After  
'id': generate_checklist_id(item.get('tahun'), item.get('rowNumber')),
```

### 2. Data Migration
**Created temporary endpoint**: `/api/config/checklist/fix-ids`
- Converted all 256 existing items from timestamp IDs to year+row format
- Preserved existing PIC assignments during migration
- Example conversions:
  - Row 1: `1857555632` → `251` (2025 + row 1)
  - Row 2: `1857555655` → `252` (2025 + row 2)
  - Row 256: `1857555XXX` → `25256` (2025 + row 256)

### 3. Verification Results
```json
{
  "count": 256,
  "message": "Successfully fixed 256 checklist IDs", 
  "success": true
}
```

**Sample Data After Fix**:
```json
{
  "id": 251,
  "rowNumber": 1,
  "deskripsi": "Pedoman Tata Kelola Perusahaan yang Baik/CoCG",
  "pic": "Divisi Account Management and Corporate Marketing"
}
```

## Files Modified
1. **backend/app.py**:
   - Line 2671: Fixed batch ID generation
   - Added temporary fix endpoint at line 2650
2. **Created utility scripts**:
   - `fix_checklist_ids.py`
   - `clear_and_fix_checklist.py`

## Expected Resolution
- **Tugaskan Ke dropdown** should now work correctly
- **ID consistency** between frontend and backend
- **PIC assignments** will persist instead of reverting to "Pilih Divisi"

## Status: ✅ RESOLVED
**Root Cause Found**: Frontend state management bug in ChecklistContext

### Final Fix Applied
**Multiple PIC Field Issues Found and Fixed**:

#### 1. ChecklistContext Local State Update
- **File**: `src/contexts/ChecklistContext.tsx:443`
- **Issue**: `editChecklist` only updated `aspek`, `deskripsi`, `tahun` but **missed `pic` field**
- **Fix**: Added `pic` field to local state update
```typescript
// Before
const updated = checklist.map((c) => (c.id === id ? { ...c, aspek, deskripsi, tahun: year } : c));
// After (FIXED)  
const updated = checklist.map((c) => (c.id === id ? { ...c, aspek, deskripsi, pic, tahun: year } : c));
```

#### 2. Auto-Save Data Transformation
- **File**: `src/pages/admin/PengaturanBaru.tsx:787` 
- **Issue**: `debouncedSave` function **stripped PIC field** when syncing to ChecklistContext
- **Fix**: Added `pic` field to contextData transformation
```typescript
// Before
const contextData = items.map(item => ({
  id: item.id, aspek: item.aspek, deskripsi: item.deskripsi, tahun: item.tahun
}));
// After (FIXED)
const contextData = items.map(item => ({
  id: item.id, aspek: item.aspek, deskripsi: item.deskripsi, pic: item.pic, tahun: item.tahun
}));
```

#### 3. Change Tracking for PIC Assignments  
- **File**: `src/pages/admin/PengaturanBaru.tsx:1928, 1970`
- **Issue**: `handleAssignment` didn't call `trackItemChange()` for PIC updates
- **Fix**: Added `trackItemChange(checklistId)` calls after PIC state updates

#### 4. Manual Save Function Missing Backend Persistence
- **File**: `src/pages/admin/PengaturanBaru.tsx:2212-2224`
- **Issue**: `handleSaveItem` only updated local state, didn't save to backend
- **Fix**: Added `await editChecklist()` call to persist changes to backend

#### 5. Manual Sync Function Stripping PIC Field
- **File**: `src/pages/admin/PengaturanBaru.tsx:2302`
- **Issue**: `syncDataWithContext` missing `pic` field when syncing to ChecklistContext
- **Fix**: Added `pic: item.pic` to contextData transformation

#### 6. Automatic Cache Detection for Old IDs
- **File**: `src/contexts/ChecklistContext.tsx:152-163, 204-215`
- **Issue**: localStorage cached old timestamp IDs causing frontend/backend mismatch
- **Fix**: Added automatic detection and clearing of old timestamp IDs (>1000000000)

### Verification Results
- **Backend API**: ✅ Working correctly (PUT `/api/config/checklist/{id}` saves PIC)  
- **ID Format**: ✅ Properly using year+row format (251, 252, etc.)
- **Data Persistence**: ✅ PIC assignments saved to database
- **Frontend State**: ✅ Now properly synced with backend after fix

## System Status After Fix
- **Backend**: Running on port 5000, all APIs functional
- **Frontend**: Running on port 8080, state management fixed
- **Data**: 256 checklist items with correct ID format
- **Assignment Flow**: Dropdown → API Call → Backend Save → Frontend State Update → UI Refresh

### Expected Behavior Now
1. User selects divisi in "Tugaskan Ke" dropdown
2. AssignmentDropdown calls `handleAssignment` function  
3. `editChecklist` API call updates backend successfully
4. ChecklistContext updates local state **including PIC field**
5. Component re-renders with assigned divisi showing
6. Assignment **persists** instead of reverting to "Pilih Divisi"

---
*Last Updated: 2025-09-11*
*Session Type: Frontend State Management Bug Fix*  
*Status: ✅ RESOLVED - PIC Field Update Missing in Local State*