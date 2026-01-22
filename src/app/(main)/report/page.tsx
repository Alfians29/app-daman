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
  Trophy,
  BarChart3,
  RotateCcw,
  Check,
  AlertCircle,
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
  useUserSchedule,
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
  nik: string;
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
  const [summaryPeriod, setSummaryPeriod] = useState<
    '1bulan' | '6bulan' | 'semua'
  >('semua');
  const historyItemsPerPage = 10;

  // Progress-style date range filter (null = all data)
  const [progressStartDate, setProgressStartDate] = useState<string | null>(
    null,
  );
  const [progressEndDate, setProgressEndDate] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [tempEndDate, setTempEndDate] = useState(getLocalDateString());

  // Get current month/year for filtering
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dateFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const dateTo = `${currentYear}-${String(currentMonth).padStart(
    2,
    '0',
  )}-${String(lastDay).padStart(2, '0')}`;

  // SWR hooks for cached data
  // Using slim mode for schedule and reports to reduce payload size
  const { users, isLoading: usersLoading } = useUsers(false);
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { schedules, isLoading: schedLoading } = useSchedule(
    currentMonth,
    currentYear,
    true, // slim mode
  );
  const { jobTypes: rawJobTypes, isLoading: jobsLoading } = useJobTypes();
  const {
    reports: rawReports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useReports(dateFrom, dateTo, true); // slim mode

  const isLoading =
    authLoading ||
    usersLoading ||
    shiftsLoading ||
    schedLoading ||
    jobsLoading ||
    reportsLoading;

  // Process data with useMemo
  const teamMembers = useMemo(() => {
    return (users as TeamMember[])
      .filter(
        (u: TeamMember) =>
          u.isActive && u.department === 'Data Management - TA',
      )
      .sort((a, b) => a.nik.localeCompare(b.nik));
  }, [users]);

  const currentUser = useMemo(() => {
    if (!authUser?.id) return null;
    return (
      teamMembers.find((u: TeamMember) => u.id === authUser.id) ||
      teamMembers[0] ||
      null
    );
  }, [authUser, teamMembers]);

  // Join member data client-side (since slim mode skips member relation)
  const memberMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; nickname: string | null }
    >();
    (users as TeamMember[]).forEach((u) => {
      map.set(u.id, { id: u.id, name: u.name, nickname: u.nickname });
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
      (s) => s.memberId === memberId && s.tanggal.split('T')[0] === date,
    );

  // Separate SWR for user's all-time schedule (for history view)
  const { schedules: userSchedules, isLoading: userScheduleLoading } =
    useUserSchedule(currentUser?.id);

  // Get schedule from user's full history data for Riwayat Saya
  const getUserScheduleForHistory = (date: string) =>
    (userSchedules as Schedule[]).find((s) => s.tanggal.split('T')[0] === date);

  const canEditReport = (report: DailyReport) => {
    const createdAt = new Date(report.createdAt);
    const diffDays = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays < 3 && report.memberId === currentUser?.id;
  };

  const hasReportForDate = (memberId: string, date: string) =>
    reports.some(
      (r) => r.memberId === memberId && r.tanggal.split('T')[0] === date,
    );

  const reportsForDate = useMemo(
    () => reports.filter((r) => r.tanggal.split('T')[0] === selectedDate),
    [reports, selectedDate],
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
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
  }, [userAllReports]);

  // Type for history item (either a report or a missing report date)
  type HistoryItem =
    | { type: 'report'; data: DailyReport }
    | { type: 'missing'; date: string; schedule: Schedule };

  // Combined history: reports + missing report dates based on schedule
  const combinedHistory = useMemo((): HistoryItem[] => {
    const today = getLocalDateString();

    // Get all report dates for quick lookup
    const reportDates = new Set(
      userReportsHistory.map((r) => r.tanggal.substring(0, 10)),
    );

    // Get scheduled work days (not LIBUR) that don't have reports
    // Only include dates up to today (not future dates)
    const missingReportDates: HistoryItem[] = (userSchedules as Schedule[])
      .filter((s) => {
        const scheduleDate = s.tanggal.split('T')[0];
        // Only past or today, not LIBUR, and no report exists
        return (
          scheduleDate <= today &&
          s.keterangan !== 'LIBUR' &&
          !reportDates.has(scheduleDate)
        );
      })
      .map((s) => ({
        type: 'missing' as const,
        date: s.tanggal.split('T')[0],
        schedule: s,
      }));

    // Convert reports to HistoryItem
    const reportItems: HistoryItem[] = userReportsHistory.map((r) => ({
      type: 'report' as const,
      data: r,
    }));

    // Combine and sort by date (descending)
    const combined = [...reportItems, ...missingReportDates].sort((a, b) => {
      const dateA =
        a.type === 'report' ? a.data.tanggal.substring(0, 10) : a.date;
      const dateB =
        b.type === 'report' ? b.data.tanggal.substring(0, 10) : b.date;
      return dateB.localeCompare(dateA);
    });

    return combined;
  }, [userReportsHistory, userSchedules]);

  // Filtered history based on date range filter
  const filteredUserReportsHistory = useMemo((): HistoryItem[] => {
    if (!progressStartDate || !progressEndDate) {
      return combinedHistory; // No filter, return all
    }
    return combinedHistory.filter((item) => {
      const date =
        item.type === 'report' ? item.data.tanggal.substring(0, 10) : item.date;
      return date >= progressStartDate && date <= progressEndDate;
    });
  }, [combinedHistory, progressStartDate, progressEndDate]);

  // Personal summary stats
  const personalSummary = useMemo(() => {
    // Filter reports based on date range (null = all data)
    let filteredReports = userReportsHistory;

    if (progressStartDate && progressEndDate) {
      filteredReports = userReportsHistory.filter((r) => {
        const date = r.tanggal.substring(0, 10);
        return date >= progressStartDate && date <= progressEndDate;
      });
    }

    const totalReports = filteredReports.length;
    let totalValue = 0;

    // Initialize all active job types with 0 value
    const jobTypeMap: Record<string, { name: string; value: number }> = {};
    jobTypes.forEach((jt) => {
      jobTypeMap[jt.id] = { name: jt.name, value: 0 };
    });

    filteredReports.forEach((report) => {
      report.tasks.forEach((task) => {
        totalValue += task.value;
        const jobTypeId =
          typeof task.jobType === 'object'
            ? (task.jobType as any).id || (task as any).jobTypeId
            : (task as any).jobTypeId || task.jobType;

        if (jobTypeId && jobTypeMap[jobTypeId]) {
          jobTypeMap[jobTypeId].value += task.value;
        }
      });
    });

    // Create leaderboard with ranking
    const sortedJobTypes = Object.entries(jobTypeMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.value - a.value);

    let currentRank = 1;
    let prevValue: number | null = null;
    const leaderboard = sortedJobTypes.map((item, index) => {
      if (item.value === 0) {
        return { rank: null, ...item };
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
  }, [userReportsHistory, progressStartDate, progressEndDate, jobTypes]);

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
    value: string | number,
  ) =>
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
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
      PAGI: {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-700 dark:text-blue-300',
      },
      MALAM: {
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        text: 'text-purple-700 dark:text-purple-300',
      },
      PIKET_PAGI: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/40',
        text: 'text-emerald-700 dark:text-emerald-300',
      },
      PIKET_MALAM: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/40',
        text: 'text-indigo-700 dark:text-indigo-300',
      },
      PAGI_MALAM: {
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        text: 'text-amber-700 dark:text-amber-300',
      },
      LIBUR: {
        bg: 'bg-red-100 dark:bg-red-900/40',
        text: 'text-red-700 dark:text-red-300',
      },
    };
    return (
      defaultStyles[keterangan] || {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
      }
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
                className='px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl font-medium'
              />
              <span className='text-gray-600 dark:text-gray-300 font-medium hidden sm:block'>
                {formatDate(selectedDate)}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className='px-3 py-2 text-sm font-medium text-[#E57373] dark:text-[#EF9A9A] bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/60 hover:text-[#C62828] dark:hover:text-white rounded-lg transition-colors'
              >
                Hari Ini
              </button>
              <button
                onClick={() => navigateDate(-1)}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
              >
                <ChevronLeft className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              </button>
              <button
                onClick={() => navigateDate(1)}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
              >
                <ChevronRight className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* My History View */}
      {showMyHistory ? (
        <>
          {/* Personal Summary Stats - 3 Cards matching manage-report Progress */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn'>
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
                    {personalSummary.totalReports}
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
                    {personalSummary.totalValue.toLocaleString('id-ID')}
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

          {/* Personal Job Type Leaderboard */}
          {personalSummary.leaderboard.length > 0 && (
            <Card>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center'>
                  <Trophy className='w-5 h-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                    Leaderboard Pekerjaan Saya
                  </h3>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Ranking berdasarkan total nilai
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Left column */}
                <div className='space-y-2'>
                  {personalSummary.leaderboard
                    .slice(0, Math.ceil(personalSummary.leaderboard.length / 2))
                    .map((item) => {
                      const isTop3 = item.rank !== null && item.rank <= 3;
                      const isZero = item.rank === null;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 rounded-xl ${
                            isTop3 ? 'p-3' : 'p-2'
                          } ${
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
                            className={`rounded-full flex items-center justify-center font-bold ${
                              isTop3 ? 'w-10 h-10 text-lg' : 'w-7 h-7 text-sm'
                            } ${
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
                              className={`font-medium truncate ${
                                isTop3
                                  ? 'text-gray-800 dark:text-gray-100'
                                  : 'text-gray-700 dark:text-gray-200 text-sm'
                              }`}
                            >
                              {item.name}
                            </p>
                            {isTop3 && (
                              <p
                                className={`text-lg font-bold ${
                                  item.rank === 1
                                    ? 'text-amber-600'
                                    : item.rank === 2
                                      ? 'text-gray-600'
                                      : 'text-orange-600'
                                }`}
                              >
                                {item.value.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                          {!isTop3 && (
                            <p
                              className={`text-sm font-bold ${
                                isZero
                                  ? 'text-gray-400 dark:text-gray-500'
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}
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
                  {personalSummary.leaderboard
                    .slice(Math.ceil(personalSummary.leaderboard.length / 2))
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
                            className={`text-sm font-bold ${
                              isZero
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}
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

          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100'>
                Riwayat Report Saya
              </h3>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {filteredUserReportsHistory.length} data
              </span>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-gray-800'>
                  <tr>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Tanggal
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Shift
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Pekerjaan
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Dibuat
                    </th>
                    <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                  {filteredUserReportsHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                      >
                        <FileText className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2' />
                        <p>Belum ada riwayat report</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUserReportsHistory
                      .slice(
                        (historyPage - 1) * historyItemsPerPage,
                        historyPage * historyItemsPerPage,
                      )
                      .map((item, index) => {
                        if (item.type === 'missing') {
                          // Missing report row
                          return (
                            <tr
                              key={`missing-${item.date}`}
                              className='hover:bg-red-50/50 dark:hover:bg-red-900/20 bg-red-50/30 dark:bg-red-900/10'
                            >
                              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                                {formatDate(item.date)}
                              </td>
                              <td className='px-4 py-3'>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                                    getScheduleBadge(item.schedule.keterangan)
                                      .bg
                                  } ${
                                    getScheduleBadge(item.schedule.keterangan)
                                      .text
                                  }`}
                                >
                                  {getKeteranganLabel(item.schedule.keterangan)}
                                </span>
                              </td>
                              <td className='px-4 py-3'>
                                <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'>
                                  <AlertCircle className='w-3 h-3' />
                                  Belum Report
                                </span>
                              </td>
                              <td className='px-4 py-3 text-sm text-gray-400 dark:text-gray-500'>
                                -
                              </td>
                              <td className='px-4 py-3 text-center'>
                                <span className='text-xs text-gray-400 dark:text-gray-500'>
                                  -
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        // Report row
                        const report = item.data;
                        const schedule = getUserScheduleForHistory(
                          report.tanggal.split('T')[0],
                        );
                        return (
                          <tr
                            key={report.id}
                            className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          >
                            <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
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
                              <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'>
                                <FileText className='w-3 h-3' />
                                {report.tasks.length} pekerjaan
                              </span>
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                              {new Date(report.createdAt).toLocaleTimeString(
                                'en-GB',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </td>
                            <td className='px-4 py-3 text-center'>
                              <button
                                onClick={() => {
                                  setViewingReport(report);
                                  setShowDetailModal(true);
                                }}
                                className='px-3 py-1.5 text-xs font-medium text-[#E57373] dark:text-[#EF9A9A] bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/60 hover:text-[#C62828] dark:hover:text-white rounded-lg transition-colors'
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
            {Math.ceil(combinedHistory.length / historyItemsPerPage) > 1 && (
              <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Halaman {historyPage} dari{' '}
                  {Math.ceil(
                    filteredUserReportsHistory.length / historyItemsPerPage,
                  )}
                </p>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                  >
                    <ChevronLeft className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() =>
                      setHistoryPage((p) =>
                        Math.min(
                          Math.ceil(
                            filteredUserReportsHistory.length /
                              historyItemsPerPage,
                          ),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      historyPage ===
                      Math.ceil(
                        filteredUserReportsHistory.length / historyItemsPerPage,
                      )
                    }
                    className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
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
                <div className='w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Total Report
                  </p>
                  <p className='text-xl font-bold text-gray-800 dark:text-gray-100'>
                    {reportsForDate.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                  <CheckCircle className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Sudah Report
                  </p>
                  <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {reportsForDate.length}/{teamMembers.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center'>
                  <Clock className='w-5 h-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Belum Report
                  </p>
                  <p className='text-xl font-bold text-amber-600 dark:text-amber-400'>
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
                <div className='w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center'>
                  <Coffee className='w-5 h-5 text-red-600 dark:text-red-400' />
                </div>
                <div>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Libur
                  </p>
                  <p className='text-xl font-bold text-red-600 dark:text-red-400'>
                    {memberReportData.filter((m) => m.isLibur).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className='font-semibold text-gray-800 dark:text-gray-100 mb-4'>
              Report Tim - {formatDate(selectedDate)}
            </h3>
            <div className='space-y-3'>
              {memberReportData.map(({ member, schedule, report, isLibur }) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-xl border ${
                    report
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : isLibur
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
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
                        <p className='font-medium text-gray-800 dark:text-gray-100'>
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
                      <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
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
                            <span className='text-sm text-gray-600 dark:text-gray-400'>
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
                          <p className='text-xs text-gray-400 dark:text-gray-500'>
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
                        className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
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
                  viewingReport.tanggal,
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
                    <span className='px-3 py-1 text-sm font-medium bg-blue-100 text-blue-600 dark:text-blue-400 rounded-full'>
                      {typeof task.jobType === 'object'
                        ? (task.jobType as any).name
                        : task.jobType}
                    </span>
                    <span className='px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-full'>
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
                    },
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
                          parseInt(e.target.value) || 0,
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
