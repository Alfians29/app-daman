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
  Banknote,
  ClipboardList,
  CalendarDays,
  CalendarCog,
  Shield,
  ScrollText,
  ChevronRight,
  FileText,
  FileCog,
  Sun,
  Moon,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useCurrentUser } from './AuthGuard';
import { usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// All menu items - access is controlled purely by permissions assigned to each role
const allNavItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'menu.dashboard',
  },
  {
    href: '/attendance',
    label: 'Absensi',
    icon: UserCheck,
    permission: 'menu.attendance',
  },
  {
    href: '/manage-attendance',
    label: 'Kelola Absensi',
    icon: ClipboardList,
    permission: 'admin.attendance',
  },
  {
    href: '/schedule',
    label: 'Jadwal',
    icon: CalendarDays,
    permission: 'menu.schedule',
  },
  {
    href: '/manage-schedule',
    label: 'Kelola Jadwal',
    icon: CalendarCog,
    permission: 'admin.schedule',
  },
  {
    href: '/report',
    label: 'Report Harian',
    icon: FileText,
    permission: 'menu.report',
  },
  {
    href: '/manage-report',
    label: 'Kelola Report',
    icon: FileCog,
    permission: 'admin.report',
  },
  {
    href: '/cash',
    label: 'Kas',
    icon: Wallet,
    permission: 'menu.cash',
  },
  {
    href: '/manage-cash',
    label: 'Kelola Kas',
    icon: Banknote,
    permission: 'admin.cash',
  },
  {
    href: '/team',
    label: 'Tentang Tim',
    icon: Users,
    permission: 'menu.about',
  },
  {
    href: '/manage-team',
    label: 'Kelola Tim',
    icon: Users,
    permission: 'admin.team',
  },
  {
    href: '/manage-shift',
    label: 'Kelola Shift',
    icon: Clock,
    permission: 'admin.shift',
  },
  {
    href: '/manage-roles',
    label: 'Manajemen Role',
    icon: Shield,
    permission: 'superadmin.roles',
  },
  {
    href: '/audit-log',
    label: 'Audit Log',
    icon: ScrollText,
    permission: 'superadmin.audit',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user: currentUser, logout } = useCurrentUser();

  // State for user data fetched from API (includes updated profile image)
  const [userData, setUserData] = useState<{
    name?: string;
    nickname?: string;
    image?: string | null;
  } | null>(null);

  // Fetch user data from API to get latest profile image
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.id) {
        const result = await usersAPI.getOne(currentUser.id);
        if (result.success && result.data) {
          setUserData(
            result.data as {
              name?: string;
              nickname?: string;
              image?: string | null;
            }
          );
        }
      }
    };
    fetchUserData();
  }, [currentUser?.id, pathname]); // Re-fetch on route change to get latest data

  // Get user permissions from role
  const userPermissions = currentUser?.role?.permissions || [];

  // Check if user has a specific permission
  const hasPermission = (code: string) => {
    return userPermissions.includes(code);
  };

  // Filter menu items based on permissions
  const filteredNavItems = allNavItems.filter((item) =>
    hasPermission(item.permission)
  );

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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

  // Theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const NavLink = ({
    item,
  }: {
    item: {
      href: string;
      label: string;
      icon: React.ComponentType<{ size?: number }>;
    };
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-200 group relative
          ${
            active
              ? 'bg-[#E57373] text-white shadow-lg shadow-red-200/50'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
          }
        `}
      >
        <Icon size={20} />
        <span className='flex-1'>{item.label}</span>
        {active && (
          <ChevronRight
            size={16}
            className='opacity-70 group-hover:translate-x-0.5 transition-transform'
          />
        )}
      </Link>
    );
  };

  const SectionDivider = ({ label }: { label: string }) => (
    <div className='pt-4 pb-2'>
      <p className='px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
        {label}
      </p>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
        aria-label='Toggle menu'
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-40
          flex flex-col transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className='h-16 flex items-center px-5 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center gap-3'>
            <div className='w-18 h-10 rounded-lg bg-[#E57373] flex items-center justify-center shadow-lg shadow-red-200/50'>
              <Image
                src='/logoputih.png'
                alt='Logo'
                width={150}
                height={150}
                style={{ width: 'auto', height: 'auto' }}
                loading='eager'
              />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-800 dark:text-white'>
                Daman
              </h1>
              <p className='text-[10px] text-gray-400 uppercase tracking-wider'>
                Management System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - all menus in single list, filtered by permissions */}
        <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
          <div className='space-y-1'>
            {filteredNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </nav>

        {/* User Info with Dropdown */}
        <div
          ref={userMenuRef}
          className='p-3 border-t border-gray-100 dark:border-gray-700 relative'
        >
          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className='absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-100 dark:border-gray-600 overflow-hidden'>
              {/* Theme Toggle */}
              <div className='flex items-center justify-between gap-3 px-4 py-3'>
                <div className='flex items-center gap-3'>
                  {isDarkMode ? (
                    <Moon size={18} className='text-indigo-500' />
                  ) : (
                    <Sun size={18} className='text-amber-500' />
                  )}
                  <span className='text-sm text-gray-700 dark:text-gray-200'>
                    Mode Gelap
                  </span>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={toggleTheme}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#E57373]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Settings / Profile */}
              <Link
                href='/profile'
                className='w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-t border-gray-100 dark:border-gray-600'
              >
                <User size={18} className='text-gray-500' />
                <span>Profil</span>
              </Link>

              {/* Logout */}
              <button
                onClick={() => {
                  toast.success('Logout berhasil!');
                  logout();
                }}
                className='w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-600'
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* User Card */}
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className='w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200'
          >
            {userData?.image ? (
              <img
                src={userData.image}
                alt={userData.name || (currentUser?.name as string) || 'User'}
                className='w-10 h-10 rounded-full object-cover'
              />
            ) : (
              <div className='w-10 h-10 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                <span className='text-sm font-bold text-white'>
                  {(userData?.name || (currentUser?.name as string) || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div className='flex-1 min-w-0 text-left'>
              <p className='text-sm font-semibold text-gray-800 dark:text-white truncate'>
                {userData?.nickname ||
                  userData?.name ||
                  currentUser?.nickname ||
                  currentUser?.name ||
                  'User'}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                {currentUser?.role?.name || 'Member'}
              </p>
            </div>
            <ChevronUp
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${
                isUserMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
