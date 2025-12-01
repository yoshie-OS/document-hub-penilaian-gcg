#!/usr/bin/env python3
"""
Script untuk generate data mock yang lengkap untuk aplikasi Document Hub Penilaian GCG
Data yang di-generate:
1. GCG Assessment Data untuk multiple years (2014-2025)
2. Users dengan berbagai divisi
3. Checklist assignments
4. AOI Tables dan Recommendations
5. Document metadata
6. File upload records
"""

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Setup paths
DATA_DIR = Path("data/config")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Roman numerals untuk aspek
ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']
ASPECT_NAMES = {
    'I': 'ASPEK I. Komitmen Terhadap Penerapan Tata Kelola Perusahaan yang Baik Secara Berkelanjutan',
    'II': 'ASPEK II. Pemegang Saham dan RUPS/Pemilik Modal',
    'III': 'ASPEK III. Dewan Komisaris/Dewan Pengawas',
    'IV': 'ASPEK IV. Direksi',
    'V': 'ASPEK V. Pengungkapan Informasi dan Transparansi',
    'VI': 'ASPEK VI. Aspek Lainnya'
}

# Penilai options
PENILAI_OPTIONS = [
    'PT. KAP Audit Indonesia',
    'Deloitte Touche Solutions',
    'Ernst & Young Indonesia',
    'PricewaterhouseCoopers Indonesia',
    'KPMG Siddharta Siddharta & Harsono',
    'Internal Audit Team',
    'Konsultan GCG Eksternal'
]

JENIS_PENILAIAN_OPTIONS = [
    'Self Assessment',
    'External Assessment',
    'Internal Assessment',
    'Hybrid Assessment',
    'Regulatory Assessment'
]

# Divisi dan Subdirektorat dari struktur organisasi
DIVISI_LIST = [
    'Divisi Regulation',
    'Divisi Corporate Communication',
    'Divisi legal',
    'Divisi Human Capital Business Partner',
    'Divisi Enterprise Risk Management',
    'Divisi Financial Operation and Business Partner',
    'Divisi Corporate Strategic Planning and Synergy Business',
    'Divisi Fronting Business',
    'Divisi Payment',
    'Divisi Digital Services',
    'Sekretaris Dewan Komisaris'
]

SUBDIREKTORAT_LIST = [
    'Corporate Secretary and ESG',
    'Sub Direktorat Government and Corporate Business',
    'Sub Direktorat Financial Operations And Business Partner',
    'Sub Direktorat Strategic Planning and Business Development',
    'Sekretaris Dewan Komisaris'
]

