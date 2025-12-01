#!/usr/bin/env python3
"""
Script untuk diagnosa lengkap masalah catatan
"""

import pandas as pd
import requests
import json
import os

def diagnose_notes_complete():
    try:
        print('🔍 DIAGNOSA LENGKAP MASALAH CATATAN')
        print('=' * 50)
        
        # 1. Check Excel file structure
        print('📊 1. MEMERIKSA FILE EXCEL...')
        if os.path.exists('uploaded-files.xlsx'):
            df = pd.read_excel('uploaded-files.xlsx')
            print(f'   ✅ File ada: {len(df)} rows, {len(df.columns)} columns')
            
            if 'catatan' in df.columns:
                notes_count = df['catatan'].dropna().apply(lambda x: str(x).strip() != '').sum()
                print(f'   ✅ Kolom catatan ada: {notes_count} catatan')
                
                # Show sample notes
                notes_sample = df[df['catatan'].notna() & (df['catatan'].astype(str).str.strip() != '')]
                print(f'   📝 Sample catatan:')
                for i, (idx, row) in enumerate(notes_sample.head(3).iterrows()):
                    print(f'      {i+1}. {row["fileName"]}: "{row["catatan"][:30]}..."')
            else:
                print('   ❌ Kolom catatan tidak ada!')
        else:
            print('   ❌ File uploaded-files.xlsx tidak ditemukan!')
        
        # 2. Check backend API
        print('\n🌐 2. MEMERIKSA BACKEND API...')
        try:
            response = requests.get('http://localhost:5000/api/uploaded-files?year=2024', timeout=5)
            if response.status_code == 200:
                data = response.json()
                files = data.get('files', [])
                print(f'   ✅ API berjalan: {len(files)} files')
                
                # Check catatan in API response
                files_with_notes = [f for f in files if f.get('catatan') and str(f.get('catatan')).strip()]
                print(f'   📝 Files dengan catatan di API: {len(files_with_notes)}')
                
                if files_with_notes:
                    print('   📋 Sample API response:')
                    for i, file in enumerate(files_with_notes[:3]):
                        print(f'      {i+1}. {file["fileName"]}: "{str(file["catatan"])[:30]}..."')
                else:
                    print('   ❌ Tidak ada catatan di API response!')
                    
            else:
                print(f'   ❌ API error: {response.status_code}')
        except Exception as e:
            print(f'   ❌ API tidak bisa diakses: {e}')
        
        # 3. Check specific file with notes
        print('\n🔍 3. MEMERIKSA FILE SPESIFIK DENGAN CATATAN...')
        try:
            # Find a file with notes
            df_with_notes = df[df['catatan'].notna() & (df['catatan'].astype(str).str.strip() != '')]
            if len(df_with_notes) > 0:
                test_file = df_with_notes.iloc[0]
                file_id = test_file['id']
                print(f'   📁 Test file: {test_file["fileName"]} (ID: {file_id})')
                print(f'   📝 Catatan: "{test_file["catatan"]}"')
                
                # Test specific API call
                response = requests.get(f'http://localhost:5000/api/uploaded-files?year=2024&id={file_id}', timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('files'):
                        file_data = data['files'][0]
                        print(f'   ✅ API file data: catatan = "{file_data.get("catatan", "TIDAK ADA")}"')
                    else:
                        print('   ❌ API tidak mengembalikan file data')
                else:
                    print(f'   ❌ API error untuk file spesifik: {response.status_code}')
            else:
                print('   ❌ Tidak ada file dengan catatan untuk test')
                
        except Exception as e:
            print(f'   ❌ Error testing file spesifik: {e}')
        
        # 4. Check data consistency
        print('\n🔄 4. MEMERIKSA KONSISTENSI DATA...')
        try:
            # Compare Excel vs API
            excel_notes = df[df['catatan'].notna() & (df['catatan'].astype(str).str.strip() != '')]
            api_notes = [f for f in files if f.get('catatan') and str(f.get('catatan')).strip()]
            
            print(f'   📊 Excel dengan catatan: {len(excel_notes)}')
            print(f'   🌐 API dengan catatan: {len(api_notes)}')
            
            if len(excel_notes) != len(api_notes):
                print('   ⚠️  Jumlah catatan tidak sama antara Excel dan API!')
                
                # Find differences
                excel_ids = set(excel_notes['id'].astype(str))
                api_ids = set(f['id'] for f in api_notes)
                
                missing_in_api = excel_ids - api_ids
                missing_in_excel = api_ids - excel_ids
                
                if missing_in_api:
                    print(f'   ❌ Missing in API: {len(missing_in_api)} files')
                if missing_in_excel:
                    print(f'   ❌ Missing in Excel: {len(missing_in_excel)} files')
            else:
                print('   ✅ Jumlah catatan konsisten')
                
        except Exception as e:
            print(f'   ❌ Error checking consistency: {e}')
        
        print('\n🎯 DIAGNOSA SELESAI')
        
    except Exception as error:
        print(f'❌ Error dalam diagnosa: {error}')

if __name__ == '__main__':
    diagnose_notes_complete()

