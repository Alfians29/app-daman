'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { teamMembers, attendanceRecords, AttendanceRecord } from '@/data/dummy';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react';

type Keterangan = 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';

const keteranganOptions: Keterangan[] = [
  'Pagi',
  'Malam',
  'Piket Pagi',
  'Piket Malam',
  'Libur',
];

export default function AdminSchedulePage() {
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Local state for schedule changes
  const [scheduleChanges, setScheduleChanges] = useState<
    Record<string, Keterangan>
  >({});
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<
    (typeof teamMembers)[0] | null
  >(null);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Upload/Download state
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload month/year selection
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

  // Get all days in current month
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
  };

  const nextPeriod = () => {
    const newDate = new Date(currentStartDate);
    newDate.setMonth(currentStartDate.getMonth() + 1);
    setCurrentStartDate(newDate);
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
    const dateStr = date.toISOString().split('T')[0];
    const key = `${memberId}-${dateStr}`;

    // Check local changes first
    if (scheduleChanges[key]) {
      return { keterangan: scheduleChanges[key] };
    }

    return attendanceRecords.find(
      (r) => r.memberId === memberId && r.tanggal === dateStr
    );
  };

  const handleCellClick = (member: (typeof teamMembers)[0], date: Date) => {
    setEditingMember(member);
    setEditingDate(date);
    setEditingCell(`${member.id}-${date.toISOString().split('T')[0]}`);
  };

  const handleScheduleChange = (keterangan: Keterangan) => {
    if (!editingMember || !editingDate) return;

    const dateStr = editingDate.toISOString().split('T')[0];
    const key = `${editingMember.id}-${dateStr}`;

    setScheduleChanges((prev) => ({
      ...prev,
      [key]: keterangan,
    }));
    setHasChanges(true);
    setEditingCell(null);
    setEditingMember(null);
    setEditingDate(null);
  };

  const closeEditModal = () => {
    setEditingCell(null);
    setEditingMember(null);
    setEditingDate(null);
  };

  const handleSaveChanges = () => {
    // In real app, save to database
    console.log('Saving changes:', scheduleChanges);
    toast.success('Jadwal berhasil disimpan!');
    setHasChanges(false);
  };

  const handleResetChanges = () => {
    setScheduleChanges({});
    setHasChanges(false);
  };

  // Helper function to convert keterangan to short code
  const keteranganToShortCode = (keterangan: string) => {
    switch (keterangan) {
      case 'Pagi':
        return 'P';
      case 'Malam':
        return 'M';
      case 'Piket Pagi':
        return 'PP';
      case 'Piket Malam':
        return 'PM';
      case 'Libur':
        return 'L';
      default:
        return '';
    }
  };

  // Export schedule to Excel
  const handleExportSchedule = async () => {
    // Dynamic import xlsx to reduce initial bundle size
    const XLSX = await import('xlsx');

    // Get month name for sheet title
    const monthName = currentStartDate
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      .toUpperCase();

    // Create worksheet data - header rows
    // Row 1: Empty | Empty | Month name spanning dates
    // Row 2: NIK | NAMA | 1 | 2 | 3 | ... | 14 (or end of period)
    const dayNumbers = periodDates.map((date) => date.getDate().toString());
    const headers = ['NIK', 'NAMA', ...dayNumbers];

    // Create data rows
    const dataRows = teamMembers.map((member) => {
      const row: string[] = [member.nik, member.name];
      periodDates.forEach((date) => {
        const schedule = getScheduleForMember(member.id, date);
        row.push(schedule ? keteranganToShortCode(schedule.keterangan) : '');
      });
      return row;
    });

    // Combine headers and data
    const wsData = [headers, ...dataRows];

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // NIK column
      { wch: 15 }, // NAMA column
      ...periodDates.map(() => ({ wch: 4 })), // Date columns (narrow)
    ];

    // Generate filename with month
    const filename = `jadwal_${currentStartDate
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      .replace(' ', '_')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    toast.success('File Excel jadwal berhasil didownload!');
  };

  // Helper function to convert short code to keterangan (direct mapping)
  const shortCodeToKeterangan = (code: string): Keterangan | null => {
    const upperCode = code?.toUpperCase()?.trim();

    switch (upperCode) {
      case 'P':
        return 'Pagi';
      case 'M':
        return 'Malam';
      case 'PP':
        return 'Piket Pagi';
      case 'PM':
        return 'Piket Malam';
      case 'L':
        return 'Libur';
      default:
        return null;
    }
  };

  // Import schedule from Excel
  const handleImportSchedule = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Dynamic import xlsx
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

      // Use selected month/year from import modal
      const baseMonth = importMonth;
      const baseYear = importYear;

      // Parse day numbers from headers (skip NIK and NAMA columns)
      // Headers format: NIK | NAMA | 1 | 2 | 3 | ... | 31
      const dayColumns: number[] = [];
      for (let i = 2; i < headers.length; i++) {
        const dayNum = parseInt(headers[i]);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          dayColumns.push(dayNum);
        }
      }

      // Process data rows
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex] as string[];
        const nik = row[0]?.toString();
        const nama = row[1];

        // Find member by NIK or name
        const member = teamMembers.find(
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

            // Create date from day number
            const date = new Date(baseYear, baseMonth, dayNum);
            const dateStr = date.toISOString().split('T')[0];

            // Convert short code to keterangan
            const keterangan = shortCodeToKeterangan(code);

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
    } catch (error) {
      toast.error('Format file tidak valid.');
    }
    setShowImportModal(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getKeteranganStyle = (keterangan: string) => {
    switch (keterangan) {
      case 'Pagi':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Malam':
        return 'bg-gray-200 text-gray-700 border-gray-300';
      case 'Piket Pagi':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Piket Malam':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Libur':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getKeteranganShort = (keterangan: string) => {
    switch (keterangan) {
      case 'Pagi':
        return 'P';
      case 'Malam':
        return 'M';
      case 'Piket Pagi':
        return 'PP';
      case 'Piket Malam':
        return 'PM';
      case 'Libur':
        return 'L';
      default:
        return '-';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Kelola Jadwal</h1>
          <p className='text-gray-500'>
            Edit jadwal kerja anggota tim per member atau per tanggal
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleExportSchedule}
            icon={<Download className='w-4 h-4' />}
          >
            Download
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowImportModal(true)}
            icon={<Upload className='w-4 h-4' />}
          >
            Upload
          </Button>
          {hasChanges && (
            <>
              <Button
                variant='secondary'
                size='sm'
                onClick={handleResetChanges}
                icon={<RotateCcw className='w-4 h-4' />}
              >
                Reset
              </Button>
              <Button
                variant='primary'
                size='sm'
                onClick={handleSaveChanges}
                icon={<Save className='w-4 h-4' />}
              >
                Simpan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className='flex flex-wrap gap-3'>
        {keteranganOptions.map((ket) => (
          <div key={ket} className='flex items-center gap-2 text-sm'>
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${getKeteranganStyle(
                ket
              )}`}
            >
              {getKeteranganShort(ket)}
            </span>
            <span className='text-gray-600'>{ket}</span>
          </div>
        ))}
      </div>

      {/* Schedule Card */}
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

        {/* Info Banner */}
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
              {teamMembers.map((member) => (
                <tr
                  key={member.id}
                  className='border-b border-gray-100 hover:bg-gray-50'
                >
                  <td className='py-3 px-2 sticky left-0 bg-white'>
                    <div className='flex items-center gap-2'>
                      <Avatar src={member.image} name={member.name} size='sm' />
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-gray-800 truncate'>
                          {member.nickname}
                        </p>
                      </div>
                    </div>
                  </td>
                  {periodDates.map((date, index) => {
                    const schedule = getScheduleForMember(member.id, date);
                    const dateStr = date.toISOString().split('T')[0];
                    const cellKey = `${member.id}-${dateStr}`;
                    const isEditing = editingCell === cellKey;
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
                          title={schedule?.keterangan || 'Belum ada jadwal'}
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
      {editingMember && editingDate && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-sm mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Edit Jadwal
              </h3>
              <button
                onClick={closeEditModal}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
              <p className='text-sm text-gray-600'>
                <strong>{editingMember.nickname}</strong> -{' '}
                {editingDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className='space-y-2'>
              {keteranganOptions.map((ket) => {
                const currentSchedule = getScheduleForMember(
                  editingMember.id,
                  editingDate
                );
                return (
                  <button
                    key={ket}
                    onClick={() => handleScheduleChange(ket)}
                    className={`w-full px-4 py-3 text-left rounded-lg flex items-center gap-3 transition-colors ${
                      currentSchedule?.keterangan === ket
                        ? 'bg-gray-100 ring-2 ring-[#E57373]'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getKeteranganStyle(
                        ket
                      )}`}
                    >
                      {getKeteranganShort(ket)}
                    </span>
                    <span className='font-medium text-gray-700'>{ket}</span>
                  </button>
                );
              })}
            </div>

            <div className='mt-4 pt-4 border-t flex justify-end'>
              <Button variant='secondary' onClick={closeEditModal}>
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-md mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Upload Jadwal
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-sm text-green-700'>
                  <strong>Format file yang didukung:</strong> Excel (.xlsx,
                  .xls)
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  Gunakan file hasil download atau buat file Excel dengan format
                  yang sama.
                </p>
              </div>

              {/* Month/Year Selector */}
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <p className='text-sm text-blue-700 font-medium mb-3'>
                  Pilih bulan untuk jadwal yang akan diupload:
                </p>
                <div className='flex gap-3'>
                  <select
                    value={importMonth}
                    onChange={(e) => setImportMonth(parseInt(e.target.value))}
                    className='flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400'
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={importYear}
                    onChange={(e) => setImportYear(parseInt(e.target.value))}
                    className='w-24 px-3 py-2 border border-blue-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400'
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
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

              <div className='text-xs text-gray-500'>
                <p className='font-medium mb-2'>Format Excel:</p>
                <div className='bg-gray-100 p-3 rounded overflow-x-auto'>
                  <table className='text-[10px] border-collapse w-full'>
                    <thead>
                      <tr className='bg-gray-200'>
                        <th className='border border-gray-300 px-2 py-1'>
                          NIK
                        </th>
                        <th className='border border-gray-300 px-2 py-1'>
                          NAMA
                        </th>
                        <th className='border border-gray-300 px-2 py-1'>1</th>
                        <th className='border border-gray-300 px-2 py-1'>2</th>
                        <th className='border border-gray-300 px-2 py-1'>3</th>
                        <th className='border border-gray-300 px-2 py-1'>
                          ...
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className='border border-gray-300 px-2 py-1'>
                          19930282
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>
                          ANDREW
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>P</td>
                        <td className='border border-gray-300 px-2 py-1'>M</td>
                        <td className='border border-gray-300 px-2 py-1'>L</td>
                        <td className='border border-gray-300 px-2 py-1'>
                          ...
                        </td>
                      </tr>
                      <tr>
                        <td className='border border-gray-300 px-2 py-1'>
                          24010028
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>
                          ALFIAN
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>P</td>
                        <td className='border border-gray-300 px-2 py-1'>P</td>
                        <td className='border border-gray-300 px-2 py-1'>M</td>
                        <td className='border border-gray-300 px-2 py-1'>
                          ...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className='mt-2 space-y-1'>
                  <p className='text-gray-600 font-medium'>Kode jadwal:</p>
                  <div className='flex flex-wrap gap-2'>
                    <span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded'>
                      P = Pagi
                    </span>
                    <span className='px-2 py-0.5 bg-gray-200 text-gray-700 rounded'>
                      M = Malam
                    </span>
                    <span className='px-2 py-0.5 bg-green-100 text-green-700 rounded'>
                      PP = Piket Pagi
                    </span>
                    <span className='px-2 py-0.5 bg-purple-100 text-purple-700 rounded'>
                      PM = Piket Malam
                    </span>
                    <span className='px-2 py-0.5 bg-red-100 text-red-700 rounded'>
                      L = Libur
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-4 flex justify-end'>
              <Button
                variant='secondary'
                onClick={() => setShowImportModal(false)}
              >
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
