"""
Start Flask backend on port 5001 (avoiding Windows port 5000 conflict)
"""

import os
import sys

# Force port 5001
os.environ['FLASK_PORT'] = '5001'

print("=" * 70)
print("Starting GCG Document Hub Backend on PORT 5001")
print("=" * 70)
print()
print("Flask will start on: http://localhost:5001")
print()
print("NOTE: Keep this window open! Backend must stay running.")
print("=" * 70)
print()

# Import and run the main app
if __name__ == '__main__':
    import app
    port = 5001
    app.app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)
