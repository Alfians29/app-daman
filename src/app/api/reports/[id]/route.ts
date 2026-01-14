import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

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

    // Check if user is updating their own report or another user's
    const loggedInUserId = getUserIdFromRequest(request);
    const targetMemberId = report?.memberId;
    const isSelfUpdate = loggedInUserId === targetMemberId;
    const actionMessage = isSelfUpdate
      ? 'Memperbarui laporan harian'
      : `Memperbarui laporan harian "${before?.member?.name}"`;

    // Format tasks as readable strings for diff display
    const formatTasks = (tasks: { jobType?: string; value: number }[]) =>
      tasks.map((t) => `${t.jobType}: ${t.value}`).join(', ') || '-';

    await logActivity({
      action: actionMessage,
      target: 'DailyReport',
      userId: loggedInUserId,
      type: 'UPDATE',
      metadata: {
        before: { pekerjaan: formatTasks(beforeTasks) },
        after: { pekerjaan: formatTasks(afterTasks) },
      },
      request,
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

    // Check if user is deleting their own report or another user's
    const loggedInUserId = getUserIdFromRequest(request);
    const targetMemberId = report?.memberId;
    const isSelfDelete = loggedInUserId === targetMemberId;
    const actionMessage = isSelfDelete
      ? 'Menghapus laporan harian'
      : `Menghapus laporan harian "${report?.member?.name}"`;

    await logActivity({
      action: actionMessage,
      target: 'DailyReport',
      userId: loggedInUserId,
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          memberName: isSelfDelete ? undefined : report?.member?.name,
          taskCount: report?.tasks.length,
        },
      },
      request,
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
