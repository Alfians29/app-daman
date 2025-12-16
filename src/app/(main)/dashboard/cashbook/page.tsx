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
import { PageHeader } from '@/components/ui/PageHeader';
import { cashEntries, teamMembers, CashEntry } from '@/data/dummy';
import { formatCurrency } from '@/lib/utils';

// Simulated current user (logged in user)
const currentUser = teamMembers[1]; // Muhammad Alfian

// Simulated monthly kas payment status per member (12 bulan untuk 2025)
const kasPaymentStatus: {
  [memberId: string]: { month: string; paid: boolean; amount: number }[];
} = {
  '1': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: true, amount: 50000 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: true, amount: 50000 },
  ],
  '2': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: true, amount: 50000 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: true, amount: 50000 },
  ],
  '3': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: false, amount: 0 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: true, amount: 50000 },
  ],
  '4': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: false, amount: 0 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: false, amount: 0 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: false, amount: 0 },
    { month: '2025-09', paid: true, amount: 50000 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: false, amount: 0 },
    { month: '2025-12', paid: false, amount: 0 },
  ],
  '5': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: true, amount: 50000 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: true, amount: 50000 },
  ],
  '6': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: false, amount: 0 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: false, amount: 0 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: false, amount: 0 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: false, amount: 0 },
  ],
  '7': [
    { month: '2025-01', paid: true, amount: 50000 },
    { month: '2025-02', paid: true, amount: 50000 },
    { month: '2025-03', paid: true, amount: 50000 },
    { month: '2025-04', paid: true, amount: 50000 },
    { month: '2025-05', paid: true, amount: 50000 },
    { month: '2025-06', paid: true, amount: 50000 },
    { month: '2025-07', paid: true, amount: 50000 },
    { month: '2025-08', paid: true, amount: 50000 },
    { month: '2025-09', paid: true, amount: 50000 },
    { month: '2025-10', paid: true, amount: 50000 },
    { month: '2025-11', paid: true, amount: 50000 },
    { month: '2025-12', paid: true, amount: 50000 },
  ],
};

