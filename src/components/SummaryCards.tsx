'use client';

import { Users, TrendingUp, Wallet } from 'lucide-react';
import { SummaryCard } from './ui/Card';
import { getSummaryStats, teamMembers } from '@/data/dummy';
import { formatCurrency } from '@/lib/utils';

export function SummaryCards() {
  const stats = getSummaryStats();

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
      <SummaryCard
        title='Total Anggota'
        value={stats.totalMembers}
        subtitle={`${
          teamMembers.filter((m) => m.position === 'Manager').length
        } Manager, ${
          teamMembers.filter((m) => m.position === 'Staff').length
        } Staff`}
        icon={<Users className='w-6 h-6' />}
        color='red'
        delay={0}
      />
      <SummaryCard
        title='Persentase Kehadiran'
        value={`${stats.attendancePercentage}%`}
        subtitle={`${stats.presentToday} hadir hari ini`}
        icon={<TrendingUp className='w-6 h-6' />}
        trend={{ value: 5, isPositive: true }}
        color='green'
        delay={100}
      />
      <SummaryCard
        title='Kas Tim'
        value={formatCurrency(stats.totalCash)}
        subtitle={`+${formatCurrency(stats.totalCashIn)} / -${formatCurrency(
          stats.totalCashOut
        )}`}
        icon={<Wallet className='w-6 h-6' />}
        trend={{ value: 12, isPositive: true }}
        color='blue'
        delay={200}
      />
    </div>
  );
}
