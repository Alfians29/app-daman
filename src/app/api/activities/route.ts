import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ActivityType } from '@prisma/client';

// GET all activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 50;

    const activities = await prisma.activity.findMany({
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: activities });
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

    // Limit audit log to 250 records - delete oldest if exceeded
    const MAX_AUDIT_LOG_RECORDS = 250;
    const totalCount = await prisma.activity.count();

    if (totalCount > MAX_AUDIT_LOG_RECORDS) {
      const excessCount = totalCount - MAX_AUDIT_LOG_RECORDS;
      const oldestRecords = await prisma.activity.findMany({
        orderBy: { createdAt: 'asc' },
        take: excessCount,
        select: { id: true },
      });

      await prisma.activity.deleteMany({
        where: {
          id: { in: oldestRecords.map((r) => r.id) },
        },
      });
    }

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
