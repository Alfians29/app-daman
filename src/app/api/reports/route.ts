import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (date) where.tanggal = new Date(date);

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, nickname: true } },
        tasks: { include: { jobType: true } },
      },
      orderBy: { tanggal: 'desc' },
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST create report
export async function POST(request: NextRequest) {
  try {
    const { memberId, tanggal, tasks } = await request.json();

    const count = await prisma.dailyReport.count();
    const newId = `report-${count + 1}`;

    const report = await prisma.dailyReport.create({
      data: {
        id: newId,
        memberId,
        tanggal: new Date(tanggal),
        tasks:
          tasks && tasks.length > 0
            ? {
                create: tasks.map(
                  (
                    task: {
                      jobTypeId: string;
                      keterangan: string;
                      value: number;
                    },
                    idx: number
                  ) => ({
                    id: `task-${Date.now()}-${idx}`,
                    jobTypeId: task.jobTypeId,
                    keterangan: task.keterangan || '',
                    value: task.value || 0,
                  })
                ),
              }
            : undefined,
      },
      include: { tasks: { include: { jobType: true } } },
    });

    await logActivity({
      action: `Created daily report`,
      target: 'DailyReport',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { reportId: newId, memberId },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
