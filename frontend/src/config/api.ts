// API Configuration for POS GCG Document Hub
export const API_CONFIG = {
  // Base URL for development
  BASE_URL: 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      VERIFY: '/api/auth/verify',
    },
    
    // User Management
    USERS: {
      BASE: '/api/users',
      PROFILE: '/api/users/profile',
      UPDATE: '/api/users/update',
    },
    
    // Year Management
    YEARS: {
      BASE: '/api/years',
      ACTIVE: '/api/years/active',
    },
    
    // Organizational Structure
    STRUKTUR: {
      BASE: '/api/struktur',
      BY_YEAR: '/api/struktur/year',
    },
    
    // Aspects
    ASPECTS: {
      BASE: '/api/aspects',
      BY_YEAR: '/api/aspects/year',
    },
    
    // Checklist
    CHECKLIST: {
      BASE: '/api/checklist',
      BY_YEAR: '/api/checklist/year',
      BY_ASPECT: '/api/checklist/aspect',
    },
    
    // File Uploads
    FILES: {
      BASE: '/api/files',
      UPLOAD: '/api/files/upload',
      BY_CHECKLIST: '/api/files/checklist',
    },
    
    // Assignments
    ASSIGNMENTS: {
      BASE: '/api/assignments',
      BY_CHECKLIST: '/api/assignments/checklist',
      BY_STRUKTUR: '/api/assignments/struktur',
    },
    
    // Health Check
    HEALTH: '/health',
  },
  
  // HTTP Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
  
  // File upload settings
  UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return {
    ...API_CONFIG.HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
