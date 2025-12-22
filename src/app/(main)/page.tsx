'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import {
  usersAPI,
  attendanceAPI,
  scheduleAPI,
  cashAPI,
  shiftsAPI,
} from '@/lib/api';
import { getShiftColorClasses } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/components/AuthGuard';
import {
  Users,
  UserCheck,
  Wallet,
  Calendar,
  Clock,
  Sun,
  Moon,
  Sunrise,
  CheckCircle,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { CashBookChart } from '@/components/charts/CashBookChart';
import { SkeletonPage } from '@/components/ui/Skeleton';

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  department: string;
  image: string | null;
  isActive: boolean;
};
type AttendanceRecord = {
  id: string;
  memberId: string;
  member?: { name: string; image?: string };
  tanggal: string;
  jamAbsen: string;
  keterangan: string;
  status: string;
};
type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};
type CashEntry = { id: string; amount: number; category: string; date: string };

export default function Dashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [scheduleEntries, setScheduleEntries] = useState<Schedule[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, isLoading: authLoading } = useCurrentUser();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [shiftSettings, setShiftSettings] = useState<
    { shiftType: string; name: string; color: string | null }[]
  >([]);
  const [chartPeriod, setChartPeriod] = useState<
    '1bulan' | '6bulan' | '1tahun'
  >('1tahun');
  const [periodType, setPeriodType] = useState<'monthly' | '16-15'>('16-15');

  useEffect(() => {
    if (!authLoading && authUser) {
      loadData();
    }
  }, [authLoading, authUser]);

  const loadData = async () => {
    setIsLoading(true);
    const [usersRes, attRes, schedRes, cashRes, shiftsRes] = await Promise.all([
      usersAPI.getAll(),
      attendanceAPI.getAll(),
      scheduleAPI.getAll(),
      cashAPI.getAll(),
      shiftsAPI.getAll(),
    ]);
    if (usersRes.success && usersRes.data) {
      const activeUsers = (usersRes.data as TeamMember[]).filter(
        (u) => u.isActive
      );
      setTeamMembers(activeUsers);
      // Find user matching authenticated session
      if (authUser?.id) {
        setCurrentUser(
          activeUsers.find((u) => u.id === authUser.id) || activeUsers[0]
        );
      }
    }
    if (attRes.success && attRes.data)
      setAttendanceRecords(attRes.data as AttendanceRecord[]);
    if (schedRes.success && schedRes.data) {
      setScheduleEntries(schedRes.data as Schedule[]);
    }
    if (cashRes.success && cashRes.data)
      setCashEntries(cashRes.data as CashEntry[]);
    if (shiftsRes.success && shiftsRes.data) {
      const shifts = shiftsRes.data as {
        shiftType: string;
        name: string;
        color: string | null;
        isActive: boolean;
      }[];
      setShiftSettings(shifts.filter((s) => s.isActive));
    }
    setIsLoading(false);
  };

  const today = new Date();
  // Use local date string for comparison (YYYY-MM-DD format)
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const hour = today.getHours();

  // Helper function to extract date string from various formats
  // For dates stored as @db.Date in Prisma, they come as ISO strings like "2025-12-18T00:00:00.000Z"
  // We extract just the date part (YYYY-MM-DD) directly from the string
  const getDateStr = (dateValue: string | Date) => {
    if (typeof dateValue === 'string') {
      // Extract YYYY-MM-DD from ISO string
      return dateValue.substring(0, 10);
    }
    // For Date objects, use UTC methods to avoid timezone conversion
    const d = new Date(dateValue);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return { text: 'Selamat Pagi', icon: Sunrise };
    if (hour >= 12 && hour < 17) return { text: 'Selamat Siang', icon: Sun };
    if (hour >= 17 && hour < 21) return { text: 'Selamat Sore', icon: Sun };
    return { text: 'Selamat Malam', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // User stats
  const userAttendance = attendanceRecords.filter(
    (r) => currentUser && r.memberId === currentUser.id
  );
  const userOntimeCount = userAttendance.filter(
    (r) => r.status === 'ONTIME'
  ).length;
  const userOntimeRate =
    userAttendance.length > 0
      ? Math.round((userOntimeCount / userAttendance.length) * 100)
      : 0;

  // Today's schedule
  const todaySchedule = scheduleEntries.find(
    (s) =>
      currentUser &&
      s.memberId === currentUser.id &&
      getDateStr(s.tanggal) === todayStr
  );

  // Cash stats
  const totalCashIn = cashEntries
    .filter((e) => e.category.toLowerCase() === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category.toLowerCase() === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCash = totalCashIn - totalCashOut;

  // Generate chart data from database
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

  const cashChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return monthNames.map((name, index) => {
      const targetMonth = `${currentYear}-${String(index + 1).padStart(
        2,
        '0'
      )}`;
      const monthIncome = cashEntries
        .filter(
          (e) =>
            e.category.toLowerCase() === 'income' &&
            e.date.startsWith(targetMonth)
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const monthExpense = cashEntries
        .filter(
          (e) =>
            e.category.toLowerCase() === 'expense' &&
            e.date.startsWith(targetMonth)
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);
      // Calculate running balance up to this month
      const runningIncome = cashEntries
        .filter(
          (e) =>
            e.category.toLowerCase() === 'income' &&
            e.date <= `${targetMonth}-31`
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const runningExpense = cashEntries
        .filter(
          (e) =>
            e.category.toLowerCase() === 'expense' &&
            e.date <= `${targetMonth}-31`
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        name,
        masuk: monthIncome,
        keluar: monthExpense,
        saldo: runningIncome - runningExpense,
      };
    });
  }, [cashEntries]);

  const scheduleChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // Get all active shift types from settings
    const activeShiftTypes =
      shiftSettings.length > 0
        ? shiftSettings.map((s) => s.shiftType)
        : ['PAGI', 'MALAM', 'PIKET_PAGI', 'PIKET_MALAM', 'LIBUR'];

    // For 1 month view - generate weekly data
    if (chartPeriod === '1bulan') {
      const weekNames = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
      const targetMonth = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        '0'
      )}`;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      return weekNames.map((name, weekIndex) => {
        const weekStart = weekIndex * 7 + 1;
        const weekEnd = Math.min(weekStart + 6, daysInMonth);

        const weekSchedules = scheduleEntries.filter((s) => {
          if (!s.tanggal.startsWith(targetMonth)) return false;
          const day = parseInt(s.tanggal.substring(8, 10));
          return day >= weekStart && day <= weekEnd;
        });

        const dataPoint: { name: string; [key: string]: string | number } = {
          name,
        };
        activeShiftTypes.forEach((shiftType) => {
          dataPoint[shiftType] = weekSchedules.filter(
            (s) => s.keterangan === shiftType
          ).length;
        });

        return dataPoint;
      });
    }

    // For 6 months - generate last 6 months data
    if (chartPeriod === '6bulan') {
      const last6Months: { name: string; monthStr: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();
        last6Months.push({
          name: monthNames[monthIndex],
          monthStr: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        });
      }

      return last6Months.map(({ name, monthStr }) => {
        const monthSchedules = scheduleEntries.filter((s) =>
          s.tanggal.startsWith(monthStr)
        );

        const dataPoint: { name: string; [key: string]: string | number } = {
          name,
        };
        activeShiftTypes.forEach((shiftType) => {
          dataPoint[shiftType] = monthSchedules.filter(
            (s) => s.keterangan === shiftType
          ).length;
        });

        return dataPoint;
      });
    }

    // For 1 year - generate all 12 months
    return monthNames.map((name, index) => {
      const targetMonth = `${currentYear}-${String(index + 1).padStart(
        2,
        '0'
      )}`;
      const monthSchedules = scheduleEntries.filter((s) =>
        s.tanggal.startsWith(targetMonth)
      );

      // Create dynamic object with all shift types as keys
      const dataPoint: { name: string; [key: string]: string | number } = {
        name,
      };
      activeShiftTypes.forEach((shiftType) => {
        dataPoint[shiftType] = monthSchedules.filter(
          (s) => s.keterangan === shiftType
        ).length;
      });

      return dataPoint;
    });
  }, [scheduleEntries, shiftSettings, chartPeriod]);

  // Filter: Only TA members for attendance/schedule stats
  const taTeamMembers = teamMembers.filter(
    (m) => m.department === 'Data Management - TA'
  );
  const taMemberIds = new Set(taTeamMembers.map((m) => m.id));

  // Today attendance - filtered by TA department
  const todayAttendance = attendanceRecords.filter(
    (r) => getDateStr(r.tanggal) === todayStr && taMemberIds.has(r.memberId)
  );
  const sortedByTime = [...todayAttendance].sort((a, b) =>
    (a.jamAbsen || '99:99').localeCompare(b.jamAbsen || '99:99')
  );
  const earliestAttendance = sortedByTime[0];
  const latestAttendance =
    sortedByTime.length > 1 ? sortedByTime[sortedByTime.length - 1] : null;
  const earliestMember = earliestAttendance
    ? taTeamMembers.find((m) => m.id === earliestAttendance.memberId)
    : null;
  const latestMember = latestAttendance
    ? taTeamMembers.find((m) => m.id === latestAttendance.memberId)
    : null;

  // Period calculation
  const getPeriodDates = (type: 'monthly' | '16-15' = '16-15') => {
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date, endDate: Date;

    if (type === 'monthly') {
      // Bulanan: 1st to last day of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    } else {
      // 16-15: 16th of current/previous month to 15th of next month
      if (currentDay >= 16) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 16);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 16);
        endDate = new Date(now.getFullYear(), now.getMonth(), 15);
      }
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getPeriodDates(periodType);

  // Helper to format date to YYYY-MM-DD string for comparison
  const toDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const periodStartStr = toDateStr(startDate);
  const periodEndStr = toDateStr(endDate);

  const minWorkingDays = 21;
  const userPeriodAttendance = attendanceRecords.filter((r) => {
    // Extract date portion from ISO string (first 10 chars: YYYY-MM-DD)
    const recordDateStr = r.tanggal.substring(0, 10);
    return (
      currentUser &&
      r.memberId === currentUser.id &&
      recordDateStr >= periodStartStr &&
      recordDateStr <= periodEndStr
    );
  }).length;
  const attendanceProgressPercent = Math.min(
    100,
    Math.round((userPeriodAttendance / minWorkingDays) * 100)
  );

  const formatPeriodLabel = () => {
    if (periodType === 'monthly') {
      // Bulanan: show "1-31 Des 2025" format
      const monthYear = startDate.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      });
      const lastDay = endDate.getDate();
      return `01 - ${lastDay} ${monthYear}`;
    } else {
      // 16-15: show "16 Des - 15 Jan 2026" format
      const startMonth = startDate.toLocaleDateString('id-ID', {
        month: 'short',
      });
      const endMonth = endDate.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      });
      return `16 ${startMonth} - 15 ${endMonth}`;
    }
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);

  const getScheduleStyle = (keterangan: string) => {
    // Try to get color from shift settings
    const shiftSetting = shiftSettings.find((s) => s.shiftType === keterangan);
    if (shiftSetting?.color) {
      const colorClasses = getShiftColorClasses(shiftSetting.color);
      // Determine icon based on shift type
      const iconMap: Record<string, typeof Sun> = {
        PAGI: Sun,
        MALAM: Moon,
        PIKET_PAGI: Sun,
        PIKET_MALAM: Moon,
        PAGI_MALAM: Clock,
        LIBUR: Calendar,
      };
      return {
        bg: colorClasses.bg,
        text: colorClasses.text,
        icon: iconMap[keterangan] || Calendar,
      };
    }

    // Fallback to default styles
    const defaultStyles: Record<
      string,
      { bg: string; text: string; icon: typeof Sun }
    > = {
      PAGI: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Sun },
      MALAM: { bg: 'bg-gray-200', text: 'text-gray-700', icon: Moon },
      PIKET_PAGI: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Sun },
      PIKET_MALAM: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Moon },
      PAGI_MALAM: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      LIBUR: { bg: 'bg-red-100', text: 'text-red-700', icon: Calendar },
    };
    return (
      defaultStyles[keterangan] || {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        icon: Calendar,
      }
    );
  };

  const getKeteranganLabel = (k: string) => {
    // Try to get name from shift settings
    const shiftSetting = shiftSettings.find((s) => s.shiftType === k);
    if (shiftSetting?.name) return shiftSetting.name;

    // Fallback to default names
    const defaultLabels: Record<string, string> = {
      PAGI: 'Pagi',
      MALAM: 'Malam',
      PIKET_PAGI: 'Piket Pagi',
      PIKET_MALAM: 'Piket Malam',
      PAGI_MALAM: 'Pagi & Malam',
      LIBUR: 'Libur',
    };
    return defaultLabels[k] || k;
  };

  if (isLoading) return <SkeletonPage />;

  return (
    <div className='space-y-6'>
      {/* Greeting Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        {currentUser && (
          <div className='flex items-center gap-4'>
            {currentUser.image ? (
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className='w-14 h-14 rounded-full object-cover'
              />
            ) : (
              <div className='w-14 h-14 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                <span className='text-xl font-bold text-white'>
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className='flex items-center gap-2'>
                <GreetingIcon className='w-5 h-5 text-amber-500' />
                <span className='text-gray-500'>{greeting.text},</span>
              </div>
              <h1 className='text-2xl font-bold text-gray-800'>
                {currentUser.nickname || currentUser.name}!
              </h1>
              <p className='text-sm text-gray-500'>
                {currentUser.position} • {currentUser.department}
              </p>
            </div>
          </div>
        )}
        <div className='text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm'>
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
        <Card className='border-l-4 border-l-emerald-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 uppercase'>Absen Tercepat</p>
              {earliestMember && earliestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 mt-1'>
                    {earliestMember.nickname || earliestMember.name}
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
            {earliestMember &&
              (earliestMember.image ? (
                <img
                  src={earliestMember.image}
                  alt={earliestMember.name}
                  className='w-14 h-14 rounded-full object-cover'
                />
              ) : (
                <div className='w-14 h-14 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                  <span className='text-xl font-bold text-white'>
                    {earliestMember.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </Card>
        <Card className='border-l-4 border-l-amber-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 uppercase'>Absen Terakhir</p>
              {latestMember && latestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 mt-1'>
                    {latestMember.nickname || latestMember.name}
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
            {latestMember &&
              (latestMember.image ? (
                <img
                  src={latestMember.image}
                  alt={latestMember.name}
                  className='w-14 h-14 rounded-full object-cover'
                />
              ) : (
                <div className='w-14 h-14 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                  <span className='text-xl font-bold text-white'>
                    {latestMember.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </Card>
        <Card className='border-l-4 border-l-blue-500'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-gray-500 uppercase'>Progres Absensi</p>
              {/* Period Type Switch Buttons */}
              <div className='flex rounded-lg border border-gray-200 overflow-hidden'>
                <button
                  onClick={() => setPeriodType('monthly')}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    periodType === 'monthly'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title='Periode 1-30/31 bulan ini'
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setPeriodType('16-15')}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    periodType === '16-15'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title='Periode tanggal 16 - 15 bulan berikutnya'
                >
                  16-15
                </button>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-lg font-bold text-gray-800'>
                  {formatPeriodLabel()}
                </p>
                <p className='text-2xl font-bold text-blue-600'>
                  {userPeriodAttendance}/{minWorkingDays}{' '}
                  <span className='text-sm font-normal'>hari</span>
                </p>
              </div>
              <div className='w-16 h-16 rounded-full border-4 border-blue-100 flex items-center justify-center relative'>
                <span className='text-lg font-bold text-blue-600'>
                  {attendanceProgressPercent}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Stats Row */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card className='col-span-2 lg:col-span-1'>
          <div className='flex items-center gap-3'>
            {todaySchedule ? (
              (() => {
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
                        {getKeteranganLabel(todaySchedule.keterangan)}
                      </p>
                    </div>
                  </>
                );
              })()
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
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Clock className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Absen</p>
              <p className='text-xl font-bold text-blue-600'>
                {userAttendance.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Wallet className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Saldo Kas</p>
              <p className='text-lg font-bold text-blue-600'>
                {formatCurrency(totalCash)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-xl font-bold text-gray-800'>
                {teamMembers.length}
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
                {todayAttendance.length}
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
              <p className='text-lg font-bold text-emerald-600'>
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
              <p className='text-lg font-bold text-red-600'>
                {formatCurrency(totalCashOut)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                Kehadiran Tim
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Statistik bulanan
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden'>
                {(['1bulan', '6bulan', '1tahun'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      chartPeriod === period
                        ? 'bg-[#E57373] text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period === '1bulan'
                      ? '1 Bln'
                      : period === '6bulan'
                      ? '6 Bln'
                      : '1 Thn'}
                  </button>
                ))}
              </div>
              <Link
                href='/attendance'
                className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
              >
                <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
          </div>
          <AttendanceChart
            data={scheduleChartData}
            shiftSettings={shiftSettings}
            period={chartPeriod}
          />
        </Card>
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                Arus Kas Tim
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Pemasukan & pengeluaran
              </p>
            </div>
            <Link
              href='/cash'
              className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
            >
              Lihat Semua <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
          <CashBookChart data={cashChartData} />
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
              <h3 className='font-semibold text-gray-800'>Jadwal Hari Ini</h3>
              <p className='text-sm text-gray-500'>
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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
          {['PAGI', 'MALAM', 'PIKET_PAGI', 'PIKET_MALAM', 'LIBUR'].map(
            (keterangan) => {
              const style = getScheduleStyle(keterangan);
              const IconComponent = style.icon;
              const members = scheduleEntries
                .filter(
                  (s) =>
                    getDateStr(s.tanggal) === todayStr &&
                    // Include users with matching keterangan OR PAGI_MALAM users for PAGI/MALAM columns
                    (s.keterangan === keterangan ||
                      (s.keterangan === 'PAGI_MALAM' &&
                        (keterangan === 'PAGI' || keterangan === 'MALAM'))) &&
                    taMemberIds.has(s.memberId)
                )
                .map((s) => taTeamMembers.find((m) => m.id === s.memberId))
                .filter(Boolean);
              return (
                <div key={keterangan} className={`p-3 rounded-xl ${style.bg}`}>
                  <div className='flex items-center gap-2 mb-2'>
                    <IconComponent className={`w-4 h-4 ${style.text}`} />
                    <span className={`text-sm font-medium ${style.text}`}>
                      {getKeteranganLabel(keterangan)}
                    </span>
                  </div>
                  {members.length === 0 ? (
                    <p className='text-xs text-gray-400'>Tidak ada</p>
                  ) : (
                    <div className='space-y-1.5'>
                      {members.slice(0, 6).map((member) => (
                        <div
                          key={member!.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          {member!.image ? (
                            <img
                              src={member!.image}
                              alt={member!.name}
                              className='w-6 h-6 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-6 h-6 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                              <span className='text-[8px] font-bold text-white'>
                                {member!.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className='text-gray-700 truncate'>
                            {member!.nickname || member!.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </Card>
    </div>
  );
}
