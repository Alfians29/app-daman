import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShiftType, AttendanceStatus, AttendanceSource } from '@prisma/client';
import { logActivity } from '@/lib/activity-logger';

// POST create attendance from Telegram Bot
export async function POST(request: NextRequest) {
  try {
    const {
      usernameTelegram,
      memberId,
      tanggal,
      jamAbsen,
      keterangan,
      status,
    } = await request.json();

    // Find user by telegram username or memberId
    let user;
    if (usernameTelegram) {
      user = await prisma.user.findFirst({
        where: { usernameTelegram },
      });
    } else if (memberId) {
      user = await prisma.user.findUnique({
        where: { id: memberId },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const count = await prisma.attendance.count();
    const newId = `att-${count + 1}`;

    const record = await prisma.attendance.create({
      data: {
        id: newId,
        memberId: user.id,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        jamAbsen:
          jamAbsen ||
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        keterangan: (keterangan || 'PAGI') as ShiftType,
        status: (status || 'ONTIME') as AttendanceStatus,
        source: 'TELEGRAM_BOT' as AttendanceSource,
      },
      include: {
        member: { select: { id: true, name: true } },
      },
    });

    // Log activity from Bot
    await logActivity({
      action: `Absen via Telegram Bot: ${user.name}`,
      target: 'Attendance',
      userId: user.id,
      type: 'CREATE',
      metadata: {
        attendanceId: newId,
        memberId: user.id,
        memberName: user.name,
        source: 'TELEGRAM_BOT',
        jamAbsen: record.jamAbsen,
        keterangan: record.keterangan,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: `Absen berhasil! ${user.name} - ${record.jamAbsen}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating attendance from bot:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat absensi' },
      { status: 500 }
    );
  }
}
