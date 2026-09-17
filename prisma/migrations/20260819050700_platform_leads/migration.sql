-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('LANDING', 'REFERRAL');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DEMO', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "PlatformLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "note" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'LANDING',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformLead_pkey" PRIMARY KEY ("id")
);

