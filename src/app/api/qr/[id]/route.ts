import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// DELETE QR data by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);

    const entry = await prisma.qRData.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'QR data not found' },
        { status: 404 }
      );
    }

    await prisma.qRData.delete({
      where: { id },
    });

    await logActivity({
      action: `Deleted QR data: ${entry.qrId} - ${entry.nomorUrut}`,
      target: 'QRData',
      userId: userId,
      type: 'DELETE',
      metadata: {
        qrId: entry.qrId,
        nomorUrut: entry.nomorUrut,
        labelQr: entry.labelQr,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'QR data berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting QR data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete QR data' },
      { status: 500 }
    );
  }
}
