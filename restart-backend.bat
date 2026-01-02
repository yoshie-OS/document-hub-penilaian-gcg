@echo off
echo ========================================
echo KILLING PYTHON BACKEND PROCESSES
echo ========================================
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo STARTING BACKEND ON PORT 5001
echo ========================================
cd /d "%~dp0backend"
start "GCG Backend - Port 5001" cmd /k "python start_port_5001.py"

echo.
echo ========================================
echo Backend restarting...
echo Check the new window for backend logs
echo ========================================
timeout /t 5 /nobreak >nul

echo.
echo Testing backend health...
curl -s http://localhost:5001/api/health

echo.
echo ========================================
echo Testing year endpoint with new code...
echo ========================================
curl -X POST http://localhost:5001/api/config/tahun-buku -H "Content-Type: application/json" -d "{\"tahun\": 2099}"

echo.
echo.
echo ========================================
echo Done! Backend should be running now.
echo If you see "Year reactivated" above,
echo the new code is working correctly!
echo ========================================
pause
