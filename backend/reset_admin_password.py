#!/usr/bin/env python3
"""
Script to reset super admin passwords back to default
Resets both admin1 and admin2 to password: admin123
"""

import sys
import bcrypt
from database import get_db_connection
from windows_utils import safe_print, set_console_encoding

# Set console encoding for Windows compatibility
set_console_encoding()

def reset_admin_passwords():
    """Reset admin1 and admin2 passwords to admin123"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # New default password
            password = 'admin123'
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Reset password for all superadmin and admin accounts
            cursor.execute("SELECT id, email, name, role FROM users WHERE role IN ('superadmin', 'admin')")
            admin_users = cursor.fetchall()

            if not admin_users:
                safe_print("⚠️  No admin accounts found in database")
                return False

            reset_count = 0
            for user in admin_users:
                user_id, email, name, role = user

                # Update password
                cursor.execute("""
                    UPDATE users
                    SET password_hash = ?
                    WHERE id = ?
                """, (password_hash, user_id))

                safe_print(f"✅ Password reset for: {email} (ID: {user_id}, Role: {role}, Name: {name or 'N/A'})")
                reset_count += 1

            if reset_count > 0:
                safe_print(f"\n✅ Successfully reset {reset_count} admin password(s)")
                safe_print(f"   New password for all: admin123")
                safe_print("\n⚠️  Please change passwords after login for security!")
                return True
            else:
                safe_print("\n❌ No admin accounts found to reset")
                return False

    except Exception as e:
        safe_print(f"❌ Error resetting admin passwords: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    safe_print("=" * 60)
    safe_print("Reset Super Admin Passwords")
    safe_print("=" * 60)
    safe_print("")

    success = reset_admin_passwords()

    safe_print("")
    safe_print("=" * 60)

    sys.exit(0 if success else 1)
