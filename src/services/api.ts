// API Configuration - Change port here if needed
export const API_PORT = 5001;
export const API_HOST = `http://localhost:${API_PORT}`;
const API_BASE_URL = `${API_HOST}/api`;

// Generic API helper
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken') || 'demo-token';
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

// File upload helper
export const uploadFile = async (file: File, metadata: any = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  Object.keys(metadata).forEach(key => {
    formData.append(key, metadata[key]);
  });

  const token = localStorage.getItem('authToken') || 'demo-token';
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('File Upload Error:', error);
    throw error;
  }
};

// File download helper
export const downloadFile = (filename: string) => {
  const token = localStorage.getItem('authToken') || 'demo-token';
  const url = `${API_BASE_URL}/download/${filename}`;
  
  // Create temporary link for download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Add authorization header
  link.setAttribute('data-token', token);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// User Management API
export const userAPI = {
  // Get all users
  getAll: () => apiCall('/users'),
  
  // Get user by ID
  getById: (id: string) => apiCall(`/users/${id}`),
  
  // Create new user
  create: (userData: any) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Update user
  update: (id: string, userData: any) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  
  // Delete user
  delete: (id: string) => apiCall(`/users/${id}`, {
    method: 'DELETE',
  }),
  
  // Login (custom endpoint)
  login: (email: string, password: string) => {
    return apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(user => {
      // Store authentication data
      localStorage.setItem('authToken', `user-${user.id}`);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    });
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// AOI Management API
export const aoiAPI = {
  // Get all AOI tables (with optional user filtering)
  getTables: (params?: { userRole?: string; userSubdirektorat?: string; userDivisi?: string; year?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userRole) queryParams.append('userRole', params.userRole);
    if (params?.userSubdirektorat) queryParams.append('userSubdirektorat', params.userSubdirektorat);
    if (params?.userDivisi) queryParams.append('userDivisi', params.userDivisi);
    if (params?.year) queryParams.append('year', params.year.toString());

    const url = queryParams.toString() ? `/aoiTables?${queryParams.toString()}` : '/aoiTables';
    return apiCall(url);
  },
  
  // Get AOI table by ID
  getTableById: (id: number) => apiCall(`/aoiTables/${id}`),
  
  // Create AOI table
  createTable: (tableData: any) => apiCall('/aoiTables', {
    method: 'POST',
    body: JSON.stringify(tableData),
  }),
  
  // Update AOI table
  updateTable: (id: number, tableData: any) => apiCall(`/aoiTables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tableData),
  }),
  
  // Delete AOI table
  deleteTable: (id: number) => apiCall(`/aoiTables/${id}`, {
    method: 'DELETE',
  }),
  
  // Get recommendations by table
  getRecommendationsByTable: (tableId: number) => apiCall(`/aoiRecommendations?aoiTableId=${tableId}`),
  
  // Create recommendation
  createRecommendation: (recommendationData: any) => apiCall('/aoiRecommendations', {
    method: 'POST',
    body: JSON.stringify(recommendationData),
  }),
  
  // Update recommendation
  updateRecommendation: (id: number, recommendationData: any) => apiCall(`/aoiRecommendations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recommendationData),
  }),
  
  // Delete recommendation
  deleteRecommendation: (id: number) => apiCall(`/aoiRecommendations/${id}`, {
    method: 'DELETE',
  }),
};

// Document Management API
export const documentAPI = {
  // Get all user documents
  getAll: () => apiCall('/userDocuments'),
  
  // Get documents by user
  getByUser: (userId: string) => apiCall(`/userDocuments?userId=${userId}`),
  
  // Get documents by year
  getByYear: (year: number) => apiCall(`/userDocuments?tahun=${year}`),
  
  // Create document
  create: (documentData: any) => apiCall('/userDocuments', {
    method: 'POST',
    body: JSON.stringify(documentData),
  }),
  
  // Update document
  update: (id: string, documentData: any) => apiCall(`/userDocuments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  }),
  
  // Delete document
  delete: (id: string) => apiCall(`/userDocuments/${id}`, {
    method: 'DELETE',
  }),
};

// AOI Document API
export const aoiDocumentAPI = {
  // Get all AOI documents
  getAll: () => apiCall('/aoiDocuments'),
  
  // Get documents by recommendation
  getByRecommendation: (recommendationId: number) => apiCall(`/aoiDocuments?aoiRecommendationId=${recommendationId}`),
  
  // Get documents by year
  getByYear: (year: number) => apiCall(`/aoiDocuments?tahun=${year}`),
  
  // Create AOI document
  create: (documentData: any) => apiCall('/aoiDocuments', {
    method: 'POST',
    body: JSON.stringify(documentData),
  }),
  
  // Update AOI document
  update: (id: string, documentData: any) => apiCall(`/aoiDocuments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  }),
  
  // Delete AOI document
  delete: (id: string) => apiCall(`/aoiDocuments/${id}`, {
    method: 'DELETE',
  }),
};

// Checklist API
export const checklistAPI = {
  // Get all checklists
  getAll: () => apiCall('/checklists'),
  
  // Get checklist by ID
  getById: (id: string) => apiCall(`/checklists/${id}`),
  
  // Create checklist
  create: (checklistData: any) => apiCall('/checklists', {
    method: 'POST',
    body: JSON.stringify(checklistData),
  }),
  
  // Update checklist
  update: (id: string, checklistData: any) => apiCall(`/checklists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(checklistData),
  }),
  
  // Delete checklist
  delete: (id: string) => apiCall(`/checklists/${id}`, {
    method: 'DELETE',
  }),
};

// Struktur Perusahaan API
export const strukturAPI = {
  // Get all structure data
  getAll: () => apiCall('/strukturPerusahaan'),
  
  // Get direktorat
  getDirektorat: () => apiCall('/strukturPerusahaan').then(data => data.direktorat),
  
  // Get subdirektorat by direktorat
  getSubdirektoratByDirektorat: (direktoratId: string) => 
    apiCall('/strukturPerusahaan').then(data => 
      data.subdirektorat.filter((s: any) => s.direktoratId === direktoratId)
    ),
  
  // Get divisi by subdirektorat
  getDivisiBySubdirektorat: (subdirektoratId: string) => 
    apiCall('/strukturPerusahaan').then(data => 
      data.divisi.filter((d: any) => d.subdirektoratId === subdirektoratId)
    ),
};

// Health check
export const healthCheck = () => fetch(`${API_HOST}/health`).then(res => res.json());

export default {
  userAPI,
  aoiAPI,
  documentAPI,
  aoiDocumentAPI,
  checklistAPI,
  strukturAPI,
  uploadFile,
  downloadFile,
  healthCheck,
};
