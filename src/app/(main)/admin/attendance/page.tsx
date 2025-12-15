'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { attendanceRecords, teamMembers, AttendanceRecord } from '@/data/dummy';
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

type Keterangan = 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';

type AttendanceForm = {
  memberId: string;
  tanggal: string;
  jamAbsen: string;
  keterangan: Keterangan;
  status: 'Ontime' | 'Telat';
};

const memberOptions = [
  { value: '', label: 'Pilih member' },
  ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
];

const keteranganOptions: { value: Keterangan; label: string }[] = [
  { value: 'Pagi', label: 'Pagi' },
  { value: 'Malam', label: 'Malam' },
  { value: 'Piket Pagi', label: 'Piket Pagi' },
  { value: 'Piket Malam', label: 'Piket Malam' },
  { value: 'Libur', label: 'Libur' },
];

export default function AdminAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterKeterangan, setFilterKeterangan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Local records state
  const [records, setRecords] = useState<AttendanceRecord[]>(attendanceRecords);

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
    keterangan: 'Pagi',
    status: 'Ontime',
  });

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.memberName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDate = record.tanggal === selectedDate;
    const matchesKeterangan =
      filterKeterangan === 'all' || record.keterangan === filterKeterangan;
    const matchesStatus =
      filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesDate && matchesKeterangan && matchesStatus;
  });

  const keteranganColors: Record<string, string> = {
    Pagi: 'bg-blue-100 text-blue-700',
    Malam: 'bg-purple-100 text-purple-700',
    'Piket Pagi': 'bg-emerald-100 text-emerald-700',
    'Piket Malam': 'bg-orange-100 text-orange-700',
    Libur: 'bg-red-100 text-red-700',
  };

  // Get summary for selected date
  const summary = {
    total: teamMembers.length,
    hadir: filteredRecords.filter((r) => r.keterangan !== 'Libur').length,
    libur: filteredRecords.filter((r) => r.keterangan === 'Libur').length,
  };

  // Get member statistics
  const getMemberStats = () => {
    const stats: Record<
      string,
      {
        name: string;
        total: number;
        ontime: number;
        telat: number;
        libur: number;
      }
    > = {};

    records.forEach((record) => {
      if (!stats[record.memberId]) {
        stats[record.memberId] = {
          name: record.memberName,
          total: 0,
          ontime: 0,
          telat: 0,
          libur: 0,
        };
      }
      stats[record.memberId].total++;
      if (record.keterangan === 'Libur') {
        stats[record.memberId].libur++;
      } else if (record.status === 'Ontime') {
        stats[record.memberId].ontime++;
      } else {
        stats[record.memberId].telat++;
      }
    });

    return Object.values(stats);
  };

  // Add attendance
  const handleAdd = () => {
    const member = teamMembers.find((m) => m.id === formData.memberId);
    if (!member) {
      toast.error('Pilih member terlebih dahulu!');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      memberImg: member.image,
      position: member.position,
      tanggal: formData.tanggal,
      jamAbsen: formData.jamAbsen,
      keterangan: formData.keterangan,
      status: formData.status,
    };

    setRecords([newRecord, ...records]);
    setShowAddModal(false);
    resetForm();
    toast.success('Data kehadiran berhasil ditambahkan!');
  };

  // Edit attendance
  const handleEdit = () => {
    if (!selectedRecord) return;
    const member = teamMembers.find((m) => m.id === formData.memberId);

    setRecords(
      records.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              memberId: formData.memberId,
              memberName: member?.name || r.memberName,
              position: member?.position || r.position,
              tanggal: formData.tanggal,
              jamAbsen: formData.jamAbsen,
              keterangan: formData.keterangan,
              status: formData.status,
            }
          : r
      )
    );
    setShowEditModal(false);
    setSelectedRecord(null);
    resetForm();
    toast.success('Data kehadiran berhasil diubah!');
  };

  // Delete attendance
  const handleDelete = () => {
    if (!selectedRecord) return;
    setRecords(records.filter((r) => r.id !== selectedRecord.id));
    setShowDeleteModal(false);
    setSelectedRecord(null);
    toast.success('Data kehadiran berhasil dihapus!');
  };

  // Export to Excel
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    const exportData = filteredRecords.map((r) => ({
      Tanggal: r.tanggal,
      Nama: r.memberName,
      Posisi: r.position,
      'Jam Absen': r.jamAbsen,
      Keterangan: r.keterangan,
      Status: r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran');

    ws['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.writeFile(wb, `kehadiran_${selectedDate}.xlsx`);
    toast.success('File Excel berhasil didownload!');
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      tanggal: new Date().toISOString().split('T')[0],
      jamAbsen: '08:00',
      keterangan: 'Pagi',
      status: 'Ontime',
    });
  };

  const openEditModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      memberId: record.memberId,
      tanggal: record.tanggal,
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
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
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

        {/* Additional Filters */}
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
            <option value='Ontime'>Ontime</option>
            <option value='Telat'>Telat</option>
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
                  Posisi
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
                    colSpan={6}
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
                          {record.memberName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className='text-sm font-medium text-gray-800'>
                          {record.memberName}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {record.position}
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
                        {record.keterangan}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                          record.status === 'Ontime'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openEditModal(record)}
                          className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(record)}
                          className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
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
                setFormData({
                  ...formData,
                  keterangan: e.target.value as Keterangan,
                })
              }
              options={keteranganOptions}
            />

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Status
              </label>
              <div className='flex gap-2'>
                <button
                  onClick={() => setFormData({ ...formData, status: 'Ontime' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.status === 'Ontime'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Ontime
                </button>
                <button
                  onClick={() => setFormData({ ...formData, status: 'Telat' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.status === 'Telat'
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
            disabled={!formData.memberId}
            className='flex-1'
          >
            {showAddModal ? 'Tambah' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal && !!selectedRecord}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Data Kehadiran?'
        message={`Data kehadiran ${selectedRecord?.memberName} pada tanggal ${selectedRecord?.tanggal} akan dihapus permanen.`}
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
          <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-2'>
            {getMemberStats().length === 0 ? (
              <p className='text-center text-gray-500 py-8'>
                Belum ada data kehadiran
              </p>
            ) : (
              getMemberStats().map((stats, index) => {
                const total = stats.ontime + stats.telat;
                const ontimePercent =
                  total > 0 ? Math.round((stats.ontime / total) * 100) : 0;
                return (
                  <div
                    key={index}
                    className='p-4 bg-gray-50 dark:bg-gray-700 rounded-xl'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <p className='font-medium text-gray-800 dark:text-white'>
                        {stats.name}
                      </p>
                      <p className='text-sm font-bold text-emerald-600'>
                        {ontimePercent}% Ontime
                      </p>
                    </div>
                    <div className='flex gap-4 text-sm'>
                      <div className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-emerald-500' />
                        <span className='text-gray-600 dark:text-gray-400'>
                          Ontime: {stats.ontime}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-amber-500' />
                        <span className='text-gray-600 dark:text-gray-400'>
                          Telat: {stats.telat}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <span className='w-2 h-2 rounded-full bg-gray-400' />
                        <span className='text-gray-600 dark:text-gray-400'>
                          Libur: {stats.libur}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className='mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-emerald-500'
                        style={{ width: `${ontimePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
