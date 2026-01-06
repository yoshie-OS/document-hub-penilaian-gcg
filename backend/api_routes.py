"""
API Routes for localStorage to SQLite Migration
Provides CRUD operations for all data tables
"""

print("="*70)
print("[LOAD CHECK] api_routes.py is being loaded - NEW CODE IS HERE")
print("="*70)

from flask import Blueprint, request, jsonify
from database import get_db_connection
from datetime import datetime
import json

# Create blueprint for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')


# ============================================
# CHECKLIST ENDPOINTS
# ============================================

@api_bp.route('/checklist', methods=['GET'])
def get_checklist():
    """Get all checklist items, optionally filtered by year"""
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
        checklist = [dict(row) for row in rows]

    return jsonify(checklist)


@api_bp.route('/checklist', methods=['POST'])
def create_checklist():
    """Create a new checklist item"""
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


@api_bp.route('/checklist/<int:checklist_id>', methods=['PUT'])
def update_checklist(checklist_id):
    """Update a checklist item"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Build dynamic update query
        update_fields = []
        params = []

        if 'aspek' in data:
            update_fields.append('aspek = ?')
            params.append(data['aspek'])
        if 'deskripsi' in data:
            update_fields.append('deskripsi = ?')
            params.append(data['deskripsi'])
        if 'tahun' in data:
            update_fields.append('tahun = ?')
            params.append(data['tahun'])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        params.append(checklist_id)
        query = f"UPDATE checklist_gcg SET {', '.join(update_fields)} WHERE id = ?"

        cursor.execute(query, params)

    return jsonify({'message': 'Checklist item updated'})


@api_bp.route('/checklist/<int:checklist_id>', methods=['DELETE'])
def delete_checklist(checklist_id):
    """Soft delete a checklist item"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE checklist_gcg SET is_active = 0 WHERE id = ?", (checklist_id,))

    return jsonify({'message': 'Checklist item deleted'})


# ============================================
# CHECKLIST ASSIGNMENTS ENDPOINTS
# ============================================

@api_bp.route('/assignments', methods=['GET'])
def get_assignments():
    """Get all checklist assignments, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        if year:
            cursor.execute("""
                SELECT id, checklist_id, subdirektorat, aspek, tahun, assigned_date
                FROM checklist_assignments
                WHERE tahun = ?
                ORDER BY id
            """, (year,))
        else:
            cursor.execute("""
                SELECT id, checklist_id, subdirektorat, aspek, tahun, assigned_date
                FROM checklist_assignments
                ORDER BY tahun, id
            """)

        rows = cursor.fetchall()
        assignments = [dict(row) for row in rows]

    return jsonify(assignments)


@api_bp.route('/assignments', methods=['POST'])
def create_assignment():
    """Create a new checklist assignment"""
    data = request.json

    required_fields = ['checklist_id', 'subdirektorat', 'tahun']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO checklist_assignments (checklist_id, subdirektorat, aspek, tahun)
            VALUES (?, ?, ?, ?)
        """, (data['checklist_id'], data['subdirektorat'], data.get('aspek', ''), data['tahun']))

        new_id = cursor.lastrowid

    return jsonify({'id': new_id, 'message': 'Assignment created'}), 201


@api_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete a checklist assignment"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM checklist_assignments WHERE id = ?", (assignment_id,))

    return jsonify({'message': 'Assignment deleted'})


# ============================================
# DOCUMENT UPLOADS ENDPOINTS
# ============================================

