#!/usr/bin/env python3
"""
Migration script to import PerformaGCG data from output.xlsx into SQLite database
"""

import pandas as pd
import sqlite3
from datetime import datetime
import sys
import os

DB_PATH = 'gcg_database.db'
EXCEL_PATH = 'output.xlsx'

def create_performa_gcg_table(conn):
    """Create table for PerformaGCG data"""
    cursor = conn.cursor()

    # Drop existing table if needed (for fresh migration)
    # cursor.execute("DROP TABLE IF EXISTS performa_gcg")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS performa_gcg (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level INTEGER NOT NULL,
            type TEXT,
            section TEXT,
            no TEXT,
            deskripsi TEXT NOT NULL,
            jumlah_parameter INTEGER,
            bobot REAL,
            skor REAL,
            capaian REAL,
            penjelasan TEXT,
            tahun INTEGER NOT NULL,
            penilai TEXT,
            jenis_asesmen TEXT,
            export_date TEXT,
            jenis_penilaian TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for faster queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performa_gcg_tahun ON performa_gcg(tahun)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performa_gcg_level ON performa_gcg(level)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performa_gcg_section ON performa_gcg(section)")

    conn.commit()
    print("✓ Created performa_gcg table")

def import_data(conn):
    """Import data from output.xlsx"""

    if not os.path.exists(EXCEL_PATH):
        print(f"✗ Error: {EXCEL_PATH} not found!")
        return False

    print(f"Reading {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH, sheet_name='Sheet1')

    print(f"Found {len(df)} rows")
    print(f"Columns: {list(df.columns)}")

    # Clean column names (lowercase, replace spaces with underscores)
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # Handle NaN values
    df = df.fillna({
        'type': '',
        'section': '',
        'no': '',
        'penjelasan': '',
        'penilai': '',
        'jenis_asesmen': '',
        'jenis_penilaian': ''
    })

    # Convert numeric columns
    df['jumlah_parameter'] = pd.to_numeric(df['jumlah_parameter'], errors='coerce')
    df['bobot'] = pd.to_numeric(df['bobot'], errors='coerce')
    df['skor'] = pd.to_numeric(df['skor'], errors='coerce')
    df['capaian'] = pd.to_numeric(df['capaian'], errors='coerce')
    df['tahun'] = pd.to_numeric(df['tahun'], errors='coerce').fillna(0).astype(int)

    # Insert data
    cursor = conn.cursor()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM performa_gcg")
    existing_count = cursor.fetchone()[0]

    if existing_count > 0:
        print(f"\n⚠ Warning: Table already has {existing_count} rows")
        response = input("Do you want to:\n  1. Skip migration (keep existing data)\n  2. Append new data\n  3. Clear and reimport\nChoice (1/2/3): ")

        if response == '1':
            print("Skipping migration")
            return True
        elif response == '3':
            cursor.execute("DELETE FROM performa_gcg")
            conn.commit()
            print("✓ Cleared existing data")

    # Insert data row by row
    inserted = 0
    for idx, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO performa_gcg (
                    level, type, section, no, deskripsi, jumlah_parameter, bobot,
                    skor, capaian, penjelasan, tahun, penilai, jenis_asesmen,
                    export_date, jenis_penilaian
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                int(row['level']),
                str(row['type']),
                str(row['section']),
                str(row['no']),
                str(row['deskripsi']),
                int(row['jumlah_parameter']) if pd.notna(row['jumlah_parameter']) else None,
                float(row['bobot']) if pd.notna(row['bobot']) else None,
                float(row['skor']) if pd.notna(row['skor']) else None,
                float(row['capaian']) if pd.notna(row['capaian']) else None,
                str(row['penjelasan']),
                int(row['tahun']),
                str(row['penilai']),
                str(row['jenis_asesmen']),
                str(row['export_date']),
                str(row['jenis_penilaian'])
            ))
            inserted += 1

            if (idx + 1) % 10 == 0:
                print(f"  Progress: {idx + 1}/{len(df)} rows", end='\r')

        except Exception as e:
            print(f"\n✗ Error inserting row {idx}: {e}")
            print(f"  Row data: {row.to_dict()}")
            continue

    conn.commit()
    print(f"\n✓ Imported {inserted} rows successfully")

    return True

def verify_migration(conn):
    """Verify the migration was successful"""
    cursor = conn.cursor()

    print("\n" + "="*80)
    print("MIGRATION VERIFICATION")
    print("="*80)

    # Total count
    cursor.execute("SELECT COUNT(*) FROM performa_gcg")
    total = cursor.fetchone()[0]
    print(f"Total rows: {total}")

    # Count by year
    cursor.execute("SELECT tahun, COUNT(*) FROM performa_gcg GROUP BY tahun ORDER BY tahun")
    print("\nRows per year:")
    for year, count in cursor.fetchall():
        print(f"  {year}: {count} rows")

    # Count by level
    cursor.execute("SELECT level, COUNT(*) FROM performa_gcg GROUP BY level ORDER BY level")
    print("\nRows per level:")
    for level, count in cursor.fetchall():
        print(f"  Level {level}: {count} rows")

    # Sample data
    cursor.execute("SELECT * FROM performa_gcg LIMIT 3")
    columns = [desc[0] for desc in cursor.description]
    print("\nSample data (first 3 rows):")
    for row in cursor.fetchall():
        print(f"\n  {dict(zip(columns, row))}")

    print("\n" + "="*80)

def main():
    """Main migration function"""
    print("="*80)
    print("PERFORMA GCG DATA MIGRATION")
    print("="*80)
    print(f"Source: {EXCEL_PATH}")
    print(f"Target: {DB_PATH}")
    print()

    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        print("✓ Connected to database")

        # Create table
        create_performa_gcg_table(conn)

        # Import data
        success = import_data(conn)

        if success:
            # Verify migration
            verify_migration(conn)
            print("\n✓ Migration completed successfully!")
            return 0
        else:
            print("\n✗ Migration failed")
            return 1

    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        if 'conn' in locals():
            conn.close()
            print("\n✓ Database connection closed")

if __name__ == '__main__':
    sys.exit(main())
