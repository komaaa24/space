// Faqat LOKAL ishlab chiqish uchun — Telegram botlarini "long polling" orqali
// tinglaydi. Productionda (Render'ga chiqarilgach) buning o'rniga webhook
// ishlaydi (/api/webhooks/telegram/[channelId]) — ikkalasi ham bitta
// lib/inbound.ts'dagi handleIncomingMessage() funksiyasini ishlatadi.

import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPgAdapterConfig } from "../lib/database-url";

const adapter = new PrismaPg(getPgAdapterConfig());
const prisma = new PrismaClient({ adapter });

// lib/telegram.ts ichida "@/lib/prisma" import qilingani uchun, u yerdagi
// prisma instansiyasi ham xuddi shu DATABASE_URL'dan foydalanadi.
const { handleIncomingMessage } = await import("../lib/inbound");

async function pollBot(channelId: string, clientId: string, token: string, handle: string) {
  let offset = 0;
  console.log(`[${handle}] tinglashni boshladi...`);

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`,
      );
      const data = await res.json();
      if (!data.ok) {
        console.error(`[${handle}] getUpdates xatosi:`, data.description);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      for (const update of data.result) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;

        const from = msg.from?.first_name ?? "Mijoz";
        console.log(`[${handle}] ${from}: ${msg.text}`);

        const reply = await handleIncomingMessage({
          channelId,
          clientId,
          contactId: String(msg.chat.id),
          text: msg.text,
          fromName: from,
          fromUsername: msg.from?.username,
          sendReply: async (text) => {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: msg.chat.id, text }),
            });
          },
        });

        console.log(`[${handle}] Aziza: ${reply}`);
      }
    } catch (err) {
      console.error(`[${handle}] xatolik:`, err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  const channels = await prisma.channel.findMany({
    where: { type: "TELEGRAM_BOT", status: "ONLINE" },
  });

  if (channels.length === 0) {
    console.log(
      "Ulangan va ONLINE Telegram-bot topilmadi. Avval /admin/channels orqali ulang.",
    );
    process.exit(0);
  }

  console.log(`${channels.length} ta bot topildi.`);
  await Promise.all(
    channels.map((c) =>
      pollBot(c.id, c.clientId, c.credential!, c.handle ?? c.id),
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
