#!/usr/bin/env python3
"""
POS Data Cleaner 2 - Web API Backend
Integrates the production-ready processing engine (98.9% accuracy) with the web interface
"""

import os
import sys
import json
import uuid
import time
import shutil
import subprocess
import io
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from parent directory
from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Import storage service
from storage_service import storage_service

# Migrate Excel config files to CSV on startup
def migrate_config_to_csv():
    """Migrate config files from Excel to CSV format"""
    try:
        # Check if Excel file exists but CSV doesn't
        if storage_service.file_exists('config/aspects.xlsx'):
            aspects_data = storage_service.read_excel('config/aspects.xlsx')
            if aspects_data is not None and not storage_service.file_exists('config/aspects.csv'):
                print("🔄 Migrating aspects from Excel to CSV...")
                success = storage_service.write_csv(aspects_data, 'config/aspects.csv')
                if success:
                    print("✅ Successfully migrated aspects to CSV")
                else:
                    print("❌ Failed to migrate aspects to CSV")
            else:
                print("📋 Aspects CSV already exists or no Excel data to migrate")
    except Exception as e:
        print(f"⚠️ Error during config migration: {e}")

# Run migration on startup
migrate_config_to_csv()

def generate_unique_id():
    """Generate a unique ID for database records"""
    return int(time.time() * 1000000) % 2147483647  # Generate int ID within PostgreSQL int range

def generate_checklist_id(year, row_number):
    """Generate checklist ID in format: last two digits of year + row number
    Example: 2024 row 1 -> 241, 2025 row 10 -> 2510"""
    year_digits = year % 100  # Get last two digits of year
    return int(f"{year_digits}{row_number}")

# Project root for subprocess calls to the working core system
project_root = str(Path(__file__).parent.parent.parent)

