import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const baseUrl = process.env.TEST_BASE_URL;

function sessionCookie(response: Response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "Login response must set a session cookie");
  return value.split(";")[0];
}

test("Inbox HTTP API enforces tenant authorization and paginates full history", async (t) => {
  if (!baseUrl) {
    t.skip("Requires TEST_BASE_URL");
    return;
  }

  const firstClientId = "inbox-http-client-a";
  const secondClientId = "inbox-http-client-b";
  const firstChannelId = "inbox-http-channel-a";
  const secondChannelId = "inbox-http-channel-b";
  const firstConversationId = "inbox-http-conversation-a";
  const secondConversationId = "inbox-http-conversation-b";
  const email = "inbox-http-test@chatspace.local";
  const password = "Inbox-http-password-2026";

  await prisma.user.deleteMany({ where: { email } });
  await prisma.channel.deleteMany({
    where: { id: { in: [firstChannelId, secondChannelId] } },
  });
  await prisma.client.deleteMany({
    where: { id: { in: [firstClientId, secondClientId] } },
  });

  if (!process.env.KEEP_TEST_DATA) {
    t.after(async () => {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.channel.deleteMany({
        where: { id: { in: [firstChannelId, secondChannelId] } },
      });
      await prisma.client.deleteMany({
        where: { id: { in: [firstClientId, secondClientId] } },
      });
    });
  }

  await prisma.client.createMany({
    data: [
      { id: firstClientId, company: "HTTP tenant A" },
      { id: secondClientId, company: "HTTP tenant B" },
    ],
  });
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 4),
      role: "CLIENT_ADMIN",
      clientId: firstClientId,
    },
  });
  await prisma.channel.createMany({
    data: [
      {
        id: firstChannelId,
        clientId: firstClientId,
        type: "INSTAGRAM",
        status: "ONLINE",
        handle: "@tenant_a",
        credential: "credential-secret-must-not-leak",
      },
      {
        id: secondChannelId,
        clientId: secondClientId,
        type: "TELEGRAM_BOT",
        status: "ONLINE",
        handle: "@tenant_b",
        credential: "foreign-secret-must-not-leak",
      },
    ],
  });
  await prisma.conversation.createMany({
    data: [
      {
        id: firstConversationId,
        clientId: firstClientId,
        channelId: firstChannelId,
        contactId: "customer-a",
        contactName: "Inbox Customer",
        status: "ANSWERED",
      },
      {
        id: secondConversationId,
        clientId: secondClientId,
        channelId: secondChannelId,
        contactId: "customer-b",
        contactName: "Foreign Customer",
        status: "WAITING",
      },
    ],
  });

  const start = Date.parse("2026-09-26T00:00:00.000Z");
  await prisma.message.createMany({
    data: Array.from({ length: 120 }, (_, index) => ({
      id: `inbox-http-message-${String(index).padStart(3, "0")}`,
      conversationId: firstConversationId,
      role: index === 119 ? "AI" : "USER",
      source: index === 119 ? "AUTOMATION" : "CUSTOMER",
      content: index === 119 ? "Automation final reply" : `Customer message ${index}`,
      createdAt: new Date(start + index * 1000),
    })),
  });
  await prisma.conversation.update({
    where: { id: firstConversationId },
    data: { lastMessageAt: new Date(start + 119000) },
  });
  await prisma.message.create({
    data: {
      conversationId: secondConversationId,
      role: "USER",
      source: "CUSTOMER",
      content: "Foreign tenant message",
    },
  });

  const anonymous = await fetch(`${baseUrl}/api/inbox`);
  assert.equal(anonymous.status, 401);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  assert.equal(login.status, 200);
  const cookie = sessionCookie(login);
  const headers = { Cookie: cookie };

  const listResponse = await fetch(`${baseUrl}/api/inbox?channel=instagram`, { headers });
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  assert.equal(list.conversations.length, 1);
  assert.equal(list.conversations[0].id, firstConversationId);
  assert.equal(list.conversations[0]._count.messages, 120);
  assert.equal(list.conversations[0].messages[0].source, "AUTOMATION");
  assert.equal(list.meta.channels.instagram, 1);
  assert.equal(list.meta.channels.telegram, 0);
  assert.equal(JSON.stringify(list).includes("credential"), false);
  assert.equal(JSON.stringify(list).includes("Foreign Customer"), false);

  const detailResponse = await fetch(`${baseUrl}/api/inbox/${firstConversationId}`, {
    headers,
  });
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.json();
  assert.equal(detail.messages.length, 100);
  assert.equal(detail.hasMore, true);
  assert.equal(detail.messages[0].content, "Customer message 20");
  assert.equal(detail.messages[99].content, "Automation final reply");
  assert.equal(detail.messages[99].source, "AUTOMATION");

  const olderResponse = await fetch(
    `${baseUrl}/api/inbox/${firstConversationId}?before=${detail.messages[0].id}`,
    { headers },
  );
  assert.equal(olderResponse.status, 200);
  const older = await olderResponse.json();
  assert.equal(older.messages.length, 20);
  assert.equal(older.hasMore, false);
  assert.equal(older.messages[0].content, "Customer message 0");
  assert.equal(older.messages[19].content, "Customer message 19");

  const foreignDetail = await fetch(
    `${baseUrl}/api/inbox/${secondConversationId}`,
    { headers },
  );
  assert.equal(foreignDetail.status, 404);

  const foreignSend = await fetch(
    `${baseUrl}/api/inbox/${secondConversationId}/send`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ text: "Must not be sent" }),
    },
  );
  assert.equal(foreignSend.status, 404);
});
