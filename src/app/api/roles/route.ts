import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all roles with permissions
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const transformedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isDefault: role.isDefault,
      memberCount: role._count.users,
      permissions: role.rolePermissions.map((rp) => rp.permission.code),
    }));

    return NextResponse.json({ success: true, data: transformedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST create role
export async function POST(request: NextRequest) {
  try {
    const { name, description, color, permissions } = await request.json();

    const count = await prisma.role.count();
    const newId = `role-${count + 1}`;

    const role = await prisma.role.create({
      data: {
        id: newId,
        name,
        description: description || null,
        color: color || 'bg-gray-100 text-gray-700',
        isDefault: false,
      },
    });

    if (permissions && permissions.length > 0) {
      const perms = await prisma.permission.findMany({
        where: { code: { in: permissions } },
      });
      let rpCounter = await prisma.rolePermission.count();
      for (const perm of perms) {
        await prisma.rolePermission.create({
          data: {
            id: `rp-${++rpCounter}`,
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }

    await logActivity({
      action: `Created role "${name}"`,
      target: 'Role',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { roleId: newId },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
