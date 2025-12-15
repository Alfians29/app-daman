// Dummy data for the team management application

export interface TeamMember {
  id: string;
  nik: string;
  username: string;
  name: string;
  nickname: string;
  email: string;
  position: string;
  department: string;
  image: string;
  usernameTelegram: string;
  phone: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberImg: string;
  position: string;
  tanggal: string;
  jamAbsen: string;
  keterangan: "Pagi" | "Malam" | "Piket Pagi" | "Piket Malam" | "Libur";
  status: "Ontime" | "Telat";
}

export interface ScheduleEntry {
  id: string;
  memberId: string;
  memberName: string;
  tanggal: string;
  keterangan: "Pagi" | "Malam" | "Piket Pagi" | "Piket Malam" | "Libur";
}

export interface CashEntry {
  id: string;
  date: string;
  description: string;
  category: "income" | "expense";
  amount: number;
  transactionCategory?: string;
  memberId?: string;
  memberName?: string;
}

export interface PayrollEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  position: string;
  date: string;
  totalPay: number;
  status: "Lunas" | "Belum Lunas";
}

export interface Activity {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: "create" | "update" | "delete" | "login";
}

export interface ReportTask {
  id: string;
  jobType: string;
  keterangan: string;
  value: number;
}

export interface DailyReport {
  id: string;
  memberId: string;
  memberName: string;
  tanggal: string;
  tasks: ReportTask[];
  createdAt: string;
  updatedAt: string;
}

export interface JobType {
  id: string;
  name: string;
  isActive: boolean;
}

// Job Types Data (manageable by admin)
export const jobTypes: JobType[] = [
  { id: "jt-1", name: "Monitoring", isActive: true },
  { id: "jt-2", name: "Input Data", isActive: true },
  { id: "jt-3", name: "Verifikasi Data", isActive: true },
  { id: "jt-4", name: "Maintenance", isActive: true },
  { id: "jt-5", name: "Meeting", isActive: true },
  { id: "jt-6", name: "Dokumentasi", isActive: true },
  { id: "jt-7", name: "Development", isActive: true },
  { id: "jt-8", name: "Testing", isActive: true },
  { id: "jt-9", name: "Koordinasi", isActive: true },
  { id: "jt-10", name: "Support", isActive: true },
  { id: "jt-11", name: "Training", isActive: true },
  { id: "jt-12", name: "Lainnya", isActive: true },
];

// Team Members Data
export const teamMembers: TeamMember[] = [
  {
    id: "1",
    nik: "nik_123",
    username: "andrew.nugroho",
    name: "Andrew Nugroho Prihantono",
    nickname: "Andrew",
    email: "andrew.nugroho.prihantono@company.com",
    position: "Team Leader",
    department: "Data Management",
    image: "",
    usernameTelegram: "@andrewnugrohoo",
    phone: "081234567890",
  },
  {
    id: "2",
    nik: "nik_124",
    username: "muhammad.alfian",
    name: "Muhammad Alfian",
    nickname: "Alfian",
    email: "muhammad.alfian@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@alfiyyann",
    phone: "081234567891",
  },
  {
    id: "3",
    nik: "nik_125",
    username: "rahardian.arta",
    name: "Rahardian Arta Putra",
    nickname: "Rahardian",
    email: "rahardian.artha.putra@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@Rahar_D_ian",
    phone: "081234567892",
  },
  {
    id: "4",
    nik: "nik_126",
    username: "afrida.triana",
    name: "Afrida Triana",
    nickname: "Afrida",
    email: "afrida.triana@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@afridatriana",
    phone: "081234567893",
  },
  {
    id: "5",
    nik: "nik_127",
    username: "istiqfar.nada",
    name: "Istiqfar Nada Maduwangi",
    nickname: "Nada",
    email: "istiqfar.nada.maduwangi@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@istiqfarnada",
    phone: "081234567894",
  },
  {
    id: "6",
    nik: "nik_128",
    username: "maharani.anggita",
    name: "Maharani Anggita Putri",
    nickname: "Rani",
    email: "maharani.anggita.putri@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@mhrn_ap",
    phone: "081234567895",
  },
  {
    id: "7",
    nik: "nik_129",
    username: "vira.sinthya",
    name: "Vira Sinthya Berlianti",
    nickname: "Vira",
    email: "vira.sinthya.berlianti@company.com",
    position: "Member",
    department: "Data Management",
    image: "",
    usernameTelegram: "@virasinthyab",
    phone: "081234567896",
  },
];

