ALTER TABLE "Client"
  ADD COLUMN "notifyLeadTelegram" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyComplaintTelegram" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyDailySummary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyInApp" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "NotificationType" AS ENUM ('LEAD', 'COMPLAINT', 'SYSTEM');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clientId" TEXT NOT NULL,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_clientId_readAt_createdAt_idx"
  ON "Notification"("clientId", "readAt", "createdAt");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
