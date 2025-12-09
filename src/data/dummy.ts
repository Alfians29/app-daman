// Dummy data for the team management application

export interface TeamMember {
  id: string;
  nip: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatar: string;
  joinDate: string;
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
  keterangan: 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';
}

export interface CashEntry {
  id: string;
  date: string;
  description: string;
  category: 'income' | 'expense';
  amount: number;
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
  status: 'Lunas' | 'Belum Lunas';
}

export interface Activity {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'login';
}

// Team Members Data
export const teamMembers: TeamMember[] = [
  {
    id: '1',
    nip: '198501012010011001',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@company.com',
    position: 'Manager',
    department: 'Operasional',
    avatar:
      'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=E57373&color=fff',
    joinDate: '2010-01-01',
    phone: '081234567890',
  },
  {
    id: '2',
    nip: '199002152015022001',
    name: 'Siti Rahayu',
    email: 'siti.rahayu@company.com',
    position: 'Supervisor',
    department: 'Keuangan',
    avatar:
      'https://ui-avatars.com/api/?name=Siti+Rahayu&background=E57373&color=fff',
    joinDate: '2015-02-15',
    phone: '081234567891',
  },
  {
    id: '3',
    nip: '199203202018031001',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.com',
    position: 'Staff',
    department: 'IT',
    avatar:
      'https://ui-avatars.com/api/?name=Budi+Santoso&background=E57373&color=fff',
    joinDate: '2018-03-20',
    phone: '081234567892',
  },
  {
    id: '4',
    nip: '199405102019041001',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@company.com',
    position: 'Staff',
    department: 'HR',
    avatar:
      'https://ui-avatars.com/api/?name=Dewi+Lestari&background=E57373&color=fff',
    joinDate: '2019-04-10',
    phone: '081234567893',
  },
  {
    id: '5',
    nip: '199106252017051001',
    name: 'Eko Prasetyo',
    email: 'eko.prasetyo@company.com',
    position: 'Supervisor',
    department: 'Operasional',
    avatar:
      'https://ui-avatars.com/api/?name=Eko+Prasetyo&background=E57373&color=fff',
    joinDate: '2017-05-25',
    phone: '081234567894',
  },
  {
    id: '6',
    nip: '199308152020061001',
    name: 'Fitri Handayani',
    email: 'fitri.handayani@company.com',
    position: 'Staff',
    department: 'Keuangan',
    avatar:
      'https://ui-avatars.com/api/?name=Fitri+Handayani&background=E57373&color=fff',
    joinDate: '2020-06-15',
    phone: '081234567895',
  },
  {
    id: '7',
    nip: '198807302016071001',
    name: 'Gunawan Wibowo',
    email: 'gunawan.wibowo@company.com',
    position: 'Staff',
    department: 'IT',
    avatar:
      'https://ui-avatars.com/api/?name=Gunawan+Wibowo&background=E57373&color=fff',
    joinDate: '2016-07-30',
    phone: '081234567896',
  },
  {
    id: '8',
    nip: '199509102021081001',
    name: 'Hana Permata',
    email: 'hana.permata@company.com',
    position: 'Staff',
    department: 'Marketing',
    avatar:
      'https://ui-avatars.com/api/?name=Hana+Permata&background=E57373&color=fff',
    joinDate: '2021-08-10',
    phone: '081234567897',
  },
  {
    id: '9',
    nip: '199012052014091001',
    name: 'Irfan Hakim',
    email: 'irfan.hakim@company.com',
    position: 'Supervisor',
    department: 'Marketing',
    avatar:
      'https://ui-avatars.com/api/?name=Irfan+Hakim&background=E57373&color=fff',
    joinDate: '2014-09-05',
    phone: '081234567898',
  },
  {
    id: '10',
    nip: '199704202022101001',
    name: 'Jasmine Putri',
    email: 'jasmine.putri@company.com',
    position: 'Staff',
    department: 'HR',
    avatar:
      'https://ui-avatars.com/api/?name=Jasmine+Putri&background=E57373&color=fff',
    joinDate: '2022-10-20',
    phone: '081234567899',
  },
  {
    id: '11',
    nip: '198602152012111001',
    name: 'Kurniawan Adi',
    email: 'kurniawan.adi@company.com',
    position: 'Manager',
    department: 'IT',
    avatar:
      'https://ui-avatars.com/api/?name=Kurniawan+Adi&background=E57373&color=fff',
    joinDate: '2012-11-15',
    phone: '081234567800',
  },
  {
    id: '12',
    nip: '199201302019121001',
    name: 'Linda Sari',
    email: 'linda.sari@company.com',
    position: 'Staff',
    department: 'Operasional',
    avatar:
      'https://ui-avatars.com/api/?name=Linda+Sari&background=E57373&color=fff',
    joinDate: '2019-12-30',
    phone: '081234567801',
  },
];