// Generate attendance records for the current month
const generateAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const workModels: AttendanceRecord["keterangan"][] = [
    "Pagi",
    "Malam",
    "Piket Pagi",
    "Piket Malam",
    "Libur",
  ];

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  teamMembers.forEach((member, memberIndex) => {
    for (let day = 1; day <= today.getDate(); day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0) continue; // Skip Sundays

      const keterangan = workModels[(memberIndex + day) % workModels.length];
      const hour = 7 + Math.floor(Math.random() * 2);
      const minute = Math.floor(Math.random() * 60);
      // Status: Ontime jika jam < 08:00, Telat jika jam >= 08:00
      const status: "Ontime" | "Telat" = hour < 8 ? "Ontime" : "Telat";

      records.push({
        id: `att-${member.id}-${day}`,
        memberId: member.id,
        memberName: member.name,
        memberImg: "", // Will be replaced with actual image from DB
        position: member.position,
        tanggal: `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day,
        ).padStart(2, "0")}`,
        jamAbsen: `0${hour}:${String(minute).padStart(2, "0")}`,
        keterangan,
        status,
      });
    }
  });

  return records;
};

export const attendanceRecords: AttendanceRecord[] =
  generateAttendanceRecords();

// Cash Book Entries
export const cashEntries: CashEntry[] = [
  {
    id: "cash-1",
    date: "2024-12-01",
    description: "Iuran bulanan anggota",
    category: "income",
    amount: 2400000,
    memberName: "Semua Anggota",
  },
  {
    id: "cash-2",
    date: "2024-12-02",
    description: "Pembelian ATK",
    category: "expense",
    amount: 350000,
  },
  {
    id: "cash-3",
    date: "2024-12-03",
    description: "Kas masuk dari kegiatan",
    category: "income",
    amount: 500000,
  },
  {
    id: "cash-4",
    date: "2024-12-05",
    description: "Biaya rapat bulanan",
    category: "expense",
    amount: 750000,
  },
  {
    id: "cash-5",
    date: "2024-12-06",
    description: "Donasi anggota",
    category: "income",
    amount: 300000,
    memberName: "Andrew Nugroho Prihantono",
  },
  {
    id: "cash-6",
    date: "2024-12-07",
    description: "Pembelian snack",
    category: "expense",
    amount: 200000,
  },
  {
    id: "cash-7",
    date: "2024-12-08",
    description: "Iuran tambahan",
    category: "income",
    amount: 600000,
  },
  {
    id: "cash-8",
    date: "2024-12-09",
    description: "Biaya transportasi",
    category: "expense",
    amount: 450000,
  },
];

// Payroll Entries
export const payrollEntries: PayrollEntry[] = teamMembers.map(
  (member, index) => ({
    id: `pay-${member.id}`,
    memberId: member.id,
    memberName: member.name,
    memberAvatar: member.image,
    position: member.position,
    date: "2024-12-01",
    totalPay: member.position === "Team Leader" ? 15000000 : 7500000,
    status: index % 3 === 0 ? "Belum Lunas" : "Lunas",
  }),
);

