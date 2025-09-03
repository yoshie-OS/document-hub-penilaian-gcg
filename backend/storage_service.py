"""
Storage Service - Handles file operations for both local and Supabase storage
"""

import os
import tempfile
from pathlib import Path
from typing import Optional
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

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
            
            # Try to upload, if file exists use update instead
            try:
                response = self.supabase.storage.from_(self.bucket_name).upload(
                    path=file_path,
                    file=file_data,
                    file_options={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                )
                
                # Check for upload errors
                if hasattr(response, 'error') and response.error:
                    raise Exception(f"Upload error: {response.error}")
                    
            except Exception as upload_error:
                if "already exists" in str(upload_error) or "Duplicate" in str(upload_error):
                    # File exists, try update instead
                    response = self.supabase.storage.from_(self.bucket_name).update(
                        path=file_path,
                        file=file_data,
                        file_options={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                    )
                    
                    # Check for update errors
                    if hasattr(response, 'error') and response.error:
                        raise Exception(f"Update error: {response.error}")
                else:
                    raise upload_error
            
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
    
    # CSV methods
    def read_csv(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read CSV file from storage"""
        try:
            if self.storage_mode == 'supabase':
                return self._read_csv_supabase(file_path)
            else:
                return self._read_csv_local(file_path)
        except Exception as e:
            print(f"❌ Error reading CSV file {file_path}: {e}")
            return None
    
    def write_csv(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write CSV file to storage"""
        try:
            if self.storage_mode == 'supabase':
                return self._write_csv_supabase(df, file_path)
            else:
                return self._write_csv_local(df, file_path)
        except Exception as e:
            print(f"❌ Error writing CSV file {file_path}: {e}")
            return False
    
    # Local CSV methods
    def _read_csv_local(self, file_path: str) -> pd.DataFrame:
        """Read CSV file from local storage"""
        full_path = Path(__file__).parent.parent / file_path
        if full_path.exists():
            return pd.read_csv(str(full_path))
        else:
            raise FileNotFoundError(f"Local file not found: {full_path}")
    
    def _write_csv_local(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write CSV file to local storage"""
        full_path = Path(__file__).parent.parent / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(str(full_path), index=False)
        return True
    
    # Supabase CSV methods
    def _read_csv_supabase(self, file_path: str) -> pd.DataFrame:
        """Read CSV file from Supabase storage"""
        print(f"🔍 DEBUG: Starting Supabase CSV read for {file_path}")
        
        # Download file to temporary location
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Download from Supabase
            print(f"🔍 DEBUG: Downloading from bucket: {self.bucket_name}")
            response = self.supabase.storage.from_(self.bucket_name).download(file_path)
            print(f"🔍 DEBUG: Download response size: {len(response)} bytes")
            
            # Write to temp file
            with open(temp_path, 'wb') as f:
                f.write(response)
            print(f"🔍 DEBUG: Written to temp file: {temp_path}")
            
            # Read with pandas
            df = pd.read_csv(temp_path)
            print(f"🔍 DEBUG: Read DataFrame shape: {df.shape}")
            print(f"🔍 DEBUG: DataFrame preview:\n{df.head()}")
            print(f"📥 Downloaded and read CSV file: {file_path}")
            return df
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                print(f"🔍 DEBUG: Cleaned up temp file: {temp_path}")
    
    def _write_csv_supabase(self, df: pd.DataFrame, file_path: str) -> bool:
        """Write CSV file to Supabase storage"""
        print(f"🔍 DEBUG: Starting Supabase CSV write for {file_path}")
        print(f"🔍 DEBUG: DataFrame shape: {df.shape}")
        print(f"🔍 DEBUG: DataFrame preview:\n{df.head()}")
        
        # Save to temporary location first
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Save DataFrame to temp file
            df.to_csv(temp_path, index=False)
            print(f"🔍 DEBUG: Saved to temp file: {temp_path}")
            
            # Upload to Supabase
            with open(temp_path, 'rb') as f:
                file_data = f.read()
            print(f"🔍 DEBUG: Read {len(file_data)} bytes from temp file")
            print(f"🔍 DEBUG: Bucket: {self.bucket_name}")
            print(f"🔍 DEBUG: File path: {file_path}")
            
            # Try to upload, if file exists use update instead
            try:
                print("🔍 DEBUG: Attempting upload...")
                response = self.supabase.storage.from_(self.bucket_name).upload(
                    path=file_path,
                    file=file_data,
                    file_options={"content-type": "text/csv"}
                )
                print(f"🔍 DEBUG: Upload response: {response}")
                
                # Check for upload errors
                if hasattr(response, 'error') and response.error:
                    print(f"🔍 DEBUG: Upload error detected: {response.error}")
                    raise Exception(f"Upload error: {response.error}")
                else:
                    print("🔍 DEBUG: Upload successful!")
                    
            except Exception as upload_error:
                print(f"🔍 DEBUG: Upload exception: {upload_error}")
                # If upload fails, try update instead (file might already exist)
                if "already exists" in str(upload_error).lower() or "duplicate" in str(upload_error).lower():
                    print("🔍 DEBUG: File exists, attempting update...")
                    response = self.supabase.storage.from_(self.bucket_name).update(
                        path=file_path,
                        file=file_data,
                        file_options={"content-type": "text/csv"}
                    )
                    print(f"🔍 DEBUG: Update response: {response}")
                    
                    # Check for update errors
                    if hasattr(response, 'error') and response.error:
                        print(f"🔍 DEBUG: Update error detected: {response.error}")
                        raise Exception(f"Update error: {response.error}")
                    else:
                        print("🔍 DEBUG: Update successful!")
                else:
                    print(f"🔍 DEBUG: Unhandled upload error: {upload_error}")
                    raise upload_error
            
            print(f"📤 Uploaded CSV file: {file_path}")
            return True
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                print(f"🔍 DEBUG: Cleaned up temp file: {temp_path}")

# Global storage service instance
storage_service = StorageService()