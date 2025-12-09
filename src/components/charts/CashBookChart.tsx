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
import { cashFlowData } from '@/data/dummy';

interface CashBookChartProps {
  data?: typeof cashFlowData;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}rb`;
  }
  return value.toString();
};

function CashBookChartContent({ data = cashFlowData }: CashBookChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-gray-50 animate-pulse rounded-xl' />
    );
  }

  return (
    <div className='w-full h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorMasuk' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#4CAF50' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#4CAF50' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorKeluar' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#E57373' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#E57373' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorSaldo' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#2196F3' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#2196F3' stopOpacity={0} />
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
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [
              new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(value),
              '',
            ]}
          />
          <Legend />
          <Area
            type='monotone'
            dataKey='masuk'
            name='Kas Masuk'
            stroke='#4CAF50'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorMasuk)'
          />
          <Area
            type='monotone'
            dataKey='keluar'
            name='Kas Keluar'
            stroke='#E57373'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorKeluar)'
          />
          <Area
            type='monotone'
            dataKey='saldo'
            name='Saldo'
            stroke='#2196F3'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorSaldo)'
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
      <div className='w-full h-[300px] bg-gray-50 animate-pulse rounded-xl' />
    ),
  }
);
