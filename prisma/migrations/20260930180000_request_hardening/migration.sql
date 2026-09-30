ALTER TABLE "Request"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isDuplicate" BOOLEAN NOT NULL DEFAULT false;

WITH duplicates AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "conversationId", "category"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS row_number
    FROM "Request"
    WHERE "conversationId" IS NOT NULL
)
UPDATE "Request" AS request
SET "isDuplicate" = true
FROM duplicates
WHERE request."id" = duplicates."id"
  AND duplicates.row_number > 1;

CREATE INDEX "Request_clientId_isDuplicate_createdAt_idx"
ON "Request"("clientId", "isDuplicate", "createdAt");

CREATE UNIQUE INDEX "Request_active_conversation_category_key"
ON "Request"("conversationId", "category")
WHERE "conversationId" IS NOT NULL AND "isDuplicate" = false;
