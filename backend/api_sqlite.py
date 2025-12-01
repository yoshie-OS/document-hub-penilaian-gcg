"""
New SQLite-based Flask API for GCG Document Hub
Extends existing app.py with database operations and Excel export
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from database import get_db_connection
from excel_exporter import export_to_excel
import bcrypt
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)


# ============================================
# AUTHENTICATION & USER MANAGEMENT
# ============================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login with password verification"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, password_hash, role, name, direktorat, subdirektorat, divisi
            FROM users
            WHERE email = ? AND is_active = 1
        """, (email,))

        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user['role'],
                    'name': user['name'],
                    'direktorat': user['direktorat'],
                    'subdirektorat': user['subdirektorat'],
                    'divisi': user['divisi']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, role, name, direktorat, subdirektorat, divisi, created_at, is_active
            FROM users
            WHERE is_active = 1
            ORDER BY role, name
        """)
        users = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': users})


@app.route('/api/users', methods=['POST'])
def create_user():
    """Create new user"""
    data = request.json

    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, name, direktorat, subdirektorat, divisi)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['email'],
            password_hash,
            data['role'],
            data['name'],
            data.get('direktorat'),
            data.get('subdirektorat'),
            data.get('divisi')
        ))
        user_id = cursor.lastrowid

        return jsonify({'success': True, 'id': user_id})


# ============================================
# CHECKLIST GCG MANAGEMENT
# ============================================

@app.route('/api/checklist/<int:year>', methods=['GET'])
def get_checklist_by_year(year):
    """Get checklist for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.aspek, c.deskripsi, c.tahun,
                   COUNT(d.id) as document_count
            FROM checklist_gcg c
            LEFT JOIN document_metadata d ON c.id = d.checklist_id
            WHERE c.tahun = ? AND c.is_active = 1
            GROUP BY c.id
            ORDER BY c.aspek, c.id
        """, (year,))
        checklist = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': checklist})


@app.route('/api/checklist', methods=['POST'])
def add_checklist():
    """Add new checklist item"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO checklist_gcg (aspek, deskripsi, tahun)
            VALUES (?, ?, ?)
        """, (data['aspek'], data['deskripsi'], data['tahun']))

        return jsonify({'success': True, 'id': cursor.lastrowid})


@app.route('/api/checklist/<int:checklist_id>', methods=['PUT'])
def update_checklist(checklist_id):
    """Update checklist item"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE checklist_gcg
            SET aspek = ?, deskripsi = ?, tahun = ?
            WHERE id = ?
        """, (data['aspek'], data['deskripsi'], data['tahun'], checklist_id))

        return jsonify({'success': True})


@app.route('/api/checklist/<int:checklist_id>', methods=['DELETE'])
def delete_checklist(checklist_id):
    """Delete checklist item"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE checklist_gcg SET is_active = 0 WHERE id = ?", (checklist_id,))

        return jsonify({'success': True})


# ============================================
# DOCUMENT METADATA MANAGEMENT
# ============================================

@app.route('/api/documents/<int:year>', methods=['GET'])
def get_documents_by_year(year):
    """Get documents for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.*, c.aspek as checklist_aspek
            FROM document_metadata d
            LEFT JOIN checklist_gcg c ON d.checklist_id = c.id
            WHERE d.year = ?
            ORDER BY d.upload_date DESC
        """, (year,))
        documents = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': documents})


@app.route('/api/documents', methods=['POST'])
def create_document():
    """Create document metadata"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO document_metadata
            (id, title, document_number, document_date, description, gcg_principle,
             document_type, document_category, direksi, subdirektorat, division,
             file_name, file_size, file_url, status, confidentiality, year,
             uploaded_by, upload_date, checklist_id, checklist_description, aspect)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['id'], data['title'], data.get('documentNumber'),
            data.get('documentDate'), data.get('description'), data.get('gcgPrinciple'),
            data.get('documentType'), data.get('documentCategory'), data.get('direksi'),
            data.get('subdirektorat'), data.get('division'), data['fileName'],
            data.get('fileSize'), data.get('fileUrl'), data.get('status', 'active'),
            data.get('confidentiality'), data['year'], data.get('uploadedBy'),
            data.get('uploadDate'), data.get('checklistId'), data.get('checklistDescription'),
            data.get('aspect')
        ))

        return jsonify({'success': True, 'id': data['id']})


# ============================================
# ORGANIZATIONAL STRUCTURE
# ============================================

@app.route('/api/direktorat/<int:year>', methods=['GET'])
def get_direktorat_by_year(year):
    """Get direktorat for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM direktorat
            WHERE tahun = ? AND is_active = 1
            ORDER BY nama
        """, (year,))
        direktorat = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': direktorat})


@app.route('/api/subdirektorat/<int:year>', methods=['GET'])
def get_subdirektorat_by_year(year):
    """Get subdirektorat for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM subdirektorat
            WHERE tahun = ? AND is_active = 1
            ORDER BY nama
        """, (year,))
        subdirektorat = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': subdirektorat})


@app.route('/api/divisi/<int:year>', methods=['GET'])
def get_divisi_by_year(year):
    """Get divisi for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM divisi
            WHERE tahun = ? AND is_active = 1
            ORDER BY nama
        """, (year,))
        divisi = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': divisi})


@app.route('/api/anak-perusahaan/<int:year>', methods=['GET'])
def get_anak_perusahaan_by_year(year):
    """Get anak perusahaan for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM anak_perusahaan
            WHERE tahun = ? AND is_active = 1
            ORDER BY kategori, nama
        """, (year,))
        anak_perusahaan = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': anak_perusahaan})


# ============================================
# GCG ASSESSMENT (replacing Excel)
# ============================================

@app.route('/api/gcg-assessment/<int:year>', methods=['GET'])
def get_gcg_assessment(year):
    """Get GCG assessment for specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM v_gcg_assessment_detail
            WHERE year = ?
            ORDER BY level, section
        """, (year,))
        assessments = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT * FROM gcg_assessment_summary
            WHERE year = ?
        """, (year,))
        summary = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            'success': True,
            'data': {
                'details': assessments,
                'summary': summary
            }
        })


