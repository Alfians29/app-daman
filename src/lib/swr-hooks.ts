'use client';

import useSWR, { SWRConfiguration } from 'swr';

// Base fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Default SWR options with caching
const defaultOptions: SWRConfiguration = {
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: false, // Don't refetch on reconnect
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  keepPreviousData: true, // Keep showing old data while fetching new
};

// Hook for fetching users
export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/users',
    fetcher,
    defaultOptions
  );
  return {
    users: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching shifts
export function useShifts() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/shifts',
    fetcher,
    defaultOptions
  );
  return {
    shifts: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching job types
export function useJobTypes() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/job-types',
    fetcher,
    defaultOptions
  );
  return {
    jobTypes: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching schedule with month/year filter
export function useSchedule(month?: number, year?: number) {
  const query = new URLSearchParams();
  if (month) query.set('month', month.toString());
  if (year) query.set('year', year.toString());
  const url = `/api/schedule${query.toString() ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    defaultOptions
  );
  return {
    schedules: data?.data || [],
    shiftColors: data?.shiftColors || {},
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching attendance with date range
export function useAttendance(dateFrom?: string, dateTo?: string) {
  const query = new URLSearchParams();
  if (dateFrom) query.set('dateFrom', dateFrom);
  if (dateTo) query.set('dateTo', dateTo);
  const url = `/api/attendance${query.toString() ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    defaultOptions
  );
  return {
    attendance: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching reports with date range
export function useReports(dateFrom?: string, dateTo?: string) {
  const query = new URLSearchParams();
  if (dateFrom) query.set('dateFrom', dateFrom);
  if (dateTo) query.set('dateTo', dateTo);
  const url = `/api/reports${query.toString() ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    defaultOptions
  );
  return {
    reports: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching all reports for a specific user (no date filter)
// Separate from team reports for independent loading
export function useUserReports(memberId?: string) {
  const query = new URLSearchParams();
  if (memberId) query.set('memberId', memberId);
  const url = memberId ? `/api/reports?${query}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    defaultOptions
  );
  return {
    reports: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching cash entries with month/year filter
export function useCash(month?: number, year?: number) {
  const query = new URLSearchParams();
  if (month) query.set('month', month.toString());
  if (year) query.set('year', year.toString());
  const url = `/api/cash${query.toString() ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    defaultOptions
  );
  return {
    cashEntries: data?.data || [],
    summary: data?.summary || { income: 0, expense: 0, balance: 0 },
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching roles
export function useRoles() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/roles',
    fetcher,
    defaultOptions
  );
  return {
    roles: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching QR data with pagination
export function useQR(page: number = 1, limit: number = 10, search?: string) {
  const query = new URLSearchParams();
  query.set('page', page.toString());
  query.set('limit', limit.toString());
  if (search) query.set('qrId', search);
  const url = `/api/qr?${query}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    ...defaultOptions,
    dedupingInterval: 30000,
  });
  return {
    qrEntries: data?.data || [],
    total: data?.total || 0,
    totalQrIds: data?.totalQrIds || 0,
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching activities (audit log) with pagination
export function useActivities(params?: {
  page?: number;
  limit?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.type && params.type !== 'all') query.set('type', params.type);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.search) query.set('search', params.search);
  const url = `/api/activities${query.toString() ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    ...defaultOptions,
    dedupingInterval: 30000,
  });
  return {
    activities: data?.data || [],
    total: data?.total || 0,
    stats: data?.stats,
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching cash settings
export function useCashSettings() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/cash-settings',
    fetcher,
    defaultOptions
  );
  return {
    settings: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching dashboard chart summary (optimized aggregated data)
export function useDashboardCharts(year: number, userId?: string) {
  const query = new URLSearchParams();
  query.set('year', year.toString());
  if (userId) query.set('userId', userId);
  const url = `/api/dashboard/chart-summary?${query}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    ...defaultOptions,
    dedupingInterval: 120000, // 2 minutes - chart data doesn't change often
  });

  return {
    chartData: data?.data || null,
    isLoading,
    error,
  };
}
