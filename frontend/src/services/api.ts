import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { username: string; email: string; password: string; nama: string; role?: string }) =>
    api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (userData: any) => api.post('/users', userData),
  update: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  delete: (id: number) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
};

// Year API
export const yearAPI = {
  getAll: () => api.get('/years'),
  getById: (id: number) => api.get(`/years/${id}`),
  create: (yearData: { tahun: number; nama?: string; deskripsi?: string }) =>
    api.post('/years', yearData),
  update: (id: number, yearData: any) => api.put(`/years/${id}`, yearData),
  delete: (id: number) => api.delete(`/years/${id}`),
  getActive: () => api.get('/years/active'),
};

// Struktur Perusahaan API
export const strukturAPI = {
  getAll: () => api.get('/struktur'),
  getByYear: (tahun: number) => api.get(`/struktur/year/${tahun}`),
  create: (strukturData: { tahun: number; direktorat: string; subdirektorat?: string; divisi?: string }) =>
    api.post('/struktur', strukturData),
  update: (id: number, strukturData: any) => api.put(`/struktur/${id}`, strukturData),
  delete: (id: number) => api.delete(`/struktur/${id}`),
};

// Aspect API
export const aspectAPI = {
  getAll: () => api.get('/aspects'),
  getByYear: (tahun: number) => api.get(`/aspects/year/${tahun}`),
  create: (aspectData: { nama: string; tahun: number }) =>
    api.post('/aspects', aspectData),
  update: (id: number, aspectData: any) => api.put(`/aspects/${id}`, aspectData),
  delete: (id: number) => api.delete(`/aspects/${id}`),
};

// Checklist GCG API
export const checklistAPI = {
  getAll: () => api.get('/checklist'),
  getByYear: (tahun: number) => api.get(`/checklist/year/${tahun}`),
  create: (checklistData: { aspek: string; deskripsi: string; tahun: number }) =>
    api.post('/checklist', checklistData),
  update: (id: number, checklistData: any) => api.put(`/checklist/${id}`, checklistData),
  delete: (id: number) => api.delete(`/checklist/${id}`),
};

// File Upload API
export const fileUploadAPI = {
  upload: (formData: FormData) => api.post('/file-uploads', formData),
  getAll: () => api.get('/file-uploads'),
  getById: (id: number) => api.get(`/file-uploads/${id}`),
  update: (id: number, fileData: any) => api.put(`/file-uploads/${id}`, fileData),
  delete: (id: number) => api.delete(`/file-uploads/${id}`),
  download: (id: number) => api.get(`/file-uploads/${id}/download`),
};

// Assignment API
export const assignmentAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id: number) => api.get(`/assignments/${id}`),
  create: (assignmentData: any) => api.post('/assignments', assignmentData),
  update: (id: number, assignmentData: any) => api.put(`/assignments/${id}`, assignmentData),
  delete: (id: number) => api.delete(`/assignments/${id}`),
  getByUser: (userId: number) => api.get(`/assignments/user/${userId}`),
  getByYear: (tahun: number) => api.get(`/assignments/year/${tahun}`),
};

export default api;
