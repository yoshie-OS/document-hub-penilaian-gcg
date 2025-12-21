"""
Quick Reset Password Script - Reset superadmin to default password
"""

import sqlite3
import bcrypt
from datetime import datetime

def reset_to_default(email='arsippostgcg@gmail.com', password='admin123'):
    """Reset superadmin password to default"""
    try:
        # Hash the password with bcrypt
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        password_hash_str = password_hash.decode('utf-8')

        # Update database
        conn = sqlite3.connect('gcg_database.db')
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute('SELECT id, email, name, role FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()

        if not user:
            print(f"❌ User with email '{email}' not found!")
            conn.close()
            return False

        print(f"Found user: {user[2]} ({user[1]}) - Role: {user[3]}")
        print()

        # Update password
        cursor.execute(
            'UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?',
            (password_hash_str, datetime.now().isoformat(), email)
        )

        conn.commit()
        rows_affected = cursor.rowcount
        conn.close()

        return rows_affected > 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("GCG Document Hub - Quick Password Reset")
    print("=" * 70)
    print()
    print("This will reset the main superadmin password to default.")
    print()

    email = 'arsippostgcg@gmail.com'
    password = 'admin123'

    print(f"Email: {email}")
    print(f"New Password: {password}")
    print()
    print("Resetting password...")
    print()

    if reset_to_default(email, password):
        print("=" * 70)
        print("PASSWORD RESET SUCCESSFUL!")
        print("=" * 70)
        print()
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print()
        print("You can now login with these credentials.")
        print("=" * 70)
    else:
        print("Failed to reset password!")
