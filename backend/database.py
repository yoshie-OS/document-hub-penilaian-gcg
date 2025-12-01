"""
SQLite Database Management for GCG Document Hub
Replaces localStorage and Excel with proper database storage
Includes Excel export functionality for stakeholders
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
import bcrypt
from contextlib import contextmanager

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), 'gcg_database.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'database_schema.sql')


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key constraints
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_database():
    """Initialize database with schema"""
    print("Initializing database...")

    # Read schema file
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()

    # Execute schema
    with get_db_connection() as conn:
        conn.executescript(schema_sql)

    print(f"Database initialized at: {DB_PATH}")
    return True


def seed_database():
    """Seed database with initial data from seed files"""
    print("Seeding database with initial data...")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Seed Years (2014 to current)
        current_year = datetime.now().year
        for year in range(2014, current_year + 1):
            cursor.execute(
                "INSERT OR IGNORE INTO years (year, is_active) VALUES (?, ?)",
                (year, 1)
            )
        print(f"  ✓ Seeded {current_year - 2014 + 1} years")

        # 2. Seed Users (with hashed passwords)
        seed_users = [
            {
                "email": "arsippostgcg@gmail.com",
                "password": "postarsipGCG.",
                "role": "superadmin",
                "name": "Super Admin",
                "direktorat": "Direktorat Keuangan",
                "subdirektorat": "Sub Direktorat Financial Policy and Asset Management",
                "divisi": "Divisi Kebijakan Keuangan"
            },
            {
                "email": "admin@posindonesia.co.id",
                "password": "admin123",
                "role": "admin",
                "name": "Administrator",
                "direktorat": "Direktorat Operasional",
                "subdirektorat": "Sub Direktorat Courier and Logistic Operation",
                "divisi": "Divisi Operasional Logistik"
            },
            {
                "email": "user@posindonesia.co.id",
                "password": "user123",
                "role": "user",
                "name": "User",
                "direktorat": "Direktorat Pemasaran",
                "subdirektorat": "Sub Direktorat Retail Business",
                "divisi": "Divisi Ritel"
            }
        ]

        for user in seed_users:
            # Hash password
            password_hash = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                INSERT OR IGNORE INTO users (email, password_hash, role, name, direktorat, subdirektorat, divisi)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user['email'], password_hash, user['role'], user['name'],
                  user['direktorat'], user['subdirektorat'], user['divisi']))
        print(f"  ✓ Seeded {len(seed_users)} users")

        # 3. Seed GCG Checklist (268 items per year)
        seed_checklist = get_seed_checklist_gcg()
        for year in range(2014, current_year + 1):
            for item in seed_checklist:
                cursor.execute("""
                    INSERT INTO checklist_gcg (aspek, deskripsi, tahun)
                    VALUES (?, ?, ?)
                """, (item['aspek'], item['deskripsi'], year))
        total_checklist = len(seed_checklist) * (current_year - 2014 + 1)
        print(f"  ✓ Seeded {total_checklist} checklist items ({len(seed_checklist)} per year)")

        # 4. Seed Direktorat
        seed_direktorat = get_seed_direktorat()
        for year in range(2014, current_year + 1):
            for item in seed_direktorat:
                cursor.execute("""
                    INSERT INTO direktorat (nama, deskripsi, tahun)
                    VALUES (?, ?, ?)
                """, (item['nama'], item.get('deskripsi', ''), year))
        print(f"  ✓ Seeded {len(seed_direktorat)} direktorat per year")

        # 5. Seed Subdirektorat
        seed_subdirektorat = get_seed_subdirektorat()
        for year in range(2014, current_year + 1):
            for item in seed_subdirektorat:
                cursor.execute("""
                    INSERT INTO subdirektorat (nama, deskripsi, tahun)
                    VALUES (?, ?, ?)
                """, (item['nama'], item.get('deskripsi', ''), year))
        print(f"  ✓ Seeded {len(seed_subdirektorat)} subdirektorat per year")

        # 6. Seed Anak Perusahaan
        seed_anak_perusahaan = get_seed_anak_perusahaan()
        for year in range(2014, current_year + 1):
            for item in seed_anak_perusahaan:
                cursor.execute("""
                    INSERT INTO anak_perusahaan (nama, kategori, deskripsi, tahun)
                    VALUES (?, ?, ?, ?)
                """, (item['nama'], item['kategori'], item['deskripsi'], year))
        print(f"  ✓ Seeded {len(seed_anak_perusahaan)} anak perusahaan per year")

        # 7. Load GCG Mapping Config from CSV
        import csv
        gcg_mapping_path = os.path.join(os.path.dirname(__file__), 'GCG_MAPPING.csv')
        if os.path.exists(gcg_mapping_path):
            with open(gcg_mapping_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    cursor.execute("""
                        INSERT INTO gcg_aspects_config
                        (level, type, section, no, deskripsi, jumlah_parameter, bobot)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row.get('Level'),
                        row.get('Type'),
                        row.get('Section'),
                        row.get('No'),
                        row.get('Deskripsi'),
                        row.get('Jumlah_Parameter'),
                        row.get('Bobot')
                    ))
            print(f"  ✓ Loaded GCG config from GCG_MAPPING.csv")

    print("Database seeding completed!")


