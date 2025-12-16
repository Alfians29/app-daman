'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
  Plus,
  Download,
  Filter,
  BarChart3,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Form';
import toast from 'react-hot-toast';
import { attendanceAPI, usersAPI } from '@/lib/api';

type AttendanceRecord = {
  id: string;
  memberId: string;
  tanggal: string;
  jamAbsen: string;
  keterangan: string;
  status: string;
  member: { id: string; name: string; image: string | null };
};

type Member = {
  id: string;
  name: string;
  position: string;
  image: string | null;
};

type AttendanceForm = {
  memberId: string;
  tanggal: string;
  jamAbsen: string;
  keterangan: string;
  status: string;
};

const keteranganOptions = [
  { value: 'PAGI', label: 'Pagi' },
  { value: 'MALAM', label: 'Malam' },
  { value: 'PIKET_PAGI', label: 'Piket Pagi' },
  { value: 'PIKET_MALAM', label: 'Piket Malam' },
  { value: 'LIBUR', label: 'Libur' },
];

const keteranganLabels: Record<string, string> = {
  PAGI: 'Pagi',
  MALAM: 'Malam',
  PIKET_PAGI: 'Piket Pagi',
  PIKET_MALAM: 'Piket Malam',
  LIBUR: 'Libur',
};

export default function AdminAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterKeterangan, setFilterKeterangan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<AttendanceForm>({
    memberId: '',
    tanggal: new Date().toISOString().split('T')[0],
    jamAbsen: '08:00',
    keterangan: 'PAGI',
    status: 'ONTIME',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [attendanceResult, usersResult] = await Promise.all([
      attendanceAPI.getAll(),
      usersAPI.getAll(),
    ]);

    if (attendanceResult.success) {
      setRecords(attendanceResult.data as AttendanceRecord[]);
    }
    if (usersResult.success) {
      setMembers(usersResult.data as Member[]);
    }
    setIsLoading(false);
  };

  const filteredRecords = records.filter((record) => {
    const memberName = record.member?.name || '';
    const matchesSearch = memberName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const recordDate = new Date(record.tanggal).toISOString().split('T')[0];
    const matchesDate = recordDate === selectedDate;
    const matchesKeterangan =
      filterKeterangan === 'all' || record.keterangan === filterKeterangan;
    const matchesStatus =
      filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesDate && matchesKeterangan && matchesStatus;
  });

  const keteranganColors: Record<string, string> = {
    PAGI: 'bg-blue-100 text-blue-700',
    MALAM: 'bg-purple-100 text-purple-700',
    PIKET_PAGI: 'bg-emerald-100 text-emerald-700',
    PIKET_MALAM: 'bg-orange-100 text-orange-700',
    LIBUR: 'bg-red-100 text-red-700',
  };

  const summary = {
    total: members.length,
    hadir: filteredRecords.filter((r) => r.keterangan !== 'LIBUR').length,
    libur: filteredRecords.filter((r) => r.keterangan === 'LIBUR').length,
  };

  const memberOptions = [
    { value: '', label: 'Pilih member' },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  // Add attendance
  const handleAdd = async () => {
    if (!formData.memberId) {
      toast.error('Pilih member terlebih dahulu!');
      return;
    }

    startTransition(async () => {
      const result = await attendanceAPI.create({
        memberId: formData.memberId,
        tanggal: formData.tanggal,
        jamAbsen: formData.jamAbsen,
        keterangan: formData.keterangan,
        status: formData.status,
      });

      if (result.success) {
        toast.success('Data kehadiran berhasil ditambahkan!');
        loadData();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal menambahkan data');
      }
    });
  };

  // Edit attendance
  const handleEdit = async () => {
    if (!selectedRecord) return;

    startTransition(async () => {
      const result = await attendanceAPI.update(selectedRecord.id, {
        tanggal: formData.tanggal,
        jamAbsen: formData.jamAbsen,
        keterangan: formData.keterangan,
        status: formData.status,
      });

      if (result.success) {
        toast.success('Data kehadiran berhasil diubah!');
        loadData();
        setShowEditModal(false);
        setSelectedRecord(null);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal mengubah data');
      }
    });
  };

  // Delete attendance
  const handleDelete = async () => {
    if (!selectedRecord) return;

    startTransition(async () => {
      const result = await attendanceAPI.delete(selectedRecord.id);

      if (result.success) {
        toast.success('Data kehadiran berhasil dihapus!');
        loadData();
        setShowDeleteModal(false);
        setSelectedRecord(null);
      } else {
        toast.error(result.error || 'Gagal menghapus data');
      }
    });
  };

  // Export to Excel
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    const exportData = filteredRecords.map((r) => ({
      Tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
      Nama: r.member?.name || '-',
      'Jam Absen': r.jamAbsen,
      Keterangan: keteranganLabels[r.keterangan] || r.keterangan,
      Status: r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran');
    XLSX.writeFile(wb, `kehadiran_${selectedDate}.xlsx`);
    toast.success('File Excel berhasil didownload!');
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      tanggal: new Date().toISOString().split('T')[0],
      jamAbsen: '08:00',
      keterangan: 'PAGI',
      status: 'ONTIME',
    });
  };

  const openEditModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      memberId: record.memberId,
      tanggal: new Date(record.tanggal).toISOString().split('T')[0],
      jamAbsen: record.jamAbsen,
      keterangan: record.keterangan,
      status: record.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRecord(null);
    resetForm();
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
      {/* Header */}
      <PageHeader
        title='Kelola Kehadiran'
        description='Kelola dan pantau kehadiran anggota tim'
        icon={ClipboardCheck}
        actions={
          <>
            <button
              onClick={() => setShowStatsModal(true)}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <BarChart3 className='w-4 h-4' />
              Statistik
            </button>
            <button
              onClick={handleExport}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <Download className='w-4 h-4' />
              Download
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
            >
              <Plus className='w-4 h-4' />
              Tambah
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-lg font-bold text-gray-800'>{summary.total}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <Check className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Hadir</p>
              <p className='text-lg font-bold text-emerald-600'>
                {summary.hadir}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center'>
              <X className='w-5 h-5 text-red-600' />
            </div>
            <div>
              <p className='text-xs text-red-500'>Libur</p>
              <p className='text-lg font-bold text-red-600'>{summary.libur}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Cari nama anggota...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            />
          </div>
          <input
            type='date'
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className='px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-500'>Filter:</span>
          </div>

          <select
            value={filterKeterangan}
            onChange={(e) => setFilterKeterangan(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          >
            <option value='all'>Semua Status</option>
            <option value='ONTIME'>Ontime</option>
            <option value='TELAT'>Telat</option>
          </select>

          {(filterKeterangan !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterKeterangan('all');
                setFilterStatus('all');
              }}
              className='text-xs text-[#E57373] hover:underline'
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Nama
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
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    Tidak ada data kehadiran untuk tanggal ini
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#E57373] to-[#C62828] flex items-center justify-center text-white text-xs font-medium'>
                          {(record.member?.name || '?')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className='text-sm font-medium text-gray-800'>
                          {record.member?.name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {record.jamAbsen}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                          keteranganColors[record.keterangan] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {keteranganLabels[record.keterangan] ||
                          record.keterangan}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                          record.status === 'ONTIME'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {record.status === 'ONTIME' ? 'Ontime' : 'Telat'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openEditModal(record)}
                          disabled={isPending}
                          className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50'
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(record)}
                          disabled={isPending}
                          className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeModal}
        size='md'
      >
        <ModalHeader
          title={showAddModal ? 'Tambah Kehadiran' : 'Edit Kehadiran'}
          onClose={closeModal}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Select
              label='Member'
              value={formData.memberId}
              onChange={(e) =>
                setFormData({ ...formData, memberId: e.target.value })
              }
              options={memberOptions}
              disabled={showEditModal}
            />
            <Input
              label='Tanggal'
              type='date'
              value={formData.tanggal}
              onChange={(e) =>
                setFormData({ ...formData, tanggal: e.target.value })
              }
            />
            <Input
              label='Jam Absen'
              type='time'
              value={formData.jamAbsen}
              onChange={(e) =>
                setFormData({ ...formData, jamAbsen: e.target.value })
              }
            />
            <Select
              label='Keterangan'
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              options={keteranganOptions}
            />
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status
              </label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, status: 'ONTIME' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.status === 'ONTIME'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Ontime
                </button>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, status: 'TELAT' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.status === 'TELAT'
                      ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Telat
                </button>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='secondary' onClick={closeModal} className='flex-1'>
            Batal
          </Button>
          <Button
            onClick={showAddModal ? handleAdd : handleEdit}
            disabled={isPending || !formData.memberId}
            className='flex-1'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : showAddModal ? (
              'Tambah'
            ) : (
              'Simpan'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal && !!selectedRecord}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Data Kehadiran?'
        message={`Data kehadiran ${selectedRecord?.member?.name} akan dihapus permanen.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        size='lg'
      >
        <ModalHeader
          title='Statistik Kehadiran'
          onClose={() => setShowStatsModal(false)}
        />
        <ModalBody>
          <p className='text-center text-gray-500 py-8'>
            Statistik akan tersedia setelah ada lebih banyak data kehadiran.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowStatsModal(false)}
            className='flex-1'
          >
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
