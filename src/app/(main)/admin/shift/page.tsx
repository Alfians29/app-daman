'use client';

import { useState } from 'react';
import {
  Plus,
  Clock,
  Save,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Coffee,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ============ SHIFT SETTINGS DATA ============
interface ShiftSetting {
  id: string;
  shiftType: string;
  name: string;
  startTime: string;
  endTime: string;
  lateAfter: string;
  isActive: boolean;
  color: string;
}

const initialShiftSettings: ShiftSetting[] = [
  {
    id: 'shift-1',
    shiftType: 'Pagi',
    name: 'Shift Pagi',
    startTime: '07:00',
    endTime: '15:00',
    lateAfter: '08:00',
    isActive: true,
    color: 'emerald',
  },
  {
    id: 'shift-2',
    shiftType: 'Malam',
    name: 'Shift Malam',
    startTime: '19:00',
    endTime: '07:00',
    lateAfter: '20:00',
    isActive: true,
    color: 'purple',
  },
  {
    id: 'shift-3',
    shiftType: 'Piket Pagi',
    name: 'Piket Pagi',
    startTime: '06:00',
    endTime: '14:00',
    lateAfter: '07:00',
    isActive: true,
    color: 'amber',
  },
  {
    id: 'shift-4',
    shiftType: 'Piket Malam',
    name: 'Piket Malam',
    startTime: '18:00',
    endTime: '06:00',
    lateAfter: '19:00',
    isActive: true,
    color: 'indigo',
  },
  {
    id: 'shift-5',
    shiftType: 'Libur',
    name: 'Libur',
    startTime: '-',
    endTime: '-',
    lateAfter: '-',
    isActive: true,
    color: 'red',
  },
];

const colorOptions = [
  { value: 'emerald', label: 'Hijau' },
  { value: 'purple', label: 'Ungu' },
  { value: 'amber', label: 'Kuning' },
  { value: 'indigo', label: 'Biru' },
  { value: 'red', label: 'Merah' },
  { value: 'pink', label: 'Pink' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'orange', label: 'Oranye' },
];

const getShiftIcon = (shiftType: string) => {
  switch (shiftType) {
    case 'Pagi':
      return Sunrise;
    case 'Malam':
      return Moon;
    case 'Piket Pagi':
      return Sun;
    case 'Piket Malam':
      return Sunset;
    case 'Libur':
      return Coffee;
    default:
      return Clock;
  }
};

export default function ManageShiftPage() {
  const [shifts, setShifts] = useState<ShiftSetting[]>(initialShiftSettings);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftSetting | null>(null);
  const [deletingShift, setDeletingShift] = useState<ShiftSetting | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    shiftType: '',
    name: '',
    startTime: '',
    endTime: '',
    lateAfter: '',
    color: 'emerald',
  });

  // Filter shifts
  const filteredShifts = shifts.filter(
    (shift) =>
      shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.shiftType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open add modal
  const openAddModal = () => {
    setEditingShift(null);
    setFormData({
      shiftType: '',
      name: '',
      startTime: '07:00',
      endTime: '15:00',
      lateAfter: '08:00',
      color: 'emerald',
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (shift: ShiftSetting) => {
    setEditingShift(shift);
    setFormData({
      shiftType: shift.shiftType,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateAfter: shift.lateAfter,
      color: shift.color,
    });
    setShowModal(true);
  };

  // Open delete modal
  const openDeleteModal = (shift: ShiftSetting) => {
    setDeletingShift(shift);
    setShowDeleteModal(true);
  };

  // Handle save (create/update)
  const handleSave = () => {
    if (!formData.shiftType || !formData.name) {
      toast.error('Nama shift dan tipe shift harus diisi!');
      return;
    }

    if (editingShift) {
      // Update existing
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShift.id
            ? {
                ...s,
                shiftType: formData.shiftType,
                name: formData.name,
                startTime: formData.startTime,
                endTime: formData.endTime,
                lateAfter: formData.lateAfter,
                color: formData.color,
              }
            : s
        )
      );
      toast.success('Shift berhasil diperbarui!');
    } else {
      // Create new
      const newShift: ShiftSetting = {
        id: `shift-${Date.now()}`,
        shiftType: formData.shiftType,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lateAfter: formData.lateAfter,
        isActive: true,
        color: formData.color,
      };
      setShifts((prev) => [...prev, newShift]);
      toast.success('Shift baru berhasil ditambahkan!');
    }

    setShowModal(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (!deletingShift) return;
    setShifts((prev) => prev.filter((s) => s.id !== deletingShift.id));
    setShowDeleteModal(false);
    setDeletingShift(null);
    toast.success('Shift berhasil dihapus!');
  };

  // Toggle active status
  const toggleActive = (id: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    toast.success('Status shift diubah!');
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        emerald: {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        },
        purple: {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-200',
        },
        amber: {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
        },
        indigo: {
          bg: 'bg-indigo-100',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
        },
        red: {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
        },
        pink: {
          bg: 'bg-pink-100',
          text: 'text-pink-700',
          border: 'border-pink-200',
        },
        cyan: {
          bg: 'bg-cyan-100',
          text: 'text-cyan-700',
          border: 'border-cyan-200',
        },
        orange: {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
        },
      };
    return colors[color] || colors.emerald;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='Kelola Shift'
        description='Tambah, edit, dan hapus konfigurasi waktu shift'
        icon={Clock}
        actions={
          <button
            onClick={openAddModal}
            className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
          >
            <Plus className='w-4 h-4' />
            Tambah
          </button>
        }
      />

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        <input
          type='text'
          placeholder='Cari shift...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
        />
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='text-center'>
          <p className='text-2xl font-bold text-gray-800'>{shifts.length}</p>
          <p className='text-sm text-gray-500'>Total Shift</p>
        </Card>
        <Card className='text-center'>
          <p className='text-2xl font-bold text-emerald-600'>
            {shifts.filter((s) => s.isActive).length}
          </p>
          <p className='text-sm text-gray-500'>Aktif</p>
        </Card>
        <Card className='text-center'>
          <p className='text-2xl font-bold text-gray-400'>
            {shifts.filter((s) => !s.isActive).length}
          </p>
          <p className='text-sm text-gray-500'>Nonaktif</p>
        </Card>
        <Card className='text-center'>
          <p className='text-2xl font-bold text-purple-600'>
            {shifts.filter((s) => s.shiftType !== 'Libur').length}
          </p>
          <p className='text-sm text-gray-500'>Shift Kerja</p>
        </Card>
      </div>

      {/* Shift Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredShifts.map((shift) => {
          const Icon = getShiftIcon(shift.shiftType);
          const colorClasses = getColorClasses(shift.color);

          return (
            <Card
              key={shift.id}
              className={`relative overflow-hidden ${
                !shift.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Header */}
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${colorClasses.text}`} />
                </div>
                <div className='flex-1'>
                  <h4 className='font-semibold text-gray-800'>{shift.name}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.bg} ${colorClasses.text}`}
                  >
                    {shift.shiftType}
                  </span>
                </div>
                {/* Toggle Active */}
                <button
                  onClick={() => toggleActive(shift.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    shift.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      shift.isActive ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Time Info */}
              {shift.shiftType !== 'Libur' ? (
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Jam Mulai</span>
                    <span className='font-medium text-gray-800'>
                      {shift.startTime}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Jam Selesai</span>
                    <span className='font-medium text-gray-800'>
                      {shift.endTime}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Batas Telat</span>
                    <span className='font-medium text-red-600'>
                      {shift.lateAfter}
                    </span>
                  </div>
                </div>
              ) : (
                <div className='text-sm text-gray-500 italic'>
                  Tidak ada waktu kerja
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-2 mt-4'>
                <button
                  onClick={() => openEditModal(shift)}
                  className='flex-1 py-2 text-sm font-medium text-[#E57373] bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2'
                >
                  <Edit2 className='w-4 h-4' />
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(shift)}
                  className='py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredShifts.length === 0 && (
        <Card className='text-center py-12'>
          <Clock className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <h3 className='font-semibold text-gray-600 mb-2'>
            Tidak ada shift ditemukan
          </h3>
          <p className='text-sm text-gray-400 mb-4'>
            {searchQuery
              ? 'Coba kata kunci pencarian lain'
              : 'Tambahkan shift pertama Anda'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className='inline-flex items-center gap-2 px-4 py-2.5 bg-[#E57373] hover:bg-[#EF5350] text-white font-medium rounded-xl transition-colors'
            >
              <Plus className='w-4 h-4' />
              Tambah Shift
            </button>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='md'>
        <ModalHeader
          title={editingShift ? 'Edit Shift' : 'Tambah Shift Baru'}
          subtitle={
            editingShift
              ? 'Perbarui konfigurasi shift'
              : 'Buat shift baru untuk jadwal kerja'
          }
          onClose={() => setShowModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tipe Shift
              </label>
              <input
                type='text'
                placeholder='e.g., Pagi, Malam, Piket'
                value={formData.shiftType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shiftType: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nama Shift
              </label>
              <input
                type='text'
                placeholder='e.g., Shift Pagi, Shift Malam'
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Jam Mulai
                </label>
                <input
                  type='time'
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Jam Selesai
                </label>
                <input
                  type='time'
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Batas Waktu Telat
              </label>
              <input
                type='time'
                value={formData.lateAfter}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lateAfter: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Absen setelah waktu ini akan dianggap telat
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Warna Badge
              </label>
              <div className='flex flex-wrap gap-2'>
                {colorOptions.map((opt) => {
                  const colorClasses = getColorClasses(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: opt.value }))
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all ${
                        colorClasses.bg
                      } ${colorClasses.text} ${
                        formData.color === opt.value
                          ? 'ring-2 ring-offset-1 ring-gray-400'
                          : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowModal(false)}
            className='flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors'
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className='flex-1 py-2.5 bg-[#E57373] hover:bg-[#EF5350] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2'
          >
            <Check className='w-4 h-4' />
            {editingShift ? 'Simpan Perubahan' : 'Tambah Shift'}
          </button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Shift'
        message={`Apakah Anda yakin ingin menghapus shift "${deletingShift?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />
    </div>
  );
}
