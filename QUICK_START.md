# 🚀 **Quick Start - Performa GCG**

## **⚡ SUPER SIMPLE - 2 Steps!**

### **Step 1: Install Python Dependencies** (One-time only)

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### **Step 2: Run Everything!**

```bash
npm run dev
```

**That's it!** 🎉

- ✅ Python backend auto-starts on `http://localhost:5000`
- ✅ Frontend auto-starts on `http://localhost:8080`
- ✅ Both run together in the same terminal!

---

## **📖 What You'll See**

```
[0]
[0]  * Running on http://127.0.0.1:5000
[0]  * Debug mode: on
[1]
[1]   VITE v5.x.x  ready in xxx ms
[1]   ➜  Local:   http://localhost:8080/
```

**[0]** = Python Backend
**[1]** = Vite Frontend

---

## **🎯 Using Performa GCG**

1. Open: **http://localhost:8080**
2. Login (any user)
3. Click **"Performa GCG"** in sidebar
4. Choose:
   - **Manual Entry** - Fill table manually
   - **Automated Upload** - Upload Excel file (BPKP format)
5. View charts & export PDF!

---

## **🛠️ Separate Commands** (Optional)

If you want to run servers separately:

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

---

## **📝 Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 **Start both servers** (recommended) |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build for production |

---

## **🐛 Troubleshooting**

### **Python not found?**
```bash
# Install Python 3.8+
python --version  # or python3 --version
```

### **Port 5000 already in use?**
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### **Dependencies missing?**
```bash
# Reinstall
cd backend && pip install -r requirements.txt
npm install
```

---

**Done! Now go build something awesome! 🎨**
