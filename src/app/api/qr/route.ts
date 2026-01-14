import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';
import * as XLSX from 'xlsx';

// GET all QR data with optional pagination by QR ID groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get('qrId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Slim mode: return minimal fields without uploadedBy relation
    // This reduces payload size significantly (~2.6MB → ~200KB per page)
    const slim = searchParams.get('slim') === 'true';

    // Build where clause for search
    const where: Record<string, unknown> = {};
    if (qrId) {
      where.qrId = { contains: qrId };
    }

    const usePagination = limitParam !== null;
    const page = parseInt(pageParam || '1');
    const limit = usePagination ? parseInt(limitParam || '10') : undefined;

    if (usePagination && limit) {
      // Get distinct QR IDs with pagination
      const distinctQrIds = await prisma.qRData.findMany({
        where,
        distinct: ['qrId'],
        select: { qrId: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const qrIdList = distinctQrIds.map((d) => d.qrId);

      // Get all entries for these QR IDs
      const entries =
        qrIdList.length > 0
          ? slim
            ? await prisma.qRData.findMany({
                where: { qrId: { in: qrIdList } },
                select: {
                  id: true,
                  qrId: true,
                  nomorUrut: true,
                  labelQr: true,
                  uploadedById: true,
                  createdAt: true,
                },
                orderBy: [{ createdAt: 'desc' }, { nomorUrut: 'asc' }],
              })
            : await prisma.qRData.findMany({
                where: { qrId: { in: qrIdList } },
                include: {
                  uploadedBy: {
                    select: { id: true, name: true, nickname: true },
                  },
                },
                orderBy: [{ createdAt: 'desc' }, { nomorUrut: 'asc' }],
              })
          : [];

      // Get total counts
      const [totalQrIds, total] = await Promise.all([
        prisma.qRData
          .findMany({
            where,
            distinct: ['qrId'],
            select: { qrId: true },
          })
          .then((r) => r.length),
        prisma.qRData.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: entries,
        total,
        totalQrIds,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalQrIds / limit),
        },
      });
    } else {
      // No pagination - return all (for backward compatibility)
      const [entries, total] = await Promise.all([
        slim
          ? prisma.qRData.findMany({
              where,
              select: {
                id: true,
                qrId: true,
                nomorUrut: true,
                labelQr: true,
                uploadedById: true,
                createdAt: true,
              },
              orderBy: [{ createdAt: 'desc' }, { nomorUrut: 'asc' }],
            })
          : prisma.qRData.findMany({
              where,
              include: {
                uploadedBy: {
                  select: { id: true, name: true, nickname: true },
                },
              },
              orderBy: [{ createdAt: 'desc' }, { nomorUrut: 'asc' }],
            }),
        prisma.qRData.count({ where }),
      ]);

      const totalQrIds = new Set(entries.map((e) => e.qrId)).size;

      return NextResponse.json({
        success: true,
        data: entries,
        total,
        totalQrIds,
      });
    }
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
      action: `Mengunggah ${created.count} data QR`,
      target: 'QRData',
      userId: userId,
      type: 'CREATE',
      metadata: {
        createdData: {
          fileName: file.name,
          count: created.count,
          skipped: duplicateCount,
        },
      },
      request,
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

// DELETE batch QR data by QR ID
export async function DELETE(request: NextRequest) {
  try {
    const { qrId, ids } = await request.json();
    const userId = getUserIdFromRequest(request);

    let deletedCount = 0;

    if (qrId) {
      // Delete all entries with this qrId
      const entries = await prisma.qRData.findMany({
        where: { qrId },
        select: { id: true },
      });

      deletedCount = entries.length;

      if (deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'No QR data found for this QR ID' },
          { status: 404 }
        );
      }

      await prisma.qRData.deleteMany({
        where: { qrId },
      });

      await logActivity({
        action: `Menghapus data QR: ${qrId}`,
        target: 'QRData',
        userId: userId,
        type: 'DELETE',
        metadata: {
          deletedData: {
            qrId,
            count: deletedCount,
          },
        },
        request,
      });
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete specific entries by IDs
      const entries = await prisma.qRData.findMany({
        where: { id: { in: ids } },
        select: { qrId: true },
      });

      const qrIds = [...new Set(entries.map((e) => e.qrId))];
      deletedCount = entries.length;

      await prisma.qRData.deleteMany({
        where: { id: { in: ids } },
      });

      await logActivity({
        action: `Menghapus ${deletedCount} data QR`,
        target: 'QRData',
        userId: userId,
        type: 'DELETE',
        metadata: {
          deletedData: {
            qrIds,
            count: deletedCount,
          },
        },
        request,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'qrId or ids array is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} data QR berhasil dihapus`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting QR data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete QR data' },
      { status: 500 }
    );
  }
}
