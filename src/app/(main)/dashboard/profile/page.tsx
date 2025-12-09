'use client';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { teamMembers, attendanceRecords } from '@/data/dummy';
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Edit,
  Key,
  Bell,
  Shield,
} from 'lucide-react';

export default function ProfilePage() {
  // Using first team member as the logged-in user
  const user = teamMembers[0];

  // Calculate user stats
  const userAttendance = attendanceRecords.filter(
    (r) => r.memberId === user.id
  );
  const presentDays = userAttendance.filter((r) => r.status === 'Hadir').length;
  const attendanceRate =
    userAttendance.length > 0
      ? Math.round((presentDays / userAttendance.length) * 100)
      : 0;

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Profil</h1>
        <p className='text-gray-500'>Kelola informasi profil Anda</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Profile Card */}
        <div className='lg:col-span-1'>
          <Card className='text-center'>
            <div className='flex justify-center mb-4'>
              <div className='relative'>
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size='xl'
                  className='w-24 h-24'
                />
                <button className='absolute bottom-0 right-0 w-8 h-8 bg-[#E57373] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#EF5350] transition-colors'>
                  <Edit className='w-4 h-4' />
                </button>
              </div>
            </div>

            <h2 className='text-xl font-bold text-gray-800'>{user.name}</h2>
            <p className='text-[#E57373] font-medium'>{user.position}</p>
            <p className='text-sm text-gray-500 font-mono mt-1'>{user.nip}</p>

            <div className='mt-4'>
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm'>
                <Building className='w-4 h-4' />
                {user.department}
              </span>
            </div>

            {/* Stats */}
            <div className='mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-gray-800'>
                  {presentDays}
                </p>
                <p className='text-xs text-gray-500'>Hari Hadir</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-[#E57373]'>
                  {attendanceRate}%
                </p>
                <p className='text-xs text-gray-500'>Kehadiran</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Personal Information */}
          <Card>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Informasi Pribadi
              </h3>
              <Button
                variant='outline'
                size='sm'
                icon={<Edit className='w-4 h-4' />}
              >
                Edit
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='text-sm text-gray-500'>Nama Lengkap</label>
                <p className='font-medium text-gray-800'>{user.name}</p>
              </div>
              <div>
                <label className='text-sm text-gray-500'>NIP</label>
                <p className='font-medium text-gray-800 font-mono'>
                  {user.nip}
                </p>
              </div>
              <div>
                <label className='text-sm text-gray-500'>Email</label>
                <div className='flex items-center gap-2'>
                  <Mail className='w-4 h-4 text-gray-400' />
                  <p className='font-medium text-gray-800'>{user.email}</p>
                </div>
              </div>
              <div>
                <label className='text-sm text-gray-500'>Telepon</label>
                <div className='flex items-center gap-2'>
                  <Phone className='w-4 h-4 text-gray-400' />
                  <p className='font-medium text-gray-800'>{user.phone}</p>
                </div>
              </div>
              <div>
                <label className='text-sm text-gray-500'>Jabatan</label>
                <p className='font-medium text-gray-800'>{user.position}</p>
              </div>
              <div>
                <label className='text-sm text-gray-500'>Departemen</label>
                <p className='font-medium text-gray-800'>{user.department}</p>
              </div>
              <div>
                <label className='text-sm text-gray-500'>
                  Tanggal Bergabung
                </label>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4 text-gray-400' />
                  <p className='font-medium text-gray-800'>
                    {new Date(user.joinDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card>
            <h3 className='text-lg font-semibold text-gray-800 mb-6'>
              Pengaturan Keamanan
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-[#FFF0F0] flex items-center justify-center'>
                    <Key className='w-5 h-5 text-[#E57373]' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>Ubah Password</p>
                    <p className='text-sm text-gray-500'>
                      Terakhir diubah 30 hari yang lalu
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='sm'>
                  Ubah
                </Button>
              </div>

              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center'>
                    <Bell className='w-5 h-5 text-blue-500' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>Notifikasi</p>
                    <p className='text-sm text-gray-500'>
                      Kelola preferensi notifikasi
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='sm'>
                  Atur
                </Button>
              </div>

              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center'>
                    <Shield className='w-5 h-5 text-emerald-500' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>
                      Autentikasi Dua Faktor
                    </p>
                    <p className='text-sm text-gray-500'>Nonaktif</p>
                  </div>
                </div>
                <Button variant='ghost' size='sm'>
                  Aktifkan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
