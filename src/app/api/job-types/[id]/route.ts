import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// PUT update job type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get before state
    const before = await prisma.jobType.findUnique({ where: { id } });

    const jobType = await prisma.jobType.update({ where: { id }, data: body });

    await logActivity({
      action: `Updated job type "${jobType.name}"`,
      target: 'JobType',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { name: before?.name, isActive: before?.isActive },
        after: { name: jobType.name, isActive: jobType.isActive },
      },
    });

    return NextResponse.json({ success: true, data: jobType });
  } catch (error) {
    console.error('Error updating job type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job type' },
      { status: 500 }
    );
  }
}

// DELETE job type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobType = await prisma.jobType.findUnique({ where: { id } });
    await prisma.jobType.delete({ where: { id } });

    await logActivity({
      action: `Deleted job type "${jobType?.name || id}"`,
      target: 'JobType',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: { deletedData: { id, name: jobType?.name } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job type' },
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
    const jobType = await prisma.jobType.findUnique({ where: { id } });

    if (!jobType) {
      return NextResponse.json(
        { success: false, error: 'Job type not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.jobType.update({
      where: { id },
      data: { isActive: !jobType.isActive },
    });

    await logActivity({
      action: `${updated.isActive ? 'Activated' : 'Deactivated'} job type "${
        jobType.name
      }"`,
      target: 'JobType',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { isActive: jobType.isActive },
        after: { isActive: updated.isActive },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling job type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle job type' },
      { status: 500 }
    );
  }
}
