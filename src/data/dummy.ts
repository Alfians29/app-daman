// ============================================================================
// DUMMY DATA - Team Management Application
// ============================================================================
//
// File ini berisi data dummy untuk development.
// Interface di bawah merupakan referensi untuk skema database PostgreSQL
// menggunakan Prisma ORM.
//
// ============================================================================
// PRISMA SCHEMA REFERENCE (schema.prisma)
// ============================================================================
//
// // Enum untuk PostgreSQL
// enum ShiftType {
//   PAGI
//   MALAM
//   PIKET_PAGI
//   PIKET_MALAM
//   LIBUR
// }
//
// enum AttendanceStatus {
//   ONTIME
//   TELAT
// }
//
// enum TransactionCategory {
//   INCOME
//   EXPENSE
// }
//
// enum PaymentStatus {
//   LUNAS
//   BELUM_LUNAS
// }
//
// enum ActivityType {
//   CREATE
//   UPDATE
//   DELETE
//   LOGIN
// }
//
// enum UserRole {
//   SUPERADMIN
//   ADMIN
//   MEMBER
// }
//
// ============================================================================

/**
 * TABLE: users (TeamMember)
 * --------------------------
 * Tabel untuk menyimpan data anggota tim/user
 * Juga digunakan untuk authentication (login)
 *
 * Prisma Model:
 * model User {
 *   id               String    @id @default(cuid())
 *   nik              String    @unique
 *   username         String    @unique  // Untuk login
 *   password         String              // Password untuk login
 *   name             String
 *   nickname         String?
 *   email            String    @unique
 *   position         String              // "Team Leader" | "Member"
 *   department       String
 *   image            String?             // URL avatar
 *   usernameTelegram String?   @unique   // Untuk integrasi bot Telegram
 *   phone            String?
 *   roleId           String              // Relasi ke tabel Role
 *   role             Role      @relation(fields: [roleId], references: [id])
 *   isActive         Boolean   @default(true)  // Akun aktif/nonaktif
 *   lastLogin        DateTime?           // Waktu login terakhir
 *   refreshToken     String?             // JWT refresh token (optional)
 *   createdAt        DateTime  @default(now())
 *   updatedAt        DateTime  @updatedAt
 *
 *   // Relations
 *   attendances      Attendance[]
 *   schedules        Schedule[]
 *   cashEntries      CashEntry[]
 *   dailyReports     DailyReport[]
 *   activities       Activity[]
 *   kasPayments      KasPayment[]
 *
 *   @@index([username])
 *   @@index([usernameTelegram])
 *   @@index([roleId])
 * }
 *
 * // Catatan Authentication:
 * // - Login menggunakan username + password
 * // - Gunakan JWT untuk session management
 * // - refreshToken untuk auto-refresh JWT yang expired
 */
export interface TeamMember {
  id: string;
  nik: string;
  // === Authentication Fields ===
  username: string; // Untuk login
  password?: string; // Password untuk login (tidak ditampilkan di frontend)
  // === Profile Fields ===
  name: string;
  nickname: string;
  email: string;
  position: string; // "Team Leader" | "Member"
  department: string;
  image: string; // URL avatar
  usernameTelegram: string; // Untuk integrasi bot Telegram
  phone: string;
  // === Role & Account Status ===
  roleId?: string; // Relasi ke tabel Role
  role?: Role; // Populated role object (untuk display)
  isActive?: boolean; // Akun aktif/nonaktif
  lastLogin?: string; // ISO DateTime - Waktu login terakhir
}

/**
 * TABLE: roles (Role)
 * ---------------------
 * Tabel master untuk role/jabatan dalam sistem
 * Dikelola oleh Superadmin di menu Manajemen Role
 *
 * Prisma Model:
 * model Role {
 *   id          String           @id @default(cuid())
 *   name        String           @unique  // "Superadmin", "Admin", "Member", dll
 *   description String?
 *   color       String?          // Warna badge (e.g., "bg-purple-100 text-purple-700")
 *   isDefault   Boolean          @default(false) // Role default untuk user baru
 *   createdAt   DateTime         @default(now())
 *   updatedAt   DateTime         @updatedAt
 *
 *   // Relations
 *   users           User[]
 *   rolePermissions RolePermission[]
 *
 *   @@index([name])
 * }
 */
