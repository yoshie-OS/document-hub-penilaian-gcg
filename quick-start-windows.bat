@echo off
REM ============================================================================
REM GCG Document Hub - Quick Start (Windows)
REM For users who already have everything set up
REM ============================================================================

title GCG Document Hub - Quick Start

echo Starting GCG Document Hub...

REM Start backend
start "GCG Backend" cmd /c "cd backend && call venv\Scripts\activate.bat && python app.py"

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start frontend
start "GCG Frontend" cmd /c "npm run frontend:dev"

REM Wait for frontend
timeout /t 5 /nobreak >nul

REM Open browser
start http://localhost:8081

echo.
echo ============================================================================
echo   GCG Document Hub Started!
echo
echo   Frontend: http://localhost:8081
echo   Backend:  http://localhost:5000
echo
echo   Application opened in browser automatically.
echo   Keep the backend and frontend windows open.
echo ============================================================================
echo.

pause