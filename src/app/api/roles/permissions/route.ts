import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all permissions
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });
    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
