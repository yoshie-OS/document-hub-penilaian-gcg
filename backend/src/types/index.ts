// =====================================================
// GCG DOCUMENT HUB TYPE DEFINITIONS
// =====================================================

// =====================================================
// USER & AUTHENTICATION TYPES
// =====================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'superadmin' | 'admin' | 'user';
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// =====================================================
// ORGANIZATIONAL STRUCTURE TYPES
// =====================================================

export interface Direktorat {
  id: string;
  nama: string;
  kode: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDirektoratRequest {
  nama: string;
  kode: string;
  deskripsi?: string;
}

export interface UpdateDirektoratRequest {
  nama?: string;
  kode?: string;
  deskripsi?: string;
  isActive?: boolean;
}

export interface Subdirektorat {
  id: string;
  nama: string;
  kode: string;
  direktoratId: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubdirektoratRequest {
  nama: string;
  kode: string;
  direktoratId: string;
  deskripsi?: string;
}

export interface UpdateSubdirektoratRequest {
  nama?: string;
  kode?: string;
  direktoratId?: string;
  deskripsi?: string;
  isActive?: boolean;
}

export interface Divisi {
  id: string;
  nama: string;
  kode: string;
  subdirektoratId: string;
  direktoratId: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDivisiRequest {
  nama: string;
  kode: string;
  subdirektoratId: string;
  direktoratId: string;
  deskripsi?: string;
}

export interface UpdateDivisiRequest {
  nama?: string;
  kode?: string;
  subdirektoratId?: string;
  direktoratId?: string;
  deskripsi?: string;
  isActive?: boolean;
}

// =====================================================
// GCG METADATA TYPES
// =====================================================

export interface Year {
  id: string;
  year: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateYearRequest {
  year: number;
}

export interface Aspect {
  id: string;
  nama: string;
  deskripsi?: string;
  kategori: string;
  prioritas: 'tinggi' | 'sedang' | 'rendah';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAspectRequest {
  nama: string;
  deskripsi?: string;
  kategori: string;
  prioritas: 'tinggi' | 'sedang' | 'rendah';
}

export interface UpdateAspectRequest {
  nama?: string;
  deskripsi?: string;
  kategori?: string;
  prioritas?: 'tinggi' | 'sedang' | 'rendah';
  isActive?: boolean;
}

export interface Klasifikasi {
  id: string;
  nama: string;
  tipe: string;
  deskripsi?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKlasifikasiRequest {
  nama: string;
  tipe: string;
  deskripsi?: string;
}

export interface UpdateKlasifikasiRequest {
  nama?: string;
  tipe?: string;
  deskripsi?: string;
  isActive?: boolean;
}

// =====================================================
// DOCUMENT TYPES
// =====================================================

export interface Document {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType?: string;
  mimeType?: string;
  aspectId?: string;
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  year: number;
  status: 'pending' | 'completed' | 'overdue' | 'rejected';
  assignedTo?: string;
  uploadedBy: string;
  dueDate?: Date;
  uploadedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface CreateDocumentRequest {
  aspectId?: string;
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  year: number;
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateDocumentRequest {
  aspectId?: string;
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  year?: number;
  assignedTo?: string;
  status?: 'pending' | 'completed' | 'overdue' | 'rejected';
  dueDate?: Date;
}

export interface DocumentFilter {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
  aspectId?: string;
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  status?: string;
  assignedTo?: string;
  uploadedBy?: string;
}

export interface DocumentResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =====================================================
// ASSIGNMENT & WORKFLOW TYPES
// =====================================================

export interface DocumentAssignment {
  id: string;
  documentId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
}

export interface CreateAssignmentRequest {
  documentId: string;
  assignedTo: string;
  dueDate?: Date;
}

export interface UpdateAssignmentRequest {
  status?: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: Date;
  completedAt?: Date;
}

// =====================================================
// AUDIT & LOGGING TYPES
// =====================================================

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId: string;
  action: 'view' | 'download' | 'edit' | 'delete';
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  method?: string;
}

// =====================================================
// FILE UPLOAD TYPES
// =====================================================

export interface FileUploadRequest {
  file: Express.Multer.File;
  aspectId?: string;
  direktoratId?: string;
  subdirektoratId?: string;
  divisiId?: string;
  year: number;
  assignedTo?: string;
  dueDate?: Date;
}

export interface FileUploadResponse {
  document: Document;
  message: string;
}

// =====================================================
// SEARCH & FILTER TYPES
// =====================================================

export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters: Record<string, any>;
}

// =====================================================
// STATISTICS TYPES
// =====================================================

export interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  overdueDocuments: number;
  totalUsers: number;
  totalDirektorat: number;
  totalAspects: number;
  currentYear: number;
}

export interface DocumentStats {
  totalByStatus: Record<string, number>;
  totalByAspect: Record<string, number>;
  totalByDirektorat: Record<string, number>;
  totalByYear: Record<number, number>;
  uploadTrend: Array<{
    date: string;
    count: number;
  }>;
}

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =====================================================
// MIDDLEWARE TYPES
// =====================================================

export interface AuthenticatedRequest extends Express.Request {
  user?: User;
  token?: string;
}

export interface RoleCheckRequest extends AuthenticatedRequest {
  requiredRole: 'superadmin' | 'admin' | 'user';
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SortOrder = 'asc' | 'desc';

export type Status = 'pending' | 'completed' | 'overdue' | 'rejected';

export type Priority = 'tinggi' | 'sedang' | 'rendah';

export type UserRole = 'superadmin' | 'admin' | 'user';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';

export type AccessAction = 'view' | 'download' | 'edit' | 'delete';
