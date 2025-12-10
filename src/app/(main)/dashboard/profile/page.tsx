'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '@/context/SettingsContext';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import {
  teamMembers,
  attendanceRecords,
  scheduleEntries,
  recentActivities,
} from '@/data/dummy';
import {
  Mail,
  Phone,
  Building,
  Edit,
  Key,
  Bell,
  Shield,
  Camera,
  X,
  Eye,
  EyeOff,
  Check,
  Clock,
  Calendar,
  Sun,
  Moon,
  AtSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Palette,
} from 'lucide-react';

// Simulated current user (logged in user)
const currentUser = teamMembers[1]; // Muhammad Alfian

export default function ProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: currentUser.name,
    nickname: currentUser.nickname,
    email: currentUser.email,
    phone: currentUser.phone,
    usernameTelegram: currentUser.usernameTelegram,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Settings context
  const { theme, toggleTheme } = useSettings();

  // Calculate user stats
  const userAttendance = attendanceRecords.filter(
    (r) => r.memberId === currentUser.id
  );
  const ontimeCount = userAttendance.filter(
    (r) => r.status === 'Ontime'
  ).length;
  const lateCount = userAttendance.filter((r) => r.status === 'Telat').length;
  const totalAttendance = userAttendance.length;
  const ontimeRate =
    totalAttendance > 0 ? Math.round((ontimeCount / totalAttendance) * 100) : 0;

  // Today's schedule
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = scheduleEntries.find(
    (s) => s.memberId === currentUser.id && s.tanggal === today
  );

  // User activities (simulated)
  const userActivities = recentActivities
    .filter(
      (a) =>
        a.user.includes(currentUser.nickname) || a.user === currentUser.name
    )
    .slice(0, 5);

  const handleEditProfile = () => {
    toast.success('Profil berhasil diperbarui!');
    setShowEditModal(false);
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru tidak cocok!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }
    toast.success('Password berhasil diubah!');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(false);
  };

  const handleUploadAvatar = () => {
    toast.success('Foto profil berhasil diperbarui!');
    setShowAvatarModal(false);
  };

  const getScheduleColor = (keterangan: string) => {
    switch (keterangan) {
      case 'Pagi':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Sun };
      case 'Malam':
        return { bg: 'bg-gray-200', text: 'text-gray-700', icon: Moon };
      case 'Piket Pagi':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: Sun };
      case 'Piket Malam':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: Moon };
      case 'Libur':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: Calendar };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500', icon: Calendar };
    }
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Profil</h1>
        <p className='text-gray-500 text-sm mt-1'>
          Kelola informasi profil Anda
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Profile & Stats */}
        <div className='space-y-6'>
          {/* Profile Card */}
          <Card className='text-center'>
            <div className='flex justify-center mb-4'>
              <div className='relative'>
                <Avatar
                  src={currentUser.image}
                  name={currentUser.name}
                  size='xl'
                  className='w-24 h-24'
                />
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className='absolute bottom-0 right-0 w-8 h-8 bg-[#E57373] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#EF5350] transition-colors'
                >
                  <Camera className='w-4 h-4' />
                </button>
              </div>
            </div>

            <h2 className='text-xl font-bold text-gray-800'>
              {currentUser.name}
            </h2>
            <p className='text-gray-500'>({currentUser.nickname})</p>
            <p className='text-[#E57373] font-medium mt-1'>
              {currentUser.position}
            </p>
            <p className='text-sm text-gray-500 font-mono mt-1'>
              @{currentUser.username}
            </p>

            <div className='mt-3'>
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm'>
                <Building className='w-4 h-4' />
                {currentUser.department}
              </span>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className='mt-4 w-full px-4 py-2 bg-[#E57373] text-white rounded-xl font-medium hover:bg-[#EF5350] transition-colors flex items-center justify-center gap-2'
            >
              <Edit className='w-4 h-4' />
              Edit Profil
            </button>
          </Card>

          {/* Stats Cards */}
          <div className='grid grid-cols-2 gap-3'>
            <Card className='text-center'>
              <p className='text-3xl font-bold text-gray-800'>
                {totalAttendance}
              </p>
              <p className='text-xs text-gray-500'>Total Absen</p>
            </Card>
            <Card className='text-center'>
              <p className='text-3xl font-bold text-emerald-600'>
                {ontimeRate}%
              </p>
              <p className='text-xs text-gray-500'>Tingkat Ketepatan</p>
            </Card>
            <Card className='text-center'>
              <p className='text-3xl font-bold text-green-600'>{ontimeCount}</p>
              <p className='text-xs text-gray-500'>Tepat Waktu</p>
            </Card>
            <Card className='text-center'>
              <p className='text-3xl font-bold text-amber-600'>{lateCount}</p>
              <p className='text-xs text-gray-500'>Terlambat</p>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <h3 className='font-semibold text-gray-800 mb-3'>
              Jadwal Hari Ini
            </h3>
            {todaySchedule ? (
              <div className='flex items-center gap-3'>
                {(() => {
                  const style = getScheduleColor(todaySchedule.keterangan);
                  const IconComponent = style.icon;
                  return (
                    <>
                      <div
                        className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}
                      >
                        <IconComponent className={`w-6 h-6 ${style.text}`} />
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          {todaySchedule.keterangan}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className='flex items-center gap-3 text-gray-500'>
                <div className='w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center'>
                  <Calendar className='w-6 h-6 text-gray-400' />
                </div>
                <p>Tidak ada jadwal</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Details & Settings */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Personal Information */}
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-800'>Informasi Pribadi</h3>
              <button
                onClick={() => setShowEditModal(true)}
                className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
              >
                <Edit className='w-3 h-3' />
                Edit
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <span className='text-xs font-bold text-blue-600'>NIK</span>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>NIK</p>
                  <p className='font-medium text-gray-800 font-mono'>
                    {currentUser.nik}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                <div className='w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center'>
                  <Mail className='w-5 h-5 text-emerald-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-gray-500'>Email</p>
                  <p className='font-medium text-gray-800 truncate'>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                <div className='w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center'>
                  <Phone className='w-5 h-5 text-amber-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Telepon</p>
                  <p className='font-medium text-gray-800'>
                    {currentUser.phone}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                <div className='w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center'>
                  <AtSign className='w-5 h-5 text-sky-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Telegram</p>
                  <p className='font-medium text-gray-800'>
                    {currentUser.usernameTelegram}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Security & Preferences */}
          <Card>
            <h3 className='font-semibold text-gray-800 mb-4'>
              Keamanan & Preferensi
            </h3>

            <div className='space-y-3'>
              {/* Ubah Password */}
              <div
                className='flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors'
                onClick={() => setShowPasswordModal(true)}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center'>
                    <Key className='w-5 h-5 text-red-500' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>Ubah Password</p>
                    <p className='text-sm text-gray-500'>
                      Terakhir diubah 30 hari yang lalu
                    </p>
                  </div>
                </div>
                <span className='text-[#E57373]'>→</span>
              </div>

              {/* Mode Gelap */}
              <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center'>
                    <Palette className='w-5 h-5 text-purple-500' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-800 dark:text-gray-200'>
                      Mode Gelap
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Tampilan lebih nyaman di malam hari
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-[#E57373]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className='flex items-center gap-2 mb-4'>
              <Activity className='w-5 h-5 text-gray-400' />
              <h3 className='font-semibold text-gray-800'>
                Aktivitas Terakhir
              </h3>
            </div>

            {userActivities.length > 0 ? (
              <div className='space-y-3'>
                {userActivities.map((activity, index) => (
                  <div key={index} className='flex items-start gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'create'
                          ? 'bg-emerald-100'
                          : activity.type === 'update'
                          ? 'bg-blue-100'
                          : activity.type === 'login'
                          ? 'bg-purple-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {activity.type === 'create' ? (
                        <CheckCircle className='w-4 h-4 text-emerald-600' />
                      ) : activity.type === 'login' ? (
                        <Check className='w-4 h-4 text-purple-600' />
                      ) : (
                        <AlertCircle className='w-4 h-4 text-blue-600' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-800'>
                        <span className='font-medium'>{activity.action}</span>{' '}
                        {activity.target}
                      </p>
                      <p className='text-xs text-gray-500 flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-4'>
                Belum ada aktivitas
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-md mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Edit Profil
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Lengkap
                </label>
                <input
                  type='text'
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Panggilan
                </label>
                <input
                  type='text'
                  value={editForm.nickname}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nickname: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Telepon
                </label>
                <input
                  type='text'
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Username Telegram
                </label>
                <input
                  type='text'
                  value={editForm.usernameTelegram}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      usernameTelegram: e.target.value,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowEditModal(false)}
                className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'
              >
                Batal
              </button>
              <button
                onClick={handleEditProfile}
                className='flex-1 px-4 py-2 bg-[#E57373] text-white rounded-xl font-medium hover:bg-[#EF5350] transition-colors'
              >
                Simpan
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-md mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Ubah Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Password Saat Ini
                </label>
                <div className='relative'>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                    placeholder='Masukkan password saat ini'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPasswords.current ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Password Baru
                </label>
                <div className='relative'>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                    placeholder='Minimal 6 karakter'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPasswords.new ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Konfirmasi Password Baru
                </label>
                <div className='relative'>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                    placeholder='Ketik ulang password baru'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
                {passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className='text-xs text-red-500 mt-1'>
                      Password tidak cocok
                    </p>
                  )}
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowPasswordModal(false)}
                className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  !passwordForm.currentPassword || !passwordForm.newPassword
                }
                className='flex-1 px-4 py-2 bg-[#E57373] text-white rounded-xl font-medium hover:bg-[#EF5350] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Ubah Password
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Avatar Modal */}
      {showAvatarModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-sm mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Ubah Foto Profil
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='text-center'>
              <div className='w-32 h-32 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300'>
                <Camera className='w-8 h-8 text-gray-400' />
              </div>
              <p className='text-sm text-gray-500 mb-4'>
                Pilih foto dari galeri atau ambil foto baru
              </p>

              <div className='space-y-3'>
                <button className='w-full px-4 py-2 bg-[#E57373] text-white rounded-xl font-medium hover:bg-[#EF5350] transition-colors'>
                  Pilih dari Galeri
                </button>
                <button className='w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'>
                  Ambil Foto
                </button>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className='w-full px-4 py-2 text-gray-500 hover:text-gray-700'
                >
                  Batal
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
