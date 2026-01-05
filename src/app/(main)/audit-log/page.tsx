'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Trash2,
  Edit,
  Plus,
  LogIn,
  ScrollText,
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
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Form';
import toast from 'react-hot-toast';
import { activitiesAPI } from '@/lib/api';
import { getLocalDateString } from '@/lib/utils';

type AuditLog = {
  id: string;
  createdAt: Date;
  action: string;
  target: string;
  type: string;
  user: { id: string; name: string; image: string | null };
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const ITEMS_PER_PAGE = 10;

type Stats = {
  total: number;
  today: number;
  create: number;
  update: number;
  delete: number;
};

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    create: 0,
    update: 0,
    delete: 0,
  });

  // Export date range
  const [exportStartDate, setExportStartDate] = useState(getLocalDateString());
  const [exportEndDate, setExportEndDate] = useState(getLocalDateString());

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, dateFrom, dateTo]);

  // Load data when page or filters change
  useEffect(() => {
    loadActivities();
  }, [currentPage, debouncedSearch, filterType, dateFrom, dateTo]);

  const loadActivities = async () => {
    setIsLoading(true);
    const result = (await activitiesAPI.getAll({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      type: filterType,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: debouncedSearch || undefined,
    })) as {
      success: boolean;
      data?: AuditLog[];
      total?: number;
      stats?: Stats;
    };

    if (result.success && result.data) {
      setLogs(result.data);
      setTotalLogs(result.total || 0);
      if (result.stats) {
        setStats(result.stats);
      }
    }
    setIsLoading(false);
  };

  // Server-side pagination
  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);

  const types = [
    { value: 'CREATE', label: 'Tambah', icon: Plus },
    { value: 'UPDATE', label: 'Update', icon: Edit },
    { value: 'DELETE', label: 'Hapus', icon: Trash2 },
    { value: 'LOGIN', label: 'Login', icon: LogIn },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CREATE':
        return <Plus className='w-4 h-4' />;
      case 'UPDATE':
        return <Edit className='w-4 h-4' />;
      case 'DELETE':
        return <Trash2 className='w-4 h-4' />;
      case 'LOGIN':
        return <LogIn className='w-4 h-4' />;
      default:
        return <FileText className='w-4 h-4' />;
    }
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');

    // Filter logs by export date range
    const exportLogs = logs.filter((log) => {
      const logDate = new Date(log.createdAt).toISOString().split('T')[0];
      return logDate >= exportStartDate && logDate <= exportEndDate;
    });

    const exportData = exportLogs.map((log) => ({
      Waktu: new Date(log.createdAt).toLocaleString('id-ID'),
      Aksi: log.action,
      Target: log.target,
      Tipe: log.type,
      User: log.user.name,
      'IP Address': log.ipAddress || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
    XLSX.writeFile(wb, `audit_log_${exportStartDate}_${exportEndDate}.xlsx`);
    toast.success('Audit log berhasil diexport!');
    setShowExportModal(false);
  };

  const openDetailModal = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Audit Log'
        description='Monitor semua aktivitas sistem'
        icon={ScrollText}
        actions={
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
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <Plus className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Tambah</p>
              <p className='text-lg font-bold text-emerald-600'>
                {stats.create}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Edit className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Update</p>
              <p className='text-lg font-bold text-blue-600'>{stats.update}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center'>
              <Trash2 className='w-5 h-5 text-red-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Hapus</p>
              <p className='text-lg font-bold text-red-600'>{stats.delete}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder='Cari log aktivitas...'
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        selects={[
          {
            value: filterType,
            onChange: setFilterType,
            options: types,
            placeholder: 'Semua Tipe',
          },
        ]}
        showReset
        onReset={() => {
          setSearchQuery('');
          setFilterType('all');
          setDateFrom('');
          setDateTo('');
        }}
      />

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
                  Tipe
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  User
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Target
                </th>
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    Tidak ada log ditemukan
                  </td>
                </tr>
              ) : (
                logs.map((log: AuditLog) => (
                  <tr key={log.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <span className='text-gray-500'>
                          {getActionIcon(log.type)}
                        </span>
                        <span className='text-sm font-medium text-gray-800'>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getTypeColor(
                          log.type
                        )}`}
                      >
                        {types.find((c) => c.value === log.type)?.label ||
                          log.type}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {log.user.name}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600 max-w-xs truncate'>
                      {log.target}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between px-4 py-3 border-t border-gray-100'>
            <p className='text-sm text-gray-500'>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)} dari{' '}
              {totalLogs} log
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <div className='flex items-center gap-1'>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#E57373] text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className='p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
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
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                <span className='text-gray-500'>
                  {getActionIcon(selectedLog.type)}
                </span>
                <div>
                  <p className='font-medium text-gray-800'>
                    {selectedLog.action}
                  </p>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-lg ${getTypeColor(
                      selectedLog.type
                    )}`}
                  >
                    {types.find((c) => c.value === selectedLog.type)?.label}
                  </span>
                </div>
              </div>

              <div>
                <p className='text-xs text-gray-500 mb-1'>Waktu</p>
                <p className='text-sm font-medium text-gray-800'>
                  {new Date(selectedLog.createdAt).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <p className='text-xs text-gray-500 mb-1'>User</p>
                <p className='text-sm font-medium text-gray-800'>
                  {selectedLog.user.name}
                </p>
              </div>

              <div>
                <p className='text-xs text-gray-500 mb-1'>Target</p>
                <p className='text-sm text-gray-700 p-3 bg-gray-50 rounded-lg'>
                  {selectedLog.target}
                </p>
              </div>

              {selectedLog.metadata && (
                <div>
                  <p className='text-xs text-gray-500 mb-1'>Metadata</p>
                  <pre className='text-xs text-gray-700 p-3 bg-gray-50 rounded-lg overflow-auto max-h-64'>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
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

      {/* Export Date Range Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        size='sm'
      >
        <ModalHeader
          title='Download Audit Log'
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
