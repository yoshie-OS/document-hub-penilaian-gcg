"""
Config API Routes - backend-style URL Compatibility
Provides /api/config/* endpoints for compatibility with frontend
"""

from flask import Blueprint, request, jsonify
from database import get_db_connection
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

# Create blueprint for config routes
config_bp = Blueprint('config', __name__, url_prefix='/api')


# ============================================
# ASPECTS CONFIGURATION
# ============================================

@config_bp.route('/aspects', methods=['GET', 'POST', 'PUT', 'DELETE'])
def config_aspects():
    """Alias for aspects configuration - redirects to aspek_master table"""
    if request.method == 'GET':
        year = request.args.get('year', type=int)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if year:
                cursor.execute("""
                    SELECT id, nama, deskripsi, tahun, urutan, is_active, created_at
                    FROM aspek_master
                    WHERE tahun = ? AND is_active = 1
                    ORDER BY urutan, nama
                """, (year,))
            else:
                cursor.execute("""
                    SELECT id, nama, deskripsi, tahun, urutan, is_active, created_at
                    FROM aspek_master
                    WHERE is_active = 1
                    ORDER BY tahun, urutan, nama
                """)
            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json
        required_fields = ['nama', 'tahun']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO aspek_master (nama, deskripsi, tahun, urutan)
                VALUES (?, ?, ?, ?)
            """, (data['nama'], data.get('deskripsi', ''), data['tahun'], data.get('urutan', 0)))
            new_id = cursor.lastrowid
        return jsonify({'id': new_id, 'message': 'Aspect created'}), 201

    elif request.method == 'PUT':
        aspect_id = request.args.get('id', type=int)
        if not aspect_id:
            return jsonify({'error': 'Missing aspect id'}), 400

        data = request.json
        with get_db_connection() as conn:
            cursor = conn.cursor()
            update_fields = []
            params = []
            for field in ['nama', 'deskripsi', 'urutan']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            params.append(aspect_id)
            query = f"UPDATE aspek_master SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
        return jsonify({'message': 'Aspect updated'})

    elif request.method == 'DELETE':
        aspect_id = request.args.get('id', type=int)
        if not aspect_id:
            return jsonify({'error': 'Missing aspect id'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE aspek_master SET is_active = 0 WHERE id = ?", (aspect_id,))
        return jsonify({'message': 'Aspect deleted'})


# ============================================
# CHECKLIST CONFIGURATION
# ============================================

@config_bp.route('/config/checklist', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def config_checklist():
    """Alias for checklist configuration"""
    if request.method == 'GET':
        year = request.args.get('year', type=int)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if year:
                cursor.execute("""
                    SELECT id, aspek, deskripsi, tahun, created_at, is_active
                    FROM checklist_gcg
                    WHERE tahun = ? AND is_active = 1
                    ORDER BY id
                """, (year,))
            else:
                cursor.execute("""
                    SELECT id, aspek, deskripsi, tahun, created_at, is_active
                    FROM checklist_gcg
                    WHERE is_active = 1
                    ORDER BY tahun, id
                """)
            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json
        required_fields = ['aspek', 'deskripsi', 'tahun']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO checklist_gcg (aspek, deskripsi, tahun)
                VALUES (?, ?, ?)
            """, (data['aspek'], data['deskripsi'], data['tahun']))
            new_id = cursor.lastrowid
        return jsonify({'id': new_id, 'message': 'Checklist item created'}), 201

    elif request.method in ['PUT', 'PATCH']:
        checklist_id = request.args.get('id', type=int)
        if not checklist_id:
            return jsonify({'error': 'Missing checklist id'}), 400

        data = request.json
        with get_db_connection() as conn:
            cursor = conn.cursor()
            update_fields = []
            params = []
            for field in ['aspek', 'deskripsi', 'tahun']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            params.append(checklist_id)
            query = f"UPDATE checklist_gcg SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
        return jsonify({'message': 'Checklist item updated'})

    elif request.method == 'DELETE':
        checklist_id = request.args.get('id', type=int)
        if not checklist_id:
            return jsonify({'error': 'Missing checklist id'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE checklist_gcg SET is_active = 0 WHERE id = ?", (checklist_id,))
        return jsonify({'message': 'Checklist item deleted'})


# ============================================
# YEAR/FISCAL CONFIGURATION
# ============================================

@config_bp.route('/config/tahun-buku', methods=['GET', 'POST', 'DELETE'])
def config_tahun_buku():
    """Alias for year/fiscal configuration"""
    if request.method == 'GET':
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT year, is_active, created_at
                FROM years
                WHERE is_active = 1
                ORDER BY year DESC
            """)
            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        print("\n" + "="*70)
        print("[api_config_routes.py] POST /api/config/tahun-buku CALLED")
        print("="*70)
        data = request.json
        # Accept both 'year' and 'tahun' field names for compatibility
        year_value = data.get('year') or data.get('tahun')

        if not year_value:
            return jsonify({'error': 'Year field is required'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            try:
                # Check if year already exists
                cursor.execute("SELECT is_active FROM years WHERE year = ?", (year_value,))
                existing = cursor.fetchone()

                if existing:
                    # Year exists - check if it's inactive
                    if existing['is_active'] == 0:
                        # IMPORTANT: Before reactivating, we must clean up ALL old data
                        # Otherwise old data will reappear when year is reactivated
                        print(f"[REACTIVATE] Year {year_value} exists but inactive - cleaning old data before reactivation")

                        # Clean database tables for this year
                        # Note: users table doesn't have year/tahun column - only clean from CSV
                        try:
                            cursor.execute("DELETE FROM checklist_gcg WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM direktorat WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM subdirektorat WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM divisi WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM anak_perusahaan WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM aspek_master WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM checklist_assignments WHERE tahun = ?", (year_value,))
                            cursor.execute("DELETE FROM gcg_assessments WHERE year = ?", (year_value,))
                            cursor.execute("DELETE FROM gcg_assessment_summary WHERE year = ?", (year_value,))
                            cursor.execute("DELETE FROM uploaded_files WHERE year = ?", (year_value,))
                            cursor.execute("DELETE FROM document_metadata WHERE year = ?", (year_value,))
                            print(f"[OK] Cleaned database tables for year {year_value}")
                        except Exception as db_err:
                            print(f"[ERROR] Database cleanup error: {db_err}")
                            raise

                        # Clean CSV files
                        try:
                            from app import storage_service
                            import pandas as pd
                            import numpy as np

                            # Clean users.csv
                            users_csv = storage_service.read_csv('config/users.csv')
                            if users_csv is not None and not users_csv.empty and 'tahun' in users_csv.columns:
                                mask = (users_csv['tahun'].notna()) & (users_csv['tahun'] != '') & (users_csv['tahun'] == year_value)
                                users_csv = users_csv[~mask]
                                storage_service.write_csv(users_csv, 'config/users.csv')

                            # Clean checklist.csv
                            checklist_csv = storage_service.read_csv('config/checklist.csv')
                            if checklist_csv is not None and not checklist_csv.empty and 'tahun' in checklist_csv.columns:
                                mask = (checklist_csv['tahun'].notna()) & (checklist_csv['tahun'] != '') & (checklist_csv['tahun'] == year_value)
                                checklist_csv = checklist_csv[~mask]
                                storage_service.write_csv(checklist_csv, 'config/checklist.csv')

                            # Clear struktur-organisasi.csv entirely
                            struktur_csv = pd.DataFrame(columns=['id', 'type', 'nama', 'deskripsi', 'parent_id',
                                                                  'created_at', 'updated_at', 'kode', 'tahun', 'is_active'])
                            storage_service.write_csv(struktur_csv, 'config/struktur-organisasi.csv')
                            print(f"[OK] Cleaned CSV files for year {year_value}")
                        except Exception as e:
                            print(f"[WARNING] Could not clean CSV files during reactivation: {e}")

                        # Now reactivate the year with clean slate
                        cursor.execute("""
                            UPDATE years SET is_active = 1, created_at = CURRENT_TIMESTAMP
                            WHERE year = ?
                        """, (year_value,))
                        print(f"[OK] Reactivated year {year_value} with clean slate")
                        return jsonify({'message': 'Year reactivated with clean data', 'reactivated': True, 'source': 'api_config_routes.py'}), 200
                    else:
                        # Year is already active
                        return jsonify({'error': 'Year already exists'}), 400
                else:
                    # Year doesn't exist - insert new
                    cursor.execute("""
                        INSERT INTO years (year, is_active)
                        VALUES (?, ?)
                    """, (year_value, data.get('is_active', 1)))
                    print(f"[OK] Created year {year_value} in database")
                    return jsonify({'message': 'Year created'}), 201
            except Exception as e:
                return jsonify({'error': str(e)}), 400

    elif request.method == 'DELETE':
        year = request.args.get('year', type=int)
        if not year:
            return jsonify({'error': 'Missing year parameter'}), 400

        print(f"\n{'='*60}")
        print(f"[DELETE] DELETING YEAR {year} - Starting cleanup process")
        print(f"{'='*60}")
        cleanup_stats = {}

        try:
            # 1. Soft-delete year from database
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE years SET is_active = 0 WHERE year = ?", (year,))
                print(f"[OK] Step 1: Soft-deleted year {year} from years table")

            # 2. Delete GCG documents from Supabase storage
            try:
                from app import supabase
                bucket_name = 'gcg-documents'
                year_prefix = f"gcg-documents/{year}/"

                # List all files in the year directory
                files_response = supabase.storage.from_(bucket_name).list(f"gcg-documents/{year}")
                if files_response:
                    files_to_delete = []
                    for item in files_response:
                        # Recursively get all files in subdirectories
                        if item.get('id'):  # It's a directory
                            subdir_path = f"gcg-documents/{year}/{item['name']}"
                            subfiles = supabase.storage.from_(bucket_name).list(subdir_path)
                            if subfiles:
                                for subitem in subfiles:
                                    files_to_delete.append(f"{subdir_path}/{subitem['name']}")
                        else:  # It's a file
                            files_to_delete.append(f"gcg-documents/{year}/{item['name']}")

                    if files_to_delete:
                        supabase.storage.from_(bucket_name).remove(files_to_delete)
                        cleanup_stats['gcg_files_deleted'] = len(files_to_delete)
            except Exception as e:
                print(f"Warning: Could not delete GCG files: {e}")
                cleanup_stats['gcg_files_deleted'] = 0

            # 3. Delete AOI documents from Supabase storage
            try:
                from app import supabase
                bucket_name = 'gcg-documents'
                aoi_prefix = f"aoi-documents/{year}/"

                files_response = supabase.storage.from_(bucket_name).list(f"aoi-documents/{year}")
                if files_response:
                    files_to_delete = []
                    for item in files_response:
                        if item.get('id'):
                            subdir_path = f"aoi-documents/{year}/{item['name']}"
                            subfiles = supabase.storage.from_(bucket_name).list(subdir_path)
                            if subfiles:
                                for subitem in subfiles:
                                    files_to_delete.append(f"{subdir_path}/{subitem['name']}")
                        else:
                            files_to_delete.append(f"aoi-documents/{year}/{item['name']}")

                    if files_to_delete:
                        supabase.storage.from_(bucket_name).remove(files_to_delete)
                        cleanup_stats['aoi_files_deleted'] = len(files_to_delete)
            except Exception as e:
                print(f"Warning: Could not delete AOI files: {e}")
                cleanup_stats['aoi_files_deleted'] = 0

            # 4. Clean tracking files (uploaded-files.xlsx)
            try:
                from app import storage_service
                import pandas as pd

                uploaded_files = storage_service.read_excel('uploaded-files.xlsx')
                if uploaded_files is not None and not uploaded_files.empty:
                    original_count = len(uploaded_files)
                    uploaded_files = uploaded_files[uploaded_files['year'] != year]
                    deleted_count = original_count - len(uploaded_files)
                    if deleted_count > 0:
                        storage_service.write_excel(uploaded_files, 'uploaded-files.xlsx')
                        cleanup_stats['uploaded_files_records'] = deleted_count
            except Exception as e:
                print(f"Warning: Could not clean uploaded-files.xlsx: {e}")
                cleanup_stats['uploaded_files_records'] = 0

            # 5. Clean AOI tracking file (aoi-documents.csv)
            try:
                from app import storage_service
                import pandas as pd

                aoi_files = storage_service.read_csv('aoi-documents.csv')
                if aoi_files is not None and not aoi_files.empty:
                    original_count = len(aoi_files)
                    aoi_files = aoi_files[aoi_files['year'] != year]
                    deleted_count = original_count - len(aoi_files)
                    if deleted_count > 0:
                        storage_service.write_csv(aoi_files, 'aoi-documents.csv')
                        cleanup_stats['aoi_tracking_records'] = deleted_count
            except Exception as e:
                print(f"Warning: Could not clean aoi-documents.csv: {e}")
                cleanup_stats['aoi_tracking_records'] = 0

            # 6. Delete assessment data (output.xlsx)
            try:
                from app import storage_service
                import pandas as pd

                output_data = storage_service.read_excel('web-output/output.xlsx')
                if output_data is not None and not output_data.empty:
                    original_count = len(output_data)
                    output_data = output_data[output_data['Tahun'] != year]
                    deleted_count = original_count - len(output_data)
                    if deleted_count > 0:
                        storage_service.write_excel(output_data, 'web-output/output.xlsx')
                        cleanup_stats['assessment_records'] = deleted_count
            except Exception as e:
                print(f"Warning: Could not clean output.xlsx: {e}")
                cleanup_stats['assessment_records'] = 0

            # 6b. Clean users CSV file
            # Note: users.csv may have empty tahun field for default users (Super Admin)
            # We need to preserve default users and only delete users with tahun=year
            try:
                from app import storage_service
                import pandas as pd

                users_csv = storage_service.read_csv('config/users.csv')
                if users_csv is not None and not users_csv.empty:
                    original_count = len(users_csv)
                    # Keep users where:
                    # 1. tahun is empty/null (default users like Super Admin)
                    # 2. tahun != year (users from other years)
                    import numpy as np
                    if 'tahun' in users_csv.columns:
                        # Delete users where tahun == year (and tahun is not null/empty)
                        mask = (users_csv['tahun'].notna()) & (users_csv['tahun'] != '') & (users_csv['tahun'] == year)
                        users_csv = users_csv[~mask]
                    deleted_count = original_count - len(users_csv)
                    if deleted_count > 0:
                        storage_service.write_csv(users_csv, 'config/users.csv')
                        cleanup_stats['csv_users_deleted'] = deleted_count
                        print(f"[OK] Step 6b: Deleted {deleted_count} users from users.csv")
                    else:
                        print(f"[INFO] Step 6b: No users to delete from users.csv")
                else:
                    print(f"[INFO] Step 6b: users.csv is empty or not found")
            except Exception as e:
                print(f"[ERROR] Step 6b ERROR: Could not clean users.csv: {e}")
                cleanup_stats['csv_users_deleted'] = 0

            # 6c. Clean checklist CSV file
            try:
                from app import storage_service
                import pandas as pd

                checklist_csv = storage_service.read_csv('config/checklist.csv')
                if checklist_csv is not None and not checklist_csv.empty:
                    original_count = len(checklist_csv)
                    # Delete checklist items where tahun == year (and tahun is not null/empty)
                    import numpy as np
                    if 'tahun' in checklist_csv.columns:
                        mask = (checklist_csv['tahun'].notna()) & (checklist_csv['tahun'] != '') & (checklist_csv['tahun'] == year)
                        checklist_csv = checklist_csv[~mask]
                    elif 'year' in checklist_csv.columns:
                        mask = (checklist_csv['year'].notna()) & (checklist_csv['year'] != '') & (checklist_csv['year'] == year)
                        checklist_csv = checklist_csv[~mask]
                    deleted_count = original_count - len(checklist_csv)
                    if deleted_count > 0:
                        storage_service.write_csv(checklist_csv, 'config/checklist.csv')
                        cleanup_stats['csv_checklist_deleted'] = deleted_count
                        print(f"[OK] Step 6c: Deleted {deleted_count} checklist items from checklist.csv")
                    else:
                        print(f"[INFO] Step 6c: No checklist items to delete from checklist.csv")
                else:
                    print(f"[INFO] Step 6c: checklist.csv is empty or not found")
            except Exception as e:
                print(f"[ERROR] Step 6c ERROR: Could not clean checklist.csv: {e}")
                cleanup_stats['csv_checklist_deleted'] = 0

            # 6d. Clean aspects CSV file
            try:
                from app import storage_service
                import pandas as pd

                aspects_csv = storage_service.read_csv('config/aspects.csv')
                if aspects_csv is not None and not aspects_csv.empty:
                    original_count = len(aspects_csv)
                    # Delete aspects where tahun == year (and tahun is not null/empty)
                    import numpy as np
                    if 'tahun' in aspects_csv.columns:
                        mask = (aspects_csv['tahun'].notna()) & (aspects_csv['tahun'] != '') & (aspects_csv['tahun'] == year)
                        aspects_csv = aspects_csv[~mask]
                    elif 'year' in aspects_csv.columns:
                        mask = (aspects_csv['year'].notna()) & (aspects_csv['year'] != '') & (aspects_csv['year'] == year)
                        aspects_csv = aspects_csv[~mask]
                    deleted_count = original_count - len(aspects_csv)
                    if deleted_count > 0:
                        storage_service.write_csv(aspects_csv, 'config/aspects.csv')
                        cleanup_stats['csv_aspects_deleted'] = deleted_count
                        print(f"[OK] Step 6d: Deleted {deleted_count} aspects from aspects.csv")
                    else:
                        print(f"[INFO] Step 6d: No aspects to delete from aspects.csv")
                else:
                    print(f"[INFO] Step 6d: aspects.csv is empty or not found")
            except Exception as e:
                print(f"[ERROR] Step 6d ERROR: Could not clean aspects.csv: {e}")
                cleanup_stats['csv_aspects_deleted'] = 0

            # 6e. Clean struktur-organisasi CSV file
            # IMPORTANT: Data in CSV may have empty tahun field, so we delete ALL items from CSV
            # and rely on database as source of truth. Frontend reads from database, not CSV.
            try:
                from app import storage_service
                import pandas as pd

                # Delete the entire CSV file to ensure clean slate
                # Frontend reads from database (/api/config/struktur-organisasi endpoint), not from CSV
                struktur_csv = pd.DataFrame(columns=['id', 'type', 'nama', 'deskripsi', 'parent_id',
                                                      'created_at', 'updated_at', 'kode', 'tahun', 'is_active'])
                storage_service.write_csv(struktur_csv, 'config/struktur-organisasi.csv')
                cleanup_stats['csv_struktur_deleted'] = 'all_cleared'
                print(f"[OK] Step 6e: Cleared struktur-organisasi.csv (frontend reads from database)")
            except Exception as e:
                print(f"[ERROR] Step 6e ERROR: Could not clean struktur-organisasi.csv: {e}")
                cleanup_stats['csv_struktur_deleted'] = 0

            # 7. Clean database tables
            try:
                with get_db_connection() as conn:
                    cursor = conn.cursor()

                    # Clean checklist_gcg table
                    cursor.execute("DELETE FROM checklist_gcg WHERE tahun = ?", (year,))
                    checklist_deleted = cursor.rowcount
                    cleanup_stats['checklist_deleted'] = checklist_deleted

                    # Clean gcg_assessments table
                    cursor.execute("DELETE FROM gcg_assessments WHERE year = ?", (year,))
                    assessments_deleted = cursor.rowcount
                    cleanup_stats['db_assessments_deleted'] = assessments_deleted

                    # Clean uploaded_files table
                    cursor.execute("DELETE FROM uploaded_files WHERE year = ?", (year,))
                    uploads_deleted = cursor.rowcount
                    cleanup_stats['db_uploads_deleted'] = uploads_deleted

                    # Clean document_metadata table
                    cursor.execute("DELETE FROM document_metadata WHERE year = ?", (year,))
                    metadata_deleted = cursor.rowcount
                    cleanup_stats['db_metadata_deleted'] = metadata_deleted

                    # Clean struktur organisasi tables
                    cursor.execute("DELETE FROM divisi WHERE tahun = ?", (year,))
                    divisi_deleted = cursor.rowcount
                    cleanup_stats['divisi_deleted'] = divisi_deleted

                    cursor.execute("DELETE FROM subdirektorat WHERE tahun = ?", (year,))
                    subdirektorat_deleted = cursor.rowcount
                    cleanup_stats['subdirektorat_deleted'] = subdirektorat_deleted

                    cursor.execute("DELETE FROM direktorat WHERE tahun = ?", (year,))
                    direktorat_deleted = cursor.rowcount
                    cleanup_stats['direktorat_deleted'] = direktorat_deleted

                    cursor.execute("DELETE FROM anak_perusahaan WHERE tahun = ?", (year,))
                    anak_perusahaan_deleted = cursor.rowcount
                    cleanup_stats['anak_perusahaan_deleted'] = anak_perusahaan_deleted

                    # Clean users table - NOTE: users table doesn't have tahun column
                    # Users are cleaned from CSV file only (see step 6b above)
                    # cursor.execute("DELETE FROM users WHERE tahun = ?", (year,))
                    # users_deleted = cursor.rowcount
                    # cleanup_stats['users_deleted'] = users_deleted
                    cleanup_stats['users_deleted'] = 0  # Users cleaned from CSV, not database

                    conn.commit()
                    print(f"[OK] Step 7: Database cleanup completed:")
                    print(f"   - {checklist_deleted} checklist records")
                    print(f"   - {assessments_deleted} assessment records")
                    print(f"   - {uploads_deleted} uploaded files records")
                    print(f"   - {metadata_deleted} metadata records")
                    print(f"   - {direktorat_deleted} direktorat records")
                    print(f"   - {subdirektorat_deleted} subdirektorat records")
                    print(f"   - {divisi_deleted} divisi records")
                    print(f"   - {anak_perusahaan_deleted} anak perusahaan records")
                    print(f"   - {users_deleted} users records")
            except Exception as e:
                print(f"[ERROR] Step 7 ERROR: Could not clean database tables: {e}")
                cleanup_stats['db_cleanup_error'] = str(e)

            print(f"\n{'='*60}")
            print(f"[OK] YEAR {year} DELETION COMPLETED")
            print(f"{'='*60}\n")

            return jsonify({
                'message': 'Year deleted',
                'cleanup_stats': cleanup_stats
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500


# ============================================
# ORGANIZATIONAL STRUCTURE
# ============================================

@config_bp.route('/struktur-organisasi', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def config_struktur_organisasi():
    """Alias for organizational structure - combines direktorat + subdirektorat + divisi"""
    if request.method == 'GET':
        year = request.args.get('year', type=int)
        struct_type = request.args.get('type')  # 'direktorat', 'subdirektorat', or 'divisi'

        with get_db_connection() as conn:
            cursor = conn.cursor()

            if struct_type == 'direktorat':
                if year:
                    cursor.execute("""
                        SELECT * FROM direktorat
                        WHERE tahun = ? AND is_active = 1
                        ORDER BY nama
                    """, (year,))
                else:
                    cursor.execute("""
                        SELECT * FROM direktorat
                        WHERE is_active = 1
                        ORDER BY tahun, nama
                    """)
            elif struct_type == 'subdirektorat':
                if year:
                    cursor.execute("""
                        SELECT * FROM subdirektorat
                        WHERE tahun = ? AND is_active = 1
                        ORDER BY nama
                    """, (year,))
                else:
                    cursor.execute("""
                        SELECT * FROM subdirektorat
                        WHERE is_active = 1
                        ORDER BY tahun, nama
                    """)
            elif struct_type == 'divisi':
                if year:
                    cursor.execute("""
                        SELECT * FROM divisi
                        WHERE tahun = ? AND is_active = 1
                        ORDER BY nama
                    """, (year,))
                else:
                    cursor.execute("""
                        SELECT * FROM divisi
                        WHERE is_active = 1
                        ORDER BY tahun, nama
                    """)
            else:
                # Return complete organizational structure
                cursor.execute("""
                    SELECT * FROM v_organizational_structure
                    WHERE tahun = ? AND is_active = 1
                """ if year else """
                    SELECT * FROM v_organizational_structure
                    WHERE is_active = 1
                """, (year,) if year else ())

            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json
        struct_type = data.get('type', 'direktorat')

        required_fields = ['nama', 'tahun']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        if struct_type == 'direktorat':
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO direktorat (nama, deskripsi, tahun)
                    VALUES (?, ?, ?)
                """, (data['nama'], data.get('deskripsi', ''), data['tahun']))
                new_id = cursor.lastrowid
            return jsonify({'id': new_id, 'message': 'Direktorat created'}), 201

        elif struct_type == 'subdirektorat':
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO subdirektorat (nama, direktorat_id, deskripsi, tahun)
                    VALUES (?, ?, ?, ?)
                """, (data['nama'], data.get('direktorat_id'), data.get('deskripsi', ''), data['tahun']))
                new_id = cursor.lastrowid
            return jsonify({'id': new_id, 'message': 'Subdirektorat created'}), 201

        elif struct_type == 'divisi':
            # Add divisi endpoint
            required_fields = ['nama', 'tahun']
            if not all(field in data for field in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400

            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO divisi (nama, subdirektorat_id, deskripsi, tahun)
                    VALUES (?, ?, ?, ?)
                """, (data['nama'], data.get('subdirektorat_id'), data.get('deskripsi', ''), data['tahun']))
                new_id = cursor.lastrowid
            return jsonify({'id': new_id, 'message': 'Divisi created'}), 201
        else:
            return jsonify({'error': 'Invalid type'}), 400

    elif request.method in ['PUT', 'PATCH']:
        data = request.json
        item_id = request.args.get('id', type=int)
        struct_type = request.args.get('type', 'direktorat')

        if not item_id:
            return jsonify({'error': 'Missing id parameter'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()

            table_name = struct_type  # 'direktorat', 'subdirektorat', or 'divisi'
            update_fields = []
            params = []

            for field in ['nama', 'deskripsi']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            params.append(item_id)
            query = f"UPDATE {table_name} SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)

        return jsonify({'message': f'{struct_type.capitalize()} updated'})

    elif request.method == 'DELETE':
        item_id = request.args.get('id', type=int)
        struct_type = request.args.get('type', 'direktorat')

        if not item_id:
            return jsonify({'error': 'Missing id parameter'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            table_name = struct_type  # 'direktorat', 'subdirektorat', or 'divisi'
            cursor.execute(f"UPDATE {table_name} SET is_active = 0 WHERE id = ?", (item_id,))

        return jsonify({'message': f'{struct_type.capitalize()} deleted'})

# Add route for path parameter style (for frontend compatibility)
@config_bp.route('/config/struktur-organisasi/<int:struktur_id>', methods=['PUT', 'DELETE'])
def config_struktur_organisasi_by_id(struktur_id):
    """Handle struktur organisasi by ID (path parameter style)"""
    if request.method == 'PUT':
        data = request.json
        struct_type = data.get('type', 'direktorat')

        with get_db_connection() as conn:
            cursor = conn.cursor()

            table_name = struct_type  # 'direktorat', 'subdirektorat', or 'divisi'
            update_fields = []
            params = []

            for field in ['nama', 'deskripsi', 'direktorat_id', 'subdirektorat_id']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            params.append(struktur_id)
            query = f"UPDATE {table_name} SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)

        return jsonify({'message': f'{struct_type.capitalize()} updated successfully'}), 200

    elif request.method == 'DELETE':
        # Get type from query parameter
        struct_type = request.args.get('type', 'direktorat')

        with get_db_connection() as conn:
            cursor = conn.cursor()
            table_name = struct_type  # 'direktorat', 'subdirektorat', or 'divisi'
            cursor.execute(f"UPDATE {table_name} SET is_active = 0 WHERE id = ?", (struktur_id,))

        return jsonify({'message': f'{struct_type.capitalize()} deleted successfully'}), 200


# ============================================
# UPLOADED FILES TRACKING
# ============================================

@config_bp.route('/uploaded-files', methods=['GET', 'POST', 'DELETE'])
def uploaded_files():
    """File uploads tracking endpoint"""
    if request.method == 'GET':
        year = request.args.get('year', type=int)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            if year:
                cursor.execute("""
                    SELECT * FROM uploaded_files
                    WHERE year = ?
                    ORDER BY upload_date DESC
                """, (year,))
            else:
                cursor.execute("""
                    SELECT * FROM uploaded_files
                    ORDER BY year DESC, upload_date DESC
                """)

            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json

        required_fields = ['id', 'file_name', 'year']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO uploaded_files (
                    id, file_name, file_size, year, checklist_id,
                    checklist_description, aspect, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['id'], data['file_name'], data.get('file_size'),
                data['year'], data.get('checklist_id'),
                data.get('checklist_description'), data.get('aspect'),
                data.get('status', 'uploaded')
            ))

        return jsonify({'id': data['id'], 'message': 'File uploaded'}), 201

    elif request.method == 'DELETE':
        file_id = request.args.get('id')
        if not file_id:
            return jsonify({'error': 'Missing file id'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM uploaded_files WHERE id = ?", (file_id,))

        return jsonify({'message': 'File deleted'})


# ============================================
# GCG FILE UPLOAD
# ============================================

@config_bp.route('/upload-gcg-file', methods=['POST'])
def upload_gcg_file():
    """GCG file upload endpoint - handles multipart/form-data file uploads"""
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Get additional form data
    year = request.form.get('year', type=int)
    checklist_id = request.form.get('checklist_id', type=int)
    checklist_description = request.form.get('checklist_description')
    aspect = request.form.get('aspect')

    if not year:
        return jsonify({'error': 'Year is required'}), 400

    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', str(year))
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_dir, f"{file_id}_{filename}")

    # Save file
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    # Save to database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO uploaded_files (
                id, file_name, file_size, year, checklist_id,
                checklist_description, aspect, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id, filename, file_size, year, checklist_id,
            checklist_description, aspect, 'uploaded'
        ))

    return jsonify({
        'id': file_id,
        'file_name': filename,
        'file_size': file_size,
        'file_path': file_path,
        'message': 'File uploaded successfully'
    }), 201


# ============================================
# AOI DOCUMENTS
# ============================================

@config_bp.route('/aoiDocuments', methods=['GET', 'POST', 'PUT', 'DELETE'])
def aoi_documents():
    """AOI (Articles of Incorporation) documents endpoint"""
    # Note: This uses document_metadata with a specific document_type filter

    if request.method == 'GET':
        year = request.args.get('year', type=int)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            if year:
                cursor.execute("""
                    SELECT * FROM document_metadata
                    WHERE year = ? AND document_type = 'AOI' AND status = 'active'
                    ORDER BY upload_date DESC
                """, (year,))
            else:
                cursor.execute("""
                    SELECT * FROM document_metadata
                    WHERE document_type = 'AOI' AND status = 'active'
                    ORDER BY year DESC, upload_date DESC
                """)

            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json
        data['document_type'] = 'AOI'  # Force document type to AOI

        required_fields = ['id', 'title', 'file_name', 'year']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO document_metadata (
                    id, title, document_number, document_date, description,
                    gcg_principle, document_type, document_category, direksi,
                    subdirektorat, division, file_name, file_size, file_url,
                    status, confidentiality, year, uploaded_by, upload_date,
                    checklist_id, checklist_description, aspect
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['id'], data['title'], data.get('document_number'),
                data.get('document_date'), data.get('description'),
                data.get('gcg_principle'), data['document_type'],
                data.get('document_category'), data.get('direksi'),
                data.get('subdirektorat'), data.get('division'),
                data['file_name'], data.get('file_size'), data.get('file_url'),
                data.get('status', 'active'), data.get('confidentiality'),
                data['year'], data.get('uploaded_by'), data.get('upload_date'),
                data.get('checklist_id'), data.get('checklist_description'),
                data.get('aspect')
            ))
        return jsonify({'id': data['id'], 'message': 'AOI document created'}), 201

    elif request.method == 'PUT':
        doc_id = request.args.get('id')
        if not doc_id:
            return jsonify({'error': 'Missing document id'}), 400

        data = request.json

        with get_db_connection() as conn:
            cursor = conn.cursor()

            update_fields = []
            params = []

            for field in ['title', 'document_number', 'document_date', 'description',
                         'file_name', 'file_url', 'confidentiality']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            update_fields.append('updated_at = ?')
            params.append(datetime.now().isoformat())
            params.append(doc_id)

            query = f"UPDATE document_metadata SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)

        return jsonify({'message': 'AOI document updated'})

    elif request.method == 'DELETE':
        doc_id = request.args.get('id')
        if not doc_id:
            return jsonify({'error': 'Missing document id'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE document_metadata SET status = 'deleted' WHERE id = ?", (doc_id,))
        return jsonify({'message': 'AOI document deleted'})
