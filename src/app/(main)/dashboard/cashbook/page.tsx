'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { cashAPI, usersAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type CashEntry = {
  id: string;
  memberId: string;
  member?: { id: string; name: string; image?: string };
  date: string;
  amount: number;
  category: string;
  transactionCategory: string | null;
  description: string;
};

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  image: string | null;
  isActive: boolean;
};

const CURRENT_USER_ID = 'user-2';
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

export default function CashBookPage() {
  const [showMyContribution, setShowMyContribution] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const itemsPerPage = 10;

  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [cashRes, usersRes] = await Promise.all([
      cashAPI.getAll(),
      usersAPI.getAll(),
    ]);
    if (cashRes.success && cashRes.data)
      setCashEntries(cashRes.data as CashEntry[]);
    if (usersRes.success && usersRes.data) {
      const activeUsers = (usersRes.data as TeamMember[]).filter(
        (u: TeamMember) => u.isActive
      );
      setTeamMembers(activeUsers);
      setCurrentUser(
        activeUsers.find((u: TeamMember) => u.id === CURRENT_USER_ID) ||
          activeUsers[0]
      );
    }
    setIsLoading(false);
  };

  // Helper: check if entry is a kas payment (transactionCategory = 'Kas Bulanan')
  const isKasPayment = (entry: CashEntry): boolean => {
    return entry.transactionCategory === 'Kas Bulanan';
  };

  // Helper: get year-month string from date
  const getYearMonth = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
  };

  // Generate yearly payment progress from cash entries
  const yearlyPaymentProgress = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return monthNames.map((month, index) => {
      const targetMonth = `${currentYear}-${String(index + 1).padStart(
        2,
        '0'
      )}`;

      const memberPayments = teamMembers.map((member) => {
        // Only count kas payments for this member in this month
        const kasPayments = cashEntries.filter(
          (e) =>
            e.memberId === member.id &&
            isKasPayment(e) &&
            getYearMonth(e.date) === targetMonth
        );
        const totalKasAmount = kasPayments.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        );

        return {
          member,
          paid: totalKasAmount >= 15000,
          amount: totalKasAmount,
        };
      });

      const paidCount = memberPayments.filter((p) => p.paid).length;
      const totalAmount = memberPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        month,
        fullMonth: targetMonth,
        paidCount,
        totalMembers: teamMembers.length,
        percent:
          teamMembers.length > 0
            ? Math.round((paidCount / teamMembers.length) * 100)
            : 0,
        totalAmount,
        memberPayments,
      };
    });
  }, [cashEntries, teamMembers]);

  // Yearly stats
  const yearlyStats = useMemo(() => {
    const totalPossiblePayments = teamMembers.length * 12;
    let totalPaidPayments = 0;
    let totalAmountCollected = 0;

    yearlyPaymentProgress.forEach((month) => {
      totalPaidPayments += month.paidCount;
      totalAmountCollected += month.totalAmount;
    });

    return {
      totalPossiblePayments,
      totalPaidPayments,
      percentPaid:
        totalPossiblePayments > 0
          ? Math.round((totalPaidPayments / totalPossiblePayments) * 100)
          : 0,
      totalAmountCollected,
    };
  }, [yearlyPaymentProgress, teamMembers.length]);

  const selectedMonthData = selectedMonth
    ? yearlyPaymentProgress.find((m) => m.fullMonth === selectedMonth)
    : null;

  const filteredTransactions = useMemo(() => {
    let transactions = [...cashEntries];
    if (showMyContribution && currentUser)
      transactions = transactions.filter((t) => t.memberId === currentUser.id);
    if (searchQuery)
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.member?.name?.toLowerCase() || '').includes(
            searchQuery.toLowerCase()
          )
      );
    if (dateFrom) transactions = transactions.filter((t) => t.date >= dateFrom);
    if (dateTo) transactions = transactions.filter((t) => t.date <= dateTo);
    if (filterCategory !== 'all')
      transactions = transactions.filter(
        (t) => t.category.toLowerCase() === filterCategory.toLowerCase()
      );
    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    cashEntries,
    showMyContribution,
    searchQuery,
    dateFrom,
    dateTo,
    filterCategory,
    currentUser,
  ]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCashIn = cashEntries
    .filter((e) => e.category.toLowerCase() === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category.toLowerCase() === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCash = totalCashIn - totalCashOut;

  const myTransactions = cashEntries.filter(
    (t) => currentUser && t.memberId === currentUser.id
  );
  const myTotalContribution = myTransactions
    .filter((t) => t.category.toLowerCase() === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const myPaidMonths = yearlyPaymentProgress.filter((m) => {
    const memberPayment = m.memberPayments.find(
      (p) => currentUser && p.member.id === currentUser.id
    );
    return memberPayment?.paid;
  }).length;

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setFilterCategory('all');
    setCurrentPage(1);
  };
  const hasActiveFilters =
    searchQuery || dateFrom || dateTo || filterCategory !== 'all';
  const handleFilterChange = () => setCurrentPage(1);

  if (isLoading)
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );

  const currentMonth = new Date().getMonth();

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kas'
        description='Kelola keuangan dan kas tim'
        icon={Wallet}
        actions={
          <button
            onClick={() => {
              setShowMyContribution(!showMyContribution);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showMyContribution
                ? 'bg-white text-[#E57373]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {showMyContribution ? (
              <User className='w-4 h-4' />
            ) : (
              <Users className='w-4 h-4' />
            )}
            {showMyContribution ? 'Kontribusi Saya' : 'Semua Kas'}
          </button>
        }
      />

      {/* My Contribution Card */}
      {showMyContribution && currentUser && (
        <Card className='bg-gradient-to-r from-[#E57373] to-[#C62828] text-white'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
            <div className='flex items-center gap-4 flex-1'>
              <Avatar
                src={currentUser.image ?? undefined}
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
                  <p className='text-xl font-bold'>{myPaidMonths}/12</p>
                </div>
                <p className='text-xs text-white/80'>Bulan Lunas</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      {!showMyContribution && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
                <Wallet className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Saldo Kas</p>
                <p className='text-xl font-bold text-blue-600'>
                  {formatCurrency(totalCash)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
                <ArrowDownCircle className='w-6 h-6 text-emerald-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Total Pemasukan</p>
                <p className='text-xl font-bold text-emerald-600'>
                  {formatCurrency(totalCashIn)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center'>
                <ArrowUpCircle className='w-6 h-6 text-red-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Total Pengeluaran</p>
                <p className='text-xl font-bold text-red-600'>
                  {formatCurrency(totalCashOut)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-purple-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Progress Kas</p>
                <p className='text-xl font-bold text-purple-600'>
                  {yearlyStats.percentPaid}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Yearly Kas Progress Chart */}
      {!showMyContribution && (
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>
                Progress Kas Tahunan {new Date().getFullYear()}
              </h3>
              <p className='text-sm text-gray-500'>
                Klik bulan untuk melihat detail pembayaran
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-500'>Total Terkumpul</p>
              <p className='text-lg font-bold text-emerald-600'>
                {formatCurrency(yearlyStats.totalAmountCollected)}
              </p>
            </div>
          </div>

          {/* Yearly Progress Bar */}
          <div className='mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                Progress Tahunan
              </span>
              <span className='text-sm font-bold text-gray-800'>
                {yearlyStats.percentPaid}%
              </span>
            </div>
            <div className='h-4 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all ${
                  yearlyStats.percentPaid >= 100
                    ? 'bg-emerald-500'
                    : yearlyStats.percentPaid >= 75
                    ? 'bg-blue-500'
                    : yearlyStats.percentPaid >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-400'
                }`}
                style={{ width: `${yearlyStats.percentPaid}%` }}
              />
            </div>
            <div className='flex items-center justify-between mt-2 text-xs text-gray-500'>
              <span>
                {yearlyStats.totalPaidPayments} dari{' '}
                {yearlyStats.totalPossiblePayments} pembayaran
              </span>
              <span>
                {formatCurrency(yearlyStats.totalAmountCollected)} terkumpul
              </span>
            </div>
          </div>

          {/* Monthly Circular Progress */}
          <div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3'>
            {yearlyPaymentProgress.map((monthData, index) => {
              const isCurrent = index === currentMonth;
              const isPast = index < currentMonth;
              const strokeColor =
                monthData.percent >= 100
                  ? '#10b981'
                  : isCurrent
                  ? '#E57373'
                  : isPast
                  ? '#f59e0b'
                  : '#9ca3af';
              const circumference = 2 * Math.PI * 24;
              const strokeDashoffset =
                circumference - (monthData.percent / 100) * circumference;

              return (
                <button
                  key={monthData.month}
                  onClick={() => setSelectedMonth(monthData.fullMonth)}
                  className={`p-2 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center ${
                    isCurrent
                      ? 'border-[#E57373] bg-red-50'
                      : monthData.percent >= 100
                      ? 'border-emerald-500 bg-emerald-50'
                      : isPast
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isCurrent ? 'text-[#E57373]' : 'text-gray-700'
                    }`}
                  >
                    {monthData.month}
                  </p>

                  {/* Circular Progress */}
                  <div className='relative w-14 h-14'>
                    <svg className='w-14 h-14 transform -rotate-90'>
                      <circle
                        cx='28'
                        cy='28'
                        r='24'
                        fill='none'
                        stroke='#e5e7eb'
                        strokeWidth='4'
                      />
                      <circle
                        cx='28'
                        cy='28'
                        r='24'
                        fill='none'
                        stroke={strokeColor}
                        strokeWidth='4'
                        strokeLinecap='round'
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className='transition-all duration-500'
                      />
                    </svg>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <span
                        className={`text-xs font-bold ${
                          monthData.percent >= 100
                            ? 'text-emerald-600'
                            : isCurrent
                            ? 'text-[#E57373]'
                            : 'text-gray-700'
                        }`}
                      >
                        {monthData.percent}%
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-[10px] font-medium mt-1 ${
                      monthData.percent >= 100
                        ? 'text-emerald-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {monthData.paidCount}/{monthData.totalMembers}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className='mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-emerald-500'></div>
              <span className='text-gray-600'>Semua lunas</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-[#E57373]'></div>
              <span className='text-gray-600'>Bulan ini</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-amber-400'></div>
              <span className='text-gray-600'>Belum lengkap</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-gray-400'></div>
              <span className='text-gray-600'>Bulan mendatang</span>
            </div>
          </div>
        </Card>
      )}

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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
          <input
            type='text'
            placeholder='Cari deskripsi...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
          />
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-gray-400' />
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange();
              }}
              className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm'
            />
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-400'>-</span>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange();
              }}
              className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm'
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
          >
            <option value='all'>Semua Kategori</option>
            <option value='income'>Pemasukan</option>
            <option value='expense'>Pengeluaran</option>
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-800'>
            {showMyContribution ? 'Transaksi Saya' : 'Semua Transaksi'}
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
                {!showMyContribution && (
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                    Anggota
                  </th>
                )}
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Kategori
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Deskripsi
                </th>
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
                    <Wallet className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                    <p>Tidak ada transaksi</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {new Date(tx.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    {!showMyContribution && (
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <Avatar
                            src={tx.member?.image}
                            name={tx.member?.name || ''}
                            size='sm'
                          />
                          <span className='text-sm text-gray-700'>
                            {tx.member?.name || '-'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700'>
                        {tx.transactionCategory || 'Lain-lain'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800'>
                      {tx.description || '-'}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                          tx.category.toLowerCase() === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.category.toLowerCase() === 'income'
                          ? 'Pemasukan'
                          : 'Pengeluaran'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-right ${
                        tx.category.toLowerCase() === 'income'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.category.toLowerCase() === 'income' ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
            <p className='text-sm text-gray-500'>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <div className='flex gap-1'>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
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
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Month Detail Modal */}
      <Modal
        isOpen={!!selectedMonth}
        onClose={() => setSelectedMonth(null)}
        size='md'
      >
        {selectedMonthData && (
          <>
            <ModalHeader
              title={`Detail Pembayaran Kas - ${
                selectedMonthData.month
              } ${new Date().getFullYear()}`}
              subtitle={`${selectedMonthData.paidCount} dari ${selectedMonthData.totalMembers} anggota sudah bayar kas`}
              onClose={() => setSelectedMonth(null)}
            />
            <ModalBody>
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='p-4 bg-emerald-50 rounded-xl text-center'>
                  <p className='text-2xl font-bold text-emerald-600'>
                    {selectedMonthData.percent}%
                  </p>
                  <p className='text-xs text-emerald-700'>Progress</p>
                </div>
                <div className='p-4 bg-blue-50 rounded-xl text-center'>
                  <p className='text-lg font-bold text-blue-600'>
                    {formatCurrency(selectedMonthData.totalAmount)}
                  </p>
                  <p className='text-xs text-blue-700'>Total Kas Terkumpul</p>
                </div>
              </div>

              <p className='text-sm text-gray-500 mb-3'>
                Status pembayaran kas :
              </p>
              <div className='space-y-2'>
                {selectedMonthData.memberPayments.map(
                  ({ member, paid, amount }) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        paid ? 'bg-emerald-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar
                          src={member.image ?? undefined}
                          name={member.name}
                          size='sm'
                        />
                        <div>
                          <p className='text-sm font-medium text-gray-800'>
                            {member.nickname || member.name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {member.position}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {paid ? (
                          <>
                            <span className='text-sm font-medium text-emerald-600'>
                              {formatCurrency(amount)}
                            </span>
                            <CheckCircle className='w-5 h-5 text-emerald-500' />
                          </>
                        ) : (
                          <>
                            <span className='text-sm text-gray-400'>
                              {amount > 0
                                ? formatCurrency(amount)
                                : 'Belum bayar'}
                            </span>
                            <Clock className='w-5 h-5 text-gray-400' />
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}
