'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type AttendanceDataItem = {
  name: string;
  pagi: number;
  malam: number;
  piketPagi: number;
  piketMalam: number;
  libur: number;
};

interface AttendanceChartProps {
  data?: AttendanceDataItem[];
  period?: '1bulan' | '6bulan' | '1tahun';
}

const defaultData: AttendanceDataItem[] = [
  { name: 'Jan', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Feb', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Mar', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Apr', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Mei', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Jun', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Jul', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Agu', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Sep', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Okt', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Nov', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
  { name: 'Des', pagi: 0, malam: 0, piketPagi: 0, piketMalam: 0, libur: 0 },
];

function AttendanceChartContent({
  data = defaultData,
  period = '1tahun',
}: AttendanceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-gray-50 dark:bg-gray-700 animate-pulse rounded-xl' />
    );
  }

  const filteredData =
    period === '1bulan'
      ? data.slice(-1)
      : period === '6bulan'
      ? data.slice(-6)
      : data;

  return (
    <div className='w-full h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis
            dataKey='name'
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Line
            type='monotone'
            dataKey='pagi'
            name='Pagi'
            stroke='#3B82F6'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='malam'
            name='Malam'
            stroke='#6B7280'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='piketPagi'
            name='Piket Pagi'
            stroke='#10B981'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='piketMalam'
            name='Piket Malam'
            stroke='#8B5CF6'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='libur'
            name='Libur'
            stroke='#EF4444'
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const AttendanceChart = dynamic(
  () => Promise.resolve(AttendanceChartContent),
  {
    ssr: false,
    loading: () => (
      <div className='w-full h-[300px] bg-gray-50 dark:bg-gray-700 animate-pulse rounded-xl' />
    ),
  }
);