@app.route('/api/gcg-assessment', methods=['POST'])
def save_gcg_assessment():
    """Save GCG assessment data"""
    data = request.json

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Save individual assessments
        for item in data.get('assessments', []):
            cursor.execute("""
                INSERT INTO gcg_assessments
                (year, config_id, nilai, skor, keterangan, evidence, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data['year'],
                item['config_id'],
                item.get('nilai'),
                item.get('skor'),
                item.get('keterangan'),
                item.get('evidence'),
                data.get('created_by')
            ))

        # Update summary if provided
        if 'summary' in data:
            for summary in data['summary']:
                cursor.execute("""
                    INSERT OR REPLACE INTO gcg_assessment_summary
                    (year, aspek, total_nilai, total_skor, percentage, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    data['year'],
                    summary['aspek'],
                    summary.get('total_nilai'),
                    summary.get('total_skor'),
                    summary.get('percentage'),
                    summary.get('category')
                ))

        return jsonify({'success': True})


# ============================================
# EXCEL EXPORT ENDPOINTS (for your boss!)
# ============================================

@app.route('/api/export/users', methods=['GET'])
def export_users_excel():
    """Export users to Excel"""
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('users', exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/checklist', methods=['GET'])
def export_checklist_excel():
    """Export checklist to Excel"""
    year = request.args.get('year', type=int)
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('checklist', year=year, exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/documents', methods=['GET'])
def export_documents_excel():
    """Export documents to Excel"""
    year = request.args.get('year', type=int)
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('documents', year=year, exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/org-structure', methods=['GET'])
def export_org_structure_excel():
    """Export organizational structure to Excel"""
    year = request.args.get('year', type=int)
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('org_structure', year=year, exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/gcg-assessment', methods=['GET'])
def export_gcg_assessment_excel():
    """Export GCG assessment to Excel (replaces output.xlsx)"""
    year = request.args.get('year', type=int, default=datetime.now().year)
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('gcg_assessment', year=year, exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/all', methods=['GET'])
def export_all_excel():
    """Export ALL data to comprehensive Excel file"""
    year = request.args.get('year', type=int)
    user_id = request.args.get('user_id', type=int)
    filepath = export_to_excel('all', year=year, exported_by=user_id)
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


@app.route('/api/export/history', methods=['GET'])
def get_export_history():
    """Get export history"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, u.name as exported_by_name
            FROM excel_exports e
            LEFT JOIN users u ON e.exported_by = u.id
            ORDER BY e.export_date DESC
            LIMIT 50
        """)
        exports = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': exports})


# ============================================
# UTILITY ENDPOINTS
# ============================================

@app.route('/api/years', methods=['GET'])
def get_years():
    """Get all available years"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT year FROM years
            WHERE is_active = 1
            ORDER BY year DESC
        """)
        years = [row['year'] for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': years})


@app.route('/api/stats/<int:year>', methods=['GET'])
def get_stats(year):
    """Get statistics for a specific year"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Document completeness
        cursor.execute("""
            SELECT * FROM v_document_completeness
            WHERE tahun = ?
        """, (year,))
        completeness = [dict(row) for row in cursor.fetchall()]

        # Total documents
        cursor.execute("""
            SELECT COUNT(*) as count FROM document_metadata WHERE year = ?
        """, (year,))
        total_docs = cursor.fetchone()['count']

        # Total checklist
        cursor.execute("""
            SELECT COUNT(*) as count FROM checklist_gcg WHERE tahun = ?
        """, (year,))
        total_checklist = cursor.fetchone()['count']

        return jsonify({
            'success': True,
            'data': {
                'completeness': completeness,
                'total_documents': total_docs,
                'total_checklist': total_checklist,
                'completion_percentage': (total_docs / total_checklist * 100) if total_checklist > 0 else 0
            }
        })


# ============================================
# DATABASE INITIALIZATION
# ============================================

@app.route('/api/init-db', methods=['POST'])
def initialize_database():
    """Initialize database (admin only)"""
    from database import init_database, seed_database

    try:
        init_database()
        seed_database()
        return jsonify({'success': True, 'message': 'Database initialized successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    # Initialize database if it doesn't exist
    from database import DB_PATH, init_database, seed_database
    if not os.path.exists(DB_PATH):
        print("Database not found. Initializing...")
        init_database()
        seed_database()

    print("🚀 Starting GCG Document Hub API (SQLite + Excel Export)")
    print(f"📊 Excel exports will be saved to: backend/exports/")
    app.run(debug=True, port=5000)