def generate_gcg_data():
    """Generate GCG assessment data untuk multiple years"""
    print("Generating GCG Data...")
    
    years = list(range(2014, 2026))  # 2014-2025
    gcg_data = []
    
    for year in years:
        # Base score yang meningkat setiap tahun (trend positif)
        base_score = 65 + (year - 2014) * 2.5 + random.uniform(-3, 3)
        base_score = max(50, min(95, base_score))  # Clamp between 50-95
        
        # Generate data untuk setiap level
        # Level 1: Header untuk setiap aspek
        # Level 2: Detail penjelasan
        # Level 3: Subtotal per aspek
        # Level 4: Total
        
        total_skor = 0
        total_bobot = 0
        
        # Generate Level 1, 2, 3 untuk setiap aspek
        for idx, roman in enumerate(ROMAN_NUMERALS):
            # Bobot per aspek (total 100)
            bobot_aspek = [20, 15, 15, 20, 15, 15][idx]
            
            # Skor per aspek (dengan variasi)
            skor_aspek = base_score * (bobot_aspek / 100) + random.uniform(-5, 5)
            skor_aspek = max(0, min(bobot_aspek, skor_aspek))
            
            # Capaian per aspek
            capaian_aspek = (skor_aspek / bobot_aspek) * 100 if bobot_aspek > 0 else 0
            capaian_aspek = max(0, min(100, capaian_aspek))
            
            # Jumlah parameter per aspek
            jumlah_parameter = random.randint(15, 35)
            
            # Level 1: Header
            gcg_data.append({
                'Tahun': year,
                'Level': 1,
                'Section': roman,
                'Deskripsi': ASPECT_NAMES[roman],
                'Bobot': bobot_aspek,
                'Skor': 0,
                'Capaian': 0,
                'Jumlah_Parameter': 0,
                'Penjelasan': f'Header untuk {ASPECT_NAMES[roman]}',
                'Penilai': random.choice(PENILAI_OPTIONS),
                'Jenis_Penilaian': random.choice(JENIS_PENILAIAN_OPTIONS)
            })
            
            # Level 2: Detail penjelasan (3-5 rows per aspek)
            num_details = random.randint(3, 5)
            for detail_idx in range(num_details):
                detail_skor = skor_aspek / num_details + random.uniform(-1, 1)
                detail_bobot = bobot_aspek / num_details
                detail_capaian = (detail_skor / detail_bobot) * 100 if detail_bobot > 0 else 0
                
                gcg_data.append({
                    'Tahun': year,
                    'Level': 2,
                    'Section': roman,
                    'Deskripsi': f'Detail {detail_idx + 1} untuk Aspek {roman}',
                    'Bobot': round(detail_bobot, 2),
                    'Skor': round(detail_skor, 2),
                    'Capaian': round(detail_capaian, 2),
                    'Jumlah_Parameter': jumlah_parameter // num_details,
                    'Penjelasan': f'Penjelasan detail implementasi untuk Aspek {roman} pada tahun {year}. Pencapaian menunjukkan peningkatan yang konsisten dalam penerapan GCG.',
                    'Penilai': random.choice(PENILAI_OPTIONS),
                    'Jenis_Penilaian': random.choice(JENIS_PENILAIAN_OPTIONS)
                })
            
            # Level 3: Subtotal per aspek
            gcg_data.append({
                'Tahun': year,
                'Level': 3,
                'Section': roman,
                'Deskripsi': f'Subtotal Aspek {roman}',
                'Bobot': bobot_aspek,
                'Skor': round(skor_aspek, 2),
                'Capaian': round(capaian_aspek, 2),
                'Jumlah_Parameter': jumlah_parameter,
                'Penjelasan': f'Total capaian Aspek {roman} menunjukkan {capaian_aspek:.1f}% dari target. Pencapaian ini mencerminkan komitmen perusahaan dalam implementasi GCG.',
                'Penilai': random.choice(PENILAI_OPTIONS),
                'Jenis_Penilaian': random.choice(JENIS_PENILAIAN_OPTIONS)
            })
            
            total_skor += skor_aspek
            total_bobot += bobot_aspek
        
        # Level 4: Total
        total_capaian = (total_skor / total_bobot) * 100 if total_bobot > 0 else 0
        gcg_data.append({
            'Tahun': year,
            'Level': 4,
            'Section': '',
            'Deskripsi': 'TOTAL',
            'Bobot': round(total_bobot, 2),
            'Skor': round(total_skor, 2),
            'Capaian': round(total_capaian, 2),
            'Jumlah_Parameter': sum([random.randint(15, 35) for _ in ROMAN_NUMERALS]),
            'Penjelasan': f'Total skor GCG tahun {year} adalah {total_skor:.2f} dari bobot {total_bobot:.2f}, dengan capaian {total_capaian:.2f}%. Perusahaan menunjukkan komitmen yang kuat dalam penerapan Good Corporate Governance.',
            'Penilai': random.choice(PENILAI_OPTIONS),
            'Jenis_Penilaian': random.choice(JENIS_PENILAIAN_OPTIONS)
        })
    
    # Save to CSV
    csv_file = DATA_DIR / 'gcg-assessments-mock.csv'
    if gcg_data:
        fieldnames = ['Tahun', 'Level', 'Section', 'Deskripsi', 'Bobot', 'Skor', 'Capaian', 
                     'Jumlah_Parameter', 'Penjelasan', 'Penilai', 'Jenis_Penilaian']
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(gcg_data)
        print(f"[OK] Generated {len(gcg_data)} GCG data rows -> {csv_file}")
    
    return gcg_data

