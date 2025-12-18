'use client';

/**
 * Simple client-side cache using sessionStorage
 * - Data hilang saat browser ditutup
 * - Setiap entry punya TTL (time to live)
 */

type CacheEntry<T> = {
  data: T;
  expiry: number; // timestamp
};

// Default TTL in minutes for different data types
export const CACHE_TTL = {
  users: 5,
  shifts: 10,
  roles: 10,
  attendance: 2,
  cash: 2,
  activities: 2,
  reports: 3,
  default: 3,
} as const;

// Endpoints excluded from caching (too large or realtime needed)
const CACHE_EXCLUDED = ['/schedule', '/activities'];

const CACHE_PREFIX = 'app_cache_';

/**
 * Get data from cache if not expired
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);

    // Check if expired
    if (Date.now() > entry.expiry) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set data to cache with TTL
 * Auto-cleans expired entries if quota exceeded
 */
export function setCache<T>(
  key: string,
  data: T,
  ttlMinutes: number = CACHE_TTL.default
): void {
  if (typeof window === 'undefined') return;

  const entry: CacheEntry<T> = {
    data,
    expiry: Date.now() + ttlMinutes * 60 * 1000,
  };

  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    // Quota exceeded - try to make space
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // First, clear expired entries
      cleanExpiredCache();

      try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      } catch {
        // Still full - clear all cache and try again
        clearAllCache();
        try {
          sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
        } catch {
          // Give up - data too large to cache
          console.warn('Cache: Data too large to store:', key);
        }
      }
    }
  }
}

/**
 * Remove expired cache entries
 */
function cleanExpiredCache(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const item = sessionStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          if (entry.expiry && now > entry.expiry) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}

/**
 * Remove specific cache entry
 */
export function invalidateCache(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Remove all cache entries that start with prefix
 * Useful for invalidating related data (e.g., all 'users' caches)
 */
export function invalidateCachePrefix(prefix: string): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX + prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Generate cache key from endpoint and params
 */
export function getCacheKey(
  endpoint: string,
  params?: Record<string, string>
): string {
  let key = endpoint.replace(/^\//, '').replace(/\//g, '_');
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    key += `?${sortedParams}`;
  }
  return key;
}

/**
 * Get TTL based on endpoint
 * Returns 0 for excluded endpoints (no caching)
 */
export function getTTLForEndpoint(endpoint: string): number {
  // Check if endpoint is excluded from caching
  if (CACHE_EXCLUDED.some((ex) => endpoint.includes(ex))) return 0;

  if (endpoint.includes('/users')) return CACHE_TTL.users;
  if (endpoint.includes('/shifts')) return CACHE_TTL.shifts;
  if (endpoint.includes('/roles')) return CACHE_TTL.roles;
  if (endpoint.includes('/attendance')) return CACHE_TTL.attendance;
  if (endpoint.includes('/cash')) return CACHE_TTL.cash;
  if (endpoint.includes('/activities')) return CACHE_TTL.activities;
  if (endpoint.includes('/reports')) return CACHE_TTL.reports;
  return CACHE_TTL.default;
}
