import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPgAdapterConfig } from "../lib/database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg(getPgAdapterConfig()) });

function ok(label: string) {
  console.log(`OK  ${label}`);
}

function fail(label: string, details?: unknown) {
  console.error(`ERR ${label}`);
  if (details) console.error(details);
  process.exitCode = 1;
}

async function main() {
  const requiredEnv = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "CREDENTIAL_ENCRYPTION_KEY",
    "APP_BASE_URL",
    "ANTHROPIC_API_KEY",
  ];

  for (const key of requiredEnv) {
    if (process.env[key]) ok(`env ${key}`);
    else fail(`env ${key} yo'q`);
  }

  const tenantMismatches = await prisma.conversation.findMany({
    where: { channel: { clientId: { not: undefined } } },
    select: {
      id: true,
      contactName: true,
      clientId: true,
      channel: { select: { clientId: true, type: true, handle: true } },
    },
  });
  const badConversations = tenantMismatches.filter(
    (conversation) => conversation.clientId !== conversation.channel.clientId,
  );
  if (badConversations.length === 0) ok("Conversation tenant isolation");
  else fail("Conversation tenant mismatch", badConversations);

  const requestMismatches = await prisma.request.findMany({
    where: { conversationId: { not: null } },
    select: {
      id: true,
      clientId: true,
      conversation: { select: { clientId: true } },
    },
  });
  const badRequests = requestMismatches.filter(
    (request) => request.conversation && request.clientId !== request.conversation.clientId,
  );
  if (badRequests.length === 0) ok("Request tenant isolation");
  else fail("Request tenant mismatch", badRequests);

  const paymentMismatches = await prisma.payment.findMany({
    where: { conversationId: { not: null } },
    select: {
      id: true,
      clientId: true,
      conversation: { select: { clientId: true } },
      integration: { select: { clientId: true } },
    },
  });
  const badPayments = paymentMismatches.filter(
    (payment) =>
      payment.conversation &&
      (payment.clientId !== payment.conversation.clientId ||
        payment.clientId !== payment.integration.clientId),
  );
  if (badPayments.length === 0) ok("Payment tenant isolation");
  else fail("Payment tenant mismatch", badPayments);

  const untaggedInstagram = await prisma.channel.count({
    where: { type: "INSTAGRAM", status: "ONLINE", externalAccountId: null },
  });
  if (untaggedInstagram === 0) ok("Instagram externalAccountId");
  else fail(`Instagram externalAccountId yo'q: ${untaggedInstagram} ta kanal`);

  const plaintextCredentials = await prisma.channel.count({
    where: {
      credential: { not: null },
      NOT: { credential: { startsWith: "enc:v1:" } },
    },
  });
  const plaintextPaymentSecrets = await prisma.paymentIntegration.count({
    where: { NOT: { secretKey: { startsWith: "enc:v1:" } } },
  });
  if (plaintextCredentials === 0 && plaintextPaymentSecrets === 0) {
    ok("Credentials encrypted");
  } else {
    fail("Plaintext credentials bor", { plaintextCredentials, plaintextPaymentSecrets });
  }

  const telegramWithoutSecret = await prisma.channel.count({
    where: { type: "TELEGRAM_BOT", status: "ONLINE", webhookSecret: null },
  });
  if (telegramWithoutSecret === 0) ok("Telegram webhook secrets");
  else fail(`Telegram webhookSecret yo'q: ${telegramWithoutSecret} ta kanal`);
}

main()
  .catch((err) => {
    fail("MVP audit xatosi", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
