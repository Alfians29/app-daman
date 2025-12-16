import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionCategory } from '@prisma/client';
import { logActivity, SYSTEM_USER_ID } from '@/lib/activity-logger';

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
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const entries = await prisma.cashEntry.findMany({
      where,
      include: {
        member: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
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

    const count = await prisma.cashEntry.count();
    const newId = `cash-${count + 1}`;

    const entry = await prisma.cashEntry.create({
      data: {
        id: newId,
        date: new Date(date),
        description,
        transactionCategory: transactionCategory || null,
        category: category.toUpperCase() as TransactionCategory,
        amount,
        memberId: memberId || null,
      },
    });

    await logActivity({
      action: `Created cash entry: ${description}`,
      target: 'CashEntry',
      userId: SYSTEM_USER_ID,
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