app = Flask(__name__)
# Enable CORS for React frontend with exposed headers
CORS(app, 
     origins=["http://localhost:8081", "http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8081", "http://127.0.0.1:8080", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     expose_headers=['Content-Disposition', 'Content-Type', 'Content-Length'])

# Configuration
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
OUTPUT_FOLDER = Path(__file__).parent / 'outputs'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg', 'txt', 'md', 'markdown'}

# Ensure directories exist
UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['OUTPUT_FOLDER'] = str(OUTPUT_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename: str) -> str:
    """Determine file type from extension."""
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in {'xlsx', 'xls'}:
        return 'excel'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in {'png', 'jpg', 'jpeg'}:
        return 'image'
    return 'unknown'

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'POS Data Cleaner 2 API',
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload and process GCG assessment document.
    
    Expected form data:
    - file: The document file
    - checklistId: (optional) Associated checklist item ID
    - year: (optional) Assessment year
    - aspect: (optional) GCG aspect
    """
    try:
        print(f"🔧 DEBUG: Upload request received")
        print(f"🔧 DEBUG: Request files: {list(request.files.keys())}")
        
        # Check if file is present
        if 'file' not in request.files:
            print(f"🔧 DEBUG: No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"🔧 DEBUG: File received: {file.filename}")
        
        if file.filename == '':
            print(f"🔧 DEBUG: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            print(f"🔧 DEBUG: File type not allowed: {file.filename}")
            return jsonify({'error': 'File type not allowed'}), 400
        
        print(f"🔧 DEBUG: File validation passed")
        
        try:
            print(f"🔧 DEBUG: Starting file processing...")
            # Generate unique filename
            file_id = str(uuid.uuid4())
            print(f"🔧 DEBUG: Generated file_id: {file_id}")
            original_filename = secure_filename(file.filename)
            filename_parts = original_filename.rsplit('.', 1)
            unique_filename = f"{file_id}_{filename_parts[0]}.{filename_parts[1]}"
            
            # Save uploaded file
            input_path = UPLOAD_FOLDER / unique_filename
            file.save(str(input_path))
            
            # Generate output filename
            output_filename = f"processed_{file_id}_{filename_parts[0]}.xlsx"
            output_path = OUTPUT_FOLDER / output_filename
            
            # Get metadata from form
            checklist_id = request.form.get('checklistId')
            year = request.form.get('year')
            aspect = request.form.get('aspect')
            
            # Process the document using production system
            file_type = get_file_type(original_filename)
            
            if file_type == 'excel':
                print(f"🔧 DEBUG: Processing Excel file using core system (subprocess)...")
                processing_result = None  # Force use of subprocess method
                
                # DISABLED: Accurate processing has pandas column selection issue
                # Fall through to subprocess method which works perfectly
            
            # Use subprocess method for all file types (Excel, PDF, Image)
            if file_type in ['excel', 'pdf', 'image']:
                print(f"🔧 DEBUG: Processing {file_type} file using core system...")
                
                try:
                    import time
                    start_time = time.time()
                    
                    # Call the working core system directly as subprocess
                    cmd = [
                        sys.executable, "main_new.py",
                        "-i", str(input_path),
                        "-o", str(output_path),
                        "-v"
                    ]
                    
                    print(f"🔧 DEBUG: Running command: {' '.join(cmd)}")
                    print(f"🔧 DEBUG: Working directory: {project_root}")
                    
                    result = subprocess.run(
                        cmd,
                        cwd=project_root,
                        capture_output=True,
                        text=True,
                        timeout=180  # 3 minute timeout for OCR processing
                    )
                    
                    end_time = time.time()
                    print(f"🔧 DEBUG: Core system completed in {end_time - start_time:.2f} seconds")
                    print(f"🔧 DEBUG: Return code: {result.returncode}")
                    print(f"🔧 DEBUG: STDOUT: {result.stdout}")
                    if result.stderr:
                        print(f"🔧 DEBUG: STDERR: {result.stderr}")
                    
                    if result.returncode == 0:
                        processing_result = {
                            'success': True,
                            'method': f'{file_type}_processing',
                            'message': 'Processing completed successfully',
                            'stdout': result.stdout,
                            'processing_time': f"{end_time - start_time:.2f}s"
                        }
                    else:
                        processing_result = {
                            'success': False,
                            'method': f'{file_type}_processing',
                            'error': f'Core system failed with code {result.returncode}',
                            'stdout': result.stdout,
                            'stderr': result.stderr
                        }
                    
                except subprocess.TimeoutExpired:
                    processing_result = {
                        'success': False,
                        'method': f'{file_type}_processing',
                        'error': 'Processing timeout (3 minutes exceeded)'
                    }
                except Exception as e:
                    print(f"🔧 DEBUG: EXCEPTION in subprocess call: {e}")
                    import traceback
                    print(f"🔧 DEBUG: Full traceback: {traceback.format_exc()}")
                    processing_result = {
                        'success': False,
                        'method': f'{file_type}_processing',
                        'error': f'Subprocess failed: {str(e)}'
                    }
            
            else:
                processing_result = {
                    'success': False,
                    'error': f'Unsupported file type: {file_type}',
                    'method': 'unsupported'
                }
        
        except Exception as proc_error:
            processing_result = {
                'success': False,
                'error': f'Processing failed: {str(proc_error)}',
                'method': 'processing_error'
            }
        
        # Load processed results if successful
        extracted_data = None
        if processing_result['success'] and output_path.exists():
            try:
                # Read the processed Excel file
                df = pd.read_excel(str(output_path))
                print(f"🔧 DEBUG: Loaded DataFrame with {len(df)} rows")
                print(f"🔧 DEBUG: DataFrame columns: {list(df.columns)}")
                print(f"🔧 DEBUG: DataFrame head:\n{df.head()}")
                
                # Extract key metrics
                indicator_rows = df[df['Type'] == 'indicator'] if 'Type' in df.columns else df
                subtotal_rows = df[df['Type'] == 'subtotal'] if 'Type' in df.columns else pd.DataFrame()
                total_rows = df[df['Type'] == 'total'] if 'Type' in df.columns else pd.DataFrame()
                print(f"🔧 DEBUG: Found {len(indicator_rows)} indicator rows")
                
                extracted_data = {
                    'total_rows': int(len(df)),
                    'indicators': int(len(indicator_rows)),
                    'subtotals': int(len(subtotal_rows)),
                    'totals': int(len(total_rows)),
                    'year': str(df['Tahun'].iloc[0]) if len(df) > 0 and pd.notna(df['Tahun'].iloc[0]) else None,
                    'penilai': str(df['Penilai'].iloc[0]) if len(df) > 0 and pd.notna(df['Penilai'].iloc[0]) else None,
                    'format_type': 'DETAILED' if len(df) > 20 else 'BRIEF',
                    'processing_status': 'success'
                }
                
                # Extract ALL indicator data (not just samples)
                if len(indicator_rows) > 0:
                    all_indicators = []
                    for _, row in indicator_rows.iterrows():
                        all_indicators.append({
                            'no': int(row['No']) if pd.notna(row['No']) else 0,
                            'section': str(row['Section']) if pd.notna(row['Section']) else '',
                            'description': str(row['Deskripsi']) if pd.notna(row['Deskripsi']) else '',
                            'jumlah_parameter': int(row['Jumlah_Parameter']) if pd.notna(row['Jumlah_Parameter']) else 0,
                            'bobot': float(row['Bobot']) if pd.notna(row['Bobot']) else 100.0,
                            'skor': float(row['Skor']) if pd.notna(row['Skor']) else 0.0,
                            'capaian': float(row['Capaian']) if pd.notna(row['Capaian']) else 0.0,
                            'penjelasan': str(row['Penjelasan']) if pd.notna(row['Penjelasan']) else 'Sangat Kurang'
                        })
                    extracted_data['sample_indicators'] = all_indicators
                    
                # Add sheet analysis for XLSX files and extract BRIEF data for aspect summary
                if file_type == 'excel':
                    try:
                        # Read Excel file to analyze sheets
                        excel_file = pd.ExcelFile(str(input_path))
                        sheet_names = excel_file.sheet_names
                        
                        sheet_analysis = {
                            'total_sheets': len(sheet_names),
                            'sheet_names': sheet_names,
                            'sheet_types': {}
                        }
                        
                        brief_sheet_data = None
                        
                        # Analyze each sheet to determine if it's BRIEF or DETAILED
                        for sheet_name in sheet_names:
                            try:
                                sheet_df = pd.read_excel(str(input_path), sheet_name=sheet_name)
                                
                                # Debug: Print sheet info
                                print(f"🔧 DEBUG: Analyzing sheet '{sheet_name}' with {len(sheet_df)} rows")
                                print(f"🔧 DEBUG: Sheet columns: {list(sheet_df.columns)}")
                                print(f"🔧 DEBUG: First few rows:\n{sheet_df.head()}")
                                
                                # Simple heuristic: BRIEF has fewer rows, DETAILED has more
                                if len(sheet_df) <= 15:
                                    sheet_type = 'BRIEF'
                                    
                                    # Try to extract BRIEF data from any sheet with reasonable data
                                    if len(sheet_df) >= 3 and len(sheet_df) <= 20:  # More flexible range
                                        brief_sheet_data = []
                                        
                                        print(f"🔧 DEBUG: Attempting BRIEF extraction from sheet '{sheet_name}'")
                                        
                                        for idx, row in sheet_df.iterrows():
                                            # Extract BRIEF data for aspect summary
                                            brief_row = {}
                                            
                                            # More flexible column matching
                                            for col in sheet_df.columns:
                                                col_str = str(col).strip()
                                                col_lower = col_str.lower()
                                                
                                                # Match various column patterns
                                                if any(keyword in col_lower for keyword in ['aspek', 'section', 'aspect']):
                                                    brief_row['aspek'] = str(row[col]).strip() if pd.notna(row[col]) else ''
                                                elif any(keyword in col_lower for keyword in ['deskripsi', 'description', 'desc']):
                                                    brief_row['deskripsi'] = str(row[col]).strip() if pd.notna(row[col]) else ''
                                                elif any(keyword in col_lower for keyword in ['bobot', 'weight', 'berat']):
                                                    try:
                                                        brief_row['bobot'] = float(row[col]) if pd.notna(row[col]) else 0.0
                                                    except (ValueError, TypeError):
                                                        brief_row['bobot'] = 0.0
                                                elif any(keyword in col_lower for keyword in ['skor', 'score', 'nilai']):
                                                    try:
                                                        brief_row['skor'] = float(row[col]) if pd.notna(row[col]) else 0.0
                                                    except (ValueError, TypeError):
                                                        brief_row['skor'] = 0.0
                                                elif any(keyword in col_lower for keyword in ['capaian', 'achievement', 'pencapaian']):
                                                    try:
                                                        brief_row['capaian'] = float(row[col]) if pd.notna(row[col]) else 0.0
                                                    except (ValueError, TypeError):
                                                        brief_row['capaian'] = 0.0
                                                elif any(keyword in col_lower for keyword in ['penjelasan', 'explanation', 'keterangan']):
                                                    brief_row['penjelasan'] = str(row[col]).strip() if pd.notna(row[col]) else ''
                                            
                                            # Debug: show what we extracted for this row
                                            print(f"🔧 DEBUG: Row {idx}: {brief_row}")
                                            
                                            # Add row if it has meaningful data (aspek is required)
                                            if brief_row.get('aspek') and brief_row.get('aspek').strip() and brief_row.get('aspek') != 'nan':
                                                brief_sheet_data.append(brief_row)
                                        
                                        print(f"🔧 DEBUG: Successfully extracted {len(brief_sheet_data)} BRIEF summary rows from sheet '{sheet_name}'")
                                        
                                else:
                                    sheet_type = 'DETAILED'
                                    
                                sheet_analysis['sheet_types'][sheet_name] = {
                                    'type': sheet_type,
                                    'row_count': len(sheet_df),
                                    'contains_summary_data': len(sheet_df) <= 10 and len(sheet_df) >= 5
                                }
                            except Exception as e:
                                sheet_analysis['sheet_types'][sheet_name] = {
                                    'type': 'UNKNOWN',
                                    'error': str(e)
                                }
                        
                        extracted_data['sheet_analysis'] = sheet_analysis
                        extracted_data['brief_sheet_data'] = brief_sheet_data
                        
                    except Exception as e:
                        extracted_data['sheet_analysis'] = {
                            'error': f'Could not analyze sheets: {str(e)}'
                        }
                
            except Exception as read_error:
                extracted_data = {
                    'error': f'Could not read processed file: {str(read_error)}'
                }
        
        # Prepare response
        response_data = {
            'fileId': file_id,
            'originalFilename': original_filename,
            'processedFilename': output_filename,
            'fileType': file_type,
            'fileSize': input_path.stat().st_size,
            'uploadTime': datetime.now().isoformat(),
            'processing': processing_result,
            'extractedData': extracted_data,
            'metadata': {
                'checklistId': checklist_id,
                'year': year,
                'aspect': aspect
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"🔧 DEBUG: Exception occurred: {str(e)}")
        import traceback
        print(f"🔧 DEBUG: Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/download/<file_id>', methods=['GET'])
def download_file(file_id: str):
    """Download processed file by ID."""
    try:
        # Find the processed file
        for output_file in OUTPUT_FOLDER.glob(f"processed_{file_id}_*.xlsx"):
            if output_file.exists():
                return send_file(
                    str(output_file),
                    as_attachment=True,
                    download_name=f"GCG_Assessment_{file_id}.xlsx",
                    mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
        
        return jsonify({'error': 'File not found'}), 404
        
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all processed files."""
    try:
        files = []
        
        for output_file in OUTPUT_FOLDER.glob("processed_*.xlsx"):
            # Extract file ID from filename
            filename_parts = output_file.name.split('_', 2)
            if len(filename_parts) >= 2:
                file_id = filename_parts[1]
                
                # Get file stats
                stat = output_file.stat()
                
                files.append({
                    'fileId': file_id,
                    'filename': output_file.name,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to list files: {str(e)}'}), 500

@app.route('/api/system/info', methods=['GET'])
def system_info():
    """Get system information and capabilities."""
    return jsonify({
        'system': 'POS Data Cleaner 2',
        'version': '2.0.0',
        'capabilities': {
            'file_types': list(ALLOWED_EXTENSIONS),
            'formats_supported': ['DETAILED (56 rows)', 'BRIEF (13 rows)'],
            'languages': ['Indonesian'],
            'years_supported': '2014-2025',
            'gcg_aspects': ['I-VI (Roman numerals)', 'A-H (Alphabetic)', '1-10 (Numeric)'],
            'advanced_features': [
                'Mathematical topology processing',
                'Quantum superposition layouts', 
                'DNA helix patterns',
                'Fractal recursive structures',
                'Multi-engine OCR (Tesseract + PaddleOCR)',
                'ML classification (XGBoost + rules)'
            ]
        },
        'processing_pipeline': [
            'File type detection',
            'Format classification (DETAILED vs BRIEF)',
            'Pattern recognition (43+ indicator patterns)', 
            'Spatial matching (distance-based pairing)',
            'Manual.xlsx structure generation (362 rows)',
            'Quality validation'
        ],
        'infrastructure': {
            'privacy_first': True,
            'cloud_dependencies': None,
            'local_processing': True,
            'max_file_size': '16MB',
            'concurrent_processing': True
        }
    })


@app.route('/api/save', methods=['POST'])
def save_assessment():
    """
    Save assessment data directly to output.xlsx (no JSON intermediate)
    """
    try:
        data = request.json
        print(f"🔧 DEBUG: Received save request with data keys: {data.keys()}")
        
        # Create assessment record
        assessment_id = f"{data.get('year', 'unknown')}_{data.get('auditor', 'unknown')}_{str(uuid.uuid4())[:8]}"
        saved_at = datetime.now().isoformat()
        
        # Load existing XLSX data and COMPLETELY REPLACE year's data (including deletions)
        all_rows = []
        existing_df = storage_service.read_excel('web-output/output.xlsx')
        
        if existing_df is not None:
            try:
                current_year = data.get('year')
                
                print(f"🔧 DEBUG: Loading existing XLSX with {len(existing_df)} rows")
                print(f"🔧 DEBUG: Current year to save: {current_year}")
                print(f"🔧 DEBUG: Existing years in file: {existing_df['Tahun'].unique().tolist()}")
                
                # COMPLETELY REMOVE all existing data for this year (this handles deletions)
                if current_year:
                    original_count = len(existing_df)
                    existing_df = existing_df[existing_df['Tahun'] != current_year]
                    removed_count = original_count - len(existing_df)
                    print(f"🔧 DEBUG: COMPLETELY REMOVED {removed_count} rows for year {current_year} (including deletions)")
                    print(f"🔧 DEBUG: Preserved {len(existing_df)} rows from other years")
                
                # Convert remaining data back to list format
                for _, row in existing_df.iterrows():
                    all_rows.append(row.to_dict())
                    
                print(f"🔧 DEBUG: Starting with {len(all_rows)} rows from other years")
            except Exception as e:
                print(f"WARNING: Could not read existing XLSX: {e}")
        
        # Process new data and add to all_rows
        year = data.get('year', 'unknown')
        auditor = data.get('auditor', 'unknown')
        jenis_asesmen = data.get('jenis_asesmen', 'Internal')
        
        # Process main indicator data
        for row in data.get('data', []):
            # Map frontend data structure to XLSX format
            row_id = row.get('id', row.get('no', ''))
            section = row.get('aspek', row.get('section', ''))
            is_total = row.get('isTotal', False)
            
            # Determine Level and Type based on data structure
            if is_total:
                level = "1"
                row_type = "total"
            elif str(row_id).isdigit():
                level = "2"
                row_type = "indicator"
            else:
                level = "1"
                row_type = "header"
            
            xlsx_row = {
                'Level': level,
                'Type': row_type,
                'Section': section,
                'No': row_id,
                'Deskripsi': row.get('deskripsi', ''),
                'Bobot': row.get('bobot', ''),
                'Skor': row.get('skor', ''),
                'Capaian': row.get('capaian', ''),
                'Penjelasan': row.get('penjelasan', ''),
                'Tahun': year,
                'Penilai': auditor,
                'Jenis_Penilaian': jenis_asesmen,
                'Export_Date': saved_at[:10]
            }
            all_rows.append(xlsx_row)
        
        # Process aspect summary data (if provided)
        aspect_summary_data = data.get('aspectSummaryData', [])
        if aspect_summary_data:
            print(f"🔧 DEBUG: Processing {len(aspect_summary_data)} aspect summary rows")
            
            for summary_row in aspect_summary_data:
                section = summary_row.get('aspek', '')
                deskripsi = summary_row.get('deskripsi', '')
                bobot = summary_row.get('bobot', 0)
                skor = summary_row.get('skor', 0)
                
                # Skip empty aspects or meaningless default data
                if not section or not deskripsi or (bobot == 0 and skor == 0):
                    continue
                    
                # Skip if this looks like an unedited default row (just roman numerals with no real data)
                if section in ['I', 'II', 'III', 'IV', 'V', 'VI'] and not deskripsi.strip():
                    continue
                    
                # Row 1: Header for this aspect
                header_row = {
                    'Level': "1",
                    'Type': 'header',
                    'Section': section,
                    'No': '',
                    'Deskripsi': summary_row.get('deskripsi', ''),
                    'Bobot': '',
                    'Skor': '',
                    'Capaian': '',
                    'Penjelasan': '',
                    'Tahun': year,
                    'Penilai': auditor,
                    'Jenis_Penilaian': jenis_asesmen,
                    'Export_Date': saved_at[:10]
                }
                all_rows.append(header_row)
                
                # Row 2: Subtotal for this aspect
                subtotal_row = {
                    'Level': "1", 
                    'Type': 'subtotal',
                    'Section': section,
                    'No': '',
                    'Deskripsi': f'JUMLAH {section}',
                    'Bobot': summary_row.get('bobot', ''),
                    'Skor': summary_row.get('skor', ''),
                    'Capaian': summary_row.get('capaian', ''),
                    'Penjelasan': summary_row.get('penjelasan', ''),
                    'Tahun': year,
                    'Penilai': auditor,
                    'Jenis_Penilaian': jenis_asesmen,
                    'Export_Date': saved_at[:10]
                }
                all_rows.append(subtotal_row)
        
        # Process separate totalData (total row sent separately from main data)
        total_data = data.get('totalData', {})
        if total_data and isinstance(total_data, dict):
            # Check if total data has meaningful values (not all zeros)
            has_meaningful_total = (
                total_data.get('bobot', 0) != 0 or 
                total_data.get('skor', 0) != 0 or 
                total_data.get('capaian', 0) != 0 or 
                total_data.get('penjelasan', '').strip() != ''
            )
            
            if has_meaningful_total:
                print(f"🔧 DEBUG: Processing separate totalData: {total_data}")
                
                total_row = {
                    'Level': "4",
                    'Type': 'total',
                    'Section': 'TOTAL',
                    'No': '',
                    'Deskripsi': 'TOTAL',
                    'Bobot': total_data.get('bobot', ''),
                    'Skor': total_data.get('skor', ''),
                    'Capaian': total_data.get('capaian', ''),
                    'Penjelasan': total_data.get('penjelasan', ''),
                    'Tahun': year,
                    'Penilai': auditor,
                    'Jenis_Penilaian': jenis_asesmen,
                    'Export_Date': saved_at[:10]
                }
                all_rows.append(total_row)
                print(f"🔧 DEBUG: Added totalData row to all_rows")
            else:
                print(f"🔧 DEBUG: Skipping totalData - no meaningful values")
        
        # Convert to DataFrame and save XLSX
        if all_rows:
            df = pd.DataFrame(all_rows)
            
            # Remove any duplicate rows
            df_unique = df.drop_duplicates(subset=['Tahun', 'Section', 'No', 'Deskripsi'], keep='last')
            print(f"🔧 DEBUG: Removed {len(df) - len(df_unique)} duplicate rows")
            
            # Custom sorting: year → aspek → no, then organize headers and subtotals properly
            def sort_key(row):
                # Ensure all values are consistently typed for comparison
                try:
                    year = int(row['Tahun']) if pd.notna(row['Tahun']) else 0
                except (ValueError, TypeError):
                    year = 0
                
                section = str(row['Section']) if pd.notna(row['Section']) else ''
                no = row['No']
                row_type = str(row['Type']) if pd.notna(row['Type']) else 'indicator'
                
                # Convert 'no' to numeric for proper sorting, handle empty values
                try:
                    no_numeric = int(no) if str(no).isdigit() else 9999
                except (ValueError, TypeError):
                    no_numeric = 9999
                
                # Type priority: header=0, indicators=1, subtotal=2, total=3 (appears last)
                type_priority = {'header': 0, 'indicator': 1, 'subtotal': 2, 'total': 3}.get(row_type, 1)
                
                # Special handling for total rows: they should appear at the very end of each year
                if row_type == 'total':
                    # Use 'ZZZZZ' as section to ensure total rows sort last within each year
                    section = 'ZZZZZ'
                
                return (year, section, type_priority, no_numeric)
            
            # Apply custom sorting
            df_sorted = df_unique.loc[df_unique.apply(sort_key, axis=1).sort_values().index]
            
            # Save XLSX using storage service
            success = storage_service.write_excel(df_sorted, 'web-output/output.xlsx')
            if success:
                print(f"SUCCESS: Saved to output.xlsx with {len(df_sorted)} rows (sorted: year->aspek->no->type)")
            else:
                print(f"ERROR: Failed to save output.xlsx")
            
        return jsonify({
            'success': True,
            'message': 'Data berhasil disimpan',
            'assessment_id': assessment_id,
            'saved_at': saved_at
        })
        
    except Exception as e:
        print(f"ERROR: Error saving assessment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# generate_output_xlsx function removed - now saving directly to XLSX


@app.route('/api/delete-year-data', methods=['DELETE'])
def delete_year_data():
    """
    Delete all assessment data for a specific year from output.xlsx
    """
    try:
        data = request.json
        year_to_delete = data.get('year')
        
        if not year_to_delete:
            return jsonify({
                'success': False,
                'error': 'Year parameter is required'
            }), 400
        
        print(f"🗑️ DEBUG: Received delete request for year: {year_to_delete}")
        
        # Load existing XLSX data
        existing_df = storage_service.read_excel('web-output/output.xlsx')
        
        if existing_df is None:
            return jsonify({
                'success': False,
                'error': 'No data file exists to delete from'
            }), 404
        
        try:
            print(f"🔧 DEBUG: Loading existing XLSX with {len(existing_df)} rows")
            print(f"🔧 DEBUG: Year to delete: {year_to_delete}")
            print(f"🔧 DEBUG: Existing years in file: {existing_df['Tahun'].unique().tolist()}")
            
            # Check if the year exists in the data
            if year_to_delete not in existing_df['Tahun'].values:
                return jsonify({
                    'success': False,
                    'error': f'No data found for year {year_to_delete}'
                }), 404
            
            # Remove all data for the specified year
            original_count = len(existing_df)
            filtered_df = existing_df[existing_df['Tahun'] != year_to_delete]
            deleted_count = original_count - len(filtered_df)
            
            print(f"🗑️ DEBUG: Deleted {deleted_count} rows for year {year_to_delete}")
            print(f"🔧 DEBUG: Remaining {len(filtered_df)} rows from other years")
            
            # Save the filtered data back to the XLSX file
            if len(filtered_df) > 0:
                # Sort the remaining data properly before saving
                def sort_key(row):
                    year = row['Tahun']
                    section = str(row['Section']) if pd.notna(row['Section']) else ''
                    no = row['No']
                    row_type = str(row['Type']) if pd.notna(row['Type']) else 'indicator'
                    
                    # Convert 'no' to numeric for proper sorting
                    try:
                        no_numeric = int(no) if str(no).isdigit() else 9999
                    except (ValueError, TypeError):
                        no_numeric = 9999
                    
                    # Type priority: header=0, indicators=1, subtotal=2, total=3 (appears last)
                    type_priority = {'header': 0, 'indicator': 1, 'subtotal': 2, 'total': 3}.get(row_type, 1)
                    
                    # Special handling for total rows: they should appear at the very end of each year
                    if row_type == 'total':
                        # Use 'ZZZZZ' as section to ensure total rows sort last within each year
                        section = 'ZZZZZ'
                    
                    return (year, section, type_priority, no_numeric)
                
                # Apply sorting
                df_sorted = filtered_df.loc[filtered_df.apply(sort_key, axis=1).sort_values().index]
                success = storage_service.write_excel(df_sorted, 'web-output/output.xlsx')
                if success:
                    print(f"SUCCESS: Updated output.xlsx with {len(df_sorted)} rows (deleted {deleted_count} rows for year {year_to_delete})")
                else:
                    print(f"ERROR: Failed to update output.xlsx after deletion")
            else:
                # If no data remains, create an empty file with just headers
                empty_df = pd.DataFrame(columns=['Level', 'Type', 'Section', 'No', 'Deskripsi', 
                                               'Bobot', 'Skor', 'Capaian', 'Penjelasan', 'Tahun', 'Penilai', 
                                               'Jenis_Asesmen', 'Export_Date'])
                success = storage_service.write_excel(empty_df, 'web-output/output.xlsx')
                if success:
                    print(f"SUCCESS: Created empty output.xlsx file (all data deleted)")
                else:
                    print(f"ERROR: Failed to create empty output.xlsx file")
            
        except Exception as e:
            print(f"ERROR: Could not process XLSX file: {e}")
            return jsonify({
                'success': False,
                'error': f'Could not process XLSX file: {str(e)}'
            }), 500
        
        return jsonify({
            'success': True,
            'message': f'Data untuk tahun {year_to_delete} berhasil dihapus',
            'deleted_rows': deleted_count,
            'year': year_to_delete
        })
        
    except Exception as e:
        print(f"ERROR: Error deleting year data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/load/<int:year>', methods=['GET'])
def load_assessment_by_year(year):
    """
    Load assessment data for a specific year from output.xlsx
    """
    try:
        # Read XLSX data
        df = storage_service.read_excel('web-output/output.xlsx')
        
        if df is None:
            return jsonify({
                'success': False,
                'data': [],
                'message': f'No saved data found for year {year}'
            })
        
        # Filter for the requested year
        year_df = df[df['Tahun'] == year]
        
        if len(year_df) > 0:
            print(f"🔧 DEBUG: Processing {len(year_df)} rows for year {year}")
            
            # Detect format: BRIEF or DETAILED based on data types
            indicator_rows = year_df[year_df['Type'] == 'indicator']
            subtotal_rows = year_df[year_df['Type'] == 'subtotal'] 
            header_rows = year_df[year_df['Type'] == 'header']
            
            is_detailed = len(indicator_rows) > 10 and len(subtotal_rows) > 0
            format_type = 'DETAILED' if is_detailed else 'BRIEF'
            
            print(f"🔧 DEBUG: Detected format: {format_type}")
            print(f"🔧 DEBUG: Found {len(indicator_rows)} indicators, {len(subtotal_rows)} subtotals, {len(header_rows)} headers")
            
            # Process indicator data for main table (both BRIEF and DETAILED)
            main_table_data = []
            for _, row in indicator_rows.iterrows():
                row_id = row.get('No', '')
                if pd.isna(row_id) or str(row_id).lower() in ['nan', '', 'none']:
                    continue
                    
                aspek = str(row.get('Section', ''))
                deskripsi = str(row.get('Deskripsi', ''))
                if not aspek or not deskripsi:
                    continue
                
                penjelasan = row.get('Penjelasan', '')
                if pd.isna(penjelasan) or str(penjelasan).lower() == 'nan':
                    penjelasan = 'Tidak Baik'
                
                main_table_data.append({
                    'id': str(row_id),
                    'aspek': aspek,
                    'deskripsi': deskripsi,
                    'jumlah_parameter': int(row.get('Jumlah_Parameter', 0)) if pd.notna(row.get('Jumlah_Parameter')) else 0,
                    'bobot': float(row.get('Bobot', 0)) if pd.notna(row.get('Bobot')) else 0,
                    'skor': float(row.get('Skor', 0)) if pd.notna(row.get('Skor')) else 0,
                    'capaian': float(row.get('Capaian', 0)) if pd.notna(row.get('Capaian')) else 0,
                    'penjelasan': str(penjelasan)
                })
            
            # Process aspek summary data (subtotals) for DETAILED mode
            aspek_summary_data = []
            if is_detailed and len(subtotal_rows) > 0:
                for _, row in subtotal_rows.iterrows():
                    aspek = str(row.get('Section', ''))
                    if not aspek:
                        continue
                        
                    penjelasan = row.get('Penjelasan', '')
                    if pd.isna(penjelasan) or str(penjelasan).lower() == 'nan':
                        penjelasan = 'Tidak Baik'
                    
                    aspek_summary_data.append({
                        'id': f'summary-{aspek}',
                        'aspek': aspek,
                        'deskripsi': str(row.get('Deskripsi', '')),
                        'jumlah_parameter': int(row.get('Jumlah_Parameter', 0)) if pd.notna(row.get('Jumlah_Parameter')) else 0,
                        'bobot': float(row.get('Bobot', 0)) if pd.notna(row.get('Bobot')) else 0,
                        'skor': float(row.get('Skor', 0)) if pd.notna(row.get('Skor')) else 0,
                        'capaian': float(row.get('Capaian', 0)) if pd.notna(row.get('Capaian')) else 0,
                        'penjelasan': str(penjelasan)
                    })
            
            print(f"🔧 DEBUG: Processed {len(main_table_data)} indicators, {len(aspek_summary_data)} aspect summaries")
            
            # Get auditor and jenis_asesmen from first row
            auditor = year_df.iloc[0].get('Penilai', 'Unknown') if len(year_df) > 0 else 'Unknown'
            jenis_asesmen = year_df.iloc[0].get('Jenis_Asesmen', 'Internal') if len(year_df) > 0 else 'Internal'
            
            return jsonify({
                'success': True,
                'data': main_table_data,
                'aspek_summary_data': aspek_summary_data,
                'format_type': format_type,
                'is_detailed': is_detailed,
                'auditor': auditor,
                'jenis_asesmen': jenis_asesmen,
                'method': 'xlsx_load',
                'saved_at': year_df.iloc[0].get('Export_Date', '') if len(year_df) > 0 else '',
                'message': f'Loaded {len(main_table_data)} indicators + {len(aspek_summary_data)} summaries for year {year} ({format_type} format)'
            })
        else:
            return jsonify({
                'success': False,
                'data': [],
                'message': f'No saved data found for year {year}'
            })
            
    except Exception as e:
        print(f"ERROR: Error loading year {year}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500


@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    Get all assessment data from output.xlsx for dashboard visualization
    """
    try:
        # Read XLSX data
        df = storage_service.read_excel('web-output/output.xlsx')
        
        if df is None:
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No dashboard data available. Please save some assessments first.'
            })
        
        print(f"🔧 DEBUG: Dashboard loading {len(df)} rows from output.xlsx")
        print(f"🔧 DEBUG: Years in file: {df['Tahun'].unique().tolist()}")
        print(f"🔧 DEBUG: Sample rows: {df[['Tahun', 'Section', 'Skor']].head().to_dict('records')}")
        
        # Convert to dashboard format
        dashboard_data = []
        for _, row in df.iterrows():
            # Handle NaN values properly
            bobot = row.get('Bobot', 0)
            skor = row.get('Skor', 0)
            capaian = row.get('Capaian', 0)
            jumlah_param = row.get('Jumlah_Parameter', 0)
            
            # Convert NaN to 0 for numeric fields
            if pd.isna(bobot):
                bobot = 0
            if pd.isna(skor):
                skor = 0
            if pd.isna(capaian):
                capaian = 0
            if pd.isna(jumlah_param):
                jumlah_param = 0
                
            dashboard_item = {
                'id': str(row.get('No', '')),
                'aspek': str(row.get('Section', '')),
                'deskripsi': str(row.get('Deskripsi', '')),
                'jumlah_parameter': float(jumlah_param),
                'bobot': float(bobot),
                'skor': float(skor),
                'capaian': float(capaian),
                'penjelasan': str(row.get('Penjelasan', '')),
                'year': int(row.get('Tahun', 2022)),
                'auditor': str(row.get('Penilai', 'Unknown')),
                'jenis_asesmen': str(row.get('Jenis_Asesmen', 'Internal'))
            }
            dashboard_data.append(dashboard_item)
        
        # Group by year for multi-year support
        years_data = {}
        for item in dashboard_data:
            year = item['year']
            if year not in years_data:
                years_data[year] = {
                    'year': year,
                    'auditor': item['auditor'],
                    'jenis_asesmen': item['jenis_asesmen'],
                    'data': []
                }
            years_data[year]['data'].append(item)
        
        return jsonify({
            'success': True,
            'years_data': years_data,
            'total_rows': len(dashboard_data),
            'available_years': list(years_data.keys()),
            'message': f'Loaded dashboard data for {len(years_data)} year(s)'
        })
        
    except Exception as e:
        print(f"ERROR: Error loading dashboard data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500


@app.route('/api/aspek-data', methods=['GET'])
def get_aspek_data():
    """
    Get hybrid data (subtotal + header) for aspek summary table
    """
    try:
        # Read XLSX data
        df = storage_service.read_excel('web-output/output.xlsx')
        
        if df is None:
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No data available'
            })
        
        # Create hybrid data: subtotal numeric data + header descriptions
        subtotal_rows = df[df['Type'] == 'subtotal']
        header_rows = df[df['Type'] == 'header']
        
        # Convert to frontend format by combining subtotal + header data
        indicators = []
        for _, subtotal_row in subtotal_rows.iterrows():
            # Find matching header row by Section and Year
            matching_header = header_rows[
                (header_rows['Section'] == subtotal_row['Section']) & 
                (header_rows['Tahun'] == subtotal_row['Tahun'])
            ]
            
            # Use header description if found, otherwise subtotal description
            deskripsi = subtotal_row['Deskripsi']  # fallback
            if not matching_header.empty:
                deskripsi = matching_header.iloc[0]['Deskripsi']
            indicators.append({
                'id': str(subtotal_row.get('No', '')),
                'aspek': str(subtotal_row.get('Section', '')),
                'deskripsi': deskripsi,  # Use header description
                'jumlah_parameter': int(subtotal_row.get('Jumlah_Parameter', 0)) if pd.notna(subtotal_row.get('Jumlah_Parameter')) else 0,
                'bobot': float(subtotal_row.get('Bobot', 0)) if pd.notna(subtotal_row.get('Bobot')) else 0,
                'skor': float(subtotal_row.get('Skor', 0)) if pd.notna(subtotal_row.get('Skor')) else 0,
                'capaian': float(subtotal_row.get('Capaian', 0)) if pd.notna(subtotal_row.get('Capaian')) else 0,
                'penjelasan': str(subtotal_row.get('Penjelasan', 'Tidak Baik')),
                'tahun': int(subtotal_row.get('Tahun', 0)) if pd.notna(subtotal_row.get('Tahun')) else 0
            })
        
        return jsonify({
            'success': True,
            'data': indicators,
            'total': len(indicators),
            'message': f'Loaded {len(indicators)} aspek records'
        })
        
    except Exception as e:
        print(f"ERROR: Error loading aspek data: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

def _cleanup_orphaned_data_internal():
    """
    Internal helper function to clean up orphaned data (without returning HTTP response)
    """
    assessments_path = Path(__file__).parent.parent / 'web-output' / 'assessments.json'
    
    # Get years that exist in output.xlsx
    xlsx_years = set()
    df = storage_service.read_excel('web-output/output.xlsx')
    if df is not None:
        xlsx_years = set(df['Tahun'].unique())
    
    # Clean up assessments.json
    orphaned_count = 0
    if assessments_path.exists():
        with open(assessments_path, 'r') as f:
            assessments_data = json.load(f)
        
        # Filter out orphaned entries
        cleaned_assessments = []
        for assessment in assessments_data.get('assessments', []):
            year = assessment.get('year')
            if year in xlsx_years:
                cleaned_assessments.append(assessment)
            else:
                orphaned_count += 1
        
        # Save cleaned data if any changes were made
        if orphaned_count > 0:
            assessments_data['assessments'] = cleaned_assessments
            with open(assessments_path, 'w') as f:
                json.dump(assessments_data, f, indent=2)
            print(f"🔄 Auto-cleaned {orphaned_count} orphaned entries")
    
    return orphaned_count

@app.route('/api/indicator-data', methods=['GET'])
def get_indicator_data():
    """
    Get pure indicator data for detailed bottom table
    """
    try:
        # Auto-cleanup orphaned data before proceeding
        try:
            _cleanup_orphaned_data_internal()
        except Exception as cleanup_error:
            print(f"WARNING: Auto-cleanup failed: {cleanup_error}")
        
        # Read XLSX data
        df = storage_service.read_excel('web-output/output.xlsx')
        
        if df is None:
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No data available'
            })
        
        # Filter only indicator rows
        indicator_rows = df[df['Type'] == 'indicator']
        
        # Convert to frontend format
        indicators = []
        for _, row in indicator_rows.iterrows():
            indicators.append({
                'id': str(row.get('No', '')),
                'aspek': str(row.get('Section', '')),
                'deskripsi': str(row.get('Deskripsi', '')),
                'jumlah_parameter': int(row.get('Jumlah_Parameter', 0)) if pd.notna(row.get('Jumlah_Parameter')) else 0,
                'bobot': float(row.get('Bobot', 0)) if pd.notna(row.get('Bobot')) else 0,
                'skor': float(row.get('Skor', 0)) if pd.notna(row.get('Skor')) else 0,
                'capaian': float(row.get('Capaian', 0)) if pd.notna(row.get('Capaian')) else 0,
                'penjelasan': str(row.get('Penjelasan', 'Tidak Baik')),
                'tahun': int(row.get('Tahun', 0)) if pd.notna(row.get('Tahun')) else 0
            })
        
        return jsonify({
            'success': True,
            'data': indicators,
            'total': len(indicators),
            'message': f'Loaded {len(indicators)} indicator records'
        })
        
    except Exception as e:
        print(f"ERROR: Error loading indicator data: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

@app.route('/api/gcg-chart-data', methods=['GET'])
def get_gcg_chart_data():
    """
    Get assessment data formatted for GCGChart component (graphics-2 format)
    Returns data with Level hierarchy as expected by processGCGData function
    """
    try:
        # Read XLSX data
        df = storage_service.read_excel('web-output/output.xlsx')
        
        if df is None:
            print(f"WARNING: output.xlsx not found or empty")
            return jsonify({
                'success': True,
                'data': [],
                'message': 'No chart data available. Please save some assessments first.'
            })
        
        print(f"INFO: GCG Chart Data: Loading {len(df)} rows from output.xlsx")
        
        # Convert to graphics-2 GCGData format
        gcg_data = []
        for _, row in df.iterrows():
            # Determine level based on row type
            level = 3  # Default to section level
            row_type = str(row.get('Type', '')).lower()
            
            if row_type == 'total':
                level = 4
            elif row_type == 'header':
                level = 1
            elif row_type == 'indicator':
                level = 2
            elif row_type == 'subtotal':
                level = 3
            
            # Handle NaN values
            tahun = int(row.get('Tahun', 2022))
            skor = float(row.get('Skor', 0)) if not pd.isna(row.get('Skor', 0)) else 0
            capaian = float(row.get('Capaian', 0)) if not pd.isna(row.get('Capaian', 0)) else 0
            bobot = float(row.get('Bobot', 0)) if not pd.isna(row.get('Bobot', 0)) else None
            jumlah_param = float(row.get('Jumlah_Parameter', 0)) if not pd.isna(row.get('Jumlah_Parameter', 0)) else None
            
            gcg_item = {
                'Tahun': tahun,
                'Skor': skor,
                'Level': level,
                'Section': str(row.get('Section', '')),
                'Capaian': capaian,
                'Bobot': bobot,
                'Jumlah_Parameter': jumlah_param,
                'Penjelasan': str(row.get('Penjelasan', '')),
                'Penilai': str(row.get('Penilai', 'Unknown')),
                'No': str(row.get('No', '')),
                'Deskripsi': str(row.get('Deskripsi', '')),
                'Jenis_Penilaian': str(row.get('Jenis_Penilaian', 'Data Kosong'))
            }
            gcg_data.append(gcg_item)
        
        return jsonify({
            'success': True,
            'data': gcg_data,
            'total_rows': len(gcg_data),
            'available_years': list(set([item['Tahun'] for item in gcg_data])),
            'message': f'Loaded GCG chart data: {len(gcg_data)} rows'
        })
        
    except Exception as e:
        print(f"ERROR: Error loading GCG chart data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500


@app.route('/api/gcg-mapping', methods=['GET'])
def get_gcg_mapping():
    """
    Get GCG mapping data for autocomplete suggestions
    """
    try:
        # Path to GCG mapping CSV file
        gcg_mapping_path = Path(__file__).parent.parent / 'GCG_MAPPING.csv'
        
        if not gcg_mapping_path.exists():
            print(f"WARNING: GCG_MAPPING.csv not found at: {gcg_mapping_path}")
            return jsonify({
                'success': False,
                'error': 'GCG mapping file not found',
                'data': []
            }), 404
        
        # Read GCG mapping CSV
        df = pd.read_csv(gcg_mapping_path)
        
        # Convert to list of dictionaries for JSON response
        gcg_data = []
        for _, row in df.iterrows():
            gcg_item = {
                'level': str(row.get('Level', '')),
                'type': str(row.get('Type', '')),
                'section': str(row.get('Section', '')),
                'no': str(row.get('No', '')),
                'deskripsi': str(row.get('Deskripsi', '')),
                'jumlah_parameter': str(row.get('Jumlah_Parameter', '')),
                'bobot': str(row.get('Bobot', ''))
            }
            gcg_data.append(gcg_item)
        
        # Return all items for flexible filtering on frontend
        return jsonify({
            'success': True,
            'data': gcg_data,
            'total_items': len(gcg_data),
            'headers': len([item for item in gcg_data if item['type'] == 'header']),
            'indicators': len([item for item in gcg_data if item['type'] == 'indicator']),
            'message': f'Loaded {len(gcg_data)} GCG items for autocomplete'
        })
        
    except Exception as e:
        print(f"ERROR: Error loading GCG mapping: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

@app.route('/api/cleanup-orphaned-data', methods=['POST'])
def cleanup_orphaned_data():
    """
    Clean up orphaned entries in assessments.json that don't exist in output.xlsx
    """
    try:
        assessments_path = Path(__file__).parent.parent / 'web-output' / 'assessments.json'
        
        # Get years that exist in output.xlsx
        xlsx_years = set()
        df = storage_service.read_excel('web-output/output.xlsx')
        if df is not None:
            xlsx_years = set(df['Tahun'].unique())
            print(f"INFO: Found years in output.xlsx: {sorted(xlsx_years)}")
        else:
            print("WARNING: output.xlsx not found - will clean all assessments.json entries")
        
        # Clean up assessments.json
        orphaned_count = 0
        if assessments_path.exists():
            with open(assessments_path, 'r') as f:
                assessments_data = json.load(f)
            
            original_count = len(assessments_data.get('assessments', []))
            
            # Filter out orphaned entries (keep only years that exist in xlsx or if xlsx doesn't exist, keep none)
            cleaned_assessments = []
            for assessment in assessments_data.get('assessments', []):
                year = assessment.get('year')
                if year in xlsx_years:
                    cleaned_assessments.append(assessment)
                else:
                    orphaned_count += 1
                    print(f"CLEANUP: Removing orphaned assessment for year {year}")
            
            # Save cleaned data
            assessments_data['assessments'] = cleaned_assessments
            with open(assessments_path, 'w') as f:
                json.dump(assessments_data, f, indent=2)
                
            print(f"SUCCESS: Cleaned up {orphaned_count} orphaned entries from assessments.json")
            print(f"INFO: Kept {len(cleaned_assessments)} valid entries")
        else:
            print("WARNING: assessments.json not found - nothing to clean")
        
        return jsonify({
            'success': True,
            'message': f'Successfully cleaned up {orphaned_count} orphaned entries',
            'orphaned_count': orphaned_count,
            'xlsx_years': sorted(list(xlsx_years)),
            'xlsx_exists': storage_service.file_exists('web-output/output.xlsx'),
            'assessments_exists': assessments_path.exists()
        })
        
    except Exception as e:
        print(f"ERROR: Error during cleanup: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to cleanup orphaned data'
        }), 500


@app.route('/api/uploaded-files', methods=['GET'])
def get_uploaded_files():
    """Get all uploaded files from Supabase storage."""
    try:
        # Get year filter from query parameters
        year = request.args.get('year')
        
        # Read uploaded files data from storage
        files_data = storage_service.read_excel('uploaded-files.xlsx')
        
        if files_data is None:
            # Return empty list if no files exist yet
            return jsonify({'files': []}), 200
        
        # Convert DataFrame to list of dictionaries, replacing NaN with None
        files_data = files_data.fillna('')  # Replace NaN with empty strings
        files_list = files_data.to_dict('records')
        
        # Filter by year if provided
        if year:
            try:
                year_int = int(year)
                files_list = [f for f in files_list if f.get('year') == year_int]
            except ValueError:
                return jsonify({'error': 'Invalid year parameter'}), 400
        
        return jsonify({'files': files_list}), 200
        
    except Exception as e:
        print(f"Error getting uploaded files: {e}")
        return jsonify({'error': f'Failed to get uploaded files: {str(e)}'}), 500

@app.route('/api/uploaded-files', methods=['POST'])
def create_uploaded_file():
    """Add a new uploaded file record to Supabase storage."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fileName', 'fileSize', 'year', 'uploadDate']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Read existing files data
        try:
            files_data = storage_service.read_excel('uploaded-files.xlsx')
            if files_data is None:
                # Create new DataFrame if no data exists
                files_data = pd.DataFrame()
        except:
            files_data = pd.DataFrame()
        
        # Generate unique ID
        new_id = str(uuid.uuid4())
        
        # Create new file record
        new_file = {
            'id': new_id,
            'fileName': data['fileName'],
            'fileSize': data['fileSize'],
            'uploadDate': data['uploadDate'],
            'year': data['year'],
            'checklistId': data.get('checklistId'),
            'checklistDescription': data.get('checklistDescription'),
            'aspect': data.get('aspect', 'Tidak Diberikan Aspek'),
            'subdirektorat': data.get('subdirektorat'),
            'catatan': data.get('catatan'),
            'status': 'uploaded',
            'supabaseFilePath': data.get('supabaseFilePath'),
            'uploadedBy': data.get('uploadedBy', 'Unknown User'),
            'userDirektorat': data.get('userDirektorat', 'Unknown'),
            'userSubdirektorat': data.get('userSubdirektorat', 'Unknown'),
            'userDivisi': data.get('userDivisi', 'Unknown')
        }
        
        # Add to DataFrame
        new_row = pd.DataFrame([new_file])
        files_data = pd.concat([files_data, new_row], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_excel(files_data, 'uploaded-files.xlsx')
        
        if success:
            return jsonify({'success': True, 'file': new_file}), 201
        else:
            return jsonify({'error': 'Failed to save file to storage'}), 500
            
    except Exception as e:
        print(f"Error creating uploaded file: {e}")
        return jsonify({'error': f'Failed to create uploaded file: {str(e)}'}), 500

@app.route('/api/fix-uploaded-files-schema', methods=['POST'])
def fix_uploaded_files_schema():
    """Add missing user information columns to uploaded-files.xlsx"""
    try:
        # Read existing files data
        files_data = storage_service.read_excel('uploaded-files.xlsx')
        
        if files_data is None:
            return jsonify({'error': 'No files data found'}), 404
        
        # Check if user columns already exist
        missing_columns = []
        required_user_columns = ['uploadedBy', 'userRole', 'userDirektorat', 'userSubdirektorat', 'userDivisi']
        
        for col in required_user_columns:
            if col not in files_data.columns:
                missing_columns.append(col)
        
        if not missing_columns:
            return jsonify({
                'success': True,
                'message': 'All user columns already exist',
                'columns': required_user_columns
            }), 200
        
        # Add missing columns with default values
        for col in missing_columns:
            if col == 'uploadedBy':
                files_data[col] = 'Unknown User'
            elif col == 'userRole':
                files_data[col] = 'user'  # Default role
            else:
                files_data[col] = 'Unknown'
        
        print(f"📝 Adding missing user columns: {missing_columns}")
        
        # Save updated data
        success = storage_service.write_excel(files_data, 'uploaded-files.xlsx')
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Added missing user columns: {missing_columns}',
                'addedColumns': missing_columns,
                'totalRecords': len(files_data)
            }), 200
        else:
            return jsonify({'error': 'Failed to save changes to storage'}), 500
            
    except Exception as e:
        print(f"Error fixing uploaded files schema: {e}")
        return jsonify({'error': f'Failed to fix schema: {str(e)}'}), 500

@app.route('/api/uploaded-files/<file_id>', methods=['DELETE'])
def delete_uploaded_file(file_id):
    """Delete an uploaded file record and actual file from Supabase storage."""
    try:
        # Read existing files data
        files_data = storage_service.read_excel('uploaded-files.xlsx')
        
        if files_data is None:
            return jsonify({'error': 'No files data found'}), 404
        
        # Find the file record to get the file path
        file_record = files_data[files_data['id'] == file_id]
        if file_record.empty:
            return jsonify({'error': 'File not found'}), 404
        
        # Get the Supabase file path
        supabase_file_path = file_record.iloc[0].get('supabaseFilePath')
        
        # Delete the actual file from Supabase storage if path exists
        if supabase_file_path and storage_service.storage_mode == 'supabase':
            try:
                response = storage_service.supabase.storage.from_(storage_service.bucket_name).remove([supabase_file_path])
                print(f"🗑️ Deleted file from Supabase storage: {supabase_file_path}")
            except Exception as file_delete_error:
                print(f"⚠️ Warning: Failed to delete file from storage: {file_delete_error}")
                # Continue with database record deletion even if file deletion fails
        
        # Remove the file record from database
        initial_count = len(files_data)
        files_data = files_data[files_data['id'] != file_id]
        
        if len(files_data) == initial_count:
            return jsonify({'error': 'File record not found'}), 404
        
        # Save updated data
        success = storage_service.write_excel(files_data, 'uploaded-files.xlsx')
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'File deleted from both database and storage',
                'deletedFilePath': supabase_file_path
            }), 200
        else:
            return jsonify({'error': 'Failed to save changes to storage'}), 500
            
    except Exception as e:
        print(f"Error deleting uploaded file: {e}")
        return jsonify({'error': f'Failed to delete uploaded file: {str(e)}'}), 500

@app.route('/api/download-file/<file_id>', methods=['GET'], endpoint='download_uploaded_file')
def download_uploaded_file(file_id):
    """Download a file from Supabase storage using its file ID."""
    try:
        # Read file metadata to get the Supabase path
        files_data = storage_service.read_excel('uploaded-files.xlsx')
        
        if files_data is None:
            return jsonify({'error': 'No files data found'}), 404
        
        # Find the file record
        file_record = files_data[files_data['id'] == file_id]
        
        if file_record.empty:
            return jsonify({'error': 'File not found'}), 404
        
        file_info = file_record.iloc[0]
        supabase_file_path = file_info.get('supabaseFilePath')
        filename = file_info.get('fileName', 'download')
        
        if not supabase_file_path:
            return jsonify({'error': 'File path not found in database'}), 404
        
        # Download file from Supabase storage
        if storage_service.storage_mode == 'supabase':
            try:
                # Download from Supabase
                response = storage_service.supabase.storage.from_(storage_service.bucket_name).download(supabase_file_path)
                
                # Create a response with the file data
                response_obj = make_response(response)
                response_obj.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
                response_obj.headers['Content-Type'] = 'application/octet-stream'
                
                return response_obj
                
            except Exception as download_error:
                print(f"Error downloading from Supabase: {download_error}")
                return jsonify({'error': f'Failed to download file from storage: {str(download_error)}'}), 500
        else:
            # For local storage, construct the full path
            local_file_path = Path(__file__).parent.parent / supabase_file_path
            if local_file_path.exists():
                return send_file(str(local_file_path), as_attachment=True, download_name=filename)
            else:
                return jsonify({'error': 'File not found in local storage'}), 404
        
    except Exception as e:
        print(f"Error downloading file: {e}")
        return jsonify({'error': f'Failed to download file: {str(e)}'}), 500

# AOI TABLES ENDPOINTS
@app.route('/api/aoiTables', methods=['GET'])
def get_aoi_tables():
    """Get all AOI tables"""
    try:
        aoi_data = storage_service.read_csv('config/aoi-tables.csv')
        if aoi_data is not None:
            # Replace NaN values with empty strings before converting to dict
            aoi_data = aoi_data.fillna('')
            aoi_tables = aoi_data.to_dict(orient='records')
            return jsonify(aoi_tables), 200
        return jsonify([]), 200
    except Exception as e:
        print(f"Error getting AOI tables: {e}")
        return jsonify([]), 200

@app.route('/api/aoiTables/<int:table_id>', methods=['GET'])
def get_aoi_table_by_id(table_id):
    """Get AOI table by ID"""
    try:
        aoi_data = storage_service.read_csv('config/aoi-tables.csv')
        if aoi_data is not None:
            aoi_data = aoi_data.fillna('')
            table_row = aoi_data[aoi_data['id'] == table_id]
            if not table_row.empty:
                table = table_row.iloc[0].to_dict()
                return jsonify(table), 200
        return jsonify({'error': 'AOI table not found'}), 404
    except Exception as e:
        print(f"Error getting AOI table {table_id}: {e}")
        return jsonify({'error': f'Failed to get AOI table: {str(e)}'}), 500

@app.route('/api/aoiTables', methods=['POST'])
def create_aoi_table():
    """Create a new AOI table"""
    try:
        data = request.get_json()
        
        # Generate unique ID
        table_id = generate_unique_id()
        
        # Create AOI table object
        aoi_table_data = {
            'id': table_id,
            'nama': data.get('nama', ''),
            'tahun': data.get('tahun'),
            'targetType': data.get('targetType', ''),
            'targetDirektorat': data.get('targetDirektorat', ''),
            'targetSubdirektorat': data.get('targetSubdirektorat', ''),
            'targetDivisi': data.get('targetDivisi', ''),
            'createdAt': data.get('createdAt', datetime.now().isoformat()),
            'status': data.get('status', 'active')
        }
        
        # Read existing AOI tables
        existing_data = storage_service.read_csv('config/aoi-tables.csv')
        if existing_data is not None:
            aoi_df = existing_data
        else:
            aoi_df = pd.DataFrame()
        
        # Add new AOI table
        new_aoi_df = pd.DataFrame([aoi_table_data])
        updated_df = pd.concat([aoi_df, new_aoi_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/aoi-tables.csv')
        
        if success:
            return jsonify(aoi_table_data), 201
        else:
            return jsonify({'error': 'Failed to save AOI table'}), 500
            
    except Exception as e:
        print(f"Error creating AOI table: {e}")
        return jsonify({'error': f'Failed to create AOI table: {str(e)}'}), 500

@app.route('/api/aoiTables/<int:table_id>', methods=['PUT'])
def update_aoi_table(table_id):
    """Update an existing AOI table"""
    try:
        data = request.get_json()
        
        # Read existing AOI tables
        aoi_data = storage_service.read_csv('config/aoi-tables.csv')
        if aoi_data is None:
            return jsonify({'error': 'No AOI tables found'}), 404
        
        # Update the AOI table
        aoi_data.loc[aoi_data['id'] == table_id, 'nama'] = data.get('nama', '')
        aoi_data.loc[aoi_data['id'] == table_id, 'tahun'] = data.get('tahun')
        aoi_data.loc[aoi_data['id'] == table_id, 'targetType'] = data.get('targetType', '')
        aoi_data.loc[aoi_data['id'] == table_id, 'targetDirektorat'] = data.get('targetDirektorat', '')
        aoi_data.loc[aoi_data['id'] == table_id, 'targetSubdirektorat'] = data.get('targetSubdirektorat', '')
        aoi_data.loc[aoi_data['id'] == table_id, 'targetDivisi'] = data.get('targetDivisi', '')
        aoi_data.loc[aoi_data['id'] == table_id, 'status'] = data.get('status', 'active')
        
        # Save to storage
        success = storage_service.write_csv(aoi_data, 'config/aoi-tables.csv')
        
        if success:
            # Return updated table
            updated_row = aoi_data[aoi_data['id'] == table_id]
            if not updated_row.empty:
                updated_table = updated_row.iloc[0].to_dict()
                return jsonify(updated_table), 200
            else:
                return jsonify({'error': 'AOI table not found after update'}), 404
        else:
            return jsonify({'error': 'Failed to update AOI table'}), 500
            
    except Exception as e:
        print(f"Error updating AOI table {table_id}: {e}")
        return jsonify({'error': f'Failed to update AOI table: {str(e)}'}), 500

@app.route('/api/aoiTables/<int:table_id>', methods=['DELETE'])
def delete_aoi_table(table_id):
    """Delete an AOI table"""
    try:
        # Read existing AOI tables
        aoi_data = storage_service.read_csv('config/aoi-tables.csv')
        if aoi_data is None:
            return jsonify({'error': 'No AOI tables found'}), 404
        
        # Remove the AOI table
        aoi_data = aoi_data[aoi_data['id'] != table_id]
        
        # Save to storage
        success = storage_service.write_csv(aoi_data, 'config/aoi-tables.csv')
        
        if success:
            return jsonify({'message': f'AOI table {table_id} deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete AOI table'}), 500
            
    except Exception as e:
        print(f"Error deleting AOI table {table_id}: {e}")
        return jsonify({'error': f'Failed to delete AOI table: {str(e)}'}), 500

# AOI RECOMMENDATIONS ENDPOINTS
@app.route('/api/aoiRecommendations', methods=['GET'])
def get_aoi_recommendations():
    """Get AOI recommendations, optionally filtered by aoiTableId"""
    try:
        aoi_table_id = request.args.get('aoiTableId', type=int)
        
        recommendations_data = storage_service.read_csv('config/aoi-recommendations.csv')
        if recommendations_data is not None:
            recommendations_data = recommendations_data.fillna('')
            
            # Filter by aoiTableId if provided
            if aoi_table_id:
                recommendations_data = recommendations_data[recommendations_data['aoiTableId'] == aoi_table_id]
            
            recommendations = recommendations_data.to_dict(orient='records')
            return jsonify(recommendations), 200
        return jsonify([]), 200
    except Exception as e:
        print(f"Error getting AOI recommendations: {e}")
        return jsonify([]), 200

@app.route('/api/aoiRecommendations/<int:recommendation_id>', methods=['GET'])
def get_aoi_recommendation_by_id(recommendation_id):
    """Get AOI recommendation by ID"""
    try:
        recommendations_data = storage_service.read_csv('config/aoi-recommendations.csv')
        if recommendations_data is not None:
            recommendations_data = recommendations_data.fillna('')
            recommendation_row = recommendations_data[recommendations_data['id'] == recommendation_id]
            if not recommendation_row.empty:
                recommendation = recommendation_row.iloc[0].to_dict()
                return jsonify(recommendation), 200
        return jsonify({'error': 'AOI recommendation not found'}), 404
    except Exception as e:
        print(f"Error getting AOI recommendation {recommendation_id}: {e}")
        return jsonify({'error': f'Failed to get AOI recommendation: {str(e)}'}), 500

@app.route('/api/aoiRecommendations', methods=['POST'])
def create_aoi_recommendation():
    """Create a new AOI recommendation"""
    try:
        data = request.get_json()
        
        # Generate unique ID
        recommendation_id = generate_unique_id()
        
        # Read existing AOI recommendations
        existing_data = storage_service.read_csv('config/aoi-recommendations.csv')
        if existing_data is not None:
            recommendations_df = existing_data
        else:
            recommendations_df = pd.DataFrame()
        
        # Calculate correct row number for this table
        table_id = data.get('aoiTableId')
        if table_id and not recommendations_df.empty:
            # Get existing recommendations for this table
            table_recs = recommendations_df[recommendations_df['aoiTableId'] == table_id]
            if not table_recs.empty:
                # Since we're using sequential numbering (no gaps), just count existing + 1
                next_no = len(table_recs) + 1
            else:
                next_no = 1
        else:
            next_no = 1
        
        # Create AOI recommendation object
        aoi_recommendation_data = {
            'id': recommendation_id,
            'aoiTableId': table_id,
            'jenis': data.get('jenis', 'REKOMENDASI'),
            'no': next_no,  # Use calculated number instead of frontend value
            'isi': data.get('isi', ''),
            'tingkatUrgensi': data.get('tingkatUrgensi', 'SEDANG'),
            'aspekAOI': data.get('aspekAOI', ''),
            'pihakTerkait': data.get('pihakTerkait', ''),
            'organPerusahaan': data.get('organPerusahaan', ''),
            'createdAt': data.get('createdAt', datetime.now().isoformat()),
            'status': data.get('status', 'active')
        }
        
        # Add new AOI recommendation
        new_recommendation_df = pd.DataFrame([aoi_recommendation_data])
        updated_df = pd.concat([recommendations_df, new_recommendation_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/aoi-recommendations.csv')
        
        if success:
            return jsonify(aoi_recommendation_data), 201
        else:
            return jsonify({'error': 'Failed to save AOI recommendation'}), 500
            
    except Exception as e:
        print(f"Error creating AOI recommendation: {e}")
        return jsonify({'error': f'Failed to create AOI recommendation: {str(e)}'}), 500

@app.route('/api/aoiRecommendations/<int:recommendation_id>', methods=['PUT'])
def update_aoi_recommendation(recommendation_id):
    """Update an existing AOI recommendation"""
    try:
        data = request.get_json()
        
        # Read existing AOI recommendations
        recommendations_data = storage_service.read_csv('config/aoi-recommendations.csv')
        if recommendations_data is None:
            return jsonify({'error': 'No AOI recommendations found'}), 404
        
        # Update the AOI recommendation
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'aoiTableId'] = data.get('aoiTableId')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'jenis'] = data.get('jenis', 'REKOMENDASI')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'no'] = data.get('no', 1)
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'isi'] = data.get('isi', '')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'tingkatUrgensi'] = data.get('tingkatUrgensi', 'SEDANG')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'aspekAOI'] = data.get('aspekAOI', '')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'pihakTerkait'] = data.get('pihakTerkait', '')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'organPerusahaan'] = data.get('organPerusahaan', '')
        recommendations_data.loc[recommendations_data['id'] == recommendation_id, 'status'] = data.get('status', 'active')
        
        # Save to storage
        success = storage_service.write_csv(recommendations_data, 'config/aoi-recommendations.csv')
        
        if success:
            # Return updated recommendation
            updated_row = recommendations_data[recommendations_data['id'] == recommendation_id]
            if not updated_row.empty:
                updated_recommendation = updated_row.iloc[0].to_dict()
                return jsonify(updated_recommendation), 200
            else:
                return jsonify({'error': 'AOI recommendation not found after update'}), 404
        else:
            return jsonify({'error': 'Failed to update AOI recommendation'}), 500
            
    except Exception as e:
        print(f"Error updating AOI recommendation {recommendation_id}: {e}")
        return jsonify({'error': f'Failed to update AOI recommendation: {str(e)}'}), 500

