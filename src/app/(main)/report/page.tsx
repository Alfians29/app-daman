'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Plus,
  Edit3,
  CheckCircle,
  Clock,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
} from '@/components/ui/Modal';
import {
  Select,
  Input,
  Textarea,
  FormGroup,
  FormSection,
} from '@/components/ui/Form';
import { reportsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/components/AuthGuard';
import { getLocalDateString, getShiftColorClasses } from '@/lib/utils';
import {
  useUsers,
  useShifts,
  useSchedule,
  useJobTypes,
  useReports,
  useUserReports,
} from '@/lib/swr-hooks';

type ReportTask = {
  id: string;
  jobType: string; // stores jobTypeId for form, or jobType.name for display
  jobTypeId?: string;
  keterangan: string;
  value: number;
};
type DailyReport = {
  id: string;
  memberId: string;
  memberName?: string;
  member?: { name: string };
  tanggal: string;
  tasks: ReportTask[];
  createdAt: string;
  updatedAt: string;
};
type JobType = { id: string; name: string; isActive: boolean };
type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  position: string;
  department: string;
  image: string | null;
  isActive: boolean;
};
type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

export default function ReportPage() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user: authUser, isLoading: authLoading } = useCurrentUser();
  const [showMyHistory, setShowMyHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 10;

  // Get current month/year for filtering
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dateFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const dateTo = `${currentYear}-${String(currentMonth).padStart(
    2,
    '0'
  )}-${String(lastDay).padStart(2, '0')}`;

  // SWR hooks for cached data
  const { users, isLoading: usersLoading } = useUsers();
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { schedules, isLoading: schedLoading } = useSchedule(
    currentMonth,
    currentYear
  );
  const { jobTypes: rawJobTypes, isLoading: jobsLoading } = useJobTypes();
  const {
    reports: rawReports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useReports(dateFrom, dateTo);

  const isLoading =
    authLoading ||
    usersLoading ||
    shiftsLoading ||
    schedLoading ||
    jobsLoading ||
    reportsLoading;

  // Process data with useMemo
  const teamMembers = useMemo(() => {
    return (users as TeamMember[]).filter(
      (u: TeamMember) => u.isActive && u.department === 'Data Management - TA'
    );
  }, [users]);

  const currentUser = useMemo(() => {
    if (!authUser?.id) return null;
    return (
      teamMembers.find((u: TeamMember) => u.id === authUser.id) ||
      teamMembers[0] ||
      null
    );
  }, [authUser, teamMembers]);

  const reports = rawReports as DailyReport[];
  const scheduleEntries = schedules as Schedule[];
  const jobTypes = useMemo(() => {
    return (rawJobTypes as JobType[]).filter((j: JobType) => j.isActive);
  }, [rawJobTypes]);

  const shiftSettings = useMemo(() => {
    return (
      shifts as {
        shiftType: string;
        name: string;
        color: string | null;
        isActive: boolean;
      }[]
    ).filter((s) => s.isActive);
  }, [shifts]);

  const getMemberSchedule = (memberId: string, date: string) =>
    scheduleEntries.find(
      (s) => s.memberId === memberId && s.tanggal.split('T')[0] === date
    );

  const canEditReport = (report: DailyReport) => {
    const createdAt = new Date(report.createdAt);
    const diffDays = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays < 3 && report.memberId === currentUser?.id;
  };

  const hasReportForDate = (memberId: string, date: string) =>
    reports.some(
      (r) => r.memberId === memberId && r.tanggal.split('T')[0] === date
    );

  const reportsForDate = useMemo(
    () => reports.filter((r) => r.tanggal.split('T')[0] === selectedDate),
    [reports, selectedDate]
  );

  const memberReportData = useMemo(() => {
    return teamMembers.map((member) => {
      const schedule = getMemberSchedule(member.id, selectedDate);
      const report = reportsForDate.find((r) => r.memberId === member.id);
      return {
        member,
        schedule,
        report,
        isLibur: schedule?.keterangan === 'LIBUR',
      };
    });
  }, [teamMembers, selectedDate, reportsForDate, scheduleEntries]);

  // Separate SWR hook for user's all-time report history
  const { reports: userAllReports, isLoading: userReportsLoading } =
    useUserReports(currentUser?.id);

  // Get current user's report history from dedicated hook (all-time data)
  const userReportsHistory = useMemo(() => {
    return (userAllReports as DailyReport[]).sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
  }, [userAllReports]);

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  };

  const openNewReportModal = () => {
    setEditingReport(null);
    setTasks([
      { id: `task-${Date.now()}`, jobType: '', keterangan: '', value: 0 },
    ]);
    setShowModal(true);
  };
  const openEditModal = (report: DailyReport) => {
    setEditingReport(report);
    // Map tasks to use jobTypeId in the jobType field for Select component
    const mappedTasks = report.tasks.map((t: any) => ({
      id: t.id,
      jobType: t.jobTypeId || t.jobType?.id || t.jobType, // Get the jobTypeId
      keterangan: t.keterangan,
      value: t.value,
    }));
    setTasks(mappedTasks);
    setShowModal(true);
  };
  const addTask = () =>
    setTasks([
      ...tasks,
      { id: `task-${Date.now()}`, jobType: '', keterangan: '', value: 0 },
    ]);
  const removeTask = (taskId: string) => {
    if (tasks.length === 1) {
      toast.error('Minimal 1 pekerjaan!');
      return;
    }
    setTasks(tasks.filter((t) => t.id !== taskId));
  };
  const updateTask = (
    taskId: string,
    field: 'jobType' | 'keterangan' | 'value',
    value: string | number
  ) =>
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );

  const saveReport = async () => {
    if (tasks.some((t) => !t.jobType)) {
      toast.error('Pilih jenis pekerjaan!');
      return;
    }
    setIsSaving(true);
    try {
      // Transform tasks: map jobType (which stores jobTypeId) to jobTypeId for API
      const apiTasks = tasks.map((t) => ({
        jobTypeId: t.jobType, // jobType field stores the ID
        keterangan: t.keterangan.trim() || '-',
        value: t.value,
      }));

      if (editingReport) {
        const result = await reportsAPI.update(editingReport.id, {
          tasks: apiTasks,
        });
        if (result.success) {
          toast.success('Report diupdate!');
          mutateReports();
        } else toast.error(result.error || 'Gagal update');
      } else {
        if (!currentUser || hasReportForDate(currentUser.id, selectedDate)) {
          toast.error('Sudah ada report!');
          setIsSaving(false);
          return;
        }
        const result = await reportsAPI.create({
          memberId: currentUser.id,
          tanggal: selectedDate,
          tasks: apiTasks,
        });
        if (result.success) {
          toast.success('Report ditambahkan!');
          mutateReports();
        } else toast.error(result.error || 'Gagal simpan');
      }
      setShowModal(false);
      setTasks([]);
      setEditingReport(null);
    } catch {
      toast.error('Error!');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const getScheduleBadge = (keterangan: string | undefined) => {
    if (!keterangan) return { bg: 'bg-gray-100', text: 'text-gray-700' };

    // Try to get color from shift settings
    const shiftSetting = shiftSettings.find((s) => s.shiftType === keterangan);
    if (shiftSetting?.color) {
      const colorClasses = getShiftColorClasses(shiftSetting.color);
      return { bg: colorClasses.bg, text: colorClasses.text };
    }

    // Fallback to default colors
    const defaultStyles: Record<string, { bg: string; text: string }> = {
      PAGI: { bg: 'bg-blue-100', text: 'text-blue-700' },
      MALAM: { bg: 'bg-purple-100', text: 'text-purple-700' },
      PIKET_PAGI: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      PIKET_MALAM: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      PAGI_MALAM: { bg: 'bg-amber-100', text: 'text-amber-700' },
      LIBUR: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    return (
      defaultStyles[keterangan] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    );
  };

  const getKeteranganLabel = (k: string) => {
    // Try to get name from shift settings
    const shiftSetting = shiftSettings.find((s) => s.shiftType === k);
    if (shiftSetting?.name) return shiftSetting.name;

    // Fallback to default names
    const defaultLabels: Record<string, string> = {
      PAGI: 'Pagi',
      MALAM: 'Malam',
      PIKET_PAGI: 'Piket Pagi',
      PIKET_MALAM: 'Piket Malam',
      PAGI_MALAM: 'Pagi & Malam',
      LIBUR: 'Libur',
    };
    return defaultLabels[k] || k;
  };

  const currentUserSchedule = currentUser
    ? getMemberSchedule(currentUser.id, selectedDate)
    : null;
  const isCurrentUserLibur = currentUserSchedule?.keterangan === 'LIBUR';
  const currentUserHasReport = currentUser
    ? hasReportForDate(currentUser.id, selectedDate)
    : true;

  if (isLoading) return <SkeletonPage />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Report Harian'
        description='Laporan pekerjaan harian tim'
        icon={FileText}
        actions={
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                setShowMyHistory(!showMyHistory);
                setHistoryPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                showMyHistory
                  ? 'bg-white text-[#E57373]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {showMyHistory ? 'Lihat Tim' : 'Riwayat Saya'}
            </button>
            {!showMyHistory && !isCurrentUserLibur && !currentUserHasReport && (
              <button
                onClick={openNewReportModal}
                className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
              >
                <Plus className='w-4 h-4' />
                Tambah Report
              </button>
            )}
          </div>
        }
      />

      {!showMyHistory && (
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
                {formatDate(selectedDate)}
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
      )}

      {/* My History View */}
      {showMyHistory ? (
        <>
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-800'>
                Riwayat Report Saya
              </h3>
              <span className='text-sm text-gray-500'>
                {userReportsHistory.length} data
              </span>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Tanggal
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Shift
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Pekerjaan
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Dibuat
                    </th>
                    <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {userReportsHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='px-4 py-12 text-center text-gray-500'
                      >
                        <FileText className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                        <p>Belum ada riwayat report</p>
                      </td>
                    </tr>
                  ) : (
                    userReportsHistory
                      .slice(
                        (historyPage - 1) * historyItemsPerPage,
                        historyPage * historyItemsPerPage
                      )
                      .map((report) => {
                        const schedule = currentUser
                          ? getMemberSchedule(
                              currentUser.id,
                              report.tanggal.split('T')[0]
                            )
                          : null;
                        return (
                          <tr key={report.id} className='hover:bg-gray-50'>
                            <td className='px-4 py-3 text-sm text-gray-700'>
                              {formatDate(report.tanggal)}
                            </td>
                            <td className='px-4 py-3'>
                              {schedule ? (
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                                    getScheduleBadge(schedule.keterangan).bg
                                  } ${
                                    getScheduleBadge(schedule.keterangan).text
                                  }`}
                                >
                                  {getKeteranganLabel(schedule.keterangan)}
                                </span>
                              ) : (
                                <span className='text-xs text-gray-400'>-</span>
                              )}
                            </td>
                            <td className='px-4 py-3'>
                              <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700'>
                                <FileText className='w-3 h-3' />
                                {report.tasks.length} pekerjaan
                              </span>
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-600'>
                              {new Date(report.createdAt).toLocaleTimeString(
                                'en-GB',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </td>
                            <td className='px-4 py-3 text-center'>
                              <button
                                onClick={() => {
                                  setViewingReport(report);
                                  setShowDetailModal(true);
                                }}
                                className='px-3 py-1.5 text-xs font-medium text-[#E57373] bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                              >
                                Lihat
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {Math.ceil(userReportsHistory.length / historyItemsPerPage) > 1 && (
              <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
                <p className='text-sm text-gray-500'>
                  Halaman {historyPage} dari{' '}
                  {Math.ceil(userReportsHistory.length / historyItemsPerPage)}
                </p>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
                  >
                    <ChevronLeft className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() =>
                      setHistoryPage((p) =>
                        Math.min(
                          Math.ceil(
                            userReportsHistory.length / historyItemsPerPage
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      historyPage ===
                      Math.ceil(userReportsHistory.length / historyItemsPerPage)
                    }
                    className='p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50'
                  >
                    <ChevronRight className='w-4 h-4' />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Total Report</p>
                  <p className='text-xl font-bold text-gray-800'>
                    {reportsForDate.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center'>
                  <CheckCircle className='w-5 h-5 text-emerald-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Sudah Report</p>
                  <p className='text-xl font-bold text-emerald-600'>
                    {reportsForDate.length}/{teamMembers.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center'>
                  <Clock className='w-5 h-5 text-amber-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Belum Report</p>
                  <p className='text-xl font-bold text-amber-600'>
                    {
                      memberReportData.filter((m) => !m.report && !m.isLibur)
                        .length
                    }
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center'>
                  <Coffee className='w-5 h-5 text-red-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Libur</p>
                  <p className='text-xl font-bold text-red-600'>
                    {memberReportData.filter((m) => m.isLibur).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className='font-semibold text-gray-800 mb-4'>
              Report Tim - {formatDate(selectedDate)}
            </h3>
            <div className='space-y-3'>
              {memberReportData.map(({ member, schedule, report, isLibur }) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-xl border ${
                    report
                      ? 'bg-white border-gray-200'
                      : isLibur
                      ? 'bg-red-50 border-red-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-10 h-10 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                        <span className='text-sm font-bold text-white'>
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <p className='font-medium text-gray-800'>
                          {member.name}
                        </p>
                        {schedule && (
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              getScheduleBadge(schedule.keterangan).bg
                            } ${getScheduleBadge(schedule.keterangan).text}`}
                          >
                            {getKeteranganLabel(schedule.keterangan)}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-gray-500 mb-2'>
                        {member.position}
                      </p>
                      {isLibur ? (
                        <div className='flex items-center gap-2 text-red-600'>
                          <Coffee className='w-4 h-4' />
                          <span className='text-sm font-medium'>Libur</span>
                        </div>
                      ) : report ? (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-sm text-gray-600'>
                              {report.tasks.length} pekerjaan
                            </span>
                            <button
                              onClick={() => {
                                setViewingReport(report);
                                setShowDetailModal(true);
                              }}
                              className='text-xs text-[#E57373] hover:underline'
                            >
                              Lihat Detail
                            </button>
                          </div>
                          <p className='text-xs text-gray-400'>
                            Dibuat:{' '}
                            {new Date(report.createdAt).toLocaleString('en-GB')}
                          </p>
                        </div>
                      ) : (
                        <div className='flex items-center gap-2 text-amber-600'>
                          <Clock className='w-4 h-4' />
                          <span className='text-sm'>Belum ada report</span>
                        </div>
                      )}
                    </div>
                    {report && canEditReport(report) && (
                      <button
                        onClick={() => openEditModal(report)}
                        className='p-2 hover:bg-gray-100 rounded-lg'
                      >
                        <Edit3 className='w-4 h-4 text-gray-500' />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Detail Report Modal */}
      <Modal
        isOpen={showDetailModal && !!viewingReport}
        onClose={() => setShowDetailModal(false)}
        size='md'
      >
        <ModalHeader
          title='Detail Report'
          subtitle={
            viewingReport
              ? `${viewingReport.member?.name || 'Member'} - ${formatDate(
                  viewingReport.tanggal
                )}`
              : ''
          }
          onClose={() => setShowDetailModal(false)}
        />
        <ModalBody>
          {viewingReport && (
            <div className='space-y-4'>
              {viewingReport.tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className='p-4 bg-gray-50 rounded-xl overflow-hidden'
                >
                  {/* Header row */}
                  <div className='flex items-center gap-2 mb-3 flex-wrap'>
                    <span className='w-6 h-6 shrink-0 rounded-full bg-[#E57373] text-white text-xs flex items-center justify-center font-medium'>
                      {idx + 1}
                    </span>
                    <span className='px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full'>
                      {typeof task.jobType === 'object'
                        ? (task.jobType as any).name
                        : task.jobType}
                    </span>
                    <span className='px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-full'>
                      {task.value} item
                    </span>
                  </div>
                  {/* Keterangan with proper word break */}
                  <div className='bg-white rounded-lg p-3 border border-gray-100'>
                    <p className='text-xs text-gray-500 mb-1'>Keterangan:</p>
                    <p className='text-sm text-gray-700 whitespace-pre-wrap break-all'>
                      {task.keterangan}
                    </p>
                  </div>
                </div>
              ))}
              <div className='pt-3 border-t border-gray-100'>
                <p className='text-xs text-gray-400'>
                  Dibuat:{' '}
                  {new Date(viewingReport.createdAt).toLocaleTimeString(
                    'en-GB',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }
                  )}
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
          {viewingReport && canEditReport(viewingReport) && (
            <Button
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(viewingReport);
              }}
              className='flex-1'
            >
              <Edit3 className='w-4 h-4 mr-2' />
              Edit
            </Button>
          )}
        </ModalFooter>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='md'>
        <ModalHeader
          title={editingReport ? 'Edit Report' : 'Tambah Report'}
          subtitle={formatDate(selectedDate)}
          onClose={() => setShowModal(false)}
        />
        <ModalBody>
          {currentUser && (
            <div className='flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl'>
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className='w-8 h-8 rounded-full object-cover'
                />
              ) : (
                <div className='w-8 h-8 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                  <span className='text-xs font-bold text-white'>
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className='font-medium text-gray-800'>{currentUser.name}</p>
                <p className='text-xs text-gray-500'>{currentUser.position}</p>
              </div>
            </div>
          )}
          <div className='space-y-4'>
            {tasks.map((task, index) => (
              <FormGroup key={task.id}>
                <FormSection
                  title={`Pekerjaan ${index + 1}`}
                  actions={
                    tasks.length > 1 ? (
                      <button
                        onClick={() => removeTask(task.id)}
                        className='p-1 hover:bg-red-100 rounded-lg text-red-500'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    ) : undefined
                  }
                >
                  <div className='space-y-3'>
                    <Select
                      value={task.jobType}
                      onChange={(e) =>
                        updateTask(task.id, 'jobType', e.target.value)
                      }
                      options={jobTypes
                        .filter((jt) => {
                          // Allow current task's selected jobType + unselected ones
                          const selectedJobTypes = tasks
                            .filter((t) => t.id !== task.id)
                            .map((t) => t.jobType);
                          return !selectedJobTypes.includes(jt.id);
                        })
                        .map((jt) => ({
                          value: jt.id,
                          label: jt.name,
                        }))}
                      placeholder='Pilih jenis pekerjaan...'
                    />
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
                      min={0}
                    />
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
                </FormSection>
              </FormGroup>
            ))}
          </div>
          <button
            onClick={addTask}
            className='w-full mt-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-[#E57373] hover:text-[#E57373]'
          >
            <Plus className='w-4 h-4' />
            Tambah Pekerjaan
          </button>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={saveReport} className='flex-1' disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : editingReport ? 'Update' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
