-- CreateEnum
CREATE TYPE "AutomationKind" AS ENUM ('LEAD_FLOW', 'AUTO_REPLY');

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "kind" "AutomationKind" NOT NULL DEFAULT 'LEAD_FLOW',
ADD COLUMN     "replyMessage" TEXT,
ALTER COLUMN "welcomeMessage" DROP NOT NULL,
ALTER COLUMN "welcomeButtonLabel" DROP NOT NULL,
ALTER COLUMN "notSubscribedMessage" DROP NOT NULL,
ALTER COLUMN "notSubscribedButtonLabel" DROP NOT NULL,
ALTER COLUMN "deliveredMessage" DROP NOT NULL,
ALTER COLUMN "deliveredButtonLabel" DROP NOT NULL,
ALTER COLUMN "deliveredLinkUrl" DROP NOT NULL;
