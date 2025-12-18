'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Shift setting type from database
type ShiftSetting = {
  shiftType: string;
  name: string;
  color: string | null;
};

// Dynamic data item - uses shiftType as keys
type AttendanceDataItem = {
  name: string;
  [key: string]: string | number;
};

interface AttendanceChartProps {
  data?: AttendanceDataItem[];
  shiftSettings?: ShiftSetting[];
  period?: '1bulan' | '6bulan' | '1tahun';
}

// Default colors for shifts if not configured in database
const defaultColors: Record<string, string> = {
  PAGI: '#3B82F6',
  MALAM: '#6366F1',
  PIKET_PAGI: '#10B981',
  PIKET_MALAM: '#8B5CF6',
  LIBUR: '#F43F5E',
  PAGI_MALAM: '#F59E0B',
};

// Convert color name to hex
const colorToHex = (color: string | null): string => {
  if (!color) return '#6B7280';
  const colorMap: Record<string, string> = {
    emerald: '#10B981',
    purple: '#8B5CF6',
    blue: '#3B82F6',
    gray: '#6B7280',
    red: '#F43F5E',
    amber: '#F59E0B',
    orange: '#F97316',
    yellow: '#EAB308',
    lime: '#84CC16',
    green: '#22C55E',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    indigo: '#6366F1',
    violet: '#8B5CF6',
    fuchsia: '#D946EF',
    pink: '#EC4899',
    rose: '#F43F5E',
  };
  return colorMap[color.toLowerCase()] || color;
};

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

// Generate default empty data
const generateDefaultData = (): AttendanceDataItem[] => {
  return monthNames.map((name) => ({ name }));
};

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700'>
        <p className='font-semibold text-gray-800 dark:text-white mb-2'>
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className='flex items-center gap-2 text-sm'>
            <div
              className='w-3 h-3 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span className='text-gray-600 dark:text-gray-300'>
              {entry.name}:
            </span>
            <span className='font-medium text-gray-800 dark:text-white'>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function AttendanceChartContent({
  data,
  shiftSettings = [],
  period = '1tahun',
}: AttendanceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-xl' />
    );
  }

  const chartData = data || generateDefaultData();

  // Data is already filtered by period in the parent component
  // For 1bulan: 4 weeks, for 6bulan: 6 months, for 1tahun: 12 months
  const filteredData = chartData;

  // Get active shift types from settings or use defaults
  const activeShifts =
    shiftSettings.length > 0
      ? shiftSettings
      : [
          { shiftType: 'PAGI', name: 'Pagi', color: 'blue' },
          { shiftType: 'MALAM', name: 'Malam', color: 'indigo' },
          { shiftType: 'PIKET_PAGI', name: 'Piket Pagi', color: 'emerald' },
          { shiftType: 'PIKET_MALAM', name: 'Piket Malam', color: 'purple' },
          { shiftType: 'LIBUR', name: 'Libur', color: 'rose' },
        ];

  return (
    <div className='w-full'>
      <ResponsiveContainer width='100%' height={300}>
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            {activeShifts.map((shift) => {
              const color = shift.color
                ? colorToHex(shift.color)
                : defaultColors[shift.shiftType] || '#6B7280';
              return (
                <linearGradient
                  key={`gradient-${shift.shiftType}`}
                  id={`gradient-${shift.shiftType}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop offset='5%' stopColor={color} stopOpacity={0.3} />
                  <stop offset='95%' stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='#E5E7EB'
            vertical={false}
          />
          <XAxis
            dataKey='name'
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeShifts.map((shift) => {
            const color = shift.color
              ? colorToHex(shift.color)
              : defaultColors[shift.shiftType] || '#6B7280';
            return (
              <Area
                key={shift.shiftType}
                type='monotone'
                dataKey={shift.shiftType}
                name={shift.name}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#gradient-${shift.shiftType})`}
                dot={false}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  fill: 'white',
                  stroke: color,
                }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const AttendanceChart = dynamic(
  () => Promise.resolve(AttendanceChartContent),
  {
    ssr: false,
    loading: () => (
      <div className='w-full h-[300px] bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-xl' />
    ),
  }
);
