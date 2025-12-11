# Installation Guide - GCG Document Hub

## Quick Setup (Tell your coworker to run these)

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm run dev
```

This will start:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:8080` (or 8081 if 8080 is busy)

## If Installation Fails

### Backend Issues
```bash
# Uninstall all packages and reinstall
pip uninstall -y flask flask-cors werkzeug pandas openpyxl python-dotenv bcrypt requests urllib3 aiohttp
pip install -r backend/requirements.txt
```

### Frontend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Required Packages

### Backend (Python)
- `flask>=3.0.0` - Web framework
- `flask-cors>=4.0.0` - CORS support
- `werkzeug>=3.0.0` - WSGI utilities
- `pandas>=2.0.0` - Data processing
- `openpyxl>=3.1.0` - Excel file handling
- `python-dotenv>=1.0.0` - Environment variables
- `bcrypt>=4.0.0` - Password hashing (CRITICAL - was missing!)
- `requests>=2.30.0` - HTTP requests
- `urllib3>=2.0.0` - HTTP library
- `aiohttp>=3.9.0` - Async HTTP support

### Frontend (Node.js)
All dependencies are in `package.json` - just run `npm install`

## Common Issues

### "ModuleNotFoundError: No module named 'bcrypt'"
**Solution**:
```bash
pip install bcrypt>=4.0.0
```

### "Port 5000 already in use"
**Solution**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### "Port 8080 already in use"
**Solution**: The app will automatically use port 8081

### Database file not found
The database will be created automatically on first run at:
`backend/gcg_database.db`

## Verify Installation

Run this to check if everything is installed:
```bash
python -c "import flask, flask_cors, pandas, openpyxl, dotenv, requests, werkzeug, bcrypt, aiohttp; print('✅ All packages installed!')"
```

## Demo Credentials

After installation, login with:
- **Super Admin**:
  - Username: `admin1` (NOT an email!)
  - Password: `admin123`

- **Admin**:
  - Email: `admin@posindonesia.co.id`
  - Password: `admin123`

- **User**:
  - Email: `user@posindonesia.co.id`
  - Password: `user123`
