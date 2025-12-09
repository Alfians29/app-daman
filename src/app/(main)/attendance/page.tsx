'use client';

import { useState } from 'react';
import { Users, Clock } from 'lucide-react';
import { Card, SummaryCard } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { Table, WorkModelBadge } from '@/components/ui/Table';
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar';
import { FilterButton } from '@/components/ui/Button';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { attendanceRecords, teamMembers, AttendanceRecord } from '@/data/dummy';

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'1bulan' | '6bulan' | '1tahun'>(
    '1tahun'
  );

  // Calculate statistics
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.tanggal === today);
  const presentToday = todayRecords.length;
  const totalMembers = teamMembers.length;

  // Work model counts
  const workModelCounts = {
    Pagi: attendanceRecords.filter((r) => r.keterangan === 'Pagi').length,
    Malam: attendanceRecords.filter((r) => r.keterangan === 'Malam').length,
    'Piket Pagi': attendanceRecords.filter((r) => r.keterangan === 'Piket Pagi')
      .length,
    'Piket Malam': attendanceRecords.filter(
      (r) => r.keterangan === 'Piket Malam'
    ).length,
    Libur: attendanceRecords.filter((r) => r.keterangan === 'Libur').length,
  };

  // Attendance percentage (minimum 22 days)
  const attendancePercentage = Math.min(
    (presentToday / totalMembers) * 100,
    100
  );
  const monthlyAttendance =
    (attendanceRecords.length / (totalMembers * 22)) * 100;

  // Filter records
  const filteredRecords = attendanceRecords
    .filter(
      (record) =>
        record.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 20);

  const columns = [
    {
      key: 'member',
      header: 'Anggota',
      render: (record: AttendanceRecord) => (
        <div className='flex items-center gap-3'>
          <Avatar src={record.memberImg} name={record.memberName} size='sm' />
          <div>
            <p className='font-medium text-gray-800'>{record.memberName}</p>
            <p className='text-xs text-gray-500'>{record.position}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (record: AttendanceRecord) => (
        <span className='text-gray-700'>
          {new Date(record.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'jamAbsen',
      header: 'Jam Absen',
      render: (record: AttendanceRecord) => (
        <span className='text-gray-700'>{record.jamAbsen}</span>
      ),
    },
    {
      key: 'workModel',
      header: 'Keterangan',
      render: (record: AttendanceRecord) => (
        <WorkModelBadge model={record.keterangan} />
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Absensi</h1>
        <p className='text-gray-500'>Kelola kehadiran anggota tim</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <SummaryCard
          title='Total Anggota'
          value={totalMembers}
          subtitle={`${presentToday} hadir hari ini`}
          icon={<Users className='w-6 h-6' />}
          color='red'
        />
        <Card className='relative overflow-hidden'>
          <p className='text-sm font-medium text-gray-500 mb-2'>Kehadiran</p>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-2xl font-bold text-gray-800'>
                {presentToday}/{totalMembers}
              </p>
              <div className='mt-2 space-y-1 text-xs text-gray-500'>
                <p>Pagi: {workModelCounts['Pagi']}</p>
                <p>Malam: {workModelCounts['Malam']}</p>
                <p>
                  Piket:{' '}
                  {workModelCounts['Piket Pagi'] +
                    workModelCounts['Piket Malam']}
                </p>
              </div>
            </div>
            <CircularProgress value={monthlyAttendance} size={80} />
          </div>
        </Card>
        <SummaryCard
          title='Model Kerja'
          value='5 Jenis'
          subtitle='Pagi, Malam, Shift, Libur'
          icon={<Clock className='w-6 h-6' />}
          color='blue'
        />
        <Card>
          <p className='text-sm font-medium text-gray-500 mb-2'>
            Persentase Kehadiran
          </p>
          <p className='text-xl font-bold text-gray-800 mb-2'>Min. 22 Hari</p>
          <ProgressBar value={monthlyAttendance} max={100} color='green' />
          <p className='text-xs text-gray-500 mt-2'>
            Target kehadiran bulanan tercapai
          </p>
        </Card>
      </div>

      {/* Attendance Summary Chart */}
      <Card>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
          <div>
            <h3 className='text-lg font-semibold text-gray-800'>
              Ringkasan Kehadiran
            </h3>
            <p className='text-sm text-gray-500'>Statistik kehadiran tim</p>
          </div>
          <div className='flex gap-2'>
            <FilterButton
              active={period === '1bulan'}
              onClick={() => setPeriod('1bulan')}
            >
              1 Bulan
            </FilterButton>
            <FilterButton
              active={period === '6bulan'}
              onClick={() => setPeriod('6bulan')}
            >
              6 Bulan
            </FilterButton>
            <FilterButton
              active={period === '1tahun'}
              onClick={() => setPeriod('1tahun')}
            >
              1 Tahun
            </FilterButton>
          </div>
        </div>
        <AttendanceChart period={period} />
      </Card>

      {/* Search and Filter */}
      <SearchBar
        placeholder='Cari anggota...'
        value={searchQuery}
        onChange={setSearchQuery}
        showFilters
      />

      {/* Attendance Table */}
      <Card>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          Daftar Kehadiran Anggota
        </h3>
        <Table
          columns={columns}
          data={filteredRecords}
          keyExtractor={(record) => record.id}
          emptyMessage='Tidak ada data kehadiran'
        />
      </Card>
    </div>
  );
}
