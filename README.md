# App Daman - Sistem Manajemen Tim

Aplikasi web untuk manajemen tim Data Management (Daman) yang mencakup fitur absensi, jadwal, kas, dan laporan harian.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL dengan Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Custom JWT-based auth
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Fitur Utama

### Dashboard

- Greeting personalisasi berdasarkan waktu
- Statistik absen tercepat & terakhir hari ini
- Progress absensi periode (16 bulan ini - 15 bulan depan)
- Grafik kehadiran dan kas

### Absensi

- Catat kehadiran manual via web
- Integrasi dengan Telegram Bot
- Status: ONTIME / TELAT (otomatis berdasarkan shift)

### Jadwal

- Manajemen jadwal shift (Pagi, Malam, Piket Pagi, Piket Malam, Libur)
- Kalender bulanan dengan tampilan per anggota

### Laporan Harian

- Input laporan tugas harian
- Tracking jenis pekerjaan dan kuantitas

### Kas

- Manajemen pemasukan & pengeluaran
- Grafik saldo bulanan

### Manajemen Shift

- CRUD shift settings (waktu mulai, selesai, batas telat)
- Telegram command per shift
- Warna badge customizable
- **Auto-sync ke tabel TelegramCommand** (khusus unit Daman)

### Role & Permission

- 3 Role default: Superadmin, Admin, Member
- Permission berbasis menu (granular access control)

## 🛠️ Setup Development

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm/yarn/pnpm

### Installation

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan DATABASE_URL yang sesuai

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (opsional)
npx prisma db seed

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔐 Default Login

| Role       | Username   | Password      |
| ---------- | ---------- | ------------- |
| Superadmin | superadmin | superadmin123 |
| Admin      | admin      | admin123      |
| Member     | member     | member123     |

## 📁 Struktur Project

```
src/
├── app/
│   ├── (main)/           # Protected routes
│   │   ├── page.tsx      # Dashboard
│   │   ├── attendance/   # Absensi user
│   │   ├── schedule/     # Jadwal
│   │   ├── report/       # Laporan harian
│   │   ├── cash/         # Kas
│   │   ├── team/         # Tentang tim
│   │   ├── manage-*/     # Admin pages
│   │   └── profile/      # Profile user
│   ├── api/              # API Routes
│   └── sign-in/          # Auth pages
├── components/
│   ├── ui/               # Reusable UI components
│   └── charts/           # Chart components
├── lib/
│   ├── api.ts            # API client
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── hooks/                # Custom React hooks
```

## 🔗 Integrasi Telegram Bot

Aplikasi ini terintegrasi dengan Telegram Bot untuk absensi. Setiap shift dapat dikonfigurasi dengan command Telegram (contoh: `/pagi`, `/malam`).

### Alur Integrasi

1. User mengirim command di group Telegram
2. Bot memproses dan memanggil API `/api/attendance/bot`
3. Absensi tercatat dengan source `TELEGRAM_BOT`

### TelegramCommand Table

- Dikelola otomatis untuk unit **Daman** saat CRUD shift
- Unit **SDI** dikelola manual di database

## 📝 API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Users

- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Attendance

- `GET /api/attendance` - List attendance
- `POST /api/attendance` - Create attendance (web)
- `POST /api/attendance/bot` - Create attendance (Telegram)

### Shifts

- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift (+ auto TelegramCommand)
- `PUT /api/shifts/[id]` - Update shift (+ sync TelegramCommand)
- `DELETE /api/shifts/[id]` - Delete shift (+ cleanup TelegramCommand)

### Lainnya

- `/api/schedule` - Manajemen jadwal
- `/api/cash` - Manajemen kas
- `/api/reports` - Laporan harian
- `/api/roles` - Manajemen role
- `/api/activities` - Audit log

## 🎨 Customization

### Shift Colors

Warna shift dapat dikustomisasi via halaman Kelola Shift. Pilihan warna:
`emerald`, `purple`, `blue`, `gray`, `red`, `amber`, `orange`, `yellow`, `lime`, `green`, `teal`, `cyan`, `sky`, `indigo`, `violet`, `fuchsia`, `pink`, `rose`

## 📄 License

Private - Internal use only.
