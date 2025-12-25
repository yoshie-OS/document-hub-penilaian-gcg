#!/usr/bin/env python3
"""
Migration script to import PerformaGCG data from Excel to SQLite
Migrates data from backend/output.xlsx to gcg_assessment_summary table
"""

import pandas as pd
import sqlite3
from pathlib import Path

def migrate_data():
    """Migrate GCG assessment data from Excel to SQLite"""

    # Paths
    script_dir = Path(__file__).parent
    excel_file = script_dir / 'output.xlsx'
    db_file = script_dir / 'gcg_database.db'

    print(f"📂 Reading Excel file: {excel_file}")

    # Read Excel file
    try:
        df = pd.read_excel(excel_file)
        print(f"📊 Found {len(df)} rows in Excel file")
    except FileNotFoundError:
        print(f"❌ Error: Excel file not found at {excel_file}")
        return
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return

    # Get unique years
    years = sorted(df['Tahun'].unique())
    print(f"📅 Years: {years}")

    # Connect to database
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        print(f"✅ Connected to database: {db_file}")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return

    try:
        # Group by year for summary
        years_data = {}

        for year in df['Tahun'].unique():
            year_data = df[df['Tahun'] == year]

            # Get header rows (these have the aspect summaries)
            header_rows = year_data[year_data['Type'] == 'header']

            if len(header_rows) == 0:
                print(f"⚠️  No header data for year {year}, skipping")
                continue

            years_data[year] = []

            # Clear existing data for this year
            cursor.execute("DELETE FROM gcg_assessment_summary WHERE year = ?", (int(year),))

            print(f"\n📝 Processing year {year} - {len(header_rows)} aspects")

            for _, row in header_rows.iterrows():
                aspek = row['Deskripsi'] if pd.notna(row['Deskripsi']) else ''
                bobot = float(row['Bobot']) if pd.notna(row['Bobot']) else 0
                skor = float(row['Skor']) if pd.notna(row['Skor']) else 0
                capaian = float(row['Capaian']) if pd.notna(row['Capaian']) else 0

                # Determine category based on capaian percentage
                if capaian >= 90:
                    category = 'Sangat Baik'
                elif capaian >= 80:
                    category = 'Baik'
                elif capaian >= 70:
                    category = 'Cukup'
                else:
                    category = 'Kurang'

                # Insert into database
                cursor.execute("""
                    INSERT INTO gcg_assessment_summary
                    (year, aspek, total_nilai, total_skor, percentage, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (int(year), aspek, bobot, skor, capaian, category))

                print(f"  ✅ {aspek[:50]:50s} - Bobot: {bobot:6.2f}, Skor: {skor:7.3f}, Capaian: {capaian:5.1f}% ({category})")

                years_data[year].append({
                    'aspek': aspek,
                    'bobot': bobot,
                    'skor': skor,
                    'capaian': capaian,
                    'category': category
                })

        # Commit changes
        conn.commit()

        # Print summary
        total_aspects = sum(len(aspects) for aspects in years_data.values())
        print("\n" + "="*80)
        print("✅ Migration completed successfully!")
        print("📊 Summary:")
        for year, aspects in sorted(years_data.items()):
            print(f"   Year {year}: {len(aspects)} aspects migrated")
        print("="*80)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_data()