@api_bp.route('/documents', methods=['GET'])
def get_documents():
    """Get all document metadata, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        if year:
            cursor.execute("""
                SELECT * FROM document_metadata
                WHERE year = ? AND status = 'active'
                ORDER BY upload_date DESC
            """, (year,))
        else:
            cursor.execute("""
                SELECT * FROM document_metadata
                WHERE status = 'active'
                ORDER BY year DESC, upload_date DESC
            """)

        rows = cursor.fetchall()
        documents = [dict(row) for row in rows]

    return jsonify(documents)


@api_bp.route('/documents', methods=['POST'])
def create_document():
    """Create a new document metadata record"""
    data = request.json

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
            data.get('gcg_principle'), data.get('document_type'),
            data.get('document_category'), data.get('direksi'),
            data.get('subdirektorat'), data.get('division'),
            data['file_name'], data.get('file_size'), data.get('file_url'),
            data.get('status', 'active'), data.get('confidentiality'),
            data['year'], data.get('uploaded_by'), data.get('upload_date'),
            data.get('checklist_id'), data.get('checklist_description'),
            data.get('aspect')
        ))

    return jsonify({'id': data['id'], 'message': 'Document created'}), 201


@api_bp.route('/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """Soft delete a document"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE document_metadata SET status = 'deleted' WHERE id = ?", (doc_id,))

    return jsonify({'message': 'Document deleted'})


# ============================================
# GCG ASSESSMENTS ENDPOINTS
# ============================================

@api_bp.route('/gcg-assessments', methods=['GET'])
def get_gcg_assessments():
    """Get all GCG assessments, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        if year:
            cursor.execute("""
                SELECT a.*, c.deskripsi as config_deskripsi, c.bobot
                FROM gcg_assessments a
                JOIN gcg_aspects_config c ON a.config_id = c.id
                WHERE a.year = ?
                ORDER BY a.assessment_date DESC
            """, (year,))
        else:
            cursor.execute("""
                SELECT a.*, c.deskripsi as config_deskripsi, c.bobot
                FROM gcg_assessments a
                JOIN gcg_aspects_config c ON a.config_id = c.id
                ORDER BY a.year DESC, a.assessment_date DESC
            """)

        rows = cursor.fetchall()
        assessments = [dict(row) for row in rows]

    return jsonify(assessments)


@api_bp.route('/gcg-assessments', methods=['POST'])
def create_gcg_assessment():
    """Create a new GCG assessment"""
    data = request.json

    required_fields = ['year', 'config_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO gcg_assessments (
                year, config_id, nilai, skor, keterangan, evidence, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['year'], data['config_id'], data.get('nilai'),
            data.get('skor'), data.get('keterangan'),
            data.get('evidence'), data.get('created_by')
        ))

        new_id = cursor.lastrowid

    return jsonify({'id': new_id, 'message': 'Assessment created'}), 201


@api_bp.route('/gcg-assessments/<int:assessment_id>', methods=['PUT'])
def update_gcg_assessment(assessment_id):
    """Update a GCG assessment"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()

        update_fields = []
        params = []

        for field in ['nilai', 'skor', 'keterangan', 'evidence']:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(assessment_id)

        query = f"UPDATE gcg_assessments SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

    return jsonify({'message': 'Assessment updated'})


# ============================================
# ORGANIZATIONAL STRUCTURE ENDPOINTS
# ============================================

@api_bp.route('/direktorat', methods=['GET'])
def get_direktorat():
    """Get all direktorat, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

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

        rows = cursor.fetchall()
        direktorat = [dict(row) for row in rows]

    return jsonify(direktorat)


@api_bp.route('/direktorat', methods=['POST'])
def create_direktorat():
    """Create a new direktorat"""
    data = request.json

    required_fields = ['nama', 'tahun']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO direktorat (nama, deskripsi, tahun)
            VALUES (?, ?, ?)
        """, (data['nama'], data.get('deskripsi', ''), data['tahun']))

        new_id = cursor.lastrowid

    return jsonify({'id': new_id, 'message': 'Direktorat created'}), 201


@api_bp.route('/subdirektorat', methods=['GET'])
def get_subdirektorat():
    """Get all subdirektorat, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

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

        rows = cursor.fetchall()
        subdirektorat = [dict(row) for row in rows]

    return jsonify(subdirektorat)


@api_bp.route('/subdirektorat', methods=['POST'])
def create_subdirektorat():
    """Create a new subdirektorat"""
    data = request.json

    required_fields = ['nama', 'tahun']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO subdirektorat (nama, direktorat_id, deskripsi, tahun)
            VALUES (?, ?, ?, ?)
        """, (data['nama'], data.get('direktorat_id'), data.get('deskripsi', ''), data['tahun']))

        new_id = cursor.lastrowid

    return jsonify({'id': new_id, 'message': 'Subdirektorat created'}), 201


