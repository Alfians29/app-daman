const API_BASE_URL = '/api';

import {
  getCache,
  setCache,
  invalidateCachePrefix,
  getCacheKey,
  getTTLForEndpoint,
} from './cache';

// Helper to get current user ID from localStorage
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch {
    return null;
  }
  return null;
}

// ============================================
// GENERIC FETCH WRAPPER WITH CACHING
// ============================================
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const method = options.method?.toUpperCase() || 'GET';
  const isGetRequest = method === 'GET';
  const cacheKey = getCacheKey(endpoint);

  // Check cache for GET requests
  if (isGetRequest) {
    const cached = getCache<{ success: boolean; data?: T }>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const userId = getCurrentUserId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add user ID header for audit logging
    if (userId) {
      headers['X-User-ID'] = userId;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error || 'Request failed' };
    }

    // Cache successful GET responses (skip if TTL is 0 = excluded)
    if (isGetRequest && json.success) {
      const ttl = getTTLForEndpoint(endpoint);
      if (ttl > 0) {
        setCache(cacheKey, json, ttl);
      }
    }

    // Invalidate related cache on mutations (POST, PUT, DELETE, PATCH)
    if (!isGetRequest && json.success) {
      // Extract base endpoint (e.g., /users/123 -> users)
      const baseEndpoint = endpoint.split('/')[1];
      if (baseEndpoint) {
        invalidateCachePrefix(baseEndpoint);
      }
    }

    return json;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ============================================
// SHIFTS API
// ============================================
export const shiftsAPI = {
  getAll: () => fetchAPI('/shifts'),
  getOne: (id: string) => fetchAPI(`/shifts/${id}`),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/shifts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/shifts/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => fetchAPI(`/shifts/${id}`, { method: 'PATCH' }),
};

// ============================================
// ROLES API
// ============================================
export const rolesAPI = {
  getAll: () => fetchAPI('/roles'),
  getPermissions: () => fetchAPI('/roles/permissions'),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/roles/${id}`, { method: 'DELETE' }),
};

// ============================================
// USERS API
// ============================================
export const usersAPI = {
  getAll: () => fetchAPI('/users'),
  getOne: (id: string) => fetchAPI(`/users/${id}`),
  getRolesForSelect: () => fetchAPI('/users/options'),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => fetchAPI(`/users/${id}`, { method: 'PATCH' }),
};

// ============================================
// ACTIVITIES API
// ============================================
export const activitiesAPI = {
  getAll: (params?: {
    limit?: number;
    page?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.search) query.set('search', params.search);
    return fetchAPI(`/activities${query.toString() ? `?${query}` : ''}`);
  },
  log: (data: Record<string, unknown>) =>
    fetchAPI('/activities', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard'),
};

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceAPI = {
  getAll: (params?: {
    memberId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.date) query.set('date', params.date);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    return fetchAPI(`/attendance${query.toString() ? `?${query}` : ''}`);
  },
  getOne: (id: string) => fetchAPI(`/attendance/${id}`),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => fetchAPI(`/attendance/${id}`, { method: 'DELETE' }),
};

// ============================================
// SCHEDULE API
// ============================================
export const scheduleAPI = {
  getAll: (params?: { memberId?: string; month?: number; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.month) query.set('month', params.month.toString());
    if (params?.year) query.set('year', params.year.toString());
    return fetchAPI(`/schedule${query.toString() ? `?${query}` : ''}`);
  },
  create: (data: Record<string, unknown> | Record<string, unknown>[]) =>
    fetchAPI('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/schedule/${id}`, { method: 'DELETE' }),
};

// ============================================
// CASH API
// ============================================
export const cashAPI = {
  getAll: (params?: { category?: string; month?: number; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.month) query.set('month', params.month.toString());
    if (params?.year) query.set('year', params.year.toString());
    return fetchAPI(`/cash${query.toString() ? `?${query}` : ''}`);
  },
  create: (data: Record<string, unknown>) =>
    fetchAPI('/cash', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/cash/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/cash/${id}`, { method: 'DELETE' }),
};

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
  getAll: (params?: {
    memberId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.date) query.set('date', params.date);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    return fetchAPI(`/reports${query.toString() ? `?${query}` : ''}`);
  },
  getOne: (id: string) => fetchAPI(`/reports/${id}`),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/reports/${id}`, { method: 'DELETE' }),
};

// ============================================
// JOB TYPES API
// ============================================
export const jobTypesAPI = {
  getAll: () => fetchAPI('/job-types'),
  create: (data: Record<string, unknown>) =>
    fetchAPI('/job-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/job-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/job-types/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => fetchAPI(`/job-types/${id}`, { method: 'PATCH' }),
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (username: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: (userId: string) =>
    fetchAPI('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};

// ============================================
// CASH SETTINGS API
// ============================================
export const cashSettingsAPI = {
  getAll: () => fetchAPI<Record<string, string>>('/cash-settings'),
  save: (key: string, value: string, description?: string) =>
    fetchAPI('/cash-settings', {
      method: 'POST',
      body: JSON.stringify({ key, value, description }),
    }),
};

// ============================================
// QR DATA API
// ============================================
export const qrAPI = {
  getAll: (params?: { qrId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.qrId) query.set('qrId', params.qrId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchAPI(`/qr${query.toString() ? `?${query}` : ''}`);
  },
  search: (queries: Array<{ qrId: string; start: number; end: number }>) =>
    fetchAPI('/qr/search', {
      method: 'POST',
      body: JSON.stringify({ queries }),
    }),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const userId = getCurrentUserId();
    const headers: Record<string, string> = {};
    if (userId) headers['X-User-ID'] = userId;

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },
  delete: (id: string) => fetchAPI(`/qr/${id}`, { method: 'DELETE' }),
};