def get_seed_checklist_gcg():
    """Get checklist GCG seed data (268 items)"""
    # Load from the TypeScript seed file
    import os
    import re

    seed_file = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'seed', 'seedChecklistGCG.ts')

    if not os.path.exists(seed_file):
        # Fallback to minimal data
        return [
            {"aspek": "ASPEK I. Komitmen", "deskripsi": "Pedoman Tata Kelola Perusahaan yang Baik/CoCG"},
            {"aspek": "ASPEK I. Komitmen", "deskripsi": "Pedoman Perilaku/CoC"},
            {"aspek": "ASPEK VI. Lainnya", "deskripsi": "Penghargaan-penghargaan lainnya"},
        ]

    # Parse the TypeScript file
    checklist = []
    with open(seed_file, 'r', encoding='utf-8') as f:
        content = f.read()

        # Extract all objects with id, aspek, deskripsi
        pattern = r'\{\s*id:\s*(\d+),\s*aspek:\s*"([^"]+)",\s*deskripsi:\s*"([^"]+)"\s*\}'
        matches = re.findall(pattern, content)

        for match in matches:
            checklist.append({
                "aspek": match[1],
                "deskripsi": match[2]
            })

    return checklist if checklist else [
        {"aspek": "ASPEK I. Komitmen", "deskripsi": "Pedoman Tata Kelola Perusahaan yang Baik/CoCG"}
    ]


def get_seed_direktorat():
    """Get direktorat seed data"""
    return [
        {"nama": "Direktorat Keuangan", "deskripsi": "Mengelola keuangan perusahaan"},
        {"nama": "Direktorat Operasional", "deskripsi": "Mengelola operasional perusahaan"},
        {"nama": "Direktorat SDM", "deskripsi": "Mengelola sumber daya manusia"},
        {"nama": "Direktorat Teknologi", "deskripsi": "Mengelola teknologi informasi"},
        {"nama": "Direktorat Pemasaran", "deskripsi": "Mengelola pemasaran dan penjualan"},
        {"nama": "Direktorat Hukum", "deskripsi": "Mengelola aspek hukum"},
        {"nama": "Direktorat Audit", "deskripsi": "Melakukan audit internal"},
        {"nama": "Direktorat Risk Management", "deskripsi": "Mengelola risiko perusahaan"},
    ]


def get_seed_subdirektorat():
    """Get subdirektorat seed data"""
    return [
        {"nama": "Sub Direktorat Government and Corporate Business", "deskripsi": ""},
        {"nama": "Sub Direktorat Consumer Business", "deskripsi": ""},
        {"nama": "Sub Direktorat Enterprise Business", "deskripsi": ""},
        {"nama": "Sub Direktorat Retail Business", "deskripsi": ""},
        {"nama": "Sub Direktorat Wholesale and International Business", "deskripsi": ""},
        {"nama": "Sub Direktorat Courier and Logistic Operation", "deskripsi": ""},
        {"nama": "Sub Direktorat International Post Services", "deskripsi": ""},
        {"nama": "Sub Direktorat Digital Services", "deskripsi": ""},
        {"nama": "Sub Direktorat Financial Policy and Asset Management", "deskripsi": ""},
        {"nama": "Sub Direktorat Risk Management", "deskripsi": ""},
    ]


def get_seed_anak_perusahaan():
    """Get anak perusahaan seed data"""
    return [
        {"nama": "PT Pos Logistik Indonesia", "kategori": "Anak Perusahaan", "deskripsi": "Perusahaan logistik dan supply chain"},
        {"nama": "PT Pos Finansial Indonesia", "kategori": "Anak Perusahaan", "deskripsi": "Layanan keuangan dan perbankan"},
        {"nama": "PT Pos Properti Indonesia", "kategori": "Anak Perusahaan", "deskripsi": "Pengelolaan properti dan aset"},
        {"nama": "PT Pos Digital Indonesia", "kategori": "Anak Perusahaan", "deskripsi": "Layanan digital dan teknologi"},
        {"nama": "Dapen Pos Indonesia", "kategori": "Badan Afiliasi", "deskripsi": "Dana pensiun pegawai Pos Indonesia"},
        {"nama": "PT Pos Indonesia - Bank Mandiri", "kategori": "Joint Venture", "deskripsi": "Kerjasama layanan keuangan"},
        {"nama": "Pos Indonesia Express", "kategori": "Unit Bisnis", "deskripsi": "Layanan ekspres dan kurir"},
    ]


def reset_database():
    """Reset database (delete and recreate)"""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Deleted existing database: {DB_PATH}")

    init_database()
    seed_database()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'reset':
        print("⚠️  RESETTING DATABASE - All data will be lost!")
        confirm = input("Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            reset_database()
        else:
            print("Reset cancelled")
    else:
        # Normal initialization
        if not os.path.exists(DB_PATH):
            init_database()
            seed_database()
        else:
            print(f"Database already exists at: {DB_PATH}")
            print("Run 'python database.py reset' to reset the database")