@api_bp.route('/anak-perusahaan', methods=['GET'])
def get_anak_perusahaan():
    """Get all anak perusahaan, optionally filtered by year"""
    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        if year:
            cursor.execute("""
                SELECT * FROM anak_perusahaan
                WHERE tahun = ? AND is_active = 1
                ORDER BY nama
            """, (year,))
        else:
            cursor.execute("""
                SELECT * FROM anak_perusahaan
                WHERE is_active = 1
                ORDER BY tahun, nama
            """)

        rows = cursor.fetchall()
        anak_perusahaan = [dict(row) for row in rows]

    return jsonify(anak_perusahaan)


@api_bp.route('/anak-perusahaan', methods=['POST'])
def create_anak_perusahaan():
    """Create a new anak perusahaan"""
    data = request.json

    required_fields = ['nama', 'kategori', 'tahun']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO anak_perusahaan (nama, kategori, deskripsi, tahun)
            VALUES (?, ?, ?, ?)
        """, (data['nama'], data['kategori'], data.get('deskripsi', ''), data['tahun']))

        new_id = cursor.lastrowid

    return jsonify({'id': new_id, 'message': 'Anak perusahaan created'}), 201


# ============================================
# USERS ENDPOINTS
# ============================================

@api_bp.route('/users', methods=['GET'])
def get_users():
    """Get all active users"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, role, name, direktorat, subdirektorat, divisi,
                   created_at, is_active
            FROM users
            WHERE is_active = 1
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()
        users = [dict(row) for row in rows]

    return jsonify(users)


@api_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information (excluding password)"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()

        update_fields = []
        params = []

        for field in ['email', 'role', 'name', 'direktorat', 'subdirektorat', 'divisi']:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(user_id)

        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)

    return jsonify({'message': 'User updated'})


# ============================================
# YEARS ENDPOINTS
# ============================================

@api_bp.route('/years', methods=['GET'])
def get_years():
    """Get all available years"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT year, is_active, created_at
            FROM years
            ORDER BY year DESC
        """)

        rows = cursor.fetchall()
        years = [dict(row) for row in rows]

    return jsonify(years)


