@echo off
echo ======================================================================
echo Starting GCG Document Hub Backend on PORT 5001
echo ======================================================================
echo.

cd backend

echo Setting Flask port to 5001...
set FLASK_PORT=5001

echo.
echo Starting Flask backend on http://localhost:5001
echo.

python app.py

pause
