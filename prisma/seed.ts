import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Superadmin Role
  const superadminRole = await prisma.role.upsert({
    where: { name: 'Superadmin' },
    update: {
      description: 'Superadmin dengan akses penuh tanpa batasan',
      color: '#7c3aed',
    },
    create: {
      id: 'role-superadmin',
      name: 'Superadmin',
      description: 'Superadmin dengan akses penuh tanpa batasan',
      color: '#7c3aed',
      isDefault: false,
    },
  });
  console.log('✅ Created role:', superadminRole.name);

  // Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      description: 'Administrator dengan akses penuh',
      color: '#ef4444',
    },
    create: {
      id: 'role-admin',
      name: 'Admin',
      description: 'Administrator dengan akses penuh',
      color: '#ef4444',
      isDefault: false,
    },
  });
  console.log('✅ Created role:', adminRole.name);

  // Create Member Role
  const memberRole = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {
      description: 'Anggota tim biasa',
      color: '#3b82f6',
    },
    create: {
      id: 'role-member',
      name: 'Member',
      description: 'Anggota tim biasa',
      color: '#3b82f6',
      isDefault: true,
    },
  });
  console.log('✅ Created role:', memberRole.name);

  // Create Permissions - names match sidebar menu labels exactly
  const permissions = [
    // Main Menu
    {
      id: 'perm-menu-dashboard',
      code: 'menu.dashboard',
      name: 'Dashboard',
      module: 'menu',
    },
    {
      id: 'perm-menu-attendance',
      code: 'menu.attendance',
      name: 'Absensi',
      module: 'menu',
    },
    {
      id: 'perm-menu-schedule',
      code: 'menu.schedule',
      name: 'Jadwal',
      module: 'menu',
    },
    {
      id: 'perm-menu-report',
      code: 'menu.report',
      name: 'Report Harian',
      module: 'menu',
    },
    { id: 'perm-menu-cash', code: 'menu.cash', name: 'Kas', module: 'menu' },
    {
      id: 'perm-menu-about',
      code: 'menu.about',
      name: 'Tentang Tim',
      module: 'menu',
    },
    // Admin Menu
    {
      id: 'perm-admin-team',
      code: 'admin.team',
      name: 'Kelola Tim',
      module: 'admin',
    },
    {
      id: 'perm-admin-schedule',
      code: 'admin.schedule',
      name: 'Kelola Jadwal',
      module: 'admin',
    },
    {
      id: 'perm-admin-report',
      code: 'admin.report',
      name: 'Kelola Report',
      module: 'admin',
    },
    {
      id: 'perm-admin-cash',
      code: 'admin.cash',
      name: 'Kelola Kas',
      module: 'admin',
    },
    {
      id: 'perm-admin-attendance',
      code: 'admin.attendance',
      name: 'Kelola Kehadiran',
      module: 'admin',
    },
    {
      id: 'perm-admin-shift',
      code: 'admin.shift',
      name: 'Kelola Shift',
      module: 'admin',
    },
    // Superadmin Menu
    {
      id: 'perm-superadmin-roles',
      code: 'superadmin.roles',
      name: 'Manajemen Role',
      module: 'superadmin',
    },
    {
      id: 'perm-superadmin-audit',
      code: 'superadmin.audit',
      name: 'Audit Log',
      module: 'superadmin',
    },
  ];

  // Delete old permissions first to avoid conflicts
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: { code: perm.code, name: perm.name, module: perm.module },
      create: perm,
    });
  }
  console.log('✅ Created', permissions.length, 'menu permissions');

  // Assign ALL permissions to Superadmin role (full access)
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superadminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        id: `rp-superadmin-${perm.id}`,
        roleId: superadminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Assigned all permissions to Superadmin role');

  // Assign Main + Admin menu permissions to Admin role (no superadmin menu)
  const adminPermissionCodes = [
    // Main menu
    'menu.dashboard',
    'menu.attendance',
    'menu.schedule',
    'menu.report',
    'menu.cash',
    'menu.about',
    // Admin menu
    'admin.team',
    'admin.schedule',
    'admin.report',
    'admin.cash',
    'admin.attendance',
    'admin.shift',
  ];
  const adminPermissions = permissions.filter((p) =>
    adminPermissionCodes.includes(p.code)
  );
  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        id: `rp-admin-${perm.id}`,
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Assigned main + admin permissions to Admin role');

  // Assign only Main menu permissions to Member role (basic access)
  const memberPermissionCodes = [
    'menu.dashboard',
    'menu.attendance',
    'menu.schedule',
    'menu.report',
    'menu.cash',
    'menu.about',
  ];
  const memberPermissions = permissions.filter((p) =>
    memberPermissionCodes.includes(p.code)
  );
  for (const perm of memberPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: memberRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        id: `rp-member-${perm.id}`,
        roleId: memberRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Assigned main menu permissions to Member role');

  // Create Superadmin User
  const superadminUser = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { roleId: superadminRole.id },
    create: {
      id: 'user-superadmin',
      nik: '00000001',
      username: 'superadmin',
      password: 'superadmin123',
      name: 'Super Administrator',
      nickname: 'Superadmin',
      email: 'superadmin@daman.com',
      position: 'Team Leader',
      department: 'IT',
      roleId: superadminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Created superadmin user:', superadminUser.username);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { roleId: adminRole.id },
    create: {
      id: 'user-admin',
      nik: '12345678',
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      nickname: 'Admin',
      email: 'admin@daman.com',
      position: 'Team Leader',
      department: 'IT',
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', adminUser.username);

  // Create Member User
  const memberUser = await prisma.user.upsert({
    where: { username: 'member' },
    update: { roleId: memberRole.id },
    create: {
      id: 'user-member-1',
      nik: '87654321',
      username: 'member',
      password: 'member123',
      name: 'John Doe',
      nickname: 'John',
      email: 'john@daman.com',
      position: 'Member',
      department: 'IT',
      roleId: memberRole.id,
      isActive: true,
    },
  });
  console.log('✅ Created member user:', memberUser.username);

  // Create Shift Settings
  const shiftSettings = [
    {
      id: 'shift-pagi',
      shiftType: 'PAGI' as const,
      name: 'Shift Pagi',
      startTime: '08:00',
      endTime: '16:00',
      lateAfter: '08:15',
      telegramCommand: '/pagi',
      color: 'emerald',
    },
    {
      id: 'shift-malam',
      shiftType: 'MALAM' as const,
      name: 'Shift Malam',
      startTime: '20:00',
      endTime: '04:00',
      lateAfter: '20:15',
      telegramCommand: '/malam',
      color: 'indigo',
    },
    {
      id: 'shift-pagi-malam',
      shiftType: 'PAGI_MALAM' as const,
      name: 'Shift Pagi Malam',
      startTime: '08:00',
      endTime: '04:00',
      lateAfter: '08:15',
      telegramCommand: '/pagimalam',
      color: 'cyan',
    },
    {
      id: 'shift-piket-pagi',
      shiftType: 'PIKET_PAGI' as const,
      name: 'Piket Pagi',
      startTime: '08:00',
      endTime: '16:00',
      lateAfter: '08:15',
      telegramCommand: '/piketpagi',
      color: 'amber',
    },
    {
      id: 'shift-piket-malam',
      shiftType: 'PIKET_MALAM' as const,
      name: 'Piket Malam',
      startTime: '20:00',
      endTime: '04:00',
      lateAfter: '20:15',
      telegramCommand: '/piketmalam',
      color: 'purple',
    },
    {
      id: 'shift-libur',
      shiftType: 'LIBUR' as const,
      name: 'Libur',
      startTime: null,
      endTime: null,
      lateAfter: null,
      telegramCommand: null,
      color: 'gray',
    },
  ];

  for (const shift of shiftSettings) {
    await prisma.shiftSetting.upsert({
      where: { shiftType: shift.shiftType },
      update: {
        name: shift.name,
        color: shift.color,
        telegramCommand: shift.telegramCommand,
      },
      create: shift,
    });
  }
  console.log('✅ Created', shiftSettings.length, 'shift settings');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────');
  console.log('Superadmin:');
  console.log('  Username: superadmin');
  console.log('  Password: superadmin123');
  console.log('');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('');
  console.log('Member:');
  console.log('  Username: member');
  console.log('  Password: member123');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
