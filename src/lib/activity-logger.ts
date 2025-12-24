import prisma from './prisma';
import { ActivityType, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Type to color mapping
const typeColors: Record<string, string> = {
  LOGIN: colors.green,
  LOGOUT: colors.yellow,
  CREATE: colors.cyan,
  UPDATE: colors.blue,
  DELETE: colors.red,
  VIEW: colors.dim,
  EXPORT: colors.magenta,
};

/**
 * Print formatted log to terminal
 */
export function serverLog(
  type: string,
  target: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')} ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds()
  ).padStart(2, '0')}`;

  const typeColor = typeColors[type] || colors.white;
  const typeTag = `${typeColor}${colors.bright}[${type}]${colors.reset}`;
  const targetTag = `${colors.dim}[${target}]${colors.reset}`;
  const timeTag = `${colors.dim}[${timestamp}]${colors.reset}`;

  let logLine = `${timeTag} ${typeTag} ${targetTag} ${message}`;

  if (metadata && Object.keys(metadata).length > 0) {
    const metaStr = Object.entries(metadata)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (metaStr) {
      logLine += ` ${colors.dim}| ${metaStr}${colors.reset}`;
    }
  }

  console.log(logLine);
}

/**
 * Log error to terminal
 */
export function serverError(target: string, message: string, error?: unknown) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')} ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds()
  ).padStart(2, '0')}`;

  const errorMsg = error instanceof Error ? error.message : String(error);
  console.log(
    `${colors.dim}[${timestamp}]${colors.reset} ${colors.bgRed}${colors.white}[ERROR]${colors.reset} ${colors.dim}[${target}]${colors.reset} ${colors.red}${message}${colors.reset} | ${errorMsg}`
  );
}

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
  // Get user name for logging
  let userName = 'System';
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, nickname: true },
    });
    if (user) {
      userName = user.nickname || user.name || 'Unknown';
    }
  } catch {
    // Fallback to userId if lookup fails
    userName = userId;
  }

  // Print to terminal with actor name
  const logMessage = `${action} by ${userName}`;
  serverLog(type, target, logMessage, metadata as Record<string, unknown>);

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
    serverError('ActivityLog', 'Failed to save activity to database', error);
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
