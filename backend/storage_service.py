"""
Storage Service - Handles file operations for local storage
"""

import os
import threading
from pathlib import Path
from typing import Optional
import pandas as pd
from windows_utils import safe_print

class StorageService:
    """Local file storage service"""

    def __init__(self):
        self.storage_mode = 'local'
        # File locks to prevent race conditions
        self._file_locks = {}
        self._locks_lock = threading.Lock()  # Lock to protect the _file_locks dict itself
        safe_print("✅ Local storage mode initialized")

    def _get_file_lock(self, file_path: str) -> threading.Lock:
        """Get or create a threading lock for a specific file path"""
        with self._locks_lock:
            if file_path not in self._file_locks:
                self._file_locks[file_path] = threading.Lock()
            return self._file_locks[file_path]

    def read_excel(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read Excel file from local storage"""
        try:
            return self._read_excel_local(file_path)
        except Exception as e:
            safe_print(f"❌ Error reading Excel file {file_path}: {e}")
            return None

    def write_excel(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write Excel file to local storage"""
        try:
            return self._write_excel_local(df, file_path)
        except Exception as e:
            safe_print(f"❌ Error writing Excel file {file_path}: {e}")
            return False

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in local storage"""
        try:
            return self._file_exists_local(file_path)
        except Exception as e:
            safe_print(f"❌ Error checking file existence {file_path}: {e}")
            return False

    def list_files(self, directory_path: str = "") -> list:
        """List files in local storage directory"""
        try:
            return self._list_files_local(directory_path)
        except Exception as e:
            safe_print(f"❌ Error listing files in {directory_path}: {e}")
            return []

    # Local storage methods
    def _read_excel_local(self, file_path: str) -> pd.DataFrame:
        """Read Excel file from local storage"""
        # Use data directory for organized local storage
        full_path = Path(__file__).parent.parent / 'data' / file_path
        if full_path.exists():
            return pd.read_excel(str(full_path))
        else:
            # Fallback to old location for backward compatibility
            fallback_path = Path(__file__).parent.parent / file_path
            if fallback_path.exists():
                return pd.read_excel(str(fallback_path))
            raise FileNotFoundError(f"Local file not found: {full_path} or {fallback_path}")

    def _write_excel_local(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write Excel file to local storage"""
        file_lock = self._get_file_lock(file_path)
        with file_lock:
            # Use data directory for organized local storage
            full_path = Path(__file__).parent.parent / 'data' / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            df.to_excel(str(full_path), index=False)
            safe_print(f"📁 Saved Excel file to local storage: {full_path}")
            return True

    def _file_exists_local(self, file_path: str) -> bool:
        """Check if file exists in local storage"""
        # Check data directory first
        full_path = Path(__file__).parent.parent / 'data' / file_path
        if full_path.exists():
            return True
        # Fallback to old location for backward compatibility
        fallback_path = Path(__file__).parent.parent / file_path
        return fallback_path.exists()

    def _list_files_local(self, directory_path: str) -> list:
        """List files in local storage directory"""
        # Use data directory for organized local storage
        full_path = Path(__file__).parent.parent / 'data' / directory_path
        if not full_path.exists():
            # Fallback to old location
            full_path = Path(__file__).parent.parent / directory_path
            if not full_path.exists():
                return []

        files = []
        if full_path.is_file():
            # If the path is a file, return just that file
            files.append(str(full_path.relative_to(Path(__file__).parent.parent / 'data')))
        else:
            # If it's a directory, list all files recursively
            for file_path in full_path.rglob('*'):
                if file_path.is_file():
                    relative_path = str(file_path.relative_to(Path(__file__).parent.parent / 'data'))
                    files.append(relative_path)

        return files

    # CSV methods
    def read_csv(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read CSV file from local storage"""
        try:
            return self._read_csv_local(file_path)
        except Exception as e:
            safe_print(f"❌ Error reading CSV file {file_path}: {e}")
            return None

    def write_csv(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write CSV file to local storage"""
        try:
            return self._write_csv_local(df, file_path)
        except Exception as e:
            safe_print(f"❌ Error writing CSV file {file_path}: {e}")
            return False

    # Local CSV methods
    def _read_csv_local(self, file_path: str) -> pd.DataFrame:
        """Read CSV file from local storage"""
        # Use data directory for organized local storage
        full_path = Path(__file__).parent.parent / 'data' / file_path
        if full_path.exists():
            return pd.read_csv(str(full_path))
        else:
            # Fallback to old location for backward compatibility
            fallback_path = Path(__file__).parent.parent / file_path
            if fallback_path.exists():
                return pd.read_csv(str(fallback_path))
            raise FileNotFoundError(f"Local file not found: {full_path} or {fallback_path}")

    def _write_csv_local(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write CSV file to local storage"""
        file_lock = self._get_file_lock(file_path)
        with file_lock:
            # Use data directory for organized local storage
            full_path = Path(__file__).parent.parent / 'data' / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            # Save with proper CSV quoting for string fields only
            import csv
            df.to_csv(str(full_path), index=False, quoting=csv.QUOTE_NONNUMERIC)
            safe_print(f"📁 Saved CSV file to local storage: {full_path}")
            return True

# Global storage service instance
storage_service = StorageService()
