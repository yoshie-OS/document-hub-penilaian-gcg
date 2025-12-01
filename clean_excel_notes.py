#!/usr/bin/env python3
"""
Script untuk membersihkan data catatan dari Excel
"""

import pandas as pd
import os

def clean_excel_notes():
    try:
        print('🧹 MEMBERSIHKAN DATA CATATAN DARI EXCEL')
        print('=' * 50)
        
        # Check if file exists
        file_path = 'uploaded-files.xlsx'
        if not os.path.exists(file_path):
            print(f'❌ File {file_path} tidak ditemukan!')
            return False
        
        # Read Excel file
        print(f'📁 Membaca file: {file_path}')
        df = pd.read_excel(file_path)
        
        print(f'📊 Data sebelum pembersihan: {len(df)} rows, {len(df.columns)} columns')
        
        # Check for catatan column
        if 'catatan' in df.columns:
            print(f'📝 Kolom catatan ditemukan')
            
            # Count non-empty notes
            notes_count = df['catatan'].dropna().apply(lambda x: str(x).strip() != '').sum()
            print(f'📝 Catatan yang akan dihapus: {notes_count} files')
            
            # Remove catatan column
            df = df.drop('catatan', axis=1)
            print(f'✅ Kolom catatan dihapus')
        else:
            print(f'⚠️  Kolom catatan tidak ditemukan')
        
        # Check for duplicate catatan column (catatan.1)
        if 'catatan.1' in df.columns:
            df = df.drop('catatan.1', axis=1)
            print(f'✅ Kolom catatan.1 dihapus')
        
        # Save cleaned file
        print(f'💾 Menyimpan file yang sudah dibersihkan...')
        df.to_excel(file_path, index=False)
        
        print(f'📊 Data setelah pembersihan: {len(df)} rows, {len(df.columns)} columns')
        
        print('\n✅ DATA CATATAN BERHASIL DIBERSIHKAN!')
        print('🎯 File Excel sekarang tidak memiliki kolom catatan')
        
        return True
        
    except Exception as error:
        print(f'❌ Error: {error}')
        return False

if __name__ == '__main__':
    clean_excel_notes()

