'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { usersAPI, scheduleAPI } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Filter,
  CalendarDays,
  Loader2,
} from 'lucide-react';

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  image: string | null;
  isActive: boolean;
};

type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

const CURRENT_USER_ID = 'user-2';

export default function SchedulePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMySchedule, setShowMySchedule] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [usersResult, schedResult] = await Promise.all([
      usersAPI.getAll(),
      scheduleAPI.getAll(),
    ]);

    if (usersResult.success && usersResult.data) {
      const activeUsers = usersResult.data.filter(
        (u: TeamMember) => u.isActive
      );
      setTeamMembers(activeUsers);
      setCurrentUser(
        activeUsers.find((u: TeamMember) => u.id === CURRENT_USER_ID) ||
          activeUsers[0]
      );
    }
    if (schedResult.success && schedResult.data) {
      setScheduleEntries(schedResult.data);
    }
    setIsLoading(false);
  };

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
    const dateStr = date.toISOString().split('T')[0];
    return scheduleEntries.find(
      (s) => s.memberId === memberId && s.tanggal.split('T')[0] === dateStr
    );
  };

  const getKeteranganStyle = (keterangan: string) => {
    switch (keterangan) {
      case 'PAGI':
        return 'bg-blue-100 text-blue-700';
      case 'MALAM':
        return 'bg-gray-200 text-gray-700';
      case 'PIKET_PAGI':
        return 'bg-emerald-100 text-emerald-700';
      case 'PIKET_MALAM':
        return 'bg-purple-100 text-purple-700';
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
      case 'LIBUR':
        return 'L';
      default:
        return '-';
    }
  };

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString();
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const myMonthSchedules = scheduleEntries.filter((s) => {
    if (!currentUser || s.memberId !== currentUser.id) return false;
    const scheduleDate = new Date(s.tanggal);
    return (
      scheduleDate.getMonth() === currentStartDate.getMonth() &&
      scheduleDate.getFullYear() === currentStartDate.getFullYear()
    );
  });

  const myScheduleSummary = {
    PAGI: myMonthSchedules.filter((s) => s.keterangan === 'PAGI').length,
    MALAM: myMonthSchedules.filter((s) => s.keterangan === 'MALAM').length,
    PIKET_PAGI: myMonthSchedules.filter((s) => s.keterangan === 'PIKET_PAGI')
      .length,
    PIKET_MALAM: myMonthSchedules.filter((s) => s.keterangan === 'PIKET_MALAM')
      .length,
    LIBUR: myMonthSchedules.filter((s) => s.keterangan === 'LIBUR').length,
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );
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
                <p className='text-white/60 text-xs mt-1'>
                  Jadwal {getMonthLabel()}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-3 sm:grid-cols-5 gap-3'>
              <div className='text-center'>
                <p className='text-xl font-bold'>{myScheduleSummary.PAGI}</p>
                <p className='text-xs text-white/80'>Pagi</p>
              </div>
              <div className='text-center'>
                <p className='text-xl font-bold'>{myScheduleSummary.MALAM}</p>
                <p className='text-xs text-white/80'>Malam</p>
              </div>
              <div className='text-center'>
                <p className='text-xl font-bold'>
                  {myScheduleSummary.PIKET_PAGI}
                </p>
                <p className='text-xs text-white/80'>PP</p>
              </div>
              <div className='text-center'>
                <p className='text-xl font-bold'>
                  {myScheduleSummary.PIKET_MALAM}
                </p>
                <p className='text-xs text-white/80'>PM</p>
              </div>
              <div className='text-center'>
                <p className='text-xl font-bold'>{myScheduleSummary.LIBUR}</p>
                <p className='text-xs text-white/80'>Libur</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 text-sm'>
          <span className='w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold'>
            P
          </span>
          <span className='text-gray-600'>Pagi</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='w-6 h-6 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold'>
            M
          </span>
          <span className='text-gray-600'>Malam</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold'>
            PP
          </span>
          <span className='text-gray-600'>Piket Pagi</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold'>
            PM
          </span>
          <span className='text-gray-600'>Piket Malam</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold'>
            L
          </span>
          <span className='text-gray-600'>Libur</span>
        </div>
      </div>

      {/* Filter */}
      {!showMySchedule && (
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-500'>Filter:</span>
          </div>
          <input
            type='text'
            placeholder='Cari nama member...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm'
          />
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
          >
            <option value='all'>Semua Member</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname || m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule Card */}
      <Card>
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={prevMonth}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ChevronLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div className='text-center'>
            <p className='font-semibold text-gray-800 text-lg'>
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
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ChevronRight className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-2 text-sm font-medium text-gray-500 sticky left-0 bg-white min-w-[120px]'>
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
                    className='py-12 text-center text-gray-500'
                  >
                    Tidak ada member ditemukan
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className='border-b border-gray-100 hover:bg-gray-50'
                  >
                    <td className='py-2 px-2 sticky left-0 bg-white'>
                      <div className='flex items-center gap-2'>
                        <Avatar
                          src={member.image}
                          name={member.name}
                          size='sm'
                        />
                        <p className='text-sm font-medium text-gray-800 truncate'>
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
                            <span className='inline-flex w-6 h-6 items-center justify-center rounded text-[10px] text-gray-300 bg-gray-50'>
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
