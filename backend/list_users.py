#!/usr/bin/env python3
"""List all users in database"""

from database import get_db_connection
from windows_utils import safe_print, set_console_encoding

set_console_encoding()

with get_db_connection() as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, role, name, is_active FROM users ORDER BY id')
    users = cursor.fetchall()

    safe_print("=" * 80)
    safe_print("All Users in Database")
    safe_print("=" * 80)
    safe_print("")

    if users:
        for user in users:
            user_id, email, role, name, is_active = user
            status = "✅ Active" if is_active else "❌ Inactive"
            safe_print(f"ID: {user_id:3d} | Email: {email:30s} | Role: {role:10s} | Name: {name or 'N/A':20s} | {status}")
        safe_print("")
        safe_print(f"Total users: {len(users)}")
    else:
        safe_print("No users found in database")

    safe_print("")
    safe_print("=" * 80)
