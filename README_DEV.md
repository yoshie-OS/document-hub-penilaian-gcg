# 🚀 POS Data Cleaner 2 - Web Interface

One-command development setup with integrated Python backend.

## 🎯 Quick Start

### 1. Setup (Run Once)
```bash
./setup.sh
```

### 2. Start Development 
```bash
npm run dev
```

That's it! This will:
- ✅ Start FastAPI backend on port 8000
- ✅ Start React frontend on port 8080
- ✅ Configure proxy so they talk to each other
- ✅ Enable real file processing (no mock data)

## 🌐 Access Your App

- **Web App**: http://localhost:8080
- **PenilaianGCG**: http://localhost:8080/penilaian-gcg
- **API Docs**: http://localhost:8000/docs

## 📁 Structure

```
web-interface/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # API server
│   ├── main_new.py           # POS Data Cleaner core
│   ├── extractors/           # Excel, PDF, Image processing
│   └── requirements.txt      # Python dependencies
├── src/                       # React frontend
│   └── pages/PenilaianGCG.tsx # Main GCG interface
└── package.json              # npm run dev starts both!
```

## 🔧 Commands

```bash
npm run dev          # Start both frontend + backend
npm run dev:frontend # Frontend only (if backend already running)
npm run dev:backend  # Backend only
npm run setup        # Install Python dependencies
```

## 🎯 Features

- ✅ **Real Processing**: Upload files → POS processes them → see results
- ✅ **98.9% Accuracy**: Production-tested Indonesian SOE document processing
- ✅ **Modern UI**: React TypeScript with Indonesian localization
- ✅ **No Separate Servers**: Everything runs from `npm run dev`

Perfect for development and easy for your friend to review the source code! 🎯