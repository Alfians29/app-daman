import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AttendanceStatus, ShiftType } from '@prisma/client';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

/**
 * Parse date string as local timezone date
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}

// GET single attendance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Attendance not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// PUT update attendance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get before state
    const before = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    });

    const record = await prisma.attendance.update({
      where: { id },
      data: {
        tanggal: body.tanggal ? parseLocalDate(body.tanggal) : undefined,
        jamAbsen: body.jamAbsen,
        keterangan: body.keterangan as ShiftType,
        status: body.status as AttendanceStatus,
      },
      include: { member: true },
    });

    // Check if user is updating their own attendance or another user's
    const loggedInUserId = getUserIdFromRequest(request);
    const targetMemberId = record.memberId;
    const isSelfUpdate = loggedInUserId === targetMemberId;
    const actionMessage = isSelfUpdate
      ? 'Memperbarui absensi'
      : `Memperbarui absensi "${before?.member?.name}"`;

    await logActivity({
      action: actionMessage,
      target: 'Attendance',
      userId: loggedInUserId,
      type: 'UPDATE',
      metadata: {
        before: {
          jamAbsen: before?.jamAbsen,
          keterangan: before?.keterangan,
          status: before?.status,
        },
        after: {
          jamAbsen: record.jamAbsen,
          keterangan: record.keterangan,
          status: record.status,
        },
      },
      request,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

// DELETE attendance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    });
    await prisma.attendance.delete({ where: { id } });

    // Check if user is deleting their own attendance or another user's
    const loggedInUserId = getUserIdFromRequest(request);
    const targetMemberId = record?.memberId;
    const isSelfDelete = loggedInUserId === targetMemberId;
    const actionMessage = isSelfDelete
      ? 'Menghapus absensi'
      : `Menghapus absensi "${record?.member?.name}"`;

    await logActivity({
      action: actionMessage,
      target: 'Attendance',
      userId: loggedInUserId,
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          memberId: record?.memberId,
          memberName: isSelfDelete ? undefined : record?.member?.name,
        },
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