// Recent Activities
export const recentActivities: Activity[] = [
  {
    id: "act-1",
    action: "menambahkan",
    target: "data kehadiran",
    user: "Andrew Nugroho Prihantono",
    timestamp: "2024-12-09 08:30",
    type: "create",
  },
  {
    id: "act-2",
    action: "mengubah",
    target: "profil anggota",
    user: "Muhammad Alfian",
    timestamp: "2024-12-09 09:15",
    type: "update",
  },
  {
    id: "act-3",
    action: "login ke",
    target: "sistem",
    user: "Rahardian Arta Putra",
    timestamp: "2024-12-09 07:45",
    type: "login",
  },
];

// Daily Reports Data
export const dailyReports: DailyReport[] = [
  {
    id: "report-1",
    memberId: "1",
    memberName: "Andrew Nugroho Prihantono",
    tanggal: "2025-12-15",
    tasks: [
      {
        id: "task-1-1",
        jobType: "Monitoring",
        keterangan: "Melakukan monitoring server dan pengecekan status sistem",
        value: 5,
      },
      {
        id: "task-1-2",
        jobType: "Dokumentasi",
        keterangan:
          "Update dokumentasi sistem dan review code dari tim development",
        value: 3,
      },
    ],
    createdAt: "2025-12-15T08:30:00",
    updatedAt: "2025-12-15T08:30:00",
  },
  {
    id: "report-2",
    memberId: "2",
    memberName: "Muhammad Alfian",
    tanggal: "2025-12-15",
    tasks: [
      {
        id: "task-2-1",
        jobType: "Development",
        keterangan: "Menyelesaikan fitur export Excel untuk modul kas",
        value: 2,
      },
      {
        id: "task-2-2",
        jobType: "Testing",
        keterangan: "Testing dan fix bug minor pada fitur baru",
        value: 8,
      },
    ],
    createdAt: "2025-12-15T09:00:00",
    updatedAt: "2025-12-15T09:00:00",
  },
  {
    id: "report-3",
    memberId: "3",
    memberName: "Rahardian Arta Putra",
    tanggal: "2025-12-15",
    tasks: [
      {
        id: "task-3-1",
        jobType: "Maintenance",
        keterangan: "Maintenance database dan optimasi query",
        value: 4,
      },
      {
        id: "task-3-2",
        jobType: "Support",
        keterangan: "Backup data bulanan dan pengecekan storage",
        value: 1,
      },
    ],
    createdAt: "2025-12-15T08:45:00",
    updatedAt: "2025-12-15T08:45:00",
  },
  {
    id: "report-4",
    memberId: "1",
    memberName: "Andrew Nugroho Prihantono",
    tanggal: "2025-12-14",
    tasks: [
      {
        id: "task-4-1",
        jobType: "Meeting",
        keterangan: "Meeting dengan stakeholder membahas progress project",
        value: 2,
      },
      {
        id: "task-4-2",
        jobType: "Dokumentasi",
        keterangan: "Persiapan presentasi progress project",
        value: 1,
      },
    ],
    createdAt: "2025-12-14T09:00:00",
    updatedAt: "2025-12-14T09:00:00",
  },
  {
    id: "report-5",
    memberId: "2",
    memberName: "Muhammad Alfian",
    tanggal: "2025-12-14",
    tasks: [
      {
        id: "task-5-1",
        jobType: "Development",
        keterangan: "Implementasi chart progress tahunan pada halaman kas",
        value: 1,
      },
      {
        id: "task-5-2",
        jobType: "Testing",
        keterangan: "Testing responsive design pada berbagai device",
        value: 12,
      },
    ],
    createdAt: "2025-12-14T08:30:00",
    updatedAt: "2025-12-14T08:30:00",
  },
  {
    id: "report-6",
    memberId: "5",
    memberName: "Istiqfar Nada Maduwangi",
    tanggal: "2025-12-14",
    tasks: [
      {
        id: "task-6-1",
        jobType: "Input Data",
        keterangan: "Input data dan verifikasi dokumen harian",
        value: 25,
      },
      {
        id: "task-6-2",
        jobType: "Dokumentasi",
        keterangan: "Update spreadsheet laporan mingguan",
        value: 3,
      },
    ],
    createdAt: "2025-12-14T10:00:00",
    updatedAt: "2025-12-14T10:00:00",
  },
  {
    id: "report-7",
    memberId: "7",
    memberName: "Vira Sinthya Berlianti",
    tanggal: "2025-12-13",
    tasks: [
      {
        id: "task-7-1",
        jobType: "Koordinasi",
        keterangan: "Koordinasi dengan tim lapangan terkait jadwal kerja",
        value: 3,
      },
      {
        id: "task-7-2",
        jobType: "Monitoring",
        keterangan: "Update status project di sistem tracking",
        value: 10,
      },
    ],
    createdAt: "2025-12-13T09:15:00",
    updatedAt: "2025-12-13T09:15:00",
  },
];

