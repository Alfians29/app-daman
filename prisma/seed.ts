import { PrismaClient, ShiftType, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. SEED ROLES
  // ============================================
  console.log('📦 Seeding Roles...');

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Superadmin' },
      update: {},
      create: {
        id: 'role-1',
        name: 'Superadmin',
        description: 'Full access to all features',
        color: 'bg-purple-100 text-purple-700',
        isDefault: false,
      },
    }),
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        id: 'role-2',
        name: 'Admin',
        description: 'Access to admin features',
        color: 'bg-blue-100 text-blue-700',
        isDefault: false,
      },
    }),
    prisma.role.upsert({
      where: { name: 'Member' },
      update: {},
      create: {
        id: 'role-3',
        name: 'Member',
        description: 'Basic member access',
        color: 'bg-gray-100 text-gray-700',
        isDefault: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${roles.length} roles`);

  // ============================================
  // 2. SEED PERMISSIONS
  // ============================================
  console.log('📦 Seeding Permissions...');

  const permissionsData = [
    {
      id: 'perm-1',
      code: 'view_dashboard',
      name: 'Lihat Dashboard',
      module: 'dashboard',
    },
    {
      id: 'perm-2',
      code: 'manage_attendance',
      name: 'Kelola Kehadiran',
      module: 'attendance',
    },
    {
      id: 'perm-3',
      code: 'manage_schedule',
      name: 'Kelola Jadwal',
      module: 'schedule',
    },
    { id: 'perm-4', code: 'manage_cash', name: 'Kelola Kas', module: 'cash' },
    { id: 'perm-5', code: 'manage_team', name: 'Kelola Tim', module: 'team' },
    {
      id: 'perm-6',
      code: 'manage_report',
      name: 'Kelola Report',
      module: 'report',
    },
    {
      id: 'perm-7',
      code: 'manage_roles',
      name: 'Kelola Role',
      module: 'superadmin',
    },
    {
      id: 'perm-8',
      code: 'view_audit_log',
      name: 'Lihat Audit Log',
      module: 'superadmin',
    },
    {
      id: 'perm-9',
      code: 'manage_shift',
      name: 'Kelola Shift',
      module: 'admin',
    },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p) =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      })
    )
  );
  console.log(`   ✅ Created ${permissions.length} permissions`);

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('📦 Assigning Permissions to Roles...');

  // Superadmin gets all permissions
  let rpCounter = 1;
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: 'role-1',
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        id: `rp-${rpCounter++}`,
        roleId: 'role-1',
        permissionId: perm.id,
      },
    });
  }

  // Admin gets most permissions except superadmin ones
  const adminPermCodes = [
    'view_dashboard',
    'manage_attendance',
    'manage_schedule',
    'manage_cash',
    'manage_team',
    'manage_report',
    'manage_shift',
  ];
  for (const perm of permissions.filter((p) =>
    adminPermCodes.includes(p.code)
  )) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: 'role-2',
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        id: `rp-${rpCounter++}`,
        roleId: 'role-2',
        permissionId: perm.id,
      },
    });
  }

  // Member gets only view_dashboard
  const memberPerm = permissions.find((p) => p.code === 'view_dashboard');
  if (memberPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: 'role-3',
          permissionId: memberPerm.id,
        },
      },
      update: {},
      create: {
        id: `rp-${rpCounter++}`,
        roleId: 'role-3',
        permissionId: memberPerm.id,
      },
    });
  }
  console.log('   ✅ Assigned permissions to roles');

  // ============================================
  // 4. SEED SHIFT SETTINGS
  // ============================================
  console.log('📦 Seeding Shift Settings...');

  const shiftSettings = [
    {
      id: 'shift-1',
      shiftType: ShiftType.PAGI,
      name: 'Shift Pagi',
      startTime: '07:00',
      endTime: '15:00',
      lateAfter: '08:00',
      color: 'emerald',
    },
    {
      id: 'shift-2',
      shiftType: ShiftType.MALAM,
      name: 'Shift Malam',
      startTime: '19:00',
      endTime: '07:00',
      lateAfter: '20:00',
      color: 'purple',
    },
    {
      id: 'shift-3',
      shiftType: ShiftType.PIKET_PAGI,
      name: 'Piket Pagi',
      startTime: '06:00',
      endTime: '14:00',
      lateAfter: '07:00',
      color: 'amber',
    },
    {
      id: 'shift-4',
      shiftType: ShiftType.PIKET_MALAM,
      name: 'Piket Malam',
      startTime: '18:00',
      endTime: '06:00',
      lateAfter: '19:00',
      color: 'indigo',
    },
    {
      id: 'shift-5',
      shiftType: ShiftType.LIBUR,
      name: 'Libur',
      startTime: null,
      endTime: null,
      lateAfter: null,
      color: 'red',
    },
  ];

  for (const shift of shiftSettings) {
    await prisma.shiftSetting.upsert({
      where: { shiftType: shift.shiftType },
      update: {},
      create: shift,
    });
  }
  console.log(`   ✅ Created ${shiftSettings.length} shift settings`);

  // ============================================
  // 5. SEED JOB TYPES
  // ============================================
  console.log('📦 Seeding Job Types...');

  const jobTypesData = [
    { id: 'job-1', name: 'Monitoring' },
    { id: 'job-2', name: 'Gangguan' },
    { id: 'job-3', name: 'Preventive Maintenance (PM)' },
    { id: 'job-4', name: 'Piket' },
    { id: 'job-5', name: 'Tugas Lainnya' },
  ];

  for (const jt of jobTypesData) {
    await prisma.jobType.upsert({
      where: { name: jt.name },
      update: {},
      create: { id: jt.id, name: jt.name, isActive: true },
    });
  }
  console.log(`   ✅ Created ${jobTypesData.length} job types`);

  // ============================================
  // 6. SEED SAMPLE USERS
  // ============================================
  console.log('📦 Seeding Sample Users...');

  const users = [
    {
      id: 'user-1',
      nik: 'ADM001',
      username: 'superadmin',
      password: 'superadmin123',
      name: 'Super Administrator',
      nickname: 'Admin',
      email: 'superadmin@daman.com',
      position: 'Team Leader',
      department: 'Data Management',
      usernameTelegram: '@superadmin_daman',
      phone: '081234567890',
      roleId: 'role-1',
      isActive: true,
    },
    {
      id: 'user-2',
      nik: 'ADM002',
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      nickname: 'Admin',
      email: 'admin@daman.com',
      position: 'Team Leader',
      department: 'Data Management',
      usernameTelegram: '@admin_daman',
      phone: '081234567891',
      roleId: 'role-2',
      isActive: true,
    },
    {
      id: 'user-3',
      nik: 'MBR001',
      username: 'member1',
      password: 'member123',
      name: 'Muhammad Alfian',
      nickname: 'Alfian',
      email: 'alfian@daman.com',
      position: 'Member',
      department: 'Data Management',
      usernameTelegram: '@alfian_daman',
      phone: '081234567892',
      roleId: 'role-3',
      isActive: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
  }
  console.log(`   ✅ Created ${users.length} sample users`);

  // ============================================
  // 7. SEED SAMPLE ACTIVITY (Audit Log)
  // ============================================
  console.log('📦 Seeding Sample Activity Log...');

  await prisma.activity.upsert({
    where: { id: 'act-1' },
    update: {},
    create: {
      id: 'act-1',
      action: 'melakukan',
      target: 'seed database',
      userId: 'user-1',
      type: ActivityType.CREATE,
      metadata: { seedVersion: '1.0.0' },
    },
  });
  console.log('   ✅ Created sample activity log');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - Roles: ${roles.length} (role-1, role-2, role-3)`);
  console.log(`   - Permissions: ${permissions.length} (perm-1 to perm-9)`);
  console.log(
    `   - Shift Settings: ${shiftSettings.length} (shift-1 to shift-5)`
  );
  console.log(`   - Job Types: ${jobTypesData.length} (job-1 to job-5)`);
  console.log(`   - Users: ${users.length} (user-1, user-2, user-3)`);
  console.log('\n🔐 Login credentials:');
  console.log('   - Superadmin: superadmin / superadmin123');
  console.log('   - Admin: admin / admin123');
  console.log('   - Member: member1 / member123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
