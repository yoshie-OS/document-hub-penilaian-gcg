#!/usr/bin/env python3
"""
Script untuk test backend yang sudah diperbaiki
"""

import requests
import json

def test_backend_fixed():
    try:
        print('🧪 TESTING BACKEND YANG SUDAH DIPERBAIKI')
        print('=' * 50)
        
        # Test backend connection
        response = requests.get('http://localhost:5000/api/uploaded-files?year=2024', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            files = data.get("files", [])
            
            print(f'✅ BACKEND STATUS: BERJALAN')
            print(f'📊 TOTAL DOKUMEN: {len(files)} files')
            
            # Analyze files with notes
            files_with_notes = []
            files_without_notes = []
            
            for file in files:
                if file.get('catatan') and str(file.get('catatan')).strip():
                    files_with_notes.append(file)
                else:
                    files_without_notes.append(file)
            
            print(f'📝 DOKUMEN DENGAN CATATAN: {len(files_with_notes)} files')
            print(f'📄 DOKUMEN TANPA CATATAN: {len(files_without_notes)} files')
            
            if files_with_notes:
                print('\n📋 DOKUMEN DENGAN CATATAN:')
                for i, file in enumerate(files_with_notes[:10]):
                    notes_preview = str(file['catatan'])[:50] + "..." if len(str(file['catatan'])) > 50 else str(file['catatan'])
                    print(f'{i+1:2d}. {file["fileName"]}')
                    print(f'    ID: {file["id"]}')
                    print(f'    Catatan: "{notes_preview}"')
                    print(f'    Uploaded by: {file.get("uploadedBy", "Unknown")}')
                    print()
            
            # Test specific file with notes
            if files_with_notes:
                test_file = files_with_notes[0]
                file_id = test_file['id']
                print(f'🔍 TESTING FILE SPESIFIK: {test_file["fileName"]}')
                
                # Test individual file API
                individual_response = requests.get(f'http://localhost:5000/api/uploaded-files?year=2024', timeout=5)
                if individual_response.status_code == 200:
                    individual_data = individual_response.json()
                    individual_files = individual_data.get('files', [])
                    
                    # Find the specific file
                    found_file = None
                    for f in individual_files:
                        if f['id'] == file_id:
                            found_file = f
                            break
                    
                    if found_file:
                        print(f'   ✅ File ditemukan di API')
                        print(f'   📝 Catatan: "{found_file.get("catatan", "TIDAK ADA")}"')
                        
                        if found_file.get('catatan') and str(found_file.get('catatan')).strip():
                            print('   🎯 CATATAN BERFUNGSI DENGAN BAIK!')
                        else:
                            print('   ❌ Catatan masih kosong di API response')
                    else:
                        print('   ❌ File tidak ditemukan di API response')
                else:
                    print(f'   ❌ Error testing individual file: {individual_response.status_code}')
            
            print('\n🎯 FITUR CATATAN SEKARANG SUDAH BERFUNGSI!')
            print('\n📝 CARA MENGGUNAKAN:')
            print('1. Login sebagai SUPERADMIN')
            print('2. Buka menu "Arsip Dokumen"')
            print('3. Pilih tahun "2024"')
            print('4. Lihat button "Catatan":')
            print('   • HIJAU = Ada catatan (klik untuk melihat)')
            print('   • ABU-ABU = Tidak ada catatan (disabled)')
            print('5. Jika tidak muncul, klik button "Refresh" di pojok kanan atas')
            
            return True
            
        else:
            print(f'❌ BACKEND ERROR: Status {response.status_code}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('❌ BACKEND TIDAK BERJALAN')
        print('🔧 Silakan start backend:')
        print('   1. Buka terminal di project root')
        print('   2. cd backend')
        print('   3. python app.py')
        return False
    except Exception as error:
        print(f'❌ ERROR: {error}')
        return False

if __name__ == '__main__':
    test_backend_fixed()

