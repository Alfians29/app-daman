import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // console.log('🌱 Seeding database (Superadmin only)...');

  // // Create Superadmin Role
  // const superadminRole = await prisma.role.upsert({
  //   where: { name: 'Superadmin' },
  //   update: {
  //     description: 'Superadmin dengan akses penuh tanpa batasan',
  //     color: '#7c3aed',
  //   },
  //   create: {
  //     id: 'role-superadmin',
  //     name: 'Superadmin',
  //     description: 'Superadmin dengan akses penuh tanpa batasan',
  //     color: '#7c3aed',
  //     isDefault: false,
  //   },
  // });
  // console.log('✅ Created role:', superadminRole.name);

  // // Create ALL Permissions - names match sidebar menu labels exactly
  // const permissions = [
  //   // Main Menu
  //   {
  //     id: 'perm-menu-dashboard',
  //     code: 'menu.dashboard',
  //     name: 'Dashboard',
  //     module: 'menu',
  //   },
  //   {
  //     id: 'perm-menu-attendance',
  //     code: 'menu.attendance',
  //     name: 'Absensi',
  //     module: 'menu',
  //   },
  //   {
  //     id: 'perm-menu-schedule',
  //     code: 'menu.schedule',
  //     name: 'Jadwal',
  //     module: 'menu',
  //   },
  //   {
  //     id: 'perm-menu-report',
  //     code: 'menu.report',
  //     name: 'Report Harian',
  //     module: 'menu',
  //   },
  //   { id: 'perm-menu-cash', code: 'menu.cash', name: 'Kas', module: 'menu' },
  //   {
  //     id: 'perm-menu-about',
  //     code: 'menu.about',
  //     name: 'Tentang Tim',
  //     module: 'menu',
  //   },
  //   // Admin Menu
  //   {
  //     id: 'perm-admin-team',
  //     code: 'admin.team',
  //     name: 'Kelola Tim',
  //     module: 'admin',
  //   },
  //   {
  //     id: 'perm-admin-schedule',
  //     code: 'admin.schedule',
  //     name: 'Kelola Jadwal',
  //     module: 'admin',
  //   },
  //   {
  //     id: 'perm-admin-report',
  //     code: 'admin.report',
  //     name: 'Kelola Report',
  //     module: 'admin',
  //   },
  //   {
  //     id: 'perm-admin-cash',
  //     code: 'admin.cash',
  //     name: 'Kelola Kas',
  //     module: 'admin',
  //   },
  //   {
  //     id: 'perm-admin-attendance',
  //     code: 'admin.attendance',
  //     name: 'Kelola Kehadiran',
  //     module: 'admin',
  //   },
  //   {
  //     id: 'perm-admin-shift',
  //     code: 'admin.shift',
  //     name: 'Kelola Shift',
  //     module: 'admin',
  //   },
  //   // Superadmin Menu
  //   {
  //     id: 'perm-superadmin-roles',
  //     code: 'superadmin.roles',
  //     name: 'Manajemen Role',
  //     module: 'superadmin',
  //   },
  //   {
  //     id: 'perm-superadmin-audit',
  //     code: 'superadmin.audit',
  //     name: 'Audit Log',
  //     module: 'superadmin',
  //   },
  // ];

  // // Upsert all permissions
  // for (const perm of permissions) {
  //   await prisma.permission.upsert({
  //     where: { id: perm.id },
  //     update: { code: perm.code, name: perm.name, module: perm.module },
  //     create: perm,
  //   });
  // }
  // console.log('✅ Created', permissions.length, 'menu permissions');

  // // Assign ALL permissions to Superadmin role (full access to all sidebar menus)
  // for (const perm of permissions) {
  //   await prisma.rolePermission.upsert({
  //     where: {
  //       roleId_permissionId: {
  //         roleId: superadminRole.id,
  //         permissionId: perm.id,
  //       },
  //     },
  //     update: {},
  //     create: {
  //       id: `rp-superadmin-${perm.id}`,
  //       roleId: superadminRole.id,
  //       permissionId: perm.id,
  //     },
  //   });
  // }
  // console.log('✅ Assigned all permissions to Superadmin role');

  // Create Superadmin User
  // const superadminUser = await prisma.user.upsert({
  //   where: { username: 'superadmin' },
  //   update: { roleId: superadminRole.id },
  //   create: {
  //     id: 'user-superadmin',
  //     nik: '00000001',
  //     username: 'superadmin',
  //     password: 'superadmin123',
  //     name: 'Super Administrator',
  //     nickname: 'Superadmin',
  //     email: 'superadmin@daman.com',
  //     position: 'Team Leader',
  //     department: 'IT',
  //     roleId: superadminRole.id,
  //     isActive: true,
  //   },
  // });
  // console.log('✅ Created superadmin user:', superadminUser.username);

  // ============================================
  // SDI TELEGRAM COMMANDS (Static - tanpa relasi ke ShiftSetting)
  // ============================================
  console.log('\n🌱 Seeding SDI Telegram Commands (static)...');

  const sdiTelegramCommands = [
    {
      id: 'cmd-sdi-pagi',
      unit: 'SDI',
      command: '/pagi',
      isActive: true,
    },
    {
      id: 'cmd-sdi-piket',
      unit: 'SDI',
      command: '/piket',
      isActive: true,
    },
  ];

  for (const cmd of sdiTelegramCommands) {
    await prisma.telegramCommand.upsert({
      where: {
        unit_command: {
          unit: cmd.unit,
          command: cmd.command,
        },
      },
      update: {
        isActive: cmd.isActive,
      },
      create: cmd,
    });
    console.log(`✅ Created SDI command: ${cmd.command}`);
  }

  // ============================================
  // SDI TELEGRAM USERS
  // ============================================
  console.log('\n🌱 Seeding SDI Telegram Users...');

  const sdiTelegramUsers = [
    {
      usernameTelegram: '@nanangagustian',
      nik: '20900289',
      nama: 'Nanang Agustian',
    },
    {
      usernameTelegram: '@ABCDEFGHIJ4NMCOK2345678910PQRSTU',
      nik: '20910514',
      nama: 'Achmad Vilda Pradianto',
    },
    {
      usernameTelegram: '@bunda_bella',
      nik: '20750004',
      nama: 'Barokah Indah',
    },
    {
      usernameTelegram: '@cimolzzz',
      nik: '20950745',
      nama: 'Tito Guntur Pradana',
    },
    {
      usernameTelegram: '@Adhitsatria',
      nik: '19870031',
      nama: 'Adhit Satria Harendro',
    },
    {
      usernameTelegram: '@Andinaay',
      nik: '925752',
      nama: 'Andina Ayu Hapsari',
    },
    {
      usernameTelegram: '@sihajzaarandi',
      nik: '22000009',
      nama: 'Mohammad Sihaj Zarrandi',
    },
    {
      usernameTelegram: '@rizkausman',
      nik: '20900376',
      nama: 'Rizka Agustia Usman',
    },
    {
      usernameTelegram: '@DWSYXGQ',
      nik: '19950350',
      nama: 'Dimmas Wahyu Saputra',
    },
  ];

  for (const user of sdiTelegramUsers) {
    await prisma.telegramUser.upsert({
      where: { usernameTelegram: user.usernameTelegram },
      update: {
        nik: user.nik,
        nama: user.nama,
        unit: 'SDI',
        isActive: true,
      },
      create: {
        usernameTelegram: user.usernameTelegram,
        nik: user.nik,
        nama: user.nama,
        unit: 'SDI',
        isActive: true,
      },
    });
    console.log(`✅ Created SDI user: ${user.nama}`);
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────');
  console.log('Superadmin:');
  console.log('  Username: superadmin');
  console.log('  Password: superadmin123');
  console.log('─────────────────────────────────');
  console.log('\n📌 Superadmin memiliki akses ke SEMUA menu:');
  console.log('  - Dashboard, Absensi, Jadwal, Report, Kas, Tentang Tim');
  console.log('  - Kelola Tim, Kelola Jadwal, Kelola Report, Kelola Kas');
  console.log('  - Kelola Kehadiran, Kelola Shift');
  console.log('  - Manajemen Role, Audit Log');
  console.log('\n📋 SDI Telegram Commands (static):');
  console.log('  - /pagi, /piket');
  console.log('\n📋 SDI Telegram Users:');
  console.log(`  - ${sdiTelegramUsers.length} users`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
