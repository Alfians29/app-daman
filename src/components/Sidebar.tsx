'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  Wallet,
  Users,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Absensi', icon: UserCheck },
  { href: '/dashboard/cashbook', label: 'Kas', icon: Wallet },
  { href: '/dashboard/about', label: 'Tentang Tim', icon: Users },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white shadow-lg hover:bg-gray-50 transition-all duration-300 active:scale-95'
        aria-label='Toggle menu'
      >
        <div className='relative w-6 h-6'>
          <Menu
            size={24}
            className={`absolute inset-0 transition-all duration-300 ${
              isMobileOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
            }`}
          />
          <X
            size={24}
            className={`absolute inset-0 transition-all duration-300 ${
              isMobileOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
            }`}
          />
        </div>
      </button>

      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 ${
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
          transform transition-all duration-300 ease-out
          lg:translate-x-0 shadow-xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className='h-16 flex items-center justify-center border-b border-gray-100'>
          <div className='flex items-center gap-2'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#E57373] to-[#C62828] flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3'>
              <Users className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-800'>Daman</h1>
              <p className='text-xs text-gray-500'>Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-1'>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  animate-fade-in-left group
                  ${
                    active
                      ? 'bg-gradient-to-r from-[#E57373] to-[#EF5350] text-white shadow-lg shadow-red-200/50'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1'
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    active ? '' : 'group-hover:scale-110'
                  }`}
                />
                <span className='font-medium'>{item.label}</span>
                {active && (
                  <div className='ml-auto w-2 h-2 rounded-full bg-white/50 animate-pulse' />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100'>
          <div className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group'>
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#E57373] to-[#C62828] flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-md transition-transform duration-300 group-hover:scale-105'>
              AF
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-800 truncate'>
                Ahmad Fauzi
              </p>
              <p className='text-xs text-gray-500 truncate'>Manager</p>
            </div>
            <Link
              href='/sign-in/login'
              className='p-2 text-gray-400 hover:text-[#E57373] hover:bg-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md'
            >
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
