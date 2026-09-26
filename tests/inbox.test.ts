import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../lib/prisma";
import { recordInboxMessage } from "../lib/inbox-messages";

function isLocalDatabase() {
  const value = process.env.DATABASE_URL;
  if (!value) return false;
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

test("Inbox messages are deduplicated, attributed, and isolated by tenant", async (t) => {
  if (!isLocalDatabase()) {
    t.skip("Requires a local PostgreSQL DATABASE_URL");
    return;
  }

  const suffix = crypto.randomUUID();
  const firstClientId = `inbox-client-a-${suffix}`;
  const secondClientId = `inbox-client-b-${suffix}`;
  const channelId = `inbox-channel-${suffix}`;

  await prisma.client.createMany({
    data: [
      { id: firstClientId, company: "Inbox test A" },
      { id: secondClientId, company: "Inbox test B" },
    ],
  });
  await prisma.channel.create({
    data: {
      id: channelId,
      clientId: firstClientId,
      type: "INSTAGRAM",
      status: "ONLINE",
      handle: "@inbox_test",
    },
  });

  t.after(async () => {
    await prisma.channel.deleteMany({ where: { id: channelId } });
    await prisma.client.deleteMany({
      where: { id: { in: [firstClientId, secondClientId] } },
    });
  });

  const contact = {
    channelId,
    clientId: firstClientId,
    contactId: "customer-1",
    name: "Customer",
    username: "customer",
  };

  const incoming = await recordInboxMessage(contact, {
    role: "USER",
    source: "CUSTOMER",
    content: "Hello",
    externalId: "instagram:dm:message-1",
  });
  const duplicate = await recordInboxMessage(contact, {
    role: "USER",
    source: "CUSTOMER",
    content: "Hello",
    externalId: "instagram:dm:message-1",
  });

  assert.equal(incoming.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.message.id, incoming.message.id);
  assert.equal(
    await prisma.message.count({
      where: { conversationId: incoming.conversation.id },
    }),
    1,
  );

  await recordInboxMessage(contact, {
    role: "AI",
    source: "AI",
    content: "AI reply",
  });
  await recordInboxMessage(contact, {
    role: "AI",
    source: "AUTOMATION",
    content: "Automation reply",
  });
  await recordInboxMessage(contact, {
    role: "OPERATOR",
    source: "OPERATOR",
    content: "Operator reply",
  });

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: incoming.conversation.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  assert.equal(conversation.clientId, firstClientId);
  assert.equal(conversation.status, "ANSWERED");
  assert.deepEqual(
    conversation.messages.map((message) => [message.role, message.source, message.content]),
    [
      ["USER", "CUSTOMER", "Hello"],
      ["AI", "AI", "AI reply"],
      ["AI", "AUTOMATION", "Automation reply"],
      ["OPERATOR", "OPERATOR", "Operator reply"],
    ],
  );

  await assert.rejects(
    recordInboxMessage(
      {
        channelId,
        clientId: secondClientId,
        contactId: "foreign-customer",
      },
      {
        role: "USER",
        source: "CUSTOMER",
        content: "Must not cross tenants",
      },
    ),
    /Kanal egasi mos emas/,
  );
  assert.equal(
    await prisma.conversation.count({
      where: { clientId: secondClientId, channelId },
    }),
    0,
  );
});
