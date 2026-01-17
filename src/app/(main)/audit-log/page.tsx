'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Monitor,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
import { useActivities } from '@/lib/swr-hooks';

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
  const [currentPage, setCurrentPage] = useState(1);

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

  // SWR hook for cached data with per-page caching
  const {
    activities,
    total,
    stats: rawStats,
    isLoading,
  } = useActivities({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    type: filterType !== 'all' ? filterType : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: debouncedSearch || undefined,
  });

  const logs = activities as AuditLog[];
  const totalLogs = total;

  const stats = useMemo(() => {
    return (
      rawStats || {
        total: 0,
        today: 0,
        create: 0,
        update: 0,
        delete: 0,
      }
    );
  }, [rawStats]);

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
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'DELETE':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      case 'LOGIN':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
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
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn'>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center'>
              <FileText className='w-6 h-6 text-gray-600 dark:text-gray-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Total Log
              </p>
              <p className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
                {stats.total}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
              <Plus className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Tambah</p>
              <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {stats.create}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
              <Edit className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Update</p>
              <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {stats.update}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center'>
              <Trash2 className='w-6 h-6 text-red-600 dark:text-red-400' />
            </div>
            <div>
              <p className='text-xs text-red-500 dark:text-red-400'>Hapus</p>
              <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                {stats.delete}
              </p>
            </div>
          </div>
        </Card>
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
      <div
        className='animate-fadeIn'
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
              Daftar Log Aktivitas
            </h3>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {totalLogs} log
            </span>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-800'>
                <tr>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Waktu
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Aksi
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Tipe
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    User
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Target
                  </th>
                  <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                    >
                      <ScrollText className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2' />
                      <p>Tidak ada log ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    >
                      <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-gray-500 dark:text-gray-400'>
                            {getActionIcon(log.type)}
                          </span>
                          <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
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
                      <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                        {log.user.name}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate'>
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
            <div className='flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
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
                            ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
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
        </Card>
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
                <span className='text-gray-500 dark:text-gray-400'>
                  {getActionIcon(selectedLog.type)}
                </span>
                <div>
                  <p className='font-medium text-gray-800 dark:text-white'>
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

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Waktu
                  </p>
                  <p className='text-sm font-medium text-gray-800 dark:text-white'>
                    {new Date(selectedLog.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    User
                  </p>
                  <p className='text-sm font-medium text-gray-800 dark:text-white'>
                    {selectedLog.user.name}
                  </p>
                </div>
              </div>

              <div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                  Target
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  {selectedLog.target}
                </p>
              </div>

              {/* Device & Location Info */}
              {(selectedLog.ipAddress || selectedLog.userAgent) && (
                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2'>
                  <p className='text-xs font-medium text-blue-700 dark:text-blue-300 mb-2'>
                    📍 Info Perangkat
                  </p>
                  {selectedLog.ipAddress && (
                    <div className='flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200'>
                      <Globe className='w-4 h-4' />
                      <span>IP: {selectedLog.ipAddress}</span>
                    </div>
                  )}
                  {selectedLog.userAgent && (
                    <div className='flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200'>
                      <Monitor className='w-4 h-4' />
                      <span className='truncate'>
                        {(() => {
                          const ua = selectedLog.userAgent;
                          if (ua.includes('Windows')) return '🖥️ Windows';
                          if (ua.includes('Mac')) return '🍎 macOS';
                          if (ua.includes('Android')) return '📱 Android';
                          if (ua.includes('iPhone') || ua.includes('iPad'))
                            return '📱 iOS';
                          if (ua.includes('Linux')) return '🐧 Linux';
                          return '💻 Unknown Device';
                        })()}
                        {selectedLog.userAgent.includes('Chrome') &&
                          ' • Chrome'}
                        {selectedLog.userAgent.includes('Firefox') &&
                          ' • Firefox'}
                        {selectedLog.userAgent.includes('Safari') &&
                          !selectedLog.userAgent.includes('Chrome') &&
                          ' • Safari'}
                        {selectedLog.userAgent.includes('Edge') && ' • Edge'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata - Only for CREATE, UPDATE, DELETE */}
              {selectedLog.metadata &&
                ['CREATE', 'UPDATE', 'DELETE'].includes(selectedLog.type) && (
                  <div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                      {selectedLog.type === 'UPDATE' && 'Perubahan'}
                      {selectedLog.type === 'CREATE' && 'Data Ditambahkan'}
                      {selectedLog.type === 'DELETE' && 'Data Dihapus'}
                    </p>
                    {(() => {
                      const meta = selectedLog.metadata as Record<
                        string,
                        unknown
                      >;

                      // UPDATE: Show diff table with only changed fields
                      if (selectedLog.type === 'UPDATE') {
                        // Handle batch summary (e.g., schedule sync)
                        if (meta.batchSummary) {
                          return (
                            <p className='text-sm font-medium text-amber-700 dark:text-amber-300 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                              📝 {String(meta.batchSummary)}
                            </p>
                          );
                        }

                        const before = meta.before as
                          | Record<string, unknown>
                          | undefined;
                        const after = meta.after as
                          | Record<string, unknown>
                          | undefined;

                        if (before && after) {
                          const allKeys = [
                            ...new Set([
                              ...Object.keys(before),
                              ...Object.keys(after),
                            ]),
                          ];
                          // Filter only changed fields
                          const changedKeys = allKeys.filter((key) => {
                            const prevVal = String(before[key] ?? '');
                            const nextVal = String(after[key] ?? '');
                            return prevVal !== nextVal;
                          });

                          if (changedKeys.length === 0) {
                            return (
                              <div className='space-y-2'>
                                {(meta as Record<string, unknown>).pembayar ? (
                                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                                    <span className='font-medium'>
                                      Pembayar:
                                    </span>{' '}
                                    {String(
                                      (meta as Record<string, unknown>).pembayar
                                    )}
                                  </p>
                                ) : null}
                                <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                                  Tidak ada perubahan data
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className='space-y-3'>
                              {(meta as Record<string, unknown>).pembayar ? (
                                <p className='text-sm text-gray-700 dark:text-gray-300 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                                  <span className='font-medium'>
                                    👤 Pembayar:
                                  </span>{' '}
                                  {String(
                                    (meta as Record<string, unknown>).pembayar
                                  )}
                                </p>
                              ) : null}
                              <div className='overflow-x-auto'>
                                <table className='w-full text-sm'>
                                  <thead className='bg-gray-100 dark:bg-gray-700'>
                                    <tr>
                                      <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400'>
                                        Field
                                      </th>
                                      <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400'>
                                        Sebelum
                                      </th>
                                      <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400'>
                                        Sesudah
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                                    {changedKeys.map((key) => {
                                      // Helper to format values, especially for tasks array
                                      const formatValue = (
                                        val: unknown
                                      ): string => {
                                        if (val === null || val === undefined)
                                          return '-';
                                        if (Array.isArray(val)) {
                                          // Format tasks array: [{jobType: 'PSB', value: 5}] => 'PSB: 5, ...'
                                          if (val.length === 0) return '-';
                                          return val
                                            .map((item) => {
                                              if (
                                                typeof item === 'object' &&
                                                item !== null
                                              ) {
                                                const obj = item as Record<
                                                  string,
                                                  unknown
                                                >;
                                                // For tasks: show jobType: value
                                                if (
                                                  'jobType' in obj &&
                                                  'value' in obj
                                                ) {
                                                  return `${obj.jobType}: ${obj.value}`;
                                                }
                                                // For other objects
                                                return JSON.stringify(obj);
                                              }
                                              return String(item);
                                            })
                                            .join(', ');
                                        }
                                        if (typeof val === 'object') {
                                          return JSON.stringify(val);
                                        }
                                        return String(val);
                                      };

                                      const prevVal = formatValue(before[key]);
                                      const nextVal = formatValue(after[key]);
                                      // Field label mapping for better readability
                                      const fieldLabels: Record<
                                        string,
                                        string
                                      > = {
                                        name: 'Nama',
                                        nickname: 'Nama Panggilan',
                                        nik: 'NIK',
                                        position: 'Posisi',
                                        roleId: 'Role ID',
                                        isActive: 'Status Aktif',
                                        image: 'Foto Profil',
                                        email: 'Email',
                                        phone: 'Telepon',
                                        usernameTelegram: 'Username Telegram',
                                        tasks: 'Pekerjaan',
                                      };
                                      const label = fieldLabels[key] || key;
                                      return (
                                        <tr
                                          key={key}
                                          className='bg-amber-50 dark:bg-amber-900/20'
                                        >
                                          <td className='px-3 py-2 font-medium text-gray-700 dark:text-gray-300'>
                                            {label}
                                          </td>
                                          <td className='px-3 py-2 text-red-600 dark:text-red-400 line-through'>
                                            {prevVal}
                                          </td>
                                          <td className='px-3 py-2 font-medium text-green-700 dark:text-green-400'>
                                            {nextVal} ✏️
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        }
                      }

                      // CREATE: Show added data
                      if (selectedLog.type === 'CREATE') {
                        const displayData =
                          meta.createdData || meta.newData || meta;
                        const entries = Object.entries(
                          displayData as Record<string, unknown>
                        ).filter(
                          ([key]) =>
                            ![
                              'before',
                              'after',
                              'password',
                              'reportId',
                            ].includes(key)
                        );

                        if (entries.length === 0) {
                          return (
                            <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                              Tidak ada data
                            </p>
                          );
                        }

                        // Helper to format values for CREATE
                        const formatCreateValue = (val: unknown): string => {
                          if (val === null || val === undefined) return '-';
                          if (Array.isArray(val)) {
                            if (val.length === 0) return '-';
                            return val
                              .map((item) => {
                                if (typeof item === 'object' && item !== null) {
                                  const obj = item as Record<string, unknown>;
                                  if ('jobType' in obj && 'value' in obj) {
                                    return `${obj.jobType}: ${obj.value}`;
                                  }
                                  return JSON.stringify(obj);
                                }
                                return String(item);
                              })
                              .join(', ');
                          }
                          if (typeof val === 'object') {
                            return JSON.stringify(val);
                          }
                          return String(val);
                        };

                        const fieldLabels: Record<string, string> = {
                          memberName: 'Member',
                          tasks: 'Pekerjaan',
                          name: 'Nama',
                          userId: 'User ID',
                          summary: '',
                          total: 'Total',
                        };

                        // If only summary exists, show it as simple text
                        if (
                          entries.length === 1 &&
                          entries[0][0] === 'summary'
                        ) {
                          return (
                            <p className='text-sm font-medium text-emerald-700 dark:text-emerald-300 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                              📝 {formatCreateValue(entries[0][1])}
                            </p>
                          );
                        }

                        return (
                          <div className='space-y-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                            {entries
                              .filter(
                                ([key]) =>
                                  key !== 'summary' || entries.length === 1
                              )
                              .map(([key, value]) => (
                                <div key={key} className='flex gap-2 text-sm'>
                                  {fieldLabels[key] !== '' && (
                                    <span className='text-gray-600 dark:text-gray-400 min-w-[100px]'>
                                      {fieldLabels[key] || key}:
                                    </span>
                                  )}
                                  <span className='font-medium text-emerald-700 dark:text-emerald-300'>
                                    {formatCreateValue(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        );
                      }

                      // DELETE: Show deleted data
                      if (selectedLog.type === 'DELETE') {
                        const displayData =
                          meta.deletedData || meta.removed || meta;
                        const entries = Object.entries(
                          displayData as Record<string, unknown>
                        ).filter(
                          ([key]) =>
                            !['before', 'after', 'password'].includes(key)
                        );

                        if (entries.length === 0) {
                          return (
                            <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                              Tidak ada data
                            </p>
                          );
                        }

                        return (
                          <div className='space-y-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                            {entries.map(([key, value]) => (
                              <div key={key} className='flex gap-2 text-sm'>
                                <span className='text-gray-600 dark:text-gray-400 min-w-[100px]'>
                                  {key}:
                                </span>
                                <span className='font-medium text-red-700 dark:text-red-300 line-through'>
                                  {String(value ?? '-')}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return null;
                    })()}
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
