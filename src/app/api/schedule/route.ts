import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShiftType } from '@prisma/client';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.tanggal = { gte: startDate, lte: endDate };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        member: {
          select: { id: true, name: true, nickname: true, image: true },
        },
      },
      orderBy: [{ memberId: 'asc' }, { tanggal: 'asc' }],
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST create schedule (or batch create/update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support batch upsert
    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        const existing = await prisma.schedule.findFirst({
          where: { memberId: item.memberId, tanggal: new Date(item.tanggal) },
        });

        if (existing) {
          const updated = await prisma.schedule.update({
            where: { id: existing.id },
            data: { keterangan: item.keterangan as ShiftType },
          });
          results.push(updated);
        } else {
          const count = await prisma.schedule.count();
          const created = await prisma.schedule.create({
            data: {
              id: `sch-${count + 1}`,
              memberId: item.memberId,
              tanggal: new Date(item.tanggal),
              keterangan: item.keterangan as ShiftType,
            },
          });
          results.push(created);
        }
      }

      await logActivity({
        action: `Updated ${results.length} schedule entries`,
        target: 'Schedule',
        userId: SYSTEM_USER_ID,
        type: 'UPDATE',
        metadata: { count: results.length },
      });

      return NextResponse.json(
        { success: true, data: results },
        { status: 201 }
      );
    }

    // Single create
    const count = await prisma.schedule.count();
    const schedule = await prisma.schedule.create({
      data: {
        id: `sch-${count + 1}`,
        memberId: body.memberId,
        tanggal: new Date(body.tanggal),
        keterangan: body.keterangan as ShiftType,
      },
    });

    await logActivity({
      action: `Created schedule entry`,
      target: 'Schedule',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { scheduleId: schedule.id, memberId: body.memberId },
    });

    return NextResponse.json(
      { success: true, data: schedule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
