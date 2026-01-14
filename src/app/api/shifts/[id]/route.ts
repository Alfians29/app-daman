import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shiftSetting.findUnique({ where: { id } });
    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: shift });
  } catch (error) {
    console.error('Error fetching shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shift' },
      { status: 500 }
    );
  }
}

// PUT update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      shiftType,
      name,
      startTime,
      endTime,
      lateAfter,
      telegramCommand,
      color,
      isActive,
    } = await request.json();

    // Get before state
    const before = await prisma.shiftSetting.findUnique({ where: { id } });

    const shift = await prisma.shiftSetting.update({
      where: { id },
      data: {
        shiftType,
        name,
        startTime: startTime || null,
        endTime: endTime || null,
        lateAfter: lateAfter || null,
        telegramCommand: telegramCommand || null,
        color,
        isActive,
      },
    });

    // Update TelegramCommand entry for Daman unit if telegramCommand changed
    // SDI unit is managed manually in the database
    if (before?.telegramCommand !== telegramCommand) {
      // Delete old Daman command entry if it existed
      if (before?.telegramCommand) {
        await prisma.telegramCommand.deleteMany({
          where: {
            shiftSettingId: id,
            unit: 'Daman',
          },
        });
      }

      // Create new Daman command entry if new telegramCommand is provided
      if (telegramCommand) {
        await prisma.telegramCommand.upsert({
          where: {
            unit_command: { unit: 'Daman', command: telegramCommand },
          },
          update: {
            shiftSettingId: id,
            isActive: true,
          },
          create: {
            unit: 'Daman',
            command: telegramCommand,
            shiftSettingId: id,
            isActive: true,
          },
        });
      }
    }

    await logActivity({
      action: `Memperbarui shift "${shift.name}"`,
      target: 'ShiftSetting',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: {
          name: before?.name,
          startTime: before?.startTime,
          endTime: before?.endTime,
          telegramCommand: before?.telegramCommand,
          isActive: before?.isActive,
        },
        after: {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          telegramCommand: shift.telegramCommand,
          isActive: shift.isActive,
        },
      },
      request,
    });

    return NextResponse.json({ success: true, data: shift });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}

// DELETE shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shiftSetting.findUnique({ where: { id } });

    // First delete related Daman TelegramCommand records to avoid foreign key constraint
    // SDI entries are managed manually
    await prisma.telegramCommand.deleteMany({
      where: {
        shiftSettingId: id,
        unit: 'Daman',
      },
    });

    // Now delete the shift
    await prisma.shiftSetting.delete({ where: { id } });

    await logActivity({
      action: `Menghapus shift "${shift?.name || id}"`,
      target: 'ShiftSetting',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: { id, name: shift?.name, shiftType: shift?.shiftType },
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete shift' },
      { status: 500 }
    );
  }
}

// PATCH toggle active
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shiftSetting.findUnique({ where: { id } });

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.shiftSetting.update({
      where: { id },
      data: { isActive: !shift.isActive },
    });

    await logActivity({
      action: `${updated.isActive ? 'Mengaktifkan' : 'Menonaktifkan'} shift "${
        shift.name
      }"`,
      target: 'ShiftSetting',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { isActive: shift.isActive },
        after: { isActive: updated.isActive },
      },
      request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle shift' },
      { status: 500 }
    );
  }
}
