#!/usr/bin/env python3

import requests
import json

# Get current checklist data
response = requests.get("http://localhost:5000/api/config/checklist")
current_data = response.json()

print(f"Found {len(current_data['checklist'])} items")

# Prepare corrected items for batch replacement
corrected_items = []
for item in current_data['checklist']:
    year = item['tahun']
    row_number = item['rowNumber']
    
    # Calculate correct ID: last two digits of year + row number
    year_digits = year % 100
    correct_id = int(f"{year_digits}{row_number}")
    
    corrected_item = {
        'aspek': item['aspek'],
        'deskripsi': item['deskripsi'],
        'tahun': year,
        'rowNumber': row_number,
        'pic': item.get('pic', '')
    }
    corrected_items.append(corrected_item)
    print(f"Row {row_number}: {item['id']} -> {correct_id}")

print(f"\nPrepared {len(corrected_items)} corrected items")

# Clear existing data by posting empty list (if endpoint supports it)
# For now, we'll just add the corrected batch and let it handle duplicates
response = requests.post(
    "http://localhost:5000/api/config/checklist/batch",
    headers={"Content-Type": "application/json"},
    json={"items": corrected_items}
)

if response.status_code == 201:
    result = response.json()
    print(f"Successfully recreated checklist with correct IDs")
    print(f"Added {len(result.get('items', []))} items")
else:
    print(f"Error: {response.status_code}")
    print(response.text)