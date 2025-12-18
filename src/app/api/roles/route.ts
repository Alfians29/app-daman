import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET all roles with permissions
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
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

    const newId = `role-${Date.now()}`;

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
      for (let i = 0; i < perms.length; i++) {
        const perm = perms[i];
        await prisma.rolePermission.create({
          data: {
            id: `rp-${Date.now()}-${i}`,
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }

    await logActivity({
      action: `Created role "${name}"`,
      target: 'Role',
      userId: getUserIdFromRequest(request),
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