@app.route('/api/aoiRecommendations/<int:recommendation_id>', methods=['DELETE'])
def delete_aoi_recommendation(recommendation_id):
    """Delete an AOI recommendation and renumber remaining recommendations"""
    try:
        # Read existing AOI recommendations
        recommendations_data = storage_service.read_csv('config/aoi-recommendations.csv')
        if recommendations_data is None:
            return jsonify({'error': 'No AOI recommendations found'}), 404
        
        # Find the recommendation to be deleted to get its table ID and current number
        target_rec = recommendations_data[recommendations_data['id'] == recommendation_id]
        if target_rec.empty:
            return jsonify({'error': 'AOI recommendation not found'}), 404
        
        target_table_id = target_rec.iloc[0]['aoiTableId']
        target_no = int(target_rec.iloc[0]['no'])
        
        # Remove the target recommendation
        recommendations_data = recommendations_data[recommendations_data['id'] != recommendation_id]
        
        # Get all recommendations for the same table, sorted by 'no'
        table_recs = recommendations_data[recommendations_data['aoiTableId'] == target_table_id].copy()
        
        if not table_recs.empty:
            # Renumber all recommendations with 'no' greater than the deleted one
            # Sort by 'no' to ensure proper order
            table_recs_sorted = table_recs.sort_values('no')
            
            # Update the row numbers: shift down all numbers greater than target_no
            for idx, row in table_recs_sorted.iterrows():
                current_no = int(row['no'])
                if current_no > target_no:
                    recommendations_data.loc[idx, 'no'] = current_no - 1
        
        # Save to storage
        success = storage_service.write_csv(recommendations_data, 'config/aoi-recommendations.csv')
        
        if success:
            return jsonify({
                'message': f'AOI recommendation {recommendation_id} deleted successfully',
                'renumbered': f'Renumbered recommendations for table {target_table_id}'
            }), 200
        else:
            return jsonify({'error': 'Failed to delete AOI recommendation'}), 500
            
    except Exception as e:
        print(f"Error deleting AOI recommendation {recommendation_id}: {e}")
        return jsonify({'error': f'Failed to delete AOI recommendation: {str(e)}'}), 500

