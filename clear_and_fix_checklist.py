#!/usr/bin/env python3

import pandas as pd
import requests
import json

def generate_checklist_id(year, row_number):
    """Generate checklist ID in format: last two digits of year + row number"""
    year_digits = year % 100
    return int(f"{year_digits}{row_number}")

# Get current checklist data  
response = requests.get("http://localhost:5000/api/config/checklist")
current_data = response.json()

print(f"Found {len(current_data['checklist'])} items to fix")

# Extract unique items with PIC assignments preserved
fixed_items = []
for item in current_data['checklist']:
    year = item['tahun'] 
    row_number = item['rowNumber']
    correct_id = generate_checklist_id(year, row_number)
    
    fixed_item = {
        'id': correct_id,
        'aspek': item['aspek'],
        'deskripsi': item['deskripsi'],
        'tahun': year,
        'rowNumber': row_number,
        'pic': item.get('pic', ''),
        'created_at': '2025-09-11T12:01:38.000000'  # Use a standard timestamp
    }
    fixed_items.append(fixed_item)

# Create DataFrame and save directly using Python 
# (bypassing the API to avoid ID generation conflicts)
df = pd.DataFrame(fixed_items)

# Print first few items to verify
print("\nFirst 5 corrected items:")
for i in range(min(5, len(fixed_items))):
    item = fixed_items[i]
    print(f"Row {item['rowNumber']}: ID {item['id']}, PIC: '{item['pic']}'")

print(f"\nCreated {len(fixed_items)} items with correct ID format")
print("To apply this fix, the backend storage will need to be updated directly.")

# Show a few examples of the ID transformation
print("\nID format examples:")
for row in [1, 2, 10, 100, 256]:
    if row <= len(fixed_items):
        correct_id = generate_checklist_id(2025, row)
        print(f"  2025 row {row:3d} -> ID {correct_id}")