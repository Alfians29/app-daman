'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type UseSessionTimeoutOptions = {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
};

/**
 * Hook to handle session timeout - auto logout after idle time
 * Default: 30 minutes timeout
 */
export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onWarning,
  onTimeout,
  enabled = true,
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  const handleLogout = useCallback(async () => {
    // Get userId from stored user object
    let userId: string | null = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user?.id || null;
      }
    } catch {
      userId = null;
    }

    // Call logout API with session_expired reason to log to audit
    if (userId) {
      try {
        console.log('[Session Timeout] Logging out user:', userId);
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, reason: 'session_expired' }),
        });
        console.log('[Session Timeout] Logout logged successfully');
      } catch (error) {
        console.error(
          '[Session Timeout] Failed to log session timeout:',
          error
        );
      }
    } else {
      console.warn('[Session Timeout] No userId found in localStorage');
    }

    // Clear session
    localStorage.removeItem('userId');
    sessionStorage.clear();

    // Custom callback
    if (onTimeout) {
      onTimeout();
    }

    // Redirect to login
    router.push('/sign-in/login');
  }, [router, onTimeout]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!enabled) return;

    // Reset warning flag when user becomes active again
    warningShownRef.current = false;

    // Set warning timer
    if (onWarning && warningMinutes > 0) {
      warningRef.current = setTimeout(() => {
        // Only show warning once per idle period
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          onWarning();
        }
      }, warningMs);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [enabled, timeoutMs, warningMs, warningMinutes, onWarning, handleLogout]);

  useEffect(() => {
    if (!enabled) return;

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Debounced reset to avoid excessive calls
    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedReset = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resetTimer, 1000);
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, debouncedReset, { passive: true });
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, debouncedReset);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [enabled, resetTimer]);

  return {
    resetTimer,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeoutMs - elapsed);
    },
  };
}
