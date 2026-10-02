ALTER TABLE "Request"
ADD COLUMN "phoneSearch" TEXT;

WITH normalized AS (
  SELECT
    "id",
    regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') AS digits
  FROM "Request"
)
UPDATE "Request" AS request
SET "phoneSearch" = CASE
  WHEN normalized.digits = '' THEN NULL
  WHEN normalized.digits LIKE '998%' THEN normalized.digits
  WHEN LENGTH(normalized.digits) = 10 AND normalized.digits LIKE '8%' THEN '998' || SUBSTRING(normalized.digits FROM 2)
  WHEN LENGTH(normalized.digits) = 9 THEN '998' || normalized.digits
  ELSE normalized.digits
END
FROM normalized
WHERE request."id" = normalized."id";

CREATE INDEX "Request_clientId_phoneSearch_idx"
ON "Request"("clientId", "phoneSearch");
