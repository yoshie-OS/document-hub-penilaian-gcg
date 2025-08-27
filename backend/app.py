#!/usr/bin/env python3
"""
POS Data Cleaner 2 - Web API Backend
Integrates the production-ready processing engine (98.9% accuracy) with the web interface
"""

import os
import sys
import json
import uuid
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd

# Project root for subprocess calls to the working core system
project_root = str(Path(__file__).parent.parent.parent)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
OUTPUT_FOLDER = Path(__file__).parent / 'outputs'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg'}

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
        
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        # Load existing XLSX data and COMPLETELY REPLACE year's data (including deletions)
        all_rows = []
        if output_xlsx_path.exists():
            try:
                existing_df = pd.read_excel(output_xlsx_path)
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
            
            # Determine Level and Type based on data structure
            if str(row_id).isdigit():
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
                'Jumlah_Parameter': row.get('jumlah_parameter', ''),
                'Bobot': row.get('bobot', ''),
                'Skor': row.get('skor', ''),
                'Capaian': row.get('capaian', ''),
                'Penjelasan': row.get('penjelasan', ''),
                'Tahun': year,
                'Penilai': auditor,
                'Jenis_Asesmen': jenis_asesmen,
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
                    'Jumlah_Parameter': '',
                    'Bobot': '',
                    'Skor': '',
                    'Capaian': '',
                    'Penjelasan': '',
                    'Tahun': year,
                    'Penilai': auditor,
                    'Jenis_Asesmen': jenis_asesmen,
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
                    'Jumlah_Parameter': '',
                    'Bobot': summary_row.get('bobot', ''),
                    'Skor': summary_row.get('skor', ''),
                    'Capaian': summary_row.get('capaian', ''),
                    'Penjelasan': summary_row.get('penjelasan', ''),
                    'Tahun': year,
                    'Penilai': auditor,
                    'Jenis_Asesmen': jenis_asesmen,
                    'Export_Date': saved_at[:10]
                }
                all_rows.append(subtotal_row)
        
        # Convert to DataFrame and save XLSX
        if all_rows:
            df = pd.DataFrame(all_rows)
            
            # Remove any duplicate rows
            df_unique = df.drop_duplicates(subset=['Tahun', 'Section', 'No', 'Deskripsi'], keep='last')
            print(f"🔧 DEBUG: Removed {len(df) - len(df_unique)} duplicate rows")
            
            # Custom sorting: year → aspek → no, then organize headers and subtotals properly
            def sort_key(row):
                year = row['Tahun']
                section = row['Section']
                no = row['No']
                row_type = row['Type']
                
                # Convert 'no' to numeric for proper sorting, handle empty values
                try:
                    no_numeric = int(no) if str(no).isdigit() else 9999
                except (ValueError, TypeError):
                    no_numeric = 9999
                
                # Type priority: header=0, indicators=1, subtotal=2
                type_priority = {'header': 0, 'indicator': 1, 'subtotal': 2}.get(row_type, 1)
                
                return (year, section, type_priority, no_numeric)
            
            # Apply custom sorting
            df_sorted = df_unique.loc[df_unique.apply(sort_key, axis=1).sort_values().index]
            
            # Create directory and save XLSX
            os.makedirs(output_xlsx_path.parent, exist_ok=True)
            df_sorted.to_excel(output_xlsx_path, index=False)
            print(f"SUCCESS: Saved to output.xlsx with {len(df_sorted)} rows (sorted: year->aspek->no->type) at: {output_xlsx_path}")
            
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


@app.route('/api/load/<int:year>', methods=['GET'])
def load_assessment_by_year(year):
    """
    Load assessment data for a specific year from output.xlsx
    """
    try:
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        if not output_xlsx_path.exists():
            return jsonify({
                'success': False,
                'data': [],
                'message': f'No saved data found for year {year}'
            })
        
        # Read XLSX data
        df = pd.read_excel(output_xlsx_path)
        
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
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        if not output_xlsx_path.exists():
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No dashboard data available. Please save some assessments first.'
            })
        
        # Read XLSX data
        df = pd.read_excel(output_xlsx_path)
        
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
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        if not output_xlsx_path.exists():
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No data available'
            })
        
        # Read XLSX data
        df = pd.read_excel(output_xlsx_path)
        
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
    output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
    assessments_path = Path(__file__).parent.parent / 'web-output' / 'assessments.json'
    
    # Get years that exist in output.xlsx
    xlsx_years = set()
    if output_xlsx_path.exists():
        df = pd.read_excel(output_xlsx_path)
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
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        # Auto-cleanup orphaned data before proceeding
        try:
            _cleanup_orphaned_data_internal()
        except Exception as cleanup_error:
            print(f"WARNING: Auto-cleanup failed: {cleanup_error}")
        
        if not output_xlsx_path.exists():
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No data available'
            })
        
        # Read XLSX data
        df = pd.read_excel(output_xlsx_path)
        
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
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        
        if not output_xlsx_path.exists():
            return jsonify({
                'success': False,
                'data': [],
                'message': 'No chart data available. Please save some assessments first.'
            })
        
        # Read XLSX data
        df = pd.read_excel(output_xlsx_path)
        
        print(f"🎨 GCG Chart Data: Loading {len(df)} rows from output.xlsx")
        
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
        output_xlsx_path = Path(__file__).parent.parent / 'web-output' / 'output.xlsx'
        assessments_path = Path(__file__).parent.parent / 'web-output' / 'assessments.json'
        
        # Get years that exist in output.xlsx
        xlsx_years = set()
        if output_xlsx_path.exists():
            df = pd.read_excel(output_xlsx_path)
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
            'xlsx_exists': output_xlsx_path.exists(),
            'assessments_exists': assessments_path.exists()
        })
        
    except Exception as e:
        print(f"ERROR: Error during cleanup: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to cleanup orphaned data'
        }), 500


if __name__ == '__main__':
    print(">> Starting POS Data Cleaner 2 Web API")
    print(f"   Upload folder: {UPLOAD_FOLDER}")
    print(f"   Output folder: {OUTPUT_FOLDER}")
    print("   CORS enabled for React frontend")
    print("   Production system integrated")
    print("   Server starting on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)