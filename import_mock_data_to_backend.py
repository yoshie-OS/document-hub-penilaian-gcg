#!/usr/bin/env python3
"""
Script untuk import mock data ke backend database
Menggunakan API backend untuk menyimpan data
"""

import csv
import json
import requests
import time
from pathlib import Path

API_BASE_URL = "http://localhost:5000/api"

def import_gcg_data():
    """Import GCG assessment data ke backend"""
    print("Importing GCG Data...")
    
    gcg_file = Path("data/config/gcg-assessments-mock.csv")
    if not gcg_file.exists():
        print(f"[SKIP] GCG data file not found: {gcg_file}")
        return
    
    with open(gcg_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Group by year and convert to API format
    # Note: Adjust this based on your actual backend API structure
    print(f"[INFO] Found {len(rows)} GCG data rows")
    print("[INFO] GCG data should be imported via file upload in the application")
    print("[INFO] Use the generated CSV file for manual upload or adjust backend API")

def import_users():
    """Import users ke backend"""
    print("Importing Users...")
    
    users_file = Path("data/config/users.csv")
    if not users_file.exists():
        print(f"[SKIP] Users file not found: {users_file}")
        return
    
    with open(users_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        users = list(reader)
    
    print(f"[INFO] Found {len(users)} users")
    print("[INFO] Users should be imported via admin panel or backend API")
    
    # Example API call (adjust based on your API)
    # for user in users:
    #     try:
    #         response = requests.post(f"{API_BASE_URL}/users", json=user)
    #         if response.status_code == 201:
    #             print(f"[OK] Imported user: {user['email']}")
    #         else:
    #             print(f"[ERROR] Failed to import user {user['email']}: {response.status_code}")
    #     except Exception as e:
    #         print(f"[ERROR] Error importing user {user['email']}: {e}")

def import_checklist():
    """Import checklist items"""
    print("Importing Checklist...")
    
    checklist_file = Path("data/config/checklist.csv")
    if not checklist_file.exists():
        print(f"[SKIP] Checklist file not found: {checklist_file}")
        return
    
    with open(checklist_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        items = list(reader)
    
    print(f"[INFO] Found {len(items)} checklist items")
    print("[INFO] Checklist items should be imported via admin panel")

def import_aoi_data():
    """Import AOI tables and recommendations"""
    print("Importing AOI Data...")
    
    aoi_tables_file = Path("data/config/aoi-tables.csv")
    aoi_recs_file = Path("data/config/aoi-recommendations.csv")
    
    if aoi_tables_file.exists():
        with open(aoi_tables_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            tables = list(reader)
        print(f"[INFO] Found {len(tables)} AOI tables")
    
    if aoi_recs_file.exists():
        with open(aoi_recs_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            recs = list(reader)
        print(f"[INFO] Found {len(recs)} AOI recommendations")
    
    print("[INFO] AOI data should be imported via admin panel")

def main():
    """Main import function"""
    print("=" * 60)
    print("Mock Data Import Script")
    print("=" * 60)
    print()
    print("[INFO] This script shows what data is available for import")
    print("[INFO] Actual import should be done via:")
    print("  1. Admin panel in the application")
    print("  2. Backend API endpoints")
    print("  3. File upload features in the application")
    print()
    
    try:
        import_gcg_data()
        print()
        import_users()
        print()
        import_checklist()
        print()
        import_aoi_data()
        print()
        print("=" * 60)
        print("[OK] Data availability check complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()


