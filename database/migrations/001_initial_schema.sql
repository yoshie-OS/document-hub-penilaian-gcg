-- =====================================================
-- MIGRATION: 001_initial_schema.sql
-- DESCRIPTION: Initial database schema for GCG Document Hub
-- DATE: 2024-12-30
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    direktorat_id UUID,
    subdirektorat_id UUID,
    divisi_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create direktorat table
CREATE TABLE IF NOT EXISTS direktorat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subdirektorat table
CREATE TABLE IF NOT EXISTS subdirektorat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    direktorat_id UUID NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create divisi table
CREATE TABLE IF NOT EXISTS divisi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    subdirektorat_id UUID NOT NULL,
    direktorat_id UUID NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create aspects table
CREATE TABLE IF NOT EXISTS aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kategori VARCHAR(100) NOT NULL,
    prioritas VARCHAR(20) DEFAULT 'sedang' CHECK (prioritas IN ('tinggi', 'sedang', 'rendah')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    aspect_id UUID,
    direktorat_id UUID,
    subdirektorat_id UUID,
    divisi_id UUID,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'rejected')),
    assigned_to UUID,
    uploaded_by UUID NOT NULL,
    due_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE users 
ADD CONSTRAINT fk_users_direktorat FOREIGN KEY (direktorat_id) REFERENCES direktorat(id),
ADD CONSTRAINT fk_users_subdirektorat FOREIGN KEY (subdirektorat_id) REFERENCES subdirektorat(id),
ADD CONSTRAINT fk_users_divisi FOREIGN KEY (divisi_id) REFERENCES divisi(id);

ALTER TABLE subdirektorat 
ADD CONSTRAINT fk_subdirektorat_direktorat FOREIGN KEY (direktorat_id) REFERENCES direktorat(id);

ALTER TABLE divisi 
ADD CONSTRAINT fk_divisi_subdirektorat FOREIGN KEY (subdirektorat_id) REFERENCES subdirektorat(id),
ADD CONSTRAINT fk_divisi_direktorat FOREIGN KEY (direktorat_id) REFERENCES direktorat(id);

ALTER TABLE documents 
ADD CONSTRAINT fk_documents_aspect FOREIGN KEY (aspect_id) REFERENCES aspects(id),
ADD CONSTRAINT fk_documents_direktorat FOREIGN KEY (direktorat_id) REFERENCES direktorat(id),
ADD CONSTRAINT fk_documents_subdirektorat FOREIGN KEY (subdirektorat_id) REFERENCES subdirektorat(id),
ADD CONSTRAINT fk_documents_divisi FOREIGN KEY (divisi_id) REFERENCES divisi(id),
ADD CONSTRAINT fk_documents_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
ADD CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(year);
CREATE INDEX IF NOT EXISTS idx_documents_aspect ON documents(aspect_id);
CREATE INDEX IF NOT EXISTS idx_documents_direktorat ON documents(direktorat_id);

-- Insert sample data
INSERT INTO direktorat (nama, kode, deskripsi) VALUES
('Direktorat Keuangan', 'DK', 'Direktorat yang mengelola keuangan perusahaan'),
('Direktorat Operasional', 'DO', 'Direktorat yang mengelola operasional perusahaan'),
('Direktorat SDM', 'DSDM', 'Direktorat yang mengelola sumber daya manusia'),
('Direktorat Teknologi', 'DT', 'Direktorat yang mengelola teknologi informasi')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO aspects (nama, deskripsi, kategori, prioritas) VALUES
('Tata Kelola Perusahaan', 'Aspek tata kelola perusahaan yang baik', 'Tata Kelola', 'tinggi'),
('Kepatuhan Regulasi', 'Kepatuhan terhadap regulasi yang berlaku', 'Kepatuhan', 'tinggi'),
('Manajemen Risiko', 'Identifikasi dan pengelolaan risiko', 'Risiko', 'sedang'),
('Sistem Pengendalian Internal', 'Sistem pengendalian internal perusahaan', 'Sistem', 'sedang')
ON CONFLICT DO NOTHING;
