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

// GET all cash entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {};
    if (category && category !== 'all')
      where.category = category.toUpperCase() as TransactionCategory;

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      // Set endDate to end of day to include all records on the last day
      endDate.setHours(23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const entries = await prisma.cashEntry.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, image: true } },
        createdBy: {
          select: { id: true, name: true, nickname: true, image: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate totals
    const income = entries
      .filter((e) => e.category === 'INCOME')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const expense = entries
      .filter((e) => e.category === 'EXPENSE')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return NextResponse.json({
      success: true,
      data: entries,
      summary: { income, expense, balance: income - expense },
    });
  } catch (error) {
    console.error('Error fetching cash entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cash entries' },
      { status: 500 }
    );
  }
}

// POST create cash entry
export async function POST(request: NextRequest) {
  try {
    const {
      date,
      description,
      transactionCategory,
      category,
      amount,
      memberId,
    } = await request.json();

    const newId = `cash-${Date.now()}`;
    const createdById = getUserIdFromRequest(request);

    const entry = await prisma.cashEntry.create({
      data: {
        id: newId,
        date: parseLocalDate(date),
        description,
        transactionCategory: transactionCategory || null,
        category: category.toUpperCase() as TransactionCategory,
        amount,
        memberId: memberId || null,
        createdById: createdById || null,
      },
      include: {
        member: { select: { id: true, name: true, image: true } },
        createdBy: {
          select: { id: true, name: true, nickname: true, image: true },
        },
      },
    });

    await logActivity({
      action: `Created cash entry: ${description}`,
      target: 'CashEntry',
      userId: createdById,
      type: 'CREATE',
      metadata: { entryId: newId, category, amount },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating cash entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create cash entry' },
      { status: 500 }
    );
  }
}
