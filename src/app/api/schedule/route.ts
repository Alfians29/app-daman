import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShiftType } from '@prisma/client';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

/**
 * Parse date string as local timezone date
 * This fixes the timezone bug where new Date("YYYY-MM-DD") parses as UTC,
 * causing dates to shift back by 1 day when displayed in local timezone (UTC+7)
 */
function parseLocalDate(dateStr: string): Date {
  // If it's already an ISO string with time, parse directly
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  // For YYYY-MM-DD format, add noon time to avoid timezone issues
  // This ensures the date stays the same regardless of timezone
  return new Date(dateStr + 'T12:00:00');
}

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
      // Set endDate to end of day to include all records on the last day
      endDate.setHours(23, 59, 59, 999);
      where.tanggal = { gte: startDate, lte: endDate };
    }

    // Fetch schedules and shift settings in parallel
    const [schedules, shiftSettings] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          member: {
            select: { id: true, name: true, nickname: true, image: true },
          },
        },
        orderBy: [
          { memberId: 'asc' },
          { tanggal: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.shiftSetting.findMany({
        where: { isActive: true },
        select: { shiftType: true, name: true, color: true },
      }),
    ]);

    // Create a map of shift types to their colors
    const shiftColorMap: Record<string, string | null> = {};
    shiftSettings.forEach((setting) => {
      shiftColorMap[setting.shiftType] = setting.color;
    });

    return NextResponse.json({
      success: true,
      data: schedules,
      shiftColors: shiftColorMap,
    });
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
      let createdCount = 0;
      let updatedCount = 0;

      // Helper to extract date string (YYYY-MM-DD) from item
      const getDateStr = (dateInput: string): string => {
        if (dateInput.includes('T')) {
          return dateInput.substring(0, 10);
        }
        return dateInput;
      };

      // Get all unique member IDs and date range from the batch
      const memberIds = [...new Set(body.map((item) => item.memberId))];
      const dateStrs = body.map((item) => getDateStr(item.tanggal));
      const minDate = dateStrs.reduce((a, b) => (a < b ? a : b));
      const maxDate = dateStrs.reduce((a, b) => (a > b ? a : b));

      // Pre-fetch all existing schedules for these members in the date range
      // Use wider range to account for timezone differences
      const existingSchedules = await prisma.schedule.findMany({
        where: {
          memberId: { in: memberIds },
          tanggal: {
            gte: new Date(minDate + 'T00:00:00.000Z'), // UTC start
            lte: new Date(maxDate + 'T23:59:59.999Z'), // UTC end
          },
        },
      });

      // Helper to get local date string from Date object
      const getLocalDateStr = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Build a map: "memberId-YYYY-MM-DD" -> existing schedule
      const existingMap = new Map<string, { id: string }>();
      for (const sched of existingSchedules) {
        // Extract LOCAL date string from database tanggal
        const schedDateStr = getLocalDateStr(sched.tanggal);
        const key = `${sched.memberId}-${schedDateStr}`;
        existingMap.set(key, { id: sched.id });
      }

      for (const item of body) {
        const dateStr = getDateStr(item.tanggal);
        const key = `${item.memberId}-${dateStr}`;
        const existing = existingMap.get(key);

        if (existing) {
          // Update existing record
          const updated = await prisma.schedule.update({
            where: { id: existing.id },
            data: { keterangan: item.keterangan as ShiftType },
          });
          results.push(updated);
          updatedCount++;
        } else {
          // Create new record
          const created = await prisma.schedule.create({
            data: {
              id: `sch-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 5)}`,
              memberId: item.memberId,
              tanggal: parseLocalDate(item.tanggal),
              keterangan: item.keterangan as ShiftType,
            },
          });
          results.push(created);
          createdCount++;
          // Add to map to handle duplicates in same batch
          existingMap.set(key, { id: created.id });
        }
      }

      await logActivity({
        action: `Schedule sync: ${createdCount} created, ${updatedCount} updated`,
        target: 'Schedule',
        userId: getUserIdFromRequest(request),
        type: 'UPDATE',
        metadata: {
          total: results.length,
          created: createdCount,
          updated: updatedCount,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: results,
          created: createdCount,
          updated: updatedCount,
        },
        { status: 201 }
      );
    }

    // Single create
    const schedule = await prisma.schedule.create({
      data: {
        id: `sch-${Date.now()}`,
        memberId: body.memberId,
        tanggal: parseLocalDate(body.tanggal),
        keterangan: body.keterangan as ShiftType,
      },
    });

    await logActivity({
      action: `Created schedule entry`,
      target: 'Schedule',
      userId: getUserIdFromRequest(request),
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
