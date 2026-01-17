import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET all users with role
// slim=true excludes large fields like image for optimized payload (~2MB → ~50KB)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slim = searchParams.get('slim') === 'true';

    if (slim) {
      // Slim mode: exclude image field for smaller payload
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          nickname: true,
          username: true,
          email: true,
          phone: true,
          nik: true,
          position: true,
          department: true,
          usernameTelegram: true,
          isActive: true,
          role: { select: { id: true, name: true, color: true } },
          // image excluded in slim mode
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: users });
    }

    // Full mode: include all fields
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use timestamp-based ID to avoid conflicts after deletion
    const newId = `user-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const user = await prisma.user.create({
      data: {
        id: newId,
        ...body,
      },
    });

    await logActivity({
      action: `Menambahkan user "${user.name}"`,
      target: 'User',
      userId: getUserIdFromRequest(request),
      type: 'CREATE',
      metadata: {
        createdData: {
          name: user.name,
          nik: user.nik,
          nickname: user.nickname,
          position: user.position,
        },
      },
      request,
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);

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
      return NextResponse.json(
        { success: false, error: 'Data sudah ada (duplikat)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
