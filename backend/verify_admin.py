#!/usr/bin/env python3
"""Verify admin user exists in database"""

from database import get_db_connection
from windows_utils import safe_print, set_console_encoding

set_console_encoding()

with get_db_connection() as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, role, name, direktorat FROM users WHERE email = ?', ('admin',))
    user = cursor.fetchone()

    if user:
        safe_print(f"✅ Admin user found in database:")
        safe_print(f"   ID: {user[0]}")
        safe_print(f"   Email: {user[1]}")
        safe_print(f"   Role: {user[2]}")
        safe_print(f"   Name: {user[3]}")
        safe_print(f"   Direktorat: {user[4]}")
    else:
        safe_print("❌ Admin user not found in database")
