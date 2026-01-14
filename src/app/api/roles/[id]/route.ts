import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, color, permissions } = await request.json();

    // Get before state
    const before = await prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    const beforePermissions =
      before?.rolePermissions.map((rp) => rp.permission.code) || [];

    const role = await prisma.role.update({
      where: { id },
      data: { name, description, color },
    });

    if (permissions !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissions.length > 0) {
        const perms = await prisma.permission.findMany({
          where: { code: { in: permissions } },
        });
        for (let i = 0; i < perms.length; i++) {
          const perm = perms[i];
          await prisma.rolePermission.create({
            data: {
              id: `rp-${Date.now()}-${i}`,
              roleId: id,
              permissionId: perm.id,
            },
          });
        }
      }
    }

    await logActivity({
      action: `Memperbarui role "${role.name}"`,
      target: 'Role',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: {
          name: before?.name,
          description: before?.description,
          permissions: beforePermissions,
        },
        after: {
          name: role.name,
          description: role.description,
          permissions: permissions || beforePermissions,
        },
      },
      request,
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (role && role._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete role with assigned users' },
        { status: 400 }
      );
    }

    await prisma.role.delete({ where: { id } });

    await logActivity({
      action: `Menghapus role "${role?.name || id}"`,
      target: 'Role',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: { id, name: role?.name, description: role?.description },
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
