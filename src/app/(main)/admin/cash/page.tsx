'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Download,
  Filter,
  WalletCards,
  Wallet,
} from 'lucide-react';
import { cashEntries, CashEntry, teamMembers } from '@/data/dummy';
import { Card } from '@/components/ui/Card';
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

// Predefined transaction categories
const transactionCategories = [
  { value: 'Kas Bulanan', label: 'Kas Bulanan' },
  { value: 'Kebutuhan Kantor', label: 'Kebutuhan Kantor' },
  { value: 'Belanja Operasional', label: 'Belanja Operasional' },
  { value: 'Perlengkapan', label: 'Perlengkapan' },
  { value: 'Lain-lain', label: 'Lain-lain' },
];

const memberOptions = [
  { value: '', label: 'Pilih member' },
  ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
];

type TransactionForm = {
  date: string;
  transactionCategory: string;
  description: string;
  category: 'income' | 'expense';
  amount: number;
  memberId?: string;
};

export default function AdminCashPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState<TransactionForm>({
    date: new Date().toISOString().split('T')[0],
    transactionCategory: 'Kas Bulanan',
    description: '',
    category: 'income',
    amount: 0,
    memberId: '',
  });

  // Local entries state (simulating database)
  const [entries, setEntries] = useState<CashEntry[]>(cashEntries);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || entry.category === filter;
    const matchesMember =
      memberFilter === 'all' || entry.memberId === memberFilter;

    // Date filter
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && entry.date >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && entry.date <= dateTo;
    }

    return matchesSearch && matchesFilter && matchesMember && matchesDate;
  });

  const totalIncome = filteredEntries
    .filter((e) => e.category === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = filteredEntries
    .filter((e) => e.category === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Add transaction
  const handleAdd = () => {
    const member = teamMembers.find((m) => m.id === formData.memberId);
    const newEntry: CashEntry = {
      id: `cash-${Date.now()}`,
      date: formData.date,
      transactionCategory: formData.transactionCategory,
      description: formData.description,
      category: formData.category,
      amount: formData.amount,
      memberId: formData.memberId,
      memberName: member?.name,
    };
    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
    resetForm();
    toast.success('Transaksi berhasil ditambahkan!');
  };

  // Edit transaction
  const handleEdit = () => {
    if (!selectedEntry) return;
    const member = teamMembers.find((m) => m.id === formData.memberId);
    setEntries(
      entries.map((e) =>
        e.id === selectedEntry.id
          ? {
              ...e,
              date: formData.date,
              transactionCategory: formData.transactionCategory,
              description: formData.description,
              category: formData.category,
              amount: formData.amount,
              memberId: formData.memberId,
              memberName: member?.name,
            }
          : e
      )
    );
    setShowEditModal(false);
    setSelectedEntry(null);
    resetForm();
    toast.success('Transaksi berhasil diubah!');
  };

  // Delete transaction
  const handleDelete = () => {
    if (!selectedEntry) return;
    setEntries(entries.filter((e) => e.id !== selectedEntry.id));
    setShowDeleteModal(false);
    setSelectedEntry(null);
    toast.success('Transaksi berhasil dihapus!');
  };

  // Export to Excel
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    const exportData = filteredEntries.map((e) => ({
      Tanggal: e.date,
      Deskripsi: e.description,
      Kategori: e.category === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: e.amount,
      Member: e.memberName || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kas');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, `kas_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel berhasil didownload!');
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      transactionCategory: 'Kas Bulanan',
      description: '',
      category: 'income',
      amount: 0,
      memberId: '',
    });
  };

  const openEditModal = (entry: CashEntry) => {
    setSelectedEntry(entry);
    setFormData({
      date: entry.date,
      transactionCategory: entry.transactionCategory || 'Lain-lain',
      description: entry.description,
      category: entry.category,
      amount: entry.amount,
      memberId: entry.memberId || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (entry: CashEntry) => {
    setSelectedEntry(entry);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedEntry(null);
    resetForm();
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='Kelola Uang Kas'
        description='Kelola pemasukan dan pengeluaran kas tim'
        icon={WalletCards}
        actions={
          <>
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
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <ArrowUpCircle className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Pemasukan</p>
              <p className='text-lg font-bold text-emerald-600'>
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center'>
              <ArrowDownCircle className='w-5 h-5 text-red-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Pengeluaran</p>
              <p className='text-lg font-bold text-red-600'>
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Wallet className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Saldo</p>
              <p className='text-lg font-bold text-blue-600'>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Cari transaksi...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            />
          </div>
          <div className='flex gap-2'>
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  filter === f
                    ? 'bg-[#E57373] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'all'
                  ? 'Semua'
                  : f === 'income'
                  ? 'Pemasukan'
                  : 'Pengeluaran'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-500'>Tanggal:</span>
          </div>
          <input
            type='date'
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />
          <span className='text-gray-400'>-</span>
          <input
            type='date'
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className='text-xs text-[#E57373] hover:underline'
            >
              Reset
            </button>
          )}

          {/* Member Filter */}
          <div className='flex items-center gap-2 ml-auto'>
            <Filter className='w-4 h-4 text-gray-400' />
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            >
              <option value='all'>Semua Member</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Tanggal
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Kategori
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Deskripsi
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Member
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Tipe
                </th>
                <th className='text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Jumlah
                </th>
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {entry.date}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700'>
                        {entry.transactionCategory || 'Lain-lain'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-800 font-medium'>
                      {entry.description}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {entry.memberName || '-'}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                          entry.category === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.category === 'income'
                          ? 'Pemasukan'
                          : 'Pengeluaran'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-right ${
                        entry.category === 'income'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {entry.category === 'income' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openEditModal(entry)}
                          className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(entry)}
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
          title={showAddModal ? 'Tambah Transaksi' : 'Edit Transaksi'}
          subtitle='Kelola Uang Kas'
          onClose={closeModal}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Input
              label='Tanggal'
              type='date'
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />

            <div>
              <label className='block text-xs text-gray-500 mb-1'>
                Tipe Transaksi
              </label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, category: 'income' })
                  }
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.category === 'income'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, category: 'expense' })
                  }
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    formData.category === 'expense'
                      ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pengeluaran
                </button>
              </div>
            </div>

            <Select
              label='Kategori Transaksi'
              value={formData.transactionCategory}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transactionCategory: e.target.value,
                })
              }
              options={transactionCategories}
            />

            <Input
              label='Deskripsi'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Contoh: Iuran bulan Desember'
            />

            <Input
              label='Jumlah (Rp)'
              type='number'
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: parseInt(e.target.value) || 0,
                })
              }
              placeholder='50000'
            />

            <Select
              label='Member (opsional)'
              value={formData.memberId || ''}
              onChange={(e) =>
                setFormData({ ...formData, memberId: e.target.value })
              }
              options={memberOptions}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='secondary' onClick={closeModal} className='flex-1'>
            Batal
          </Button>
          <Button
            onClick={showAddModal ? handleAdd : handleEdit}
            disabled={!formData.description || !formData.amount}
            className='flex-1'
          >
            {showAddModal ? 'Tambah' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal && !!selectedEntry}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Transaksi?'
        message={`Transaksi "${selectedEntry?.description}" akan dihapus permanen.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />
    </div>
  );
}
