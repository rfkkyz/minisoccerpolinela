/**
 * Centralized API Client Layer - POLISOCCER
 * Single authoritative source for all backend HTTP communications.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Session ID and Bearer Token from localStorage if present
api.interceptors.request.use((config) => {
  let sessionId = localStorage.getItem('polisoccer_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('polisoccer_session_id', sessionId);
  }
  config.headers['X-Session-Id'] = sessionId;

  const token = localStorage.getItem('polisoccer_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Global 401 handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and broadcast logout if session expired
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('polisoccer_token');
        localStorage.removeItem('polisoccer_user');
        window.dispatchEvent(new CustomEvent('polisoccer_unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // 1. AUTHENTICATION
  auth: {
    register: (formData) => api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    updateProfile: (data) => api.patch('/auth/profile', data),
    changePassword: (data) => api.patch('/auth/password', data)
  },

  // 2. PUBLIC ENDPOINTS
  public: {
    getFields: () => api.get('/public/fields'),
    fields: () => api.get('/public/fields'),
    getAvailability: (fieldId, date) => api.get(`/public/availability?field_id=${fieldId}&date=${date}`),
    availability: (fieldId, date) => api.get(`/public/availability?field_id=${fieldId}&date=${date}`),
    getMonthAvailability: (fieldId, yearOrMonth, month) => {
      const monthParam = month ? `${yearOrMonth}-${String(month).padStart(2, '0')}` : yearOrMonth;
      return api.get(`/public/availability/month?field_id=${fieldId}&month=${monthParam}`);
    },
    monthAvailability: (fieldId, yearOrMonth, month) => {
      const monthParam = month ? `${yearOrMonth}-${String(month).padStart(2, '0')}` : yearOrMonth;
      return api.get(`/public/availability/month?field_id=${fieldId}&month=${monthParam}`);
    },
    getSummary: () => api.get('/public/summary'),
    summary: () => api.get('/public/summary'),
    getNews: (params) => api.get('/public/news', { params: typeof params === 'string' ? { category: params } : params }),
    news: (params) => api.get('/public/news', { params: typeof params === 'string' ? { category: params } : params }),
    getNewsDetail: (id) => api.get(`/public/news/${id}`),
    newsDetail: (id) => api.get(`/public/news/${id}`)
  },

  // 3. BOOKINGS
  bookings: {
    lock: (data) => api.post('/bookings/lock', data),
    releaseLock: (data) => api.post('/bookings/lock/release', data),
    quote: (data) => api.post('/bookings/quote', data),
    reserve: (formData) => api.post('/bookings/reserve', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadPayment: (formData) => api.post('/bookings/upload-payment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    checkStatus: (code, whatsapp) => api.get(`/bookings/status?code=${encodeURIComponent(code)}&whatsapp=${encodeURIComponent(whatsapp)}`)
  },

  // 4. USER (ME) DASHBOARD
  user: {
    getSummary: () => api.get('/me/summary'),
    getBookings: (params) => api.get('/me/bookings', { params }),
    getBookingDetail: (id) => api.get(`/me/bookings/${id}`),
    cancelBooking: (id, reason) => api.patch(`/me/bookings/${id}/cancel`, { reason }),
    uploadIdentity: (formData) => api.post('/me/identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getNotifications: () => api.get('/me/notifications')
  },

  // 5. ADMIN CONSOLE
  admin: {
    getSummary: () => api.get('/admin/summary'),
    getBookings: (params) => api.get('/admin/bookings', { params }),
    getBookingDetail: (id) => api.get(`/admin/bookings/${id}`),
    scanTicket: (code) => api.get(`/admin/bookings/scan/${encodeURIComponent(code)}`),
    checkInTicket: (data) => api.post('/admin/bookings/check-in', data),
    confirmDp: (id) => api.patch(`/admin/bookings/${id}/confirm-dp`),
    confirmPayment: (id) => api.patch(`/admin/bookings/${id}/confirm-payment`),
    rejectProof: (id, data) => api.patch(`/admin/bookings/${id}/reject-proof`, data),
    verifyIdentity: (id, data) => api.patch(`/admin/bookings/${id}/verify-identity`, data),
    changeToUmum: (id, data) => api.patch(`/admin/bookings/${id}/change-to-umum`, typeof data === 'string' ? { reason: data } : data),
    downgradeToUmum: (id, data) => api.patch(`/admin/bookings/${id}/change-to-umum`, typeof data === 'string' ? { reason: data } : data),
    cancelBooking: (id, reason) => api.patch(`/admin/bookings/${id}/cancel`, { reason }),
    manualBooking: (data) => api.post('/admin/bookings/manual', data),
    getSchedule: (fieldId, week) => api.get(`/admin/schedule?field_id=${fieldId}${week ? `&week=${week}` : ''}`),
    getBlockedSlots: (fieldId) => api.get(`/admin/schedule?field_id=${fieldId}`).then(res => ({ data: res.data?.blocked_slots || [] })),
    blockSlot: (data) => api.post('/admin/blocked-slots', data),
    unblockSlot: (id) => api.delete(`/admin/blocked-slots/${id}`),
    getUsers: (params) => api.get('/admin/users', { params }),
    verifyUserIdentity: (id, data) => api.patch(`/admin/users/${id}/identity`, data),
    createNews: (formData) => api.post('/admin/news', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateNews: (id, formData) => api.put(`/admin/news/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteNews: (id) => api.delete(`/admin/news/${id}`),
    getFileUrl: (type, filename) => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/files/${type}/${filename}`
  },

  // 6. SUPERADMIN CONSOLE
  superadmin: {
    getSummary: () => api.get('/superadmin/summary'),
    getAdmins: () => api.get('/superadmin/admins'),
    createAdmin: (data) => api.post('/superadmin/admins', data),
    resetAdminPassword: (id, data) => api.post(`/superadmin/admins/${id}/reset-password`, data),
    resetPassword: (id, data) => api.post(`/superadmin/admins/${id}/reset-password`, data),
    toggleAdminStatus: (id, is_active) => api.patch(`/superadmin/admins/${id}/status`, { is_active }),
    deleteAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
    getActivityLogs: (params) => api.get('/superadmin/activity', { params }),
    getFields: () => api.get('/public/fields'),
    updateField: (id, data) => api.patch(`/superadmin/fields/${id}`, data),
    updateFieldTariff: (id, data) => api.patch(`/superadmin/fields/${id}`, data),
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUserCategory: (id, data) => api.patch(`/admin/users/${id}/identity`, data),
    toggleUserStatus: (id) => api.patch(`/admin/users/${id}/identity`, { toggle_active: true }),
    getSettings: () => api.get('/superadmin/settings'),
    updateSettings: (data) => api.put('/superadmin/settings', data),
    getReports: (params) => api.get('/superadmin/reports', { params })
  }
};

export default apiClient;

