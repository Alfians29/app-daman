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

    const before = await prisma.cashEntry.findUnique({
      where: { id },
      include: { member: { select: { name: true } } },
    });

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
      include: { member: { select: { name: true } } },
    });

    await logActivity({
      action: 'Memperbarui Kas',
      target: 'CashEntry',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        pembayar: entry.member?.name || '-',
        before: {
          keterangan: before?.description,
          jumlah: Number(before?.amount),
          kategori: before?.category,
        },
        after: {
          keterangan: entry.description,
          jumlah: Number(entry.amount),
          kategori: entry.category,
        },
      },
      request,
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
    const entry = await prisma.cashEntry.findUnique({
      where: { id },
      include: { member: { select: { name: true } } },
    });
    await prisma.cashEntry.delete({ where: { id } });

    await logActivity({
      action: 'Menghapus Kas',
      target: 'CashEntry',
      userId: getUserIdFromRequest(request),
      type: 'DELETE',
      metadata: {
        deletedData: {
          keterangan: entry?.description,
          jumlah: Number(entry?.amount),
          pembayar: entry?.member?.name || '-',
        },
      },
      request,
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
