#!/usr/bin/env python3
"""
Generate Mapping Template for Historical Files

This script scans a directory of historical files and generates a CSV template
that you can fill in to map files to checklist items.

Usage:
    python generate_mapping_template.py --source /path/to/historical-files

    OR

    python generate_mapping_template.py  (uses ./historical-files by default)
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
import pandas as pd
from file_scanner import FileScanner
from database import get_db_connection


def export_checklist_reference(output_file: str = 'checklist_reference.csv'):
    """
    Export all checklist items as a reference file

    This helps you look up checklist IDs when filling in the mapping template
    """
    print(f"\n📋 Exporting checklist reference to {output_file}...")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                c.id,
                c.tahun,
                c.aspek,
                c.deskripsi,
                a.subdirektorat as assigned_pic
            FROM checklist_gcg c
            LEFT JOIN checklist_assignments a ON c.id = a.checklist_id AND c.tahun = a.tahun
            WHERE c.is_active = 1
            ORDER BY c.tahun DESC, c.id
        """)

        rows = cursor.fetchall()

        if not rows:
            print("⚠️  No checklist items found in database!")
            return

        # Convert to DataFrame
        df = pd.DataFrame(rows, columns=['id', 'tahun', 'aspek', 'deskripsi', 'assigned_pic'])

        # Save to CSV
        df.to_csv(output_file, index=False, encoding='utf-8-sig')  # utf-8-sig for Excel compatibility

        print(f"✅ Exported {len(df)} checklist items")
        print(f"   Use this file to look up checklist IDs when filling the mapping template")


def generate_mapping_template(source_directory: str, output_file: str = None):
    """
    Generate a CSV mapping template from files in a directory

    Args:
        source_directory: Directory containing historical files
        output_file: Output CSV file path (auto-generated if not provided)
    """
    print(f"\n🔍 Scanning directory: {source_directory}")

    # Initialize scanner with custom storage root
    scanner = FileScanner(storage_root=source_directory)

    # Scan for files
    found_files = scanner.scan_storage()

    if not found_files:
        print(f"❌ No files found in {source_directory}")
        print(f"\n💡 Expected directory structure:")
        print(f"   {source_directory}/")
        print(f"   ├── 2020/")
        print(f"   │   ├── Divisi_HR/")
        print(f"   │       └── document.pdf")
        print(f"   ├── 2021/")
        print(f"       └── ...")
        return

    print(f"📁 Found {len(found_files)} files")

    # Generate template data
    template_data = []

    for file_meta in found_files:
        # Extract what we can from the path
        filename = file_meta['file_name']
        year = file_meta.get('year', '')
        suggested_pic = file_meta.get('subdirektorat', '')
        path = file_meta.get('local_file_path', '')

        # Try to suggest checklist ID based on keywords (optional)
        suggested_id = suggest_checklist_id(filename, year) if year else ''

        template_data.append({
            'filename': filename,
            'year': year,
            'path': path,
            'suggested_pic': suggested_pic,
            'suggested_checklist_id': suggested_id,
            'checklist_id': '',  # ← USER FILLS THIS IN
            'pic_override': '',  # ← Optional: override the PIC from path
            'catatan': '',       # ← Optional: add notes
            'status': 'pending'  # Will be set to 'imported' after processing
        })

    # Create DataFrame
    df = pd.DataFrame(template_data)

    # Sort by year and filename for easier filling
    df = df.sort_values(['year', 'filename'], ascending=[False, True])

    # Generate output filename if not provided
    if output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f'mapping_template_{timestamp}.csv'

    # Save to CSV
    df.to_csv(output_file, index=False, encoding='utf-8-sig')

    print(f"\n✅ Mapping template created: {output_file}")
    print(f"   Total files: {len(df)}")
    print(f"   Years found: {sorted(df['year'].unique())}")

    print(f"\n📝 Next steps:")
    print(f"   1. Open {output_file} in Excel")
    print(f"   2. Open checklist_reference.csv side-by-side")
    print(f"   3. Fill in the 'checklist_id' column by matching filenames to checklist descriptions")
    print(f"   4. (Optional) Fill in 'pic_override' if the path-based PIC is wrong")
    print(f"   5. (Optional) Add notes in 'catatan' column")
    print(f"   6. Save the file")
    print(f"   7. Run: python import_mapped_files.py --mapping {output_file}")

    return output_file


