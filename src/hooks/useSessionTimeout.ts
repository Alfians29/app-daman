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

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  const handleLogout = useCallback(async () => {
    // Get userId before clearing
    const userId = localStorage.getItem('userId');

    // Call logout API with session_expired reason to log to audit
    if (userId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, reason: 'session_expired' }),
        });
      } catch (error) {
        console.error('Failed to log session timeout:', error);
      }
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

    // Set warning timer
    if (onWarning && warningMinutes > 0) {
      warningRef.current = setTimeout(() => {
        onWarning();
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