export interface Role {
  id: string;
  name: string; // "Superadmin", "Admin", "Member", dll
  description?: string;
  color?: string; // Warna badge untuk UI
  isDefault?: boolean; // Role default untuk user baru
  permissions?: Permission[]; // Populated permissions (untuk display)
  memberCount?: number; // Computed: jumlah user dengan role ini
}

/**
 * TABLE: permissions (Permission)
 * ---------------------------------
 * Tabel master untuk daftar permission/hak akses
 *
 * Prisma Model:
 * model Permission {
 *   id          String           @id @default(cuid())
 *   code        String           @unique  // "view_dashboard", "manage_attendance", dll
 *   name        String           // "Lihat Dashboard", "Kelola Kehadiran", dll
 *   description String?
 *   module      String?          // Grup: "dashboard", "attendance", "cash", dll
 *   createdAt   DateTime         @default(now())
 *
 *   // Relations
 *   rolePermissions RolePermission[]
 *
 *   @@index([code])
 *   @@index([module])
 * }
 *
 * // Contoh permissions:
 * // - view_dashboard     : Lihat Dashboard
 * // - manage_attendance  : Kelola Kehadiran
 * // - manage_schedule    : Kelola Jadwal
 * // - manage_cash        : Kelola Kas
 * // - manage_team        : Kelola Tim
 * // - manage_report      : Kelola Report
 * // - manage_roles       : Kelola Role (Superadmin only)
 * // - view_audit_log     : Lihat Audit Log (Superadmin only)
 */
export interface Permission {
  id: string;
  code: string; // "view_dashboard", "manage_attendance", dll
  name: string; // "Lihat Dashboard", "Kelola Kehadiran", dll
  description?: string;
  module?: string; // Grup module: "dashboard", "attendance", "cash", dll
}

/**
 * TABLE: role_permissions (RolePermission)
 * ------------------------------------------
 * Tabel pivot many-to-many antara Role dan Permission
 *
 * Prisma Model:
 * model RolePermission {
 *   id           String     @id @default(cuid())
 *   roleId       String
 *   role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
 *   permissionId String
 *   permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
 *   createdAt    DateTime   @default(now())
 *
 *   @@unique([roleId, permissionId])
 *   @@index([roleId])
 *   @@index([permissionId])
 * }
 */
export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  role?: Role;
  permission?: Permission;
}

/**
 * TABLE: attendances (AttendanceRecord)
 * --------------------------------------
 * Tabel untuk menyimpan data absensi/kehadiran
 *
 * Data bisa masuk dari:
 * - Web App (manual input oleh admin)
 * - Telegram Bot (otomatis via bot)
 *
 * ================================
 * MEKANISME TELEGRAM BOT:
 * ================================
 * 1. User mengirim FOTO + command ke bot:
 *    - /pagi       → keterangan: "Pagi"
 *    - /malam      → keterangan: "Malam"
 *    - /piket_pagi → keterangan: "Piket Pagi"
 *    - /piket_malam→ keterangan: "Piket Malam"
 *    (Foto hanya untuk validasi, tidak disimpan)
 *
 * 2. Bot mengambil username Telegram pengirim (e.g., @alfiyyann)
 *
 * 3. Bot mencari di tabel User berdasarkan field `usernameTelegram`:
 *    SELECT * FROM users WHERE usernameTelegram = '@alfiyyann'
 *    → Mendapat data: Muhammad Alfian (memberId: "2")
 *
 * 4. Bot menyimpan record attendance dengan:
 *    - memberId dari hasil lookup
 *    - jamAbsen dari waktu pesan diterima
 *    - status dihitung otomatis (Ontime jika < 08:00, Telat jika >= 08:00)
 *
 * 5. Bot reply konfirmasi ke user
 *
 * Prisma Model:
 * model Attendance {
 *   id                String           @id @default(cuid())
 *   memberId          String
 *   member            User             @relation(fields: [memberId], references: [id], onDelete: Cascade)
 *   tanggal           DateTime         @db.Date
 *   jamAbsen          String           // Format: "HH:mm"
 *   keterangan        ShiftType
 *   status            AttendanceStatus
 *   usernameTelegram  String?          // Username Telegram pengirim (tracking: siapa yang kirim)
 *   source            AttendanceSource @default(WEB) // Sumber data: WEB | TELEGRAM_BOT
 *   telegramMessageId String?          // ID pesan Telegram (untuk tracking/reply)
 *   telegramChatId    String?          // Chat ID Telegram (untuk reply bot)
 *   createdAt         DateTime         @default(now())
 *   updatedAt         DateTime         @updatedAt
 *
 *   @@unique([memberId, tanggal])
 *   @@index([memberId])
 *   @@index([tanggal])
 *   @@index([usernameTelegram])
 * }
 *
 * // Enum untuk sumber data absensi
 * enum AttendanceSource {
 *   WEB           // Input manual via web app
 *   TELEGRAM_BOT  // Input otomatis via Telegram bot
 * }
 */
