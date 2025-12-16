import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

// GET all job types
export async function GET() {
  try {
    const jobTypes = await prisma.jobType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: jobTypes });
  } catch (error) {
    console.error('Error fetching job types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job types' },
      { status: 500 }
    );
  }
}

// POST create job type
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    const count = await prisma.jobType.count();
    const newId = `job-${count + 1}`;

    const jobType = await prisma.jobType.create({
      data: { id: newId, name, isActive: true },
    });

    await logActivity({
      action: `Created job type "${name}"`,
      target: 'JobType',
      userId: SYSTEM_USER_ID,
      type: 'CREATE',
      metadata: { jobTypeId: newId },
    });

    return NextResponse.json({ success: true, data: jobType }, { status: 201 });
  } catch (error) {
    console.error('Error creating job type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job type' },
      { status: 500 }
    );
  }
}
