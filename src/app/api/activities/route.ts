import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

// GET activities with optional pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    // Build where clause
    const where: Record<string, unknown> = {};

    // Filter by userId (for profile page optimization)
    if (userId) {
      where.userId = userId;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          dateFrom + 'T00:00:00'
        );
      }
      if (dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          dateTo + 'T23:59:59'
        );
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { target: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const usePagination = pageParam !== null && limitParam !== null;
    const page = parseInt(pageParam || '1');
    const limit = parseInt(limitParam || '50');

    // Get today's date range for stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (usePagination) {
      const [activities, total, stats] = await Promise.all([
        prisma.activity.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.activity.count({ where }),
        // Get stats without filters for summary cards
        Promise.all([
          prisma.activity.count(),
          prisma.activity.count({
            where: { createdAt: { gte: today, lt: tomorrow } },
          }),
          prisma.activity.count({ where: { type: 'CREATE' } }),
          prisma.activity.count({ where: { type: 'UPDATE' } }),
          prisma.activity.count({ where: { type: 'DELETE' } }),
        ]).then(([total, today, create, update, del]) => ({
          total,
          today,
          create,
          update,
          delete: del,
        })),
      ]);

      return NextResponse.json({
        success: true,
        data: activities,
        total,
        stats,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Legacy support - return limited results
      const activities = await prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({ success: true, data: activities });
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST log activity
export async function POST(request: NextRequest) {
  try {
    const { action, target, userId, type, metadata, ipAddress, userAgent } =
      await request.json();

    const newId = `act-${Date.now()}`;

    const activity = await prisma.activity.create({
      data: {
        id: newId,
        action,
        target,
        userId,
        type: type as ActivityType,
        metadata: metadata || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json(
      { success: true, data: activity },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