export interface AttendanceRecord {
  id: string;
  memberId: string; // Dari lookup usernameTelegram → User.id
  memberName: string; // Denormalized dari User.name (untuk display)
  memberImg: string; // Denormalized dari User.image (untuk display)
  position: string; // Denormalized dari User.position (untuk display)
  // === Data dari Telegram Bot ===
  tanggal: string; // Format: "YYYY-MM-DD" | Dari: timestamp pesan Telegram
  jamAbsen: string; // Format: "HH:mm" | Dari: timestamp pesan Telegram
  keterangan: 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur'; // Dari: command (/pagi, /malam, dll)
  status: 'Ontime' | 'Telat'; // Dihitung: Ontime jika jamAbsen < 08:00, Telat jika >= 08:00
  // === Telegram Bot Tracking Fields ===
  usernameTelegram?: string; // Username pengirim (tracking: @alfiyyann → Muhammad Alfian)
  source?: 'WEB' | 'TELEGRAM_BOT'; // Sumber data absensi
  telegramMessageId?: string; // ID pesan Telegram
  telegramChatId?: string; // Chat ID untuk reply bot
}

/**
 * TABLE: schedules (ScheduleEntry)
 * ---------------------------------
 * Tabel untuk menyimpan jadwal kerja anggota
 *
 * Prisma Model:
 * model Schedule {
 *   id          String    @id @default(cuid())
 *   memberId    String
 *   member      User      @relation(fields: [memberId], references: [id], onDelete: Cascade)
 *   tanggal     DateTime  @db.Date
 *   keterangan  ShiftType
 *   createdAt   DateTime  @default(now())
 *   updatedAt   DateTime  @updatedAt
 *
 *   @@unique([memberId, tanggal])
 *   @@index([memberId])
 *   @@index([tanggal])
 * }
 */
export interface ScheduleEntry {
  id: string;
  memberId: string;
  memberName: string; // Denormalized dari User.name (untuk display)
  tanggal: string; // Format: "YYYY-MM-DD"
  keterangan: 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';
}

/**
 * TABLE: cash_entries (CashEntry)
 * --------------------------------
 * Tabel untuk menyimpan transaksi kas (pemasukan/pengeluaran)
 *
 * Prisma Model:
 * model CashEntry {
 *   id                  String              @id @default(cuid())
 *   date                DateTime            @db.Date
 *   description         String
 *   category            TransactionCategory // INCOME | EXPENSE
 *   amount              Decimal             @db.Decimal(15, 2)
 *   transactionCategory String?             // "Kas Bulanan", "Donasi", "ATK", dll
 *   memberId            String?
 *   member              User?               @relation(fields: [memberId], references: [id], onDelete: SetNull)
 *   createdAt           DateTime            @default(now())
 *   updatedAt           DateTime            @updatedAt
 *
 *   @@index([memberId])
 *   @@index([date])
 *   @@index([category])
 * }
 */
export interface CashEntry {
  id: string;
  date: string; // Format: "YYYY-MM-DD"
  description: string;
  category: 'income' | 'expense';
  amount: number;
  transactionCategory?: string;
  memberId?: string;
  memberName?: string; // Denormalized dari User.name (untuk display)
}

/**
 * TABLE: kas_payments (KasPayment) - BARU
 * ----------------------------------------
 * Tabel untuk menyimpan status pembayaran kas bulanan per member
 *
 * Prisma Model:
 * model KasPayment {
 *   id          String   @id @default(cuid())
 *   memberId    String
 *   member      User     @relation(fields: [memberId], references: [id], onDelete: Cascade)
 *   month       String   // Format: "YYYY-MM" (e.g., "2025-01")
 *   paid        Boolean  @default(false)
 *   amount      Decimal  @db.Decimal(15, 2)
 *   paidAt      DateTime?
 *   createdAt   DateTime @default(now())
 *   updatedAt   DateTime @updatedAt
 *
 *   @@unique([memberId, month])
 *   @@index([memberId])
 *   @@index([month])
 * }
 */

