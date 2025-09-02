"""
Storage Service - Handles file operations for both local and Supabase storage
"""

import os
import tempfile
from pathlib import Path
from typing import Optional
import pandas as pd
from supabase import create_client, Client

class StorageService:
    """Abstract storage service that can work with local files or Supabase storage"""
    
    def __init__(self):
        self.storage_mode = os.getenv('STORAGE_MODE', 'local')
        
        if self.storage_mode == 'supabase':
            self.supabase_url = os.getenv('SUPABASE_URL')
            self.supabase_key = os.getenv('SUPABASE_KEY')
            self.bucket_name = os.getenv('SUPABASE_BUCKET')
            
            if not all([self.supabase_url, self.supabase_key, self.bucket_name]):
                raise ValueError("Missing Supabase configuration. Check your .env file.")
            
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            print(f"✅ Supabase storage initialized - Bucket: {self.bucket_name}")
        else:
            print("✅ Local storage mode initialized")
    
    def read_excel(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read Excel file from storage"""
        try:
            if self.storage_mode == 'supabase':
                return self._read_excel_supabase(file_path)
            else:
                return self._read_excel_local(file_path)
        except Exception as e:
            print(f"❌ Error reading Excel file {file_path}: {e}")
            return None
    
    def write_excel(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write Excel file to storage"""
        try:
            if self.storage_mode == 'supabase':
                return self._write_excel_supabase(df, file_path)
            else:
                return self._write_excel_local(df, file_path)
        except Exception as e:
            print(f"❌ Error writing Excel file {file_path}: {e}")
            return False
    
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in storage"""
        try:
            if self.storage_mode == 'supabase':
                return self._file_exists_supabase(file_path)
            else:
                return self._file_exists_local(file_path)
        except Exception as e:
            print(f"❌ Error checking file existence {file_path}: {e}")
            return False
    
    # Local storage methods
    def _read_excel_local(self, file_path: str) -> pd.DataFrame:
        """Read Excel file from local storage"""
        full_path = Path(__file__).parent.parent / file_path
        if full_path.exists():
            return pd.read_excel(str(full_path))
        else:
            raise FileNotFoundError(f"Local file not found: {full_path}")
    
    def _write_excel_local(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write Excel file to local storage"""
        full_path = Path(__file__).parent.parent / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_excel(str(full_path), index=False)
        return True
    
    def _file_exists_local(self, file_path: str) -> bool:
        """Check if file exists in local storage"""
        full_path = Path(__file__).parent.parent / file_path
        return full_path.exists()
    
    # Supabase storage methods
    def _read_excel_supabase(self, file_path: str) -> pd.DataFrame:
        """Read Excel file from Supabase storage"""
        # Download file to temporary location
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Download from Supabase
            response = self.supabase.storage.from_(self.bucket_name).download(file_path)
            
            # Write to temp file
            with open(temp_path, 'wb') as f:
                f.write(response)
            
            # Read with pandas
            df = pd.read_excel(temp_path)
            print(f"📥 Downloaded and read Excel file: {file_path}")
            return df
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def _write_excel_supabase(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write Excel file to Supabase storage"""
        # Save to temporary location first
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Save DataFrame to temp file
            df.to_excel(temp_path, index=False)
            
            # Upload to Supabase
            with open(temp_path, 'rb') as f:
                file_data = f.read()
            
            # Upload (this will overwrite if file exists)
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_data,
                file_options={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
            )
            
            # If upload fails due to existing file, try update instead
            if hasattr(response, 'error') and response.error:
                if "already exists" in str(response.error):
                    response = self.supabase.storage.from_(self.bucket_name).update(
                        path=file_path,
                        file=file_data,
                        file_options={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                    )
            
            print(f"📤 Uploaded Excel file: {file_path}")
            return True
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def _file_exists_supabase(self, file_path: str) -> bool:
        """Check if file exists in Supabase storage"""
        try:
            files = self.supabase.storage.from_(self.bucket_name).list()
            # Simple check - in production you'd want more sophisticated path checking
            return any(f.get('name') == file_path.split('/')[-1] for f in files)
        except Exception:
            return False

# Global storage service instance
storage_service = StorageService()