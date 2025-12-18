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

type CashFlowDataItem = {
  name: string;
  masuk: number;
  keluar: number;
  saldo: number;
};

interface CashBookChartProps {
  data?: CashFlowDataItem[];
}

const defaultData: CashFlowDataItem[] = [
  { name: 'Jan', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Feb', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Mar', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Apr', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Mei', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Jun', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Jul', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Agu', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Sep', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Okt', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Nov', masuk: 0, keluar: 0, saldo: 0 },
  { name: 'Des', masuk: 0, keluar: 0, saldo: 0 },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}rb`;
  }
  return value.toString();
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
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function CashBookChartContent({ data = defaultData }: CashBookChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-xl' />
    );
  }

  return (
    <div className='w-full h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id='gradientMasuk' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#059669' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#059669' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='gradientKeluar' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#DC2626' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#DC2626' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='gradientSaldo' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#2563EB' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#2563EB' stopOpacity={0} />
            </linearGradient>
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
            tickFormatter={formatCurrency}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type='monotone'
            dataKey='masuk'
            name='Kas Masuk'
            stroke='#059669'
            strokeWidth={2.5}
            fill='url(#gradientMasuk)'
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              fill: 'white',
              stroke: '#059669',
            }}
          />
          <Area
            type='monotone'
            dataKey='keluar'
            name='Kas Keluar'
            stroke='#DC2626'
            strokeWidth={2.5}
            fill='url(#gradientKeluar)'
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              fill: 'white',
              stroke: '#DC2626',
            }}
          />
          <Area
            type='monotone'
            dataKey='saldo'
            name='Saldo'
            stroke='#2563EB'
            strokeWidth={2.5}
            fill='url(#gradientSaldo)'
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              fill: 'white',
              stroke: '#2563EB',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CashBookChart = dynamic(
  () => Promise.resolve(CashBookChartContent),
  {
    ssr: false,
    loading: () => (
      <div className='w-full h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-xl' />
    ),
  }
);
