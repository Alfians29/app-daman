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
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      border: 'border-pink-200',
    },
    cyan: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
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
