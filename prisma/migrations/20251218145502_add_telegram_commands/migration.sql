/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ShiftType" ADD VALUE 'PAGI_MALAM';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "ShiftSetting" ADD COLUMN     "telegramCommand" TEXT;

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "Position";

-- CreateTable
CREATE TABLE "CashSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL,
    "usernameTelegram" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramCommand" (
    "id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "shiftSettingId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashSetting_key_key" ON "CashSetting"("key");

-- CreateIndex
CREATE INDEX "CashSetting_key_idx" ON "CashSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_usernameTelegram_key" ON "TelegramUser"("usernameTelegram");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_userId_key" ON "TelegramUser"("userId");

-- CreateIndex
CREATE INDEX "TelegramUser_usernameTelegram_idx" ON "TelegramUser"("usernameTelegram");

-- CreateIndex
CREATE INDEX "TelegramUser_unit_idx" ON "TelegramUser"("unit");

-- CreateIndex
CREATE INDEX "TelegramUser_nik_idx" ON "TelegramUser"("nik");

-- CreateIndex
CREATE INDEX "TelegramCommand_unit_idx" ON "TelegramCommand"("unit");

-- CreateIndex
CREATE INDEX "TelegramCommand_command_idx" ON "TelegramCommand"("command");

-- CreateIndex
CREATE INDEX "TelegramCommand_shiftSettingId_idx" ON "TelegramCommand"("shiftSettingId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramCommand_unit_command_key" ON "TelegramCommand"("unit", "command");

-- AddForeignKey
ALTER TABLE "TelegramCommand" ADD CONSTRAINT "TelegramCommand_shiftSettingId_fkey" FOREIGN KEY ("shiftSettingId") REFERENCES "ShiftSetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
