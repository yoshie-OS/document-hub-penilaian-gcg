"""
Reset Password Script for GCG Document Hub
Allows superadmin to reset password with bcrypt hashing
"""

import sqlite3
import bcrypt
import sys
from datetime import datetime

def list_superadmins():
    """List all superadmin users"""
    conn = sqlite3.connect('gcg_database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, name FROM users WHERE role = "superadmin"')
    users = cursor.fetchall()
    conn.close()
    return users

def reset_password(email, new_password):
    """Reset password for a user"""
    try:
        # Hash the password with bcrypt
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        password_hash_str = password_hash.decode('utf-8')

        # Update database
        conn = sqlite3.connect('gcg_database.db')
        cursor = conn.cursor()

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
        print(f"Error: {e}")
        return False

def main():
    print("=" * 60)
    print("GCG Document Hub - Reset Password Tool")
    print("=" * 60)
    print()

    # List superadmins
    users = list_superadmins()

    if not users:
        print("❌ No superadmin users found!")
        return

    print("Available Superadmin Accounts:")
    print("-" * 60)
    for idx, user in enumerate(users, 1):
        print(f"{idx}. Email: {user[1]:<30} Name: {user[2]}")
    print("-" * 60)
    print()

    # Get user choice
    try:
        choice = int(input(f"Select account number (1-{len(users)}): "))
        if choice < 1 or choice > len(users):
            print("❌ Invalid choice!")
            return

        selected_user = users[choice - 1]
        email = selected_user[1]
        name = selected_user[2]

        print()
        print(f"Selected: {name} ({email})")
        print()

        # Get new password
        new_password = input("Enter new password: ").strip()

        if len(new_password) < 6:
            print("❌ Password must be at least 6 characters!")
            return

        # Confirm password
        confirm_password = input("Confirm new password: ").strip()

        if new_password != confirm_password:
            print("❌ Passwords do not match!")
            return

        # Reset password
        print()
        print("Resetting password...")

        if reset_password(email, new_password):
            print()
            print("=" * 60)
            print("✅ PASSWORD RESET SUCCESSFUL!")
            print("=" * 60)
            print(f"Email: {email}")
            print(f"New Password: {new_password}")
            print()
            print("You can now login with the new password.")
            print("=" * 60)
        else:
            print("❌ Failed to reset password!")

    except ValueError:
        print("❌ Invalid input!")
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
