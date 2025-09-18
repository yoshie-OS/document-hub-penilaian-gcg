#!/usr/bin/env python3
"""
Simple startup script for PenilaianGCG API
"""

import uvicorn
import sys
import os
from windows_utils import safe_print, set_console_encoding

# Set console encoding for Windows compatibility
set_console_encoding()

def main():
    safe_print("🚀 Starting PenilaianGCG API Backend...")
    safe_print("📡 API will be available at: http://localhost:8000")
    safe_print("📖 Documentation at: http://localhost:8000/docs")
    safe_print("🔄 Processing endpoint: http://localhost:8000/api/process-gcg")
    safe_print("=" * 50)

    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Auto-reload on code changes
            log_level="info"
        )
    except KeyboardInterrupt:
        safe_print("\n🛑 API server stopped by user")
    except Exception as e:
        safe_print(f"❌ Error starting API server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()