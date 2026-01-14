import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// GET all cash settings
export async function GET() {
  try {
    const settings = await prisma.cashSetting.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to object for easier access
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Error fetching cash settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cash settings' },
      { status: 500 }
    );
  }
}

// POST create/update cash setting (upsert)
export async function POST(request: NextRequest) {
  try {
    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Get before state for logging
    const before = await prisma.cashSetting.findUnique({ where: { key } });

    const setting = await prisma.cashSetting.upsert({
      where: { key },
      create: {
        key,
        value: String(value),
        description,
      },
      update: {
        value: String(value),
        description,
      },
    });

    await logActivity({
      action: 'Memperbarui pengaturan kas',
      target: 'CashSetting',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        before: { [key]: before?.value || '-' },
        after: { [key]: String(value) },
      },
      request,
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('Error saving cash setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save cash setting' },
      { status: 500 }
    );
  }
}
