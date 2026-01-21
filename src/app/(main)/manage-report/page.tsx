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
  BarChart3,
  RotateCcw,
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
  nik: string;
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

  const [activeTab, setActiveTab] = useState<
    'reports' | 'progress' | 'jobTypes'
  >('reports');

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

  // Progress tab date range state (applied filter) - null means show all data
  const [progressStartDate, setProgressStartDate] = useState<string | null>(
    null
  );
  const [progressEndDate, setProgressEndDate] = useState<string | null>(null);

  // Temporary input states for date filter (placeholder shows current month)
  const [tempStartDate, setTempStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [tempEndDate, setTempEndDate] = useState(getLocalDateString());

  // SWR hooks for cached data
  // Using slim mode for reports to reduce payload size
  const { users, isLoading: usersLoading } = useUsers(false);
  const {
    jobTypes: rawJobTypes,
    isLoading: jobsLoading,
    mutate: mutateJobTypes,
  } = useJobTypes();
  const {
    reports: rawReports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useReports(undefined, undefined, true); // slim mode

  const isLoading = usersLoading || jobsLoading || reportsLoading;

  // Process data with useMemo
  const members = users as Member[];

  // Join member data client-side (since slim mode skips member relation)
  const memberMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; nik: string; name: string; nickname: string | null }
    >();
    (users as Member[]).forEach((u) => {
      map.set(u.id, {
        id: u.id,
        nik: u.nik,
        name: u.name,
        nickname: u.nickname,
      });
    });
    return map;
  }, [users]);

  const reports = useMemo(() => {
    return (rawReports as any[]).map((r) => ({
      ...r,
      member: memberMap.get(r.memberId) || {
        id: r.memberId,
        name: 'Unknown',
        nickname: null,
      },
    })) as DailyReport[];
  }, [rawReports, memberMap]);

  const jobTypes = rawJobTypes as JobType[];

  const activeJobTypes = useMemo(
    () => jobTypes.filter((jt) => jt.isActive),
    [jobTypes]
  );

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => r.tanggal.substring(0, 10) === selectedDate)
      .sort((a, b) => {
        const nikA = memberMap.get(a.memberId)?.nik || '';
        const nikB = memberMap.get(b.memberId)?.nik || '';
        return nikA.localeCompare(nikB);
      });
  }, [reports, selectedDate, memberMap]);

  // Calculate total progress per user - grouped by user
  const progressData = useMemo(() => {
    // If filter is not applied (null), show all data
    const filtered =
      progressStartDate && progressEndDate
        ? reports.filter((r) => {
            const date = r.tanggal.substring(0, 10);
            return date >= progressStartDate && date <= progressEndDate;
          })
        : reports;

    // Group by memberId first, then by jobType
    const userMap = new Map<
      string,
      {
        memberId: string;
        memberName: string;
        jobs: Map<string, { jobTypeName: string; totalValue: number }>;
        totalValue: number;
        totalReports: number;
      }
    >();

    filtered.forEach((r) => {
      let user = userMap.get(r.memberId);
      if (!user) {
        user = {
          memberId: r.memberId,
          memberName: r.member?.name || 'Unknown',
          jobs: new Map(),
          totalValue: 0,
          totalReports: 0,
        };
        userMap.set(r.memberId, user);
      }
      user.totalReports += 1;

      r.tasks.forEach((task) => {
        const existingJob = user!.jobs.get(task.jobTypeId);
        if (existingJob) {
          existingJob.totalValue += task.value;
        } else {
          user!.jobs.set(task.jobTypeId, {
            jobTypeName: task.jobType?.name || '-',
            totalValue: task.value,
          });
        }
        user!.totalValue += task.value;
      });
    });

    // Convert to array and sort by total value descending
    return Array.from(userMap.values())
      .map((user) => ({
        memberId: user.memberId,
        memberName: user.memberName,
        totalValue: user.totalValue,
        totalReports: user.totalReports,
        jobs: Array.from(user.jobs.entries())
          .map(([jobTypeId, job]) => ({
            jobTypeId,
            jobTypeName: job.jobTypeName,
            totalValue: job.totalValue,
          }))
          .sort((a, b) => b.totalValue - a.totalValue),
      }))
      .sort((a, b) => b.totalValue - a.totalValue); // Sort by total value
  }, [reports, progressStartDate, progressEndDate]);

  // Summary stats for all users
  const allUsersSummary = useMemo(() => {
    const totalReports = progressData.reduce(
      (sum, u) => sum + u.totalReports,
      0
    );
    const totalValue = progressData.reduce((sum, u) => sum + u.totalValue, 0);

    // Job type leaderboard - include ALL active job types
    const jobMap = new Map<string, { name: string; value: number }>();

    // Initialize all active job types with 0 value
    activeJobTypes.forEach((jt) => {
      jobMap.set(jt.id, { name: jt.name, value: 0 });
    });

    // Aggregate values from progress data
    progressData.forEach((user) => {
      user.jobs.forEach((job) => {
        const existing = jobMap.get(job.jobTypeId);
        if (existing) {
          existing.value += job.totalValue;
        }
      });
    });

    const sortedJobs = Array.from(jobMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.value - a.value);

    // Build leaderboard with ranking
    let currentRank = 1;
    let prevValue: number | null = null;
    const leaderboard = sortedJobs.map((item, index) => {
      if (item.value === 0) {
        return { rank: null as number | null, ...item };
      }
      if (prevValue !== null && item.value === prevValue) {
        return { rank: currentRank, ...item };
      }
      currentRank = index + 1;
      prevValue = item.value;
      return { rank: currentRank, ...item };
    });

    const topJob = leaderboard[0] || null;

    return {
      totalReports,
      totalValue,
      topJob,
      leaderboard,
    };
  }, [progressData, activeJobTypes]);

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
      <div className='flex gap-2 animate-fadeIn'>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-[#E57373] dark:bg-[#7f1d1d] text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FileText className='w-4 h-4 inline mr-2' />
          Report
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'progress'
              ? 'bg-[#E57373] dark:bg-[#7f1d1d] text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <BarChart3 className='w-4 h-4 inline mr-2' />
          Progress
        </button>
        <button
          onClick={() => setActiveTab('jobTypes')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'jobTypes'
              ? 'bg-[#E57373] dark:bg-[#7f1d1d] text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <div className='w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Total Report
                  </p>
                  <p className='text-xl font-bold text-gray-800 dark:text-gray-100'>
                    {reports.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Report Hari Ini
                  </p>
                  <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
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
                <span className='text-gray-600 dark:text-gray-300 font-medium hidden sm:block'>
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
                  className='px-3 py-2 text-sm font-medium text-[#E57373] bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg'
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => navigateDate(-1)}
                  className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                >
                  <ChevronLeft className='w-5 h-5 text-gray-600' />
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                >
                  <ChevronRight className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className='font-semibold text-gray-800 dark:text-gray-100 mb-4'>
              Daftar Report
            </h3>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-gray-800'>
                  <tr>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Tanggal
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Member
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Pekerjaan
                    </th>
                    <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                      >
                        <FileText className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2' />
                        <p>Tidak ada report ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const member = members.find(
                        (m) => m.id === report.memberId
                      );
                      return (
                        <tr
                          key={report.id}
                          className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        >
                          <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
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
                                <p className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                  {report.member?.name}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
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
                                  <span className='px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded'>
                                    {task.jobType?.name || '-'}
                                  </span>
                                  <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                                    {task.value}
                                  </span>
                                  <span className='text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]'>
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
                                className='p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-white dark:hover:bg-blue-600/50 rounded-lg transition-colors inline-flex disabled:opacity-50'
                              >
                                <Edit3 className='w-4 h-4' />
                              </button>
                              <button
                                onClick={() => openDeleteModal(report)}
                                disabled={isPending}
                                className='p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-white dark:hover:bg-red-600/50 rounded-lg transition-colors inline-flex disabled:opacity-50'
                              >
                                <Trash2 className='w-4 h-4' />
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

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <>
          {/* Summary Stats - 3 Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Card className='h-full'>
              <div className='flex items-center gap-3 h-full'>
                <div className='w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0'>
                  <FileText className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Total Report
                  </p>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {allUsersSummary.totalReports}
                  </p>
                </div>
              </div>
            </Card>
            <Card className='h-full'>
              <div className='flex items-center gap-3 h-full'>
                <div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0'>
                  <BarChart3 className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Total Nilai
                  </p>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {allUsersSummary.totalValue.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </Card>
            <Card className='h-full'>
              <div className='flex items-center gap-3 h-full'>
                <div className='w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0'>
                  <Calendar className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Filter Periode
                  </p>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-2 flex-1'>
                      <input
                        type='date'
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className='w-full min-w-0 px-2 py-1 text-sm font-medium border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                      />
                      <span className='text-gray-400 dark:text-gray-500 shrink-0'>
                        -
                      </span>
                      <input
                        type='date'
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className='w-full min-w-0 px-2 py-1 text-sm font-medium border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                      />
                    </div>
                    {/* Smart button: Reset if filter active & dates match, otherwise Apply */}
                    {progressStartDate &&
                    progressEndDate &&
                    tempStartDate === progressStartDate &&
                    tempEndDate === progressEndDate ? (
                      <button
                        onClick={() => {
                          setProgressStartDate(null);
                          setProgressEndDate(null);
                        }}
                        title='Reset Filter'
                        className='w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-all shrink-0'
                      >
                        <RotateCcw className='w-4 h-4' />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setProgressStartDate(tempStartDate);
                          setProgressEndDate(tempEndDate);
                        }}
                        disabled={tempStartDate > tempEndDate}
                        title='Terapkan Filter'
                        className='w-8 h-8 flex items-center justify-center bg-[#E57373] dark:bg-[#7f1d1d] text-white hover:bg-[#EF5350] dark:hover:bg-[#991b1b] rounded-lg disabled:opacity-50 transition-all shrink-0'
                      >
                        <Check className='w-4 h-4' />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Job Type Leaderboard */}
          {allUsersSummary.leaderboard.length > 0 && (
            <Card>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center'>
                  <BarChart3 className='w-5 h-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                    Leaderboard Pekerjaan
                  </h3>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Ranking berdasarkan total nilai
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Left column */}
                <div className='space-y-2'>
                  {allUsersSummary.leaderboard
                    .slice(0, Math.ceil(allUsersSummary.leaderboard.length / 2))
                    .map((item) => {
                      const isTop3 = item.rank !== null && item.rank <= 3;
                      const isZero = item.rank === null;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 rounded-xl ${isTop3 ? 'p-3' : 'p-2'} ${
                            item.rank === 1
                              ? 'bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700'
                              : item.rank === 2
                                ? 'bg-linear-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border border-gray-200 dark:border-gray-600'
                                : item.rank === 3
                                  ? 'bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700'
                                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <div
                            className={`rounded-full flex items-center justify-center font-bold ${isTop3 ? 'w-10 h-10 text-lg' : 'w-7 h-7 text-sm'} ${
                              item.rank === 1
                                ? 'bg-amber-500 text-white'
                                : item.rank === 2
                                  ? 'bg-gray-400 text-white'
                                  : item.rank === 3
                                    ? 'bg-orange-400 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200'
                            }`}
                          >
                            {isZero ? '-' : item.rank}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p
                              className={`font-medium truncate ${isTop3 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200 text-sm'}`}
                            >
                              {item.name}
                            </p>
                            {isTop3 && (
                              <p
                                className={`text-lg font-bold ${item.rank === 1 ? 'text-amber-600' : item.rank === 2 ? 'text-gray-600' : 'text-orange-600'}`}
                              >
                                {item.value.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                          {!isTop3 && (
                            <p
                              className={`text-sm font-bold ${isZero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                              {item.value.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Right column */}
                <div className='space-y-2'>
                  {allUsersSummary.leaderboard
                    .slice(Math.ceil(allUsersSummary.leaderboard.length / 2))
                    .map((item) => {
                      const isZero = item.rank === null;
                      return (
                        <div
                          key={item.id}
                          className='flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                        >
                          <div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-200'>
                            {isZero ? '-' : item.rank}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-200 truncate'>
                              {item.name}
                            </p>
                          </div>
                          <p
                            className={`text-sm font-bold ${isZero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
                          >
                            {item.value.toLocaleString('id-ID')}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          )}

          {/* User Progress Table */}
          <Card>
            <h3 className='font-semibold text-gray-800 dark:text-gray-100 mb-4'>
              Rekap Per User
            </h3>
            <div className='space-y-3'>
              {progressData.length === 0 ? (
                <div className='py-12 text-center text-gray-500 dark:text-gray-400'>
                  <BarChart3 className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2' />
                  <p>Tidak ada data ditemukan</p>
                </div>
              ) : (
                progressData.map((user) => {
                  const member = members.find((m) => m.id === user.memberId);
                  return (
                    <div
                      key={user.memberId}
                      className='p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          {member?.image ? (
                            <img
                              src={member.image}
                              alt={user.memberName}
                              className='w-10 h-10 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-10 h-10 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                              <span className='text-sm font-bold text-white'>
                                {user.memberName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className='font-medium text-gray-800 dark:text-gray-100'>
                              {user.memberName}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              {user.totalReports} report • {user.jobs.length}{' '}
                              jenis pekerjaan
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Total Nilai
                          </p>
                          <p className='text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                            {user.totalValue.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        {user.jobs.map((job) => (
                          <div
                            key={job.jobTypeId}
                            className='flex items-center gap-2 py-1 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg'
                          >
                            <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                              {job.jobTypeName}
                            </span>
                            <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400'>
                              {job.totalValue.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </>
      )}

      {/* Job Types Tab */}
      {activeTab === 'jobTypes' && (
        <Card>
          <h3 className='font-semibold text-gray-800 dark:text-gray-100 mb-4'>
            Daftar Jenis Pekerjaan ({jobTypes.length})
          </h3>
          <div className='space-y-2'>
            {jobTypes.map((jt) => (
              <div
                key={jt.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  jt.isActive
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
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
                      jt.isActive
                        ? 'text-gray-800 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500'
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
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                        : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600'
                    }`}
                  >
                    <Check className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => openEditJobTypeModal(jt)}
                    disabled={isPending}
                    className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 disabled:opacity-50'
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
