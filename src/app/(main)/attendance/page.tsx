'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { attendanceAPI, usersAPI, scheduleAPI } from '@/lib/api';
import { useCurrentUser } from '@/components/AuthGuard';

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
  image: string | null;
  isActive: boolean;
};

type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

const getCurrentPeriod = () => {
  const today = new Date();
  const day = today.getDate();
  let startDate: Date;
  let endDate: Date;

  if (day >= 16) {
    startDate = new Date(today.getFullYear(), today.getMonth(), 16);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 16);
    endDate = new Date(today.getFullYear(), today.getMonth(), 15);
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

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, isLoading: authLoading } = useCurrentUser();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!authLoading && authUser) {
      loadData();
    }
  }, [authLoading, authUser]);

  const loadData = async () => {
    setIsLoading(true);
    const [attResult, usersResult, schedResult] = await Promise.all([
      attendanceAPI.getAll(),
      usersAPI.getAll(),
      scheduleAPI.getAll(),
    ]);

    if (attResult.success && attResult.data) {
      setAttendanceRecords(attResult.data as AttendanceRecord[]);
    }
    if (usersResult.success && usersResult.data) {
      const activeUsers = (usersResult.data as TeamMember[]).filter(
        (u: TeamMember) => u.isActive
      );
      setTeamMembers(activeUsers);
      // Find user matching authenticated session
      if (authUser?.id) {
        setCurrentUser(
          activeUsers.find((u: TeamMember) => u.id === authUser.id) ||
            activeUsers[0]
        );
      }
    }
    if (schedResult.success && schedResult.data) {
      setScheduleEntries(schedResult.data as Schedule[]);
    }
    setIsLoading(false);
  };

  const { startDate, endDate } = getCurrentPeriod();
  const periodLabel = `${startDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })} - ${endDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  const keteranganOptions = [
    {
      value: 'PAGI',
      label: 'Pagi',
      icon: Sun,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      value: 'MALAM',
      label: 'Malam',
      icon: Moon,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      value: 'PIKET_PAGI',
      label: 'Piket Pagi',
      icon: Sun,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      value: 'PIKET_MALAM',
      label: 'Piket Malam',
      icon: Moon,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      value: 'LIBUR',
      label: 'Libur',
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
    },
  ];

  const getKeteranganLabel = (value: string) =>
    keteranganOptions.find((k) => k.value === value)?.label || value;
  const getKeteranganStyle = (keterangan: string) =>
    keteranganOptions.find((k) => k.value === keterangan)?.color ||
    'bg-gray-100 text-gray-700';

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

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(
    (r) => r.tanggal.split('T')[0] === today
  );

  // My period stats
  const myPeriodRecords = attendanceRecords.filter((r) => {
    if (!currentUser || r.memberId !== currentUser.id) return false;
    const recordDate = new Date(r.tanggal);
    return recordDate >= startDate && recordDate <= endDate;
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
    const scheduleDate = new Date(s.tanggal);
    return scheduleDate >= startDate && scheduleDate <= endDate;
  });

  const myScheduleKeteranganCounts = {
    PAGI: myPeriodSchedules.filter((s) => s.keterangan === 'PAGI').length,
    MALAM: myPeriodSchedules.filter((s) => s.keterangan === 'MALAM').length,
    PIKET_PAGI: myPeriodSchedules.filter((s) => s.keterangan === 'PIKET_PAGI')
      .length,
    PIKET_MALAM: myPeriodSchedules.filter((s) => s.keterangan === 'PIKET_MALAM')
      .length,
    LIBUR: myPeriodSchedules.filter((s) => s.keterangan === 'LIBUR').length,
  };

  const myWorkingDays = myPeriodRecords.filter(
    (r) => r.keterangan !== 'LIBUR'
  ).length;
  const myLiburCount = myScheduleKeteranganCounts.LIBUR;
  const targetDays = 22;
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
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Absensi'
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
          <Card className='bg-gradient-to-r from-[#E57373] to-[#C62828] text-white'>
            <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
              <div className='flex items-center gap-4 flex-1'>
                <Avatar
                  src={currentUser.image || undefined}
                  name={currentUser.name}
                  size='lg'
                />
                <div>
                  <p className='font-semibold text-lg'>{currentUser.name}</p>
                  <p className='text-white/80 text-sm'>
                    {currentUser.position}
                  </p>
                  <p className='text-white/60 text-xs mt-1'>
                    Periode: {periodLabel}
                  </p>
                </div>
              </div>
              <div className='flex-1'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-sm'>Target Kehadiran</span>
                  <span className='text-sm font-bold'>
                    {myWorkingDays}/{targetDays} hari
                  </span>
                </div>
                <div className='h-3 bg-white/20 rounded-full overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressPercent >= 100 ? 'bg-emerald-400' : 'bg-white'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className='text-xs text-white/80 mt-1'>
                  {progressPercent >= 100
                    ? '✅ Target tercapai!'
                    : `${daysRemaining} hari lagi menuju target`}
                </p>
              </div>
            </div>
          </Card>

          <div className='grid grid-cols-2 lg:grid-cols-6 gap-3'>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-gray-800'>
                {myAllRecords.length}
              </p>
              <p className='text-xs text-gray-500'>Total Absen</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-emerald-600'>
                {ontimePercent}%
              </p>
              <p className='text-xs text-gray-500'>Tingkat Ketepatan</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-emerald-600'>
                {myOntimeCount}
              </p>
              <p className='text-xs text-gray-500'>Ontime</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-amber-600'>
                {myTelatCount}
              </p>
              <p className='text-xs text-gray-500'>Telat</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-gray-800'>
                {myWorkingDays}
              </p>
              <p className='text-xs text-gray-500'>Hari Kerja</p>
            </Card>
            <Card className='text-center py-4'>
              <p className='text-2xl font-bold text-gray-600'>{myLiburCount}</p>
              <p className='text-xs text-gray-500'>Libur</p>
            </Card>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
            {keteranganOptions.map((opt) => {
              const Icon = opt.icon;
              const count =
                myScheduleKeteranganCounts[
                  opt.value as keyof typeof myScheduleKeteranganCounts
                ] || 0;
              return (
                <Card key={opt.value} className='text-center py-3'>
                  <div
                    className={`w-8 h-8 rounded-lg ${opt.color} flex items-center justify-center mx-auto mb-1`}
                  >
                    <Icon className='w-4 h-4' />
                  </div>
                  <p className='text-lg font-bold text-gray-800'>{count}</p>
                  <p className='text-xs text-gray-500'>{opt.label}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!showMyHistory && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
                <Users className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <p className='text-xs text-blue-500'>Total Anggota</p>
                <p className='text-2xl font-bold text-blue-800'>
                  {teamMembers.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-emerald-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Hadir Hari Ini</p>
                <p className='text-2xl font-bold text-emerald-600'>
                  {todayRecords.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center'>
                <Clock className='w-6 h-6 text-amber-600' />
              </div>
              <div>
                <p className='text-xs text-gray-500'>Telat Hari Ini</p>
                <p className='text-2xl font-bold text-amber-600'>
                  {todayRecords.filter((r) => r.status === 'TELAT').length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center'>
                <XCircle className='w-6 h-6 text-red-600' />
              </div>
              <div>
                <p className='text-xs text-red-500'>Libur Hari Ini</p>
                <p className='text-2xl font-bold text-red-600'>
                  {todayRecords.filter((r) => r.keterangan === 'LIBUR').length}
                </p>
              </div>
            </div>
          </Card>
        </div>
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
            placeholder='Cari nama...'
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
            value={filterKeterangan}
            onChange={(e) => {
              setFilterKeterangan(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
          >
            <option value='all'>Semua Keterangan</option>
            {keteranganOptions.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilterChange();
            }}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
          >
            <option value='all'>Semua Status</option>
            <option value='ONTIME'>Ontime</option>
            <option value='TELAT'>Telat</option>
          </select>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-800'>
            {showMyHistory ? 'Progress Absensi Saya' : 'Daftar Kehadiran'}
          </h3>
          <span className='text-sm text-gray-500'>
            {filteredRecords.length} data
          </span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                {!showMyHistory && (
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                    Anggota
                  </th>
                )}
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Tanggal
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Jam Absen
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Keterangan
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={showMyHistory ? 4 : 5}
                    className='px-4 py-12 text-center text-gray-500'
                  >
                    <Calendar className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                    <p>Tidak ada data kehadiran</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className='hover:bg-gray-50'>
                    {!showMyHistory && (
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar
                            src={record.member?.image || undefined}
                            name={record.member?.name || ''}
                            size='sm'
                          />
                          <p className='font-medium text-gray-800 text-sm'>
                            {record.member?.name}
                          </p>
                        </div>
                      </td>
                    )}
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {new Date(record.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-gray-800'>
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
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
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
    </div>
  );
}
