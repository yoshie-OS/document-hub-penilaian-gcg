#!/usr/bin/env python3
"""
Migrate localStorage data to SQLite database
This script helps migrate existing localStorage data into the SQLite database
"""

import sqlite3
import json
import sys
from pathlib import Path
from database import get_db_connection

def migrate_localstorage_dump(json_file_path):
    """
    Migrate data from a localStorage JSON dump to SQLite

    To get localStorage dump from browser:
    1. Open browser console (F12)
    2. Run: copy(JSON.stringify(localStorage))
    3. Paste into a file (e.g., localstorage_dump.json)
    4. Run: python migrate_to_db.py localstorage_dump.json
    """

    print(f"📂 Reading localStorage dump from: {json_file_path}")

    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"✅ Found {len(data)} localStorage keys")

    stats = {
        'checklist': 0,
        'assignments': 0,
        'documents': 0,
        'assessments': 0,
        'direktorat': 0,
        'subdirektorat': 0,
        'anak_perusahaan': 0,
        'users': 0
    }

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Migrate checklist items
        if 'checklistGCG' in data:
            print("\n📋 Migrating checklist items...")
            checklist_data = json.loads(data['checklistGCG'])
            for item in checklist_data:
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO checklist_gcg (id, aspek, deskripsi, tahun)
                        VALUES (?, ?, ?, ?)
                    """, (item['id'], item['aspek'], item['deskripsi'], item.get('tahun', 2024)))
                    stats['checklist'] += 1
                except Exception as e:
                    print(f"  ⚠️  Error migrating checklist item {item.get('id')}: {e}")
            print(f"  ✅ Migrated {stats['checklist']} checklist items")

        # Migrate assignments (year-based keys)
        for key in data.keys():
            if key.startswith('checklistAssignments_'):
                year = int(key.split('_')[1])
                print(f"\n👥 Migrating assignments for year {year}...")
                assignments_data = json.loads(data[key])
                for assignment in assignments_data:
                    try:
                        cursor.execute("""
                            INSERT OR REPLACE INTO checklist_assignments
                            (checklist_id, subdirektorat, aspek, tahun)
                            VALUES (?, ?, ?, ?)
                        """, (
                            assignment['checklistId'],
                            assignment['subdirektorat'],
                            assignment.get('aspek', ''),
                            year
                        ))
                        stats['assignments'] += 1
                    except Exception as e:
                        print(f"  ⚠️  Error migrating assignment: {e}")
                print(f"  ✅ Migrated {len(assignments_data)} assignments for {year}")

        # Migrate document uploads (year-based keys)
        for key in data.keys():
            if key.startswith('documentUploads_'):
                year = int(key.split('_')[1])
                print(f"\n📄 Migrating documents for year {year}...")
                docs_data = json.loads(data[key])
                for doc in docs_data:
                    try:
                        cursor.execute("""
                            INSERT OR REPLACE INTO document_metadata
                            (id, title, file_name, year, checklist_id, aspect, uploaded_by, upload_date)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            doc.get('id', str(hash(doc.get('file_name', '')))),
                            doc.get('title', doc.get('file_name', 'Untitled')),
                            doc.get('file_name', ''),
                            year,
                            doc.get('checklist_id'),
                            doc.get('aspect', ''),
                            doc.get('uploaded_by', ''),
                            doc.get('upload_date', '')
                        ))
                        stats['documents'] += 1
                    except Exception as e:
                        print(f"  ⚠️  Error migrating document: {e}")
                print(f"  ✅ Migrated {len(docs_data)} documents for {year}")

        # Migrate GCG assessments (year-based keys)
        for key in data.keys():
            if key.startswith('gcgAssessments_'):
                year = int(key.split('_')[1])
                print(f"\n📊 Migrating GCG assessments for year {year}...")
                assessments_data = json.loads(data[key])
                for assessment in assessments_data:
                    try:
                        # First, find or create config_id based on assessment data
                        cursor.execute("""
                            SELECT id FROM gcg_aspects_config
                            WHERE deskripsi = ? LIMIT 1
                        """, (assessment.get('deskripsi', ''),))
                        result = cursor.fetchone()

                        if result:
                            config_id = result[0]
                            cursor.execute("""
                                INSERT OR REPLACE INTO gcg_assessments
                                (year, config_id, nilai, skor, keterangan, evidence)
                                VALUES (?, ?, ?, ?, ?, ?)
                            """, (
                                year,
                                config_id,
                                assessment.get('nilai'),
                                assessment.get('skor'),
                                assessment.get('keterangan', ''),
                                assessment.get('evidence', '')
                            ))
                            stats['assessments'] += 1
                    except Exception as e:
                        print(f"  ⚠️  Error migrating assessment: {e}")
                print(f"  ✅ Migrated assessments for {year}")

        # Migrate users (if exists)
        if 'users' in data:
            print(f"\n👤 Migrating users...")
            users_data = json.loads(data['users'])
            for user in users_data:
                try:
                    # Check if user already exists
                    cursor.execute("SELECT id FROM users WHERE email = ?", (user['email'],))
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO users
                            (email, password_hash, role, name, direktorat, subdirektorat, divisi)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            user['email'],
                            user.get('password', 'MIGRATED_NO_HASH'),  # Passwords need rehashing!
                            user.get('role', 'user'),
                            user.get('name', ''),
                            user.get('direktorat', ''),
                            user.get('subdirektorat', ''),
                            user.get('divisi', '')
                        ))
                        stats['users'] += 1
                except Exception as e:
                    print(f"  ⚠️  Error migrating user: {e}")
            print(f"  ✅ Migrated {stats['users']} users")

    print("\n" + "="*60)
    print("📊 MIGRATION SUMMARY")
    print("="*60)
    for key, count in stats.items():
        if count > 0:
            print(f"  {key.ljust(20)}: {count}")
    print("="*60)
    print("\n✅ Migration complete!")
    print("\n⚠️  IMPORTANT: User passwords need to be rehashed with bcrypt!")
    print("   Run: python backend/rehash_passwords.py")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("""
Usage: python migrate_to_db.py <localStorage_dump.json>

To get localStorage dump:
1. Open your app in browser
2. Open console (F12)
3. Run: copy(JSON.stringify(localStorage))
4. Paste into a file named localstorage_dump.json
5. Run: python backend/migrate_to_db.py localstorage_dump.json
        """)
        sys.exit(1)

    json_file = sys.argv[1]
    if not Path(json_file).exists():
        print(f"❌ Error: File not found: {json_file}")
        sys.exit(1)

    migrate_localstorage_dump(json_file)