/**
 * TABLE: activities (Activity) - Audit Log
 * -----------------------------------------
 * Tabel untuk menyimpan log aktivitas user (audit trail)
 *
 * Prisma Model:
 * model Activity {
 *   id          String       @id @default(cuid())
 *   action      String       // "menambahkan", "mengubah", "menghapus"
 *   target      String       // "data kehadiran", "profil anggota", dll
 *   userId      String
 *   user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
 *   type        ActivityType
 *   metadata    Json?        // Additional data (old values, new values, etc.)
 *   ipAddress   String?
 *   userAgent   String?
 *   createdAt   DateTime     @default(now())
 *
 *   @@index([userId])
 *   @@index([type])
 *   @@index([createdAt])
 * }
 */
export interface Activity {
  id: string;
  action: string;
  target: string;
  user: string; // User name (in DB: userId with relation)
  timestamp: string; // In DB: createdAt
  type: 'create' | 'update' | 'delete' | 'login';
}

/**
 * TABLE: report_tasks (ReportTask)
 * ---------------------------------
 * Tabel untuk menyimpan detail task dalam report harian
 * One-to-many relation dengan DailyReport
 *
 * Prisma Model:
 * model ReportTask {
 *   id            String      @id @default(cuid())
 *   reportId      String
 *   report        DailyReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
 *   jobTypeId     String
 *   jobType       JobType     @relation(fields: [jobTypeId], references: [id])
 *   keterangan    String      @db.Text
 *   value         Int         // Jumlah/kuantitas pekerjaan
 *   createdAt     DateTime    @default(now())
 *   updatedAt     DateTime    @updatedAt
 *
 *   @@index([reportId])
 *   @@index([jobTypeId])
 * }
 */
export interface ReportTask {
  id: string;
  jobType: string; // In DB: jobTypeId with relation to JobType
  keterangan: string;
  value: number;
}

/**
 * TABLE: daily_reports (DailyReport)
 * -----------------------------------
 * Tabel untuk menyimpan laporan harian anggota
 *
 * Prisma Model:
 * model DailyReport {
 *   id          String       @id @default(cuid())
 *   memberId    String
 *   member      User         @relation(fields: [memberId], references: [id], onDelete: Cascade)
 *   tanggal     DateTime     @db.Date
 *   tasks       ReportTask[]
 *   createdAt   DateTime     @default(now())
 *   updatedAt   DateTime     @updatedAt
 *
 *   @@unique([memberId, tanggal])
 *   @@index([memberId])
 *   @@index([tanggal])
 * }
 */
export interface DailyReport {
  id: string;
  memberId: string;
  memberName: string; // Denormalized dari User.name
  tanggal: string; // Format: "YYYY-MM-DD"
  tasks: ReportTask[];
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string
}

/**
 * TABLE: job_types (JobType)
 * ---------------------------
 * Tabel master untuk jenis pekerjaan
 *
 * Prisma Model:
 * model JobType {
 *   id          String       @id @default(cuid())
 *   name        String       @unique
 *   isActive    Boolean      @default(true)
 *   tasks       ReportTask[]
 *   createdAt   DateTime     @default(now())
 *   updatedAt   DateTime     @updatedAt
 * }
 */
