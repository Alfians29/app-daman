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
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { reportsAPI, jobTypesAPI, usersAPI, scheduleAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type ReportTask = {
  id: string;
  jobType: string;
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
  image: string | null;
  isActive: boolean;
};
type Schedule = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: string;
};

const CURRENT_USER_ID = 'user-2';

export default function ReportPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<Schedule[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [reportsRes, usersRes, schedRes, jobsRes] = await Promise.all([
      reportsAPI.getAll(),
      usersAPI.getAll(),
      scheduleAPI.getAll(),
      jobTypesAPI.getAll(),
    ]);
    if (reportsRes.success && reportsRes.data) setReports(reportsRes.data);
    if (usersRes.success && usersRes.data) {
      const activeUsers = usersRes.data.filter((u: TeamMember) => u.isActive);
      setTeamMembers(activeUsers);
      setCurrentUser(
        activeUsers.find((u: TeamMember) => u.id === CURRENT_USER_ID) ||
          activeUsers[0]
      );
    }
    if (schedRes.success && schedRes.data) setScheduleEntries(schedRes.data);
    if (jobsRes.success && jobsRes.data)
      setJobTypes(jobsRes.data.filter((j: JobType) => j.isActive));
    setIsLoading(false);
  };

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

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
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
    setTasks([...report.tasks]);
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
    if (tasks.some((t) => !t.jobType || !t.keterangan.trim())) {
      toast.error('Lengkapi semua pekerjaan!');
      return;
    }
    setIsSaving(true);
    try {
      if (editingReport) {
        const result = await reportsAPI.update(editingReport.id, { tasks });
        if (result.success) {
          toast.success('Report diupdate!');
          loadData();
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
          tasks,
        });
        if (result.success) {
          toast.success('Report ditambahkan!');
          loadData();
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
    const styles: Record<string, { bg: string; text: string }> = {
      PAGI: { bg: 'bg-blue-100', text: 'text-blue-700' },
      MALAM: { bg: 'bg-purple-100', text: 'text-purple-700' },
      PIKET_PAGI: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      PIKET_MALAM: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      LIBUR: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    return (
      styles[keterangan || ''] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    );
  };

  const getKeteranganLabel = (k: string) =>
    ({
      PAGI: 'Pagi',
      MALAM: 'Malam',
      PIKET_PAGI: 'Piket Pagi',
      PIKET_MALAM: 'Piket Malam',
      LIBUR: 'Libur',
    }[k] || k);

  const currentUserSchedule = currentUser
    ? getMemberSchedule(currentUser.id, selectedDate)
    : null;
  const isCurrentUserLibur = currentUserSchedule?.keterangan === 'LIBUR';
  const currentUserHasReport = currentUser
    ? hasReportForDate(currentUser.id, selectedDate)
    : true;

  if (isLoading)
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Report Harian'
        description='Laporan pekerjaan harian tim'
        icon={FileText}
        actions={
          !isCurrentUserLibur && !currentUserHasReport ? (
            <button
              onClick={openNewReportModal}
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
            >
              <Plus className='w-4 h-4' />
              Tambah Report
            </button>
          ) : undefined
        }
      />

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
              onClick={() =>
                setSelectedDate(new Date().toISOString().split('T')[0])
              }
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
                {memberReportData.filter((m) => !m.report && !m.isLibur).length}
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
                <Avatar src={member.image} name={member.name} size='md' />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <p className='font-medium text-gray-800'>{member.name}</p>
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
                      {report.tasks.map((task, idx) => (
                        <div key={task.id} className='flex items-start gap-2'>
                          <span className='text-xs text-gray-400 mt-1'>
                            {idx + 1}.
                          </span>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full'>
                                {task.jobType}
                              </span>
                              <span className='text-xs font-semibold text-emerald-600'>
                                {task.value} item
                              </span>
                            </div>
                            <p className='text-sm text-gray-700 mt-1'>
                              {task.keterangan}
                            </p>
                          </div>
                        </div>
                      ))}
                      <p className='text-xs text-gray-400 mt-2'>
                        Dibuat:{' '}
                        {new Date(report.createdAt).toLocaleString('id-ID')}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='md'>
        <ModalHeader
          title={editingReport ? 'Edit Report' : 'Tambah Report'}
          subtitle={formatDate(selectedDate)}
          onClose={() => setShowModal(false)}
        />
        <ModalBody>
          {currentUser && (
            <div className='flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl'>
              <Avatar
                src={currentUser.image}
                name={currentUser.name}
                size='sm'
              />
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
                      options={jobTypes.map((jt) => ({
                        value: jt.name,
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
