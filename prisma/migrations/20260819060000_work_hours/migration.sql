-- CreateEnum
CREATE TYPE "AfterHoursMode" AS ENUM ('ALWAYS', 'AUTO_REPLY', 'SILENT');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "afterHoursMode" "AfterHoursMode" NOT NULL DEFAULT 'ALWAYS',
ADD COLUMN     "workHoursEnd" TEXT NOT NULL DEFAULT '21:00',
ADD COLUMN     "workHoursStart" TEXT NOT NULL DEFAULT '09:00';

