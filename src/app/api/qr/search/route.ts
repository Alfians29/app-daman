import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface SearchQuery {
  qrId: string;
  start: number;
  end: number;
}

// POST search QR data with multiple queries
export async function POST(request: NextRequest) {
  try {
    const { queries } = (await request.json()) as { queries: SearchQuery[] };

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No search queries provided' },
        { status: 400 }
      );
    }

    const results: Record<string, unknown[]> = {};
    const notFound: string[] = [];

    for (const query of queries) {
      const { qrId, start, end } = query;

      if (!qrId || !start || !end) continue;

      const entries = await prisma.qRData.findMany({
        where: {
          qrId: qrId,
          nomorUrut: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { nomorUrut: 'asc' },
      });

      const key = `${qrId} ${start}-${end}`;

      if (entries.length === 0) {
        notFound.push(key);
      } else {
        results[key] = entries;
      }
    }

    // Flatten results for easier frontend handling
    const allResults = Object.values(results).flat();

    return NextResponse.json({
      success: true,
      data: allResults,
      summary: {
        totalFound: allResults.length,
        notFound: notFound,
      },
    });
  } catch (error) {
    console.error('Error searching QR data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search QR data' },
      { status: 500 }
    );
  }
}
