import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity, getUserIdFromRequest } from '@/lib/activity-logger';

// Generate random password with numbers, uppercase, lowercase, and symbols
function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure at least one of each type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// POST reset password for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate new password
    const newPassword = generateRandomPassword(12);

    // Update password in database
    await prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });

    // Log activity
    await logActivity({
      action: `Reset password untuk user "${user.name}"`,
      target: 'User',
      userId: getUserIdFromRequest(request),
      type: 'UPDATE',
      metadata: {
        targetUserId: user.id,
        targetUsername: user.username,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        newPassword,
        message: `Password untuk ${user.name} berhasil direset`,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal reset password' },
      { status: 500 }
    );
  }
}
