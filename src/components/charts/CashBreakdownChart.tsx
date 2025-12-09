'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cashBreakdownData } from '@/data/dummy';

interface CashBreakdownChartProps {
  data?: typeof cashBreakdownData;
}

const COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#7986CB',
  '#64B5F6',
  '#4FC3F7',
  '#4DD0E1',
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

function CashBreakdownChartContent({
  data = cashBreakdownData,
}: CashBreakdownChartProps) {
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
        <BarChart
          data={data}
          layout='vertical'
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='#f0f0f0'
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type='number'
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type='category'
            dataKey='category'
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#4B5563', fontSize: 12 }}
            width={80}
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
              'Jumlah',
            ]}
          />
          <Bar dataKey='amount' radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CashBreakdownChart = dynamic(
  () => Promise.resolve(CashBreakdownChartContent),
  {
    ssr: false,
    loading: () => (
      <div className='w-full h-[300px] bg-gray-50 animate-pulse rounded-xl' />
    ),
  }
);
