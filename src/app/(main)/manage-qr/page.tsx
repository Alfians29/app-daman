'use client';

import { useState, useEffect, useTransition, useRef, useMemo } from 'react';
import {
  QrCode,
  Upload,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkeletonPage } from '@/components/ui/Skeleton';
import {
  ConfirmModal,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { qrAPI } from '@/lib/api';
import { useQR, useUsers } from '@/lib/swr-hooks';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/components/AuthGuard';
import * as XLSX from 'xlsx';

type QREntry = {
  id: string;
  qrId: string;
  nomorUrut: number;
  labelQr: string;
  uploadedBy: { id: string; name: string; nickname?: string } | null;
  createdAt: string;
};

type GroupedQR = {
  qrId: string;
  count: number;
  uploadedBy: string;
  createdAt: string;
  entries: QREntry[];
};

type PreviewData = {
  qrId: string;
  nomorUrut: number;
  labelQr: string;
};

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
};

export default function ManageQRPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedQR | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QREntry | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'group'>('single');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Upload preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const { user: currentUser } = useCurrentUser();
  const userRole = currentUser?.role?.name?.toLowerCase() || '';
  const canDelete = userRole === 'admin' || userRole === 'superadmin';

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // SWR hooks for cached data
  // Using slim mode for QR - member data joined client-side
  const { users, isLoading: usersLoading } = useUsers();
  const {
    qrEntries: rawQrEntries,
    total,
    totalQrIds,
    isLoading: qrLoading,
    mutate: mutateQR,
  } = useQR(currentPage, itemsPerPage, debouncedSearch);

  const isLoading = usersLoading || qrLoading;

  // Join uploadedBy data client-side (since slim mode skips relation)
  const memberMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; nickname?: string }
    >();
    (users as TeamMember[]).forEach((u) => {
      map.set(u.id, {
        id: u.id,
        name: u.name,
        nickname: u.nickname || undefined,
      });
    });
    return map;
  }, [users]);

  const entries = useMemo(() => {
    return (rawQrEntries as any[]).map((e) => ({
      ...e,
      uploadedBy: memberMap.get(e.uploadedById) || null,
    })) as QREntry[];
  }, [rawQrEntries, memberMap]);

  const totalCount = total;

  // Group entries by QR ID (for modal detail view only)
  const groupedData = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const existing = acc.find((g) => g.qrId === entry.qrId);
      if (existing) {
        existing.count++;
        existing.entries.push(entry);
      } else {
        acc.push({
          qrId: entry.qrId,
          count: 1,
          uploadedBy:
            entry.uploadedBy?.nickname || entry.uploadedBy?.name || '-',
          createdAt: entry.createdAt,
          entries: [entry],
        });
      }
      return acc;
    }, [] as GroupedQR[]);

    // Sort entries within each group by nomorUrut
    grouped.forEach((g) => {
      g.entries.sort((a, b) => a.nomorUrut - b.nomorUrut);
    });

    return grouped;
  }, [entries]);

  // Server-side pagination - groups are already filtered and paginated from API
  const totalPages = Math.ceil(totalQrIds / itemsPerPage);

  const openDetailModal = (group: GroupedQR) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('File harus format Excel (.xlsx atau .xls)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(
        worksheet,
        {
          header: 1,
        }
      );

      const parsed: PreviewData[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;

        const qrId = String(row[0] || '').trim();
        const nomorUrut = parseInt(String(row[1] || '0'));
        const labelQr = String(row[2] || '').trim();

        if (!qrId || !nomorUrut || !labelQr) continue;

        parsed.push({ qrId, nomorUrut, labelQr });
      }

      if (parsed.length === 0) {
        toast.error('Tidak ada data valid dalam file');
        return;
      }

      // Check max upload limit
      const MAX_UPLOAD_LIMIT = 5000;
      if (parsed.length > MAX_UPLOAD_LIMIT) {
        toast.error(
          `Maksimal ${MAX_UPLOAD_LIMIT} data per upload. File ini berisi ${parsed.length} data.`
        );
        return;
      }

      setPreviewData(parsed);
      setPreviewFile(file);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Gagal membaca file Excel');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = () => {
    if (!previewFile) return;

    startTransition(async () => {
      const result = await qrAPI.upload(previewFile);

      if (result.success) {
        toast.success(result.message || 'Berhasil mengupload data QR');
        mutateQR();
        setShowPreviewModal(false);
        setPreviewData([]);
        setPreviewFile(null);
      } else {
        toast.error(result.error || 'Gagal mengupload data QR');
      }
    });
  };

  const handleDeleteSingle = async () => {
    if (!selectedEntry) return;

    startTransition(async () => {
      const result = await qrAPI.delete(selectedEntry.id);

      if (result.success) {
        toast.success('Data QR berhasil dihapus');
        mutateQR();
        setShowDeleteModal(false);
        setSelectedEntry(null);
        // Update detail modal if open
        if (selectedGroup) {
          const updatedEntries = selectedGroup.entries.filter(
            (e) => e.id !== selectedEntry.id
          );
          if (updatedEntries.length === 0) {
            setShowDetailModal(false);
            setSelectedGroup(null);
          } else {
            setSelectedGroup({
              ...selectedGroup,
              entries: updatedEntries,
              count: updatedEntries.length,
            });
          }
        }
      } else {
        toast.error(result.error || 'Gagal menghapus data QR');
      }
    });
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId) return;

    const group = groupedData.find((g) => g.qrId === selectedGroupId);
    if (!group) return;

    startTransition(async () => {
      let success = true;
      for (const entry of group.entries) {
        const result = await qrAPI.delete(entry.id);
        if (!result.success) {
          success = false;
          break;
        }
      }

      if (success) {
        toast.success(`Semua data QR ID ${selectedGroupId} berhasil dihapus`);
        mutateQR();
        setShowDetailModal(false);
        setSelectedGroup(null);
      } else {
        toast.error('Gagal menghapus beberapa data');
      }
      setShowDeleteModal(false);
      setSelectedGroupId(null);
    });
  };

  const openDeleteSingleModal = (entry: QREntry) => {
    setSelectedEntry(entry);
    setDeleteMode('single');
    setShowDeleteModal(true);
  };

  const openDeleteGroupModal = (qrId: string) => {
    setSelectedGroupId(qrId);
    setDeleteMode('group');
    setShowDeleteModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kelola QR'
        description='Upload dan kelola data QR'
        icon={QrCode}
        actions={
          <>
            <input
              ref={fileInputRef}
              type='file'
              accept='.xlsx,.xls'
              onChange={handleFileChange}
              className='hidden'
            />
            <button
              onClick={handleUploadClick}
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Upload className='w-4 h-4' />
              )}
              Upload Excel
            </button>
          </>
        }
      />

      {/* Instructions Card */}
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4'>
        <div className='flex items-start gap-3'>
          <FileSpreadsheet className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
          <div>
            <p className='text-sm font-medium text-blue-800 dark:text-blue-300'>
              Format File Excel
            </p>
            <ul className='mt-1 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside'>
              <li>Kolom A: QR ID (contoh: 100192)</li>
              <li>Kolom B: Port ID (contoh: 1, 2, 3, ...)</li>
              <li>Kolom C: Label QR (contoh: T7D02KY4C3P6)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder='Cari QR ID atau Label...'
        showReset={searchQuery !== ''}
        onReset={() => {
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />

      {/* Table */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-800 dark:text-white'>
            Daftar QR ID
          </h3>
          <span className='text-sm text-gray-500'>
            {totalQrIds} QR ID, {totalCount} data
          </span>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  QR ID
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Jumlah Data
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Diupload Oleh
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Tanggal Upload
                </th>
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
              {groupedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                  >
                    <QrCode className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                    <p>
                      {searchQuery
                        ? 'Tidak ada data yang cocok dengan pencarian'
                        : 'Belum ada data QR. Upload file Excel untuk menambahkan data.'}
                    </p>
                  </td>
                </tr>
              ) : (
                groupedData.map((group: GroupedQR) => (
                  <tr
                    key={group.qrId}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <td className='px-4 py-3'>
                      <span className='text-sm font-bold text-gray-800 dark:text-white'>
                        {group.qrId}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                        {group.count} data
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                      {group.uploadedBy}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                      {formatDate(group.createdAt)}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openDetailModal(group)}
                          className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-white dark:hover:bg-blue-600/50 rounded-lg transition-colors'
                          title='Lihat Detail'
                        >
                          <Eye size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => openDeleteGroupModal(group.qrId)}
                            disabled={isPending}
                            className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-white dark:hover:bg-red-600/50 rounded-lg transition-colors disabled:opacity-50'
                            title='Hapus Semua'
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <p className='text-sm text-gray-500'>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <div className='flex gap-1'>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size='lg'
      >
        <ModalHeader
          title={`Detail QR ID: ${selectedGroup?.qrId}`}
          subtitle={`${selectedGroup?.count} data`}
          onClose={() => setShowDetailModal(false)}
        />
        <ModalBody>
          <div className='max-h-96 overflow-y-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 dark:bg-gray-700 sticky top-0'>
                <tr>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    QR ID
                  </th>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    Port ID
                  </th>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    Label QR
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                {selectedGroup?.entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-600'
                  >
                    <td className='px-3 py-2 font-mono text-gray-600 dark:text-gray-400'>
                      {selectedGroup.qrId}
                    </td>
                    <td className='px-3 py-2 font-medium'>{entry.nomorUrut}</td>
                    <td className='px-3 py-2'>
                      <span className='inline-flex px-3 py-1 text-sm font-mono font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'>
                        {entry.labelQr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowDetailModal(false)}
            className='flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors'
          >
            Tutup
          </button>
          {canDelete && (
            <button
              onClick={() => {
                if (selectedGroup) {
                  openDeleteGroupModal(selectedGroup.qrId);
                }
              }}
              disabled={isPending}
              className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50'
            >
              <Trash2 className='w-4 h-4' />
              Hapus Semua
            </button>
          )}
        </ModalFooter>
      </Modal>

      {/* Upload Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        size='lg'
      >
        <ModalHeader
          title='Preview Data Upload'
          subtitle={`${previewData.length} data akan diupload`}
          onClose={() => setShowPreviewModal(false)}
        />
        <ModalBody>
          <div className='max-h-96 overflow-y-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 dark:bg-gray-700 sticky top-0'>
                <tr>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    No
                  </th>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    QR ID
                  </th>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    Port ID
                  </th>
                  <th className='text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase'>
                    Label QR
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                {previewData.slice(0, 50).map((item, idx) => (
                  <tr key={idx}>
                    <td className='px-3 py-2 text-gray-500'>{idx + 1}</td>
                    <td className='px-3 py-2 font-medium'>{item.qrId}</td>
                    <td className='px-3 py-2'>{item.nomorUrut}</td>
                    <td className='px-3 py-2'>
                      <span className='inline-flex px-2 py-0.5 text-xs font-mono rounded bg-blue-100 text-blue-700'>
                        {item.labelQr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <p className='text-center text-sm text-gray-500 py-2'>
                ... dan {previewData.length - 50} data lainnya
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => {
              setShowPreviewModal(false);
              setPreviewData([]);
              setPreviewFile(null);
            }}
            disabled={isPending}
            className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors disabled:opacity-50'
          >
            <X className='w-4 h-4' />
            Batal
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={isPending}
            className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#E57373] hover:bg-[#EF5350] text-white font-medium rounded-xl transition-colors disabled:opacity-50'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Check className='w-4 h-4' />
            )}
            Upload {previewData.length} Data
          </button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEntry(null);
          setSelectedGroupId(null);
        }}
        onConfirm={
          deleteMode === 'single' ? handleDeleteSingle : handleDeleteGroup
        }
        title='Hapus Data QR'
        message={
          deleteMode === 'single'
            ? `Apakah Anda yakin ingin menghapus data QR "${selectedEntry?.qrId} - ${selectedEntry?.nomorUrut}" dengan label "${selectedEntry?.labelQr}"?`
            : `Apakah Anda yakin ingin menghapus SEMUA data dengan QR ID "${selectedGroupId}"? (${
                groupedData.find((g) => g.qrId === selectedGroupId)?.count || 0
              } data)`
        }
        confirmText='Hapus'
        variant='danger'
        isLoading={isPending}
      />
    </div>
  );
}
