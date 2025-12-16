import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { member: true, tasks: { include: { jobType: true } } },
    });
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PUT update report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tasks } = await request.json();

    // Get before state
    const before = await prisma.dailyReport.findUnique({
      where: { id },
      include: { member: true, tasks: { include: { jobType: true } } },
    });
    const beforeTasks =
      before?.tasks.map((t) => ({
        jobType: t.jobType?.name,
        value: t.value,
      })) || [];

    if (tasks) {
      await prisma.reportTask.deleteMany({ where: { reportId: id } });
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        await prisma.reportTask.create({
          data: {
            id: `task-${Date.now()}-${i}`,
            reportId: id,
            jobTypeId: task.jobTypeId,
            keterangan: task.keterangan || '',
            value: task.value || 0,
          },
        });
      }
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { tasks: { include: { jobType: true } } },
    });
    const afterTasks =
      report?.tasks.map((t) => ({
        jobType: t.jobType?.name,
        value: t.value,
      })) || [];

    await logActivity({
      action: `Updated daily report for "${before?.member?.name}"`,
      target: 'DailyReport',
      userId: SYSTEM_USER_ID,
      type: 'UPDATE',
      metadata: {
        before: { tasks: beforeTasks },
        after: { tasks: afterTasks },
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { member: true, tasks: { include: { jobType: true } } },
    });
    await prisma.dailyReport.delete({ where: { id } });

    await logActivity({
      action: `Deleted daily report for "${report?.member?.name}"`,
      target: 'DailyReport',
      userId: SYSTEM_USER_ID,
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          memberName: report?.member?.name,
          taskCount: report?.tasks.length,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
