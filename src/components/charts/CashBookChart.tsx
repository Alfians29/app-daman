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

function CashBookChartContent({ data = defaultData }: CashBookChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='w-full h-[300px] bg-gray-50 dark:bg-gray-700 animate-pulse rounded-xl' />
    );
  }

  return (
    <div className='w-full h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={data}
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
          <Line
            type='monotone'
            dataKey='masuk'
            name='Kas Masuk'
            stroke='#4CAF50'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='keluar'
            name='Kas Keluar'
            stroke='#E57373'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='saldo'
            name='Saldo'
            stroke='#2196F3'
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CashBookChart = dynamic(
  () => Promise.resolve(CashBookChartContent),
  {
    ssr: false,
    loading: () => (
      <div className='w-full h-[300px] bg-gray-50 dark:bg-gray-700 animate-pulse rounded-xl' />
    ),
  }
);