def suggest_checklist_id(filename: str, year: int) -> str:
    """
    Try to suggest a checklist ID based on filename patterns

    This is just a helper - not guaranteed to be accurate!
    """
    try:
        from database import get_db_connection

        filename_lower = filename.lower()

        # Common patterns
        patterns = {
            'annual.*report|laporan.*tahunan': ['annual', 'laporan', 'tahunan', 'report'],
            'code.*conduct|pedoman.*perilaku|coc': ['code', 'conduct', 'perilaku', 'coc'],
            'budget|anggaran': ['budget', 'anggaran'],
            'audit': ['audit'],
            'board.*manual|panduan.*direksi': ['board', 'manual', 'direksi', 'panduan'],
            'kpi|performance': ['kpi', 'performance', 'kinerja'],
        }

        # Search checklist for keyword matches
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, deskripsi
                FROM checklist_gcg
                WHERE tahun = ?
            """, (year,))

            checklists = cursor.fetchall()

            best_match = None
            best_score = 0

            for checklist_id, description in checklists:
                desc_lower = description.lower()
                score = 0

                # Check each pattern
                for pattern, keywords in patterns.items():
                    import re
                    if re.search(pattern, filename_lower):
                        for keyword in keywords:
                            if keyword in desc_lower:
                                score += 1

                if score > best_score:
                    best_score = score
                    best_match = checklist_id

            # Only return if we have a decent match
            if best_score >= 2:
                return f"{best_match} (suggested)"

    except Exception as e:
        pass  # Silently fail - this is just a suggestion

    return ''


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Generate mapping template for historical GCG files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default historical-files directory
  python generate_mapping_template.py

  # Specify custom directory
  python generate_mapping_template.py --source /mnt/archive/gcg-docs

  # Custom output filename
  python generate_mapping_template.py --output my_mapping.csv
        """
    )

    parser.add_argument(
        '--source', '-s',
        default='historical-files',
        help='Source directory containing historical files (default: ./historical-files)'
    )

    parser.add_argument(
        '--output', '-o',
        help='Output CSV filename (default: auto-generated with timestamp)'
    )

    parser.add_argument(
        '--no-reference',
        action='store_true',
        help='Skip exporting checklist reference file'
    )

    args = parser.parse_args()

    print("="*70)
    print("  GCG DOCUMENT HUB - Historical File Mapping Template Generator")
    print("="*70)

    # Export checklist reference first (unless skipped)
    if not args.no_reference:
        export_checklist_reference()

    # Generate mapping template
    source_path = Path(args.source)

    if not source_path.exists():
        print(f"\n❌ Error: Directory not found: {source_path}")
        print(f"\n💡 Create the directory and organize your files like this:")
        print(f"   {source_path}/")
        print(f"   ├── 2020/")
        print(f"   │   ├── Divisi_HR/")
        print(f"   │   │   └── 999/")
        print(f"   │   │       └── document.pdf")
        print(f"   └── 2021/")
        print(f"       └── ...")
        print(f"\n   Where:")
        print(f"   - 2020, 2021 = year")
        print(f"   - Divisi_HR = subdirektorat (use underscores)")
        print(f"   - 999 = temporary checklist ID (can be any number)")
        print(f"   - document.pdf = your file")
        sys.exit(1)

    output_file = generate_mapping_template(str(source_path), args.output)

    print("\n" + "="*70)
    print("✅ Template generation complete!")
    print("="*70)


if __name__ == '__main__':
    main()
