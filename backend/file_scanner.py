"""
File Scanner & Sync Module for GCG Document Hub
Scans file storage and synchronizes with database metadata
"""

import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from database import get_db_connection


class FileScanner:
    """
    Scans file storage and syncs with database

    Directory Structure Expected:
    gcg-documents/{year}/{subdirektorat}/{checklist_id}/{filename}

    Example:
    gcg-documents/2025/Divisi_Human_Capital/324/Annual_Report.pdf
    """

    def __init__(self, storage_root: str = None):
        """
        Initialize file scanner

        Args:
            storage_root: Root directory for file storage (default: ./data)
        """
        if storage_root is None:
            # Default to project data directory
            storage_root = Path(__file__).parent.parent / 'data'

        self.storage_root = Path(storage_root)
        self.gcg_documents_path = self.storage_root / 'gcg-documents'

    def extract_metadata_from_path(self, file_path: Path) -> Optional[Dict]:
        """
        Extract metadata from file path structure

        Expected structure: gcg-documents/{year}/{pic}/{checklist_id}/{filename}

        Args:
            file_path: Path object pointing to the file

        Returns:
            Dictionary with metadata or None if invalid structure
        """
        try:
            # Get path relative to storage root
            relative_path = file_path.relative_to(self.storage_root)
            parts = relative_path.parts

            # Validate structure: ['gcg-documents', year, pic, checklist_id, filename]
            if len(parts) >= 5 and parts[0] == 'gcg-documents':
                year = int(parts[1])
                subdirektorat = parts[2].replace('_', ' ')  # Convert underscore to space
                checklist_id = int(parts[3])
                file_name = parts[4]

                # Get file stats
                file_stats = file_path.stat()

                return {
                    'year': year,
                    'subdirektorat': subdirektorat,
                    'checklist_id': checklist_id,
                    'file_name': file_name,
                    'file_size': file_stats.st_size,
                    'file_modified': datetime.fromtimestamp(file_stats.st_mtime),
                    'local_file_path': str(relative_path),
                    'full_path': str(file_path)
                }
            else:
                return None

        except (ValueError, IndexError, OSError) as e:
            print(f"Error extracting metadata from {file_path}: {e}")
            return None

    def scan_storage(self) -> List[Dict]:
        """
        Scan file storage and extract metadata from all files

        Returns:
            List of dictionaries with file metadata
        """
        if not self.gcg_documents_path.exists():
            print(f"Warning: Storage path does not exist: {self.gcg_documents_path}")
            return []

        found_files = []

        # Recursively find all files
        for file_path in self.gcg_documents_path.rglob('*'):
            if file_path.is_file():
                metadata = self.extract_metadata_from_path(file_path)
                if metadata:
                    found_files.append(metadata)
                else:
                    print(f"Warning: Could not extract metadata from: {file_path}")

        return found_files

    def get_checklist_info(self, checklist_id: int) -> Optional[Dict]:
        """
        Get checklist information from database

        Args:
            checklist_id: Checklist item ID

        Returns:
            Dictionary with checklist info or None
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, aspek, deskripsi, tahun
                FROM checklist_gcg
                WHERE id = ?
            """, (checklist_id,))

            row = cursor.fetchone()
            if row:
                return {
                    'id': row[0],
                    'aspek': row[1],
                    'deskripsi': row[2],
                    'tahun': row[3]
                }
            return None

    def sync_file_to_database(self, file_metadata: Dict, uploaded_by: str = 'File Scanner') -> str:
        """
        Sync a single file to database

        Args:
            file_metadata: Dictionary with file metadata
            uploaded_by: Who uploaded/scanned this file

        Returns:
            File record ID (UUID)
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if file already exists in database
            cursor.execute("""
                SELECT id FROM uploaded_files
                WHERE local_file_path = ?
            """, (file_metadata['local_file_path'],))

            existing = cursor.fetchone()

            if existing:
                # Update existing record
                file_id = existing[0]
                cursor.execute("""
                    UPDATE uploaded_files
                    SET file_name = ?,
                        file_size = ?,
                        last_scanned = CURRENT_TIMESTAMP,
                        file_exists_on_disk = 1
                    WHERE id = ?
                """, (file_metadata['file_name'], file_metadata['file_size'], file_id))

                print(f"✅ Updated existing file record: {file_metadata['file_name']}")
            else:
                # Get checklist info for additional metadata
                checklist_info = self.get_checklist_info(file_metadata['checklist_id'])

                # Create new record
                file_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO uploaded_files (
                        id, file_name, file_size, upload_date, year,
                        checklist_id, checklist_description, aspect,
                        subdirektorat, local_file_path, uploaded_by,
                        status, last_scanned, file_exists_on_disk
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    file_id,
                    file_metadata['file_name'],
                    file_metadata['file_size'],
                    file_metadata['file_modified'],
                    file_metadata['year'],
                    file_metadata['checklist_id'],
                    checklist_info['deskripsi'] if checklist_info else '',
                    checklist_info['aspek'] if checklist_info else '',
                    file_metadata['subdirektorat'],
                    file_metadata['local_file_path'],
                    uploaded_by,
                    'uploaded',
                    datetime.now(),
                    True
                ))

                print(f"✅ Added new file record: {file_metadata['file_name']}")

            return file_id

    def mark_missing_files(self, scanned_paths: List[str]) -> int:
        """
        Mark files in database that no longer exist on disk

        Args:
            scanned_paths: List of file paths found during scan

        Returns:
            Number of files marked as missing
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Get all files from database
            cursor.execute("""
                SELECT id, local_file_path
                FROM uploaded_files
                WHERE file_exists_on_disk = 1
            """)

            db_files = cursor.fetchall()
            missing_count = 0

            for file_id, db_path in db_files:
                if db_path not in scanned_paths:
                    # File in DB but not on disk - mark as missing
                    cursor.execute("""
                        UPDATE uploaded_files
                        SET file_exists_on_disk = 0,
                            last_scanned = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (file_id,))
                    missing_count += 1
                    print(f"⚠️ Marked as missing: {db_path}")

            return missing_count

    def scan_and_sync(self, uploaded_by: str = 'File Scanner') -> Dict:
        """
        Complete scan and sync operation

        Args:
            uploaded_by: Who initiated the scan

        Returns:
            Dictionary with sync statistics
        """
        print("🔍 Starting file storage scan...")

        # Scan storage
        scanned_files = self.scan_storage()
        print(f"📁 Found {len(scanned_files)} files in storage")

        # Sync each file to database
        added = 0
        updated = 0
        scanned_paths = []

        for file_metadata in scanned_files:
            file_id = self.sync_file_to_database(file_metadata, uploaded_by)
            scanned_paths.append(file_metadata['local_file_path'])

            # Track if new or updated (simple heuristic)
            # You could enhance this by checking if ID was newly created
            added += 1

        # Mark missing files
        missing = self.mark_missing_files(scanned_paths)

        result = {
            'total_scanned': len(scanned_files),
            'added_or_updated': added,
            'marked_missing': missing,
            'scan_timestamp': datetime.now().isoformat()
        }

        print(f"\n✅ Scan complete!")
        print(f"   Total scanned: {result['total_scanned']}")
        print(f"   Added/Updated: {result['added_or_updated']}")
        print(f"   Marked missing: {result['marked_missing']}")

        return result


# Example usage
if __name__ == '__main__':
    scanner = FileScanner()
    results = scanner.scan_and_sync(uploaded_by='Manual Scan - Admin')
    print(f"\n📊 Scan Results: {results}")
