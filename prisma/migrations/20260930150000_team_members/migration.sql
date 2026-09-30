CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'OPERATOR');

ALTER TABLE "User"
ADD COLUMN "teamRole" "TeamRole",
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'OPERATOR',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamInvitation_tokenHash_key" ON "TeamInvitation"("tokenHash");
CREATE INDEX "TeamInvitation_clientId_email_idx" ON "TeamInvitation"("clientId", "email");
CREATE INDEX "TeamInvitation_clientId_acceptedAt_idx" ON "TeamInvitation"("clientId", "acceptedAt");

ALTER TABLE "TeamInvitation"
ADD CONSTRAINT "TeamInvitation_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
