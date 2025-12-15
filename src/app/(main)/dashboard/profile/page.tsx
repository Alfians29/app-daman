'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Form';
import {
  teamMembers,
  attendanceRecords,
  scheduleEntries,
  recentActivities,
} from '@/data/dummy';
import {
  Mail,
  Phone,
  Edit,
  Key,
  Camera,
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
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

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
        return { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Moon };
      case 'Piket Pagi':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Sun };
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
      {/* Page Header with Gradient */}
      <div className='relative overflow-hidden rounded-2xl bg-linear-to-r from-[#E57373] to-[#EF5350] p-6 text-white'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2' />
        <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2' />

        <div className='relative flex items-center gap-4'>
          <Sparkles className='w-8 h-8' />
          <div>
            <h1 className='text-2xl font-bold'>Profil Saya</h1>
            <p className='text-white/80 text-sm'>
              Kelola informasi dan pengaturan akun Anda
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Profile Card */}
        <div className='space-y-6'>
          {/* Profile Card with Gradient Border */}
          <div className='relative'>
            <div className='absolute -inset-0.5 bg-linear-to-r from-[#E57373] to-[#EF5350] rounded-2xl opacity-75 blur' />
            <Card className='relative'>
              <div className='text-center'>
                {/* Avatar with Badge */}
                <div className='relative inline-block mb-4'>
                  <div className='relative'>
                    <Avatar
                      src={currentUser.image}
                      name={currentUser.name}
                      size='xl'
                      className='w-28 h-28 ring-4 ring-white shadow-xl'
                    />
                    <button
                      onClick={() => setShowAvatarModal(true)}
                      className='absolute bottom-1 right-1 w-8 h-8 bg-[#E57373] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#EF5350] transition-all hover:scale-110'
                    >
                      <Camera className='w-4 h-4' />
                    </button>
                  </div>
                  {/* Online indicator */}
                  <span className='absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full' />
                </div>

                <h2 className='text-xl font-bold text-gray-800 dark:text-white'>
                  {currentUser.name}
                </h2>
                <p className='text-gray-500 dark:text-gray-400'>
                  @{currentUser.username}
                </p>

                {/* Position Badge */}
                <div className='mt-3 inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-[#E57373]/10 to-[#EF5350]/10 text-[#E57373] rounded-full font-medium'>
                  <Award className='w-4 h-4' />
                  {currentUser.position}
                </div>

                <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                  {currentUser.department}
                </p>

                <button
                  onClick={() => setShowEditModal(true)}
                  className='mt-4 w-full px-4 py-2.5 bg-linear-to-r from-[#E57373] to-[#EF5350] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-200/50 transition-all flex items-center justify-center gap-2'
                >
                  <Edit className='w-4 h-4' />
                  Edit Profil
                </button>
              </div>
            </Card>
          </div>

          {/* Stats Cards - Compact Grid */}
          <div className='grid grid-cols-2 gap-3'>
            <Card className='text-center bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-100 dark:border-blue-800/50'>
              <div className='flex items-center justify-center gap-2 mb-1'>
                <TrendingUp className='w-4 h-4 text-blue-500 dark:text-blue-400' />
                <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {totalAttendance}
                </p>
              </div>
              <p className='text-xs text-blue-600/70 dark:text-blue-400/70'>
                Total Absen
              </p>
            </Card>
            <Card className='text-center bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-100 dark:border-emerald-800/50'>
              <div className='flex items-center justify-center gap-2 mb-1'>
                <CheckCircle className='w-4 h-4 text-emerald-500 dark:text-emerald-400' />
                <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                  {ontimeRate}%
                </p>
              </div>
              <p className='text-xs text-emerald-600/70 dark:text-emerald-400/70'>
                Ketepatan
              </p>
            </Card>
            <Card className='text-center bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-100 dark:border-emerald-800/50'>
              <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {ontimeCount}
              </p>
              <p className='text-xs text-emerald-600/70 dark:text-emerald-400/70'>
                Tepat Waktu
              </p>
            </Card>
            <Card className='text-center bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-100 dark:border-amber-800/50'>
              <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                {lateCount}
              </p>
              <p className='text-xs text-amber-600/70 dark:text-amber-400/70'>
                Terlambat
              </p>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <div className='flex items-center gap-2 mb-3'>
              <Calendar className='w-5 h-5 text-[#E57373]' />
              <h3 className='font-semibold text-gray-800 dark:text-white'>
                Jadwal Hari Ini
              </h3>
            </div>
            {todaySchedule ? (
              <div className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800'>
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
                        <p className='font-semibold text-gray-800 dark:text-white'>
                          {todaySchedule.keterangan}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className='flex items-center gap-3 p-3 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl'>
                <Calendar className='w-6 h-6' />
                <p>Tidak ada jadwal</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Personal Information + Change Password */}
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-[#E57373]/10 flex items-center justify-center'>
                  <Mail className='w-4 h-4 text-[#E57373]' />
                </div>
                <h3 className='font-semibold text-gray-800 dark:text-white'>
                  Informasi Pribadi
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className='text-sm text-[#E57373] hover:underline flex items-center gap-1'
              >
                <Edit className='w-3 h-3' />
                Edit
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* NIK */}
              <div className='flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
                <div className='w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-200'>
                  NIK
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    NIK
                  </p>
                  <p className='font-medium text-gray-800 dark:text-white font-mono'>
                    {currentUser.nik}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className='flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
                <div className='w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200'>
                  <Mail className='w-5 h-5 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Email
                  </p>
                  <p className='font-medium text-gray-800 dark:text-white truncate'>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className='flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
                <div className='w-10 h-10 bg-linear-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200'>
                  <Phone className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Telepon
                  </p>
                  <p className='font-medium text-gray-800 dark:text-white'>
                    {currentUser.phone}
                  </p>
                </div>
              </div>

              {/* Telegram */}
              <div className='flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
                <div className='w-10 h-10 bg-linear-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-200'>
                  <AtSign className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Telegram
                  </p>
                  <p className='font-medium text-gray-800 dark:text-white'>
                    {currentUser.usernameTelegram}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className='border-t border-gray-100 dark:border-gray-700 my-4' />

            {/* Change Password Button */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className='w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors group'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-linear-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200'>
                  <Key className='w-5 h-5 text-white' />
                </div>
                <div className='text-left'>
                  <p className='font-medium text-gray-800 dark:text-white'>
                    Ubah Password
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Terakhir diubah 30 hari yang lalu
                  </p>
                </div>
              </div>
              <ChevronRight className='w-5 h-5 text-[#E57373] group-hover:translate-x-1 transition-transform' />
            </button>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center'>
                <Activity className='w-4 h-4 text-purple-600' />
              </div>
              <h3 className='font-semibold text-gray-800 dark:text-white'>
                Aktivitas Terakhir
              </h3>
            </div>

            {userActivities.length > 0 ? (
              <div className='space-y-3'>
                {userActivities.map((activity, index) => (
                  <div
                    key={index}
                    className='flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'create'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : activity.type === 'update'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : activity.type === 'login'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      {activity.type === 'create' ? (
                        <CheckCircle className='w-5 h-5 text-emerald-600' />
                      ) : activity.type === 'login' ? (
                        <Check className='w-5 h-5 text-purple-600' />
                      ) : (
                        <AlertCircle className='w-5 h-5 text-blue-600' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm text-gray-800 dark:text-white'>
                        <span className='font-medium'>{activity.action}</span>{' '}
                        <span className='text-gray-500 dark:text-gray-400'>
                          {activity.target}
                        </span>
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5'>
                        <Clock className='w-3 h-3' />
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Activity className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2' />
                <p className='text-gray-500 dark:text-gray-400'>
                  Belum ada aktivitas
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        size='md'
      >
        <ModalHeader
          title='Edit Profil'
          onClose={() => setShowEditModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Input
              label='Nama Lengkap'
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <Input
              label='Nama Panggilan'
              value={editForm.nickname}
              onChange={(e) =>
                setEditForm({ ...editForm, nickname: e.target.value })
              }
            />

            <Input
              label='Email'
              type='email'
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />

            <Input
              label='Telepon'
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />

            <Input
              label='Username Telegram'
              value={editForm.usernameTelegram}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  usernameTelegram: e.target.value,
                })
              }
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowEditModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={handleEditProfile} className='flex-1'>
            Simpan
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        size='md'
      >
        <ModalHeader
          title='Ubah Password'
          onClose={() => setShowPasswordModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  className='w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373] bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
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
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  className='w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373] bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
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
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                  className='w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373] bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
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
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowPasswordModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={
              !passwordForm.currentPassword || !passwordForm.newPassword
            }
            className='flex-1'
          >
            Ubah Password
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upload Avatar Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        size='sm'
      >
        <ModalHeader
          title='Ubah Foto Profil'
          onClose={() => setShowAvatarModal(false)}
        />
        <ModalBody>
          <div className='text-center'>
            <div className='w-32 h-32 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600'>
              <Camera className='w-8 h-8 text-gray-400' />
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              Pilih foto dari galeri atau ambil foto baru
            </p>

            <div className='space-y-3'>
              <Button onClick={handleUploadAvatar} className='w-full'>
                <Upload className='w-4 h-4 mr-2' />
                Pilih dari Galeri
              </Button>
              <Button variant='secondary' className='w-full'>
                <Camera className='w-4 h-4 mr-2' />
                Ambil Foto
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowAvatarModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
