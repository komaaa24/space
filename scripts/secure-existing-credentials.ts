import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPgAdapterConfig } from "../lib/database-url";
import { decryptCredential, encryptCredential } from "../lib/credentials";
import { randomBytes } from "crypto";

const prisma = new PrismaClient({ adapter: new PrismaPg(getPgAdapterConfig()) });

function isEncrypted(value: string | null) {
  return Boolean(value?.startsWith("enc:v1:"));
}

async function main() {
  const channels = await prisma.channel.findMany();
  for (const channel of channels) {
    const raw = channel.credential ? decryptCredential(channel.credential) : null;
    let externalAccountId = channel.externalAccountId;

    if (!externalAccountId && channel.type === "INSTAGRAM" && raw) {
      try {
        const parsed = JSON.parse(raw) as { igAccountId?: string };
        externalAccountId = parsed.igAccountId ?? null;
      } catch {
        externalAccountId = null;
      }
    }

    if (!externalAccountId && channel.type === "TELEGRAM_BOT") {
      externalAccountId = channel.handle?.replace(/^@/, "") ?? null;
    }

    const credential = raw && !isEncrypted(channel.credential) ? encryptCredential(raw) : channel.credential;
    let webhookSecret = channel.webhookSecret;
    if (channel.type === "TELEGRAM_BOT" && raw && !webhookSecret) {
      const secret = randomBytes(32).toString("hex");
      webhookSecret = encryptCredential(secret);
      const publicUrl = process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL;
      if (publicUrl) {
        await fetch(`https://api.telegram.org/bot${raw}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${publicUrl}/api/webhooks/telegram/${channel.id}`,
            secret_token: secret,
          }),
        }).catch((err) => console.error(`Telegram webhook yangilashda xatolik (${channel.id}):`, err));
      }
    }

    if (
      credential !== channel.credential ||
      externalAccountId !== channel.externalAccountId ||
      webhookSecret !== channel.webhookSecret
    ) {
      await prisma.channel.update({
        where: { id: channel.id },
        data: { credential, externalAccountId, webhookSecret },
      });
    }
  }

  const integrations = await prisma.paymentIntegration.findMany();
  for (const integration of integrations) {
    if (isEncrypted(integration.secretKey)) continue;
    await prisma.paymentIntegration.update({
      where: { id: integration.id },
      data: { secretKey: encryptCredential(integration.secretKey) ?? integration.secretKey },
    });
  }

  console.log("Credentials secured");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
