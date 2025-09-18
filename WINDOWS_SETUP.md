# Windows Setup Guide for GCG Document Hub

## Windows Compatibility Fixes Applied

This project has been updated to ensure full compatibility with Windows systems. The main issue was Unicode encoding problems with emoji characters in print statements.

### Issues Fixed

1. **Unicode Encoding Error** (`UnicodeEncodeError: 'charmap' codec can't encode character '\u2705'`)
   - Windows CP1252 codec couldn't handle Unicode emoji characters
   - **Solution**: Created `windows_utils.py` with Windows-compatible print functions

2. **Browserslist Database Warning**
   - Outdated browser compatibility database (11 months old)
   - **Solution**: Updated caniuse-lite database

## Windows-Specific Installation Steps

### 1. Prerequisites

Ensure you have the following installed:
- **Python 3.8+** (Download from [python.org](https://python.org))
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **Git** (Download from [git-scm.com](https://git-scm.com))

### 2. Environment Setup

1. **Clone the repository:**
   ```cmd
   git clone <repository-url>
   cd document-hub-penilaian-gcg
   ```

2. **Set up Python virtual environment:**
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```cmd
   cd backend
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies:**
   ```cmd
   cd ..
   npm install
   ```

### 3. Configuration

1. **Create `.env` file in root directory:**
   ```env
   # Database Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_BUCKET=your_bucket_name

   # Storage Configuration
   STORAGE_MODE=supabase

   # Application Configuration
   NODE_ENV=development
   FLASK_ENV=development
   ```

2. **Windows Console Encoding (Automatically Handled)**
   The application now automatically sets proper console encoding for Windows compatibility.

### 4. Running the Application

**Option 1: Using npm dev script (Recommended)**
```cmd
npm run dev
```

**Option 2: Manual startup**

Terminal 1 (Backend):
```cmd
cd backend
venv\Scripts\activate
python app.py
```

Terminal 2 (Frontend):
```cmd
npm run frontend:dev
```

### 5. Windows-Specific Considerations

#### Console Output
- All Unicode emoji characters are automatically replaced with ASCII equivalents
- Examples:
  - `✅` → `[SUCCESS]`
  - `❌` → `[ERROR]`
  - `🚀` → `[START]`
  - `🔧` → `[DEBUG]`

#### File Paths
- The application handles both Windows (`\`) and Unix (`/`) path separators
- All file operations use `pathlib.Path` for cross-platform compatibility

#### Port Configuration
- Frontend: Automatically selects port 8081 if 8080 is busy
- Backend: Runs on port 5000

## Troubleshooting Windows Issues

### Common Problems and Solutions

1. **"Command not found" errors:**
   - Ensure Python and Node.js are in your system PATH
   - Restart Command Prompt after installing software
   - Use full paths if necessary: `C:\Python39\python.exe`

2. **Permission Denied errors:**
   - Run Command Prompt as Administrator
   - Check antivirus software isn't blocking Python/Node.js

3. **Module import errors:**
   - Ensure virtual environment is activated: `venv\Scripts\activate`
   - Verify all dependencies are installed: `pip list`

4. **Port already in use:**
   - Kill existing processes: `netstat -ano | findstr :5000`
   - Use Task Manager to end conflicting processes

5. **Unicode/encoding errors:**
   - These should be automatically handled by the new `windows_utils.py`
   - If you still see issues, ensure your terminal supports UTF-8

### Development Tips for Windows

1. **Use PowerShell or Windows Terminal** for better Unicode support
2. **Set console encoding explicitly** if needed:
   ```cmd
   chcp 65001
   ```
3. **Use virtual environments** to avoid dependency conflicts
4. **Keep paths short** to avoid Windows path length limitations

## Verification Steps

After setup, verify everything works:

1. **Check backend is running:**
   ```cmd
   curl http://localhost:5000/api/health
   ```

2. **Check frontend is accessible:**
   Open browser to `http://localhost:8081`

3. **Verify file operations:**
   - Try uploading a document
   - Verify download functionality
   - Test bulk download feature

## Performance Notes

- **Antivirus Impact**: Windows Defender may slow file operations
- **Path Scanning**: Consider excluding project folder from real-time scanning
- **Memory Usage**: Windows may use more RAM than Linux for Node.js applications

## Support

If you encounter Windows-specific issues:

1. Check this guide first
2. Verify all prerequisites are installed correctly
3. Ensure Windows environment variables are set
4. Try running as Administrator if permission issues persist

## Technical Implementation Details

The Windows compatibility layer includes:

### `backend/windows_utils.py`
- `safe_print()`: Replaces Unicode emoji with ASCII equivalents
- `set_console_encoding()`: Configures proper console encoding
- `is_windows()`: Cross-platform detection utility

### Modified Files for Windows Compatibility
- `backend/app.py`: Uses `safe_print` instead of `print`
- `backend/storage_service.py`: Windows-compatible logging
- `backend/start_api.py`: Proper console encoding setup
- `backend/test_race_condition.py`: Compatible output functions

This ensures the application runs identically on Windows and Linux systems without encoding issues.