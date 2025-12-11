#!/usr/bin/env python3
"""
Import Historical Files Using Mapping CSV

This script takes a completed mapping CSV file and imports historical files
into the database with proper metadata.

Usage:
    python import_mapped_files.py --mapping completed_mapping.csv
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
import pandas as pd
import shutil
from database import get_db_connection
from file_scanner import FileScanner
import uuid


class MappedFileImporter:
    """Import files using a mapping CSV"""

    def __init__(self, mapping_file: str, target_storage: str = None, dry_run: bool = False):
        """
        Initialize importer

        Args:
            mapping_file: Path to completed mapping CSV
            target_storage: Target storage directory (default: ./data)
            dry_run: If True, don't actually copy files or write to database
        """
        self.mapping_file = mapping_file
        self.dry_run = dry_run

        if target_storage is None:
            # Default to project data directory
            target_storage = Path(__file__).parent.parent / 'data'

        self.target_storage = Path(target_storage)
        self.target_gcg_docs = self.target_storage / 'gcg-documents'

        # Statistics
        self.stats = {
            'total': 0,
            'imported': 0,
            'skipped': 0,
            'errors': 0,
            'warnings': []
        }

    def load_mapping(self) -> pd.DataFrame:
        """Load and validate mapping CSV"""
        print(f"📂 Loading mapping file: {self.mapping_file}")

        try:
            df = pd.read_csv(self.mapping_file)
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            sys.exit(1)

        # Validate required columns
        required_cols = ['filename', 'year', 'path', 'checklist_id']
        missing = [col for col in required_cols if col not in df.columns]

        if missing:
            print(f"❌ Missing required columns: {', '.join(missing)}")
            print(f"   Found columns: {', '.join(df.columns)}")
            sys.exit(1)

        # Filter out rows without checklist_id
        original_count = len(df)
        df = df[df['checklist_id'].notna() & (df['checklist_id'] != '')]
        skipped = original_count - len(df)

        if skipped > 0:
            print(f"⚠️  Skipping {skipped} rows without checklist_id")

        print(f"✅ Loaded {len(df)} file mappings")

        return df

    def validate_checklist_id(self, checklist_id: int, year: int) -> dict:
        """
        Validate that checklist ID exists and get its metadata

        Returns:
            Dictionary with checklist info or None if not found
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, aspek, deskripsi, tahun
                FROM checklist_gcg
                WHERE id = ? AND tahun = ?
            """, (checklist_id, year))

            row = cursor.fetchone()

            if row:
                return {
                    'id': row[0],
                    'aspek': row[1],
                    'deskripsi': row[2],
                    'tahun': row[3]
                }
            return None

    def copy_file_to_storage(self, source_path: str, year: int, pic: str, checklist_id: int, filename: str) -> str:
        """
        Copy file to target storage location

        Returns:
            Relative path in storage
        """
        # Clean PIC name (replace spaces with underscores)
        pic_clean = pic.replace(' ', '_')

        # Build target path
        target_dir = self.target_gcg_docs / str(year) / pic_clean / str(checklist_id)
        target_file = target_dir / filename

        # Create directory
        if not self.dry_run:
            target_dir.mkdir(parents=True, exist_ok=True)

            # Copy file
            source = Path(source_path)
            if source.exists():
                shutil.copy2(source, target_file)
            else:
                raise FileNotFoundError(f"Source file not found: {source_path}")

        # Return relative path
        relative_path = target_file.relative_to(self.target_storage)
        return str(relative_path)

    def create_database_record(self, file_info: dict) -> str:
        """
        Create database record for imported file

        Returns:
            File record ID (UUID)
        """
        file_id = str(uuid.uuid4())

        if not self.dry_run:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO uploaded_files (
                        id, file_name, file_size, upload_date, year,
                        checklist_id, checklist_description, aspect,
                        subdirektorat, local_file_path, uploaded_by,
                        catatan, status, last_scanned, file_exists_on_disk
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    file_id,
                    file_info['filename'],
                    file_info['file_size'],
                    datetime.now(),
                    file_info['year'],
                    file_info['checklist_id'],
                    file_info['description'],
                    file_info['aspect'],
                    file_info['pic'],
                    file_info['storage_path'],
                    'Historical Import',
                    file_info.get('catatan', ''),
                    'uploaded',
                    datetime.now(),
                    True
                ))

        return file_id

    def import_file(self, row: pd.Series) -> bool:
        """
        Import a single file from mapping row

        Returns:
            True if successful, False otherwise
        """
        try:
            # Parse row data
            filename = str(row['filename'])
            year = int(row['year'])
            source_path = str(row['path'])
            checklist_id_str = str(row['checklist_id']).strip()

            # Remove "(suggested)" suffix if present
            checklist_id_str = checklist_id_str.replace('(suggested)', '').strip()
            checklist_id = int(checklist_id_str)

            # Get PIC (use override if provided, otherwise from path)
            pic = str(row.get('pic_override', '')).strip()
            if not pic:
                pic = str(row.get('suggested_pic', 'UNKNOWN')).strip()

            # Get optional catatan
            catatan = str(row.get('catatan', '')).strip() if pd.notna(row.get('catatan')) else ''

            # Validate checklist
            checklist_info = self.validate_checklist_id(checklist_id, year)
            if not checklist_info:
                warning = f"⚠️  Checklist ID {checklist_id} not found for year {year}: {filename}"
                self.stats['warnings'].append(warning)
                print(warning)
                return False

            # Build full source path
            source_full = Path(source_path)
            if not source_full.is_absolute():
                # Assume it's relative to historical-files
                source_full = Path('historical-files') / source_path

            # Check if file exists
            if not source_full.exists():
                warning = f"⚠️  Source file not found: {source_full}"
                self.stats['warnings'].append(warning)
                print(warning)
                return False

            # Get file size
            file_size = source_full.stat().st_size

            # Copy file to storage
            storage_path = self.copy_file_to_storage(
                str(source_full),
                year,
                pic,
                checklist_id,
                filename
            )

            # Create database record
            file_info = {
                'filename': filename,
                'year': year,
                'checklist_id': checklist_id,
                'description': checklist_info['deskripsi'],
                'aspect': checklist_info['aspek'],
                'pic': pic,
                'storage_path': storage_path,
                'file_size': file_size,
                'catatan': catatan
            }

            file_id = self.create_database_record(file_info)

            mode = "[DRY RUN] " if self.dry_run else ""
            print(f"{mode}✅ Imported: {filename} → Checklist {checklist_id} ({checklist_info['aspek']})")

            return True

        except Exception as e:
            error = f"❌ Error importing {row.get('filename', 'unknown')}: {e}"
            self.stats['warnings'].append(error)
            print(error)
            import traceback
            traceback.print_exc()
            return False

    def import_all(self):
        """Import all files from mapping CSV"""
        # Load mapping
        mapping_df = self.load_mapping()
        self.stats['total'] = len(mapping_df)

        if self.dry_run:
            print("\n🔍 DRY RUN MODE - No files will be copied or database changes made")

        print(f"\n📦 Starting import of {len(mapping_df)} files...")
        print("="*70)

        # Import each file
        for idx, row in mapping_df.iterrows():
            if self.import_file(row):
                self.stats['imported'] += 1
            else:
                self.stats['skipped'] += 1

        # Print summary
        print("\n" + "="*70)
        print("📊 Import Summary")
        print("="*70)
        print(f"Total files:    {self.stats['total']}")
        print(f"✅ Imported:    {self.stats['imported']}")
        print(f"⚠️  Skipped:     {self.stats['skipped']}")
        print(f"❌ Errors:      {len(self.stats['warnings'])}")

        if self.stats['warnings']:
            print(f"\n⚠️  Warnings/Errors:")
            for warning in self.stats['warnings'][:10]:  # Show first 10
                print(f"   {warning}")

            if len(self.stats['warnings']) > 10:
                print(f"   ... and {len(self.stats['warnings']) - 10} more")

        if self.dry_run:
            print(f"\n💡 This was a DRY RUN. Run without --dry-run to actually import files.")
        else:
            print(f"\n✅ Import complete! Files are now in the database.")
            print(f"   Storage location: {self.target_gcg_docs}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Import historical GCG files using completed mapping CSV',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run (preview what will happen)
  python import_mapped_files.py --mapping my_mapping.csv --dry-run

  # Actually import files
  python import_mapped_files.py --mapping my_mapping.csv

  # Custom target storage directory
  python import_mapped_files.py --mapping my_mapping.csv --target /var/gcg-storage
        """
    )

    parser.add_argument(
        '--mapping', '-m',
        required=True,
        help='Path to completed mapping CSV file'
    )

    parser.add_argument(
        '--target', '-t',
        help='Target storage directory (default: ./data)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview import without actually copying files or writing to database'
    )

    args = parser.parse_args()

    print("="*70)
    print("  GCG DOCUMENT HUB - Historical File Import")
    print("="*70)

    # Check if mapping file exists
    if not Path(args.mapping).exists():
        print(f"❌ Error: Mapping file not found: {args.mapping}")
        sys.exit(1)

    # Create importer and run
    importer = MappedFileImporter(
        mapping_file=args.mapping,
        target_storage=args.target,
        dry_run=args.dry_run
    )

    importer.import_all()


if __name__ == '__main__':
    main()