@api_bp.route('/years', methods=['POST'])
def create_year():
    """Add a new year"""
    print("\n" + "="*70)
    print("[api_routes.py] POST /api/years CALLED")
    print("="*70)
    data = request.json

    if 'year' not in data:
        return jsonify({'error': 'Missing year field'}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            # Check if year already exists
            cursor.execute("SELECT is_active FROM years WHERE year = ?", (data['year'],))
            existing = cursor.fetchone()

            if existing:
                if existing['is_active'] == 0:
                    # IMPORTANT: Before reactivating, clean up ALL old data
                    year_value = data['year']
                    print(f"[api_routes.py] Reactivating year {year_value} - cleaning old data first")

                    # Clean database tables for this year
                    # Note: users table doesn't have year/tahun column - only clean from CSV
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
                    print(f"[api_routes.py] Cleaned database tables for year {year_value}")

                    # Clean CSV files
                    try:
                        from app import storage_service
                        import pandas as pd

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
                        print(f"[api_routes.py] Cleaned CSV files for year {year_value}")
                    except Exception as e:
                        print(f"[api_routes.py WARNING] Could not clean CSV files: {e}")

                    # Now reactivate with clean slate
                    cursor.execute("UPDATE years SET is_active = 1, created_at = CURRENT_TIMESTAMP WHERE year = ?", (year_value,))
                    print(f"[api_routes.py] Reactivated year {year_value} with clean slate")
                    return jsonify({'message': 'Year reactivated with clean data', 'reactivated': True}), 200
                else:
                    return jsonify({'error': 'Year already exists'}), 400

            cursor.execute("""
                INSERT INTO years (year, is_active)
                VALUES (?, ?)
            """, (data['year'], data.get('is_active', 1)))
            print(f"[api_routes.py] Created new year {data['year']}")
            return jsonify({'message': 'Year created'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 400


# ============================================
# MIGRATION HELPER ENDPOINTS
# ============================================

@api_bp.route('/migrate-localstorage', methods=['POST'])
def migrate_localstorage():
    """
    Migrate data from localStorage to SQLite
    Accepts localStorage data dump from frontend
    """
    data = request.json

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    migrated = {
        'checklist': 0,
        'assignments': 0,
        'documents': 0,
        'assessments': 0,
        'direktorat': 0,
        'subdirektorat': 0,
        'anak_perusahaan': 0,
        'users': 0
    }

    errors = []

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Migrate checklist items
        if 'checklistGCG' in data:
            try:
                for item in data['checklistGCG']:
                    cursor.execute("""
                        INSERT OR IGNORE INTO checklist_gcg (id, aspek, deskripsi, tahun)
                        VALUES (?, ?, ?, ?)
                    """, (item['id'], item['aspek'], item['deskripsi'], item.get('tahun', 2024)))
                    migrated['checklist'] += 1
            except Exception as e:
                errors.append(f"Checklist migration error: {str(e)}")

        # Migrate assignments
        for key, value in data.items():
            if key.startswith('checklistAssignments_'):
                year = int(key.split('_')[1])
                try:
                    for assignment in value:
                        cursor.execute("""
                            INSERT OR IGNORE INTO checklist_assignments
                            (checklist_id, subdirektorat, aspek, tahun)
                            VALUES (?, ?, ?, ?)
                        """, (assignment['checklistId'], assignment['subdirektorat'],
                              assignment.get('aspek', ''), year))
                        migrated['assignments'] += 1
                except Exception as e:
                    errors.append(f"Assignment migration error for year {year}: {str(e)}")

        # Add more migration logic for other data types as needed...

    return jsonify({
        'message': 'Migration completed',
        'migrated': migrated,
        'errors': errors if errors else None
    })


# ============================================
# EXCEL EXPORT ENDPOINTS
# ============================================

@api_bp.route('/export/checklist', methods=['GET'])
def export_checklist():
    """Export checklist to Excel"""
    import pandas as pd
    from io import BytesIO
    from flask import send_file

    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        if year:
            query = "SELECT * FROM checklist_gcg WHERE tahun = ? ORDER BY aspek, id"
            df = pd.read_sql_query(query, conn, params=(year,))
            filename = f'checklist_gcg_{year}.xlsx'
        else:
            query = "SELECT * FROM checklist_gcg ORDER BY tahun, aspek, id"
            df = pd.read_sql_query(query, conn)
            filename = 'checklist_gcg_all_years.xlsx'

    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Checklist GCG')

    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


@api_bp.route('/export/all-data', methods=['GET'])
def export_all_data():
    """Export all database tables to Excel with multiple sheets"""
    import pandas as pd
    from io import BytesIO
    from flask import send_file

    year = request.args.get('year', type=int)

    output = BytesIO()

    with get_db_connection() as conn:
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Checklist
            if year:
                df_checklist = pd.read_sql_query(
                    "SELECT * FROM checklist_gcg WHERE tahun = ? ORDER BY aspek, id",
                    conn, params=(year,)
                )
            else:
                df_checklist = pd.read_sql_query(
                    "SELECT * FROM checklist_gcg ORDER BY tahun, aspek, id", conn
                )
            df_checklist.to_excel(writer, index=False, sheet_name='Checklist')

            # Users
            df_users = pd.read_sql_query("SELECT id, email, role, name, direktorat, subdirektorat FROM users", conn)
            df_users.to_excel(writer, index=False, sheet_name='Users')

            # Direktorat
            if year:
                df_direktorat = pd.read_sql_query("SELECT * FROM direktorat WHERE tahun = ?", conn, params=(year,))
            else:
                df_direktorat = pd.read_sql_query("SELECT * FROM direktorat", conn)
            df_direktorat.to_excel(writer, index=False, sheet_name='Direktorat')

            # Subdirektorat
            if year:
                df_subdirektorat = pd.read_sql_query("SELECT * FROM subdirektorat WHERE tahun = ?", conn, params=(year,))
            else:
                df_subdirektorat = pd.read_sql_query("SELECT * FROM subdirektorat", conn)
            df_subdirektorat.to_excel(writer, index=False, sheet_name='Subdirektorat')

    output.seek(0)

    filename = f'gcg_data_{year}.xlsx' if year else 'gcg_data_all.xlsx'

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


# ============================================
# PERFORMA GCG ENDPOINTS
# ============================================

@api_bp.route('/performa-gcg', methods=['GET'])
def get_performa_gcg():
    """Get PerformaGCG data, optionally filtered by year"""
    year = request.args.get('year', type=int)
    level = request.args.get('level', type=int)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Build query based on filters
        query = "SELECT * FROM performa_gcg WHERE 1=1"
        params = []

        if year:
            query += " AND tahun = ?"
            params.append(year)

        if level:
            query += " AND level = ?"
            params.append(level)

        query += " ORDER BY tahun, level, section"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]

    return jsonify(data)


@api_bp.route('/performa-gcg/years', methods=['GET'])
def get_performa_gcg_years():
    """Get available years in PerformaGCG data"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT tahun
            FROM performa_gcg
            ORDER BY tahun DESC
        """)
        rows = cursor.fetchall()
        years = [row['tahun'] for row in rows]

    return jsonify(years)


@api_bp.route('/performa-gcg/summary/<int:year>', methods=['GET'])
def get_performa_gcg_summary(year):
    """Get summary statistics for a specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get overall statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total_items,
                SUM(bobot) as total_bobot,
                SUM(skor) as total_skor,
                AVG(capaian) as avg_capaian,
                MIN(capaian) as min_capaian,
                MAX(capaian) as max_capaian
            FROM performa_gcg
            WHERE tahun = ? AND level = 1
        """, (year,))

        overall = dict(cursor.fetchone())

        # Get by section
        cursor.execute("""
            SELECT
                section,
                deskripsi,
                bobot,
                skor,
                capaian,
                penjelasan
            FROM performa_gcg
            WHERE tahun = ? AND level = 1 AND type = 'header'
            ORDER BY section
        """, (year,))

        sections = [dict(row) for row in cursor.fetchall()]

    return jsonify({
        'year': year,
        'overall': overall,
        'sections': sections
    })


