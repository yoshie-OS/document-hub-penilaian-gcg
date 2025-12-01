"""
Migration Script: localStorage → SQLite
Migrates existing localStorage data from frontend to SQLite database

Usage:
1. Export localStorage data from browser console:
   localStorage
2. Save to JSON file
3. Run this script: python migrate_localstorage.py path/to/localstorage.json
"""

import json
import sys
from datetime import datetime
from database import get_db_connection
import bcrypt


def migrate_users(data, conn):
    """Migrate users from localStorage"""
    users_data = data.get('users', data.get('currentUser', '[]'))
    if isinstance(users_data, str):
        users = json.loads(users_data)
    else:
        users = users_data

    if not isinstance(users, list):
        users = [users]

    cursor = conn.cursor()
    migrated = 0

    for user in users:
        # Hash password if it's plaintext
        password = user.get('password', 'default123')
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("""
            INSERT OR REPLACE INTO users
            (id, email, password_hash, role, name, direktorat, subdirektorat, divisi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user.get('id'),
            user['email'],
            password_hash,
            user['role'],
            user['name'],
            user.get('direktorat'),
            user.get('subdirektorat'),
            user.get('divisi')
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} users")
    return migrated


def migrate_checklist_gcg(data, conn):
    """Migrate checklist GCG from localStorage"""
    checklist_data = data.get('checklistGCG', '[]')
    if isinstance(checklist_data, str):
        checklist = json.loads(checklist_data)
    else:
        checklist = checklist_data

    cursor = conn.cursor()
    migrated = 0

    for item in checklist:
        cursor.execute("""
            INSERT OR REPLACE INTO checklist_gcg (id, aspek, deskripsi, tahun)
            VALUES (?, ?, ?, ?)
        """, (
            item['id'],
            item['aspek'],
            item['deskripsi'],
            item.get('tahun', datetime.now().year)
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} checklist items")
    return migrated


def migrate_document_metadata(data, conn):
    """Migrate document metadata from localStorage"""
    docs_data = data.get('documentMetadata', '[]')
    if isinstance(docs_data, str):
        docs = json.loads(docs_data)
    else:
        docs = docs_data

    cursor = conn.cursor()
    migrated = 0

    for doc in docs:
        cursor.execute("""
            INSERT OR REPLACE INTO document_metadata
            (id, title, document_number, document_date, description, gcg_principle,
             document_type, document_category, direksi, subdirektorat, division,
             file_name, file_size, file_url, status, confidentiality, year,
             uploaded_by, upload_date, checklist_id, checklist_description, aspect)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc['id'],
            doc['title'],
            doc.get('documentNumber'),
            doc.get('documentDate'),
            doc.get('description'),
            doc.get('gcgPrinciple'),
            doc.get('documentType'),
            doc.get('documentCategory'),
            doc.get('direksi'),
            doc.get('subdirektorat'),
            doc.get('division'),
            doc['fileName'],
            doc.get('fileSize'),
            doc.get('fileUrl'),
            doc.get('status', 'active'),
            doc.get('confidentiality'),
            doc['year'],
            doc.get('uploadedBy'),
            doc.get('uploadDate'),
            doc.get('checklistId'),
            doc.get('checklistDescription'),
            doc.get('aspect')
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} documents")
    return migrated


