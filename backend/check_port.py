"""
Check if port 5000 is available for Flask backend
"""

import socket
import subprocess
import sys

def check_port(port=5000):
    """Check if a port is available"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('127.0.0.1', port))
        sock.close()
        return True  # Port is available
    except OSError:
        return False  # Port is in use

def get_process_using_port(port=5000):
    """Get process information using the port (Windows)"""
    try:
        result = subprocess.run(
            f'netstat -ano | findstr :{port}',
            shell=True,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {e}"

def main():
    print("=" * 70)
    print("GCG Document Hub - Port Availability Check")
    print("=" * 70)
    print()

    port = 5000

    print(f"Checking if port {port} is available...")
    print()

    if check_port(port):
        print(f"[SUCCESS] Port {port} is AVAILABLE!")
        print()
        print("You can now start the Flask backend:")
        print("  > python app.py")
        print()
        print("=" * 70)
        sys.exit(0)
    else:
        print(f"[ERROR] Port {port} is ALREADY IN USE!")
        print()
        print("Port usage details:")
        print("-" * 70)
        process_info = get_process_using_port(port)
        print(process_info)
        print("-" * 70)
        print()

        if "System" in process_info or "PID   4" in process_info or "    4" in process_info:
            print("[DIAGNOSIS] Port is used by Windows System Service")
            print("            (likely AirPlay Receiver or Phone Link)")
            print()
            print("SOLUTION OPTIONS:")
            print()
            print("Option 1: Disable Windows AirPlay Receiver")
            print("  1. Open PowerShell as Administrator")
            print("  2. Run: Stop-Service -Name 'AirPlayXPCHelper' -Force")
            print("  3. Run: Set-Service -Name 'AirPlayXPCHelper' -StartupType Disabled")
            print("  4. Restart computer")
            print()
            print("Option 2: Change Flask Port")
            print("  1. Set environment variable:")
            print("     PowerShell: $env:FLASK_PORT = '5001'")
            print("     CMD:        set FLASK_PORT=5001")
            print("  2. Update frontend API URL in src/services/api.ts")
            print("  3. Start backend: python app.py")
            print()
        else:
            print("[DIAGNOSIS] Port is used by another application")
            print()
            print("SOLUTION:")
            print("  1. Stop the application using port 5000")
            print("  2. Or change Flask port (see TROUBLESHOOTING_LOGIN.md)")
            print()

        print("=" * 70)
        print()
        print("For detailed instructions, see: TROUBLESHOOTING_LOGIN.md")
        print()
        sys.exit(1)

if __name__ == "__main__":
    main()