// Chart data - Monthly attendance by keterangan type
export const monthlyAttendanceData = [
  { name: "Jan", pagi: 45, malam: 30, piketPagi: 15, piketMalam: 8, libur: 2 },
  { name: "Feb", pagi: 42, malam: 28, piketPagi: 18, piketMalam: 10, libur: 2 },
  { name: "Mar", pagi: 48, malam: 32, piketPagi: 12, piketMalam: 6, libur: 2 },
  { name: "Apr", pagi: 44, malam: 29, piketPagi: 16, piketMalam: 9, libur: 2 },
  { name: "Mei", pagi: 46, malam: 31, piketPagi: 14, piketMalam: 7, libur: 2 },
  { name: "Jun", pagi: 43, malam: 27, piketPagi: 17, piketMalam: 11, libur: 2 },
  { name: "Jul", pagi: 47, malam: 33, piketPagi: 13, piketMalam: 5, libur: 2 },
  { name: "Agu", pagi: 44, malam: 30, piketPagi: 15, piketMalam: 9, libur: 2 },
  { name: "Sep", pagi: 49, malam: 34, piketPagi: 11, piketMalam: 4, libur: 2 },
  { name: "Okt", pagi: 45, malam: 31, piketPagi: 14, piketMalam: 8, libur: 2 },
  { name: "Nov", pagi: 43, malam: 28, piketPagi: 16, piketMalam: 10, libur: 3 },
  { name: "Des", pagi: 40, malam: 25, piketPagi: 18, piketMalam: 12, libur: 5 },
];

export const cashFlowData = [
  { name: "Jan", masuk: 5000000, keluar: 3500000, saldo: 1500000 },
  { name: "Feb", masuk: 4500000, keluar: 4000000, saldo: 2000000 },
  { name: "Mar", masuk: 6000000, keluar: 3000000, saldo: 5000000 },
  { name: "Apr", masuk: 5500000, keluar: 4500000, saldo: 6000000 },
  { name: "Mei", masuk: 4800000, keluar: 3800000, saldo: 7000000 },
  { name: "Jun", masuk: 5200000, keluar: 4200000, saldo: 8000000 },
  { name: "Jul", masuk: 5800000, keluar: 3500000, saldo: 10300000 },
  { name: "Agu", masuk: 5000000, keluar: 4000000, saldo: 11300000 },
  { name: "Sep", masuk: 6200000, keluar: 3800000, saldo: 13700000 },
  { name: "Okt", masuk: 5500000, keluar: 4500000, saldo: 14700000 },
  { name: "Nov", masuk: 4800000, keluar: 4200000, saldo: 15300000 },
  { name: "Des", masuk: 5300000, keluar: 3700000, saldo: 16900000 },
];

export const cashBreakdownData = [
  { category: "Iuran Bulanan", amount: 28800000 },
  { category: "Donasi", amount: 5500000 },
  { category: "Kegiatan", amount: 3200000 },
  { category: "ATK", amount: 2100000 },
  { category: "Rapat", amount: 4500000 },
  { category: "Transportasi", amount: 2700000 },
  { category: "Konsumsi", amount: 3800000 },
  { category: "Lainnya", amount: 1500000 },
];

