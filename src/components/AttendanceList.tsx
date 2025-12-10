'use client';

import { Avatar, AvatarGroup } from './ui/Avatar';
import { WorkModelBadge } from './ui/Table';
import { attendanceRecords } from '@/data/dummy';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

export function AttendanceList() {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords
    .filter(
      (r) =>
        r.tanggal === today ||
        attendanceRecords.filter((ar) => ar.tanggal === today).length === 0
    )
    .slice(0, 7);

  const presentMembers = todayRecords.map((r) => ({
    name: r.memberName,
    src: r.memberImg,
  }));

  // Find earliest and latest check-in
  const sortedByTime = [...todayRecords].sort((a, b) =>
    a.jamAbsen.localeCompare(b.jamAbsen)
  );
  const earliestRecord = sortedByTime[0];
  const latestRecord = sortedByTime[sortedByTime.length - 1];

  return (
    <div className='bg-white rounded-2xl p-4 sm:p-6 card-shadow transition-all duration-300 hover:shadow-lg h-full flex flex-col'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3'>
        <div>
          <h3 className='text-lg font-semibold text-gray-800'>
            Daftar Kehadiran
          </h3>
          <p className='text-sm text-gray-500'>Kehadiran tim hari ini</p>
        </div>
        {presentMembers.length > 0 && (
          <AvatarGroup avatars={presentMembers} max={5} size='sm' />
        )}
      </div>

      {/* Most Early & Most Late Highlight */}
      {todayRecords.length > 1 && (
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <div className='p-3 rounded-xl bg-emerald-50 border border-emerald-100'>
            <div className='flex items-center gap-2 mb-2'>
              <TrendingUp className='w-4 h-4 text-emerald-600' />
              <span className='text-xs font-medium text-emerald-700'>
                Paling Awal
              </span>
            </div>
            <p className='text-sm font-semibold text-gray-800 truncate'>
              {earliestRecord?.memberName.split(' ')[0]}
            </p>
            <div className='flex items-center gap-1 mt-1'>
              <Clock className='w-3 h-3 text-emerald-600' />
              <span className='text-xs font-bold text-emerald-600'>
                {earliestRecord?.jamAbsen}
              </span>
            </div>
          </div>
          <div className='p-3 rounded-xl bg-amber-50 border border-amber-100'>
            <div className='flex items-center gap-2 mb-2'>
              <TrendingDown className='w-4 h-4 text-amber-600' />
              <span className='text-xs font-medium text-amber-700'>
                Paling Akhir
              </span>
            </div>
            <p className='text-sm font-semibold text-gray-800 truncate'>
              {latestRecord?.memberName.split(' ')[0]}
            </p>
            <div className='flex items-center gap-1 mt-1'>
              <Clock className='w-3 h-3 text-amber-600' />
              <span className='text-xs font-bold text-amber-600'>
                {latestRecord?.jamAbsen}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Work Model Stats */}
      {todayRecords.length > 0 && (
        <div className='grid grid-cols-5 gap-2 mb-4'>
          <div className='p-3 rounded-xl bg-blue-50 border border-blue-100 text-center'>
            <p className='text-xs font-medium text-blue-600'>Pagi</p>
            <p className='text-xl font-bold text-blue-700'>
              {todayRecords.filter((r) => r.keterangan === 'Pagi').length}
            </p>
          </div>
          <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 text-center'>
            <p className='text-xs font-medium text-gray-600'>Malam</p>
            <p className='text-xl font-bold text-gray-700'>
              {todayRecords.filter((r) => r.keterangan === 'Malam').length}
            </p>
          </div>
          <div className='p-3 rounded-xl bg-green-50 border border-green-100 text-center'>
            <p className='text-xs font-medium text-green-600'>Piket P</p>
            <p className='text-xl font-bold text-green-700'>
              {todayRecords.filter((r) => r.keterangan === 'Piket Pagi').length}
            </p>
          </div>
          <div className='p-3 rounded-xl bg-purple-50 border border-purple-100 text-center'>
            <p className='text-xs font-medium text-purple-600'>Piket M</p>
            <p className='text-xl font-bold text-purple-700'>
              {
                todayRecords.filter((r) => r.keterangan === 'Piket Malam')
                  .length
              }
            </p>
          </div>
          <div className='p-3 rounded-xl bg-red-100 border border-red-200 text-center'>
            <p className='text-xs font-medium text-red-600'>Libur</p>
            <p className='text-xl font-bold text-red-700'>
              {todayRecords.filter((r) => r.keterangan === 'Libur').length}
            </p>
          </div>
        </div>
      )}

      <div className='space-y-2 flex-1 overflow-auto'>
        {todayRecords.length === 0 ? (
          <p className='text-center text-gray-500 py-4'>
            Tidak ada data kehadiran
          </p>
        ) : (
          todayRecords.map((record, index) => (
            <div
              key={record.id}
              className='flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer animate-fade-in'
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <Avatar
                src={record.memberImg}
                name={record.memberName}
                size='md'
              />
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-800 truncate'>
                  {record.memberName}
                </p>
                <p className='text-xs text-gray-500'>{record.position}</p>
              </div>
              <div className='text-right flex flex-col items-end gap-1'>
                <WorkModelBadge model={record.keterangan} />
                <span className='text-xs text-gray-400'>{record.jamAbsen}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button className='w-full mt-4 py-2 text-sm font-medium text-[#E57373] hover:bg-[#FFF0F0] rounded-lg transition-all duration-200 hover:scale-[1.01]'>
        Lihat Semua →
      </button>
    </div>
  );
}
