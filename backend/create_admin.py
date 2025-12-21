#!/usr/bin/env python3
"""
Script to create default admin user
Username: admin
Password: admin123
"""

import sys
import bcrypt
from database import get_db_connection
from windows_utils import safe_print, set_console_encoding

# Set console encoding for Windows compatibility
set_console_encoding()

def create_admin_user():
    """Create default admin user if it doesn't exist"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if admin user already exists
            cursor.execute("SELECT id, email FROM users WHERE email = ?", ('admin',))
            existing_user = cursor.fetchone()

            if existing_user:
                safe_print(f"❌ Admin user already exists (ID: {existing_user[0]}, Email: {existing_user[1]})")
                safe_print("   If you want to reset the password, please delete the user first.")
                return False

            # Hash the password
            password = 'admin123'
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Insert admin user
            cursor.execute("""
                INSERT INTO users (email, password_hash, role, name, direktorat, subdirektorat, divisi, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'admin',
                password_hash,
                'admin',
                'Administrator',
                'System',
                'System',
                'System',
                True
            ))

            user_id = cursor.lastrowid

            safe_print("✅ Admin user created successfully!")
            safe_print(f"   ID: {user_id}")
            safe_print(f"   Username: admin")
            safe_print(f"   Password: admin123")
            safe_print(f"   Role: admin")
            safe_print("\n⚠️  Please change the password after first login for security!")

            return True

    except Exception as e:
        safe_print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    safe_print("=" * 60)
    safe_print("Creating Default Admin User")
    safe_print("=" * 60)
    safe_print("")

    success = create_admin_user()

    safe_print("")
    safe_print("=" * 60)

    sys.exit(0 if success else 1)