export interface JobType {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * TABLE: shift_settings (ShiftSetting)
 * --------------------------------------
 * Tabel untuk menyimpan konfigurasi waktu setiap shift
 * Hanya bisa diakses/diubah oleh Admin ke atas
 *
 * Prisma Model:
 * model ShiftSetting {
 *   id          String    @id @default(cuid())
 *   shiftType   ShiftType @unique  // PAGI, MALAM, PIKET_PAGI, PIKET_MALAM, LIBUR
 *   name        String              // "Shift Pagi", "Shift Malam", dll
 *   startTime   String              // Format: "HH:mm" (e.g., "07:00")
 *   endTime     String              // Format: "HH:mm" (e.g., "15:00")
 *   lateAfter   String?             // Batas waktu telat, Format: "HH:mm" (e.g., "08:00")
 *   isActive    Boolean   @default(true)
 *   color       String?             // Warna badge di UI (e.g., "emerald", "purple")
 *   createdAt   DateTime  @default(now())
 *   updatedAt   DateTime  @updatedAt
 * }
 *
 * // Contoh data:
 * // - PAGI:        startTime: "07:00", endTime: "15:00", lateAfter: "08:00"
 * // - MALAM:       startTime: "19:00", endTime: "07:00", lateAfter: "20:00"
 * // - PIKET_PAGI:  startTime: "06:00", endTime: "14:00", lateAfter: "07:00"
 * // - PIKET_MALAM: startTime: "18:00", endTime: "06:00", lateAfter: "19:00"
 * // - LIBUR:       startTime: null, endTime: null, lateAfter: null
 */
export interface ShiftSetting {
  id: string;
  shiftType: 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';
  name: string; // "Shift Pagi", "Shift Malam", dll
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  lateAfter?: string; // Batas waktu telat, Format: "HH:mm"
  isActive?: boolean;
  color?: string; // Warna badge di UI
}

// ============================================================================
// DUMMY DATA
// ============================================================================

// Job Types Data (manageable by admin)
export const jobTypes: JobType[] = [
  { id: 'jt-1', name: 'Monitoring', isActive: true },
  { id: 'jt-2', name: 'Input Data', isActive: true },
  { id: 'jt-3', name: 'Verifikasi Data', isActive: true },
  { id: 'jt-4', name: 'Maintenance', isActive: true },
  { id: 'jt-5', name: 'Meeting', isActive: true },
  { id: 'jt-6', name: 'Dokumentasi', isActive: true },
  { id: 'jt-7', name: 'Development', isActive: true },
  { id: 'jt-8', name: 'Testing', isActive: true },
  { id: 'jt-9', name: 'Koordinasi', isActive: true },
  { id: 'jt-10', name: 'Support', isActive: true },
  { id: 'jt-11', name: 'Training', isActive: true },
  { id: 'jt-12', name: 'Lainnya', isActive: true },
];

// Team Members Data
export const teamMembers: TeamMember[] = [
  {
    id: '1',
    nik: 'nik_123',
    username: 'andrew.nugroho',
    name: 'Andrew Nugroho Prihantono',
    nickname: 'Andrew',
    email: 'andrew.nugroho.prihantono@company.com',
    position: 'Team Leader',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@andrewnugrohoo',
    phone: '081234567890',
  },
  {
    id: '2',
    nik: 'nik_124',
    username: 'muhammad.alfian',
    name: 'Muhammad Alfian',
    nickname: 'Alfian',
    email: 'muhammad.alfian@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@alfiyyann',
    phone: '081234567891',
  },
  {
    id: '3',
    nik: 'nik_125',
    username: 'rahardian.arta',
    name: 'Rahardian Arta Putra',
    nickname: 'Rahardian',
    email: 'rahardian.artha.putra@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@Rahar_D_ian',
    phone: '081234567892',
  },
  {
    id: '4',
    nik: 'nik_126',
    username: 'afrida.triana',
    name: 'Afrida Triana',
    nickname: 'Afrida',
    email: 'afrida.triana@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@afridatriana',
    phone: '081234567893',
  },
  {
    id: '5',
    nik: 'nik_127',
    username: 'istiqfar.nada',
    name: 'Istiqfar Nada Maduwangi',
    nickname: 'Nada',
    email: 'istiqfar.nada.maduwangi@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@istiqfarnada',
    phone: '081234567894',
  },
  {
    id: '6',
    nik: 'nik_128',
    username: 'maharani.anggita',
    name: 'Maharani Anggita Putri',
    nickname: 'Rani',
    email: 'maharani.anggita.putri@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@mhrn_ap',
    phone: '081234567895',
  },
  {
    id: '7',
    nik: 'nik_129',
    username: 'vira.sinthya',
    name: 'Vira Sinthya Berlianti',
    nickname: 'Vira',
    email: 'vira.sinthya.berlianti@company.com',
    position: 'Member',
    department: 'Data Management',
    image: '',
    usernameTelegram: '@virasinthyab',
    phone: '081234567896',
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
      // Status: Ontime jika jam < 08:00, Telat jika jam >= 08:00
      const status: 'Ontime' | 'Telat' = hour < 8 ? 'Ontime' : 'Telat';

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
    memberName: 'Andrew Nugroho Prihantono',
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

// Recent Activities
export const recentActivities: Activity[] = [
  {
    id: 'act-1',
    action: 'menambahkan',
    target: 'data kehadiran',
    user: 'Andrew Nugroho Prihantono',
    timestamp: '2024-12-09 08:30',
    type: 'create',
  },
  {
    id: 'act-2',
    action: 'mengubah',
    target: 'profil anggota',
    user: 'Muhammad Alfian',
    timestamp: '2024-12-09 09:15',
    type: 'update',
  },
  {
    id: 'act-3',
    action: 'login ke',
    target: 'sistem',
    user: 'Rahardian Arta Putra',
    timestamp: '2024-12-09 07:45',
    type: 'login',
  },
];

// Daily Reports Data
export const dailyReports: DailyReport[] = [
  {
    id: 'report-1',
    memberId: '1',
    memberName: 'Andrew Nugroho Prihantono',
    tanggal: '2025-12-15',
    tasks: [
      {
        id: 'task-1-1',
        jobType: 'Monitoring',
        keterangan: 'Melakukan monitoring server dan pengecekan status sistem',
        value: 5,
      },
      {
        id: 'task-1-2',
        jobType: 'Dokumentasi',
        keterangan:
          'Update dokumentasi sistem dan review code dari tim development',
        value: 3,
      },
    ],
    createdAt: '2025-12-15T08:30:00',
    updatedAt: '2025-12-15T08:30:00',
  },
  {
    id: 'report-2',
    memberId: '2',
    memberName: 'Muhammad Alfian',
    tanggal: '2025-12-15',
    tasks: [
      {
        id: 'task-2-1',
        jobType: 'Development',
        keterangan: 'Menyelesaikan fitur export Excel untuk modul kas',
        value: 2,
      },
      {
        id: 'task-2-2',
        jobType: 'Testing',
        keterangan: 'Testing dan fix bug minor pada fitur baru',
        value: 8,
      },
    ],
    createdAt: '2025-12-15T09:00:00',
    updatedAt: '2025-12-15T09:00:00',
  },
  {
    id: 'report-3',
    memberId: '3',
    memberName: 'Rahardian Arta Putra',
    tanggal: '2025-12-15',
    tasks: [
      {
        id: 'task-3-1',
        jobType: 'Maintenance',
        keterangan: 'Maintenance database dan optimasi query',
        value: 4,
      },
      {
        id: 'task-3-2',
        jobType: 'Support',
        keterangan: 'Backup data bulanan dan pengecekan storage',
        value: 1,
      },
    ],
    createdAt: '2025-12-15T08:45:00',
    updatedAt: '2025-12-15T08:45:00',
  },
  {
    id: 'report-4',
    memberId: '1',
    memberName: 'Andrew Nugroho Prihantono',
    tanggal: '2025-12-14',
    tasks: [
      {
        id: 'task-4-1',
        jobType: 'Meeting',
        keterangan: 'Meeting dengan stakeholder membahas progress project',
        value: 2,
      },
      {
        id: 'task-4-2',
        jobType: 'Dokumentasi',
        keterangan: 'Persiapan presentasi progress project',
        value: 1,
      },
    ],
    createdAt: '2025-12-14T09:00:00',
    updatedAt: '2025-12-14T09:00:00',
  },
  {
    id: 'report-5',
    memberId: '2',
    memberName: 'Muhammad Alfian',
    tanggal: '2025-12-14',
    tasks: [
      {
        id: 'task-5-1',
        jobType: 'Development',
        keterangan: 'Implementasi chart progress tahunan pada halaman kas',
        value: 1,
      },
      {
        id: 'task-5-2',
        jobType: 'Testing',
        keterangan: 'Testing responsive design pada berbagai device',
        value: 12,
      },
    ],
    createdAt: '2025-12-14T08:30:00',
    updatedAt: '2025-12-14T08:30:00',
  },
  {
    id: 'report-6',
    memberId: '5',
    memberName: 'Istiqfar Nada Maduwangi',
    tanggal: '2025-12-14',
    tasks: [
      {
        id: 'task-6-1',
        jobType: 'Input Data',
        keterangan: 'Input data dan verifikasi dokumen harian',
        value: 25,
      },
      {
        id: 'task-6-2',
        jobType: 'Dokumentasi',
        keterangan: 'Update spreadsheet laporan mingguan',
        value: 3,
      },
    ],
    createdAt: '2025-12-14T10:00:00',
    updatedAt: '2025-12-14T10:00:00',
  },
  {
    id: 'report-7',
    memberId: '7',
    memberName: 'Vira Sinthya Berlianti',
    tanggal: '2025-12-13',
    tasks: [
      {
        id: 'task-7-1',
        jobType: 'Koordinasi',
        keterangan: 'Koordinasi dengan tim lapangan terkait jadwal kerja',
        value: 3,
      },
      {
        id: 'task-7-2',
        jobType: 'Monitoring',
        keterangan: 'Update status project di sistem tracking',
        value: 10,
      },
    ],
    createdAt: '2025-12-13T09:15:00',
    updatedAt: '2025-12-13T09:15:00',
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

// Schedule Data (from uploaded schedules)
// Periode Desember 2024 (1-31)
const generateScheduleData = (): ScheduleEntry[] => {
  const schedules: ScheduleEntry[] = [];

  // Define specific schedules for each member for December 2024
  // Struktur: [memberId, day, keterangan]
  const scheduleMap: {
    [memberId: string]: {
      [day: number]: 'Pagi' | 'Malam' | 'Piket Pagi' | 'Piket Malam' | 'Libur';
    };
  } = {
    // Andrew (id: 1)
    '1': {
      1: 'Pagi',
      2: 'Pagi',
      3: 'Malam',
      4: 'Malam',
      5: 'Libur',
      6: 'Piket Pagi',
      7: 'Piket Malam',
      8: 'Pagi',
      9: 'Pagi',
      10: 'Malam',
      11: 'Malam',
      12: 'Libur',
      13: 'Pagi',
      14: 'Pagi',
      15: 'Malam',
      16: 'Piket Pagi',
      17: 'Piket Malam',
      18: 'Pagi',
      19: 'Libur',
      20: 'Malam',
      21: 'Pagi',
      22: 'Pagi',
      23: 'Malam',
      24: 'Libur',
      25: 'Libur',
      26: 'Piket Pagi',
      27: 'Pagi',
      28: 'Malam',
      29: 'Malam',
      30: 'Pagi',
      31: 'Libur',
    },
    // Alfian (id: 2)
    '2': {
      1: 'Malam',
      2: 'Malam',
      3: 'Pagi',
      4: 'Pagi',
      5: 'Piket Pagi',
      6: 'Libur',
      7: 'Pagi',
      8: 'Malam',
      9: 'Malam',
      10: 'Pagi',
      11: 'Piket Malam',
      12: 'Pagi',
      13: 'Malam',
      14: 'Libur',
      15: 'Pagi',
      16: 'Malam',
      17: 'Pagi',
      18: 'Piket Pagi',
      19: 'Malam',
      20: 'Pagi',
      21: 'Libur',
      22: 'Malam',
      23: 'Pagi',
      24: 'Malam',
      25: 'Libur',
      26: 'Pagi',
      27: 'Malam',
      28: 'Piket Malam',
      29: 'Pagi',
      30: 'Malam',
      31: 'Pagi',
    },
    // Rahardian (id: 3)
    '3': {
      1: 'Piket Pagi',
      2: 'Libur',
      3: 'Piket Malam',
      4: 'Pagi',
      5: 'Malam',
      6: 'Pagi',
      7: 'Malam',
      8: 'Piket Pagi',
      9: 'Libur',
      10: 'Piket Malam',
      11: 'Pagi',
      12: 'Malam',
      13: 'Pagi',
      14: 'Malam',
      15: 'Piket Pagi',
      16: 'Libur',
      17: 'Malam',
      18: 'Malam',
      19: 'Pagi',
      20: 'Piket Malam',
      21: 'Malam',
      22: 'Piket Pagi',
      23: 'Libur',
      24: 'Pagi',
      25: 'Malam',
      26: 'Malam',
      27: 'Piket Malam',
      28: 'Pagi',
      29: 'Libur',
      30: 'Piket Pagi',
      31: 'Malam',
    },
    // Rama (id: 4)
    '4': {
      1: 'Libur',
      2: 'Piket Malam',
      3: 'Pagi',
      4: 'Malam',
      5: 'Pagi',
      6: 'Malam',
      7: 'Libur',
      8: 'Libur',
      9: 'Piket Pagi',
      10: 'Pagi',
      11: 'Pagi',
      12: 'Malam',
      13: 'Piket Malam',
      14: 'Pagi',
      15: 'Libur',
      16: 'Pagi',
      17: 'Pagi',
      18: 'Malam',
      19: 'Piket Pagi',
      20: 'Libur',
      21: 'Piket Malam',
      22: 'Malam',
      23: 'Pagi',
      24: 'Pagi',
      25: 'Malam',
      26: 'Libur',
      27: 'Libur',
      28: 'Pagi',
      29: 'Malam',
      30: 'Piket Malam',
      31: 'Pagi',
    },
    // Abi (id: 5)
    '5': {
      1: 'Pagi',
      2: 'Pagi',
      3: 'Libur',
      4: 'Piket Pagi',
      5: 'Malam',
      6: 'Malam',
      7: 'Pagi',
      8: 'Pagi',
      9: 'Malam',
      10: 'Libur',
      11: 'Piket Pagi',
      12: 'Piket Malam',
      13: 'Libur',
      14: 'Pagi',
      15: 'Malam',
      16: 'Malam',
      17: 'Libur',
      18: 'Libur',
      19: 'Pagi',
      20: 'Pagi',
      21: 'Malam',
      22: 'Libur',
      23: 'Piket Malam',
      24: 'Piket Pagi',
      25: 'Pagi',
      26: 'Malam',
      27: 'Pagi',
      28: 'Malam',
      29: 'Piket Pagi',
      30: 'Libur',
      31: 'Malam',
    },
    // Faqih (id: 6)
    '6': {
      1: 'Malam',
      2: 'Piket Pagi',
      3: 'Pagi',
      4: 'Libur',
      5: 'Pagi',
      6: 'Piket Malam',
      7: 'Piket Pagi',
      8: 'Malam',
      9: 'Pagi',
      10: 'Pagi',
      11: 'Libur',
      12: 'Pagi',
      13: 'Piket Pagi',
      14: 'Malam',
      15: 'Malam',
      16: 'Pagi',
      17: 'Malam',
      18: 'Pagi',
      19: 'Libur',
      20: 'Piket Pagi',
      21: 'Pagi',
      22: 'Pagi',
      23: 'Malam',
      24: 'Malam',
      25: 'Piket Malam',
      26: 'Pagi',
      27: 'Libur',
      28: 'Libur',
      29: 'Pagi',
      30: 'Malam',
      31: 'Piket Pagi',
    },
    // Fadil (id: 7)
    '7': {
      1: 'Piket Malam',
      2: 'Malam',
      3: 'Malam',
      4: 'Piket Malam',
      5: 'Piket Pagi',
      6: 'Pagi',
      7: 'Pagi',
      8: 'Libur',
      9: 'Libur',
      10: 'Malam',
      11: 'Malam',
      12: 'Piket Pagi',
      13: 'Pagi',
      14: 'Piket Pagi',
      15: 'Piket Malam',
      16: 'Libur',
      17: 'Piket Pagi',
      18: 'Malam',
      19: 'Pagi',
      20: 'Malam',
      21: 'Libur',
      22: 'Libur',
      23: 'Piket Pagi',
      24: 'Malam',
      25: 'Pagi',
      26: 'Piket Malam',
      27: 'Malam',
      28: 'Piket Pagi',
      29: 'Malam',
      30: 'Pagi',
      31: 'Libur',
    },
  };

  // Generate schedule entries from the map
  teamMembers.forEach((member) => {
    const memberSchedule = scheduleMap[member.id];
    if (memberSchedule) {
      for (let day = 1; day <= 31; day++) {
        if (memberSchedule[day]) {
          schedules.push({
            id: `sch-${member.id}-2025-12-${day.toString().padStart(2, '0')}`,
            memberId: member.id,
            memberName: member.name,
            tanggal: `2025-12-${day.toString().padStart(2, '0')}`,
            keterangan: memberSchedule[day],
          });
        }
      }
    }
  });

  return schedules;
};

export const scheduleEntries: ScheduleEntry[] = generateScheduleData();
