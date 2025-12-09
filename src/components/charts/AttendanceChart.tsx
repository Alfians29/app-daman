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
  Legend,
} from 'recharts';
import { monthlyAttendanceData } from '@/data/dummy';

interface AttendanceChartProps {
  data?: typeof monthlyAttendanceData;
  period?: '1bulan' | '6bulan' | '1tahun';
}

function AttendanceChartContent({
  data = monthlyAttendanceData,
  period = '1tahun',
}: AttendanceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-gray-50 animate-pulse rounded-xl' />
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
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorHadir' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#E57373' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#E57373' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorIzin' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#FFA726' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#FFA726' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorSakit' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#42A5F5' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#42A5F5' stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type='monotone'
            dataKey='hadir'
            name='Hadir'
            stroke='#E57373'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorHadir)'
          />
          <Area
            type='monotone'
            dataKey='izin'
            name='Izin'
            stroke='#FFA726'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorIzin)'
          />
          <Area
            type='monotone'
            dataKey='sakit'
            name='Sakit'
            stroke='#42A5F5'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorSakit)'
          />
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
      <div className='w-full h-[300px] bg-gray-50 animate-pulse rounded-xl' />
    ),
  }
);
