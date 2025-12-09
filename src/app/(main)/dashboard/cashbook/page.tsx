'use client';

import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Card, SummaryCard } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { Table, StatusBadge } from '@/components/ui/Table';
import { CashBookChart } from '@/components/charts/CashBookChart';
import { CashBreakdownChart } from '@/components/charts/CashBreakdownChart';
import {
  payrollEntries,
  cashEntries,
  teamMembers,
  PayrollEntry,
} from '@/data/dummy';
import { formatCurrency } from '@/lib/utils';

export default function CashBookPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate statistics
  const totalCashIn = cashEntries
    .filter((e) => e.category === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCash = totalCashIn - totalCashOut;
  const userContributions = cashEntries
    .filter((e) => e.memberName)
    .reduce((sum, e) => sum + e.amount, 0);

  // Filter payroll records
  const filteredPayroll = payrollEntries.filter(
    (record) =>
      record.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'member',
      header: 'Anggota',
      render: (record: PayrollEntry) => (
        <div className='flex items-center gap-3'>
          <Avatar
            src={record.memberAvatar}
            name={record.memberName}
            size='sm'
          />
          <div>
            <p className='font-medium text-gray-800'>{record.memberName}</p>
            <p className='text-xs text-gray-500'>{record.position}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (record: PayrollEntry) => (
        <span className='text-gray-700'>
          {new Date(record.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'totalPay',
      header: 'Total Gaji',
      render: (record: PayrollEntry) => (
        <span className='font-medium text-gray-800'>
          {formatCurrency(record.totalPay)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (record: PayrollEntry) => (
        <StatusBadge
          status={record.status}
          variant={record.status === 'Lunas' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Kas</h1>
        <p className='text-gray-500'>Kelola keuangan dan kas tim</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <SummaryCard
          title='Total Kas Tim'
          value={formatCurrency(totalCash)}
          subtitle='Saldo saat ini'
          icon={<Wallet className='w-6 h-6' />}
          trend={{ value: 12, isPositive: true }}
          color='blue'
        />
        <SummaryCard
          title='Total Kontribusi User'
          value={formatCurrency(userContributions)}
          subtitle={`${teamMembers.length} kontributor`}
          icon={<TrendingUp className='w-6 h-6' />}
          color='green'
        />
        <SummaryCard
          title='Total Kas Masuk'
          value={formatCurrency(totalCashIn)}
          subtitle='Bulan ini'
          icon={<ArrowUpCircle className='w-6 h-6' />}
          color='green'
        />
        <SummaryCard
          title='Total Kas Keluar'
          value={formatCurrency(totalCashOut)}
          subtitle='Bulan ini'
          icon={<ArrowDownCircle className='w-6 h-6' />}
          color='red'
        />
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Cash Overview Chart */}
        <Card>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-gray-800'>
              Ikhtisar Kas
            </h3>
            <p className='text-sm text-gray-500'>
              Total Kas Tim, Pemasukan, Pengeluaran
            </p>
          </div>
          <CashBookChart />
        </Card>

        {/* Cash Breakdown Chart */}
        <Card>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-gray-800'>Rincian Kas</h3>
            <p className='text-sm text-gray-500'>
              Breakdown berdasarkan kategori
            </p>
          </div>
          <CashBreakdownChart />
        </Card>
      </div>

      {/* Search and Filter */}
      <SearchBar
        placeholder='Cari anggota...'
        value={searchQuery}
        onChange={setSearchQuery}
        showFilters
      />

      {/* Payroll Table */}
      <Card>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          Daftar Penggajian
        </h3>
        <Table
          columns={columns}
          data={filteredPayroll}
          keyExtractor={(record) => record.id}
          emptyMessage='Tidak ada data penggajian'
        />
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          Transaksi Terbaru
        </h3>
        <div className='space-y-3'>
          {cashEntries.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className='flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    entry.category === 'income'
                      ? 'bg-emerald-100'
                      : 'bg-red-100'
                  }`}
                >
                  {entry.category === 'income' ? (
                    <ArrowUpCircle className='w-5 h-5 text-emerald-600' />
                  ) : (
                    <ArrowDownCircle className='w-5 h-5 text-red-600' />
                  )}
                </div>
                <div>
                  <p className='font-medium text-gray-800'>
                    {entry.description}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {new Date(entry.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {entry.memberName && ` • ${entry.memberName}`}
                  </p>
                </div>
              </div>
              <span
                className={`font-semibold ${
                  entry.category === 'income'
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {entry.category === 'income' ? '+' : '-'}
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
