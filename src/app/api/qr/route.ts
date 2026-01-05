import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';
import * as XLSX from 'xlsx';

// GET all QR data with optional pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get('qrId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const where: Record<string, unknown> = {};
    if (qrId) where.qrId = qrId;

    // If no limit is specified, fetch all data without pagination
    const usePagination = limitParam !== null;
    const page = parseInt(pageParam || '1');
    const limit = usePagination ? parseInt(limitParam || '50') : undefined;

    const [entries, total] = await Promise.all([
      prisma.qRData.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, nickname: true } },
        },
        orderBy: [{ qrId: 'asc' }, { nomorUrut: 'asc' }],
        ...(usePagination && limit
          ? { skip: (page - 1) * limit, take: limit }
          : {}),
      }),
      prisma.qRData.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination:
        usePagination && limit
          ? {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            }
          : { total },
    });
  } catch (error) {
    console.error('Error fetching QR data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QR data' },
      { status: 500 }
    );
  }
}

// POST upload Excel file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'File harus format Excel (.xlsx atau .xls)' },
        { status: 400 }
      );
    }

    const userId = getUserIdFromRequest(request);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Parse as array of arrays (raw data with header: 1)
    const data: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
      }
    );

    // Skip header row if exists, parse data
    const entries: { qrId: string; nomorUrut: number; labelQr: string }[] = [];
    const duplicateQrIds = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      const qrId = String(row[0] || '').trim();
      const nomorUrut = parseInt(String(row[1] || '0'));
      const labelQr = String(row[2] || '').trim();

      // Skip empty or invalid rows
      if (!qrId || !nomorUrut || !labelQr) continue;

      // Check for duplicates in database
      const exists = await prisma.qRData.findUnique({
        where: { qrId_nomorUrut: { qrId, nomorUrut } },
      });

      if (exists) {
        duplicateQrIds.add(qrId);
        continue;
      }

      entries.push({ qrId, nomorUrut, labelQr });
    }

    const duplicateCount = duplicateQrIds.size;
    const duplicateList = Array.from(duplicateQrIds);

    if (duplicateCount > 0 && entries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Semua data sudah ada di database (${duplicateList
            .slice(0, 3)
            .join(', ')}${
            duplicateCount > 3 ? ` +${duplicateCount - 3} lainnya` : ''
          })`,
        },
        { status: 400 }
      );
    }

    // Insert valid entries
    const created = await prisma.qRData.createMany({
      data: entries.map((entry) => ({
        ...entry,
        uploadedById: userId || null,
      })),
    });

    await logActivity({
      action: `Uploaded ${created.count} QR data from Excel`,
      target: 'QRData',
      userId: userId,
      type: 'CREATE',
      metadata: {
        fileName: file.name,
        count: created.count,
        skipped: duplicateCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        inserted: created.count,
        skipped: duplicateCount,
      },
      message:
        duplicateCount > 0
          ? `${created.count} data berhasil, ${duplicateCount} duplikat dilewati`
          : `${created.count} data berhasil diupload`,
    });
  } catch (error) {
    console.error('Error uploading QR data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload QR data' },
      { status: 500 }
    );
  }
}
