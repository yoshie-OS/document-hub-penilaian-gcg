@echo off
REM ============================================================================
REM GCG Document Hub - Windows Startup Script
REM Double-click this file to start the application automatically
REM ============================================================================

title GCG Document Hub Startup

echo.
echo ============================================================================
echo                    GCG Document Hub - Starting Up
echo ============================================================================
echo.

REM Check if Python is available
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from: https://python.org
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is available
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo [INFO] Creating Python virtual environment...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        echo.
        pause
        exit /b 1
    )
    cd ..
)

REM Activate virtual environment and install dependencies
echo [INFO] Setting up Python dependencies...
cd backend
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    echo.
    pause
    exit /b 1
)

REM Install Python requirements if they don't exist
if not exist "venv\Lib\site-packages\flask" (
    echo [INFO] Installing Python packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies
        echo.
        pause
        exit /b 1
    )
)

cd ..

REM Install Node.js dependencies if they don't exist
if not exist "node_modules" (
    echo [INFO] Installing Node.js packages...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies
        echo.
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] No .env file found!
    echo Please create a .env file with your Supabase configuration
    echo Example:
    echo SUPABASE_URL=your_supabase_url
    echo SUPABASE_KEY=your_supabase_key
    echo SUPABASE_BUCKET=your_bucket_name
    echo STORAGE_MODE=supabase
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

echo.
echo ============================================================================
echo                         Starting Services
echo ============================================================================
echo.

REM Start backend in background
echo [INFO] Starting Backend Server...
cd backend
start "GCG Backend" cmd /c "call venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

cd ..

REM Start frontend
echo [INFO] Starting Frontend Server...
start "GCG Frontend" cmd /c "npm run frontend:dev"

REM Wait for frontend to start
echo [INFO] Waiting for frontend to initialize...
timeout /t 8 /nobreak >nul

REM Open browser automatically
echo [INFO] Opening application in browser...
timeout /t 3 /nobreak >nul

REM Try multiple ways to open browser (different Windows versions)
start http://localhost:8081 2>nul
if errorlevel 1 (
    start "" "http://localhost:8081" 2>nul
)
if errorlevel 1 (
    explorer "http://localhost:8081" 2>nul
)

echo.
echo ============================================================================
echo                    GCG Document Hub Started Successfully!
echo ============================================================================
echo.
echo Frontend: http://localhost:8081
echo Backend:  http://localhost:5000
echo.
echo [INFO] Two command windows have opened:
echo   - GCG Backend: Python Flask server
echo   - GCG Frontend: React development server
echo.
echo [INFO] Application should open automatically in your browser
echo        If not, manually navigate to: http://localhost:8081
echo.
echo [WARNING] Do NOT close this window or the command windows
echo           to keep the application running.
echo.
echo Press any key to show application status...
pause >nul

REM Show status
echo.
echo ============================================================================
echo                         Application Status
echo ============================================================================
echo.

REM Check if backend is responding
echo [INFO] Checking Backend Status...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend may not be ready yet. Please wait a moment.
) else (
    echo [SUCCESS] Backend is running and responding
)

REM Check if frontend is responding
echo [INFO] Checking Frontend Status...
curl -s http://localhost:8081 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend may not be ready yet. Please wait a moment.
) else (
    echo [SUCCESS] Frontend is running and responding
)

echo.
echo ============================================================================
echo                         Usage Instructions
echo ============================================================================
echo.
echo 1. The application is now running at: http://localhost:8081
echo 2. Upload GCG documents using the web interface
echo 3. Monitor processing status in real-time
echo 4. Download processed results
echo.
echo To stop the application:
echo 1. Close the browser tab
echo 2. Close the "GCG Backend" and "GCG Frontend" command windows
echo 3. Close this window
echo.
echo ============================================================================
echo                    Press any key to exit this startup script
echo                   (This will NOT stop the application)
echo ============================================================================
pause >nul

echo.
echo [INFO] Startup script completed. Application continues running.
echo [INFO] Check the other command windows for application logs.
echo.