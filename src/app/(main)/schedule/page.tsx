'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { useCurrentUser } from '@/components/AuthGuard';
import { getShiftColorClasses } from '@/lib/utils';
import { useUsers, useShifts, useSchedule } from '@/lib/swr-hooks';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  CalendarDays,
} from 'lucide-react';

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  department: string;
  image: string | null;
  isActive: boolean;
  nik: string;
};

type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

export default function SchedulePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMySchedule, setShowMySchedule] = useState(false);
  const [periodType, setPeriodType] = useState<'monthly' | '16-15'>('16-15');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const { user: authUser, isLoading: authLoading } = useCurrentUser();

  // SWR hooks with caching
  const month = currentStartDate.getMonth() + 1;
  const year = currentStartDate.getFullYear();

  const { users, isLoading: usersLoading } = useUsers();
  const {
    schedules,
    shiftColors,
    isLoading: schedLoading,
  } = useSchedule(month, year, true); // slim mode - member data from useUsers
  const { shifts, isLoading: shiftsLoading } = useShifts();

  const isLoading =
    authLoading || usersLoading || schedLoading || shiftsLoading;

  // Filter and process users
  const teamMembers = useMemo(() => {
    const activeUsers = (users as TeamMember[]).filter(
      (u: TeamMember) => u.isActive && u.department === 'Data Management - TA'
    );
    activeUsers.sort((a, b) => a.nik.localeCompare(b.nik));
    return activeUsers;
  }, [users]);

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

  // Find current user
  const currentUser = useMemo(() => {
    if (!authUser?.id) return null;
    return (
      teamMembers.find((u: TeamMember) => u.id === authUser.id) ||
      teamMembers[0]
    );
  }, [authUser, teamMembers]);

  const getDaysInMonth = (startDate: Date) => {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthDates = getDaysInMonth(currentStartDate);

  const prevMonth = () => {
    const newDate = new Date(currentStartDate);
    newDate.setMonth(currentStartDate.getMonth() - 1);
    setCurrentStartDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentStartDate);
    newDate.setMonth(currentStartDate.getMonth() + 1);
    setCurrentStartDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const getMonthLabel = () =>
    currentStartDate.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });

  const filteredMembers = useMemo(() => {
    let members = teamMembers;
    if (showMySchedule && currentUser) {
      members = members.filter((m) => m.id === currentUser.id);
    }
    if (selectedMemberId !== 'all' && !showMySchedule) {
      members = members.filter((m) => m.id === selectedMemberId);
    }
    if (searchQuery) {
      members = members.filter(
        (m) =>
          (m.nickname || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return members;
  }, [teamMembers, searchQuery, showMySchedule, selectedMemberId, currentUser]);

  const getScheduleForMember = (memberId: string, date: Date) => {
    // Use local date format YYYY-MM-DD for comparison
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return scheduleEntries.find(
      // Extract date part directly from ISO string (first 10 characters)
      (s) => s.memberId === memberId && s.tanggal.substring(0, 10) === dateStr
    );
  };

  const getKeteranganStyle = (keterangan: string) => {
    // Use dynamic color from shift settings (from manage-shift page) if available
    const shiftSetting = shiftSettings.find((s) => s.shiftType === keterangan);
    if (shiftSetting?.color) {
      const colorClasses = getShiftColorClasses(shiftSetting.color);
      return `${colorClasses.bg} ${colorClasses.text}`;
    }

    // Fallback: try shiftColors from schedule API
    const shiftColor = shiftColors[keterangan];
    if (shiftColor) {
      const colorClasses = getShiftColorClasses(shiftColor);
      return `${colorClasses.bg} ${colorClasses.text}`;
    }

    // Final fallback to default colors matching manage-shift page
    switch (keterangan) {
      case 'PAGI':
        return 'bg-indigo-100 text-indigo-700';
      case 'MALAM':
        return 'bg-purple-100 text-purple-700';
      case 'PAGI_MALAM':
        return 'bg-amber-100 text-amber-700';
      case 'PIKET_PAGI':
        return 'bg-emerald-100 text-emerald-700';
      case 'PIKET_MALAM':
        return 'bg-cyan-100 text-cyan-700';
      case 'LIBUR':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getKeteranganShort = (keterangan: string) => {
    switch (keterangan) {
      case 'PAGI':
        return 'P';
      case 'MALAM':
        return 'M';
      case 'PIKET_PAGI':
        return 'PP';
      case 'PIKET_MALAM':
        return 'PM';
      case 'PAGI_MALAM':
        return 'P&M';
      case 'LIBUR':
        return 'L';
      default:
        return '-';
    }
  };

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString();
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  // Calculate period based on periodType and displayed month (currentStartDate)
  const getCurrentPeriod = (type: 'monthly' | '16-15' = '16-15') => {
    // Use the displayed month from the schedule table, not today
    const displayedYear = currentStartDate.getFullYear();
    const displayedMonth = currentStartDate.getMonth();
    let startDate: Date;
    let endDate: Date;

    if (type === 'monthly') {
      // Bulanan: 1st to last day of displayed month
      startDate = new Date(displayedYear, displayedMonth, 1);
      endDate = new Date(displayedYear, displayedMonth + 1, 0);
    } else {
      // 16-15: 16th of previous month to 15th of displayed month
      startDate = new Date(displayedYear, displayedMonth - 1, 16);
      endDate = new Date(displayedYear, displayedMonth, 15);
    }
    return { startDate, endDate };
  };

  const { startDate: periodStart, endDate: periodEnd } =
    getCurrentPeriod(periodType);

  // Helper to format date to YYYY-MM-DD string
  const toDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const periodStartStr = toDateStr(periodStart);
  const periodEndStr = toDateStr(periodEnd);

  const getPeriodLabel = () => {
    const startMonth = periodStart.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
    const endMonth = periodEnd.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${startMonth} - ${endMonth}`;
  };

  const myMonthSchedules = scheduleEntries.filter((s) => {
    if (!currentUser || s.memberId !== currentUser.id) return false;
    // Extract date portion from ISO string (first 10 chars: YYYY-MM-DD)
    const scheduleDateStr = s.tanggal.substring(0, 10);
    // Filter by custom period using string comparison (YYYY-MM-DD format sorts correctly)
    return scheduleDateStr >= periodStartStr && scheduleDateStr <= periodEndStr;
  });

  const myScheduleSummary = {
    PAGI: myMonthSchedules.filter((s) => s.keterangan === 'PAGI').length,
    MALAM: myMonthSchedules.filter((s) => s.keterangan === 'MALAM').length,
    PAGI_MALAM: myMonthSchedules.filter((s) => s.keterangan === 'PAGI_MALAM')
      .length,
    PIKET_PAGI: myMonthSchedules.filter((s) => s.keterangan === 'PIKET_PAGI')
      .length,
    PIKET_MALAM: myMonthSchedules.filter((s) => s.keterangan === 'PIKET_MALAM')
      .length,
    LIBUR: myMonthSchedules.filter((s) => s.keterangan === 'LIBUR').length,
  };

  // Calculate target: 21 working days (P, M, PP, PM, P&M - excluding L/Libur)
  const myWorkingDays = myMonthSchedules.filter(
    (s) => s.keterangan !== 'LIBUR'
  ).length;
  const targetDays = 21;
  const progressPercent = Math.min((myWorkingDays / targetDays) * 100, 100);
  const daysRemaining = Math.max(targetDays - myWorkingDays, 0);

  // Dynamic period label
  const periodLabel =
    periodType === 'monthly'
      ? periodStart.toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        })
      : `${periodStart.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        })} - ${periodEnd.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`;

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Jadwal'
        description='Lihat jadwal kerja anggota tim'
        icon={CalendarDays}
        actions={
          <button
            onClick={() => {
              setShowMySchedule(!showMySchedule);
              if (!showMySchedule) setSelectedMemberId('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showMySchedule
                ? 'bg-white text-[#E57373]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {showMySchedule ? (
              <User className='w-4 h-4' />
            ) : (
              <Users className='w-4 h-4' />
            )}
            {showMySchedule ? 'Jadwal Saya' : 'Semua Jadwal'}
          </button>
        }
      />

      {/* My Schedule Summary */}
      {showMySchedule && currentUser && (
        <Card className='bg-linear-to-r from-[#E57373] to-[#C62828] text-white'>
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
      )}

      {/* My Schedule Summary - Shift counts in cards (only when showMySchedule) */}
      {/* Colors are dynamic based on shift settings from manage-shift */}
      {showMySchedule && currentUser && (
        <div className='grid grid-cols-3 sm:grid-cols-6 gap-3'>
          {[
            {
              shiftType: 'PAGI',
              key: 'PAGI',
              label: 'Pagi',
              defaultColor: 'indigo',
            },
            {
              shiftType: 'MALAM',
              key: 'MALAM',
              label: 'Malam',
              defaultColor: 'purple',
            },
            {
              shiftType: 'PAGI_MALAM',
              key: 'PAGI_MALAM',
              label: 'Pagi Malam',
              defaultColor: 'amber',
            },
            {
              shiftType: 'PIKET_PAGI',
              key: 'PIKET_PAGI',
              label: 'Piket Pagi',
              defaultColor: 'emerald',
            },
            {
              shiftType: 'PIKET_MALAM',
              key: 'PIKET_MALAM',
              label: 'Piket Malam',
              defaultColor: 'cyan',
            },
            {
              shiftType: 'LIBUR',
              key: 'LIBUR',
              label: 'Libur',
              defaultColor: 'red',
            },
          ].map((item) => {
            // Get color from shift settings, fallback to default
            const shiftSetting = shiftSettings.find(
              (s) => s.shiftType === item.shiftType
            );
            const color = shiftSetting?.color || item.defaultColor;
            const colorClasses = getShiftColorClasses(color);
            const count =
              myScheduleSummary[item.key as keyof typeof myScheduleSummary];
            return (
              <Card key={item.key} className='text-center py-3'>
                <div
                  className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center mx-auto mb-1`}
                >
                  <span className={`text-lg font-bold ${colorClasses.text}`}>
                    {count}
                  </span>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                  {item.label}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend - Dynamic cards from shift settings (hidden when showing my schedule) */}
      {!showMySchedule && (
        <div className='grid grid-cols-3 sm:grid-cols-6 gap-3'>
          {(shiftSettings.length > 0
            ? shiftSettings
            : [
                { shiftType: 'PAGI', name: 'Pagi', color: 'indigo' },
                { shiftType: 'MALAM', name: 'Malam', color: 'purple' },
                {
                  shiftType: 'PIKET_PAGI',
                  name: 'Piket Pagi',
                  color: 'emerald',
                },
                {
                  shiftType: 'PIKET_MALAM',
                  name: 'Piket Malam',
                  color: 'cyan',
                },
                { shiftType: 'PAGI_MALAM', name: 'Pagi Malam', color: 'amber' },
                { shiftType: 'LIBUR', name: 'Libur', color: 'red' },
              ]
          ).map((shift) => {
            const colorClasses = getShiftColorClasses(shift.color);
            return (
              <Card key={shift.shiftType} className='text-center py-3'>
                <div
                  className={`w-8 h-8 rounded-lg ${colorClasses.bg} flex items-center justify-center mx-auto mb-1`}
                >
                  <span className={`text-xs font-bold ${colorClasses.text}`}>
                    {getKeteranganShort(shift.shiftType)}
                  </span>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                  {shift.name}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Card */}
      <Card>
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={prevMonth}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
          >
            <ChevronLeft className='w-5 h-5 text-gray-600 dark:text-gray-300' />
          </button>
          <div className='text-center'>
            <p className='font-semibold text-gray-800 dark:text-white text-lg'>
              {getMonthLabel()}
            </p>
            <button
              onClick={goToToday}
              className='text-xs text-[#E57373] hover:underline'
            >
              Hari Ini
            </button>
          </div>
          <button
            onClick={nextMonth}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
          >
            <ChevronRight className='w-5 h-5 text-gray-600 dark:text-gray-300' />
          </button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-200 dark:border-gray-700'>
                <th className='text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800 min-w-[120px]'>
                  Member
                </th>
                {monthDates.map((date, index) => (
                  <th
                    key={index}
                    className={`text-center py-2 px-0.5 text-xs min-w-[32px] ${
                      isToday(date)
                        ? 'text-[#E57373] font-bold'
                        : isWeekend(date)
                        ? 'text-red-400 font-medium'
                        : 'text-gray-500 font-medium'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                        isToday(date) ? 'bg-[#E57373] text-white' : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={monthDates.length + 1}
                    className='py-12 text-center text-gray-500 dark:text-gray-400'
                  >
                    Tidak ada member ditemukan
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className='border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  >
                    <td className='py-2 px-2 sticky left-0 bg-white dark:bg-gray-800'>
                      <div className='flex items-center gap-2'>
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className='w-8 h-8 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-8 h-8 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                            <span className='text-xs font-bold text-white'>
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className='text-sm font-medium text-gray-800 dark:text-gray-200 truncate'>
                          {member.nickname || member.name}
                        </p>
                      </div>
                    </td>
                    {monthDates.map((date, index) => {
                      const schedule = getScheduleForMember(member.id, date);
                      return (
                        <td key={index} className='text-center py-1 px-0.5'>
                          {schedule ? (
                            <span
                              className={`inline-flex w-6 h-6 items-center justify-center rounded text-[10px] font-bold ${getKeteranganStyle(
                                schedule.keterangan
                              )}`}
                              title={schedule.keterangan}
                            >
                              {getKeteranganShort(schedule.keterangan)}
                            </span>
                          ) : (
                            <span className='inline-flex w-6 h-6 items-center justify-center rounded text-[10px] text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-700'>
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
