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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { teamMembers } from '@/data/dummy';
import { Avatar } from './ui/Avatar';

// Simulasi role admin (ganti dengan auth context nanti)
const isAdmin = true;
const isSuperAdmin = true;
const currentUser = teamMembers[1]; // Muhammad Alfian

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Absensi', icon: UserCheck },
  { href: '/schedule', label: 'Jadwal', icon: CalendarDays },
  { href: '/dashboard/cashbook', label: 'Kas', icon: Wallet },
  { href: '/dashboard/about', label: 'Tentang Tim', icon: Users },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
];

const adminNavItems = [
  { href: '/admin/team', label: 'Kelola Tim', icon: Users },
  { href: '/admin/schedule', label: 'Kelola Jadwal', icon: CalendarCog },
  { href: '/admin/cash', label: 'Kelola Kas', icon: Banknote },
  { href: '/admin/attendance', label: 'Kelola Kehadiran', icon: ClipboardList },
];

const superAdminNavItems = [
  { href: '/superadmin/manage-roles', label: 'Manajemen Role', icon: Shield },
  { href: '/superadmin/audit-log', label: 'Audit Log', icon: ScrollText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

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

  const NavLink = ({
    item,
  }: {
    item: { href: string; label: string; icon: React.ElementType };
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={`
          group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
          ${
            active
              ? 'bg-[#E57373] text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }
        `}
      >
        <Icon
          size={20}
          className={active ? '' : 'group-hover:scale-110 transition-transform'}
        />
        <span className='font-medium text-sm flex-1'>{item.label}</span>
        {active && <ChevronRight size={16} className='opacity-70' />}
      </Link>
    );
  };

  const SectionDivider = ({ label }: { label: string }) => (
    <div className='pt-5 pb-2'>
      <div className='flex items-center gap-3 px-4'>
        <span className='text-[10px] font-bold uppercase tracking-wider text-[#E57373]'>
          {label}
        </span>
        <div className='h-px flex-1 bg-gray-100' />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white shadow-lg hover:bg-gray-50 active:scale-95 transition-transform duration-150'
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
            <div className='w-10 h-10 rounded-xl bg-[#E57373] flex items-center justify-center shadow-lg shadow-red-200/50'>
              <span className='text-lg font-bold text-white'>D</span>
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

        {/* Navigation */}
        <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
          {/* Main Menu */}
          <div className='space-y-1'>
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <>
              <SectionDivider label='Admin' />
              <div className='space-y-1'>
                {adminNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </>
          )}

          {/* Superadmin Section */}
          {isSuperAdmin && (
            <>
              <SectionDivider label='Superadmin' />
              <div className='space-y-1'>
                {superAdminNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className='p-3 border-t border-gray-100 dark:border-gray-700'>
          <div className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200'>
            <Avatar src={currentUser.image} name={currentUser.name} size='md' />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-gray-800 dark:text-white truncate'>
                {currentUser.nickname}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                {currentUser.position}
              </p>
            </div>
            <Link
              href='/sign-in/login'
              className='p-2 text-gray-400 hover:text-[#E57373] hover:bg-white dark:hover:bg-gray-500 rounded-lg transition-colors duration-200'
              title='Logout'
            >
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