@api_bp.route('/performa-gcg/export', methods=['GET'])
def export_performa_gcg():
    """Export PerformaGCG data to Excel"""
    import pandas as pd
    from io import BytesIO
    from flask import send_file

    year = request.args.get('year', type=int)

    with get_db_connection() as conn:
        if year:
            query = "SELECT * FROM performa_gcg WHERE tahun = ? ORDER BY level, section"
            df = pd.read_sql_query(query, conn, params=(year,))
            filename = f'performa_gcg_{year}.xlsx'
        else:
            query = "SELECT * FROM performa_gcg ORDER BY tahun, level, section"
            df = pd.read_sql_query(query, conn)
            filename = 'performa_gcg_all_years.xlsx'

    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Performa GCG')

    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


# ============================================
# UPLOADED FILES TRACKING
# ============================================

@api_bp.route('/uploaded-files', methods=['GET', 'POST', 'DELETE'])
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


@api_bp.route('/upload-gcg-file', methods=['POST'])
def upload_gcg_file():
    """GCG file upload endpoint - handles multipart/form-data file uploads"""
    from werkzeug.utils import secure_filename
    import os
    import uuid

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


@api_bp.route('/aoiDocuments', methods=['GET', 'POST', 'PUT', 'DELETE'])
def aoi_documents():
    """AOI (Articles of Incorporation) documents endpoint"""
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
