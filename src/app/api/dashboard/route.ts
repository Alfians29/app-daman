import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET dashboard stats
export async function GET() {
  try {
    const [totalUsers, activeUsers, totalRoles, totalShifts, recentActivities] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.role.count(),
        prisma.shiftSetting.count({ where: { isActive: true } }),
        prisma.activity.findMany({
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalRoles,
        totalShifts,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
