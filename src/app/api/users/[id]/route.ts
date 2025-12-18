import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Sanitize unique fields: convert empty strings to null
    if (body.usernameTelegram === '') body.usernameTelegram = null;
    if (body.phone === '') body.phone = null;

    // Get before state
    const before = await prisma.user.findUnique({ where: { id } });

    const user = await prisma.user.update({ where: { id }, data: body });

    await logActivity({
      action: `Updated user "${user.name}"`,
      target: 'User',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: {
          name: before?.name,
          nik: before?.nik,
          nickname: before?.nickname,
          position: before?.position,
          roleId: before?.roleId,
          isActive: before?.isActive,
        },
        after: {
          name: user.name,
          nik: user.nik,
          nickname: user.nickname,
          position: user.position,
          roleId: user.roleId,
          isActive: user.isActive,
        },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error('Error updating user:', error);

    // Handle Prisma unique constraint errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      const target = (error as { meta?: { target?: string[] } }).meta?.target;
      if (target?.includes('nik')) {
        return NextResponse.json(
          { success: false, error: 'NIK sudah terdaftar' },
          { status: 400 }
        );
      }
      if (target?.includes('username')) {
        return NextResponse.json(
          { success: false, error: 'Username sudah digunakan' },
          { status: 400 }
        );
      }
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: 'Email sudah terdaftar' },
          { status: 400 }
        );
      }
      if (target?.includes('usernameTelegram')) {
        return NextResponse.json(
          { success: false, error: 'Username Telegram sudah digunakan' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Data sudah ada (duplikat)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    await prisma.user.delete({ where: { id } });

    await logActivity({
      action: `Deleted user "${user?.name || id}"`,
      target: 'User',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          name: user?.name,
          nik: user?.nik,
          nickname: user?.nickname,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH toggle active
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    await logActivity({
      action: `${updated.isActive ? 'Activated' : 'Deactivated'} user "${
        user.name
      }"`,
      target: 'User',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { isActive: user.isActive },
        after: { isActive: updated.isActive },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle user' },
      { status: 500 }
    );
  }
}
