import prisma from './prisma';
import { ActivityType, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

/**
 * Logs an activity to the database for audit purposes
 */
export async function logActivity({
  action,
  target,
  userId,
  type,
  metadata,
}: {
  action: string;
  target: string;
  userId: string;
  type: ActivityType;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    const newId = `act-${Date.now()}`;
    await prisma.activity.create({
      data: {
        id: newId,
        action,
        target,
        userId,
        type,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the main operation
  }
}

// Default system user ID for operations without auth (fallback)
export const SYSTEM_USER_ID = 'user-1';

/**
 * Get user ID from request header (sent by frontend)
 * Falls back to SYSTEM_USER_ID if not present
 */
export function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('X-User-ID');
  return userId || SYSTEM_USER_ID;
}
