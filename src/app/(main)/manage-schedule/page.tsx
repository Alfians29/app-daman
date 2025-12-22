'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  CalendarCog,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/Skeleton';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Select } from '@/components/ui/Form';
import { scheduleAPI, usersAPI, shiftsAPI } from '@/lib/api';
import { getShiftColorClasses } from '@/lib/utils';

type Keterangan =
  | 'PAGI'
  | 'MALAM'
  | 'PIKET_PAGI'
  | 'PIKET_MALAM'
  | 'PAGI_MALAM'
  | 'LIBUR';

type Member = {
  id: string;
  nik: string;
  name: string;
  nickname: string | null;
  department: string;
  image: string | null;
  isActive: boolean;
};

type ScheduleEntry = {
  id: string;
  memberId: string;
  tanggal: string;
  keterangan: Keterangan;
};

// Default options (fallback if API fails)
const defaultKeteranganOptions: { value: Keterangan; label: string }[] = [
  { value: 'PAGI', label: 'Pagi' },
  { value: 'MALAM', label: 'Malam' },
  { value: 'PIKET_PAGI', label: 'Piket Pagi' },
  { value: 'PIKET_MALAM', label: 'Piket Malam' },
  { value: 'PAGI_MALAM', label: 'Pagi Malam' },
  { value: 'LIBUR', label: 'Libur' },
];

const defaultKeteranganLabels: Record<string, string> = {
  PAGI: 'Pagi',
  MALAM: 'Malam',
  PIKET_PAGI: 'Piket Pagi',
  PIKET_MALAM: 'Piket Malam',
  PAGI_MALAM: 'Pagi Malam',
  LIBUR: 'Libur',
};

