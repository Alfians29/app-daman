import prisma from './prisma';
import { ActivityType, Prisma } from '@prisma/client';

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
    const count = await prisma.activity.count();
    await prisma.activity.create({
      data: {
        id: `activity-${count + 1}`,
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

// Default system user ID for operations without auth
export const SYSTEM_USER_ID = 'user-1';
