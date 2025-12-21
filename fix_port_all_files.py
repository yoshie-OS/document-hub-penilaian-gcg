"""
Fix all hardcoded localhost:5000 to localhost:5001 in frontend files
"""

import os
import re

# Files that need to be updated
files_to_update = [
    'src/pages/admin/ArsipDokumen.tsx',
    'src/contexts/YearContext.tsx',
    'src/contexts/StrukturPerusahaanContext.tsx',
    'src/contexts/FileUploadContext.tsx',
    'src/contexts/ChecklistContext.tsx',
    'src/contexts/AOIDocumentContext.tsx',
    'src/components/ExportModal.tsx',
    'src/pages/MonitoringUploadGCG.tsx',
    'src/pages/ArsipDokumen.tsx',
    'src/components/LocalStorageMigration.tsx',
    'src/components/ExportDatabaseButton.tsx',
    'src/components/ExportButton.tsx',
    'src/components/ExcelExportPanel.tsx'
]

def fix_file(filepath):
    """Replace localhost:5000 with localhost:5001 in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Count occurrences
        count = content.count('localhost:5000')

        if count == 0:
            print(f"  SKIP: {filepath} (no localhost:5000 found)")
            return 0

        # Replace
        new_content = content.replace('localhost:5000', 'localhost:5001')

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"  UPDATED: {filepath} ({count} occurrences)")
        return count
    except Exception as e:
        print(f"  ERROR: {filepath} - {e}")
        return 0

def main():
    print("=" * 70)
    print("Fixing Port References: localhost:5000 -> localhost:5001")
    print("=" * 70)
    print()

    total_files = 0
    total_changes = 0

    for filepath in files_to_update:
        if os.path.exists(filepath):
            changes = fix_file(filepath)
            if changes > 0:
                total_files += 1
                total_changes += changes
        else:
            print(f"  NOT FOUND: {filepath}")

    print()
    print("=" * 70)
    print(f"SUMMARY: Updated {total_files} files ({total_changes} total changes)")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Restart frontend: npm run dev")
    print("2. Refresh browser: F5 or Ctrl+R")
    print("3. Try login again")
    print()

if __name__ == "__main__":
    main()