export default function AdminSchedulePage() {
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [shiftColors, setShiftColors] = useState<Record<string, string | null>>(
    {}
  );
  const [shiftSettings, setShiftSettings] = useState<
    { shiftType: string; name: string; color: string | null }[]
  >([]);
  const [scheduleChanges, setScheduleChanges] = useState<
    Record<string, Keterangan>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMonth, setImportMonth] = useState(new Date().getMonth());
  const [importYear, setImportYear] = useState(new Date().getFullYear());

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const monthOptions = monthNames.map((name, index) => ({
    value: String(index),
    label: name,
  }));
  const yearOptions = [2024, 2025, 2026].map((year) => ({
    value: String(year),
    label: String(year),
  }));

  useEffect(() => {
    loadData();
  }, [currentStartDate]);

  const loadData = async () => {
    setIsLoading(true);
    const month = currentStartDate.getMonth() + 1;
    const year = currentStartDate.getFullYear();

    const [usersResult, scheduleResult] = await Promise.all([
      usersAPI.getAll(),
      scheduleAPI.getAll({ month, year }),
    ]);

    if (usersResult.success) {
      // Filter: Only show Data Management - TA for Schedule management
      const allUsers = usersResult.data as Member[];
      const filteredUsers = allUsers.filter(
        (m) => m.isActive && m.department === 'Data Management - TA'
      );
      // Sort by NIK
      filteredUsers.sort((a, b) => a.nik.localeCompare(b.nik));
      setMembers(filteredUsers);
    }
    if (scheduleResult.success) {
      setSchedules(scheduleResult.data as ScheduleEntry[]);
      // Get shift colors from API response
      const resultWithColors = scheduleResult as unknown as {
        shiftColors?: Record<string, string | null>;
      };
      if (resultWithColors.shiftColors) {
        setShiftColors(resultWithColors.shiftColors);
      }
    }
    // Fetch shift settings for dynamic options
    const shiftsResult = await shiftsAPI.getAll();
    if (shiftsResult.success && shiftsResult.data) {
      const shifts = shiftsResult.data as {
        shiftType: string;
        name: string;
        color: string | null;
        isActive: boolean;
      }[];
      setShiftSettings(shifts.filter((s) => s.isActive));
    }
    setIsLoading(false);
  };

  // Dynamic keteranganOptions from shift settings
  const keteranganOptions =
    shiftSettings.length > 0
      ? shiftSettings.map((s) => ({
          value: s.shiftType as Keterangan,
          label: s.name,
        }))
      : defaultKeteranganOptions;

  // Dynamic keteranganLabels from shift settings
  const keteranganLabels =
    shiftSettings.length > 0
      ? shiftSettings.reduce(
          (acc, s) => ({ ...acc, [s.shiftType]: s.name }),
          {} as Record<string, string>
        )
      : defaultKeteranganLabels;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const periodDates = getDaysInMonth(currentStartDate);

  const prevPeriod = () => {
    const newDate = new Date(currentStartDate);
    newDate.setMonth(currentStartDate.getMonth() - 1);
    setCurrentStartDate(newDate);
    setScheduleChanges({});
    setHasChanges(false);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentStartDate);
    newDate.setMonth(currentStartDate.getMonth() + 1);
    setCurrentStartDate(newDate);
    setScheduleChanges({});
    setHasChanges(false);
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    setCurrentStartDate(today);
  };

  const getPeriodLabel = () => {
    return currentStartDate.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getScheduleForMember = (memberId: string, date: Date) => {
    // Use local date format YYYY-MM-DD for comparison
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const key = `${memberId}-${dateStr}`;

    if (scheduleChanges[key]) {
      return { keterangan: scheduleChanges[key] };
    }

    const entry = schedules.find((s) => {
      // Extract date part directly from ISO string (first 10 characters)
      const entryDate = s.tanggal.substring(0, 10);
      return s.memberId === memberId && entryDate === dateStr;
    });

    return entry ? { keterangan: entry.keterangan } : null;
  };

  const handleCellClick = (member: Member, date: Date) => {
    setEditingMember(member);
    setEditingDate(date);
  };

  const handleScheduleChange = (keterangan: Keterangan) => {
    if (!editingMember || !editingDate) return;

    // Use local date format YYYY-MM-DD
    const dateStr = `${editingDate.getFullYear()}-${String(
      editingDate.getMonth() + 1
    ).padStart(2, '0')}-${String(editingDate.getDate()).padStart(2, '0')}`;
    const key = `${editingMember.id}-${dateStr}`;

    setScheduleChanges((prev) => ({ ...prev, [key]: keterangan }));
    setHasChanges(true);
    setEditingMember(null);
    setEditingDate(null);
  };

  const closeEditModal = () => {
    setEditingMember(null);
    setEditingDate(null);
  };

  const handleSaveChanges = async () => {
    const entries = Object.entries(scheduleChanges).map(([key, keterangan]) => {
      const [memberId, dateStr] = key.split('-').reduce<[string, string]>(
        (acc, part, i, arr) => {
          if (i < arr.length - 3) acc[0] += (acc[0] ? '-' : '') + part;
          else acc[1] += (acc[1] ? '-' : '') + part;
          return acc;
        },
        ['', '']
      );
      return { memberId, tanggal: dateStr, keterangan };
    });

    // Rebuild entries correctly
    const correctEntries = Object.entries(scheduleChanges).map(
      ([key, keterangan]) => {
        // Key format: memberId-YYYY-MM-DD
        const parts = key.split('-');
        const dateStr = parts.slice(-3).join('-'); // Last 3 parts are the date
        const memberId = parts.slice(0, -3).join('-'); // Everything before is memberId
        return { memberId, tanggal: dateStr, keterangan };
      }
    );

    startTransition(async () => {
      const result = await scheduleAPI.create(correctEntries);
      if (result.success) {
        toast.success('Jadwal berhasil disimpan!');
        setScheduleChanges({});
        setHasChanges(false);
        loadData();
      } else {
        toast.error(result.error || 'Gagal menyimpan jadwal');
      }
    });
  };

  const handleResetChanges = () => {
    setScheduleChanges({});
    setHasChanges(false);
  };

  const keteranganToShortCode = (keterangan: string) => {
    switch (keterangan) {
      case 'PAGI':
        return 'P';
      case 'MALAM':
        return 'M';
      case 'PIKET_PAGI':
        return 'PP';
      case 'PIKET_MALAM':
        return 'PM';
      case 'PAGI_MALAM':
        return 'P&M';
      case 'LIBUR':
        return 'L';
      default:
        return '';
    }
  };

  const handleExportSchedule = async () => {
    const XLSX = await import('xlsx');

    const dayNumbers = periodDates.map((date) => date.getDate().toString());
    const headers = ['NIK', 'NAMA', ...dayNumbers];

    const dataRows = members.map((member) => {
      const row: string[] = [member.nik, member.name];
      periodDates.forEach((date) => {
        const schedule = getScheduleForMember(member.id, date);
        row.push(schedule ? keteranganToShortCode(schedule.keterangan) : '');
      });
      return row;
    });

    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');

    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      ...periodDates.map(() => ({ wch: 4 })),
    ];

    const filename = `jadwal_${currentStartDate
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      .replace(' ', '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('File Excel jadwal berhasil didownload!');
  };

  const shortCodeToKeterangan = (
    code: string,
    date?: Date
  ): Keterangan | null => {
    const upperCode = code?.toUpperCase()?.trim();
    const isWeekendDay = date ? isWeekend(date) : false;

    switch (upperCode) {
      // Original short codes
      case 'P':
        return 'PAGI';
      case 'M':
        return 'MALAM';
      case 'PP':
        return 'PIKET_PAGI';
      case 'PM':
        return 'PIKET_MALAM';
      case 'P&M':
        return 'PAGI_MALAM';
      case 'L':
        return 'LIBUR';
      // New S1, S2, S3 codes
      case 'S1':
        return isWeekendDay ? 'PIKET_PAGI' : 'PAGI';
      case 'S2':
        return isWeekendDay ? 'PIKET_MALAM' : 'MALAM';
      case 'S3':
        return 'PAGI_MALAM';
      default:
        return null;
    }
  };

  const handleImportSchedule = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
      });

      if (jsonData.length < 2) {
        toast.error('File Excel kosong atau tidak valid.');
        setShowImportModal(false);
        return;
      }

      const headers = jsonData[0] as string[];
      const newChanges: Record<string, Keterangan> = {};
      let count = 0;

      const baseMonth = importMonth;
      const baseYear = importYear;

      const dayColumns: number[] = [];
      for (let i = 2; i < headers.length; i++) {
        const dayNum = parseInt(headers[i]);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          dayColumns.push(dayNum);
        }
      }

      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex] as string[];
        const nik = row[0]?.toString();
        const nama = row[1];

        const member = members.find(
          (m) =>
            m.nik === nik ||
            m.name?.toLowerCase() === nama?.toLowerCase() ||
            m.nickname?.toLowerCase() === nama?.toLowerCase()
        );

        if (member) {
          for (
            let colIndex = 2;
            colIndex < row.length && colIndex - 2 < dayColumns.length;
            colIndex++
          ) {
            const code = row[colIndex];
            const dayNum = dayColumns[colIndex - 2];
            const date = new Date(baseYear, baseMonth, dayNum);
            // Use local date format YYYY-MM-DD
            const dateStr = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const keterangan = shortCodeToKeterangan(code, date);

            if (keterangan) {
              newChanges[`${member.id}-${dateStr}`] = keterangan;
              count++;
            }
          }
        }
      }

      if (count > 0) {
        setScheduleChanges(newChanges);
        setHasChanges(true);
        setShowImportModal(false);
        toast.success(`${count} jadwal berhasil diupload!`);
      } else {
        toast.error('Tidak ada data jadwal yang valid dalam file.');
      }
    } catch {
      toast.error('Format file tidak valid.');
    }
    setShowImportModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getKeteranganStyle = (keterangan: string) => {
    // Use dynamic color from shift settings if available
    const shiftColor = shiftColors[keterangan];
    if (shiftColor) {
      const colorClasses = getShiftColorClasses(shiftColor);
      return `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`;
    }

    // Fallback to default colors
    switch (keterangan) {
      case 'PAGI':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MALAM':
        return 'bg-gray-200 text-gray-700 border-gray-300';
      case 'PIKET_PAGI':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PIKET_MALAM':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'LIBUR':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getKeteranganShort = (keterangan: string) => {
    return keteranganToShortCode(keterangan) || '-';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Kelola Jadwal'
        description='Edit jadwal kerja anggota tim per member atau per tanggal'
        icon={CalendarCog}
        actions={
          <>
            <button
              onClick={handleExportSchedule}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <Download className='w-4 h-4' />
              Download
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <Upload className='w-4 h-4' />
              Upload
            </button>
            {hasChanges && (
              <>
                <button
                  onClick={handleResetChanges}
                  className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
                >
                  <RotateCcw className='w-4 h-4' />
                  Reset
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isPending}
                  className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
                >
                  {isPending ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Save className='w-4 h-4' />
                  )}
                  Simpan
                </button>
              </>
            )}
          </>
        }
      />

      {/* Legend */}
      <div className='flex flex-wrap gap-3'>
        {keteranganOptions.map((ket) => (
          <div key={ket.value} className='flex items-center gap-2 text-sm'>
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${getKeteranganStyle(
                ket.value
              )}`}
            >
              {getKeteranganShort(ket.value)}
            </span>
            <span className='text-gray-600'>{ket.label}</span>
          </div>
        ))}
      </div>

      <Card>
        {/* Period Navigation */}
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={prevPeriod}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ChevronLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div className='text-center'>
            <p className='font-semibold text-gray-800'>{getPeriodLabel()}</p>
            <button
              onClick={goToToday}
              className='text-xs text-[#E57373] hover:underline'
            >
              Hari Ini
            </button>
          </div>
          <button
            onClick={nextPeriod}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ChevronRight className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        {hasChanges && (
          <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700'>
            <span className='font-medium'>
              {Object.keys(scheduleChanges).length} perubahan
            </span>{' '}
            belum disimpan. Klik "Simpan" untuk menyimpan perubahan.
          </div>
        )}

        {/* Schedule Table */}
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-2 px-2 text-sm font-medium text-gray-500 sticky left-0 bg-white min-w-[100px]'>
                  Member
                </th>
                {periodDates.map((date, index) => (
                  <th
                    key={index}
                    className={`text-center py-1 px-0.5 min-w-[24px] ${
                      isToday(date)
                        ? 'text-[#E57373] font-bold'
                        : isWeekend(date)
                        ? 'text-red-400 font-medium'
                        : 'text-gray-500 font-medium'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] mx-auto ${
                        isToday(date) ? 'bg-[#E57373] text-white' : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className='border-b border-gray-100 hover:bg-gray-50'
                >
                  <td className='py-3 px-2 sticky left-0 bg-white'>
                    <div className='flex items-center gap-2'>
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className='w-8 h-8 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-8 h-8 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center'>
                          <span className='text-xs font-bold text-white'>
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-gray-800 truncate'>
                          {member.nickname || member.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  {periodDates.map((date, index) => {
                    const schedule = getScheduleForMember(member.id, date);
                    // Use local date format YYYY-MM-DD
                    const dateStr = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, '0')}-${String(date.getDate()).padStart(
                      2,
                      '0'
                    )}`;
                    const cellKey = `${member.id}-${dateStr}`;
                    const isChanged = scheduleChanges[cellKey] !== undefined;

                    return (
                      <td
                        key={index}
                        className='text-center py-1 px-0.5 relative'
                      >
                        <button
                          onClick={() => handleCellClick(member, date)}
                          className={`inline-flex w-6 h-6 items-center justify-center rounded text-[10px] font-bold cursor-pointer transition-all hover:scale-110 hover:shadow-md ${
                            schedule
                              ? getKeteranganStyle(schedule.keterangan)
                              : 'bg-gray-50 text-gray-300 border border-dashed border-gray-200'
                          } ${isChanged ? 'ring-2 ring-amber-400' : ''}`}
                          title={
                            schedule
                              ? keteranganLabels[schedule.keterangan] ||
                                schedule.keterangan
                              : 'Belum ada jadwal'
                          }
                        >
                          {schedule
                            ? getKeteranganShort(schedule.keterangan)
                            : '+'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={!!editingMember && !!editingDate}
        onClose={closeEditModal}
        size='sm'
      >
        <ModalHeader
          title='Edit Jadwal'
          subtitle={
            editingMember && editingDate
              ? `${
                  editingMember.nickname || editingMember.name
                } - ${editingDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : ''
          }
          onClose={closeEditModal}
        />
        <ModalBody>
          <div className='space-y-2'>
            {keteranganOptions.map((ket) => {
              const currentSchedule =
                editingMember && editingDate
                  ? getScheduleForMember(editingMember.id, editingDate)
                  : null;
              return (
                <button
                  key={ket.value}
                  onClick={() => handleScheduleChange(ket.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg flex items-center gap-3 transition-colors ${
                    currentSchedule?.keterangan === ket.value
                      ? 'bg-gray-100 ring-2 ring-[#E57373]'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getKeteranganStyle(
                      ket.value
                    )}`}
                  >
                    {getKeteranganShort(ket.value)}
                  </span>
                  <span className='font-medium text-gray-700'>{ket.label}</span>
                </button>
              );
            })}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={closeEditModal}
            className='flex-1'
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        size='md'
      >
        <ModalHeader
          title='Upload Jadwal'
          subtitle='Import jadwal dari file Excel'
          onClose={() => setShowImportModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <div className='p-4 bg-emerald-50 border border-emerald-200 rounded-lg'>
              <p className='text-sm text-emerald-700'>
                <strong>Format file yang didukung:</strong> Excel (.xlsx, .xls)
              </p>
            </div>

            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-700 font-medium mb-3'>
                Pilih bulan untuk jadwal yang akan diupload:
              </p>
              <div className='flex gap-3'>
                <Select
                  value={String(importMonth)}
                  onChange={(e) => setImportMonth(parseInt(e.target.value))}
                  options={monthOptions}
                />
                <Select
                  value={String(importYear)}
                  onChange={(e) => setImportYear(parseInt(e.target.value))}
                  options={yearOptions}
                />
              </div>
            </div>

            <div className='border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#E57373] transition-colors'>
              <FileSpreadsheet className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600 mb-3'>
                Pilih file Excel untuk import
              </p>
              <label className='inline-flex items-center gap-2 px-4 py-2 bg-[#E57373] text-white rounded-lg cursor-pointer hover:bg-[#EF5350] transition-colors'>
                <Upload className='w-4 h-4' />
                Pilih File
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.xlsx,.xls'
                  onChange={handleImportSchedule}
                  className='hidden'
                />
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowImportModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