def migrate_uploaded_files(data, conn):
    """Migrate uploaded files tracking from localStorage"""
    files_data = data.get('uploadedFiles', '[]')
    if isinstance(files_data, str):
        files = json.loads(files_data)
    else:
        files = files_data

    cursor = conn.cursor()
    migrated = 0

    for file in files:
        cursor.execute("""
            INSERT OR REPLACE INTO uploaded_files
            (id, file_name, file_size, upload_date, year, checklist_id,
             checklist_description, aspect, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file['id'],
            file['fileName'],
            file.get('fileSize'),
            file.get('uploadDate', datetime.now().isoformat()),
            file['year'],
            file.get('checklistId'),
            file.get('checklistDescription'),
            file.get('aspect'),
            file.get('status', 'uploaded')
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} uploaded files")
    return migrated


def migrate_direktorat(data, conn):
    """Migrate direktorat from localStorage"""
    direktorat_data = data.get('direktorat', '[]')
    if isinstance(direktorat_data, str):
        direktorat = json.loads(direktorat_data)
    else:
        direktorat = direktorat_data

    cursor = conn.cursor()
    migrated = 0

    for item in direktorat:
        # Handle both context formats
        tahun = item.get('tahun', datetime.now().year)
        deskripsi = item.get('deskripsi', '')

        cursor.execute("""
            INSERT OR REPLACE INTO direktorat (id, nama, deskripsi, tahun, is_active)
            VALUES (?, ?, ?, ?, ?)
        """, (
            item['id'],
            item['nama'],
            deskripsi,
            tahun,
            item.get('isActive', item.get('is_active', 1))
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} direktorat")
    return migrated


def migrate_subdirektorat(data, conn):
    """Migrate subdirektorat from localStorage"""
    subdir_data = data.get('subdirektorat', '[]')
    if isinstance(subdir_data, str):
        subdirektorat = json.loads(subdir_data)
    else:
        subdirektorat = subdir_data

    cursor = conn.cursor()
    migrated = 0

    for item in subdirektorat:
        tahun = item.get('tahun', datetime.now().year)
        deskripsi = item.get('deskripsi', '')

        cursor.execute("""
            INSERT OR REPLACE INTO subdirektorat
            (id, nama, direktorat_id, deskripsi, tahun, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            item['id'],
            item['nama'],
            item.get('direktoratId'),
            deskripsi,
            tahun,
            item.get('isActive', item.get('is_active', 1))
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} subdirektorat")
    return migrated


def migrate_divisi(data, conn):
    """Migrate divisi from localStorage"""
    divisi_data = data.get('divisi', '[]')
    if isinstance(divisi_data, str):
        divisi = json.loads(divisi_data)
    else:
        divisi = divisi_data

    cursor = conn.cursor()
    migrated = 0

    for item in divisi:
        tahun = item.get('tahun', datetime.now().year)
        deskripsi = item.get('deskripsi', '')

        cursor.execute("""
            INSERT OR REPLACE INTO divisi
            (id, nama, subdirektorat_id, deskripsi, tahun, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            item['id'],
            item['nama'],
            item.get('subdirektoratId'),
            deskripsi,
            tahun,
            item.get('isActive', item.get('is_active', 1))
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} divisi")
    return migrated


def migrate_anak_perusahaan(data, conn):
    """Migrate anak perusahaan from localStorage"""
    anak_data = data.get('anakPerusahaan', '[]')
    if isinstance(anak_data, str):
        anak_perusahaan = json.loads(anak_data)
    else:
        anak_perusahaan = anak_data

    cursor = conn.cursor()
    migrated = 0

    for item in anak_perusahaan:
        tahun = item.get('tahun', datetime.now().year)

        cursor.execute("""
            INSERT OR REPLACE INTO anak_perusahaan
            (id, nama, kategori, deskripsi, tahun, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            item['id'],
            item['nama'],
            item['kategori'],
            item['deskripsi'],
            tahun,
            item.get('isActive', item.get('is_active', 1))
        ))
        migrated += 1

    print(f"  ✓ Migrated {migrated} anak perusahaan")
    return migrated


def migrate_years(data, conn):
    """Migrate available years from localStorage"""
    years_data = data.get('availableYears', '[]')
    if isinstance(years_data, str):
        years = json.loads(years_data)
    else:
        years = years_data

    cursor = conn.cursor()
    migrated = 0

    for year in years:
        cursor.execute("""
            INSERT OR IGNORE INTO years (year, is_active)
            VALUES (?, ?)
        """, (year, 1))
        migrated += 1

    print(f"  ✓ Migrated {migrated} years")
    return migrated


def migrate_all(json_file_path):
    """Main migration function"""
    print("=" * 60)
    print("localStorage → SQLite Migration")
    print("=" * 60)

    # Load localStorage data
    print(f"\n📂 Loading data from: {json_file_path}")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"✓ Loaded {len(data)} localStorage keys\n")

    # Migrate all data
    with get_db_connection() as conn:
        total_migrated = 0

        print("Migrating data...")
        total_migrated += migrate_years(data, conn)
        total_migrated += migrate_users(data, conn)
        total_migrated += migrate_checklist_gcg(data, conn)
        total_migrated += migrate_document_metadata(data, conn)
        total_migrated += migrate_uploaded_files(data, conn)
        total_migrated += migrate_direktorat(data, conn)
        total_migrated += migrate_subdirektorat(data, conn)
        total_migrated += migrate_divisi(data, conn)
        total_migrated += migrate_anak_perusahaan(data, conn)

    print("\n" + "=" * 60)
    print(f"✅ Migration completed! Total records migrated: {total_migrated}")
    print("=" * 60)


def export_localstorage_snippet():
    """Generate JavaScript snippet to export localStorage from browser"""
    snippet = """
// Copy and paste this into your browser console to export localStorage

const exportLocalStorage = () => {
    const data = {};
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localstorage_export_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();

    console.log('✅ localStorage exported!');
};

exportLocalStorage();
    """
    return snippet


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_localstorage.py <json_file_path>")
        print("\nTo export localStorage from browser:")
        print("-" * 60)
        print(export_localstorage_snippet())
        print("-" * 60)
        sys.exit(1)

    json_file = sys.argv[1]
    migrate_all(json_file)
