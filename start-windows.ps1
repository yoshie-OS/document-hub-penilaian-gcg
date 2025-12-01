# ============================================================================
# GCG Document Hub - Windows PowerShell Startup Script
# Right-click and "Run with PowerShell" or double-click if PowerShell is default
# ============================================================================

$Host.UI.RawUI.WindowTitle = "GCG Document Hub Startup"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                    GCG Document Hub - Starting Up" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "[INFO] Checking Python installation..." -ForegroundColor Green
if (-not (Test-Command "python")) {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from: https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Checking Node.js installation..." -ForegroundColor Green
if (-not (Test-Command "node")) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "backend\venv")) {
    Write-Host "[INFO] Creating Python virtual environment..." -ForegroundColor Green
    Set-Location "backend"
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location ".."
}

# Install Python dependencies if needed
Write-Host "[INFO] Checking Python dependencies..." -ForegroundColor Green
if (-not (Test-Path "backend\venv\Lib\site-packages\flask")) {
    Write-Host "[INFO] Installing Python packages..." -ForegroundColor Green
    Set-Location "backend"
    & "venv\Scripts\activate.ps1"
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install Python dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location ".."
}

# Install Node.js dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing Node.js packages..." -ForegroundColor Green
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install Node.js dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] No .env file found!" -ForegroundColor Yellow
    Write-Host "Please create a .env file with your Supabase configuration" -ForegroundColor Yellow
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host "SUPABASE_URL=your_supabase_url" -ForegroundColor Gray
    Write-Host "SUPABASE_KEY=your_supabase_key" -ForegroundColor Gray
    Write-Host "SUPABASE_BUCKET=your_bucket_name" -ForegroundColor Gray
    Write-Host "STORAGE_MODE=supabase" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                         Starting Services" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
Write-Host "[INFO] Starting Backend Server..." -ForegroundColor Green
$backendCmd = "cd backend; .\venv\Scripts\activate.ps1; python app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# Wait for backend
Write-Host "[INFO] Waiting for backend to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 5

# Start frontend in new window
Write-Host "[INFO] Starting Frontend Server..." -ForegroundColor Green
$frontendCmd = "npm run frontend:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

# Wait for frontend
Write-Host "[INFO] Waiting for frontend to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 8

# Open browser
Write-Host "[INFO] Opening application in browser..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:8081"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                    GCG Document Hub Started Successfully!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:8081" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Two PowerShell windows have opened:" -ForegroundColor Green
Write-Host "  - Backend: Python Flask server" -ForegroundColor Gray
Write-Host "  - Frontend: React development server" -ForegroundColor Gray
Write-Host ""
Write-Host "[INFO] Application should open automatically in your browser" -ForegroundColor Green
Write-Host "        If not, manually navigate to: http://localhost:8081" -ForegroundColor Gray
Write-Host ""
Write-Host "[WARNING] Do NOT close the PowerShell windows to keep the application running." -ForegroundColor Yellow
Write-Host ""

# Wait and check status
Read-Host "Press Enter to check application status"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                         Application Status" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check backend status
Write-Host "[INFO] Checking Backend Status..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[SUCCESS] Backend is running and responding" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend may not be ready yet. Please wait a moment." -ForegroundColor Yellow
}

# Check frontend status
Write-Host "[INFO] Checking Frontend Status..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[SUCCESS] Frontend is running and responding" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Frontend may not be ready yet. Please wait a moment." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                         Usage Instructions" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. The application is now running at: http://localhost:8081" -ForegroundColor White
Write-Host "2. Upload GCG documents using the web interface" -ForegroundColor White
Write-Host "3. Monitor processing status in real-time" -ForegroundColor White
Write-Host "4. Download processed results" -ForegroundColor White
Write-Host ""
Write-Host "To stop the application:" -ForegroundColor Yellow
Write-Host "1. Close the browser tab" -ForegroundColor Gray
Write-Host "2. Close the Backend and Frontend PowerShell windows" -ForegroundColor Gray
Write-Host "3. Close this window" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                    Press any key to exit this startup script" -ForegroundColor Yellow
Write-Host "                   (This will NOT stop the application)" -ForegroundColor Gray
Write-Host "============================================================================" -ForegroundColor Cyan

Read-Host ""

Write-Host ""
Write-Host "[INFO] Startup script completed. Application continues running." -ForegroundColor Green
Write-Host "[INFO] Check the other PowerShell windows for application logs." -ForegroundColor Green