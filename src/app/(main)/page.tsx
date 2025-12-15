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
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Sun };
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

      {/* Today's Schedule Overview */}
      <Card>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-white'>
                Jadwal Hari Ini
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {today.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
          <Link
            href='/schedule'
            className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
          >
            Lihat Semua <ArrowRight className='w-3 h-3' />
          </Link>
        </div>

        {/* Schedule by Shift */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
          {/* Pagi */}
          <div className='p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20'>
            <div className='flex items-center gap-2 mb-2'>
              <Sun className='w-4 h-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                Pagi
              </span>
            </div>
            {(() => {
              const members = scheduleEntries
                .filter(
                  (s) => s.tanggal === todayStr && s.keterangan === 'Pagi'
                )
                .map((s) => teamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);

              if (members.length === 0) {
                return <p className='text-xs text-gray-400'>Tidak ada</p>;
              }

              const leftCol = members.slice(0, 3);
              const rightCol = members.slice(3);

              return (
                <div className='flex gap-4'>
                  <div className='space-y-1.5'>
                    {leftCol.map((member) => (
                      <div
                        key={member!.id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <Avatar
                          src={member!.image}
                          name={member!.name}
                          size='xs'
                        />
                        <span className='text-gray-700 dark:text-gray-300 truncate'>
                          {member!.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rightCol.length > 0 && (
                    <div className='space-y-1.5'>
                      {rightCol.map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Avatar
                            src={member!.image}
                            name={member!.name}
                            size='xs'
                          />
                          <span className='text-gray-700 dark:text-gray-300 truncate'>
                            {member!.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Malam */}
          <div className='p-3 rounded-xl bg-gray-100 dark:bg-gray-700'>
            <div className='flex items-center gap-2 mb-2'>
              <Moon className='w-4 h-4 text-gray-600 dark:text-gray-300' />
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Malam
              </span>
            </div>
            {(() => {
              const members = scheduleEntries
                .filter(
                  (s) => s.tanggal === todayStr && s.keterangan === 'Malam'
                )
                .map((s) => teamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);

              if (members.length === 0) {
                return <p className='text-xs text-gray-400'>Tidak ada</p>;
              }

              const leftCol = members.slice(0, 3);
              const rightCol = members.slice(3);

              return (
                <div className='flex gap-4'>
                  <div className='space-y-1.5'>
                    {leftCol.map((member) => (
                      <div
                        key={member!.id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <Avatar
                          src={member!.image}
                          name={member!.name}
                          size='xs'
                        />
                        <span className='text-gray-700 dark:text-gray-300 truncate'>
                          {member!.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rightCol.length > 0 && (
                    <div className='space-y-1.5'>
                      {rightCol.map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Avatar
                            src={member!.image}
                            name={member!.name}
                            size='xs'
                          />
                          <span className='text-gray-700 dark:text-gray-300 truncate'>
                            {member!.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Piket Pagi */}
          <div className='p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20'>
            <div className='flex items-center gap-2 mb-2'>
              <Sun className='w-4 h-4 text-emerald-600' />
              <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                Piket Pagi
              </span>
            </div>
            {(() => {
              const members = scheduleEntries
                .filter(
                  (s) => s.tanggal === todayStr && s.keterangan === 'Piket Pagi'
                )
                .map((s) => teamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);

              if (members.length === 0) {
                return <p className='text-xs text-gray-400'>Tidak ada</p>;
              }

              const leftCol = members.slice(0, 3);
              const rightCol = members.slice(3);

              return (
                <div className='flex gap-4'>
                  <div className='space-y-1.5'>
                    {leftCol.map((member) => (
                      <div
                        key={member!.id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <Avatar
                          src={member!.image}
                          name={member!.name}
                          size='xs'
                        />
                        <span className='text-gray-700 dark:text-gray-300 truncate'>
                          {member!.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rightCol.length > 0 && (
                    <div className='space-y-1.5'>
                      {rightCol.map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Avatar
                            src={member!.image}
                            name={member!.name}
                            size='xs'
                          />
                          <span className='text-gray-700 dark:text-gray-300 truncate'>
                            {member!.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Piket Malam */}
          <div className='p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20'>
            <div className='flex items-center gap-2 mb-2'>
              <Moon className='w-4 h-4 text-purple-600' />
              <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                Piket Malam
              </span>
            </div>
            {(() => {
              const members = scheduleEntries
                .filter(
                  (s) =>
                    s.tanggal === todayStr && s.keterangan === 'Piket Malam'
                )
                .map((s) => teamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);

              if (members.length === 0) {
                return <p className='text-xs text-gray-400'>Tidak ada</p>;
              }

              const leftCol = members.slice(0, 3);
              const rightCol = members.slice(3);

              return (
                <div className='flex gap-4'>
                  <div className='space-y-1.5'>
                    {leftCol.map((member) => (
                      <div
                        key={member!.id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <Avatar
                          src={member!.image}
                          name={member!.name}
                          size='xs'
                        />
                        <span className='text-gray-700 dark:text-gray-300 truncate'>
                          {member!.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rightCol.length > 0 && (
                    <div className='space-y-1.5'>
                      {rightCol.map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Avatar
                            src={member!.image}
                            name={member!.name}
                            size='xs'
                          />
                          <span className='text-gray-700 dark:text-gray-300 truncate'>
                            {member!.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Libur */}
          <div className='p-3 rounded-xl bg-red-50 dark:bg-red-900/20'>
            <div className='flex items-center gap-2 mb-2'>
              <Calendar className='w-4 h-4 text-red-600' />
              <span className='text-sm font-medium text-red-700 dark:text-red-300'>
                Libur
              </span>
            </div>
            {(() => {
              const members = scheduleEntries
                .filter(
                  (s) => s.tanggal === todayStr && s.keterangan === 'Libur'
                )
                .map((s) => teamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);

              if (members.length === 0) {
                return <p className='text-xs text-gray-400'>Tidak ada</p>;
              }

              const leftCol = members.slice(0, 3);
              const rightCol = members.slice(3);

              return (
                <div className='flex gap-4'>
                  <div className='space-y-1.5'>
                    {leftCol.map((member) => (
                      <div
                        key={member!.id}
                        className='flex items-center gap-2 text-sm'
                      >
                        <Avatar
                          src={member!.image}
                          name={member!.name}
                          size='xs'
                        />
                        <span className='text-gray-700 dark:text-gray-300 truncate'>
                          {member!.nickname}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rightCol.length > 0 && (
                    <div className='space-y-1.5'>
                      {rightCol.map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Avatar
                            src={member!.image}
                            name={member!.name}
                            size='xs'
                          />
                          <span className='text-gray-700 dark:text-gray-300 truncate'>
                            {member!.nickname}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Bottom Row: Kas Progress & Recent Activities */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        {/* Kas Payment Progress */}
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center'>
                <Wallet className='w-5 h-5 text-amber-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-800 dark:text-white'>
                  Kas Bulan Ini
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {paidCount}/{teamMembers.length} lunas
                </p>
              </div>
            </div>
            <span className='text-2xl font-bold text-gray-800 dark:text-white'>
              {kasProgressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className='h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4'>
            <div
              className={`h-full rounded-full transition-all ${
                kasProgressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#E57373]'
              }`}
              style={{ width: `${kasProgressPercent}%` }}
            />
          </div>

          {/* Members Status Grid */}
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-3'>
            {teamMembers.map((member) => {
              const paid = kasPaymentStatus[member.id] || false;
              return (
                <div
                  key={member.id}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                    paid
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <Avatar src={member.image} name={member.name} size='sm' />
                  <p className='text-[10px] font-medium text-gray-800 dark:text-gray-200 mt-1 text-center truncate w-full'>
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

          <Link
            href='/dashboard/cashbook'
            className='block w-full mt-4 py-2 text-sm font-medium text-[#E57373] hover:bg-[#FFF0F0] dark:hover:bg-red-900/30 rounded-lg transition-all text-center'
          >
            Lihat Detail Kas →
          </Link>
        </Card>

        {/* Recent Activities */}
        <RecentActivities />
      </div>
    </div>
  );
}
