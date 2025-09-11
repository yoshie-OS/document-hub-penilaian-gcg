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

---
*Last Updated: 2025-09-07*
*Session Type: Debugging & Error Resolution*
*Status: Successfully Resolved*