// Summary Statistics
export const getSummaryStats = () => {
  const totalMembers = teamMembers.length;
  const todayRecords = attendanceRecords.filter(
    (r) => r.tanggal === new Date().toISOString().split("T")[0],
  );
  const presentToday = todayRecords.length;
  const attendancePercentage =
    totalMembers > 0 ? Math.round((presentToday / totalMembers) * 100) : 0;

  const totalCashIn = cashEntries
    .filter((e) => e.category === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCash = totalCashIn - totalCashOut;

  return {
    totalMembers,
    presentToday,
    attendancePercentage,
    totalCash,
    totalCashIn,
    totalCashOut,
  };
};

// Schedule Data (from uploaded schedules)
// Periode Desember 2024 (1-31)
const generateScheduleData = (): ScheduleEntry[] => {
  const schedules: ScheduleEntry[] = [];

  // Define specific schedules for each member for December 2024
  // Struktur: [memberId, day, keterangan]
  const scheduleMap: {
    [memberId: string]: {
      [day: number]: "Pagi" | "Malam" | "Piket Pagi" | "Piket Malam" | "Libur";
    };
  } = {
    // Andrew (id: 1)
    "1": {
      1: "Pagi",
      2: "Pagi",
      3: "Malam",
      4: "Malam",
      5: "Libur",
      6: "Piket Pagi",
      7: "Piket Malam",
      8: "Pagi",
      9: "Pagi",
      10: "Malam",
      11: "Malam",
      12: "Libur",
      13: "Pagi",
      14: "Pagi",
      15: "Malam",
      16: "Piket Pagi",
      17: "Piket Malam",
      18: "Pagi",
      19: "Libur",
      20: "Malam",
      21: "Pagi",
      22: "Pagi",
      23: "Malam",
      24: "Libur",
      25: "Libur",
      26: "Piket Pagi",
      27: "Pagi",
      28: "Malam",
      29: "Malam",
      30: "Pagi",
      31: "Libur",
    },
    // Alfian (id: 2)
    "2": {
      1: "Malam",
      2: "Malam",
      3: "Pagi",
      4: "Pagi",
      5: "Piket Pagi",
      6: "Libur",
      7: "Pagi",
      8: "Malam",
      9: "Malam",
      10: "Pagi",
      11: "Piket Malam",
      12: "Pagi",
      13: "Malam",
      14: "Libur",
      15: "Pagi",
      16: "Malam",
      17: "Pagi",
      18: "Piket Pagi",
      19: "Malam",
      20: "Pagi",
      21: "Libur",
      22: "Malam",
      23: "Pagi",
      24: "Malam",
      25: "Libur",
      26: "Pagi",
      27: "Malam",
      28: "Piket Malam",
      29: "Pagi",
      30: "Malam",
      31: "Pagi",
    },
    // Rahardian (id: 3)
    "3": {
      1: "Piket Pagi",
      2: "Libur",
      3: "Piket Malam",
      4: "Pagi",
      5: "Malam",
      6: "Pagi",
      7: "Malam",
      8: "Piket Pagi",
      9: "Libur",
      10: "Piket Malam",
      11: "Pagi",
      12: "Malam",
      13: "Pagi",
      14: "Malam",
      15: "Piket Pagi",
      16: "Libur",
      17: "Malam",
      18: "Malam",
      19: "Pagi",
      20: "Piket Malam",
      21: "Malam",
      22: "Piket Pagi",
      23: "Libur",
      24: "Pagi",
      25: "Malam",
      26: "Malam",
      27: "Piket Malam",
      28: "Pagi",
      29: "Libur",
      30: "Piket Pagi",
      31: "Malam",
    },
    // Rama (id: 4)
    "4": {
      1: "Libur",
      2: "Piket Malam",
      3: "Pagi",
      4: "Malam",
      5: "Pagi",
      6: "Malam",
      7: "Libur",
      8: "Libur",
      9: "Piket Pagi",
      10: "Pagi",
      11: "Pagi",
      12: "Malam",
      13: "Piket Malam",
      14: "Pagi",
      15: "Libur",
      16: "Pagi",
      17: "Pagi",
      18: "Malam",
      19: "Piket Pagi",
      20: "Libur",
      21: "Piket Malam",
      22: "Malam",
      23: "Pagi",
      24: "Pagi",
      25: "Malam",
      26: "Libur",
      27: "Libur",
      28: "Pagi",
      29: "Malam",
      30: "Piket Malam",
      31: "Pagi",
    },
    // Abi (id: 5)
    "5": {
      1: "Pagi",
      2: "Pagi",
      3: "Libur",
      4: "Piket Pagi",
      5: "Malam",
      6: "Malam",
      7: "Pagi",
      8: "Pagi",
      9: "Malam",
      10: "Libur",
      11: "Piket Pagi",
      12: "Piket Malam",
      13: "Libur",
      14: "Pagi",
      15: "Malam",
      16: "Malam",
      17: "Libur",
      18: "Libur",
      19: "Pagi",
      20: "Pagi",
      21: "Malam",
      22: "Libur",
      23: "Piket Malam",
      24: "Piket Pagi",
      25: "Pagi",
      26: "Malam",
      27: "Pagi",
      28: "Malam",
      29: "Piket Pagi",
      30: "Libur",
      31: "Malam",
    },
    // Faqih (id: 6)
    "6": {
      1: "Malam",
      2: "Piket Pagi",
      3: "Pagi",
      4: "Libur",
      5: "Pagi",
      6: "Piket Malam",
      7: "Piket Pagi",
      8: "Malam",
      9: "Pagi",
      10: "Pagi",
      11: "Libur",
      12: "Pagi",
      13: "Piket Pagi",
      14: "Malam",
      15: "Malam",
      16: "Pagi",
      17: "Malam",
      18: "Pagi",
      19: "Libur",
      20: "Piket Pagi",
      21: "Pagi",
      22: "Pagi",
      23: "Malam",
      24: "Malam",
      25: "Piket Malam",
      26: "Pagi",
      27: "Libur",
      28: "Libur",
      29: "Pagi",
      30: "Malam",
      31: "Piket Pagi",
    },
    // Fadil (id: 7)
    "7": {
      1: "Piket Malam",
      2: "Malam",
      3: "Malam",
      4: "Piket Malam",
      5: "Piket Pagi",
      6: "Pagi",
      7: "Pagi",
      8: "Libur",
      9: "Libur",
      10: "Malam",
      11: "Malam",
      12: "Piket Pagi",
      13: "Pagi",
      14: "Piket Pagi",
      15: "Piket Malam",
      16: "Libur",
      17: "Piket Pagi",
      18: "Malam",
      19: "Pagi",
      20: "Malam",
      21: "Libur",
      22: "Libur",
      23: "Piket Pagi",
      24: "Malam",
      25: "Pagi",
      26: "Piket Malam",
      27: "Malam",
      28: "Piket Pagi",
      29: "Malam",
      30: "Pagi",
      31: "Libur",
    },
  };

  // Generate schedule entries from the map
  teamMembers.forEach((member) => {
    const memberSchedule = scheduleMap[member.id];
    if (memberSchedule) {
      for (let day = 1; day <= 31; day++) {
        if (memberSchedule[day]) {
          schedules.push({
            id: `sch-${member.id}-2025-12-${day.toString().padStart(2, "0")}`,
            memberId: member.id,
            memberName: member.name,
            tanggal: `2025-12-${day.toString().padStart(2, "0")}`,
            keterangan: memberSchedule[day],
          });
        }
      }
    }
  });

  return schedules;
};

export const scheduleEntries: ScheduleEntry[] = generateScheduleData();
