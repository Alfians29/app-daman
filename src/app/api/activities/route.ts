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

    const count = await prisma.activity.count();
    const newId = `act-${count + 1}`;

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
