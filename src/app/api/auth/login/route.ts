import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find user by username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { nik: username },
          { name: { contains: username, mode: 'insensitive' } },
        ],
      },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak aktif' },
        { status: 401 }
      );
    }

    // Simple password check (no hashing as per user request)
    if (user.password && user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Password salah' },
        { status: 401 }
      );
    }

    // Log login activity
    await logActivity({
      action: `User "${user.name}" berhasil login`,
      target: 'Auth',
      userId: user.id,
      type: 'LOGIN',
      metadata: { username, roleName: user.role?.name },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Login gagal' },
      { status: 500 }
    );
  }
}
