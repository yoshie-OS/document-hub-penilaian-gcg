-- =====================================================
-- GCG DOCUMENT HUB DATABASE SCHEMA
-- PostgreSQL Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    direktorat_id UUID REFERENCES direktorat(id),
    subdirektorat_id UUID REFERENCES subdirektorat(id),
    divisi_id UUID REFERENCES divisi(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for JWT management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Direktorat table
CREATE TABLE direktorat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subdirektorat table
CREATE TABLE subdirektorat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    direktorat_id UUID NOT NULL REFERENCES direktorat(id) ON DELETE CASCADE,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Divisi table
CREATE TABLE divisi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(10) UNIQUE NOT NULL,
    subdirektorat_id UUID NOT NULL REFERENCES subdirektorat(id) ON DELETE CASCADE,
    direktorat_id UUID NOT NULL REFERENCES direktorat(id) ON DELETE CASCADE,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GCG METADATA
-- =====================================================

-- Years table
CREATE TABLE years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GCG Aspects table
CREATE TABLE aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kategori VARCHAR(100) NOT NULL,
    prioritas VARCHAR(20) DEFAULT 'sedang' CHECK (prioritas IN ('tinggi', 'sedang', 'rendah')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Klasifikasi table
CREATE TABLE klasifikasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    tipe VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DOCUMENTS & FILES
-- =====================================================

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    
    -- Metadata
    aspect_id UUID REFERENCES aspects(id),
    direktorat_id UUID REFERENCES direktorat(id),
    subdirektorat_id UUID REFERENCES subdirektorat(id),
    divisi_id UUID REFERENCES divisi(id),
    year INTEGER NOT NULL,
    
    -- Status & Assignment
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'rejected')),
    assigned_to UUID REFERENCES users(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    -- Timestamps
    due_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document versions for tracking changes
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    change_description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document comments/notes
CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ASSIGNMENTS & WORKFLOW
-- =====================================================

-- Document assignments
CREATE TABLE document_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    notes TEXT,
    completed_at TIMESTAMP
);

-- Workflow steps
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
);

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document access logs
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'edit', 'delete')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_direktorat ON users(direktorat_id);

-- Documents indexes
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_year ON documents(year);
CREATE INDEX idx_documents_aspect ON documents(aspect_id);
CREATE INDEX idx_documents_direktorat ON documents(direktorat_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_assigned_to ON documents(assigned_to);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);

-- Search indexes
CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('indonesian', file_name || ' ' || COALESCE(original_name, '')));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aspects_updated_at BEFORE UPDATE ON aspects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_klasifikasi_updated_at BEFORE UPDATE ON klasifikasi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default years
INSERT INTO years (year) VALUES 
(2023), (2024), (2025);

-- Insert default aspects
INSERT INTO aspects (nama, deskripsi, kategori, prioritas) VALUES
('Tata Kelola Perusahaan', 'Aspek tata kelola perusahaan yang baik', 'Tata Kelola', 'tinggi'),
('Kepatuhan Regulasi', 'Kepatuhan terhadap regulasi yang berlaku', 'Kepatuhan', 'tinggi'),
('Manajemen Risiko', 'Identifikasi dan pengelolaan risiko', 'Risiko', 'sedang'),
('Sistem Pengendalian Internal', 'Sistem pengendalian internal perusahaan', 'Sistem', 'sedang');

-- Insert default direktorat
INSERT INTO direktorat (nama, kode, deskripsi) VALUES
('Direktorat Keuangan', 'DK', 'Direktorat yang mengelola keuangan perusahaan'),
('Direktorat Operasional', 'DO', 'Direktorat yang mengelola operasional perusahaan'),
('Direktorat SDM', 'DSDM', 'Direktorat yang mengelola sumber daya manusia'),
('Direktorat Teknologi', 'DT', 'Direktorat yang mengelola teknologi informasi');
