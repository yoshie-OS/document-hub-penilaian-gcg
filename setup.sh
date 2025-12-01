#!/bin/bash
echo "🚀 Setting up POS Data Cleaner Development Environment"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install Node dependencies  
echo "📦 Installing Node dependencies..."
npm install

echo "✅ Setup complete!"
echo "🚀 Run 'npm run dev' to start the application"
echo "🌐 Frontend: http://localhost:8080"
echo "📊 PenilaianGCG: http://localhost:8080/penilaian-gcg"