import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addQRPermissions() {
  console.log('Adding QR Permissions...');

  const qrPermissions = [
    {
      id: 'perm-menu-qr',
      code: 'menu.qr',
      name: 'QR Search',
      module: 'menu',
    },
    {
      id: 'perm-admin-qr',
      code: 'admin.qr',
      name: 'Kelola QR',
      module: 'admin',
    },
  ];

  for (const perm of qrPermissions) {
    try {
      const result = await prisma.permission.upsert({
        where: { code: perm.code },
        update: { name: perm.name, module: perm.module },
        create: perm,
      });
      console.log(
        `✅ Created/Updated permission: ${result.name} (${result.code})`
      );
    } catch (error) {
      console.error(`❌ Error creating permission ${perm.code}:`, error);
    }
  }

  // Verify
  const allPerms = await prisma.permission.findMany();
  console.log(`\nTotal permissions in database: ${allPerms.length}`);
  console.log('Permissions:', allPerms.map((p) => p.name).join(', '));

  await prisma.$disconnect();
}

addQRPermissions();
