-- AlterTable
ALTER TABLE "Client" DROP COLUMN "planPaidUntil";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "plan",
DROP COLUMN "provider",
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "integrationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PaymentIntegration" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "merchantId" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "serviceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "PaymentIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntegration_clientId_provider_key" ON "PaymentIntegration"("clientId", "provider");

-- AddForeignKey
ALTER TABLE "PaymentIntegration" ADD CONSTRAINT "PaymentIntegration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "PaymentIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

