import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionCategory } from '@prisma/client';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

/**
 * Parse date string as local timezone date
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}

// PUT update cash entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      date,
      description,
      transactionCategory,
      category,
      amount,
      memberId,
    } = await request.json();

    // Get before state
    const before = await prisma.cashEntry.findUnique({ where: { id } });

    const entry = await prisma.cashEntry.update({
      where: { id },
      data: {
        date: date ? parseLocalDate(date) : undefined,
        description,
        transactionCategory,
        category: category
          ? (category.toUpperCase() as TransactionCategory)
          : undefined,
        amount,
        memberId: memberId || null,
      },
    });

    await logActivity({
      action: `Updated cash entry: ${entry.description}`,
      target: 'CashEntry',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: {
          description: before?.description,
          amount: Number(before?.amount),
          category: before?.category,
        },
        after: {
          description: entry.description,
          amount: Number(entry.amount),
          category: entry.category,
        },
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error updating cash entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cash entry' },
      { status: 500 }
    );
  }
}

// DELETE cash entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await prisma.cashEntry.findUnique({ where: { id } });
    await prisma.cashEntry.delete({ where: { id } });

    await logActivity({
      action: `Deleted cash entry: ${entry?.description || id}`,
      target: 'CashEntry',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: {
          id,
          description: entry?.description,
          amount: Number(entry?.amount),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cash entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cash entry' },
      { status: 500 }
    );
  }
}
