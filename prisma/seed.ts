import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (Superadmin only)...');

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

  // Create ALL Permissions - names match sidebar menu labels exactly
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

  // Upsert all permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: { code: perm.code, name: perm.name, module: perm.module },
      create: perm,
    });
  }
  console.log('✅ Created', permissions.length, 'menu permissions');

  // Assign ALL permissions to Superadmin role (full access to all sidebar menus)
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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
