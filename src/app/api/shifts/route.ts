import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all shifts
export async function GET() {
  try {
    const shifts = await prisma.shiftSetting.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

// POST create shift
export async function POST(request: NextRequest) {
  try {
    const { shiftType, name, startTime, endTime, lateAfter, color } =
      await request.json();

    const count = await prisma.shiftSetting.count();
    const newId = `shift-${count + 1}`;

    const shift = await prisma.shiftSetting.create({
      data: {
        id: newId,
        shiftType,
        name,
        startTime: startTime || null,
        endTime: endTime || null,
        lateAfter: lateAfter || null,
        color: color || 'emerald',
        isActive: true,
      },
    });

    await logActivity({
      action: `Created shift "${name}"`,
      target: 'ShiftSetting',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { shiftId: newId, shiftType },
    });

    return NextResponse.json({ success: true, data: shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shift' },
      { status: 500 }
    );
  }
}
