ALTER TABLE "Client"
ADD COLUMN "messageMonthlyLimit" INTEGER,
ADD COLUMN "messagePackagePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "messagePackageCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "messagePackageNote" TEXT NOT NULL DEFAULT '';
