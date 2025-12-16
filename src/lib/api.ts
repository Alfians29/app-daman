const API_BASE_URL = '/api';

// ============================================
// GENERIC FETCH WRAPPER
// ============================================
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.error || 'Request failed' };
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
  getAll: (limit?: number) =>
    fetchAPI(`/activities${limit ? `?limit=${limit}` : ''}`),
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
  getAll: (params?: { memberId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.date) query.set('date', params.date);
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
  getAll: (params?: { memberId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.date) query.set('date', params.date);
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
