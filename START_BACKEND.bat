@echo off
echo ======================================================================
echo Starting GCG Document Hub Backend
echo ======================================================================
echo.

cd backend

echo Checking if port 5000 is available...
netstat -ano | findstr :5000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo WARNING: Port 5000 is already in use!
    echo Please disable Windows AirPlay Receiver or use a different port.
    echo.
    echo To use a different port, run:
    echo    set FLASK_PORT=5001
    echo    python app.py
    echo.
    pause
    exit /b 1
)

echo.
echo Port 5000 is available. Starting Flask backend...
echo.

python app.py

pause
