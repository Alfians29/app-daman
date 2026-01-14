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

    // Build list of changed fields for summary
    const changedFields: string[] = [];

    if (body.password !== undefined) {
      changedFields.push('Password');
    }
    if (body.image !== undefined && body.image !== before?.image) {
      changedFields.push('Foto Profil');
    }
    if (body.name !== undefined && before?.name !== user.name) {
      changedFields.push('Nama');
    }
    if (body.nickname !== undefined && before?.nickname !== user.nickname) {
      changedFields.push('Panggilan');
    }
    if (body.position !== undefined && before?.position !== user.position) {
      changedFields.push('Jabatan');
    }
    if (body.phone !== undefined && before?.phone !== user.phone) {
      changedFields.push('No. Telepon');
    }
    if (
      body.usernameTelegram !== undefined &&
      before?.usernameTelegram !== user.usernameTelegram
    ) {
      changedFields.push('Username Telegram');
    }
    if (body.roleId !== undefined && before?.roleId !== user.roleId) {
      changedFields.push('Role');
    }
    if (body.isActive !== undefined && before?.isActive !== user.isActive) {
      changedFields.push(
        user.isActive ? 'Mengaktifkan akun' : 'Menonaktifkan akun'
      );
    }

    // Build summary text
    const summary =
      changedFields.length > 0
        ? `Mengubah ${changedFields.join(', ')}`
        : 'Memperbarui data profil';

    // Check if user is updating their own profile or another user's
    const loggedInUserId = getUserIdFromRequest(request);
    const isSelfUpdate = loggedInUserId === id;
    const actionMessage = isSelfUpdate
      ? 'Memperbarui profil'
      : `Memperbarui user "${user.name}"`;

    await logActivity({
      action: actionMessage,
      target: 'User',
      userId: loggedInUserId,
      type: 'UPDATE',
      metadata: {
        batchSummary: summary,
      },
      request,
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
      action: `Menghapus user "${user?.name || id}"`,
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
      request,
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
      request,
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
