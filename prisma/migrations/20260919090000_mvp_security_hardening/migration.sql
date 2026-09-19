ALTER TABLE "Channel" ADD COLUMN "externalAccountId" TEXT;

CREATE INDEX "Channel_type_externalAccountId_idx" ON "Channel"("type", "externalAccountId");
CREATE INDEX "Conversation_clientId_lastMessageAt_idx" ON "Conversation"("clientId", "lastMessageAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Request_clientId_createdAt_idx" ON "Request"("clientId", "createdAt");
CREATE INDEX "Payment_clientId_createdAt_idx" ON "Payment"("clientId", "createdAt");
