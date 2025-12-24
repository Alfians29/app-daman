import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find user by username or nik
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { nik: username }],
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah dinonaktifkan' },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log login activity (metadata stored in DB for audit log UI, terminal log is simple)
    await logActivity({
      action: 'Login',
      target: 'Auth',
      userId: user.id,
      type: 'LOGIN',
      metadata: {
        loginTime: new Date().toISOString(),
        username: user.username,
        roleName: user.role?.name,
      },
    });

    // Prepare user data with permissions
    const permissions =
      user.role?.rolePermissions?.map((rp) => rp.permission.code) || [];

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nik: user.nik,
        username: user.username,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        position: user.position,
        department: user.department,
        image: user.image,
        usernameTelegram: user.usernameTelegram,
        phone: user.phone,
        roleId: user.roleId,
        isActive: user.isActive,
        role: {
          id: user.role?.id,
          name: user.role?.name,
          permissions: permissions,
        },
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
