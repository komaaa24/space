-- Rename legacy tariff values to the product tariff names used by access control.
ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";

CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'VIP');

ALTER TABLE "Client"
  ALTER COLUMN "plan" DROP DEFAULT,
  ALTER COLUMN "plan" TYPE "PlanTier"
  USING (
    CASE "plan"::text
      WHEN 'START' THEN 'FREE'
      WHEN 'BIZNES' THEN 'PRO'
      WHEN 'PRO' THEN 'VIP'
      ELSE 'FREE'
    END
  )::"PlanTier",
  ALTER COLUMN "plan" SET DEFAULT 'FREE';

DROP TYPE "PlanTier_old";

CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "plan" "PlanTier" NOT NULL,
  "cycle" "BillingCycle" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clientId" TEXT NOT NULL,

  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
