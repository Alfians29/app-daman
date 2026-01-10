import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

export function getMonthName(month: number): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return months[month];
}

// Shift color utility - centralized color definitions for consistent styling
export type ShiftColorClasses = { bg: string; text: string; border: string };

export function getShiftColorClasses(color: string | null): ShiftColorClasses {
  const colors: Record<string, ShiftColorClasses> = {
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-700',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-700',
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-700',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-700',
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900/40',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-200 dark:border-pink-700',
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-700',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-700',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-700',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-600',
    },
  };
  return colors[color || 'emerald'] || colors.emerald;
}

/**
 * Get today's date string in YYYY-MM-DD format using local timezone
 * This fixes the timezone bug where toISOString() uses UTC,
 * causing dates to show as previous day in Indonesia (UTC+7) when time is before 7 AM
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get role color classes with dark mode support
 * Converts database role color strings to dark mode compatible Tailwind classes
 */
export function getRoleColorClasses(roleColor: string | null): string {
  // Map common color patterns to dark mode compatible classes
  const colorMap: Record<string, string> = {
    // Green variants
    'bg-green-100 text-green-700':
      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'bg-emerald-100 text-emerald-700':
      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    // Purple variants
    'bg-purple-100 text-purple-700':
      'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    'bg-violet-100 text-violet-700':
      'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    // Blue variants
    'bg-blue-100 text-blue-700':
      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'bg-sky-100 text-sky-700':
      'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    'bg-cyan-100 text-cyan-700':
      'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    'bg-indigo-100 text-indigo-700':
      'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    // Red variants
    'bg-red-100 text-red-700':
      'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    'bg-rose-100 text-rose-700':
      'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    'bg-pink-100 text-pink-700':
      'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    // Orange/Yellow variants
    'bg-orange-100 text-orange-700':
      'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    'bg-amber-100 text-amber-700':
      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    'bg-yellow-100 text-yellow-700':
      'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    // Gray variants
    'bg-gray-100 text-gray-700':
      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'bg-slate-100 text-slate-700':
      'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  };

  // If role color matches a known pattern, return the dark mode version
  if (roleColor && colorMap[roleColor]) {
    return colorMap[roleColor];
  }

  // Default fallback for unknown colors
  return (
    roleColor || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  );
}
