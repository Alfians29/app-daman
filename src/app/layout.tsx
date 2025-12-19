import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Daman - Management System',
  description: 'Sistem manajemen Daman untuk absensi, kas, dan profil anggota',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id'>
      <body className={`${inter.variable} ${firaCode.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
