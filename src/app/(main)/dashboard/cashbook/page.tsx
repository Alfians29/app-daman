'use client';

import { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  User,
  Users,
  Calendar,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { cashEntries, teamMembers, CashEntry } from '@/data/dummy';
import { formatCurrency } from '@/lib/utils';

// Simulated current user (logged in user)
const currentUser = teamMembers[1]; // Muhammad Alfian

// Simulated monthly kas payment status per member
const kasPaymentStatus: {
  [memberId: string]: { month: string; paid: boolean; amount: number }[];
} = {
  '1': [{ month: '2025-12', paid: true, amount: 50000 }],
  '2': [{ month: '2025-12', paid: true, amount: 50000 }],
  '3': [{ month: '2025-12', paid: true, amount: 50000 }],
  '4': [{ month: '2025-12', paid: false, amount: 0 }],
  '5': [{ month: '2025-12', paid: true, amount: 50000 }],
  '6': [{ month: '2025-12', paid: false, amount: 0 }],
  '7': [{ month: '2025-12', paid: true, amount: 50000 }],
};

export default function CashBookPage() {
  const [showMyContribution, setShowMyContribution] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let transactions = cashEntries;

    // If showing my contribution, filter by current user
    if (showMyContribution) {
      transactions = transactions.filter((t) => t.memberId === currentUser.id);
    }

    // Search filter
    if (searchQuery) {
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.memberName?.toLowerCase() || '').includes(
            searchQuery.toLowerCase()
          )
      );
    }

    // Date filter
    if (dateFrom) {
      transactions = transactions.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      transactions = transactions.filter((t) => t.date <= dateTo);
    }

    // Category filter
    if (filterCategory !== 'all') {
      transactions = transactions.filter((t) => t.category === filterCategory);
    }

    return transactions;
  }, [showMyContribution, searchQuery, dateFrom, dateTo, filterCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const totalCashIn = cashEntries
    .filter((e) => e.category === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCash = totalCashIn - totalCashOut;

  // My contribution stats
  const myTransactions = cashEntries.filter(
    (t) => t.memberId === currentUser.id
  );
  const myTotalContribution = myTransactions
    .filter((t) => t.category === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Team payment progress for current month
  const currentMonth = '2025-12';
  const teamPaymentProgress = teamMembers.map((member) => {
    const payment = kasPaymentStatus[member.id]?.find(
      (p) => p.month === currentMonth
    );
    return {
      member,
      paid: payment?.paid || false,
      amount: payment?.amount || 0,
    };
  });
  const paidCount = teamPaymentProgress.filter((p) => p.paid).length;
  const progressPercent = (paidCount / teamMembers.length) * 100;

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setFilterCategory('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery || dateFrom || dateTo || filterCategory !== 'all';

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Kas</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Kelola keuangan dan kas tim
          </p>
        </div>
        <button
          onClick={() => {
            setShowMyContribution(!showMyContribution);
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            showMyContribution
              ? 'bg-[#E57373] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showMyContribution ? (
            <User className='w-4 h-4' />
          ) : (
            <Users className='w-4 h-4' />
          )}
          {showMyContribution ? 'Kontribusi Saya' : 'Semua Kas'}
        </button>
      </div>

      {/* My Contribution Card - Only show when toggled */}
      {showMyContribution && (
        <Card className='bg-gradient-to-r from-[#E57373] to-[#C62828] text-white'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
            <div className='flex items-center gap-4 flex-1'>
              <Avatar
                src={currentUser.image}
                name={currentUser.name}
                size='lg'
              />
              <div>
                <p className='font-semibold text-lg'>{currentUser.name}</p>
                <p className='text-white/80 text-sm'>{currentUser.position}</p>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-6'>
              <div className='text-center'>
                <p className='text-2xl font-bold'>
                  {formatCurrency(myTotalContribution)}
                </p>
                <p className='text-xs text-white/80'>Total Kontribusi</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold'>{myTransactions.length}</p>
                <p className='text-xs text-white/80'>Transaksi</p>
              </div>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-1'>
                  <CheckCircle className='w-5 h-5' />
                  <p className='text-xl font-bold'>Lunas</p>
                </div>
                <p className='text-xs text-white/80'>Status Bulan Ini</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Wallet className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Kas Tim</p>
              <p className='text-xl font-bold text-gray-800'>
                {formatCurrency(totalCash)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <ArrowUpCircle className='w-6 h-6 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Kas Masuk</p>
              <p className='text-xl font-bold text-emerald-600'>
                {formatCurrency(totalCashIn)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center'>
              <ArrowDownCircle className='w-6 h-6 text-red-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Kas Keluar</p>
              <p className='text-xl font-bold text-red-600'>
                {formatCurrency(totalCashOut)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center'>
              <Users className='w-6 h-6 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Kontributor</p>
              <p className='text-xl font-bold text-purple-600'>
                {teamMembers.length} orang
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Payment Progress */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='font-semibold text-gray-800'>
              Progress Pembayaran Kas Desember 2025
            </h3>
            <p className='text-sm text-gray-500'>
              {paidCount} dari {teamMembers.length} member sudah bayar
            </p>
          </div>
          <span className='text-2xl font-bold text-gray-800'>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className='h-4 bg-gray-100 rounded-full overflow-hidden mb-4'>
          <div
            className={`h-full rounded-full transition-all ${
              progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#E57373]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Member Status Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
          {teamPaymentProgress.map(({ member, paid, amount }) => (
            <div
              key={member.id}
              className={`flex flex-col items-center p-3 rounded-xl ${
                paid ? 'bg-emerald-50' : 'bg-gray-50'
              }`}
            >
              <Avatar src={member.image} name={member.name} size='sm' />
              <p className='text-xs font-medium text-gray-800 mt-1 text-center truncate w-full'>
                {member.nickname}
              </p>
              <div className='flex items-center gap-1 mt-1'>
                {paid ? (
                  <>
                    <CheckCircle className='w-3 h-3 text-emerald-600' />
                    <span className='text-[10px] text-emerald-600 font-medium'>
                      Lunas
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className='w-3 h-3 text-amber-600' />
                    <span className='text-[10px] text-amber-600 font-medium'>
                      Belum
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className='flex items-center gap-2 mb-4'>
          <Filter className='w-5 h-5 text-gray-400' />
          <h3 className='font-semibold text-gray-800'>Filter</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className='ml-auto text-xs text-[#E57373] hover:underline flex items-center gap-1'
            >
              <X className='w-3 h-3' />
              Reset
            </button>
          )}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {/* Search */}
          <input
            type='text'
            placeholder='Cari deskripsi...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />

          {/* Date From */}
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-gray-400' />
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange();
              }}
              className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            />
          </div>

          {/* Date To */}
          <div className='flex items-center gap-2'>
            <span className='text-gray-400'>-</span>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange();
              }}
              className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            />
          </div>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          >
            <option value='all'>Semua Kategori</option>
            <option value='income'>Kas Masuk</option>
            <option value='expense'>Kas Keluar</option>
          </select>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-800'>
            {showMyContribution
              ? 'Riwayat Kontribusi Saya'
              : 'Riwayat Transaksi'}
          </h3>
          <span className='text-sm text-gray-500'>
            {filteredTransactions.length} transaksi
          </span>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Tanggal
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Kategori
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Deskripsi
                </th>
                {!showMyContribution && (
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                    Member
                  </th>
                )}
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Tipe
                </th>
                <th className='text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={showMyContribution ? 5 : 6}
                    className='px-4 py-12 text-center text-gray-500'
                  >
                    <div className='flex flex-col items-center'>
                      <Wallet className='w-12 h-12 text-gray-300 mb-2' />
                      <p>Tidak ada transaksi ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((entry: CashEntry) => (
                  <tr key={entry.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {new Date(entry.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700'>
                        {entry.transactionCategory || 'Lain-lain'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-gray-800'>
                      {entry.description}
                    </td>
                    {!showMyContribution && (
                      <td className='px-4 py-3 text-sm text-gray-600'>
                        {entry.memberName || '-'}
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${
                          entry.category === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.category === 'income' ? (
                          <ArrowUpCircle className='w-3 h-3' />
                        ) : (
                          <ArrowDownCircle className='w-3 h-3' />
                        )}
                        {entry.category === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right'>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between mt-4 pt-4 border-t'>
            <p className='text-sm text-gray-500'>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>

              {/* Page numbers */}
              <div className='flex gap-1'>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-[#E57373] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
