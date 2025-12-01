#!/usr/bin/env python3
"""
Script to update DEFAULT_CHECKLIST_ITEMS arrays in both TypeScript files.
This fixes the compilation errors by replacing the broken arrays with properly escaped versions.
"""

import re

def update_typescript_file(file_path, array_content):
    """Update the DEFAULT_CHECKLIST_ITEMS array in a TypeScript file."""
    print(f"Updating {file_path}...")

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the pattern to match the entire DEFAULT_CHECKLIST_ITEMS array
    # This pattern matches from the declaration to the closing bracket and semicolon
    pattern = r'(const DEFAULT_CHECKLIST_ITEMS = \[)\s*[\s\S]*?(\];)'

    # Create the replacement content
    replacement = r'\1\n' + array_content + r'\n\2'

    # Perform the replacement
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

    # Write the updated content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Successfully updated {file_path}")

def main():
    # Read the properly formatted array content
    with open('/tmp/array_content.txt', 'r', encoding='utf-8') as f:
        array_content = f.read().strip()

    # File paths to update
    files_to_update = [
        '/home/somitemp/Projects/Coding/Python/document-hub-penilaian-gcg/src/pages/admin/PengaturanBaru.tsx',
        '/home/somitemp/Projects/Coding/Python/document-hub-penilaian-gcg/src/contexts/ChecklistContext.tsx'
    ]

    # Update both files
    for file_path in files_to_update:
        try:
            update_typescript_file(file_path, array_content)
        except Exception as e:
            print(f"Error updating {file_path}: {e}")

    print("\nArray replacement completed!")

if __name__ == "__main__":
    main()