'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  image?: string;
  role?: {
    id?: string;
    name: string;
    permissions?: string[];
  };
  [key: string]: unknown; // Allow additional properties
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Session timeout - auto logout after 30 minutes of inactivity
  useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    enabled: isAuthenticated,
    onWarning: () => {
      // Dismiss any existing session warning toast first
      toast.dismiss('session-warning');
      toast(
        'Sesi Anda akan berakhir dalam 5 menit karena tidak ada aktivitas',
        {
          id: 'session-warning',
          icon: '⚠️',
          duration: 10000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
          },
        }
      );
    },
    onTimeout: () => {
      // Dismiss any existing session toast first
      toast.dismiss('session-expired');
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.', {
        id: 'session-expired',
        duration: 5000,
      });
    },
  });

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  // Session expiry duration: 8 hours in milliseconds
  const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000;

  const checkAuth = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);

        // Check if session has expired (8 hours from login)
        if (userData.loginAt) {
          const loginTime = userData.loginAt;
          const now = Date.now();
          const sessionAge = now - loginTime;

          if (sessionAge > SESSION_EXPIRY_MS) {
            // Session expired - clear and redirect
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
            router.push('/sign-in/login');
            return;
          }
        }

        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/sign-in/login');
      }
    } catch {
      setIsAuthenticated(false);
      router.push('/sign-in/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin text-[#E57373] mx-auto mb-4' />
          <p className='text-gray-500 dark:text-gray-400'>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Hook to get current user from localStorage
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      if (user) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/sign-in/login';
    }
  };

  return { user, isLoading, logout };
}
