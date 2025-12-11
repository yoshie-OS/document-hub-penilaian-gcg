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
                ORDER BY year DESC
            """)
            rows = cursor.fetchall()
            return jsonify([dict(row) for row in rows])

    elif request.method == 'POST':
        data = request.json
        if 'year' not in data:
            return jsonify({'error': 'Missing year field'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO years (year, is_active)
                    VALUES (?, ?)
                """, (data['year'], data.get('is_active', 1)))
                return jsonify({'message': 'Year created'}), 201
            except Exception as e:
                return jsonify({'error': str(e)}), 400

    elif request.method == 'DELETE':
        year = request.args.get('year', type=int)
        if not year:
            return jsonify({'error': 'Missing year parameter'}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE years SET is_active = 0 WHERE year = ?", (year,))
        return jsonify({'message': 'Year deleted'})


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