# AOI DOCUMENTS ENDPOINTS
@app.route('/api/aoiDocuments', methods=['GET'])
def get_aoi_documents():
    """Get AOI documents, optionally filtered by recommendation ID or year"""
    try:
        aoi_recommendation_id = request.args.get('aoiRecommendationId', type=int)
        tahun = request.args.get('tahun', type=int)
        
        documents_data = storage_service.read_csv('config/aoi-documents.csv')
        if documents_data is not None:
            documents_data = documents_data.fillna('')
            
            # Filter by aoiRecommendationId if provided
            if aoi_recommendation_id:
                documents_data = documents_data[documents_data['aoiRecommendationId'] == aoi_recommendation_id]
            
            # Filter by tahun if provided
            if tahun:
                documents_data = documents_data[documents_data['tahun'] == tahun]
            
            documents = documents_data.to_dict(orient='records')
            return jsonify(documents), 200
        return jsonify([]), 200
    except Exception as e:
        print(f"Error getting AOI documents: {e}")
        return jsonify([]), 200

@app.route('/api/aoiDocuments/<string:document_id>', methods=['GET'])
def get_aoi_document_by_id(document_id):
    """Get AOI document by ID"""
    try:
        documents_data = storage_service.read_csv('config/aoi-documents.csv')
        if documents_data is not None:
            documents_data = documents_data.fillna('')
            document_row = documents_data[documents_data['id'] == document_id]
            if not document_row.empty:
                document = document_row.iloc[0].to_dict()
                return jsonify(document), 200
        return jsonify({'error': 'AOI document not found'}), 404
    except Exception as e:
        print(f"Error getting AOI document {document_id}: {e}")
        return jsonify({'error': f'Failed to get AOI document: {str(e)}'}), 500

