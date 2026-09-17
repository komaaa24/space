-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('AWAITING_SUBSCRIPTION', 'DELIVERED');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "aiPaused" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "triggerOnDm" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnComment" BOOLEAN NOT NULL DEFAULT false,
    "matchAny" BOOLEAN NOT NULL DEFAULT true,
    "keywords" TEXT,
    "exactMatch" BOOLEAN NOT NULL DEFAULT false,
    "allPosts" BOOLEAN NOT NULL DEFAULT true,
    "mediaIds" JSONB,
    "checkSubscription" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT NOT NULL,
    "welcomeButtonLabel" TEXT NOT NULL,
    "notSubscribedMessage" TEXT NOT NULL,
    "notSubscribedButtonLabel" TEXT NOT NULL DEFAULT '✅ Tayyor',
    "deliveredMessage" TEXT NOT NULL,
    "deliveredButtonLabel" TEXT NOT NULL,
    "deliveredLinkUrl" TEXT NOT NULL,
    "publicReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicReplyVariants" JSONB,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderMinutes" INTEGER,
    "reminderMessage" TEXT,
    "followUpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "followUpMinutes" INTEGER,
    "followUpMessage" TEXT,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'AWAITING_SUBSCRIPTION',
    "linkClicked" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "followUpSentAt" TIMESTAMP(3),
    "reminderDueAt" TIMESTAMP(3),
    "followUpDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRun_automationId_contactId_key" ON "AutomationRun"("automationId", "contactId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