def generate_users():
    """Generate additional users dengan berbagai divisi"""
    print("Generating Users...")
    
    # Read existing users
    existing_users = []
    users_file = DATA_DIR / 'users.csv'
    if users_file.exists():
        with open(users_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_users = list(reader)
    
    # Generate new users
    new_users = []
    user_id_start = 1000
    
    # Generate admin users untuk setiap divisi
    for idx, divisi in enumerate(DIVISI_LIST):
        # Get subdirektorat untuk divisi ini
        subdirektorat = 'Corporate Secretary and ESG' if 'Regulation' in divisi or 'Corporate' in divisi else random.choice(SUBDIREKTORAT_LIST)
        
        # Generate 1-2 users per divisi
        for user_num in range(random.randint(1, 2)):
            user_id = user_id_start + idx * 10 + user_num
            name = f"Admin {divisi.split()[-1]} {user_num + 1}"
            email = f"admin.{divisi.lower().replace(' ', '.').replace('/', '.')}.{user_num + 1}@posindo.id"
            
            new_users.append({
                'id': user_id,
                'name': name,
                'email': email,
                'password': 'admin123',
                'role': 'admin',
                'direktorat': 'Corporate Secretary and ESG' if 'Corporate' in divisi or 'Regulation' in divisi else random.choice(['Direktorat Bisnis Jasa Keuangan', 'Direktorat Keuangan dan Manajemen Risiko']),
                'subdirektorat': subdirektorat,
                'divisi': divisi,
                'status': 'active',
                'tahun': '',
                'created_at': datetime.now().isoformat(),
                'is_active': 1,
                'whatsapp': f'6281{random.randint(10000000, 99999999)}'
            })
    
    # Combine existing and new users
    all_users = existing_users + new_users
    
    # Save to CSV
    if all_users:
        fieldnames = ['id', 'name', 'email', 'password', 'role', 'direktorat', 'subdirektorat', 
                     'divisi', 'status', 'tahun', 'created_at', 'is_active', 'whatsapp']
        with open(users_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_users)
        print(f"[OK] Generated {len(new_users)} new users, total {len(all_users)} users -> {users_file}")
    
    return all_users

def generate_checklist_assignments():
    """Generate checklist assignments untuk multiple years"""
    print("Generating Checklist Assignments...")
    
    # Read existing checklist
    existing_checklist = []
    checklist_file = DATA_DIR / 'checklist.csv'
    if checklist_file.exists():
        with open(checklist_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_checklist = list(reader)
    
    # Generate assignments untuk years yang belum ada
    years = [2020, 2021, 2022, 2023, 2024, 2025]
    new_checklist = []
    
    # Get unique aspects and descriptions from existing
    aspect_descriptions = {}
    for item in existing_checklist:
        if item.get('aspek') and item.get('deskripsi'):
            aspect = item['aspek']
            if aspect not in aspect_descriptions:
                aspect_descriptions[aspect] = []
            if item['deskripsi'] not in aspect_descriptions[aspect]:
                aspect_descriptions[aspect].append(item['deskripsi'])
    
    # Generate for each year
    for year in years:
        row_number = 1
        for aspect, descriptions in aspect_descriptions.items():
            for desc in descriptions[:random.randint(3, min(8, len(descriptions)))]:  # Random subset
                checklist_id = int(f"{year}{row_number:04d}")
                new_checklist.append({
                    'id': checklist_id,
                    'aspek': aspect,
                    'deskripsi': desc,
                    'pic': random.choice(DIVISI_LIST),
                    'tahun': year,
                    'rowNumber': row_number,
                    'created_at': datetime.now().isoformat()
                })
                row_number += 1
    
    # Combine
    all_checklist = existing_checklist + new_checklist
    
    # Save
    if all_checklist:
        fieldnames = ['id', 'aspek', 'deskripsi', 'pic', 'tahun', 'rowNumber', 'created_at']
        with open(checklist_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_checklist)
        print(f"[OK] Generated {len(new_checklist)} new checklist items, total {len(all_checklist)} -> {checklist_file}")
    
    return all_checklist

def generate_aoi_data():
    """Generate AOI tables dan recommendations"""
    print("Generating AOI Data...")
    
    # AOI Tables
    aoi_tables = []
    years = [2020, 2021, 2022, 2023, 2024, 2025]
    table_id = 1000
    
    for year in years:
        # Generate 2-4 AOI tables per year
        num_tables = random.randint(2, 4)
        for table_num in range(num_tables):
            target_type = random.choice(['direktorat', 'subdirektorat', 'divisi'])
            target_direktorat = random.choice(['Corporate Secretary and ESG', 'Direktorat Bisnis Jasa Keuangan']) if target_type != 'divisi' else ''
            target_subdirektorat = random.choice(SUBDIREKTORAT_LIST) if target_type == 'divisi' else ''
            target_divisi = random.choice(DIVISI_LIST) if target_type == 'divisi' else ''
            
            aoi_tables.append({
                'id': table_id,
                'nama': f'AOI GCG {year} - {target_direktorat or target_subdirektorat or target_divisi}',
                'tahun': year,
                'targetType': target_type,
                'targetDirektorat': target_direktorat,
                'targetSubdirektorat': target_subdirektorat,
                'targetDivisi': target_divisi,
                'createdAt': datetime.now().isoformat(),
                'status': 'active'
            })
            table_id += 1
    
    # Save AOI Tables
    aoi_tables_file = DATA_DIR / 'aoi-tables.csv'
    if aoi_tables:
        fieldnames = ['id', 'nama', 'tahun', 'targetType', 'targetDirektorat', 'targetSubdirektorat', 
                     'targetDivisi', 'createdAt', 'status']
        with open(aoi_tables_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(aoi_tables)
        print(f"[OK] Generated {len(aoi_tables)} AOI tables -> {aoi_tables_file}")
    
    # AOI Recommendations
    aoi_recommendations = []
    rec_id = 10000
    
    for table in aoi_tables:
        # Generate 3-8 recommendations per table
        num_recs = random.randint(3, 8)
        for rec_num in range(num_recs):
            jenis = random.choice(['REKOMENDASI', 'SARAN'])
            tingkat_urgensi = random.choice(['RENDAH', 'SEDANG', 'TINGGI'])
            pihak_terkait = random.choice(['RUPS', 'DEWAN KOMISARIS', 'DIREKSI', 'SEKRETARIS PERUSAHAAN', 'KOMITE'])
            
            # Generate realistic recommendation text
            if jenis == 'REKOMENDASI':
                isi = f"Perlu dilakukan peningkatan dalam implementasi {random.choice(['tata kelola', 'manajemen risiko', 'pengendalian internal', 'kepatuhan'])} untuk meningkatkan efektivitas GCG."
            else:
                isi = f"Disarankan untuk melakukan {random.choice(['review', 'evaluasi', 'penyempurnaan'])} terhadap {random.choice(['prosedur', 'kebijakan', 'sistem'])} yang ada."
            
            aoi_recommendations.append({
                'id': rec_id,
                'aoiTableId': table['id'],
                'jenis': jenis,
                'no': rec_num + 1,
                'isi': isi,
                'tingkatUrgensi': tingkat_urgensi,
                'aspekAOI': random.choice(ROMAN_NUMERALS),
                'pihakTerkait': pihak_terkait,
                'organPerusahaan': pihak_terkait,
                'createdAt': datetime.now().isoformat(),
                'status': 'active'
            })
            rec_id += 1
    
    # Save AOI Recommendations
    aoi_recs_file = DATA_DIR / 'aoi-recommendations.csv'
    if aoi_recommendations:
        fieldnames = ['id', 'aoiTableId', 'jenis', 'no', 'isi', 'tingkatUrgensi', 'aspekAOI', 
                     'pihakTerkait', 'organPerusahaan', 'createdAt', 'status']
        with open(aoi_recs_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(aoi_recommendations)
        print(f"[OK] Generated {len(aoi_recommendations)} AOI recommendations -> {aoi_recs_file}")
    
    return aoi_tables, aoi_recommendations

def generate_document_metadata():
    """Generate document metadata untuk dashboard"""
    print("Generating Document Metadata...")
    
    # This would typically be stored in database, but we'll create a JSON file
    # that can be imported
    documents = []
    doc_id = 10000
    years = [2020, 2021, 2022, 2023, 2024, 2025]
    
    for year in years:
        # Generate documents for each divisi
        for divisi in DIVISI_LIST[:5]:  # Limit to first 5 divisi
            # Generate 5-15 documents per divisi per year
            num_docs = random.randint(5, 15)
            for doc_num in range(num_docs):
                aspect = random.choice(ROMAN_NUMERALS)
                status = random.choice(['completed', 'pending', 'in_progress'])
                
                documents.append({
                    'id': str(doc_id),
                    'fileName': f'Document_{divisi.replace(" ", "_")}_{year}_{doc_num + 1}.pdf',
                    'aspect': f'ASPEK {aspect}',
                    'subdirektorat': random.choice(SUBDIREKTORAT_LIST),
                    'divisi': divisi,
                    'year': year,
                    'uploadDate': (datetime(year, random.randint(1, 12), random.randint(1, 28))).isoformat(),
                    'status': status,
                    'fileSize': random.randint(100, 5000),  # KB
                    'checklistId': random.randint(200, 300)
                })
                doc_id += 1
    
    # Save to JSON
    metadata_file = DATA_DIR / 'document-metadata-mock.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2, ensure_ascii=False)
    print(f"[OK] Generated {len(documents)} document metadata -> {metadata_file}")
    
    return documents

def main():
    """Main function to generate all mock data"""
    print("=" * 60)
    print("Generating Comprehensive Mock Data for Document Hub GCG")
    print("=" * 60)
    print()
    
    try:
        # Generate all data
        gcg_data = generate_gcg_data()
        users = generate_users()
        checklist = generate_checklist_assignments()
        aoi_tables, aoi_recs = generate_aoi_data()
        documents = generate_document_metadata()
        
        print()
        print("=" * 60)
        print("[OK] Mock Data Generation Complete!")
        print("=" * 60)
        print(f"GCG Data: {len(gcg_data)} rows")
        print(f"Users: {len(users)} users")
        print(f"Checklist: {len(checklist)} items")
        print(f"AOI Tables: {len(aoi_tables)} tables")
        print(f"AOI Recommendations: {len(aoi_recs)} recommendations")
        print(f"Documents: {len(documents)} documents")
        print()
        print("Files generated in:", DATA_DIR.absolute())
        
    except Exception as e:
        print(f"[ERROR] Error generating mock data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