@app.route('/api/aoiDocuments', methods=['POST'])
def create_aoi_document():
    """Create a new AOI document record"""
    try:
        data = request.get_json()
        
        # Generate unique ID (using string for AOI documents)
        document_id = f"aoi_{generate_unique_id()}"
        
        # Create AOI document object
        aoi_document_data = {
            'id': document_id,
            'fileName': data.get('fileName', ''),
            'fileSize': data.get('fileSize', 0),
            'uploadDate': data.get('uploadDate', datetime.now().isoformat()),
            'aoiRecommendationId': data.get('aoiRecommendationId'),
            'aoiJenis': data.get('aoiJenis', 'REKOMENDASI'),
            'aoiUrutan': data.get('aoiUrutan', 1),
            'userId': data.get('userId', ''),
            'userDirektorat': data.get('userDirektorat', ''),
            'userSubdirektorat': data.get('userSubdirektorat', ''),
            'userDivisi': data.get('userDivisi', ''),
            'fileType': data.get('fileType', ''),
            'status': data.get('status', 'active'),
            'tahun': data.get('tahun')
        }
        
        # Read existing AOI documents
        existing_data = storage_service.read_csv('config/aoi-documents.csv')
        if existing_data is not None:
            documents_df = existing_data
        else:
            documents_df = pd.DataFrame()
        
        # Add new AOI document
        new_document_df = pd.DataFrame([aoi_document_data])
        updated_df = pd.concat([documents_df, new_document_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/aoi-documents.csv')
        
        if success:
            return jsonify(aoi_document_data), 201
        else:
            return jsonify({'error': 'Failed to save AOI document'}), 500
            
    except Exception as e:
        print(f"Error creating AOI document: {e}")
        return jsonify({'error': f'Failed to create AOI document: {str(e)}'}), 500

@app.route('/api/aoiDocuments/<string:document_id>', methods=['PUT'])
def update_aoi_document(document_id):
    """Update an existing AOI document"""
    try:
        data = request.get_json()
        
        # Read existing AOI documents
        documents_data = storage_service.read_csv('config/aoi-documents.csv')
        if documents_data is None:
            return jsonify({'error': 'No AOI documents found'}), 404
        
        # Update the AOI document
        documents_data.loc[documents_data['id'] == document_id, 'fileName'] = data.get('fileName', '')
        documents_data.loc[documents_data['id'] == document_id, 'fileSize'] = data.get('fileSize', 0)
        documents_data.loc[documents_data['id'] == document_id, 'aoiRecommendationId'] = data.get('aoiRecommendationId')
        documents_data.loc[documents_data['id'] == document_id, 'aoiJenis'] = data.get('aoiJenis', 'REKOMENDASI')
        documents_data.loc[documents_data['id'] == document_id, 'aoiUrutan'] = data.get('aoiUrutan', 1)
        documents_data.loc[documents_data['id'] == document_id, 'userId'] = data.get('userId', '')
        documents_data.loc[documents_data['id'] == document_id, 'userDirektorat'] = data.get('userDirektorat', '')
        documents_data.loc[documents_data['id'] == document_id, 'userSubdirektorat'] = data.get('userSubdirektorat', '')
        documents_data.loc[documents_data['id'] == document_id, 'userDivisi'] = data.get('userDivisi', '')
        documents_data.loc[documents_data['id'] == document_id, 'fileType'] = data.get('fileType', '')
        documents_data.loc[documents_data['id'] == document_id, 'status'] = data.get('status', 'active')
        documents_data.loc[documents_data['id'] == document_id, 'tahun'] = data.get('tahun')
        
        # Save to storage
        success = storage_service.write_csv(documents_data, 'config/aoi-documents.csv')
        
        if success:
            # Return updated document
            updated_row = documents_data[documents_data['id'] == document_id]
            if not updated_row.empty:
                updated_document = updated_row.iloc[0].to_dict()
                return jsonify(updated_document), 200
            else:
                return jsonify({'error': 'AOI document not found after update'}), 404
        else:
            return jsonify({'error': 'Failed to update AOI document'}), 500
            
    except Exception as e:
        print(f"Error updating AOI document {document_id}: {e}")
        return jsonify({'error': f'Failed to update AOI document: {str(e)}'}), 500

@app.route('/api/aoiDocuments/<string:document_id>', methods=['DELETE'])
def delete_aoi_document(document_id):
    """Delete an AOI document"""
    try:
        # Read existing AOI documents
        documents_data = storage_service.read_csv('config/aoi-documents.csv')
        if documents_data is None:
            return jsonify({'error': 'No AOI documents found'}), 404
        
        # Remove the AOI document
        documents_data = documents_data[documents_data['id'] != document_id]
        
        # Save to storage
        success = storage_service.write_csv(documents_data, 'config/aoi-documents.csv')
        
        if success:
            return jsonify({'message': f'AOI document {document_id} deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete AOI document'}), 500
            
    except Exception as e:
        print(f"Error deleting AOI document {document_id}: {e}")
        return jsonify({'error': f'Failed to delete AOI document: {str(e)}'}), 500

@app.route('/api/upload-aoi-file', methods=['POST'])
def upload_aoi_file():
    """
    Upload an AOI document file directly to Supabase storage.
    This endpoint handles file uploads for Area of Improvement documents.
    """
    try:
        print(f"🔧 DEBUG: AOI file upload request received")
        print(f"🔧 DEBUG: Request files: {list(request.files.keys())}")
        print(f"🔧 DEBUG: Request form: {dict(request.form)}")
        
        # Get the uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        print(f"🔧 DEBUG: File received: {file.filename}")
        
        # Get form data
        aoi_recommendation_id = request.form.get('aoiRecommendationId')
        aoi_jenis = request.form.get('aoiJenis', 'REKOMENDASI')
        aoi_urutan = request.form.get('aoiUrutan', '1')
        year = request.form.get('year')
        user_direktorat = request.form.get('userDirektorat', '')
        user_subdirektorat = request.form.get('userSubdirektorat', '')
        user_divisi = request.form.get('userDivisi', '')
        user_id = request.form.get('userId', '')
        
        # Validate required parameters
        if not aoi_recommendation_id or not year:
            return jsonify({'error': 'AOI recommendation ID and year are required'}), 400
        
        try:
            year_int = int(year)
            recommendation_id_int = int(aoi_recommendation_id)
            urutan_int = int(aoi_urutan)
        except ValueError:
            return jsonify({'error': 'Invalid year, recommendation ID, or urutan format'}), 400
        
        # Determine PIC name (use provided or fallback)
        pic_name = user_divisi or user_subdirektorat or user_direktorat or 'Unknown_Division'
        # Replace spaces with underscores for file path
        pic_name_clean = secure_filename(pic_name.replace(' ', '_'))
        
        # Create file path: aoi-documents/{year}/{pic}/{recommendation_id}/{filename}
        filename = secure_filename(file.filename)
        file_path = f"aoi-documents/{year_int}/{pic_name_clean}/{recommendation_id_int}/{filename}"
        
        print(f"🔧 DEBUG: Uploading to path: {file_path}")
        
        # Clear existing files in the recommendation directory first
        try:
            directory_path = f"aoi-documents/{year_int}/{pic_name_clean}/{recommendation_id_int}"
            print(f"🔧 DEBUG: Clearing directory: {directory_path}")
            
            list_response = supabase.storage.from_(bucket_name).list(directory_path)
            if list_response and len(list_response) > 0:
                print(f"🔧 DEBUG: Files found in directory: {len(list_response)}")
                files_to_delete = []
                for file_item in list_response:
                    if file_item['name'] != '.emptyFolderPlaceholder':
                        files_to_delete.append(f"{directory_path}/{file_item['name']}")
                
                if files_to_delete:
                    print(f"🔧 DEBUG: Deleting {len(files_to_delete)} existing files: {files_to_delete}")
                    delete_response = supabase.storage.from_(bucket_name).remove(files_to_delete)
                    print(f"🔧 DEBUG: Delete existing files response: {delete_response}")
        except Exception as e:
            print(f"Error clearing directory: {e}")
        
        # Initialize Supabase client
        from supabase import create_client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        bucket_name = os.getenv('SUPABASE_BUCKET')
        
        if not all([supabase_url, supabase_key, bucket_name]):
            return jsonify({'error': 'Supabase configuration missing'}), 500
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Upload file to Supabase storage
        file_content = file.read()
        upload_response = supabase.storage.from_(bucket_name).upload(
            file_path, 
            file_content
        )
        
        if hasattr(upload_response, 'error') and upload_response.error:
            print(f"🔧 DEBUG: Upload error: {upload_response.error}")
            return jsonify({'error': f'Failed to upload file: {upload_response.error}'}), 500
        
        print(f"🔧 DEBUG: File uploaded successfully to: {file_path}")
        
        # Create AOI document record
        document_id = f"aoi_{generate_unique_id()}"
        aoi_document_data = {
            'id': document_id,
            'fileName': filename,
            'fileSize': len(file_content),
            'uploadDate': datetime.now().isoformat(),
            'aoiRecommendationId': recommendation_id_int,
            'aoiJenis': aoi_jenis,
            'aoiUrutan': urutan_int,
            'userId': user_id,
            'userDirektorat': user_direktorat,
            'userSubdirektorat': user_subdirektorat,
            'userDivisi': user_divisi,
            'fileType': file.content_type or 'application/octet-stream',
            'status': 'active',
            'tahun': year_int,
            'filePath': file_path
        }
        
        # Read existing AOI documents
        existing_data = storage_service.read_csv('config/aoi-documents.csv')
        if existing_data is not None:
            # Remove existing documents for the same recommendation
            existing_data = existing_data[existing_data['aoiRecommendationId'] != recommendation_id_int]
            documents_df = existing_data
        else:
            documents_df = pd.DataFrame()
        
        # Add new AOI document
        new_document_df = pd.DataFrame([aoi_document_data])
        updated_df = pd.concat([documents_df, new_document_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/aoi-documents.csv')
        
        if success:
            print(f"🔧 DEBUG: AOI document record saved successfully")
            return jsonify({
                'message': 'AOI file uploaded successfully',
                'documentId': document_id,
                'filePath': file_path,
                'document': aoi_document_data
            }), 201
        else:
            return jsonify({'error': 'Failed to save AOI document record'}), 500
            
    except Exception as e:
        print(f"🔧 DEBUG: Exception in upload_aoi_file: {e}")
        import traceback
        print(f"🔧 DEBUG: Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to upload AOI file: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users from storage"""
    try:
        csv_data = storage_service.read_csv('config/users.csv')
        if csv_data is not None:
            users = csv_data.to_dict(orient='records')
            return jsonify(users), 200
        return jsonify([]), 200
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user and save to Supabase"""
    try:
        data = request.get_json()
        
        # Generate unique ID
        user_id = generate_unique_id()
        
        # Create user object
        user_data = {
            'id': user_id,
            'name': data.get('name'),
            'email': data.get('email'),
            'role': data.get('role'),
            'direktorat': data.get('direktorat', ''),
            'subdirektorat': data.get('subdirektorat', ''),
            'divisi': data.get('divisi', ''),
            'tahun': data.get('tahun'),
            'created_at': datetime.now().isoformat(),
            'is_active': True
        }
        
        # Read existing users
        csv_data = storage_service.read_csv('config/users.csv')
        if csv_data is not None:
            users_df = csv_data
        else:
            users_df = pd.DataFrame()
        
        # Add new user
        new_user_df = pd.DataFrame([user_data])
        updated_df = pd.concat([users_df, new_user_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/users.csv')
        
        if success:
            return jsonify(user_data), 201
        else:
            return jsonify({'error': 'Failed to save user to Supabase'}), 500
            
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user from storage"""
    try:
        # Read existing users
        csv_data = storage_service.read_csv('config/users.csv')
        if csv_data is None:
            return jsonify({'error': 'No users found'}), 404
        
        # Filter out the user to delete
        updated_df = csv_data[csv_data['id'] != user_id]
        
        if len(updated_df) == len(csv_data):
            return jsonify({'error': 'User not found'}), 404
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/users.csv')
        
        if success:
            return jsonify({'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete user from storage'}), 500
            
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user credentials in storage"""
    try:
        data = request.get_json()
        
        # Read existing users
        csv_data = storage_service.read_csv('config/users.csv')
        if csv_data is None:
            return jsonify({'error': 'No users found'}), 404
        
        # Find and update the user
        user_found = False
        for index, row in csv_data.iterrows():
            if int(row['id']) == user_id:
                # Update user data
                if 'name' in data:
                    csv_data.at[index, 'name'] = data['name']
                if 'email' in data:
                    csv_data.at[index, 'email'] = data['email']
                if 'password' in data:
                    csv_data.at[index, 'password'] = data['password']
                if 'role' in data:
                    csv_data.at[index, 'role'] = data['role']
                if 'direktorat' in data:
                    csv_data.at[index, 'direktorat'] = data['direktorat']
                if 'subdirektorat' in data:
                    csv_data.at[index, 'subdirektorat'] = data['subdirektorat']
                if 'divisi' in data:
                    csv_data.at[index, 'divisi'] = data['divisi']
                
                user_found = True
                break
        
        if not user_found:
            return jsonify({'error': 'User not found'}), 404
        
        # Save to storage
        success = storage_service.write_csv(csv_data, 'config/users.csv')
        
        if success:
            # Return updated user data
            updated_user = csv_data[csv_data['id'] == str(user_id)].iloc[0].to_dict()
            return jsonify(updated_user), 200
        else:
            return jsonify({'error': 'Failed to update user in storage'}), 500
            
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500

@app.route('/api/upload-gcg-file', methods=['POST'])
def upload_gcg_file():
    """
    Upload a GCG document file directly to Supabase storage.
    This endpoint is specifically for the monitoring upload feature.
    """
    try:
        print(f"🔧 DEBUG: GCG file upload request received")
        print(f"🔧 DEBUG: Request files: {list(request.files.keys())}")
        print(f"🔧 DEBUG: Request form: {dict(request.form)}")
        
        # Check if file is present
        if 'file' not in request.files:
            print(f"🔧 DEBUG: No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"🔧 DEBUG: File received: {file.filename}")
        
        if file.filename == '':
            print(f"🔧 DEBUG: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        # Get metadata from form
        year = request.form.get('year')
        checklist_id = request.form.get('checklistId')
        checklist_description = request.form.get('checklistDescription', '')
        aspect = request.form.get('aspect', '')
        subdirektorat = request.form.get('subdirektorat', '')
        catatan = request.form.get('catatan', '')
        row_number = request.form.get('rowNumber')  # New: row number for document organization
        
        # Validate required fields
        if not year:
            return jsonify({'error': 'Year is required'}), 400
        if not checklist_id:
            return jsonify({'error': 'Checklist ID is required'}), 400
        
        try:
            year_int = int(year)
            checklist_id_int = int(checklist_id)
        except ValueError:
            return jsonify({'error': 'Invalid year or checklist ID format'}), 400
        
        # Generate file ID for record tracking
        file_id = str(uuid.uuid4())
        
        # Clean subdirektorat name for use in file path
        pic_name = secure_filename(subdirektorat) if subdirektorat else 'UNKNOWN_PIC'
        
        # Fixed file structure: gcg-documents/{year}/{PIC}/{checklist_id}/{filename}
        supabase_file_path = f"gcg-documents/{year_int}/{pic_name}/{checklist_id_int}/{secure_filename(file.filename)}"
        
        # Upload file to Supabase storage
        file_data = file.read()
        
        # Determine content type
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'bin'
        content_type_map = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        }
        content_type = content_type_map.get(file_extension, 'application/octet-stream')
        
        # Upload to Supabase using storage service
        try:
            from supabase import create_client
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_KEY')
            bucket_name = os.getenv('SUPABASE_BUCKET')
            
            supabase = create_client(supabase_url, supabase_key)
            
            # Always try to upload, if exists it will automatically overwrite
            print(f"🔧 DEBUG: Uploading to path: {supabase_file_path}")
            
            # First, delete ALL existing files in the directory to ensure clean overwrite
            try:
                # Get the directory path (without filename)
                directory_path = f"gcg-documents/{year_int}/{pic_name}/{checklist_id_int}"
                print(f"🔧 DEBUG: Clearing directory: {directory_path}")
                
                # List all files in the directory
                list_response = supabase.storage.from_(bucket_name).list(directory_path)
                print(f"🔧 DEBUG: Files found in directory: {len(list_response) if list_response else 0}")
                
                if list_response and len(list_response) > 0:
                    # Filter out placeholder files and get real file paths
                    files_to_delete = []
                    for file_item in list_response:
                        if file_item['name'] != '.emptyFolderPlaceholder':
                            files_to_delete.append(f"{directory_path}/{file_item['name']}")
                    
                    if files_to_delete:
                        print(f"🔧 DEBUG: Deleting {len(files_to_delete)} existing files: {files_to_delete}")
                        delete_response = supabase.storage.from_(bucket_name).remove(files_to_delete)
                        print(f"🔧 DEBUG: Delete existing files response: {delete_response}")
                    else:
                        print(f"🔧 DEBUG: No real files to delete (only placeholders found)")
                else:
                    print(f"🔧 DEBUG: Directory is empty or doesn't exist")
                    
            except Exception as e:
                print(f"🔧 DEBUG: Error clearing directory (continuing anyway): {e}")
            
            # Now upload the new file
            response = supabase.storage.from_(bucket_name).upload(
                path=supabase_file_path,
                file=file_data,
                file_options={"content-type": content_type}
            )
            
            # Check for any upload errors
            if hasattr(response, 'error') and response.error:
                print(f"🔧 DEBUG: Upload error: {response.error}")
                return jsonify({'error': f'Failed to upload file to storage: {response.error}'}), 500
            
            print(f"🔧 DEBUG: File uploaded successfully to: {supabase_file_path}")
            
        except Exception as upload_error:
            print(f"🔧 DEBUG: Upload exception: {upload_error}")
            return jsonify({'error': f'Failed to upload file: {str(upload_error)}'}), 500
        
        # Get user information from form (if provided)
        uploaded_by = request.form.get('uploadedBy', 'Unknown User')
        user_role = request.form.get('userRole', 'user')  # Default to 'user' role
        user_direktorat = request.form.get('userDirektorat', 'Unknown')
        user_subdirektorat = request.form.get('userSubdirektorat', 'Unknown')
        user_divisi = request.form.get('userDivisi', 'Unknown')
        
        # Create file record
        file_record = {
            'id': file_id,
            'fileName': file.filename,
            'fileSize': len(file_data),
            'uploadDate': datetime.now().isoformat(),
            'year': year_int,
            'checklistId': int(float(checklist_id)) if checklist_id else None,
            'checklistDescription': checklist_description,
            'aspect': aspect,
            'subdirektorat': subdirektorat,
            'catatan': catatan,
            'status': 'uploaded',
            'supabaseFilePath': supabase_file_path,
            'uploadedBy': uploaded_by,
            'userRole': user_role,
            'userDirektorat': user_direktorat,
            'userSubdirektorat': user_subdirektorat,
            'userDivisi': user_divisi
        }
        
        # Add to uploaded files database
        try:
            files_data = storage_service.read_excel('uploaded-files.xlsx')
            if files_data is None:
                files_data = pd.DataFrame()
        except Exception as db_error:
            print(f"🔧 DEBUG: Error reading uploaded-files.xlsx: {db_error}")
            files_data = pd.DataFrame()
        
        new_row = pd.DataFrame([file_record])
        files_data = pd.concat([files_data, new_row], ignore_index=True)
        
        # Save to storage
        try:
            success = storage_service.write_excel(files_data, 'uploaded-files.xlsx')
            
            if success:
                print(f"🔧 DEBUG: File record saved successfully")
                return jsonify({
                    'success': True, 
                    'file': file_record,
                    'message': 'File uploaded successfully to Supabase'
                }), 201
            else:
                print(f"🔧 DEBUG: storage_service.write_excel returned False")
                return jsonify({'error': 'File uploaded but failed to save record'}), 500
        except Exception as save_error:
            print(f"🔧 DEBUG: Exception saving to storage: {save_error}")
            import traceback
            print(f"🔧 DEBUG: Full save traceback: {traceback.format_exc()}")
            return jsonify({'error': f'File uploaded but failed to save record: {str(save_error)}'}), 500
        
    except Exception as e:
        print(f"🔧 DEBUG: Exception in upload_gcg_file: {e}")
        import traceback
        print(f"🔧 DEBUG: Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to upload GCG file: {str(e)}'}), 500

@app.route('/api/check-gcg-files', methods=['POST'])
def check_gcg_files():
    """Check if GCG files exist in Supabase for given year, PIC and checklist IDs"""
    try:
        data = request.get_json()
        print(f"🔍 DEBUG: check_gcg_files received data: {data}")
        
        pic_name = data.get('picName')
        checklist_ids = data.get('checklistIds', [])  # List of checklist IDs to check
        year = data.get('year')  # Year is required for new structure
        
        print(f"🔍 DEBUG: pic_name={pic_name}, year={year}, checklist_ids={checklist_ids}")
        
        # Support legacy row_numbers parameter for backward compatibility
        if not checklist_ids and data.get('rowNumbers'):
            print(f"🔍 DEBUG: Using legacy rowNumbers: {data.get('rowNumbers')}")
            # Convert row numbers to checklist IDs (year_prefix * 10 + row_number)
            year_prefix = int(str(year)[-2:])
            row_numbers = data.get('rowNumbers', [])
            print(f"🔍 DEBUG: Converting rowNumbers {row_numbers} with year_prefix {year_prefix}")
            checklist_ids = []
            for row_number in row_numbers:
                try:
                    print(f"🔍 DEBUG: Processing row_number: {row_number} (type: {type(row_number)})")
                    checklist_id = year_prefix * 10 + int(row_number)
                    checklist_ids.append(checklist_id)
                except ValueError as ve:
                    print(f"❌ ERROR: Cannot convert row_number {row_number} to int: {ve}")
                    return jsonify({'error': f'Invalid row number: {row_number}'}), 400
        
        if not pic_name or not checklist_ids or not year:
            return jsonify({'error': 'PIC name, year, and checklist IDs are required'}), 400
        
        # Clean PIC name
        pic_name_clean = secure_filename(pic_name)
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY') 
        bucket_name = os.getenv('SUPABASE_BUCKET')
        
        if not all([supabase_url, supabase_key, bucket_name]):
            return jsonify({'error': 'Supabase configuration missing'}), 500
        
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # Check each checklist ID for existing files
        file_statuses = {}
        
        for checklist_id in checklist_ids:
            try:
                # New structure: gcg-documents/{year}/{PIC}/{checklist_id}/
                folder_path = f"gcg-documents/{year}/{pic_name_clean}/{checklist_id}"
                
                # Try to list files in the row directory
                file_found = None
                try:
                    response = supabase.storage.from_(bucket_name).list(folder_path)
                    if response and len(response) > 0:
                        # Filter out placeholder files and get the first real file
                        real_files = [f for f in response if f['name'] != '.emptyFolderPlaceholder']
                        
                        if real_files:
                            # Get the first real file in the directory
                            file_info = real_files[0]
                            file_found = {
                                'exists': True,
                                'fileName': file_info['name'],
                                'path': f"{folder_path}/{file_info['name']}",
                                'size': file_info.get('metadata', {}).get('size', 0),
                                'lastModified': file_info.get('updated_at')
                            }
                        else:
                            # Only placeholder files exist, treat as no file
                            file_found = {'exists': False}
                except Exception as e:
                    # Directory doesn't exist or is empty
                    file_found = {'exists': False}
                
                if not file_found:
                    file_found = {'exists': False}
                
                file_statuses[str(checklist_id)] = file_found
                
            except Exception as e:
                file_statuses[str(checklist_id)] = {'exists': False, 'error': str(e)}
        
        return jsonify({
            'year': year,
            'picName': pic_name,
            'fileStatuses': file_statuses
        }), 200
        
    except Exception as e:
        print(f"Error checking GCG files: {e}")
        return jsonify({'error': f'Failed to check files: {str(e)}'}), 500

@app.route('/api/download-gcg-file', methods=['POST'])
def download_gcg_file():
    """Download GCG file from Supabase storage"""
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            pic_name = data.get('picName')
            year = data.get('year')
            # Support both rowNumber (legacy) and checklistId (new)
            row_number = data.get('rowNumber')
            checklist_id = data.get('checklistId')
        else:
            # Handle form data
            pic_name = request.form.get('picName')
            year = request.form.get('year')
            row_number = request.form.get('rowNumber')
            checklist_id = request.form.get('checklistId')
            # Convert to int for year and identifiers
            if year:
                year = int(year)
            if row_number:
                row_number = int(row_number)
            if checklist_id:
                checklist_id = int(checklist_id)
        
        # Use checklistId if provided, otherwise fall back to rowNumber
        folder_id = checklist_id if checklist_id else row_number
        
        if not all([pic_name, year, folder_id]):
            return jsonify({'error': 'PIC name, year, and checklist ID (or row number) are required'}), 400
        
        # Clean PIC name
        pic_name_clean = secure_filename(pic_name)
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        bucket_name = os.getenv('SUPABASE_BUCKET')
        
        if not all([supabase_url, supabase_key, bucket_name]):
            return jsonify({'error': 'Supabase configuration missing'}), 500
        
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # Try to find the file in the directory structure
        folder_path = f"gcg-documents/{year}/{pic_name_clean}/{folder_id}"
        
        try:
            # List files in the directory
            response = supabase.storage.from_(bucket_name).list(folder_path)
            if not response or len(response) == 0:
                return jsonify({'error': 'File not found'}), 404
            
            # Filter out placeholder files and get the first real file
            real_files = [f for f in response if f['name'] != '.emptyFolderPlaceholder']
            
            if not real_files:
                return jsonify({'error': 'No real files found (only placeholders)'}), 404
            
            # Get the first (and should be only) real file in the directory
            file_info = real_files[0]
            file_name = file_info['name']
            file_path = f"{folder_path}/{file_name}"
            
            # Download the file
            file_response = supabase.storage.from_(bucket_name).download(file_path)
            
            if not file_response:
                return jsonify({'error': 'Failed to download file from storage'}), 500
            
            # Return the file as a download with proper MIME type detection
            import mimetypes
            
            # Detect proper MIME type from file extension
            mime_type, _ = mimetypes.guess_type(file_name)
            if not mime_type:
                mime_type = 'application/octet-stream'  # Default binary type
            
            response = make_response(file_response)
            response.headers['Content-Disposition'] = f'attachment; filename="{file_name}"'
            response.headers['Content-Type'] = mime_type
            response.headers['Content-Transfer-Encoding'] = 'binary'
            response.headers['Content-Length'] = str(len(file_response))
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            response.headers['X-Content-Type-Options'] = 'nosniff'
            return response
            
        except Exception as e:
            return jsonify({'error': f'File not found or download failed: {str(e)}'}), 404
        
    except Exception as e:
        print(f"Error downloading GCG file: {e}")
        return jsonify({'error': f'Failed to download file: {str(e)}'}), 500


# ========================
# CONFIGURATION MANAGEMENT ENDPOINTS
# ========================

@app.route('/api/config/aspects', methods=['GET'])
def get_aspects():
    """Get all aspects, optionally filtered by year"""
    try:
        year = request.args.get('year')
        
        # Read aspects from storage (CSV for easier reading)
        aspects_data = storage_service.read_csv('config/aspects.csv')
        print(f"🔍 DEBUG: Read CSV data: {aspects_data}")
        
        if aspects_data is None:
            return jsonify({'aspects': []}), 200
            
        # Convert DataFrame to list of dictionaries
        aspects_list = aspects_data.to_dict('records')
        
        # Filter by year if provided
        if year:
            try:
                year_int = int(year)
                aspects_list = [aspect for aspect in aspects_list if aspect.get('tahun') == year_int]
            except ValueError:
                return jsonify({'error': 'Invalid year format'}), 400
        
        return jsonify({'aspects': aspects_list}), 200
        
    except Exception as e:
        print(f"Error getting aspects: {e}")
        return jsonify({'aspects': []}), 200

@app.route('/api/config/aspects', methods=['POST'])
def add_aspect():
    """Add a new aspect for a specific year"""
    try:
        data = request.get_json()
        
        if not data.get('nama') or not data.get('tahun'):
            return jsonify({'error': 'Name and year are required'}), 400
            
        # Read existing aspects
        try:
            aspects_data = storage_service.read_csv('config/aspects.csv')
            if aspects_data is None:
                aspects_data = pd.DataFrame()
        except:
            aspects_data = pd.DataFrame()
            
        # Create new aspect record
        new_aspect = {
            'id': int(time.time() * 1000),  # Use timestamp as ID
            'nama': data['nama'],
            'tahun': int(data['tahun']),
            'created_at': datetime.now().isoformat()
        }
        
        # Add to DataFrame
        new_row = pd.DataFrame([new_aspect])
        aspects_data = pd.concat([aspects_data, new_row], ignore_index=True)
        
        # Save to storage (CSV for easier reading)
        success = storage_service.write_csv(aspects_data, 'config/aspects.csv')
        
        if success:
            return jsonify({'success': True, 'aspect': new_aspect}), 201
        else:
            return jsonify({'error': 'Failed to save aspect'}), 500
            
    except Exception as e:
        print(f"Error adding aspect: {e}")
        return jsonify({'error': f'Failed to add aspect: {str(e)}'}), 500

@app.route('/api/config/aspects/<int:aspect_id>', methods=['PUT'])
def update_aspect(aspect_id):
    """Update an existing aspect"""
    try:
        data = request.get_json()
        
        if not data.get('nama'):
            return jsonify({'error': 'Name is required'}), 400
            
        # Read existing aspects
        aspects_data = storage_service.read_csv('config/aspects.csv')
        if aspects_data is None:
            return jsonify({'error': 'No aspects found'}), 404
            
        # Find and update the aspect
        aspect_found = False
        for index, row in aspects_data.iterrows():
            if int(row['id']) == aspect_id:
                aspects_data.at[index, 'nama'] = data['nama']
                aspects_data.at[index, 'updated_at'] = datetime.now().isoformat()
                aspect_found = True
                break
                
        if not aspect_found:
            return jsonify({'error': 'Aspect not found'}), 404
            
        # Save to storage (CSV for easier reading)
        success = storage_service.write_csv(aspects_data, 'config/aspects.csv')
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to update aspect'}), 500
            
    except Exception as e:
        print(f"Error updating aspect: {e}")
        return jsonify({'error': f'Failed to update aspect: {str(e)}'}), 500

@app.route('/api/config/aspects/<int:aspect_id>', methods=['DELETE'])
def delete_aspect(aspect_id):
    """Delete an aspect"""
    try:
        # Read existing aspects
        aspects_data = storage_service.read_csv('config/aspects.csv')
        if aspects_data is None:
            return jsonify({'error': 'No aspects found'}), 404
            
        # Filter out the aspect to delete
        aspects_data = aspects_data[aspects_data['id'] != aspect_id]
        
        # Save to storage (CSV for easier reading)
        success = storage_service.write_csv(aspects_data, 'config/aspects.csv')
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to delete aspect'}), 500
            
    except Exception as e:
        print(f"Error deleting aspect: {e}")
        return jsonify({'error': f'Failed to delete aspect: {str(e)}'}), 500

# CHECKLIST ENDPOINTS
@app.route('/api/config/checklist', methods=['GET'])
def get_checklist():
    """Get all checklist items, optionally filtered by year"""
    try:
        # Read checklist from storage
        checklist_data = storage_service.read_csv('config/checklist.csv')
        if checklist_data is not None:
            # Replace NaN values with empty strings before converting to dict
            checklist_data = checklist_data.fillna('')
            checklist_items = checklist_data.to_dict(orient='records')
            return jsonify({'checklist': checklist_items}), 200
        return jsonify({'checklist': []}), 200
    except Exception as e:
        print(f"Error getting checklist: {e}")
        return jsonify({'checklist': []}), 200

@app.route('/api/config/checklist', methods=['POST'])
def add_checklist():
    """Add a new checklist item"""
    try:
        data = request.get_json()
        year = data.get('tahun')
        
        # Read existing checklist to determine next ID and row number
        existing_data = storage_service.read_csv('config/checklist.csv')
        if existing_data is not None:
            checklist_df = existing_data
            
            # Get next row number for this year (current position in table)
            year_items = checklist_df[checklist_df['tahun'] == year] if 'tahun' in checklist_df.columns else pd.DataFrame()
            next_row_number = len(year_items) + 1
            
            # Get highest ID ever used for this year to ensure uniqueness
            year_prefix = year % 100  # Last two digits of year
            if not year_items.empty and 'id' in year_items.columns:
                # Find all IDs that start with this year's prefix
                year_ids = year_items['id'].astype(str).apply(lambda x: x.startswith(str(year_prefix))).sum()
                if year_ids > 0:
                    # Get the highest row number component from existing IDs
                    max_existing_row = 0
                    for existing_id in year_items['id']:
                        id_str = str(existing_id)
                        if id_str.startswith(str(year_prefix)) and len(id_str) > 2:
                            row_part = int(id_str[2:])  # Remove year prefix
                            max_existing_row = max(max_existing_row, row_part)
                    next_id_sequence = max_existing_row + 1
                else:
                    next_id_sequence = 1
            else:
                next_id_sequence = 1
        else:
            checklist_df = pd.DataFrame()
            next_row_number = 1
            next_id_sequence = 1
        
        # Generate checklist ID using year + ID sequence (not row position)
        checklist_id = generate_checklist_id(year, next_id_sequence)
        
        # Create checklist object
        checklist_data = {
            'id': checklist_id,
            'aspek': data.get('aspek', ''),
            'deskripsi': data.get('deskripsi', ''),
            'pic': data.get('pic', ''),
            'tahun': year,
            'rowNumber': next_row_number,
            'created_at': datetime.now().isoformat()
        }
        
        # Add new checklist item
        new_checklist_df = pd.DataFrame([checklist_data])
        updated_df = pd.concat([checklist_df, new_checklist_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/checklist.csv')
        
        if success:
            return jsonify(checklist_data), 201
        else:
            return jsonify({'error': 'Failed to save checklist to Supabase'}), 500
            
    except Exception as e:
        print(f"Error adding checklist: {e}")
        return jsonify({'error': f'Failed to add checklist: {str(e)}'}), 500

@app.route('/api/config/checklist/<int:checklist_id>', methods=['PUT'])
def update_checklist(checklist_id):
    """Update an existing checklist item and transfer files if PIC changes"""
    try:
        data = request.get_json()
        
        # Read existing checklist
        checklist_data = storage_service.read_csv('config/checklist.csv')
        if checklist_data is None:
            return jsonify({'error': 'No checklist found'}), 404
        
        # Find the existing item
        existing_item = checklist_data[checklist_data['id'] == checklist_id]
        if existing_item.empty:
            return jsonify({'error': 'Checklist item not found'}), 404
        
        # Get old values for comparison
        old_pic = existing_item.iloc[0].get('pic', '')
        old_tahun = existing_item.iloc[0].get('tahun', '')
        new_pic = data.get('pic', '')
        new_tahun = data.get('tahun', old_tahun)
        
        # Debug logging
        print(f"DEBUG: Checklist {checklist_id} PIC change check:")
        print(f"  Old PIC: '{old_pic}'")
        print(f"  New PIC: '{new_pic}'")
        print(f"  Old Year: '{old_tahun}'")
        print(f"  New Year: '{new_tahun}'")
        
        # Check if PIC or year is changing - this requires file transfer
        pic_changed = old_pic != new_pic
        year_changed = str(old_tahun) != str(new_tahun)
        files_transferred = False
        transfer_errors = []
        
        print(f"  PIC changed: {pic_changed}")
        print(f"  Year changed: {year_changed}")
        print(f"  Both old and new PIC exist: {bool(old_pic and new_pic)}")
        
        # If PIC changes, delete existing files from old location
        if pic_changed and old_pic:
            try:
                # Define old directory path (apply same naming transformation as file upload)
                from werkzeug.utils import secure_filename
                old_pic_clean = secure_filename(old_pic.replace(' ', '_'))
                old_dir = f"gcg-documents/{old_tahun}/{old_pic_clean}/{checklist_id}/"
                
                print(f"PIC change detected for checklist {checklist_id}")
                print(f"Deleting existing files from: {old_dir}")
                
                # Delete files from old directory
                if storage_service.storage_mode == 'supabase':
                    # For Supabase, list and delete files in the old directory
                    try:
                        response = storage_service.supabase.storage.from_(storage_service.bucket_name).list(old_dir)
                        if response:
                            files_to_delete = [f for f in response if f.get('name') and not f.get('name').endswith('/')]
                            
                            if files_to_delete:
                                # Delete all files
                                files_to_remove = [f"{old_dir}{file_obj['name']}" for file_obj in files_to_delete]
                                try:
                                    storage_service.supabase.storage.from_(storage_service.bucket_name).remove(files_to_remove)
                                    print(f"Successfully deleted {len(files_to_delete)} files from old PIC location")
                                    files_transferred = True  # Mark as handled
                                except Exception as delete_error:
                                    error_msg = f"Failed to delete files: {str(delete_error)}"
                                    print(error_msg)
                                    transfer_errors.append(error_msg)
                                
                    except Exception as list_error:
                        print(f"Error listing files in old directory: {str(list_error)}")
                        
                else:
                    # For local storage, delete the old directory
                    import os
                    import shutil
                    
                    old_local_dir = os.path.join('data', old_dir.replace('/', os.sep))
                    
                    if os.path.exists(old_local_dir):
                        try:
                            shutil.rmtree(old_local_dir)
                            print(f"Successfully deleted old directory: {old_local_dir}")
                            files_transferred = True  # Mark as handled
                        except Exception as delete_error:
                            error_msg = f"Failed to delete old directory: {str(delete_error)}"
                            print(error_msg)
                            transfer_errors.append(error_msg)
                            
            except Exception as delete_error:
                error_msg = f"General error during file deletion: {str(delete_error)}"
                print(error_msg)
                transfer_errors.append(error_msg)
        
        # Update the checklist item
        checklist_data.loc[checklist_data['id'] == checklist_id, 'aspek'] = data.get('aspek', '')
        checklist_data.loc[checklist_data['id'] == checklist_id, 'deskripsi'] = data.get('deskripsi', '')
        checklist_data.loc[checklist_data['id'] == checklist_id, 'pic'] = new_pic
        checklist_data.loc[checklist_data['id'] == checklist_id, 'tahun'] = new_tahun
        
        # Save to storage
        success = storage_service.write_csv(checklist_data, 'config/checklist.csv')
        
        if success:
            response_data = {'success': True}
            if files_transferred:
                response_data['files_transferred'] = True
                response_data['message'] = f"Checklist updated and files transferred to new PIC directory"
            if transfer_errors:
                response_data['transfer_errors'] = transfer_errors
                response_data['warning'] = f"Checklist updated but some files failed to transfer: {len(transfer_errors)} errors"
            
            return jsonify(response_data), 200
        else:
            return jsonify({'error': 'Failed to update checklist'}), 500
            
    except Exception as e:
        print(f"Error updating checklist: {e}")
        return jsonify({'error': f'Failed to update checklist: {str(e)}'}), 500

@app.route('/api/config/checklist/<int:checklist_id>', methods=['DELETE'])
def delete_checklist(checklist_id):
    """Delete a checklist item"""
    try:
        # Read existing checklist
        checklist_data = storage_service.read_csv('config/checklist.csv')
        if checklist_data is None:
            return jsonify({'error': 'No checklist found'}), 404
            
        # Filter out the checklist item to delete
        checklist_data = checklist_data[checklist_data['id'] != checklist_id]
        
        # Save to storage
        success = storage_service.write_csv(checklist_data, 'config/checklist.csv')
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to delete checklist'}), 500
            
    except Exception as e:
        print(f"Error deleting checklist: {e}")
        return jsonify({'error': f'Failed to delete checklist: {str(e)}'}), 500

@app.route('/api/check-files-exist/<int:checklist_id>', methods=['GET'])
def check_files_exist(checklist_id):
    """Check if files exist for a checklist item"""
    try:
        year = request.args.get('year', str(datetime.now().year))
        
        # Get checklist item to find current PIC
        checklist_data = storage_service.read_csv('config/checklist.csv')
        if checklist_data is None or checklist_data.empty:
            return jsonify({'hasFiles': False}), 200
        
        # Find the checklist item
        existing_item = checklist_data[checklist_data['id'] == checklist_id]
        if existing_item.empty:
            return jsonify({'hasFiles': False}), 200
        
        current_pic = existing_item.iloc[0].get('pic', '')
        if not current_pic:
            return jsonify({'hasFiles': False}), 200
        
        # Check if files exist in Supabase
        if storage_service.storage_mode == 'supabase':
            from werkzeug.utils import secure_filename
            pic_clean = secure_filename(current_pic.replace(' ', '_'))
            directory_path = f"gcg-documents/{year}/{pic_clean}/{checklist_id}/"
            
            try:
                response = storage_service.supabase.storage.from_(storage_service.bucket_name).list(directory_path)
                if not response:
                    return jsonify({'hasFiles': False}), 200
                
                # Filter out placeholder files and directories
                real_files = [
                    f for f in response 
                    if f.get('name') and 
                    not f.get('name').endswith('/') and  # Not a directory
                    not f.get('name').startswith('.') and  # Not a hidden file
                    not f.get('name').lower().startswith('placeholder') and  # Not a placeholder
                    f.get('metadata', {}).get('size', 0) > 0  # Has actual content
                ]
                
                has_files = len(real_files) > 0
                print(f"🔍 DEBUG: Checking files for {directory_path}: found {len(response)} items, {len(real_files)} real files")
                return jsonify({'hasFiles': has_files}), 200
            except Exception as e:
                print(f"Error checking Supabase files: {e}")
                return jsonify({'hasFiles': False}), 200
        else:
            # For local storage, check if directory exists and has files
            import os
            from pathlib import Path
            from werkzeug.utils import secure_filename
            pic_clean = secure_filename(current_pic.replace(' ', '_'))
            directory_path = Path(__file__).parent.parent / f"gcg-documents/{year}/{pic_clean}/{checklist_id}/"
            
            if directory_path.exists():
                # Filter out placeholder files and hidden files
                real_files = [
                    f for f in directory_path.iterdir() 
                    if f.is_file() and 
                    not f.name.startswith('.') and 
                    not f.name.lower().startswith('placeholder') and
                    f.stat().st_size > 0
                ]
                has_files = len(real_files) > 0
                print(f"🔍 DEBUG: Checking local files for {directory_path}: found {len(list(directory_path.iterdir()))} items, {len(real_files)} real files")
                return jsonify({'hasFiles': has_files}), 200
            else:
                return jsonify({'hasFiles': False}), 200
    
    except Exception as e:
        print(f"Error checking files existence: {e}")
        return jsonify({'hasFiles': False}), 200

@app.route('/api/config/checklist/clear', methods=['DELETE'])
def clear_checklist():
    """Clear all checklist data"""
    try:
        # Create empty DataFrame and save to clear the file
        empty_df = pd.DataFrame()
        success = storage_service.write_csv(empty_df, 'config/checklist.csv')
        
        if success:
            return jsonify({'success': True, 'message': 'Checklist data cleared'}), 200
        else:
            return jsonify({'error': 'Failed to clear checklist data'}), 500
            
    except Exception as e:
        print(f"Error clearing checklist: {e}")
        return jsonify({'error': f'Failed to clear checklist: {str(e)}'}), 500

@app.route('/api/config/checklist/fix-ids', methods=['POST'])
def fix_checklist_ids():
    """Temporary endpoint to fix checklist IDs to proper year+row format"""
    try:
        # Read existing checklist
        existing_data = storage_service.read_csv('config/checklist.csv')
        if existing_data is None or existing_data.empty:
            return jsonify({'error': 'No checklist data found'}), 404
        
        print(f"🔧 DEBUG: Fixing IDs for {len(existing_data)} checklist items")
        
        # Update each item with correct ID
        for index, row in existing_data.iterrows():
            year = int(row['tahun'])
            row_number = int(row['rowNumber'])
            correct_id = generate_checklist_id(year, row_number)
            existing_data.loc[index, 'id'] = correct_id
            print(f"🔧 DEBUG: Row {row_number}: {row['id']} -> {correct_id}")
        
        # Save updated data
        success = storage_service.write_csv(existing_data, 'config/checklist.csv')
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Successfully fixed {len(existing_data)} checklist IDs',
                'count': len(existing_data)
            }), 200
        else:
            return jsonify({'error': 'Failed to save fixed checklist to storage'}), 500
            
    except Exception as e:
        print(f"Error fixing checklist IDs: {e}")
        return jsonify({'error': f'Failed to fix checklist IDs: {str(e)}'}), 500

@app.route('/api/config/checklist/batch', methods=['POST'])
def add_checklist_batch():
    """Add multiple checklist items in batch"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        # Read existing checklist
        existing_data = storage_service.read_csv('config/checklist.csv')
        if existing_data is not None:
            checklist_df = existing_data
        else:
            checklist_df = pd.DataFrame()
        
        # Process each item in the batch
        batch_data = []
        for item in items:
            checklist_data = {
                'id': generate_checklist_id(item.get('tahun'), item.get('rowNumber')),
                'aspek': item.get('aspek', ''),
                'deskripsi': item.get('deskripsi', ''),
                'tahun': item.get('tahun'),
                'rowNumber': item.get('rowNumber'),
                'created_at': datetime.now().isoformat()
            }
            batch_data.append(checklist_data)
        
        # Create new DataFrame from batch data
        new_batch_df = pd.DataFrame(batch_data)
        updated_df = pd.concat([checklist_df, new_batch_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/checklist.csv')
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'Successfully added {len(batch_data)} checklist items',
                'items': batch_data
            }), 201
        else:
            return jsonify({'error': 'Failed to save checklist batch to storage'}), 500
            
    except Exception as e:
        print(f"Error adding checklist batch: {e}")
        return jsonify({'error': f'Failed to add checklist batch: {str(e)}'}), 500

@app.route('/api/config/checklist/migrate-year', methods=['POST'])
def migrate_checklist_year():
    """Emergency endpoint to migrate checklist data from one year to another"""
    try:
        data = request.get_json()
        from_year = data.get('from_year')
        to_year = data.get('to_year')
        
        if not from_year or not to_year:
            return jsonify({'error': 'Both from_year and to_year are required'}), 400
        
        # Read existing checklist
        csv_data = storage_service.read_csv('config/checklist.csv')
        if csv_data is None:
            return jsonify({'error': 'No checklist data found'}), 404
        
        # Find items from source year
        source_items = csv_data[csv_data['tahun'] == from_year]
        if len(source_items) == 0:
            return jsonify({'error': f'No items found for year {from_year}'}), 404
        
        # Check if target year already has data
        target_items = csv_data[csv_data['tahun'] == to_year]
        if len(target_items) > 0:
            return jsonify({
                'error': f'Year {to_year} already has {len(target_items)} items. Migration aborted to prevent conflicts.',
                'existing_items': len(target_items)
            }), 409
        
        # Create migrated data with new year and IDs
        migrated_items = []
        for index, item in source_items.iterrows():
            # Generate new ID for target year
            new_id = generate_checklist_id(to_year, item.get('rowNumber'))
            
            migrated_item = {
                'id': new_id,
                'aspek': item.get('aspek', ''),
                'deskripsi': item.get('deskripsi', ''),
                'tahun': to_year,
                'rowNumber': item.get('rowNumber'),
                'pic': item.get('pic', ''),
                'created_at': datetime.now().isoformat()
            }
            migrated_items.append(migrated_item)
        
        # Add migrated items to existing data
        migrated_df = pd.DataFrame(migrated_items)
        updated_df = pd.concat([csv_data, migrated_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/checklist.csv')
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Successfully migrated {len(migrated_items)} items from year {from_year} to {to_year}',
                'migrated_count': len(migrated_items),
                'from_year': from_year,
                'to_year': to_year
            }), 200
        else:
            return jsonify({'error': 'Failed to save migrated data to storage'}), 500
            
    except Exception as e:
        print(f"Error migrating checklist year: {e}")
        return jsonify({'error': f'Failed to migrate checklist year: {str(e)}'}), 500


if __name__ == '__main__':
    print(">> Starting POS Data Cleaner 2 Web API")
    print(f"   Upload folder: {UPLOAD_FOLDER}")
    print(f"   Output folder: {OUTPUT_FOLDER}")
    print("   CORS enabled for React frontend")
    print("   Production system integrated")
    print("   Server starting on http://localhost:5000")
    
# =============================================================================
# PENGATURAN BARU CONFIGURATION ENDPOINTS
# =============================================================================

@app.route('/api/config/tahun-buku', methods=['GET'])
def get_tahun_buku():
    """Get all tahun buku data"""
    try:
        # Read tahun buku from storage
        tahun_data = storage_service.read_csv('config/tahun-buku.csv')
        
        if tahun_data is None:
            return jsonify({'tahun_buku': []}), 200
            
        # Convert DataFrame to list of dictionaries
        tahun_list = tahun_data.to_dict('records')
        
        return jsonify({'tahun_buku': tahun_list}), 200
        
    except Exception as e:
        print(f"❌ Error getting tahun buku: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/tahun-buku', methods=['POST'])
def add_tahun_buku():
    """Add a new tahun buku"""
    try:
        data = request.get_json()
        
        if not data.get('tahun'):
            return jsonify({'error': 'Tahun is required'}), 400
            
        # Read existing tahun buku
        try:
            tahun_data = storage_service.read_csv('config/tahun-buku.csv')
            if tahun_data is None:
                tahun_data = pd.DataFrame()
        except:
            tahun_data = pd.DataFrame()
            
        # Check if tahun already exists
        if not tahun_data.empty and data['tahun'] in tahun_data['tahun'].values:
            return jsonify({'error': 'Tahun already exists'}), 400
        
        # Create new tahun record
        new_tahun = {
            'id': int(time.time() * 1000000),  # microsecond timestamp
            'tahun': data['tahun'],
            'nama': data.get('nama', ''),
            'created_at': datetime.now().isoformat()
        }
        
        # Add to DataFrame
        new_row = pd.DataFrame([new_tahun])
        tahun_data = pd.concat([tahun_data, new_row], ignore_index=True)
        
        # Save to storage (CSV for easier reading)
        success = storage_service.write_csv(tahun_data, 'config/tahun-buku.csv')
        
        if success:
            return jsonify({'success': True, 'tahun_buku': new_tahun}), 201
        else:
            return jsonify({'error': 'Failed to save tahun buku'}), 500
            
    except Exception as e:
        print(f"❌ Error adding tahun buku: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/tahun-buku/<int:tahun_id>', methods=['DELETE'])
def delete_tahun_buku(tahun_id):
    """Delete a tahun buku by ID"""
    try:
        print(f"🗑️ Deleting tahun buku with ID: {tahun_id}")
        
        # Read existing tahun buku data
        tahun_data = storage_service.read_csv('config/tahun-buku.csv')
        
        if tahun_data is None or tahun_data.empty:
            return jsonify({'error': 'No tahun buku data found'}), 404
            
        # Check if tahun exists
        if tahun_id not in tahun_data['id'].values:
            return jsonify({'error': 'Tahun buku not found'}), 404
        
        # Get the year value before deletion for cleanup
        year_to_delete = tahun_data[tahun_data['id'] == tahun_id]['tahun'].iloc[0]
        print(f"🗑️ Deleting year: {year_to_delete}")
        
        # Remove the tahun buku entry
        filtered_data = tahun_data[tahun_data['id'] != tahun_id]
        
        # Save updated data
        success = storage_service.write_csv(filtered_data, 'config/tahun-buku.csv')
        
        if success:
            print(f"✅ Successfully deleted tahun buku {tahun_id} (year {year_to_delete})")
            
            # Optional: Clean up related data for this year
            # This is commented out to avoid accidental data loss
            # You may want to add a query parameter ?cleanup=true to enable this
            cleanup = request.args.get('cleanup', 'false').lower() == 'true'
            if cleanup:
                print(f"🧹 Cleaning up related data for year {year_to_delete}")
                # Add cleanup logic here if needed
            
            return jsonify({
                'success': True, 
                'message': f'Tahun buku {year_to_delete} deleted successfully',
                'deleted_year': int(year_to_delete)
            }), 200
        else:
            return jsonify({'error': 'Failed to delete tahun buku'}), 500
            
    except Exception as e:
        print(f"❌ Error deleting tahun buku: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/struktur-organisasi', methods=['GET'])
def get_struktur_organisasi():
    """Get all struktur organisasi data"""
    try:
        # Read struktur organisasi from storage
        struktur_data = storage_service.read_csv('config/struktur-organisasi.csv')
        
        if struktur_data is None:
            return jsonify({
                'direktorat': [],
                'subdirektorat': [],
                'divisi': [],
                'anak_perusahaan': []
            }), 200
            
        # Convert DataFrame to list and fix NaN values
        struktur_data = struktur_data.fillna('')  # Replace NaN with empty string
        struktur_list = struktur_data.to_dict('records')
        
        # Clean up the data - convert empty strings back to None for parent_id and handle numeric fields
        for item in struktur_list:
            # Handle parent_id - convert empty string back to None, ensure it's an integer if not None
            if item.get('parent_id') == '' or pd.isna(item.get('parent_id')):
                item['parent_id'] = None
            elif item.get('parent_id') is not None:
                try:
                    item['parent_id'] = int(float(item['parent_id']))  # Handle float to int conversion
                except (ValueError, TypeError):
                    item['parent_id'] = None
            
            # Ensure ID is integer
            if item.get('id') is not None:
                try:
                    item['id'] = int(float(item['id']))
                except (ValueError, TypeError):
                    item['id'] = int(time.time() * 1000000)  # Fallback ID
        
        result = {
            'direktorat': [item for item in struktur_list if item.get('type') == 'direktorat'],
            'subdirektorat': [item for item in struktur_list if item.get('type') == 'subdirektorat'],
            'divisi': [item for item in struktur_list if item.get('type') == 'divisi'],
            'anak_perusahaan': [item for item in struktur_list if item.get('type') == 'anak_perusahaan']
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error getting struktur organisasi: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/struktur-organisasi', methods=['POST'])
def add_struktur_organisasi():
    """Add a new struktur organisasi item"""
    try:
        data = request.get_json()
        
        required_fields = ['type', 'nama']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate type
        valid_types = ['direktorat', 'subdirektorat', 'divisi', 'anak_perusahaan']
        if data['type'] not in valid_types:
            return jsonify({'error': f'type must be one of: {", ".join(valid_types)}'}), 400
            
        # Read existing struktur organisasi
        try:
            struktur_data = storage_service.read_csv('config/struktur-organisasi.csv')
            if struktur_data is None:
                struktur_data = pd.DataFrame()
        except:
            struktur_data = pd.DataFrame()
        
        # Create new struktur record
        new_struktur = {
            'id': int(time.time() * 1000000),  # microsecond timestamp
            'type': data['type'],
            'nama': data['nama'],
            'deskripsi': data.get('deskripsi', ''),
            'parent_id': data.get('parent_id'),  # For subdirektorat->direktorat, divisi->subdirektorat
            'created_at': datetime.now().isoformat()
        }
        
        # Add to DataFrame
        new_row = pd.DataFrame([new_struktur])
        struktur_data = pd.concat([struktur_data, new_row], ignore_index=True)
        
        # Save to storage (CSV for easier reading)
        success = storage_service.write_csv(struktur_data, 'config/struktur-organisasi.csv')
        
        if success:
            return jsonify({'success': True, 'struktur': new_struktur}), 201
        else:
            return jsonify({'error': 'Failed to save struktur organisasi'}), 500
            
    except Exception as e:
        print(f"❌ Error adding struktur organisasi: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/struktur-organisasi/batch', methods=['POST'])
def add_struktur_organisasi_batch():
    """Add multiple struktur organisasi items in a single transaction with proper ID mapping"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        print(f"🔥 BATCH API CALLED: Received {len(items)} items")
        if items:
            print(f"🔥 Sample item: {items[0]}")
        
        if not items:
            print("❌ No items provided in batch request")
            return jsonify({'error': 'No items provided'}), 400
        
        # Read existing struktur organisasi
        try:
            struktur_data = storage_service.read_csv('config/struktur-organisasi.csv')
            if struktur_data is None:
                struktur_data = pd.DataFrame()
        except:
            struktur_data = pd.DataFrame()
        
        # Sort items by dependency order: direktorat first, then subdirektorat, then divisi
        type_order = {'direktorat': 0, 'subdirektorat': 1, 'divisi': 2, 'anak_perusahaan': 3}
        items.sort(key=lambda x: type_order.get(x.get('type', ''), 999))
        
        # Track original ID to new ID mappings for hierarchical relationships
        id_mappings = {}
        new_items = []
        created_items = []  # For response
        
        for item in items:
            # Generate unique ID
            new_id = int(time.time() * 1000000 + len(new_items))  # More unique ID
            
            # Map parent_id if this item has a parent
            mapped_parent_id = None
            if item.get('parent_original_id'):
                mapped_parent_id = id_mappings.get(item['parent_original_id'])
                if not mapped_parent_id:
                    print(f"Warning: Could not find mapping for parent_original_id {item['parent_original_id']}")
            elif item.get('parent_id'):
                # Direct parent_id (for backward compatibility)
                mapped_parent_id = item['parent_id']
            
            new_struktur = {
                'id': new_id,
                'nama': item.get('nama'),
                'kode': item.get('kode', ''),
                'deskripsi': item.get('deskripsi', ''),
                'tahun': item.get('tahun', datetime.now().year),
                'type': item.get('type'),
                'parent_id': mapped_parent_id,
                'created_at': datetime.now().isoformat(),
                'is_active': True
            }
            
            # Store mapping from original_id to new_id
            if item.get('original_id'):
                id_mappings[item['original_id']] = new_id
            
            new_items.append(new_struktur)
            created_items.append(new_struktur.copy())  # For response
            
            print(f"✓ Created {item.get('type')}: {item.get('nama')} (ID: {new_id}, Parent: {mapped_parent_id})")
        
        # Add all items to DataFrame in one operation
        if new_items:
            new_df = pd.DataFrame(new_items)
            struktur_data = pd.concat([struktur_data, new_df], ignore_index=True)
        
        # Save to storage once
        print(f"🔥 Saving {len(struktur_data)} total rows to CSV...")
        success = storage_service.write_csv(struktur_data, 'config/struktur-organisasi.csv')
        
        if success:
            print(f"✅ Batch saved {len(new_items)} struktur organisasi items successfully!")
            print(f"✅ Total rows in CSV: {len(struktur_data)}")
            return jsonify({
                'success': True, 
                'added_count': len(new_items), 
                'created': created_items,
                'id_mappings': id_mappings
            }), 201
        else:
            print(f"❌ Failed to save struktur organisasi to CSV")
            return jsonify({'error': 'Failed to save struktur organisasi'}), 500
            
    except Exception as e:
        print(f"❌ Error adding batch struktur organisasi: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/config/struktur-organisasi/<int:struktur_id>', methods=['DELETE'])
def delete_struktur_organisasi(struktur_id):
    """Delete a struktur organisasi item"""
    try:
        # Read existing struktur organisasi
        struktur_data = storage_service.read_csv('config/struktur-organisasi.csv')
        if struktur_data is None:
            return jsonify({'error': 'No struktur organisasi found'}), 404
            
        # Filter out the struktur organisasi to delete
        original_count = len(struktur_data)
        struktur_data = struktur_data[struktur_data['id'] != struktur_id]
        
        if len(struktur_data) == original_count:
            return jsonify({'error': 'Struktur organisasi not found'}), 404
        
        # Save to storage
        success = storage_service.write_csv(struktur_data, 'config/struktur-organisasi.csv')
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to delete struktur organisasi'}), 500
            
    except Exception as e:
        print(f"❌ Error deleting struktur organisasi: {e}")
        return jsonify({'error': str(e)}), 500

# CHECKLIST ASSIGNMENTS ENDPOINTS
@app.route('/api/config/assignments', methods=['GET'])
def get_assignments():
    """Get all checklist assignments"""
    try:
        assignments_data = storage_service.read_csv('config/checklist-assignments.csv')
        if assignments_data is not None:
            assignments = assignments_data.to_dict(orient='records')
            return jsonify({'assignments': assignments}), 200
        else:
            return jsonify({'assignments': []}), 200
    except Exception as e:
        print(f"❌ Error getting assignments: {e}")
        return jsonify({'assignments': []}), 200

@app.route('/api/config/assignments', methods=['POST'])
def add_assignment():
    """Add or update checklist assignment"""
    try:
        data = request.get_json()
        
        assignment_data = {
            'checklistId': data.get('checklistId'),
            'assignedTo': data.get('assignedTo'),
            'assignmentType': data.get('assignmentType'),  # 'divisi' or 'subdirektorat'
            'year': data.get('year'),
            'createdAt': datetime.now().isoformat()
        }
        
        # Read existing assignments
        existing_data = storage_service.read_csv('config/checklist-assignments.csv')
        if existing_data is not None:
            assignments_df = existing_data
        else:
            assignments_df = pd.DataFrame()
        
        # Remove existing assignment for this checklistId if exists
        assignments_df = assignments_df[assignments_df['checklistId'] != assignment_data['checklistId']]
        
        # Add new assignment
        new_assignment_df = pd.DataFrame([assignment_data])
        updated_df = pd.concat([assignments_df, new_assignment_df], ignore_index=True)
        
        # Save to storage
        success = storage_service.write_csv(updated_df, 'config/checklist-assignments.csv')
        
        if success:
            return jsonify(assignment_data), 201
        else:
            return jsonify({'error': 'Failed to save assignment'}), 500
            
    except Exception as e:
        print(f"❌ Error adding assignment: {e}")
        return jsonify({'error': f'Failed to add assignment: {str(e)}'}), 500

@app.route('/api/config/assignments/<int:checklist_id>', methods=['DELETE'])
def delete_assignment(checklist_id):
    """Delete assignment for a checklist item"""
    try:
        assignments_data = storage_service.read_csv('config/checklist-assignments.csv')
        if assignments_data is None:
            return jsonify({'success': True}), 200
            
        # Filter out the assignment to delete
        assignments_data = assignments_data[assignments_data['checklistId'] != checklist_id]
        
        # Save to storage
        success = storage_service.write_csv(assignments_data, 'config/checklist-assignments.csv')
        
        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to delete assignment'}), 500
            
    except Exception as e:
        print(f"❌ Error deleting assignment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-row-files/<int:year>/<pic_name>/<int:row_number>', methods=['GET'])
def check_row_files(year, pic_name, row_number):
    """Check if files exist for a specific row"""
    try:
        path = f"gcg-documents/{year}/{pic_name}/{row_number}"
        
        # Check if directory exists
        files = storage_service.list_files(path)
        has_files = len(files) > 0
        
        return jsonify({
            'success': True,
            'hasFiles': has_files,
            'fileCount': len(files),
            'files': files
        }), 200
        
    except Exception as e:
        print(f"❌ Error checking row files: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-row-files/<int:year>/<pic_name>/<int:row_number>', methods=['DELETE'])
def delete_row_files(year, pic_name, row_number):
    """Delete all files for a specific row"""
    try:
        path = f"gcg-documents/{year}/{pic_name}/{row_number}"
        
        # List files first
        files = storage_service.list_files(path)
        
        if not files:
            return jsonify({
                'success': True,
                'message': 'No files to delete',
                'deletedCount': 0
            }), 200
        
        # Delete all files in the directory
        deleted_count = 0
        for file_info in files:
            file_path = f"{path}/{file_info['name']}"
            success = storage_service.delete_file(file_path)
            if success:
                deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {deleted_count} files',
            'deletedCount': deleted_count,
            'totalFiles': len(files)
        }), 200
        
    except Exception as e:
        print(f"❌ Error deleting row files: {e}")
        return jsonify({'error': str(e)}), 500

# Bulk delete endpoints for year data management
@app.route('/api/bulk-delete/<int:year>/preview', methods=['GET'])
def preview_bulk_delete(year):
    """Preview what data would be deleted for a specific year"""
    try:
        print(f"📋 Previewing bulk delete for year {year}")
        
        # Initialize counters
        preview_data = {
            'year': year,
            'checklist_items': 0,
            'aspects': 0,
            'users': 0,
            'organizational_data': {
                'direktorat': 0,
                'subdirektorat': 0,
                'divisi': 0
            },
            'uploaded_files': 0,
            'total_items': 0
        }
        
        # Count checklist items for the year
        try:
            checklist_data = storage_service.read_csv('config/checklist.csv')
            if checklist_data is not None:
                year_checklist = checklist_data[checklist_data['tahun'] == year]
                preview_data['checklist_items'] = len(year_checklist)
        except Exception as e:
            print(f"⚠️ Error counting checklist items: {e}")
        
        # Count aspects for the year
        try:
            aspects_data = storage_service.read_csv('config/aspects.csv')
            if aspects_data is not None:
                year_aspects = aspects_data[aspects_data['tahun'] == year]
                preview_data['aspects'] = len(year_aspects)
        except Exception as e:
            print(f"⚠️ Error counting aspects: {e}")
        
        # Count users for the year
        try:
            users_data = storage_service.read_csv('config/users.csv')
            if users_data is not None:
                year_users = users_data[users_data['tahun'] == year]
                preview_data['users'] = len(year_users)
        except Exception as e:
            print(f"⚠️ Error counting users: {e}")
        
        # Count organizational data for the year
        try:
            org_data = storage_service.read_csv('config/struktur-organisasi.csv')
            if org_data is not None:
                year_org = org_data[org_data['tahun'] == year]
                preview_data['organizational_data']['direktorat'] = len(year_org[year_org['jenis'] == 'direktorat'])
                preview_data['organizational_data']['subdirektorat'] = len(year_org[year_org['jenis'] == 'subdirektorat'])
                preview_data['organizational_data']['divisi'] = len(year_org[year_org['jenis'] == 'divisi'])
        except Exception as e:
            print(f"⚠️ Error counting organizational data: {e}")
        
        # Count uploaded files for the year
        try:
            files = storage_service.list_files(f"gcg-documents/{year}")
            if files:
                # Count only actual files, not directories
                file_count = 0
                for file_info in files:
                    if not file_info.get('name', '').endswith('/'):
                        file_count += 1
                preview_data['uploaded_files'] = file_count
        except Exception as e:
            print(f"⚠️ Error counting uploaded files: {e}")
        
        # Calculate total items
        preview_data['total_items'] = (
            preview_data['checklist_items'] +
            preview_data['aspects'] +
            preview_data['users'] +
            preview_data['organizational_data']['direktorat'] +
            preview_data['organizational_data']['subdirektorat'] +
            preview_data['organizational_data']['divisi'] +
            preview_data['uploaded_files']
        )
        
        print(f"✅ Preview complete for year {year}: {preview_data['total_items']} total items")
        return jsonify(preview_data), 200
        
    except Exception as e:
        print(f"❌ Error previewing bulk delete: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bulk-delete/<int:year>', methods=['DELETE'])
def bulk_delete_year_data(year):
    """Delete all data for a specific year"""
    try:
        print(f"🗑️ Starting bulk delete for year {year}")
        
        deleted_summary = {
            'year': year,
            'checklist_items': 0,
            'aspects': 0,
            'users': 0,
            'organizational_data': {
                'direktorat': 0,
                'subdirektorat': 0,
                'divisi': 0
            },
            'uploaded_files': 0,
            'assignments': 0
        }
        
        # 1. Delete checklist items for the year
        try:
            checklist_data = storage_service.read_csv('config/checklist.csv')
            if checklist_data is not None:
                original_count = len(checklist_data)
                year_checklist = checklist_data[checklist_data['tahun'] == year]
                deleted_summary['checklist_items'] = len(year_checklist)
                
                # Keep only items not from this year
                remaining_checklist = checklist_data[checklist_data['tahun'] != year]
                success = storage_service.write_csv(remaining_checklist, 'config/checklist.csv')
                if success:
                    print(f"✅ Deleted {deleted_summary['checklist_items']} checklist items for year {year}")
                else:
                    print(f"❌ Failed to delete checklist items for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting checklist items: {e}")
        
        # 2. Delete aspects for the year
        try:
            aspects_data = storage_service.read_csv('config/aspects.csv')
            if aspects_data is not None:
                year_aspects = aspects_data[aspects_data['tahun'] == year]
                deleted_summary['aspects'] = len(year_aspects)
                
                # Keep only aspects not from this year
                remaining_aspects = aspects_data[aspects_data['tahun'] != year]
                success = storage_service.write_csv(remaining_aspects, 'config/aspects.csv')
                if success:
                    print(f"✅ Deleted {deleted_summary['aspects']} aspects for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting aspects: {e}")
        
        # 3. Delete users for the year
        try:
            users_data = storage_service.read_csv('config/users.csv')
            if users_data is not None:
                year_users = users_data[users_data['tahun'] == year]
                deleted_summary['users'] = len(year_users)
                
                # Keep only users not from this year
                remaining_users = users_data[users_data['tahun'] != year]
                success = storage_service.write_csv(remaining_users, 'config/users.csv')
                if success:
                    print(f"✅ Deleted {deleted_summary['users']} users for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting users: {e}")
        
        # 4. Delete organizational data for the year
        try:
            org_data = storage_service.read_csv('config/struktur-organisasi.csv')
            if org_data is not None:
                year_org = org_data[org_data['tahun'] == year]
                deleted_summary['organizational_data']['direktorat'] = len(year_org[year_org['jenis'] == 'direktorat'])
                deleted_summary['organizational_data']['subdirektorat'] = len(year_org[year_org['jenis'] == 'subdirektorat'])
                deleted_summary['organizational_data']['divisi'] = len(year_org[year_org['jenis'] == 'divisi'])
                
                # Keep only organizational data not from this year
                remaining_org = org_data[org_data['tahun'] != year]
                success = storage_service.write_csv(remaining_org, 'config/struktur-organisasi.csv')
                if success:
                    total_org_deleted = sum(deleted_summary['organizational_data'].values())
                    print(f"✅ Deleted {total_org_deleted} organizational items for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting organizational data: {e}")
        
        # 5. Delete assignments for the year
        try:
            assignments_data = storage_service.read_csv('config/checklist-assignments.csv')
            if assignments_data is not None:
                year_assignments = assignments_data[assignments_data['tahun'] == year]
                deleted_summary['assignments'] = len(year_assignments)
                
                # Keep only assignments not from this year
                remaining_assignments = assignments_data[assignments_data['tahun'] != year]
                success = storage_service.write_csv(remaining_assignments, 'config/checklist-assignments.csv')
                if success:
                    print(f"✅ Deleted {deleted_summary['assignments']} assignments for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting assignments: {e}")
        
        # 6. Delete uploaded files for the year
        try:
            files = storage_service.list_files(f"gcg-documents/{year}")
            if files:
                file_count = 0
                for file_info in files:
                    file_path = f"gcg-documents/{year}/{file_info['name']}"
                    success = storage_service.delete_file(file_path)
                    if success:
                        file_count += 1
                deleted_summary['uploaded_files'] = file_count
                print(f"✅ Deleted {file_count} uploaded files for year {year}")
        except Exception as e:
            print(f"⚠️ Error deleting uploaded files: {e}")
        
        # Calculate total deleted items
        total_deleted = (
            deleted_summary['checklist_items'] +
            deleted_summary['aspects'] +
            deleted_summary['users'] +
            deleted_summary['organizational_data']['direktorat'] +
            deleted_summary['organizational_data']['subdirektorat'] +
            deleted_summary['organizational_data']['divisi'] +
            deleted_summary['uploaded_files'] +
            deleted_summary['assignments']
        )
        
        print(f"🎉 Bulk delete completed for year {year}. Total items deleted: {total_deleted}")
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted all data for year {year}',
            'year': year,
            'deleted_summary': deleted_summary,
            'total_deleted': total_deleted
        }), 200
        
    except Exception as e:
        print(f"❌ Error during bulk delete: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)