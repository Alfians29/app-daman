'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthGuard } from '@/components/AuthGuard';
import { SWRProvider } from '@/components/SWRProvider';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <SWRProvider>
      <SettingsProvider>
        <AuthGuard>
          <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
            <Sidebar />
            <main className='flex-1 lg:ml-64 p-6 lg:p-8'>
              <div className='max-w-[1440px] mx-auto'>{children}</div>
            </main>
            <Toaster
              position='bottom-right'
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#10B981',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />
          </div>
        </AuthGuard>
      </SettingsProvider>
    </SWRProvider>
  );
}
