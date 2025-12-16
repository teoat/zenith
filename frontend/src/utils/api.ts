/**
 * API Client for 378x492 Fraud Detection Platform
 * Handles all HTTP communication with the backend
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
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
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const api = {
  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiClient.post('/auth/login', credentials),

    logout: () =>
      apiClient.post('/auth/logout'),

    refresh: (refreshToken: string) =>
      apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  },

  // Cases
  cases: {
    getAll: (params?: any) =>
      apiClient.get('/cases', { params }),

    getById: (id: string) =>
      apiClient.get(`/cases/${id}`),

    create: (caseData: any) =>
      apiClient.post('/cases', caseData),

    update: (id: string, caseData: any) =>
      apiClient.put(`/cases/${id}`, caseData),

    delete: (id: string) =>
      apiClient.delete(`/cases/${id}`),
  },

  // Transactions
  transactions: {
    getAll: (params?: any) =>
      apiClient.get('/transactions', { params }),

    upload: (file: File, caseId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caseId) formData.append('case_id', caseId);

      return apiClient.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Evidence
  evidence: {
    upload: (file: File, caseId: string, metadata?: any) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', caseId);
      if (metadata) formData.append('metadata', JSON.stringify(metadata));

      return apiClient.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    getByCase: (caseId: string) =>
      apiClient.get(`/evidence/case/${caseId}`),
  },

  // Users
  users: {
    getAll: (params?: any) =>
      apiClient.get('/users', { params }),

    getById: (id: string) =>
      apiClient.get(`/users/${id}`),

    create: (userData: any) =>
      apiClient.post('/users', userData),

    update: (id: string, userData: any) =>
      apiClient.put(`/users/${id}`, userData),
  },

  // Reports
  reports: {
    generate: (reportConfig: any) =>
      apiClient.post('/reports/generate', reportConfig),

    getList: () =>
      apiClient.get('/reports'),

    download: (reportId: string) =>
      apiClient.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
      }),
  },

  // System Health
  health: {
    check: () =>
      apiClient.get('/health'),

    metrics: () =>
      apiClient.get('/metrics'),
  },
};

// Utility functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

// Error handling utilities
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;