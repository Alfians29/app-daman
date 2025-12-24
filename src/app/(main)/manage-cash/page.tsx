'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  WalletCards,
  Wallet,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkeletonPage } from '@/components/ui/Skeleton';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Form';
import toast from 'react-hot-toast';
import { cashAPI, usersAPI, cashSettingsAPI } from '@/lib/api';
import { getLocalDateString } from '@/lib/utils';

type CashEntry = {
  id: string;
  date: string;
  transactionCategory: string | null;
  description: string;
  category: string;
  amount: number;
  memberId: string | null;
  member: { id: string; name: string } | null;
};

type Member = {
  id: string;
  name: string;
  nickname: string | null;
};

type TransactionForm = {
  date: string;
  transactionCategory: string;
  description: string;
  category: 'income' | 'expense';
  amount: number;
  memberId: string;
  selectedMonths: string[]; // For Kas Bulanan multi-month selection
};

const incomeCategories = [
  { value: 'Kas Bulanan', label: 'Kas Bulanan' },
  { value: 'Lain-lain', label: 'Lain-lain' },
];

const expenseCategories = [
  { value: 'Kebutuhan Kantor', label: 'Kebutuhan Kantor' },
  { value: 'Perlengkapan', label: 'Perlengkapan' },
  { value: 'Lain-lain', label: 'Lain-lain' },
];

