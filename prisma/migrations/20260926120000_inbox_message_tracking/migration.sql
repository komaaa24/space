CREATE TYPE "MessageSource" AS ENUM ('CUSTOMER', 'AI', 'AUTOMATION', 'COMMENT', 'OPERATOR');

ALTER TABLE "Message" ADD COLUMN "source" "MessageSource";
ALTER TABLE "Message" ADD COLUMN "externalId" TEXT;

UPDATE "Message"
SET "source" = CASE
  WHEN "role" = 'USER' THEN 'CUSTOMER'::"MessageSource"
  WHEN "role" = 'OPERATOR' THEN 'OPERATOR'::"MessageSource"
  ELSE 'AI'::"MessageSource"
END;

CREATE UNIQUE INDEX "Message_externalId_key" ON "Message"("externalId");
