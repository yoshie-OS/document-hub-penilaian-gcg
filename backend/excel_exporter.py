"""
Excel Export Module for GCG Document Hub
Exports SQLite data to Excel format for non-technical stakeholders
Your boss will love this! 📊
"""

import pandas as pd
from datetime import datetime
import os
from typing import Optional, Dict, Any, List
from database import get_db_connection


class ExcelExporter:
    """Handles all Excel export operations"""

    def __init__(self):
        self.export_dir = os.path.join(os.path.dirname(__file__), 'exports')
        os.makedirs(self.export_dir, exist_ok=True)

    def _generate_filename(self, export_type: str, year: Optional[int] = None) -> str:
        """Generate timestamped filename"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        year_suffix = f"_{year}" if year else ""
        return f"{export_type}{year_suffix}_{timestamp}.xlsx"

    def _track_export(self, conn, export_type: str, file_name: str, file_path: str,
                      year: Optional[int], filters: Dict, exported_by: Optional[int],
                      row_count: int, file_size: int):
        """Track export in database"""
        import json
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO excel_exports
            (export_type, file_name, file_path, year, filters, exported_by, row_count, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (export_type, file_name, file_path, year, json.dumps(filters),
              exported_by, row_count, file_size))

    def export_users(self, exported_by: Optional[int] = None) -> str:
        """Export all users to Excel"""
        with get_db_connection() as conn:
            query = """
                SELECT id, email, role, name, direktorat, subdirektorat, divisi,
                       created_at, is_active
                FROM users
                ORDER BY role, name
            """
            df = pd.read_sql_query(query, conn)

            # Format data
            df['is_active'] = df['is_active'].map({1: 'Active', 0: 'Inactive'})

            # Generate filename and save
            filename = self._generate_filename('users')
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Users', index=False)
                self._format_worksheet(writer.sheets['Users'])

            # Track export
            file_size = os.path.getsize(filepath)
            self._track_export(conn, 'users', filename, filepath, None, {},
                             exported_by, len(df), file_size)

            return filepath

    def export_checklist_gcg(self, year: Optional[int] = None,
                            exported_by: Optional[int] = None) -> str:
        """Export GCG checklist to Excel"""
        with get_db_connection() as conn:
            query = """
                SELECT c.id, c.aspek, c.deskripsi, c.tahun,
                       COUNT(d.id) as documents_uploaded,
                       CASE WHEN COUNT(d.id) > 0 THEN 'Complete' ELSE 'Pending' END as status
                FROM checklist_gcg c
                LEFT JOIN document_metadata d ON c.id = d.checklist_id
                WHERE c.is_active = 1
            """

            if year:
                query += f" AND c.tahun = {year}"

            query += " GROUP BY c.id ORDER BY c.tahun DESC, c.aspek, c.id"

            df = pd.read_sql_query(query, conn)

            filename = self._generate_filename('checklist_gcg', year)
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                # Main checklist
                df.to_excel(writer, sheet_name='Checklist GCG', index=False)
                self._format_worksheet(writer.sheets['Checklist GCG'])

                # Summary by aspect
                summary = df.groupby(['tahun', 'aspek']).agg({
                    'id': 'count',
                    'documents_uploaded': 'sum'
                }).reset_index()
                summary.columns = ['Tahun', 'Aspek', 'Total Items', 'Documents Uploaded']
                summary['Completion %'] = (summary['Documents Uploaded'] / summary['Total Items'] * 100).round(2)

                summary.to_excel(writer, sheet_name='Summary by Aspect', index=False)
                self._format_worksheet(writer.sheets['Summary by Aspect'])

            file_size = os.path.getsize(filepath)
            self._track_export(conn, 'checklist_gcg', filename, filepath, year,
                             {'year': year} if year else {}, exported_by, len(df), file_size)

            return filepath

    def export_documents(self, year: Optional[int] = None,
                        exported_by: Optional[int] = None) -> str:
        """Export document metadata to Excel"""
        with get_db_connection() as conn:
            query = """
                SELECT d.*, c.aspek as checklist_aspek
                FROM document_metadata d
                LEFT JOIN checklist_gcg c ON d.checklist_id = c.id
                WHERE 1=1
            """

            if year:
                query += f" AND d.year = {year}"

            query += " ORDER BY d.year DESC, d.upload_date DESC"

            df = pd.read_sql_query(query, conn)

            filename = self._generate_filename('documents', year)
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Documents', index=False)
                self._format_worksheet(writer.sheets['Documents'])

                # Summary
                summary = df.groupby(['year', 'document_type']).size().reset_index(name='count')
                summary.to_excel(writer, sheet_name='Summary', index=False)
                self._format_worksheet(writer.sheets['Summary'])

            file_size = os.path.getsize(filepath)
            self._track_export(conn, 'documents', filename, filepath, year,
                             {'year': year} if year else {}, exported_by, len(df), file_size)

            return filepath

    def export_organizational_structure(self, year: Optional[int] = None,
                                       exported_by: Optional[int] = None) -> str:
        """Export complete organizational structure to Excel"""
        with get_db_connection() as conn:
            current_year = year or datetime.now().year

            # Get data
            direktorat_query = f"""
                SELECT * FROM direktorat
                WHERE tahun = {current_year} AND is_active = 1
                ORDER BY nama
            """
            subdirektorat_query = f"""
                SELECT * FROM subdirektorat
                WHERE tahun = {current_year} AND is_active = 1
                ORDER BY nama
            """
            divisi_query = f"""
                SELECT * FROM divisi
                WHERE tahun = {current_year} AND is_active = 1
                ORDER BY nama
            """

            df_direktorat = pd.read_sql_query(direktorat_query, conn)
            df_subdirektorat = pd.read_sql_query(subdirektorat_query, conn)
            df_divisi = pd.read_sql_query(divisi_query, conn)

            # Check if anak_perusahaan table exists
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='anak_perusahaan'")
            has_anak = cursor.fetchone() is not None

            if has_anak:
                anak_perusahaan_query = f"""
                    SELECT * FROM anak_perusahaan
                    WHERE tahun = {current_year} AND is_active = 1
                    ORDER BY kategori, nama
                """
                df_anak = pd.read_sql_query(anak_perusahaan_query, conn)
            else:
                df_anak = pd.DataFrame()

            # Check if we have any data
            if df_direktorat.empty and df_subdirektorat.empty and df_divisi.empty:
                raise ValueError(f"No organizational structure data found for year {current_year}")

            filename = self._generate_filename('organizational_structure', year)
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                df_direktorat.to_excel(writer, sheet_name='Direktorat', index=False)
                df_subdirektorat.to_excel(writer, sheet_name='Subdirektorat', index=False)
                df_divisi.to_excel(writer, sheet_name='Divisi', index=False)

                if has_anak and not df_anak.empty:
                    df_anak.to_excel(writer, sheet_name='Anak Perusahaan', index=False)

                for sheet in writer.sheets.values():
                    self._format_worksheet(sheet)

            total_rows = len(df_direktorat) + len(df_subdirektorat) + len(df_divisi) + len(df_anak)
            file_size = os.path.getsize(filepath)
            self._track_export(conn, 'organizational_structure', filename, filepath,
                             year, {'year': year or 'current'}, exported_by, total_rows, file_size)

            return filepath

    def export_gcg_assessment(self, year: int, exported_by: Optional[int] = None) -> str:
        """Export GCG assessment results to Excel (replaces output.xlsx)"""
        with get_db_connection() as conn:
            # Detailed assessment data
            detail_query = f"""
                SELECT * FROM v_gcg_assessment_detail
                WHERE year = {year}
                ORDER BY level, section
            """
            df_detail = pd.read_sql_query(detail_query, conn)

            # Summary data
            summary_query = f"""
                SELECT * FROM gcg_assessment_summary
                WHERE year = {year}
                ORDER BY aspek
            """
            df_summary = pd.read_sql_query(summary_query, conn)

            filename = self._generate_filename('gcg_assessment', year)
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                # Detail sheet
                df_detail.to_excel(writer, sheet_name='Assessment Detail', index=False)
                self._format_worksheet(writer.sheets['Assessment Detail'])

                # Summary sheet
                df_summary.to_excel(writer, sheet_name='Summary', index=False)
                self._format_worksheet(writer.sheets['Summary'])

                # Add chart if data exists
                if not df_summary.empty:
                    self._add_chart_sheet(writer, df_summary)

            file_size = os.path.getsize(filepath)
            self._track_export(conn, 'gcg_assessment', filename, filepath, year,
                             {'year': year}, exported_by, len(df_detail), file_size)

            return filepath

    def export_all_data(self, year: Optional[int] = None,
                       exported_by: Optional[int] = None) -> str:
        """Export ALL data to a single comprehensive Excel file"""
        with get_db_connection() as conn:
            current_year = year or datetime.now().year

            filename = self._generate_filename('complete_export', year)
            filepath = os.path.join(self.export_dir, filename)

            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                # 1. Users
                df_users = pd.read_sql_query("SELECT * FROM users WHERE is_active = 1", conn)
                df_users.to_excel(writer, sheet_name='Users', index=False)

                # 2. Checklist
                df_checklist = pd.read_sql_query(
                    f"SELECT * FROM checklist_gcg WHERE tahun = {current_year}", conn)
                df_checklist.to_excel(writer, sheet_name='Checklist GCG', index=False)

                # 3. Documents
                df_docs = pd.read_sql_query(
                    f"SELECT * FROM document_metadata WHERE year = {current_year}", conn)
                df_docs.to_excel(writer, sheet_name='Documents', index=False)

                # 4. Organizational Structure
                df_dir = pd.read_sql_query(
                    f"SELECT * FROM direktorat WHERE tahun = {current_year}", conn)
                df_dir.to_excel(writer, sheet_name='Direktorat', index=False)

                df_subdir = pd.read_sql_query(
                    f"SELECT * FROM subdirektorat WHERE tahun = {current_year}", conn)
                df_subdir.to_excel(writer, sheet_name='Subdirektorat', index=False)

                df_anak = pd.read_sql_query(
                    f"SELECT * FROM anak_perusahaan WHERE tahun = {current_year}", conn)
                df_anak.to_excel(writer, sheet_name='Anak Perusahaan', index=False)

                # 5. GCG Assessment
                df_gcg = pd.read_sql_query(
                    f"SELECT * FROM v_gcg_assessment_detail WHERE year = {current_year}", conn)
                if not df_gcg.empty:
                    df_gcg.to_excel(writer, sheet_name='GCG Assessment', index=False)

                # Format all sheets
                for sheet in writer.sheets.values():
                    self._format_worksheet(sheet)

            file_size = os.path.getsize(filepath)
            total_rows = sum([len(df_users), len(df_checklist), len(df_docs),
                            len(df_dir), len(df_subdir), len(df_anak), len(df_gcg)])
            self._track_export(conn, 'complete_export', filename, filepath, year,
                             {'year': year or 'current'}, exported_by, total_rows, file_size)

            return filepath

    def _format_worksheet(self, worksheet):
        """Apply formatting to Excel worksheet"""
        from openpyxl.styles import Font, Alignment, PatternFill

        # Header formatting
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)

        for cell in worksheet[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width

    def _add_chart_sheet(self, writer, df_summary):
        """Add visualization sheet with charts"""
        # This would add charts for GCG assessment visualization
        # Keeping it simple for now, can be enhanced later
        pass


# Convenience functions for API endpoints
def export_to_excel(export_type: str, year: Optional[int] = None,
                   exported_by: Optional[int] = None) -> str:
    """
    Main export function

    export_type: 'users', 'checklist', 'documents', 'org_structure', 'gcg_assessment', 'all'
    """
    exporter = ExcelExporter()

    if export_type == 'users':
        return exporter.export_users(exported_by)
    elif export_type == 'checklist':
        return exporter.export_checklist_gcg(year, exported_by)
    elif export_type == 'documents':
        return exporter.export_documents(year, exported_by)
    elif export_type == 'org_structure':
        return exporter.export_organizational_structure(year, exported_by)
    elif export_type == 'gcg_assessment':
        if not year:
            year = datetime.now().year
        return exporter.export_gcg_assessment(year, exported_by)
    elif export_type == 'all':
        return exporter.export_all_data(year, exported_by)
    else:
        raise ValueError(f"Unknown export type: {export_type}")


if __name__ == "__main__":
    # Test exports
    exporter = ExcelExporter()
    print("Testing Excel exports...")

    print("\n1. Exporting users...")
    filepath = exporter.export_users()
    print(f"   ✓ Exported to: {filepath}")

    print("\n2. Exporting checklist for 2024...")
    filepath = exporter.export_checklist_gcg(2024)
    print(f"   ✓ Exported to: {filepath}")

    print("\n3. Exporting organizational structure...")
    filepath = exporter.export_organizational_structure(2024)
    print(f"   ✓ Exported to: {filepath}")

    print("\n✅ All exports completed successfully!")
