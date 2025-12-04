import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Ne pas intercepter les erreurs 401 sur les routes d'authentification
    if (error.response?.status === 401 && 
        !originalRequest.url.includes('/auth/login') && 
        !originalRequest.url.includes('/auth/verify-2fa')) {
      // Token expiré, essayer de refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry la requête originale
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/login';
        }
      } else if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  
  // Account security endpoints
  get: (endpoint) => api.get(endpoint),
  post: (endpoint, data) => api.post(endpoint, data),
  delete: (endpoint) => api.delete(endpoint),
};

// API Users
export const userAPI = {
  getAll: (page = 0, size = 10, sortBy = 'id') => 
    api.get(`/users?page=${page}&size=${size}&sortBy=${sortBy}`),
  getById: (id) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  unlock: (id) => api.patch(`/users/${id}/unlock`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  changePassword: (passwordData) => api.post('/users/change-password', passwordData),
};

// API Roles
export const roleAPI = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  getByName: (name) => api.get(`/roles/name/${name}`),
  create: (roleData) => api.post('/roles', roleData),
  update: (id, roleData) => api.put(`/roles/${id}`, roleData),
  delete: (id) => api.delete(`/roles/${id}`),
  addPermission: (roleId, permissionName) => 
    api.post(`/roles/${roleId}/permissions/${permissionName}`),
  removePermission: (roleId, permissionName) => 
    api.delete(`/roles/${roleId}/permissions/${permissionName}`),
};

// API Audit
export const auditAPI = {
  getAll: (page = 0, size = 20, sortBy = 'timestamp', sortDirection = 'DESC') => 
    api.get(`/audit?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`),
  getByUsername: (username, page = 0, size = 20) => 
    api.get(`/audit/user/${username}?page=${page}&size=${size}`),
  getByAction: (action, page = 0, size = 20) => 
    api.get(`/audit/action/${action}?page=${page}&size=${size}`),
  search: (filters) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return api.get(`/audit/search?${params.toString()}`);
  },
  getRecent: (username) => api.get(`/audit/recent/${username}`),
};

// API Registration
export const registrationAPI = {
  submit: (requestData) => api.post('/registration/submit', requestData),
  getPending: () => api.get('/registration/pending'),
  getAll: () => api.get('/registration'),
  getById: (id) => api.get(`/registration/${id}`),
  approve: (id, comment) => api.post(`/registration/${id}/approve`, null, {
    params: { comment }
  }),
  reject: (id, comment) => api.post(`/registration/${id}/reject`, null, {
    params: { comment }
  }),
};

export default api;
