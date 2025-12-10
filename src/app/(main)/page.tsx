'use client';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { CashBookChart } from '@/components/charts/CashBookChart';
import { RecentActivities } from '@/components/RecentActivities';
import {
  teamMembers,
  attendanceRecords,
  scheduleEntries,
  cashEntries,
  getSummaryStats,
} from '@/data/dummy';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  Sun,
  Moon,
  Sunrise,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// Simulated current user (logged in user)
const currentUser = teamMembers[1]; // Muhammad Alfian

// Simulated kas payment status
const kasPaymentStatus: { [memberId: string]: boolean } = {
  '1': true,
  '2': true,
  '3': true,
  '4': false,
  '5': true,
  '6': false,
  '7': true,
};

export default function Dashboard() {
  const stats = getSummaryStats();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const hour = today.getHours();

  // Greeting based on time
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return { text: 'Selamat Pagi', icon: Sunrise };
    if (hour >= 12 && hour < 17) return { text: 'Selamat Siang', icon: Sun };
    if (hour >= 17 && hour < 21) return { text: 'Selamat Sore', icon: Sun };
    return { text: 'Selamat Malam', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // User's stats
  const userAttendance = attendanceRecords.filter(
    (r) => r.memberId === currentUser.id
  );
  const userOntimeCount = userAttendance.filter(
    (r) => r.status === 'Ontime'
  ).length;
  const userTotalAttendance = userAttendance.length;
  const userOntimeRate =
    userTotalAttendance > 0
      ? Math.round((userOntimeCount / userTotalAttendance) * 100)
      : 0;

  // Today's schedule
  const todaySchedule = scheduleEntries.find(
    (s) => s.memberId === currentUser.id && s.tanggal === todayStr
  );

  // User's kas payment status
  const userKasPaid = kasPaymentStatus[currentUser.id] || false;

  // Team kas progress
  const paidCount = Object.values(kasPaymentStatus).filter(Boolean).length;
  const kasProgressPercent = Math.round((paidCount / teamMembers.length) * 100);

  // Total kas
  const totalCashIn = cashEntries
    .filter((e) => e.category === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCash = totalCashIn - totalCashOut;

  // Find earliest and latest attendance today
  const todayAttendance = attendanceRecords.filter(
    (r) => r.tanggal === todayStr
  );
  const sortedByTime = [...todayAttendance].sort((a, b) => {
    const timeA = a.jamAbsen || '99:99';
    const timeB = b.jamAbsen || '99:99';
    return timeA.localeCompare(timeB);
  });
  const earliestAttendance = sortedByTime[0];
  const latestAttendance =
    sortedByTime.length > 1 ? sortedByTime[sortedByTime.length - 1] : null;

  // Get member info for earliest/latest
  const earliestMember = earliestAttendance
    ? teamMembers.find((m) => m.id === earliestAttendance.memberId)
    : null;
  const latestMember = latestAttendance
    ? teamMembers.find((m) => m.id === latestAttendance.memberId)
    : null;

  // Calculate attendance progress for current period (16th - 15th)
  const getPeriodDates = () => {
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date;
    let endDate: Date;

    if (currentDay >= 16) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 16);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 16);
      endDate = new Date(now.getFullYear(), now.getMonth(), 15);
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getPeriodDates();
  const minWorkingDays = 22;

  // User's attendance count in current period
  const userPeriodAttendance = attendanceRecords.filter((r) => {
    const recordDate = new Date(r.tanggal);
    return (
      r.memberId === currentUser.id &&
      recordDate >= startDate &&
      recordDate <= endDate
    );
  }).length;

  const attendanceProgressPercent = Math.min(
    100,
    Math.round((userPeriodAttendance / minWorkingDays) * 100)
  );

  const formatPeriodLabel = () => {
    const startMonth = startDate.toLocaleDateString('id-ID', {
      month: 'short',
    });
    const endMonth = endDate.toLocaleDateString('id-ID', {
      month: 'short',
      year: 'numeric',
    });
    return `16 ${startMonth} - 15 ${endMonth}`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getScheduleStyle = (keterangan: string) => {
    switch (keterangan) {
      case 'Pagi':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Sun };
      case 'Malam':
        return { bg: 'bg-gray-200', text: 'text-gray-700', icon: Moon };
      case 'Piket Pagi':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: Sun };
      case 'Piket Malam':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: Moon };
      case 'Libur':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: Calendar };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500', icon: Calendar };
    }
  };

  return (
    <div className='space-y-6'>
      {/* Greeting Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Avatar src={currentUser.image} name={currentUser.name} size='lg' />
          <div>
            <div className='flex items-center gap-2'>
              <GreetingIcon className='w-5 h-5 text-amber-500' />
              <span className='text-gray-500 dark:text-gray-400'>
                {greeting.text},
              </span>
            </div>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
              {currentUser.nickname}!
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {currentUser.position} • {currentUser.department}
            </p>
          </div>
        </div>
        <div className='text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm'>
          {today.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Attendance Highlights */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {/* Earliest Attendance */}
        <Card className='border-l-4 border-l-emerald-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                Absen Tercepat
              </p>
              {earliestMember && earliestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 dark:text-white mt-1'>
                    {earliestMember.nickname}
                  </p>
                  <p className='text-2xl font-bold text-emerald-600'>
                    {earliestAttendance.jamAbsen}
                  </p>
                </>
              ) : (
                <p className='text-lg font-medium text-gray-400 mt-1'>
                  Belum ada
                </p>
              )}
            </div>
            {earliestMember && earliestAttendance && (
              <Avatar
                src={earliestMember.image}
                name={earliestMember.name}
                size='lg'
              />
            )}
          </div>
        </Card>

        {/* Latest Attendance */}
        <Card className='border-l-4 border-l-amber-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                Absen Terlambat
              </p>
              {latestMember && latestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 dark:text-white mt-1'>
                    {latestMember.nickname}
                  </p>
                  <p className='text-2xl font-bold text-amber-600'>
                    {latestAttendance.jamAbsen}
                  </p>
                </>
              ) : (
                <p className='text-lg font-medium text-gray-400 mt-1'>
                  Belum ada
                </p>
              )}
            </div>
            {latestMember && latestAttendance && (
              <Avatar
                src={latestMember.image}
                name={latestMember.name}
                size='lg'
              />
            )}
          </div>
        </Card>

        {/* Attendance Progress */}
        <Card className='border-l-4 border-l-blue-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                Progres Absensi
              </p>
              <p className='text-lg font-bold text-gray-800 dark:text-white mt-1'>
                {formatPeriodLabel()}
              </p>
              <p className='text-2xl font-bold text-blue-600'>
                {userPeriodAttendance}/{minWorkingDays}{' '}
                <span className='text-sm font-normal'>hari</span>
              </p>
            </div>
            <div className='text-right'>
              <div className='w-16 h-16 rounded-full border-4 border-blue-100 flex items-center justify-center relative'>
                <span className='text-lg font-bold text-blue-600'>
                  {attendanceProgressPercent}%
                </span>
                <svg className='absolute inset-0 w-full h-full -rotate-90'>
                  <circle
                    cx='32'
                    cy='32'
                    r='28'
                    fill='none'
                    stroke='#dbeafe'
                    strokeWidth='4'
                  />
                  <circle
                    cx='32'
                    cy='32'
                    r='28'
                    fill='none'
                    stroke={
                      attendanceProgressPercent >= 100 ? '#10b981' : '#3b82f6'
                    }
                    strokeWidth='4'
                    strokeDasharray={`${
                      (attendanceProgressPercent / 100) * 176
                    } 176`}
                    strokeLinecap='round'
                  />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Stats Row */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {/* Today's Schedule */}
        <Card className='col-span-2 lg:col-span-1'>
          <div className='flex items-center gap-3'>
            {todaySchedule ? (
              <>
                {(() => {
                  const style = getScheduleStyle(todaySchedule.keterangan);
                  const IconComponent = style.icon;
                  return (
                    <>
                      <div
                        className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}
                      >
                        <IconComponent className={`w-6 h-6 ${style.text}`} />
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Jadwal Hari Ini</p>
                        <p className='font-bold text-gray-800'>
                          {todaySchedule.keterangan}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                <div className='w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center'>
                  <Calendar className='w-6 h-6 text-gray-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Jadwal Hari Ini</p>
                  <p className='font-medium text-gray-500'>Tidak ada</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Ontime Rate */}
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Tingkat Ketepatan</p>
              <p className='text-xl font-bold text-emerald-600'>
                {userOntimeRate}%
              </p>
            </div>
          </div>
        </Card>

        {/* My Attendance */}
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Clock className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Absen</p>
              <p className='text-xl font-bold text-blue-600'>
                {userTotalAttendance}
              </p>
            </div>
          </div>
        </Card>

        {/* Kas Payment Status */}
        <Card>
          <div className='flex items-center gap-3'>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                userKasPaid ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              {userKasPaid ? (
                <CheckCircle className='w-6 h-6 text-emerald-600' />
              ) : (
                <AlertCircle className='w-6 h-6 text-amber-600' />
              )}
            </div>
            <div>
              <p className='text-xs text-gray-500'>Kas Bulan Ini</p>
              <p
                className={`font-bold ${
                  userKasPaid ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {userKasPaid ? 'Lunas' : 'Belum Bayar'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Stats Summary */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-xl font-bold text-gray-800'>
                {stats.totalMembers}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <UserCheck className='w-6 h-6 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Hadir Hari Ini</p>
              <p className='text-xl font-bold text-emerald-600'>
                {stats.presentToday}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center'>
              <Wallet className='w-6 h-6 text-amber-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Saldo Kas</p>
              <p className='text-lg font-bold text-amber-600'>
                {formatCurrency(totalCash)}
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
                {kasProgressPercent}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        {/* Attendance Chart */}
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>Kehadiran Tim</h3>
              <p className='text-sm text-gray-500'>Statistik bulanan</p>
            </div>
            <Link
              href='/attendance'
              className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
            >
              Lihat Semua <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
          <AttendanceChart />
        </Card>

        {/* Cash Chart */}
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>Arus Kas Tim</h3>
              <p className='text-sm text-gray-500'>Pemasukan & pengeluaran</p>
            </div>
            <Link
              href='/dashboard/cashbook'
              className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
            >
              Lihat Semua <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
          <CashBookChart />
        </Card>
      </div>

      {/* Kas Payment Progress */}
      <Card>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div>
            <h3 className='font-semibold text-gray-800'>
              Progress Pembayaran Kas Desember 2025
            </h3>
            <p className='text-sm text-gray-500'>
              {paidCount} dari {teamMembers.length} member sudah bayar
            </p>
          </div>
          <span className='text-2xl font-bold text-gray-800'>
            {kasProgressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className='h-3 bg-gray-100 rounded-full overflow-hidden mb-4'>
          <div
            className={`h-full rounded-full transition-all ${
              kasProgressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#E57373]'
            }`}
            style={{ width: `${kasProgressPercent}%` }}
          />
        </div>

        {/* Members Status */}
        <div className='grid grid-cols-4 sm:grid-cols-7 gap-2'>
          {teamMembers.map((member) => {
            const paid = kasPaymentStatus[member.id] || false;
            return (
              <div
                key={member.id}
                className={`flex flex-col items-center p-2 rounded-xl ${
                  paid ? 'bg-emerald-50' : 'bg-gray-50'
                }`}
              >
                <Avatar src={member.image} name={member.name} size='sm' />
                <p className='text-[10px] font-medium text-gray-800 mt-1 text-center truncate w-full'>
                  {member.nickname}
                </p>
                {paid ? (
                  <CheckCircle className='w-3 h-3 text-emerald-600 mt-0.5' />
                ) : (
                  <AlertCircle className='w-3 h-3 text-amber-600 mt-0.5' />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activities */}
      <RecentActivities />
    </div>
  );
}
