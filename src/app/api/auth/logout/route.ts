import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST logout
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user) {
        await logActivity({
          action: 'Logout',
          target: 'Auth',
          userId: user.id,
          type: 'LOGOUT',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: 'Logout gagal' },
      { status: 500 }
    );
  }
}