// Generate attendance records for the current month
const generateAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const workModels: AttendanceRecord['keterangan'][] = [
    'Pagi',
    'Malam',
    'Piket Pagi',
    'Piket Malam',
    'Libur',
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

      records.push({
        id: `att-${member.id}-${day}`,
        memberId: member.id,
        memberName: member.name,
        memberImg: '', // Will be replaced with actual image from DB
        position: member.position,
        tanggal: `${year}-${String(month + 1).padStart(2, '0')}-${String(
          day
        ).padStart(2, '0')}`,
        jamAbsen: `0${hour}:${String(minute).padStart(2, '0')}`,
        keterangan,
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
    id: 'cash-1',
    date: '2024-12-01',
    description: 'Iuran bulanan anggota',
    category: 'income',
    amount: 2400000,
    memberName: 'Semua Anggota',
  },
  {
    id: 'cash-2',
    date: '2024-12-02',
    description: 'Pembelian ATK',
    category: 'expense',
    amount: 350000,
  },
  {
    id: 'cash-3',
    date: '2024-12-03',
    description: 'Kas masuk dari kegiatan',
    category: 'income',
    amount: 500000,
  },
  {
    id: 'cash-4',
    date: '2024-12-05',
    description: 'Biaya rapat bulanan',
    category: 'expense',
    amount: 750000,
  },
  {
    id: 'cash-5',
    date: '2024-12-06',
    description: 'Donasi anggota',
    category: 'income',
    amount: 300000,
    memberName: 'Ahmad Fauzi',
  },
  {
    id: 'cash-6',
    date: '2024-12-07',
    description: 'Pembelian snack',
    category: 'expense',
    amount: 200000,
  },
  {
    id: 'cash-7',
    date: '2024-12-08',
    description: 'Iuran tambahan',
    category: 'income',
    amount: 600000,
  },
  {
    id: 'cash-8',
    date: '2024-12-09',
    description: 'Biaya transportasi',
    category: 'expense',
    amount: 450000,
  },
];

// Payroll Entries
export const payrollEntries: PayrollEntry[] = teamMembers.map(
  (member, index) => ({
    id: `pay-${member.id}`,
    memberId: member.id,
    memberName: member.name,
    memberAvatar: member.avatar,
    position: member.position,
    date: '2024-12-01',
    totalPay:
      member.position === 'Manager'
        ? 15000000
        : member.position === 'Supervisor'
        ? 10000000
        : 7500000,
    status: index % 3 === 0 ? 'Belum Lunas' : 'Lunas',
  })
);

// Recent Activities
export const recentActivities: Activity[] = [
  {
    id: 'act-1',
    action: 'menambahkan',
    target: 'data kehadiran',
    user: 'Ahmad Fauzi',
    timestamp: '2024-12-09 08:30',
    type: 'create',
  },
  {
    id: 'act-2',
    action: 'mengubah',
    target: 'profil anggota',
    user: 'Siti Rahayu',
    timestamp: '2024-12-09 09:15',
    type: 'update',
  },
  {
    id: 'act-3',
    action: 'login ke',
    target: 'sistem',
    user: 'Budi Santoso',
    timestamp: '2024-12-09 07:45',
    type: 'login',
  },
  {
    id: 'act-4',
    action: 'menghapus',
    target: 'catatan kas',
    user: 'Dewi Lestari',
    timestamp: '2024-12-08 16:20',
    type: 'delete',
  },
  {
    id: 'act-5',
    action: 'menambahkan',
    target: 'anggota baru',
    user: 'Ahmad Fauzi',
    timestamp: '2024-12-08 14:00',
    type: 'create',
  },
  {
    id: 'act-6',
    action: 'mengubah',
    target: 'jadwal shift',
    user: 'Eko Prasetyo',
    timestamp: '2024-12-08 11:30',
    type: 'update',
  },
  {
    id: 'act-7',
    action: 'login ke',
    target: 'sistem',
    user: 'Fitri Handayani',
    timestamp: '2024-12-08 08:00',
    type: 'login',
  },
  {
    id: 'act-8',
    action: 'menambahkan',
    target: 'kas masuk',
    user: 'Siti Rahayu',
    timestamp: '2024-12-07 15:45',
    type: 'create',
  },
];

// Chart data - Monthly attendance by keterangan type
export const monthlyAttendanceData = [
  { name: 'Jan', pagi: 45, malam: 30, piketPagi: 15, piketMalam: 8, libur: 2 },
  { name: 'Feb', pagi: 42, malam: 28, piketPagi: 18, piketMalam: 10, libur: 2 },
  { name: 'Mar', pagi: 48, malam: 32, piketPagi: 12, piketMalam: 6, libur: 2 },
  { name: 'Apr', pagi: 44, malam: 29, piketPagi: 16, piketMalam: 9, libur: 2 },
  { name: 'Mei', pagi: 46, malam: 31, piketPagi: 14, piketMalam: 7, libur: 2 },
  { name: 'Jun', pagi: 43, malam: 27, piketPagi: 17, piketMalam: 11, libur: 2 },
  { name: 'Jul', pagi: 47, malam: 33, piketPagi: 13, piketMalam: 5, libur: 2 },
  { name: 'Agu', pagi: 44, malam: 30, piketPagi: 15, piketMalam: 9, libur: 2 },
  { name: 'Sep', pagi: 49, malam: 34, piketPagi: 11, piketMalam: 4, libur: 2 },
  { name: 'Okt', pagi: 45, malam: 31, piketPagi: 14, piketMalam: 8, libur: 2 },
  { name: 'Nov', pagi: 43, malam: 28, piketPagi: 16, piketMalam: 10, libur: 3 },
  { name: 'Des', pagi: 40, malam: 25, piketPagi: 18, piketMalam: 12, libur: 5 },
];

export const cashFlowData = [
  { name: 'Jan', masuk: 5000000, keluar: 3500000, saldo: 1500000 },
  { name: 'Feb', masuk: 4500000, keluar: 4000000, saldo: 2000000 },
  { name: 'Mar', masuk: 6000000, keluar: 3000000, saldo: 5000000 },
  { name: 'Apr', masuk: 5500000, keluar: 4500000, saldo: 6000000 },
  { name: 'Mei', masuk: 4800000, keluar: 3800000, saldo: 7000000 },
  { name: 'Jun', masuk: 5200000, keluar: 4200000, saldo: 8000000 },
  { name: 'Jul', masuk: 5800000, keluar: 3500000, saldo: 10300000 },
  { name: 'Agu', masuk: 5000000, keluar: 4000000, saldo: 11300000 },
  { name: 'Sep', masuk: 6200000, keluar: 3800000, saldo: 13700000 },
  { name: 'Okt', masuk: 5500000, keluar: 4500000, saldo: 14700000 },
  { name: 'Nov', masuk: 4800000, keluar: 4200000, saldo: 15300000 },
  { name: 'Des', masuk: 5300000, keluar: 3700000, saldo: 16900000 },
];

export const cashBreakdownData = [
  { category: 'Iuran Bulanan', amount: 28800000 },
  { category: 'Donasi', amount: 5500000 },
  { category: 'Kegiatan', amount: 3200000 },
  { category: 'ATK', amount: 2100000 },
  { category: 'Rapat', amount: 4500000 },
  { category: 'Transportasi', amount: 2700000 },
  { category: 'Konsumsi', amount: 3800000 },
  { category: 'Lainnya', amount: 1500000 },
];

// Summary Statistics
export const getSummaryStats = () => {
  const totalMembers = teamMembers.length;
  const todayRecords = attendanceRecords.filter(
    (r) => r.tanggal === new Date().toISOString().split('T')[0]
  );
  const presentToday = todayRecords.length;
  const attendancePercentage =
    totalMembers > 0 ? Math.round((presentToday / totalMembers) * 100) : 0;

  const totalCashIn = cashEntries
    .filter((e) => e.category === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashOut = cashEntries
    .filter((e) => e.category === 'expense')
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
