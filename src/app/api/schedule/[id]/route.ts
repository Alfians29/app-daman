import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShiftType } from '@prisma/client';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

/**
 * Parse date string as local timezone date
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}

// PUT update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get before state
    const before = await prisma.schedule.findUnique({
      where: { id },
      include: { member: true },
    });

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        keterangan: body.keterangan as ShiftType,
        tanggal: body.tanggal ? parseLocalDate(body.tanggal) : undefined,
      },
      include: { member: true },
    });

    await logActivity({
      action: 'Memperbarui jadwal',
      target: 'Schedule',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { keterangan: before?.keterangan },
        after: { keterangan: schedule.keterangan },
      },
      request,
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { member: true },
    });
    await prisma.schedule.delete({ where: { id } });

    await logActivity({
      action: 'Menghapus jadwal',
      target: 'Schedule',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          memberId: schedule?.memberId,
          memberName: schedule?.member?.name,
        },
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
