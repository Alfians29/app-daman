'use client';

import { useState, useMemo } from 'react';
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
import {
  teamMembers,
  dailyReports,
  scheduleEntries,
  DailyReport,
  ReportTask,
  jobTypes,
} from '@/data/dummy';
import toast from 'react-hot-toast';

// Simulated current user (logged in user)
const currentUser = teamMembers[1]; // Muhammad Alfian

export default function ReportPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reports, setReports] = useState<DailyReport[]>(dailyReports);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [tasks, setTasks] = useState<ReportTask[]>([]);

  // Get active job types for dropdown
  const activeJobTypes = jobTypes.filter((jt) => jt.isActive);

  // Get schedule for a member on selected date
  const getMemberSchedule = (memberId: string, date: string) => {
    return scheduleEntries.find(
      (s) => s.memberId === memberId && s.tanggal === date
    );
  };

  // Check if user can edit a report (within 3 days)
  const canEditReport = (report: DailyReport) => {
    const createdAt = new Date(report.createdAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays < 3 && report.memberId === currentUser.id;
  };

  // Check if user already has report for selected date
  const hasReportForDate = (memberId: string, date: string) => {
    return reports.some((r) => r.memberId === memberId && r.tanggal === date);
  };

  // Get reports for selected date
  const reportsForDate = useMemo(() => {
    return reports.filter((r) => r.tanggal === selectedDate);
  }, [reports, selectedDate]);

  // Get member report data with schedule info
  const memberReportData = useMemo(() => {
    return teamMembers.map((member) => {
      const schedule = getMemberSchedule(member.id, selectedDate);
      const report = reportsForDate.find((r) => r.memberId === member.id);
      return {
        member,
        schedule,
        report,
        isLibur: schedule?.keterangan === 'Libur',
      };
    });
  }, [selectedDate, reportsForDate]);

  // Navigate date
  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Open modal for new report
  const openNewReportModal = () => {
    setEditingReport(null);
    setTasks([
      { id: `task-${Date.now()}`, jobType: '', keterangan: '', value: 0 },
    ]);
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (report: DailyReport) => {
    setEditingReport(report);
    setTasks([...report.tasks]);
    setShowModal(true);
  };

  // Add new task
  const addTask = () => {
    setTasks([
      ...tasks,
      { id: `task-${Date.now()}`, jobType: '', keterangan: '', value: 0 },
    ]);
  };

  // Remove task
  const removeTask = (taskId: string) => {
    if (tasks.length === 1) {
      toast.error('Minimal harus ada 1 pekerjaan!');
      return;
    }
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  // Update task
  const updateTask = (
    taskId: string,
    field: 'jobType' | 'keterangan' | 'value',
    value: string | number
  ) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  // Save report
  const saveReport = () => {
    // Validate tasks
    const hasEmptyTask = tasks.some((t) => !t.jobType || !t.keterangan.trim());
    if (hasEmptyTask) {
      toast.error('Lengkapi semua jenis pekerjaan dan keterangannya!');
      return;
    }

    if (editingReport) {
      // Update existing report
      setReports((prev) =>
        prev.map((r) =>
          r.id === editingReport.id
            ? {
                ...r,
                tasks,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success('Report berhasil diupdate!');
    } else {
      // Check if already has report for the date
      if (hasReportForDate(currentUser.id, selectedDate)) {
        toast.error('Anda sudah memiliki report untuk tanggal ini!');
        return;
      }

      // Create new report
      const newReport: DailyReport = {
        id: `report-${Date.now()}`,
        memberId: currentUser.id,
        memberName: currentUser.name,
        tanggal: selectedDate,
        tasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setReports((prev) => [...prev, newReport]);
      toast.success('Report berhasil ditambahkan!');
    }

    setShowModal(false);
    setTasks([]);
    setEditingReport(null);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get schedule badge style
  const getScheduleBadge = (keterangan: string | undefined) => {
    switch (keterangan) {
      case 'Pagi':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'Malam':
        return { bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'Piket Pagi':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'Piket Malam':
        return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
      case 'Libur':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  // Check if current user's schedule is Libur
  const currentUserSchedule = getMemberSchedule(currentUser.id, selectedDate);
  const isCurrentUserLibur = currentUserSchedule?.keterangan === 'Libur';
  const currentUserHasReport = hasReportForDate(currentUser.id, selectedDate);

  return (
    <div className='space-y-6'>
      {/* Page Header */}
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

      {/* Date Navigation */}
      <Card>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          {/* Date Picker */}
          <div className='flex items-center gap-3 flex-1'>
            <Calendar className='w-5 h-5 text-[#E57373]' />
            <input
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className='px-4 py-2 border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373] cursor-pointer'
            />
            <span className='text-gray-600 font-medium hidden sm:block'>
              {formatDate(selectedDate)}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className='flex items-center gap-2'>
            <button
              onClick={() =>
                setSelectedDate(new Date().toISOString().split('T')[0])
              }
              className='px-3 py-2 text-sm font-medium text-[#E57373] bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
            >
              Hari Ini
            </button>
            <button
              onClick={() => navigateDate(-1)}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title='Hari sebelumnya'
            >
              <ChevronLeft className='w-5 h-5 text-gray-600' />
            </button>
            <button
              onClick={() => navigateDate(1)}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title='Hari berikutnya'
            >
              <ChevronRight className='w-5 h-5 text-gray-600' />
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
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

      {/* Reports List */}
      <Card>
        <h3 className='font-semibold text-gray-800 mb-4'>
          Report Tim - {formatDate(selectedDate)}
        </h3>

        <div className='space-y-3'>
          {memberReportData.map(({ member, schedule, report, isLibur }) => (
            <div
              key={member.id}
              className={`p-4 rounded-xl border transition-all ${
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
                        {schedule.keterangan}
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 mb-2'>
                    {member.position}
                  </p>

                  {isLibur ? (
                    <div className='flex items-center gap-2 text-red-600'>
                      <Coffee className='w-4 h-4' />
                      <span className='text-sm font-medium'>
                        Libur - Tidak ada report
                      </span>
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
                        {report.updatedAt !== report.createdAt && (
                          <span>
                            {' '}
                            • Diupdate:{' '}
                            {new Date(report.updatedAt).toLocaleString('id-ID')}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-amber-600'>
                      <Clock className='w-4 h-4' />
                      <span className='text-sm'>Belum ada report</span>
                    </div>
                  )}
                </div>

                {/* Edit button for own report within 3 days */}
                {report && canEditReport(report) && (
                  <button
                    onClick={() => openEditModal(report)}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    title='Edit Report'
                  >
                    <Edit3 className='w-4 h-4 text-gray-500' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add/Edit Report Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='md'>
        <ModalHeader
          title={editingReport ? 'Edit Report' : 'Tambah Report'}
          subtitle={formatDate(selectedDate)}
          onClose={() => setShowModal(false)}
        />
        <ModalBody>
          <div className='flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl'>
            <Avatar src={currentUser.image} name={currentUser.name} size='sm' />
            <div>
              <p className='font-medium text-gray-800'>{currentUser.name}</p>
              <p className='text-xs text-gray-500'>{currentUser.position}</p>
            </div>
          </div>

          {/* Tasks List */}
          <div className='space-y-4'>
            {tasks.map((task, index) => (
              <FormGroup key={task.id}>
                <FormSection
                  title={`Pekerjaan ${index + 1}`}
                  actions={
                    tasks.length > 1 ? (
                      <button
                        onClick={() => removeTask(task.id)}
                        className='p-1 hover:bg-red-100 rounded-lg transition-colors text-red-500'
                        title='Hapus pekerjaan'
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
                      options={activeJobTypes.map((jt) => ({
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

          {/* Add Task Button */}
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
            onClick={() => setShowModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={saveReport} className='flex-1'>
            {editingReport ? 'Update' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
