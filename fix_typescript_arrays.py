#!/usr/bin/env python3
"""
Script to generate properly escaped TypeScript arrays from uraian CSV data.
This fixes the compilation errors caused by unescaped strings in the DEFAULT_CHECKLIST_ITEMS arrays.
"""

import pandas as pd
import json

def escape_typescript_string(text):
    """Properly escape a string for TypeScript."""
    if pd.isna(text) or text == '':
        return '""'

    # Convert to string and strip only leading/trailing whitespace
    text = str(text).strip()

    # Remove any surrounding quotes that might be from CSV parsing
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]

    # Replace problematic characters in the correct order
    text = text.replace('\\', '\\\\')  # Escape backslashes first
    text = text.replace('"', '\\"')    # Escape double quotes
    text = text.replace('\n', '\\n')   # Escape newlines
    text = text.replace('\r', '\\r')   # Escape carriage returns
    text = text.replace('\t', '\\t')   # Escape tabs

    return f'"{text}"'

def generate_typescript_array(uraian_items):
    """Generate a properly formatted TypeScript string array from uraian items."""

    typescript_items = []

    for uraian in uraian_items:
        # Escape the uraian string properly
        escaped_uraian = escape_typescript_string(uraian)
        typescript_items.append(f"  {escaped_uraian}")

    # Join all items with commas
    array_content = ',\n'.join(typescript_items)

    # Wrap in array declaration
    typescript_array = f"""const DEFAULT_CHECKLIST_ITEMS = [
{array_content}
];"""

    return typescript_array

def main():
    print("Loading uraian data from CSV...")

    # Read the uraian data
    df = pd.read_csv('/home/somitemp/Projects/Coding/Python/document-hub-penilaian-gcg/.claude/uraian_data.csv')
    uraian_items = df['uraian'].tolist()

    print(f"Found {len(uraian_items)} uraian items")

    # Generate the TypeScript array
    typescript_array = generate_typescript_array(uraian_items)

    # Write to output file for review
    output_file = '/home/somitemp/Projects/Coding/Python/document-hub-penilaian-gcg/generated_typescript_array.ts'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(typescript_array)

    print(f"Generated TypeScript array written to: {output_file}")
    print(f"Array contains {len(uraian_items)} items")

    # Show first few items as preview
    print("\nPreview of first 3 items:")
    for i, item in enumerate(uraian_items[:3]):
        escaped = escape_typescript_string(item)
        print(f"  {i+1}: {escaped}")

    print("\nTypeScript array ready for replacement in:")
    print("  - /src/pages/admin/PengaturanBaru.tsx")
    print("  - /src/contexts/ChecklistContext.tsx")

if __name__ == "__main__":
    main()