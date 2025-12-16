import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET roles for select dropdown
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
