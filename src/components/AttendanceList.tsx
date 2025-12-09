'use client';

import { Avatar, AvatarGroup } from './ui/Avatar';
import { WorkModelBadge } from './ui/Table';
import { attendanceRecords } from '@/data/dummy';

export function AttendanceList() {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords
    .filter(
      (r) =>
        r.tanggal === today ||
        attendanceRecords.filter((ar) => ar.tanggal === today).length === 0
    )
    .slice(0, 8);

  const presentMembers = todayRecords.map((r) => ({
    name: r.memberName,
    src: r.memberImg,
  }));

  return (
    <div className='bg-white rounded-2xl p-4 sm:p-6 card-shadow transition-all duration-300 hover:shadow-lg h-full flex flex-col'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3'>
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
