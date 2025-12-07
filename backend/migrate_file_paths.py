#!/usr/bin/env python3
"""
Migration script to populate file_path column for existing uploaded files
"""
import sqlite3
from pathlib import Path
import sys

def migrate_file_paths():
    # Connect to database
    db_path = Path(__file__).parent / 'gcg_database.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all uploaded files without file_path
    cursor.execute("""
        SELECT id, file_name, year, checklist_id
        FROM uploaded_files
        WHERE file_path IS NULL OR file_path = ''
    """)

    records = cursor.fetchall()
    print(f"Found {len(records)} records without file_path")

    # Base directory for uploaded files
    base_dir = Path(__file__).parent.parent / 'data' / 'gcg-documents'

    updated_count = 0
    not_found_count = 0

    for record_id, file_name, year, checklist_id in records:
        print(f"\nProcessing: {file_name} (checklist_id={checklist_id}, year={year})")

        # Search for this file in the filesystem
        year_dir = base_dir / str(year)

        if not year_dir.exists():
            print(f"  ❌ Year directory not found: {year_dir}")
            not_found_count += 1
            continue

        # Search all PIC directories for this checklist_id
        found = False
        for pic_dir in year_dir.iterdir():
            if not pic_dir.is_dir():
                continue

            checklist_dir = pic_dir / str(checklist_id)
            if checklist_dir.exists() and checklist_dir.is_dir():
                # Check if file exists in this directory
                for file_path in checklist_dir.iterdir():
                    if file_path.is_file() and file_path.name == file_name:
                        # Found the file! Build relative path
                        relative_path = f"gcg-documents/{year}/{pic_dir.name}/{checklist_id}/{file_name}"
                        print(f"  ✅ Found: {relative_path}")

                        # Update database
                        cursor.execute("""
                            UPDATE uploaded_files
                            SET file_path = ?
                            WHERE id = ?
                        """, (relative_path, record_id))

                        updated_count += 1
                        found = True
                        break

            if found:
                break

        if not found:
            print(f"  ⚠️ File not found on filesystem")
            not_found_count += 1

    # Commit changes
    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"Migration complete!")
    print(f"Updated: {updated_count} records")
    print(f"Not found: {not_found_count} records")
    print(f"{'='*60}")

if __name__ == '__main__':
    migrate_file_paths()
