import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShiftType, AttendanceStatus, AttendanceSource } from '@prisma/client';

/**
 * Parse date string as local timezone date
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}

// GET all attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (date) where.tanggal = parseLocalDate(date);

    const records = await prisma.attendance.findMany({
      where,
      include: { member: { select: { id: true, name: true, image: true } } },
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST create attendance
export async function POST(request: NextRequest) {
  try {
    const { memberId, tanggal, jamAbsen, keterangan, status, source } =
      await request.json();

    const newId = `att-${Date.now()}`;

    const record = await prisma.attendance.create({
      data: {
        id: newId,
        memberId,
        tanggal: parseLocalDate(tanggal),
        jamAbsen,
        keterangan: keterangan as ShiftType,
        status: (status || 'ONTIME') as AttendanceStatus,
        source: (source || 'WEB') as AttendanceSource,
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attendance' },
      { status: 500 }
    );
  }
}