// Nama-nama bulan dalam bahasa Indonesia
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

  // Calculate yearly payment progress (per month)
  const yearlyPaymentProgress = useMemo(() => {
    const months = [
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
    ];

    return months.map((month, index) => {
      let paidInMonth = 0;
      let totalAmount = 0;

      teamMembers.forEach((member) => {
        const payment = kasPaymentStatus[member.id]?.find(
          (p) => p.month === month
        );
        if (payment?.paid) {
          paidInMonth++;
          totalAmount += payment.amount;
        }
      });

      return {
        month: monthNames[index],
        fullMonth: month,
        paidCount: paidInMonth,
        totalMembers: teamMembers.length,
        percent: Math.round((paidInMonth / teamMembers.length) * 100),
        totalAmount: totalAmount,
      };
    });
  }, []);

  // Overall yearly stats
  const yearlyStats = useMemo(() => {
    const totalPossiblePayments = teamMembers.length * 12; // 12 bulan x jumlah member
    let totalPaidPayments = 0;
    let totalAmountCollected = 0;

    teamMembers.forEach((member) => {
      const payments = kasPaymentStatus[member.id] || [];
      payments.forEach((p) => {
        if (p.paid) {
          totalPaidPayments++;
          totalAmountCollected += p.amount;
        }
      });
    });

    return {
      totalPossiblePayments,
      totalPaidPayments,
      percentPaid: Math.round(
        (totalPaidPayments / totalPossiblePayments) * 100
      ),
      totalAmountCollected,
    };
  }, []);

  // Get payment details for a specific month
  const getMonthPaymentDetails = (month: string) => {
    return teamMembers.map((member) => {
      const payment = kasPaymentStatus[member.id]?.find(
        (p) => p.month === month
      );
      return {
        member,
        paid: payment?.paid || false,
        amount: payment?.amount || 0,
      };
    });
  };

  // Get selected month data
  const selectedMonthData = selectedMonth
    ? {
        month: selectedMonth,
        monthName: monthNames[parseInt(selectedMonth.split('-')[1]) - 1],
        year: selectedMonth.split('-')[0],
        details: getMonthPaymentDetails(selectedMonth),
      }
    : null;

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
              <p className='text-xs text-gray-500'>Total Uang Kas</p>
              <p className='text-xl font-bold text-gray-800'>
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
              <p className='text-xs text-gray-500'>Uang Masuk</p>
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
              <p className='text-xs text-gray-500'>Uang Keluar</p>
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

      {/* Yearly Payment Progress Chart */}
      <Card>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
          <div>
            <h3 className='font-semibold text-gray-800 text-lg'>
              Progress Pembayaran Kas Tahun 2025
            </h3>
            <p className='text-sm text-gray-500'>
              {yearlyStats.totalPaidPayments} dari{' '}
              {yearlyStats.totalPossiblePayments} pembayaran telah diterima
            </p>
          </div>
          <div className='flex items-center gap-4 mt-3 lg:mt-0'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-[#E57373]'>
                {yearlyStats.percentPaid}%
              </p>
              <p className='text-xs text-gray-500'>Tercapai</p>
            </div>
            {/* <div className='text-center'>
              <p className='text-lg font-bold text-emerald-600'>
                {formatCurrency(yearlyStats.totalAmountCollected)}
              </p>
              <p className='text-xs text-gray-500'>Terkumpul</p>
            </div> */}
          </div>
        </div>

        {/* Overall Yearly Progress Bar */}
        <div className='h-3 bg-gray-100 rounded-full overflow-hidden mb-6'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              yearlyStats.percentPaid >= 100
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-[#E57373] to-[#EF5350]'
            }`}
            style={{ width: `${yearlyStats.percentPaid}%` }}
          />
        </div>

        {/* Monthly Progress Chart */}
        <div className='space-y-3'>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>
            Progress Per Bulan
          </h4>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2'>
            {yearlyPaymentProgress.map((monthData) => (
              <button
                key={monthData.fullMonth}
                onClick={() => setSelectedMonth(monthData.fullMonth)}
                className={`relative flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer hover:scale-105 hover:shadow-md ${
                  monthData.percent === 100
                    ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                    : monthData.percent >= 50
                    ? 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                    : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                }`}
              >
                <p className='text-xs font-semibold text-gray-700'>
                  {monthData.month}
                </p>

                {/* Mini circular progress indicator */}
                <div className='relative w-12 h-12 my-2'>
                  <svg className='w-12 h-12 transform -rotate-90'>
                    <circle
                      cx='24'
                      cy='24'
                      r='20'
                      stroke='#E5E7EB'
                      strokeWidth='4'
                      fill='none'
                    />
                    <circle
                      cx='24'
                      cy='24'
                      r='20'
                      stroke={
                        monthData.percent === 100
                          ? '#10B981'
                          : monthData.percent >= 50
                          ? '#F59E0B'
                          : '#E57373'
                      }
                      strokeWidth='4'
                      fill='none'
                      strokeDasharray={`${
                        (monthData.percent / 100) * 125.6
                      } 125.6`}
                      strokeLinecap='round'
                    />
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span
                      className={`text-xs font-bold ${
                        monthData.percent === 100
                          ? 'text-emerald-600'
                          : monthData.percent >= 50
                          ? 'text-amber-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {monthData.percent}%
                    </span>
                  </div>
                </div>

                <p className='text-[10px] text-gray-500'>
                  {monthData.paidCount}/{monthData.totalMembers}
                </p>

                {/* Click indicator */}
                <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <div className='w-1.5 h-1.5 rounded-full bg-gray-400' />
                </div>
              </button>
            ))}
          </div>

          {/* Hint */}
          <p className='text-xs text-gray-400 text-center mt-3'>
            Klik bulan untuk melihat detail pembayaran
          </p>
        </div>

        {/* Legend */}
        <div className='flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-emerald-500' />
            <span className='text-xs text-gray-600'>100% (Lengkap)</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-amber-500' />
            <span className='text-xs text-gray-600'>≥50% (Sebagian)</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-[#E57373]' />
            <span className='text-xs text-gray-600'>&lt;50% (Kurang)</span>
          </div>
        </div>
      </Card>

      {/* Month Detail Modal */}
      {selectedMonth && selectedMonthData && (
        <>
          {/* Modal Overlay */}
          <div
            className='fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/50 z-999'
            onClick={() => setSelectedMonth(null)}
          />

          {/* Modal Content */}
          <div
            className='fixed top-0 left-0 right-0 bottom-0 w-full h-full z-1000 flex items-center justify-center p-4'
            onClick={() => setSelectedMonth(null)}
          >
            <div
              className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in flex flex-col'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='flex items-center justify-between p-5 bg-gradient-to-r from-[#E57373] to-[#EF5350] shrink-0'>
                <div>
                  <h3 className='text-lg font-bold text-white'>
                    Pembayaran Kas {selectedMonthData.monthName}{' '}
                    {selectedMonthData.year}
                  </h3>
                  <p className='text-white/80 text-sm'>
                    {selectedMonthData.details.filter((d) => d.paid).length}{' '}
                    dari {selectedMonthData.details.length} member sudah bayar
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                >
                  <X className='w-5 h-5 text-white' />
                </button>
              </div>

              {/* Modal Body */}
              <div className='p-5 overflow-y-auto flex-1'>
                {/* Progress Summary */}
                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-600'>
                      Progress Pembayaran
                    </span>
                    <span className='text-sm font-bold text-gray-800'>
                      {Math.round(
                        (selectedMonthData.details.filter((d) => d.paid)
                          .length /
                          selectedMonthData.details.length) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-[#E57373] to-[#EF5350] rounded-full transition-all'
                      style={{
                        width: `${
                          (selectedMonthData.details.filter((d) => d.paid)
                            .length /
                            selectedMonthData.details.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Member List */}
                <div className='space-y-2'>
                  {selectedMonthData.details.map(({ member, paid, amount }) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        paid ? 'bg-emerald-50' : 'bg-gray-50'
                      }`}
                    >
                      <Avatar src={member.image} name={member.name} size='sm' />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-800 truncate'>
                          {member.name}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {member.position}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        {paid ? (
                          <>
                            <span className='text-sm font-semibold text-emerald-600'>
                              {formatCurrency(amount)}
                            </span>
                            <div className='flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-lg'>
                              <CheckCircle className='w-3.5 h-3.5 text-emerald-600' />
                              <span className='text-xs font-medium text-emerald-600'>
                                Lunas
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className='flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg'>
                            <Clock className='w-3.5 h-3.5 text-amber-600' />
                            <span className='text-xs font-medium text-amber-600'>
                              Belum Bayar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className='mt-4 pt-4 border-t border-gray-100'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Total Terkumpul
                    </span>
                    <span className='text-lg font-bold text-emerald-600'>
                      {formatCurrency(
                        selectedMonthData.details
                          .filter((d) => d.paid)
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className='p-4 bg-gray-50 shrink-0'>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className='w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors'
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </>
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
            <option value='income'>Uang Masuk</option>
            <option value='expense'>Uang Keluar</option>
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
                          <ArrowDownCircle className='w-3 h-3' />
                        ) : (
                          <ArrowUpCircle className='w-3 h-3' />
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
