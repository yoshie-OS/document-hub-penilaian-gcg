#!/usr/bin/env python3
"""
Setup/Reset Super Admin accounts (admin1 and admin2)
Creates accounts if they don't exist, or resets passwords if they do
"""

import sys
import bcrypt
from database import get_db_connection
from windows_utils import safe_print, set_console_encoding

# Set console encoding for Windows compatibility
set_console_encoding()

def setup_superadmin_accounts():
    """Setup admin1 and admin2 with password admin123"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Default password
            password = 'admin123'
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Super admin accounts configuration
            superadmin_accounts = [
                {
                    'email': 'admin1',
                    'name': 'Super Admin 1',
                    'role': 'superadmin'
                },
                {
                    'email': 'admin2',
                    'name': 'Super Admin 2',
                    'role': 'superadmin'
                }
            ]

            created_count = 0
            reset_count = 0

            for account in superadmin_accounts:
                email = account['email']

                # Check if account exists
                cursor.execute("SELECT id, email, name, role FROM users WHERE email = ?", (email,))
                existing_user = cursor.fetchone()

                if existing_user:
                    # Account exists - reset password
                    user_id = existing_user[0]
                    cursor.execute("""
                        UPDATE users
                        SET password_hash = ?, role = ?
                        WHERE id = ?
                    """, (password_hash, 'superadmin', user_id))

                    safe_print(f"🔄 Password reset for: {email} (ID: {user_id})")
                    reset_count += 1
                else:
                    # Account doesn't exist - create new
                    cursor.execute("""
                        INSERT INTO users (email, password_hash, role, name, direktorat, subdirektorat, divisi, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        email,
                        password_hash,
                        account['role'],
                        account['name'],
                        'System',
                        'System',
                        'System',
                        True
                    ))

                    user_id = cursor.lastrowid
                    safe_print(f"✅ Created new account: {email} (ID: {user_id})")
                    created_count += 1

            safe_print("")
            safe_print("=" * 60)
            if created_count > 0:
                safe_print(f"✅ Created {created_count} new super admin account(s)")
            if reset_count > 0:
                safe_print(f"🔄 Reset {reset_count} existing super admin password(s)")

            safe_print("")
            safe_print("Super Admin Accounts:")
            safe_print("  Username: admin1  |  Password: admin123")
            safe_print("  Username: admin2  |  Password: admin123")
            safe_print("")
            safe_print("⚠️  Please change passwords after login for security!")
            safe_print("=" * 60)

            return True

    except Exception as e:
        safe_print(f"❌ Error setting up super admin accounts: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    safe_print("=" * 60)
    safe_print("Setup Super Admin Accounts (admin1 & admin2)")
    safe_print("=" * 60)
    safe_print("")

    success = setup_superadmin_accounts()

    sys.exit(0 if success else 1)