export default function AdminCashPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashEntry | null>(null);

  // Export date range and format
  const [exportStartDate, setExportStartDate] = useState(getLocalDateString());
  const [exportEndDate, setExportEndDate] = useState(getLocalDateString());
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  const [formData, setFormData] = useState<TransactionForm>({
    date: getLocalDateString(),
    transactionCategory: 'Kas Bulanan',
    description: '',
    category: 'income',
    amount: 0,
    memberId: '',
    selectedMonths: [],
  });

  // Cash settings
  const [monthlyFee, setMonthlyFee] = useState<number>(15000);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempMonthlyFee, setTempMonthlyFee] = useState<number>(15000);
  const currentYear = new Date().getFullYear();

  const MONTHS = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [cashResult, usersResult, settingsResult] = await Promise.all([
      cashAPI.getAll(),
      usersAPI.getAll(),
      cashSettingsAPI.getAll(),
    ]);

    if (cashResult.success) setEntries(cashResult.data as CashEntry[]);
    if (usersResult.success) setMembers(usersResult.data as Member[]);
    if (settingsResult.success && settingsResult.data) {
      const fee = parseInt(settingsResult.data['monthly_fee'] || '15000', 10);
      setMonthlyFee(fee);
      setTempMonthlyFee(fee);
    }
    setIsLoading(false);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' || entry.category.toLowerCase() === filter;
    const matchesMember =
      memberFilter === 'all' || entry.memberId === memberFilter;

    let matchesDate = true;
    const entryDate = getLocalDateString(new Date(entry.date));
    if (dateFrom) matchesDate = matchesDate && entryDate >= dateFrom;
    if (dateTo) matchesDate = matchesDate && entryDate <= dateTo;

    return matchesSearch && matchesFilter && matchesMember && matchesDate;
  });

  const totalIncome = entries
    .filter((e) => e.category === 'INCOME')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = entries
    .filter((e) => e.category === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const memberOptions = [
    { value: '', label: 'Pilih member' },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  const handleAdd = async () => {
    startTransition(async () => {
      const result = await cashAPI.create({
        date: formData.date,
        transactionCategory: formData.transactionCategory,
        description: formData.description,
        category: formData.category,
        amount: formData.amount,
        memberId: formData.memberId || null,
      });

      if (result.success) {
        toast.success('Transaksi berhasil ditambahkan!');
        loadData();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal menambahkan transaksi');
      }
    });
  };

  const handleEdit = async () => {
    if (!selectedEntry) return;

    startTransition(async () => {
      const result = await cashAPI.update(selectedEntry.id, {
        date: formData.date,
        transactionCategory: formData.transactionCategory,
        description: formData.description,
        category: formData.category,
        amount: formData.amount,
        memberId: formData.memberId || null,
      });

      if (result.success) {
        toast.success('Transaksi berhasil diubah!');
        loadData();
        setShowEditModal(false);
        setSelectedEntry(null);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal mengubah transaksi');
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    startTransition(async () => {
      const result = await cashAPI.delete(selectedEntry.id);

      if (result.success) {
        toast.success('Transaksi berhasil dihapus!');
        loadData();
        setShowDeleteModal(false);
        setSelectedEntry(null);
      } else {
        toast.error(result.error || 'Gagal menghapus transaksi');
      }
    });
  };

  const handleExport = async () => {
    // Filter entries by export date range
    const exportEntries = entries.filter((e) => {
      const entryDate = getLocalDateString(new Date(e.date));
      return entryDate >= exportStartDate && entryDate <= exportEndDate;
    });

    const exportData = exportEntries.map((e) => ({
      Tanggal: new Date(e.date).toLocaleDateString('id-ID'),
      Deskripsi: e.description,
      Kategori: e.category === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: Number(e.amount),
      Member: e.member?.name || '-',
    }));

    if (exportFormat === 'csv') {
      // Export to CSV
      const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Member'];
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              let value = String(row[header as keyof typeof row] ?? '');
              // Remove newlines and carriage returns to prevent CSV row breaking
              value = value.replace(/[\r\n]+/g, ' ').trim();
              // Always wrap in quotes and escape existing quotes for safety
              return `"${value.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kas_${exportStartDate}_${exportEndDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('File CSV berhasil didownload!');
    } else {
      // Export to Excel
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kas');
      XLSX.writeFile(wb, `kas_${exportStartDate}_${exportEndDate}.xlsx`);
      toast.success('File Excel berhasil didownload!');
    }
    setShowExportModal(false);
  };

  // Save monthly fee setting
  const handleSaveSettings = async () => {
    startTransition(async () => {
      const result = await cashSettingsAPI.save(
        'monthly_fee',
        String(tempMonthlyFee),
        'Tarif kas bulanan per orang'
      );
      if (result.success) {
        setMonthlyFee(tempMonthlyFee);
        toast.success('Pengaturan kas berhasil disimpan!');
        setShowSettingsModal(false);
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    });
  };

  // Toggle month selection
  const toggleMonth = (monthValue: string) => {
    const newMonths = formData.selectedMonths.includes(monthValue)
      ? formData.selectedMonths.filter((m) => m !== monthValue)
      : [...formData.selectedMonths, monthValue].sort();

    // Auto-generate description
    const selectedLabels = MONTHS.filter((m) =>
      newMonths.includes(m.value)
    ).map((m) => m.label);
    const description =
      selectedLabels.length > 0
        ? `Kas bulan ${selectedLabels.join(', ')} ${currentYear}`
        : '';

    // Auto-calculate amount
    const amount = newMonths.length * monthlyFee;

    setFormData({
      ...formData,
      selectedMonths: newMonths,
      description,
      amount,
    });
  };

  const resetForm = () => {
    setFormData({
      date: getLocalDateString(),
      transactionCategory: 'Kas Bulanan',
      description: '',
      category: 'income',
      amount: 0,
      memberId: '',
      selectedMonths: [],
    });
  };

  const openEditModal = (entry: CashEntry) => {
    setSelectedEntry(entry);
    // Parse selected months from description if it's Kas Bulanan
    let parsedMonths: string[] = [];
    if (entry.transactionCategory === 'Kas Bulanan' && entry.description) {
      // Try to extract months from description like "Iuran bulan Januari, Februari 2025"
      const monthLabels = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      monthLabels.forEach((label, idx) => {
        if (entry.description.includes(label)) {
          parsedMonths.push(String(idx + 1).padStart(2, '0'));
        }
      });
    }
    setFormData({
      date: getLocalDateString(new Date(entry.date)),
      transactionCategory: entry.transactionCategory || 'Lain-lain',
      description: entry.description,
      category: entry.category.toLowerCase() as 'income' | 'expense',
      amount: Number(entry.amount),
      memberId: entry.memberId || '',
      selectedMonths: parsedMonths,
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

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kelola Uang Kas'
        description='Kelola pemasukan dan pengeluaran kas tim'
        icon={WalletCards}
        actions={
          <>
            <button
              onClick={() => setShowSettingsModal(true)}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <WalletCards className='w-4 h-4' />
              Pengaturan
            </button>
            <button
              onClick={() => {
                setExportStartDate(getLocalDateString());
                setExportEndDate(getLocalDateString());
                setShowExportModal(true);
              }}
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
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <ArrowDownCircle className='w-5 h-5 text-emerald-600' />
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
              <ArrowUpCircle className='w-5 h-5 text-red-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Pengeluaran</p>
              <p className='text-lg font-bold text-red-600'>
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder='Cari transaksi...'
        tabs={[
          { value: 'all', label: 'Semua' },
          { value: 'income', label: 'Pemasukan' },
          { value: 'expense', label: 'Pengeluaran' },
        ]}
        activeTab={filter}
        onTabChange={(val) => setFilter(val as 'all' | 'income' | 'expense')}
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        selects={[
          {
            value: memberFilter,
            onChange: setMemberFilter,
            options: members.map((m) => ({
              value: m.id,
              label: m.nickname || m.name,
            })),
            placeholder: 'Semua Member',
          },
        ]}
        showReset
        onReset={() => {
          setSearchQuery('');
          setFilter('all');
          setDateFrom('');
          setDateTo('');
          setMemberFilter('all');
        }}
      />

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
                  Anggota
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Kategori
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Deskripsi
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
                filteredEntries
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((entry) => (
                    <tr key={entry.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3 text-sm text-gray-600'>
                        {new Date(entry.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-600'>
                        {entry.member?.name || '-'}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700'>
                          {entry.transactionCategory || 'Lain-lain'}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-800'>
                        {entry.description || '-'}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                            entry.category === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.category === 'INCOME'
                            ? 'Pemasukan'
                            : 'Pengeluaran'}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium text-right ${
                          entry.category === 'INCOME'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {entry.category === 'INCOME' ? '+' : '-'}
                        {formatCurrency(Number(entry.amount))}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-center gap-2'>
                          <button
                            onClick={() => openEditModal(entry)}
                            disabled={isPending}
                            className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50'
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(entry)}
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

        {/* Pagination */}
        {Math.ceil(filteredEntries.length / itemsPerPage) > 1 && (
          <div className='flex items-center justify-between px-4 py-3 border-t border-gray-100'>
            <p className='text-sm text-gray-500'>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredEntries.length)}{' '}
              dari {filteredEntries.length} data
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <span className='text-sm text-gray-600'>
                {currentPage} /{' '}
                {Math.ceil(filteredEntries.length / itemsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(
                      Math.ceil(filteredEntries.length / itemsPerPage),
                      p + 1
                    )
                  )
                }
                disabled={
                  currentPage ===
                  Math.ceil(filteredEntries.length / itemsPerPage)
                }
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
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
                    setFormData({
                      ...formData,
                      category: 'income',
                      transactionCategory: 'Kas Bulanan',
                    })
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
                    setFormData({
                      ...formData,
                      category: 'expense',
                      transactionCategory: 'Kebutuhan Kantor',
                    })
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
              options={
                formData.category === 'income'
                  ? incomeCategories
                  : expenseCategories
              }
            />

            {/* Conditional: Multi-month picker for Kas Bulanan */}
            {formData.transactionCategory === 'Kas Bulanan' ? (
              <div>
                <label className='block text-xs text-gray-500 mb-2'>
                  Pilih Bulan Pembayaran ({currentYear})
                </label>
                <div className='grid grid-cols-4 gap-2'>
                  {MONTHS.map((month) => (
                    <button
                      key={month.value}
                      type='button'
                      onClick={() => toggleMonth(month.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.selectedMonths.includes(month.value)
                          ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {month.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {formData.selectedMonths.length > 0 && (
                  <p className='mt-2 text-xs text-gray-500'>
                    {formData.description}
                  </p>
                )}
              </div>
            ) : (
              <Input
                label='Deskripsi (opsional)'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Contoh: Iuran bulan Desember'
              />
            )}

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
              placeholder={
                formData.transactionCategory === 'Kas Bulanan'
                  ? formatCurrency(monthlyFee) + ' / bulan'
                  : '15000'
              }
              disabled={formData.transactionCategory === 'Kas Bulanan'}
              readOnly={formData.transactionCategory === 'Kas Bulanan'}
            />
            {formData.transactionCategory === 'Kas Bulanan' &&
              formData.selectedMonths.length > 0 && (
                <p className='text-xs text-gray-500 -mt-2'>
                  {formData.selectedMonths.length} bulan ×{' '}
                  {formatCurrency(monthlyFee)} ={' '}
                  {formatCurrency(formData.amount)}
                </p>
              )}
            <Select
              label='Member'
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
            disabled={isPending || !formData.amount}
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
        isOpen={showDeleteModal && !!selectedEntry}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Transaksi?'
        message={`Transaksi "${selectedEntry?.description}" akan dihapus permanen.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        size='sm'
      >
        <ModalHeader
          title='Pengaturan Kas'
          subtitle='Atur tarif kas bulanan'
          onClose={() => setShowSettingsModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Input
              label='Tarif Kas Bulanan (per orang)'
              type='number'
              value={tempMonthlyFee || ''}
              onChange={(e) => setTempMonthlyFee(parseInt(e.target.value) || 0)}
              placeholder='15000'
            />
            <p className='text-xs text-gray-500'>
              Tarif ini akan digunakan untuk auto-calculate jumlah saat memilih
              Kas Bulanan.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowSettingsModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isPending || !tempMonthlyFee}
            className='flex-1'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'Simpan'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Export Date Range Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        size='sm'
      >
        <ModalHeader
          title='Download Data Kas'
          subtitle='Pilih rentang tanggal untuk export'
          onClose={() => setShowExportModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Input
              label='Tanggal Mulai'
              type='date'
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
            />
            <Input
              label='Tanggal Akhir'
              type='date'
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
            />
            <div>
              <label className='block text-xs text-gray-500 mb-2'>
                Format File
              </label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setExportFormat('excel')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exportFormat === 'excel'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Excel (.xlsx)
                </button>
                <button
                  type='button'
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exportFormat === 'csv'
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  CSV (.csv)
                </button>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowExportModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={exportStartDate > exportEndDate}
            className='flex-1'
          >
            <Download className='w-4 h-4 mr-2' />
            Download
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
