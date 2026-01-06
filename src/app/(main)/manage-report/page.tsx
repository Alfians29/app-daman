'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  FileText,
  Edit3,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Settings,
  Check,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

import { SkeletonPage } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { FileCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsAPI, jobTypesAPI } from '@/lib/api';
import { getLocalDateString } from '@/lib/utils';
import { useUsers, useJobTypes, useReports } from '@/lib/swr-hooks';

type JobType = {
  id: string;
  name: string;
  isActive: boolean;
};

type ReportTask = {
  id: string;
  jobTypeId: string;
  jobType?: { id: string; name: string };
  keterangan: string;
  value: number;
};

type DailyReport = {
  id: string;
  memberId: string;
  tanggal: string;
  tasks: ReportTask[];
  member: { id: string; name: string; nickname: string | null };
  createdAt: string;
  updatedAt: string;
};

type Member = {
  id: string;
  name: string;
  nickname: string | null;
  image: string | null;
  position: string;
};

export default function AdminReportPage() {
  const [isPending, startTransition] = useTransition();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [editingTasks, setEditingTasks] = useState<
    Array<{ id: string; jobTypeId: string; keterangan: string; value: number }>
  >([]);

  const [activeTab, setActiveTab] = useState<'reports' | 'jobTypes'>('reports');

  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [jobTypeName, setJobTypeName] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(getLocalDateString());
  const [exportEndDate, setExportEndDate] = useState(getLocalDateString());
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(
    null
  );

  // SWR hooks for cached data
  const { users, isLoading: usersLoading } = useUsers();
  const {
    jobTypes: rawJobTypes,
    isLoading: jobsLoading,
    mutate: mutateJobTypes,
  } = useJobTypes();
  const {
    reports: rawReports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useReports();

  const isLoading = usersLoading || jobsLoading || reportsLoading;

  // Process data with useMemo
  const members = users as Member[];
  const reports = rawReports as DailyReport[];
  const jobTypes = rawJobTypes as JobType[];

  const activeJobTypes = useMemo(
    () => jobTypes.filter((jt) => jt.isActive),
    [jobTypes]
  );

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => r.tanggal.substring(0, 10) === selectedDate)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [reports, selectedDate]);

  const openEditModal = (report: DailyReport) => {
    setEditingReport(report);
    setEditingTasks(
      report.tasks.map((t) => ({
        id: t.id,
        jobTypeId: t.jobTypeId || t.jobType?.id || '',
        keterangan: t.keterangan,
        value: t.value,
      }))
    );
    setShowEditModal(true);
  };

  const addTask = () => {
    setEditingTasks([
      ...editingTasks,
      { id: `task-${Date.now()}`, jobTypeId: '', keterangan: '', value: 0 },
    ]);
  };

  const removeTask = (taskId: string) => {
    if (editingTasks.length === 1) {
      toast.error('Minimal harus ada 1 pekerjaan!');
      return;
    }
    setEditingTasks(editingTasks.filter((t) => t.id !== taskId));
  };

  const updateTask = (
    taskId: string,
    field: 'jobTypeId' | 'keterangan' | 'value',
    value: string | number
  ) => {
    setEditingTasks(
      editingTasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const saveReport = async () => {
    const hasEmptyTask = editingTasks.some(
      (t) => !t.jobTypeId || !t.keterangan.trim()
    );
    if (hasEmptyTask) {
      toast.error('Lengkapi semua jenis pekerjaan dan keterangannya!');
      return;
    }

    if (!editingReport) return;

    startTransition(async () => {
      const result = await reportsAPI.update(editingReport.id, {
        tasks: editingTasks.map((t) => ({
          jobTypeId: t.jobTypeId,
          keterangan: t.keterangan,
          value: t.value,
        })),
      });

      if (result.success) {
        toast.success('Report berhasil diupdate!');
        mutateReports();
        setShowEditModal(false);
        setEditingTasks([]);
        setEditingReport(null);
      } else {
        toast.error(result.error || 'Gagal mengupdate report');
      }
    });
  };

  const handleExport = async () => {
    // Filter reports by date range
    const exportReports = reports.filter((r) => {
      const reportDate = r.tanggal.substring(0, 10);
      return reportDate >= exportStartDate && reportDate <= exportEndDate;
    });

    const exportData: Array<Record<string, string | number>> = [];
    exportReports.forEach((r) => {
      r.tasks.forEach((task, idx) => {
        exportData.push({
          Tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'),
          Nama: r.member?.name || '-',
          No: idx + 1,
          'Jenis Pekerjaan': task.jobType?.name || '-',
          Value: task.value,
          Keterangan: task.keterangan,
          'Dibuat Pada': new Date(r.createdAt).toLocaleString('id-ID'),
        });
      });
    });

    if (exportFormat === 'csv') {
      // Export to CSV
      const headers = [
        'Tanggal',
        'Nama',
        'No',
        'Jenis Pekerjaan',
        'Value',
        'Keterangan',
        'Dibuat Pada',
      ];
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              let value = String(row[header] ?? '');
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
      link.download = `report_harian_${exportStartDate}_${exportEndDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('File CSV berhasil didownload!');
    } else {
      // Export to Excel
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report Harian');
      XLSX.writeFile(
        wb,
        `report_harian_${exportStartDate}_${exportEndDate}.xlsx`
      );
      toast.success('File Excel berhasil didownload!');
    }
    setShowExportModal(false);
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Job Type Management
  const openNewJobTypeModal = () => {
    setEditingJobType(null);
    setJobTypeName('');
    setShowJobTypeModal(true);
  };

  const openEditJobTypeModal = (jt: JobType) => {
    setEditingJobType(jt);
    setJobTypeName(jt.name);
    setShowJobTypeModal(true);
  };

  const saveJobType = async () => {
    if (!jobTypeName.trim()) {
      toast.error('Nama jenis pekerjaan tidak boleh kosong!');
      return;
    }

    startTransition(async () => {
      if (editingJobType) {
        const result = await jobTypesAPI.update(editingJobType.id, {
          name: jobTypeName,
        });
        if (result.success) {
          toast.success('Jenis pekerjaan berhasil diupdate!');
          mutateJobTypes();
        } else {
          toast.error(result.error || 'Gagal mengupdate');
        }
      } else {
        const result = await jobTypesAPI.create({ name: jobTypeName });
        if (result.success) {
          toast.success('Jenis pekerjaan berhasil ditambahkan!');
          mutateJobTypes();
        } else {
          toast.error(result.error || 'Gagal menambahkan');
        }
      }

      setShowJobTypeModal(false);
      setJobTypeName('');
      setEditingJobType(null);
    });
  };

  const toggleJobTypeActive = async (jtId: string) => {
    startTransition(async () => {
      const result = await jobTypesAPI.toggle(jtId);
      if (result.success) {
        mutateJobTypes();
      }
    });
  };

  const openDeleteModal = (report: DailyReport) => {
    setDeletingReport(report);
    setShowDeleteModal(true);
  };

  const deleteReport = async () => {
    if (!deletingReport) return;

    startTransition(async () => {
      const result = await reportsAPI.delete(deletingReport.id);
      if (result.success) {
        toast.success('Report berhasil dihapus!');
        mutateReports();
        setShowDeleteModal(false);
        setDeletingReport(null);
      } else {
        toast.error(result.error || 'Gagal menghapus report');
      }
    });
  };

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kelola Report'
        description='Kelola semua report harian tim dan jenis pekerjaan'
        icon={FileCog}
        actions={
          <>
            {activeTab === 'reports' && (
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
            )}
            {activeTab === 'jobTypes' && (
              <button
                onClick={openNewJobTypeModal}
                disabled={isPending}
                className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
              >
                <Plus className='w-4 h-4' />
                Tambah Jenis
              </button>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div className='flex gap-2'>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-[#E57373] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className='w-4 h-4 inline mr-2' />
          Report
        </button>
        <button
          onClick={() => setActiveTab('jobTypes')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'jobTypes'
              ? 'bg-[#E57373] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Settings className='w-4 h-4 inline mr-2' />
          Jenis Pekerjaan
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          <div className='grid grid-cols-2 gap-4'>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Total Report</p>
                  <p className='text-xl font-bold text-gray-800'>
                    {reports.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-emerald-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Report Hari Ini</p>
                  <p className='text-xl font-bold text-emerald-600'>
                    {filteredReports.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
              <div className='flex items-center gap-3 flex-1'>
                <Calendar className='w-5 h-5 text-[#E57373]' />
                <input
                  type='date'
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className='px-4 py-2 border border-gray-200 rounded-xl font-medium'
                />
                <span className='text-gray-600 font-medium hidden sm:block'>
                  {new Date(selectedDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setSelectedDate(getLocalDateString())}
                  className='px-3 py-2 text-sm font-medium text-[#E57373] bg-red-50 hover:bg-red-100 rounded-lg'
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => navigateDate(-1)}
                  className='p-2 hover:bg-gray-100 rounded-lg'
                >
                  <ChevronLeft className='w-5 h-5 text-gray-600' />
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className='p-2 hover:bg-gray-100 rounded-lg'
                >
                  <ChevronRight className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className='font-semibold text-gray-800 mb-4'>Daftar Report</h3>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Tanggal
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Member
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Pekerjaan
                    </th>
                    <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className='px-4 py-12 text-center text-gray-500'
                      >
                        <FileText className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                        <p>Tidak ada report ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const member = members.find(
                        (m) => m.id === report.memberId
                      );
                      return (
                        <tr key={report.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 text-sm text-gray-600'>
                            {formatDate(report.tanggal)}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              {member?.image ? (
                                <img
                                  src={member.image}
                                  alt={report.member?.name || '-'}
                                  className='w-8 h-8 rounded-full object-cover'
                                />
                              ) : (
                                <div className='w-8 h-8 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                                  <span className='text-xs font-bold text-white'>
                                    {(report.member?.name || 'U')
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className='text-sm font-medium text-gray-800'>
                                  {report.member?.name}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {member?.position}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            <div className='space-y-1'>
                              {report.tasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className='flex items-center gap-2'
                                >
                                  <span className='px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded'>
                                    {task.jobType?.name || '-'}
                                  </span>
                                  <span className='text-xs font-semibold text-emerald-600'>
                                    {task.value}
                                  </span>
                                  <span className='text-xs text-gray-600 truncate max-w-[200px]'>
                                    {task.keterangan}
                                  </span>
                                </div>
                              ))}
                              {report.tasks.length > 2 && (
                                <span className='text-xs text-gray-400'>
                                  +{report.tasks.length - 2} lainnya
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <button
                                onClick={() => openEditModal(report)}
                                disabled={isPending}
                                className='p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex disabled:opacity-50'
                              >
                                <Edit3 className='w-4 h-4 text-gray-500' />
                              </button>
                              <button
                                onClick={() => openDeleteModal(report)}
                                disabled={isPending}
                                className='p-2 hover:bg-red-100 rounded-lg transition-colors inline-flex disabled:opacity-50'
                              >
                                <Trash2 className='w-4 h-4 text-red-500' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Job Types Tab */}
      {activeTab === 'jobTypes' && (
        <Card>
          <h3 className='font-semibold text-gray-800 mb-4'>
            Daftar Jenis Pekerjaan ({jobTypes.length})
          </h3>
          <div className='space-y-2'>
            {jobTypes.map((jt) => (
              <div
                key={jt.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  jt.isActive
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      jt.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      jt.isActive ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {jt.name}
                  </span>
                  {!jt.isActive && (
                    <span className='text-xs text-gray-400'>(Nonaktif)</span>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => toggleJobTypeActive(jt.id)}
                    disabled={isPending}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      jt.isActive
                        ? 'hover:bg-gray-100 text-gray-500'
                        : 'hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <Check className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => openEditJobTypeModal(jt)}
                    disabled={isPending}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 disabled:opacity-50'
                  >
                    <Edit3 className='w-4 h-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Report Modal */}
      <Modal
        isOpen={showEditModal && !!editingReport}
        onClose={() => setShowEditModal(false)}
        size='md'
      >
        <ModalHeader
          title='Edit Report'
          subtitle={
            editingReport
              ? `${editingReport.member?.name} - ${formatDate(
                  editingReport.tanggal
                )}`
              : ''
          }
          onClose={() => setShowEditModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            {editingTasks.map((task, index) => (
              <div key={task.id} className='p-4 bg-gray-50 rounded-xl'>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-sm font-medium text-gray-700'>
                    Pekerjaan {index + 1}
                  </span>
                  {editingTasks.length > 1 && (
                    <button
                      onClick={() => removeTask(task.id)}
                      className='p-1 hover:bg-red-100 rounded-lg transition-colors text-red-500'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  )}
                </div>

                <Select
                  value={task.jobTypeId}
                  onChange={(e) =>
                    updateTask(task.id, 'jobTypeId', e.target.value)
                  }
                  options={[
                    { value: '', label: 'Pilih jenis pekerjaan...' },
                    ...activeJobTypes.map((jt) => ({
                      value: jt.id,
                      label: jt.name,
                    })),
                  ]}
                />

                <div className='mt-3'>
                  <Input
                    label='Jumlah/Value'
                    type='number'
                    value={task.value}
                    onChange={(e) =>
                      updateTask(
                        task.id,
                        'value',
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder='0'
                  />
                </div>

                <div className='mt-3'>
                  <Textarea
                    label='Keterangan'
                    value={task.keterangan}
                    onChange={(e) =>
                      updateTask(task.id, 'keterangan', e.target.value)
                    }
                    placeholder='Keterangan pekerjaan...'
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addTask}
            className='w-full mt-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-[#E57373] hover:text-[#E57373] transition-colors'
          >
            <Plus className='w-4 h-4' />
            Tambah Pekerjaan
          </button>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowEditModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={saveReport} disabled={isPending} className='flex-1'>
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'Update'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Job Type Modal */}
      <Modal
        isOpen={showJobTypeModal}
        onClose={() => setShowJobTypeModal(false)}
        size='sm'
      >
        <ModalHeader
          title={
            editingJobType ? 'Edit Jenis Pekerjaan' : 'Tambah Jenis Pekerjaan'
          }
          onClose={() => setShowJobTypeModal(false)}
        />
        <ModalBody>
          <Input
            label='Nama Jenis Pekerjaan'
            value={jobTypeName}
            onChange={(e) => setJobTypeName(e.target.value)}
            placeholder='Contoh: Meeting'
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowJobTypeModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={saveJobType} disabled={isPending} className='flex-1'>
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : editingJobType ? (
              'Update'
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
          title='Download Report Harian'
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

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingReport(null);
        }}
        onConfirm={deleteReport}
        title='Hapus Report'
        message={`Apakah Anda yakin ingin menghapus report dari "${
          deletingReport?.member?.name
        }" tanggal ${
          deletingReport
            ? new Date(deletingReport.tanggal).toLocaleDateString('id-ID')
            : ''
        }?`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
        isLoading={isPending}
      />
    </div>
  );
}
