import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all users with role
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'asc' },
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

    const count = await prisma.user.count();
    const newId = `user-${count + 1}`;

    const user = await prisma.user.create({
      data: {
        id: newId,
        ...body,
      },
    });

    await logActivity({
      action: `Created new user "${user.name}"`,
      target: 'User',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { userId: newId },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
