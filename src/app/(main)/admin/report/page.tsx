'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Edit3,
  X,
  Download,
  Filter,
  Search,
  User,
  Plus,
  Trash2,
  Settings,
  Check,
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
import { Input, Select, Textarea } from '@/components/ui/Form';
import { FileCog } from 'lucide-react';
import {
  teamMembers,
  dailyReports,
  scheduleEntries,
  DailyReport,
  ReportTask,
  jobTypes as initialJobTypes,
  JobType,
} from '@/data/dummy';
import toast from 'react-hot-toast';

export default function AdminReportPage() {
  const [reports, setReports] = useState<DailyReport[]>(dailyReports);
  const [jobTypes, setJobTypes] = useState<JobType[]>(initialJobTypes);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [editingTasks, setEditingTasks] = useState<ReportTask[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'reports' | 'jobTypes'>('reports');

  // Job Type Management
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [jobTypeName, setJobTypeName] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterMember, setFilterMember] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get active job types for dropdown
  const activeJobTypes = jobTypes.filter((jt) => jt.isActive);

  // Get schedule for a member on a date
  const getMemberSchedule = (memberId: string, date: string) => {
    return scheduleEntries.find(
      (s) => s.memberId === memberId && s.tanggal === date
    );
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Filter by date
    if (filterDate) {
      result = result.filter((r) => r.tanggal === filterDate);
    }

    // Filter by member
    if (filterMember !== 'all') {
      result = result.filter((r) => r.memberId === filterMember);
    }

    // Search
    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.tasks.some(
            (t) =>
              t.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.jobType.toLowerCase().includes(searchQuery.toLowerCase())
          ) || r.memberName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date descending
    result.sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );

    return result;
  }, [reports, filterDate, filterMember, searchQuery]);

  // Open edit modal
  const openEditModal = (report: DailyReport) => {
    setEditingReport(report);
    setEditingTasks([...report.tasks]);
    setShowEditModal(true);
  };

  // Add new task
  const addTask = () => {
    setEditingTasks([
      ...editingTasks,
      { id: `task-${Date.now()}`, jobType: '', keterangan: '', value: 0 },
    ]);
  };

  // Remove task
  const removeTask = (taskId: string) => {
    if (editingTasks.length === 1) {
      toast.error('Minimal harus ada 1 pekerjaan!');
      return;
    }
    setEditingTasks(editingTasks.filter((t) => t.id !== taskId));
  };

  // Update task
  const updateTask = (
    taskId: string,
    field: 'jobType' | 'keterangan' | 'value',
    value: string | number
  ) => {
    setEditingTasks(
      editingTasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  // Save report
  const saveReport = () => {
    const hasEmptyTask = editingTasks.some(
      (t) => !t.jobType || !t.keterangan.trim()
    );
    if (hasEmptyTask) {
      toast.error('Lengkapi semua jenis pekerjaan dan keterangannya!');
      return;
    }

    if (editingReport) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === editingReport.id
            ? {
                ...r,
                tasks: editingTasks,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success('Report berhasil diupdate!');
    }

    setShowEditModal(false);
    setEditingTasks([]);
    setEditingReport(null);
  };

  // Export to Excel
  const handleExport = async () => {
    const XLSX = await import('xlsx');

    const exportData: Array<Record<string, string>> = [];
    filteredReports.forEach((r) => {
      const schedule = getMemberSchedule(r.memberId, r.tanggal);
      r.tasks.forEach((task, idx) => {
        exportData.push({
          Tanggal: r.tanggal,
          Nama: r.memberName,
          Jadwal: schedule?.keterangan || '-',
          No: String(idx + 1),
          'Jenis Pekerjaan': task.jobType,
          Value: String(task.value),
          Keterangan: task.keterangan,
          'Dibuat Pada': new Date(r.createdAt).toLocaleString('id-ID'),
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Harian');

    ws['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 5 },
      { wch: 18 },
      { wch: 50 },
      { wch: 20 },
    ];

    const filename = filterDate
      ? `report_harian_${filterDate}.xlsx`
      : 'report_harian_semua.xlsx';

    XLSX.writeFile(wb, filename);
    toast.success('File Excel berhasil didownload!');
  };

  // Reset filters
  const resetFilters = () => {
    setFilterDate('');
    setFilterMember('all');
    setSearchQuery('');
  };

  const hasActiveFilters = filterDate || filterMember !== 'all' || searchQuery;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  // Job Type Management Functions
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

  const saveJobType = () => {
    if (!jobTypeName.trim()) {
      toast.error('Nama jenis pekerjaan tidak boleh kosong!');
      return;
    }

    if (editingJobType) {
      // Update
      setJobTypes((prev) =>
        prev.map((jt) =>
          jt.id === editingJobType.id ? { ...jt, name: jobTypeName } : jt
        )
      );
      toast.success('Jenis pekerjaan berhasil diupdate!');
    } else {
      // Create new
      const newJobType: JobType = {
        id: `jt-${Date.now()}`,
        name: jobTypeName,
        isActive: true,
      };
      setJobTypes((prev) => [...prev, newJobType]);
      toast.success('Jenis pekerjaan berhasil ditambahkan!');
    }

    setShowJobTypeModal(false);
    setJobTypeName('');
    setEditingJobType(null);
  };

  const toggleJobTypeActive = (jtId: string) => {
    setJobTypes((prev) =>
      prev.map((jt) =>
        jt.id === jtId ? { ...jt, isActive: !jt.isActive } : jt
      )
    );
  };

  const deleteJobType = (jtId: string) => {
    setJobTypes((prev) =>
      prev.map((jt) => (jt.id === jtId ? { ...jt, isActive: false } : jt))
    );
    toast.success('Jenis pekerjaan berhasil dinonaktifkan!');
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <PageHeader
        title='Kelola Report'
        description='Kelola semua report harian tim dan jenis pekerjaan'
        icon={FileCog}
        actions={
          <>
            {activeTab === 'reports' && (
              <button
                onClick={handleExport}
                className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
              >
                <Download className='w-4 h-4' />
                Download
              </button>
            )}

            {activeTab === 'jobTypes' && (
              <button
                onClick={openNewJobTypeModal}
                className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
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
          {/* Summary Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
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
                <div className='w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center'>
                  <User className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Total Member</p>
                  <p className='text-xl font-bold text-purple-600'>
                    {teamMembers.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center'>
                  <Filter className='w-5 h-5 text-emerald-600' />
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Hasil Filter</p>
                  <p className='text-xl font-bold text-emerald-600'>
                    {filteredReports.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className='flex items-center gap-2 mb-4'>
              <Filter className='w-5 h-5 text-gray-400' />
              <h3 className='font-semibold text-gray-800'>Filter</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className='ml-auto text-xs text-[#E57373] hover:underline flex items-center gap-1'
                >
                  <X className='w-3 h-3' />
                  Reset
                </button>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Cari report...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <input
                  type='date'
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className='flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className='px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
              >
                <option value='all'>Semua Member</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Reports Table */}
          <Card>
            <h3 className='font-semibold text-gray-800 mb-4'>
              Daftar Report ({filteredReports.length})
            </h3>

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
                      Jadwal
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
                        colSpan={5}
                        className='px-4 py-12 text-center text-gray-500'
                      >
                        <div className='flex flex-col items-center'>
                          <FileText className='w-12 h-12 text-gray-300 mb-2' />
                          <p>Tidak ada report ditemukan</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const schedule = getMemberSchedule(
                        report.memberId,
                        report.tanggal
                      );
                      const member = teamMembers.find(
                        (m) => m.id === report.memberId
                      );

                      return (
                        <tr key={report.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 text-sm text-gray-600'>
                            {formatDate(report.tanggal)}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <Avatar
                                src={member?.image || ''}
                                name={report.memberName}
                                size='sm'
                              />
                              <div>
                                <p className='text-sm font-medium text-gray-800'>
                                  {report.memberName}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {member?.position}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            {schedule && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-lg ${
                                  getScheduleBadge(schedule.keterangan).bg
                                } ${
                                  getScheduleBadge(schedule.keterangan).text
                                }`}
                              >
                                {schedule.keterangan}
                              </span>
                            )}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='space-y-1'>
                              {report.tasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className='flex items-center gap-2'
                                >
                                  <span className='px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded'>
                                    {task.jobType}
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
                            <button
                              onClick={() => openEditModal(report)}
                              className='p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex'
                              title='Edit Report'
                            >
                              <Edit3 className='w-4 h-4 text-gray-500' />
                            </button>
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
                    className={`p-2 rounded-lg transition-colors ${
                      jt.isActive
                        ? 'hover:bg-gray-100 text-gray-500'
                        : 'hover:bg-emerald-100 text-emerald-600'
                    }`}
                    title={jt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    <Check className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => openEditJobTypeModal(jt)}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500'
                    title='Edit'
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
              ? `${editingReport.memberName} - ${formatDate(
                  editingReport.tanggal
                )}`
              : ''
          }
          onClose={() => setShowEditModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            {editingTasks.map((task, index) => (
              <div
                key={task.id}
                className='p-4 bg-gray-50 dark:bg-gray-700 rounded-xl'
              >
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
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
                  value={task.jobType}
                  onChange={(e) =>
                    updateTask(task.id, 'jobType', e.target.value)
                  }
                  options={[
                    { value: '', label: 'Pilih jenis pekerjaan...' },
                    ...activeJobTypes.map((jt) => ({
                      value: jt.name,
                      label: jt.name,
                    })),
                    ...(task.jobType &&
                    !activeJobTypes.some((jt) => jt.name === task.jobType)
                      ? [
                          {
                            value: task.jobType,
                            label: `${task.jobType} (Nonaktif)`,
                          },
                        ]
                      : []),
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
                    min={0}
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
          <Button onClick={saveReport} className='flex-1'>
            Update
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
          <Button onClick={saveJobType} className='flex-1'>
            {editingJobType ? 'Update' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
