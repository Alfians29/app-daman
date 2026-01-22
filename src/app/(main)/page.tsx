'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getShiftColorClasses } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/components/AuthGuard';
import {
  Users,
  UserCheck,
  Wallet,
  Calendar,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CheckCircle,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Trophy,
  Quote,
} from 'lucide-react';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { CashBookChart } from '@/components/charts/CashBookChart';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { useUsers, useDashboardCharts } from '@/lib/swr-hooks';

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

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<
    '1bulan' | '6bulan' | '1tahun'
  >('1tahun');
  const [cashChartPeriod, setCashChartPeriod] = useState<
    '1bulan' | '6bulan' | '1tahun'
  >('1tahun');
  const [periodType, setPeriodType] = useState<'monthly' | '16-15'>('16-15');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user: authUser, isLoading: authLoading } = useCurrentUser();

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current year for data filtering
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // SWR hooks for cached data - using optimized aggregated endpoint
  const { users, isLoading: usersLoading } = useUsers(false);
  const { chartData, isLoading: chartLoading } = useDashboardCharts(
    currentYear,
    authUser?.id,
  );

  const isLoading = authLoading || usersLoading || chartLoading;

  // Process data with useMemo
  const teamMembers = useMemo(() => {
    return (users as TeamMember[]).filter((u) => u.isActive);
  }, [users]);

  const currentUser = useMemo(() => {
    if (!authUser?.id) return null;
    return (
      teamMembers.find((u) => u.id === authUser.id) || teamMembers[0] || null
    );
  }, [authUser, teamMembers]);

  // Extract data from aggregated chartData
  const todayStats = chartData?.todayStats || {
    attendance: [],
    schedules: [],
    totalIncome: 0,
    totalExpense: 0,
  };
  const userStats = chartData?.userStats || {
    totalAttendance: 0,
    ontimeCount: 0,
    attendanceRecords: [],
  };
  const shiftSettings = (chartData?.shiftSettings || []) as {
    shiftType: string;
    name: string;
    color: string | null;
  }[];

  // Get different data sets from API for different chart periods
  const scheduleByMonth = chartData?.scheduleByMonth || [];
  const scheduleByWeek = chartData?.scheduleByWeek || [];
  const scheduleby6Month = chartData?.scheduleby6Month || [];
  const cashByMonth = chartData?.cashByMonth || [];
  const cashByWeek = chartData?.cashByWeek || [];
  const cashBy6Month = chartData?.cashBy6Month || [];
  const jobTypeLeaderboard = (chartData?.jobTypeLeaderboard || []) as {
    rank: number | null;
    id: string;
    name: string;
    totalValue: number;
  }[];

  // Select appropriate chart data based on period
  const scheduleChartData = useMemo(() => {
    if (chartPeriod === '1bulan') {
      // Weekly data for current month (Minggu 1-4)
      return scheduleByWeek;
    }

    if (chartPeriod === '6bulan') {
      // Last 6 months including previous year if needed
      return scheduleby6Month;
    }

    // 1tahun - show all 12 months
    return scheduleByMonth;
  }, [scheduleByMonth, scheduleByWeek, scheduleby6Month, chartPeriod]);

  // Select appropriate cash chart data based on period
  const filteredCashChartData = useMemo(() => {
    if (cashChartPeriod === '1bulan') {
      // Weekly data for current month (Minggu 1-4)
      return cashByWeek;
    }

    if (cashChartPeriod === '6bulan') {
      // Last 6 months
      return cashBy6Month;
    }

    // 1tahun - all 12 months
    return cashByMonth;
  }, [cashByMonth, cashByWeek, cashBy6Month, cashChartPeriod]);

  // Today's data from aggregated endpoint
  const attendanceRecords = todayStats.attendance as AttendanceRecord[];
  const scheduleEntries = todayStats.schedules as Schedule[];
  const totalCashIn = todayStats.totalIncome;
  const totalCashOut = todayStats.totalExpense;
  const totalCash = totalCashIn - totalCashOut;

  const today = new Date();
  // Use local date string for comparison (YYYY-MM-DD format)
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
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
      '0',
    )}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const getGreeting = () => {
    if (hour >= 5 && hour < 11) return { text: 'Selamat Pagi', icon: Sunrise };
    if (hour >= 11 && hour < 15) return { text: 'Selamat Siang', icon: Sun };
    if (hour >= 15 && hour < 18) return { text: 'Selamat Sore', icon: Sunset };
    return { text: 'Selamat Malam', icon: Moon };
  };

  // Fun quotes for dashboard
  const funQuotes = [
    'Semangat kerja!',
    'Jangan lupa ngopi dulu!',
    'Hari yang produktif menanti!',
    'Keep up the good work!',
    'Senyum dulu sebelum kerja!',
    'Stretching dulu biar fresh!',
    'You got this!',
    'Tetap semangat ya!',
    'Kerjaan banyak? Santai aja dulu~',
    'Gas terus!',
    'Less stress, more success!',
    'Minum air putih dulu ya!',
    'Hustle mode: ON!',
    'Jadilah versi terbaik dari dirimu!',
  ];

  // Random nickname variations populer Indonesia
  const nicknameVariations = [
    '', // Normal nickname
    'Bos ',
    'Bestie ',
    'Kak ',
    'Rekan ',
    'Komandan ',
    'Sobat ',
    'Kawan ',
    'Partner ',
    'Sahabat ',
    'Master ',
    'Kapten ',
    'Chief ',
    'Legend ',
  ];

  // Motivational quotes from famous people
  const motivationalQuotes = [
    {
      quote:
        'Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.',
      author: 'Colin Powell',
    },
    {
      quote:
        'Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan.',
      author: 'Steve Jobs',
    },
    {
      quote: 'Jangan takut gagal. Takutlah tidak mencoba.',
      author: 'Michael Jordan',
    },
    {
      quote:
        'Masa depan milik mereka yang percaya pada keindahan mimpi-mimpi mereka.',
      author: 'Eleanor Roosevelt',
    },
    {
      quote: 'Kesempatan tidak terjadi begitu saja, kamu yang menciptakannya.',
      author: 'Chris Grosser',
    },
    {
      quote: 'Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.',
      author: 'Tim Notke',
    },
    {
      quote:
        'Sukses biasanya datang kepada mereka yang terlalu sibuk untuk mencarinya.',
      author: 'Henry David Thoreau',
    },
    {
      quote: 'Jangan biarkan kemarin mengambil terlalu banyak hari ini.',
      author: 'Will Rogers',
    },
    {
      quote: 'Cara memulai adalah berhenti berbicara dan mulai melakukan.',
      author: 'Walt Disney',
    },
    {
      quote: 'Percaya kamu bisa dan kamu sudah setengah jalan.',
      author: 'Theodore Roosevelt',
    },
    {
      quote:
        'Kesuksesan bukan final, kegagalan bukan fatal. Keberanian untuk melanjutkan yang penting.',
      author: 'Winston Churchill',
    },
    {
      quote:
        'Hidup ini 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya.',
      author: 'Charles R. Swindoll',
    },
    {
      quote: 'Tampaknya selalu mustahil sampai semuanya selesai.',
      author: 'Nelson Mandela',
    },
    {
      quote:
        'Imajinasi lebih penting daripada pengetahuan. Pengetahuan terbatas, imajinasi melingkupi dunia.',
      author: 'Albert Einstein',
    },
  ];

  // Get random quote and nickname prefix (unique per user, regenerates daily)
  // Use todayStr to ensure quotes change daily and differ per user
  const randomQuote = useMemo(() => {
    const userId = authUser?.id || 'guest';
    // Create a numeric seed from date string (YYYY-MM-DD) + userId
    const dateHash = todayStr
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const userHash = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hash = dateHash + userHash;
    return funQuotes[hash % funQuotes.length];
  }, [authUser?.id, todayStr]);

  const nicknamePrefix = useMemo(() => {
    const userId = authUser?.id || 'guest';
    // Different offset (multiply by 7) for variety from randomQuote
    const dateHash =
      todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 7;
    const userHash = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hash = dateHash + userHash;
    return nicknameVariations[hash % nicknameVariations.length];
  }, [authUser?.id, todayStr]);

  // Random motivational quote (changes daily, unique per user)
  const motivationalQuote = useMemo(() => {
    const userId = authUser?.id || 'guest';
    // Different offset (multiply by 13) for variety from other quotes
    const dateHash =
      todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) *
      13;
    const userHash = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hash = dateHash + userHash;
    return motivationalQuotes[hash % motivationalQuotes.length];
  }, [authUser?.id, todayStr]);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // User stats from aggregated data
  const userAttendance = userStats.attendanceRecords || [];
  const userOntimeCount = userStats.ontimeCount;
  const userOntimeRate =
    userStats.totalAttendance > 0
      ? Math.round((userOntimeCount / userStats.totalAttendance) * 100)
      : 0;

  // Today's schedule for current user
  const todaySchedule = scheduleEntries.find(
    (s: Schedule) =>
      currentUser &&
      s.memberId === currentUser.id &&
      getDateStr(s.tanggal) === todayStr,
  );

  // Filter: Only TA members for attendance/schedule stats
  const taTeamMembers = teamMembers.filter(
    (m) => m.department === 'Data Management - TA',
  );
  const taMemberIds = new Set(taTeamMembers.map((m) => m.id));

  // Today attendance - filtered by TA department
  const todayAttendance = attendanceRecords.filter(
    (r) => getDateStr(r.tanggal) === todayStr && taMemberIds.has(r.memberId),
  );
  const sortedByTime = [...todayAttendance].sort((a, b) =>
    (a.jamAbsen || '99:99').localeCompare(b.jamAbsen || '99:99'),
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
  // Use userAttendance (user's full attendance data) instead of attendanceRecords (today only)
  const userPeriodAttendance = (userAttendance as AttendanceRecord[]).filter(
    (r) => {
      // Extract date portion from ISO string (first 10 chars: YYYY-MM-DD)
      const recordDateStr = r.tanggal.substring(0, 10);
      return recordDateStr >= periodStartStr && recordDateStr <= periodEndStr;
    },
  ).length;
  const attendanceProgressPercent = Math.min(
    100,
    Math.round((userPeriodAttendance / minWorkingDays) * 100),
  );

  const formatPeriodLabel = () => {
    if (periodType === 'monthly') {
      // Bulanan: show "Desember 2025" format
      return startDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
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
      // Map color to dot color
      const dotColorMap: Record<string, string> = {
        green: 'bg-green-500',
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500',
        cyan: 'bg-cyan-500',
        red: 'bg-red-500',
        pink: 'bg-pink-500',
        orange: 'bg-orange-500',
        teal: 'bg-teal-500',
        indigo: 'bg-indigo-500',
        gray: 'bg-gray-500',
      };
      return {
        bg: colorClasses.bg,
        text: colorClasses.text,
        icon: iconMap[keterangan] || Calendar,
        dot: dotColorMap[shiftSetting.color] || 'bg-gray-500',
      };
    }

    // Fallback to default styles
    const defaultStyles: Record<
      string,
      { bg: string; text: string; icon: typeof Sun; dot: string }
    > = {
      PAGI: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: Sun,
        dot: 'bg-blue-500',
      },
      MALAM: {
        bg: 'bg-gray-200',
        text: 'text-gray-700',
        icon: Moon,
        dot: 'bg-gray-500',
      },
      PIKET_PAGI: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: Sun,
        dot: 'bg-emerald-500',
      },
      PIKET_MALAM: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: Moon,
        dot: 'bg-purple-500',
      },
      PAGI_MALAM: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: Clock,
        dot: 'bg-amber-500',
      },
      LIBUR: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: Calendar,
        dot: 'bg-red-500',
      },
    };
    return (
      defaultStyles[keterangan] || {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        icon: Calendar,
        dot: 'bg-gray-500',
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
          <div className='relative inline-flex items-center gap-4 bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b] px-5 py-4 rounded-2xl shadow-lg text-white animate-fadeIn overflow-hidden'>
            {/* Decorative circles */}
            <div className='absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full' />
            <div className='absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full' />

            {currentUser.image ? (
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className='relative z-10 w-14 h-14 rounded-full object-cover ring-2 ring-white/50 shadow-md'
              />
            ) : (
              <div className='relative z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/50 shadow-md'>
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
            <div className='relative z-10'>
              <div className='flex items-center gap-2'>
                <GreetingIcon className='w-5 h-5 text-amber-300' />
                <span className='text-white'>{greeting.text},</span>
              </div>
              <h1 className='text-2xl font-bold text-white'>
                {nicknamePrefix}
                {currentUser.nickname || currentUser.name}!
              </h1>
              <p className='text-sm text-white/90'>{randomQuote}</p>
            </div>
          </div>
        )}

        {/* Motivational Quote */}
        <div
          className='hidden lg:flex flex-1 items-center justify-center px-6 animate-fadeIn'
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div className='text-center max-w-md'>
            <Quote className='w-8 h-8 text-[#E57373]/30 mx-auto mb-2 rotate-180' />
            <p className='text-gray-600 dark:text-gray-400 italic text-sm leading-relaxed'>
              "{motivationalQuote.quote}"
            </p>
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium'>
              — {motivationalQuote.author}
            </p>
          </div>
        </div>

        <div
          className='relative text-sm bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b] px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 animate-fadeIn overflow-hidden'
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          {/* Decorative circle */}
          <div className='absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full' />

          <span className='relative z-10 text-white'>
            {today.toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className='relative z-10 text-white/50'>|</span>
          <span className='relative z-10 text-white tabular-nums'>
            {String(currentTime.getHours()).padStart(2, '0')}:
            {String(currentTime.getMinutes()).padStart(2, '0')}:
            {String(currentTime.getSeconds()).padStart(2, '0')} WIB
          </span>
        </div>
      </div>

      {/* Attendance Highlights */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card className='border-l-4 border-l-emerald-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase'>
                Absen Tercepat
              </p>
              {earliestMember && earliestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 dark:text-white mt-1'>
                    {earliestMember.name}
                  </p>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {earliestAttendance.jamAbsen}
                  </p>
                </>
              ) : (
                <p className='text-lg font-medium text-gray-400 dark:text-gray-500 mt-1'>
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
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase'>
                Absen Terakhir
              </p>
              {latestMember && latestAttendance ? (
                <>
                  <p className='text-lg font-bold text-gray-800 dark:text-white mt-1'>
                    {latestMember.name}
                  </p>
                  <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                    {latestAttendance.jamAbsen}
                  </p>
                </>
              ) : (
                <p className='text-lg font-medium text-gray-400 dark:text-gray-500 mt-1'>
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
              <p className='text-xs text-gray-500 uppercase'>
                Progres Kehadiran
              </p>
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
              <div className='relative w-16 h-16'>
                {/* SVG Circular Progress */}
                <svg
                  className='w-16 h-16 transform -rotate-90'
                  viewBox='0 0 64 64'
                >
                  {/* Background circle */}
                  <circle
                    cx='32'
                    cy='32'
                    r='28'
                    stroke='#dbeafe'
                    strokeWidth='6'
                    fill='transparent'
                  />
                  {/* Progress circle */}
                  <circle
                    cx='32'
                    cy='32'
                    r='28'
                    stroke={
                      attendanceProgressPercent >= 100 ? '#10b981' : '#3b82f6'
                    }
                    strokeWidth='6'
                    fill='transparent'
                    strokeLinecap='round'
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 28 * (1 - attendanceProgressPercent / 100)
                    }`}
                    className='transition-all duration-500'
                  />
                </svg>
                {/* Percentage text */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <span
                    className={`text-sm font-bold ${
                      attendanceProgressPercent >= 100
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {attendanceProgressPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Stats Row */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card className='col-span-2 lg:col-span-1 relative'>
          {todaySchedule ? (
            (() => {
              const style = getScheduleStyle(todaySchedule.keterangan);
              const IconComponent = style.icon;
              return (
                <>
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 ${style.dot} rounded-full animate-pulse`}
                  />
                  <div className='flex items-center gap-3'>
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
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <span className='absolute top-2 right-2 w-2 h-2 bg-gray-400 rounded-full' />
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center'>
                  <Calendar className='w-6 h-6 text-gray-400 dark:text-gray-500' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Jadwal Hari Ini
                  </p>
                  <p className='font-medium text-gray-500 dark:text-gray-400'>
                    Tidak ada
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
        <Card className='relative'>
          <span className='absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse' />
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Tingkat Ketepatan
              </p>
              <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                {userOntimeRate}%
              </p>
            </div>
          </div>
        </Card>
        <Card className='relative'>
          <span className='absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
              <Clock className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Kehadiran
              </p>
              <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                {userAttendance.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
              <Wallet className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Saldo Kas
              </p>
              <p className='text-lg font-bold text-blue-600 dark:text-blue-400'>
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
            <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
              <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Anggota
              </p>
              <p className='text-xl font-bold text-gray-800 dark:text-white'>
                {teamMembers.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
              <UserCheck className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Hadir Hari Ini
              </p>
              <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                {todayAttendance.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
              <ArrowDownCircle className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Pemasukan
              </p>
              <p className='text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                {formatCurrency(totalCashIn)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center'>
              <ArrowUpCircle className='w-6 h-6 text-red-600 dark:text-red-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Pengeluaran
              </p>
              <p className='text-lg font-bold text-red-600 dark:text-red-400'>
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
                Kehadiran tim berdasarkan jadwal
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
                        ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
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
            <div className='flex items-center gap-2'>
              <div className='flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden'>
                {(['1bulan', '6bulan', '1tahun'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setCashChartPeriod(period)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      cashChartPeriod === period
                        ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
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
                href='/cash'
                className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
              >
                <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
          </div>
          <CashBookChart data={filteredCashChartData} />
        </Card>
      </div>

      {/* Job Type Leaderboard */}
      {jobTypeLeaderboard.length > 0 && (
        <Card>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center'>
              <Trophy className='w-5 h-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                Leaderboard Pekerjaan
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Bulan{' '}
                {new Date().toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Left column - first half */}
            <div className='space-y-2'>
              {jobTypeLeaderboard
                .slice(0, Math.floor(jobTypeLeaderboard.length / 2))
                .map((item) => {
                  const isTop3 = item.rank !== null && item.rank <= 3;
                  const isZero = item.rank === null;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-xl ${
                        isTop3 ? 'p-3' : 'p-2'
                      } ${
                        item.rank === 1
                          ? 'bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700'
                          : item.rank === 2
                            ? 'bg-linear-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border border-gray-200 dark:border-gray-600'
                            : item.rank === 3
                              ? 'bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700'
                              : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div
                        className={`rounded-full flex items-center justify-center font-bold ${
                          isTop3 ? 'w-10 h-10 text-lg' : 'w-7 h-7 text-sm'
                        } ${
                          item.rank === 1
                            ? 'bg-amber-500 text-white'
                            : item.rank === 2
                              ? 'bg-gray-400 text-white'
                              : item.rank === 3
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isZero ? '-' : item.rank}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p
                          className={`font-medium truncate ${
                            isTop3
                              ? 'text-gray-800 dark:text-gray-100'
                              : 'text-gray-700 dark:text-gray-200 text-sm'
                          }`}
                        >
                          {item.name}
                        </p>
                        {isTop3 && (
                          <p
                            className={`text-lg font-bold ${
                              item.rank === 1
                                ? 'text-amber-600'
                                : item.rank === 2
                                  ? 'text-gray-600'
                                  : 'text-orange-600'
                            }`}
                          >
                            {item.totalValue.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      {!isTop3 && (
                        <p
                          className={`text-sm font-bold ${
                            isZero
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {item.totalValue.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Right column - second half */}
            <div className='space-y-2'>
              {jobTypeLeaderboard
                .slice(Math.floor(jobTypeLeaderboard.length / 2))
                .map((item) => {
                  const isZero = item.rank === null;
                  return (
                    <div
                      key={item.id}
                      className='flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                    >
                      <div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-200'>
                        {isZero ? '-' : item.rank}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-200 truncate'>
                          {item.name}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          isZero
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {item.totalValue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* Today's Schedule Overview */}
      <Card>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                Jadwal Hari Ini
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
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
                    taMemberIds.has(s.memberId),
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
                    <p className='text-xs text-gray-400 dark:text-gray-500'>
                      Tidak ada
                    </p>
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
                          <span className='text-gray-700 dark:text-gray-200 truncate'>
                            {member!.nickname || member!.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </Card>
    </div>
  );
}
