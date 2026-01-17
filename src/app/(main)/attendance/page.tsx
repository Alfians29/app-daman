'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { useCurrentUser } from '@/components/AuthGuard';
import { getShiftColorClasses, getLocalDateString } from '@/lib/utils';
import {
  useUsers,
  useShifts,
  useSchedule,
  useAttendance,
} from '@/lib/swr-hooks';

type AttendanceRecord = {
  id: string;
  memberId: string;
  member: { id: string; name: string; image: string | null };
  tanggal: string;
  jamAbsen: string;
  keterangan: string;
  status: string;
};

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  department: string;
  image: string | null;
  isActive: boolean;
};

type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

const getCurrentPeriod = (type: 'monthly' | '16-15' = '16-15') => {
  const today = new Date();
  const day = today.getDate();
  let startDate: Date;
  let endDate: Date;

  if (type === 'monthly') {
    // Bulanan: 1st to last day of current month
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
  } else {
    // 16-15: 16th of current/previous month to 15th of next month
    if (day >= 16) {
      startDate = new Date(today.getFullYear(), today.getMonth(), 16);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 16);
      endDate = new Date(today.getFullYear(), today.getMonth(), 15);
    }
  }
  return { startDate, endDate };
};

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterKeterangan, setFilterKeterangan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showMyHistory, setShowMyHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [periodType, setPeriodType] = useState<'monthly' | '16-15'>('16-15');

  const { user: authUser, isLoading: authLoading } = useCurrentUser();

  // Calculate date range for SWR - 2 months back for 16-15 period
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const loadDateFrom = `${twoMonthsAgo.getFullYear()}-${String(
    twoMonthsAgo.getMonth() + 1
  ).padStart(2, '0')}-01`;
  const loadDateTo = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${String(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  ).padStart(2, '0')}`;

  // SWR hooks for cached data
  // Using slim mode for schedule and attendance to reduce payload size (~5MB → ~800KB)
  const { users, isLoading: usersLoading } = useUsers(false);
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { schedules, isLoading: schedLoading } = useSchedule(
    now.getMonth() + 1,
    now.getFullYear(),
    true // slim mode
  );
  const { attendance: rawAttendance, isLoading: attLoading } = useAttendance(
    loadDateFrom,
    loadDateTo,
    true // slim mode
  );

  const isLoading =
    authLoading || usersLoading || shiftsLoading || schedLoading || attLoading;

  // Process data with useMemo
  const teamMembers = useMemo(() => {
    return (users as TeamMember[]).filter(
      (u: TeamMember) => u.isActive && u.department === 'Data Management - TA'
    );
  }, [users]);

  const currentUser = useMemo(() => {
    if (!authUser?.id) return null;
    return (
      teamMembers.find((u: TeamMember) => u.id === authUser.id) ||
      teamMembers[0] ||
      null
    );
  }, [authUser, teamMembers]);

  // Join member data client-side (since slim mode skips member relation)
  const memberMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; image: string | null }
    >();
    (users as TeamMember[]).forEach((u) => {
      map.set(u.id, { id: u.id, name: u.name, image: u.image });
    });
    return map;
  }, [users]);

  const attendanceRecords = useMemo(() => {
    return (rawAttendance as any[]).map((r) => ({
      ...r,
      member: memberMap.get(r.memberId) || {
        id: r.memberId,
        name: 'Unknown',
        image: null,
      },
    })) as AttendanceRecord[];
  }, [rawAttendance, memberMap]);

  const scheduleEntries = schedules as Schedule[];

  const shiftSettings = useMemo(() => {
    return (
      shifts as {
        shiftType: string;
        name: string;
        color: string | null;
        isActive: boolean;
      }[]
    ).filter((s) => s.isActive);
  }, [shifts]);

  const { startDate, endDate } = getCurrentPeriod(periodType);

  // Helper to format date to YYYY-MM-DD string for comparison
  const toDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const periodStartStr = toDateStr(startDate);
  const periodEndStr = toDateStr(endDate);

  const periodLabel =
    periodType === 'monthly'
      ? startDate.toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        })
      : `${startDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        })} - ${endDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`;

  // Build keteranganOptions from shift settings or use defaults
  const keteranganOptions =
    shiftSettings.length > 0
      ? shiftSettings.map((s) => ({
          value: s.shiftType,
          label: s.name,
          icon: s.shiftType.includes('MALAM')
            ? Moon
            : s.shiftType === 'LIBUR'
              ? XCircle
              : Sun,
          color: s.color,
        }))
      : [
          { value: 'PAGI', label: 'Pagi', icon: Sun, color: 'blue' },
          { value: 'MALAM', label: 'Malam', icon: Moon, color: 'gray' },
          {
            value: 'PIKET_PAGI',
            label: 'Piket Pagi',
            icon: Sun,
            color: 'emerald',
          },
          {
            value: 'PIKET_MALAM',
            label: 'Piket Malam',
            icon: Moon,
            color: 'purple',
          },
          {
            value: 'PAGI_MALAM',
            label: 'Pagi Malam',
            icon: Sun,
            color: 'amber',
          },
          { value: 'LIBUR', label: 'Libur', icon: XCircle, color: 'red' },
        ];

  const getKeteranganLabel = (value: string) => {
    const option = keteranganOptions.find((k) => k.value === value);
    return option?.label || value;
  };

  const getKeteranganStyle = (keterangan: string) => {
    const option = keteranganOptions.find((k) => k.value === keterangan);
    if (option?.color) {
      const colorClasses = getShiftColorClasses(option.color);
      return `${colorClasses.bg} ${colorClasses.text}`;
    }
    // Fallback
    return 'bg-gray-100 text-gray-700';
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      if (showMyHistory && currentUser && record.memberId !== currentUser.id)
        return false;
      const matchesSearch = record.member?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesKeterangan =
        filterKeterangan === 'all' || record.keterangan === filterKeterangan;
      const matchesStatus =
        filterStatus === 'all' || record.status === filterStatus;
      let matchesDate = true;
      const recordDate = record.tanggal.split('T')[0];
      if (dateFrom) matchesDate = matchesDate && recordDate >= dateFrom;
      if (dateTo) matchesDate = matchesDate && recordDate <= dateTo;
      return matchesSearch && matchesKeterangan && matchesStatus && matchesDate;
    });
  }, [
    attendanceRecords,
    searchQuery,
    filterKeterangan,
    filterStatus,
    dateFrom,
    dateTo,
    showMyHistory,
    currentUser,
  ]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = () => setCurrentPage(1);

  const today = getLocalDateString();
  const todayRecords = attendanceRecords.filter(
    (r) => r.tanggal.split('T')[0] === today
  );

  // My period stats
  const myPeriodRecords = attendanceRecords.filter((r) => {
    if (!currentUser || r.memberId !== currentUser.id) return false;
    // Extract date portion from ISO string (first 10 chars: YYYY-MM-DD)
    const recordDateStr = r.tanggal.substring(0, 10);
    return recordDateStr >= periodStartStr && recordDateStr <= periodEndStr;
  });

  const myAllRecords = attendanceRecords.filter(
    (r) => currentUser && r.memberId === currentUser.id
  );
  const myOntimeCount = myPeriodRecords.filter(
    (r) => r.status === 'ONTIME'
  ).length;
  const myTelatCount = myPeriodRecords.filter(
    (r) => r.status === 'TELAT'
  ).length;

  const myPeriodSchedules = scheduleEntries.filter((s) => {
    if (!currentUser || s.memberId !== currentUser.id) return false;
    // Extract date portion from ISO string (first 10 chars: YYYY-MM-DD)
    const scheduleDateStr = s.tanggal.substring(0, 10);
    return scheduleDateStr >= periodStartStr && scheduleDateStr <= periodEndStr;
  });

  const myScheduleKeteranganCounts = {
    PAGI: myPeriodSchedules.filter((s) => s.keterangan === 'PAGI').length,
    MALAM: myPeriodSchedules.filter((s) => s.keterangan === 'MALAM').length,
    PIKET_PAGI: myPeriodSchedules.filter((s) => s.keterangan === 'PIKET_PAGI')
      .length,
    PIKET_MALAM: myPeriodSchedules.filter((s) => s.keterangan === 'PIKET_MALAM')
      .length,
    PAGI_MALAM: myPeriodSchedules.filter((s) => s.keterangan === 'PAGI_MALAM')
      .length,
    LIBUR: myPeriodSchedules.filter((s) => s.keterangan === 'LIBUR').length,
  };

  const myWorkingDays = myPeriodRecords.filter(
    (r) => r.keterangan !== 'LIBUR'
  ).length;
  const myLiburCount = myScheduleKeteranganCounts.LIBUR;
  const targetDays = 21;
  const progressPercent = Math.min((myWorkingDays / targetDays) * 100, 100);
  const daysRemaining = Math.max(targetDays - myWorkingDays, 0);
  const ontimePercent =
    myWorkingDays > 0 ? Math.round((myOntimeCount / myWorkingDays) * 100) : 0;

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setFilterKeterangan('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    dateFrom ||
    dateTo ||
    filterKeterangan !== 'all' ||
    filterStatus !== 'all';

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kehadiran'
        description={`Periode: ${periodLabel}`}
        icon={UserCheck}
        actions={
          <button
            onClick={() => {
              setShowMyHistory(!showMyHistory);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              showMyHistory
                ? 'bg-white text-[#E57373]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {showMyHistory ? 'Lihat Semua' : 'Progress Saya'}
          </button>
        }
      />

      {/* My Progress Stats */}
      {showMyHistory && currentUser && (
        <div className='space-y-4'>
          <Card className='bg-linear-to-r from-[#E57373] to-[#C62828] dark:from-[#7f1d1d] dark:to-[#991b1b] text-white'>
            {/* Row 1: User Info + Switch Buttons */}
            <div className='flex items-center justify-between gap-4 mb-4'>
              {/* User Info */}
              <div className='flex items-center gap-3 min-w-0 flex-1'>
                {currentUser.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser.name}
                    className='w-12 h-12 rounded-full object-cover shrink-0'
                  />
                ) : (
                  <div className='w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0'>
                    <span className='text-lg font-bold text-white'>
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                <div className='min-w-0'>
                  <p className='font-semibold text-base truncate'>
                    {currentUser.name}
                  </p>
                  <p className='text-white/80 text-sm truncate'>
                    {currentUser.position}
                  </p>
                </div>
              </div>

              {/* Period Type Switch Buttons */}
              <div className='flex rounded-xl border border-white/30 overflow-hidden bg-white/10 shrink-0'>
                <button
                  onClick={() => setPeriodType('monthly')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    periodType === 'monthly'
                      ? 'bg-white text-[#E57373]'
                      : 'text-white hover:bg-white/20'
                  }`}
                  title='Periode sebulan penuh'
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setPeriodType('16-15')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    periodType === '16-15'
                      ? 'bg-white text-[#E57373]'
                      : 'text-white hover:bg-white/20'
                  }`}
                  title='Periode tanggal 16 - 15 bulan berikutnya'
                >
                  16-15
                </button>
              </div>
            </div>

            {/* Row 2: Periode + Progress Bar (side by side) */}
            <div className='flex flex-col md:flex-row gap-3'>
              {/* Periode Info */}
              <div className='bg-white/10 rounded-xl px-4 py-3 flex items-center justify-center md:w-48 shrink-0'>
                <div className='text-center'>
                  <p className='text-xs text-white/60 mb-0.5'>Periode</p>
                  <p className='text-sm font-semibold'>{periodLabel}</p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className='bg-white/10 rounded-xl p-4 flex-1'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Target Kehadiran</span>
                  <span className='text-sm font-bold'>
                    {myWorkingDays}/{targetDays} hari
                  </span>
                </div>
                <div className='h-2.5 bg-white/20 rounded-full overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressPercent >= 100 ? 'bg-emerald-400' : 'bg-white'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className='text-xs text-white/80 mt-2 text-center'>
                  {progressPercent >= 100
                    ? '✅ Target tercapai!'
                    : `${daysRemaining} hari lagi menuju target`}
                </p>
              </div>
            </div>
          </Card>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
                {myAllRecords.length}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Absen
              </p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {ontimePercent}%
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Tingkat Ketepatan
              </p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {myOntimeCount}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Ontime</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                {myTelatCount}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Telat</p>
            </Card>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!showMyHistory && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
                <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <p className='text-xs text-blue-500 dark:text-blue-400'>
                  Total Anggota
                </p>
                <p className='text-2xl font-bold text-blue-800 dark:text-blue-300'>
                  {teamMembers.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
              </div>
              <div>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Hadir Hari Ini
                </p>
                <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                  {todayRecords.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center'>
                <Clock className='w-6 h-6 text-amber-600 dark:text-amber-400' />
              </div>
              <div>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Telat Hari Ini
                </p>
                <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                  {todayRecords.filter((r) => r.status === 'TELAT').length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center'>
                <XCircle className='w-6 h-6 text-red-600 dark:text-red-400' />
              </div>
              <div>
                <p className='text-xs text-red-500 dark:text-red-400'>
                  Libur Hari Ini
                </p>
                <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {
                    scheduleEntries.filter(
                      (s) =>
                        s.tanggal.substring(0, 10) === today &&
                        s.keterangan === 'LIBUR'
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          handleFilterChange();
        }}
        searchPlaceholder='Cari nama anggota...'
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(val) => {
          setDateFrom(val);
          handleFilterChange();
        }}
        onDateToChange={(val) => {
          setDateTo(val);
          handleFilterChange();
        }}
        selects={[
          {
            value: filterKeterangan,
            onChange: (val) => {
              setFilterKeterangan(val);
              handleFilterChange();
            },
            options: keteranganOptions,
            placeholder: 'Semua Keterangan',
          },
          {
            value: filterStatus,
            onChange: (val) => {
              setFilterStatus(val);
              handleFilterChange();
            },
            options: [
              { value: 'ONTIME', label: 'Ontime' },
              { value: 'TELAT', label: 'Telat' },
            ],
            placeholder: 'Semua Status',
          },
        ]}
        showReset
        onReset={resetFilters}
      />

      {/* Attendance Table */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
            {showMyHistory ? 'Progress Kehadiran Saya' : 'Daftar Kehadiran'}
          </h3>
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            {filteredRecords.length} data
          </span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-800'>
              <tr>
                {!showMyHistory && (
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Anggota
                  </th>
                )}
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Tanggal
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Jam Absen
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Keterangan
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={showMyHistory ? 4 : 5}
                    className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                  >
                    <Calendar className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2' />
                    <p>Tidak ada data kehadiran</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  >
                    {!showMyHistory && (
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          {record.member?.image ? (
                            <img
                              src={record.member.image}
                              alt={record.member.name || ''}
                              className='w-8 h-8 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-8 h-8 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                              <span className='text-xs font-bold text-white'>
                                {(record.member?.name || 'U')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          <p className='font-medium text-gray-800 dark:text-gray-200 text-sm'>
                            {record.member?.name}
                          </p>
                        </div>
                      </td>
                    )}
                    <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                      {new Date(record.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200'>
                      {record.jamAbsen}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getKeteranganStyle(
                          record.keterangan
                        )}`}
                      >
                        {getKeteranganLabel(record.keterangan)}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${
                          record.status === 'ONTIME'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {record.status === 'ONTIME' ? (
                          <CheckCircle className='w-3 h-3' />
                        ) : (
                          <Clock className='w-3 h-3' />
                        )}
                        {record.status === 'ONTIME' ? 'Ontime' : 'Telat'}
                      </span>
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
                          ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
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
