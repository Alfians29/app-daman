'use client';

import { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Settings,
  Shield,
  FileText,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import toast from 'react-hot-toast';

type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  category: 'auth' | 'data' | 'system' | 'user';
  user: string;
  details: string;
  ipAddress: string;
};

const initialLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-12-10 08:30:15',
    action: 'Login',
    category: 'auth',
    user: 'andrew.nugroho',
    details: 'User login berhasil',
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    timestamp: '2024-12-10 08:35:22',
    action: 'Tambah Data',
    category: 'data',
    user: 'muhammad.alfian',
    details: 'Menambahkan data kehadiran untuk Budi',
    ipAddress: '192.168.1.100',
  },
  {
    id: '3',
    timestamp: '2024-12-10 09:00:45',
    action: 'Edit Role',
    category: 'user',
    user: 'andrew.nugroho',
    details: 'Mengubah role Andi dari Member ke Admin',
    ipAddress: '192.168.1.101',
  },
  {
    id: '4',
    timestamp: '2024-12-10 09:15:30',
    action: 'Export Data',
    category: 'data',
    user: 'muhammad.alfian',
    details: 'Export data kehadiran bulan Desember',
    ipAddress: '192.168.1.100',
  },
  {
    id: '5',
    timestamp: '2024-12-10 10:00:00',
    action: 'Ubah Jadwal',
    category: 'data',
    user: 'rahardian.arta',
    details: 'Mengubah jadwal shift untuk tanggal 15 Desember',
    ipAddress: '192.168.1.100',
  },
  {
    id: '6',
    timestamp: '2024-12-10 10:30:12',
    action: 'Hapus Data',
    category: 'data',
    user: 'andrew.nugroho',
    details: 'Menghapus transaksi kas ID: CAS-2024-001',
    ipAddress: '192.168.1.101',
  },
  {
    id: '7',
    timestamp: '2024-12-10 11:00:00',
    action: 'Backup System',
    category: 'system',
    user: 'system',
    details: 'Backup otomatis database berhasil',
    ipAddress: 'localhost',
  },
  {
    id: '8',
    timestamp: '2024-12-10 11:30:45',
    action: 'Logout',
    category: 'auth',
    user: 'muhammad.alfian',
    details: 'User logout',
    ipAddress: '192.168.1.100',
  },
  {
    id: '9',
    timestamp: '2024-12-09 08:00:00',
    action: 'Login',
    category: 'auth',
    user: 'andrew.nugroho',
    details: 'User login berhasil',
    ipAddress: '192.168.1.101',
  },
  {
    id: '10',
    timestamp: '2024-12-09 14:20:33',
    action: 'Tambah Role',
    category: 'user',
    user: 'andrew.nugroho',
    details: 'Menambahkan role baru: Editor',
    ipAddress: '192.168.1.101',
  },
];

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = initialLogs;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || log.category === filterCategory;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    // Date filter
    let matchesDate = true;
    const logDate = log.timestamp.split(' ')[0];
    if (dateFrom) {
      matchesDate = matchesDate && logDate >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && logDate <= dateTo;
    }

    return matchesSearch && matchesCategory && matchesAction && matchesDate;
  });

  const categories = [
    { value: 'auth', label: 'Autentikasi', icon: LogIn },
    { value: 'data', label: 'Data', icon: FileText },
    { value: 'user', label: 'User', icon: User },
    { value: 'system', label: 'Sistem', icon: Settings },
  ];

  const actions = [...new Set(logs.map((l) => l.action))];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth':
        return 'bg-blue-100 text-blue-700';
      case 'data':
        return 'bg-emerald-100 text-emerald-700';
      case 'user':
        return 'bg-purple-100 text-purple-700';
      case 'system':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Login')) return <LogIn className='w-4 h-4' />;
    if (action.includes('Logout')) return <LogOut className='w-4 h-4' />;
    if (action.includes('Tambah')) return <Plus className='w-4 h-4' />;
    if (action.includes('Edit') || action.includes('Ubah'))
      return <Edit className='w-4 h-4' />;
    if (action.includes('Hapus')) return <Trash2 className='w-4 h-4' />;
    if (action.includes('Export')) return <Download className='w-4 h-4' />;
    if (action.includes('Role')) return <Shield className='w-4 h-4' />;
    return <FileText className='w-4 h-4' />;
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');

    const exportData = filteredLogs.map((log) => ({
      Waktu: log.timestamp,
      Aksi: log.action,
      Kategori: log.category,
      User: log.user,
      Detail: log.details,
      'IP Address': log.ipAddress,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');

    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 40 },
      { wch: 15 },
    ];

    XLSX.writeFile(
      wb,
      `audit_log_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    toast.success('Audit log berhasil diexport!');
  };

  const openDetailModal = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Statistics
  const stats = {
    total: logs.length,
    today: logs.filter((l) => l.timestamp.startsWith('2024-12-10')).length,
    auth: logs.filter((l) => l.category === 'auth').length,
    data: logs.filter((l) => l.category === 'data').length,
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='Audit Log'
        description='Monitor semua aktivitas sistem'
        icon={ScrollText}
        actions={
          <button
            onClick={handleExport}
            className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
          >
            <Download className='w-4 h-4' />
            Export Excel
          </button>
        }
      />

      {/* Summary Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center'>
              <FileText className='w-5 h-5 text-gray-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Log</p>
              <p className='text-lg font-bold text-gray-800'>{stats.total}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Calendar className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Hari Ini</p>
              <p className='text-lg font-bold text-blue-600'>{stats.today}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <LogIn className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Auth</p>
              <p className='text-lg font-bold text-emerald-600'>{stats.auth}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center'>
              <FileText className='w-5 h-5 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Data</p>
              <p className='text-lg font-bold text-purple-600'>{stats.data}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className='flex flex-col gap-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <input
            type='text'
            placeholder='Cari log aktivitas...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-gray-400' />
            <span className='text-sm text-gray-500'>Filter:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          >
            <option value='all'>Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          >
            <option value='all'>Semua Aksi</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-gray-400' />
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
          </div>

          {(filterCategory !== 'all' ||
            filterAction !== 'all' ||
            dateFrom ||
            dateTo) && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterAction('all');
                setDateFrom('');
                setDateTo('');
              }}
              className='text-xs text-[#E57373] hover:underline'
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Waktu
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Aksi
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Kategori
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  User
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Detail
                </th>
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    Tidak ada log ditemukan
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {log.timestamp}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <span className='text-gray-500'>
                          {getActionIcon(log.action)}
                        </span>
                        <span className='text-sm font-medium text-gray-800'>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getCategoryColor(
                          log.category
                        )}`}
                      >
                        {
                          categories.find((c) => c.value === log.category)
                            ?.label
                        }
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {log.user}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600 max-w-xs truncate'>
                      {log.details}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <button
                        onClick={() => openDetailModal(log)}
                        className='text-xs text-[#E57373] hover:underline'
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!selectedLog}
        onClose={() => setShowDetailModal(false)}
        size='md'
      >
        <ModalHeader
          title='Detail Log'
          onClose={() => setShowDetailModal(false)}
        />
        <ModalBody>
          {selectedLog && (
            <div className='space-y-4'>
              <div className='flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                <span className='text-gray-500'>
                  {getActionIcon(selectedLog.action)}
                </span>
                <div>
                  <p className='font-medium text-gray-800 dark:text-white'>
                    {selectedLog.action}
                  </p>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-lg ${getCategoryColor(
                      selectedLog.category
                    )}`}
                  >
                    {
                      categories.find((c) => c.value === selectedLog.category)
                        ?.label
                    }
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Waktu
                  </p>
                  <p className='text-sm font-medium text-gray-800 dark:text-white'>
                    {selectedLog.timestamp}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    IP Address
                  </p>
                  <p className='text-sm font-medium text-gray-800 dark:text-white'>
                    {selectedLog.ipAddress}
                  </p>
                </div>
              </div>

              <div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                  User
                </p>
                <p className='text-sm font-medium text-gray-800 dark:text-white'>
                  {selectedLog.user}
                </p>
              </div>

              <div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                  Detail
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  {selectedLog.details}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowDetailModal(false)}
            className='flex-1'
          >
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
