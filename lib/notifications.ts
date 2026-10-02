
import { prisma } from "@/lib/prisma";

type NotificationType = "LEAD" | "COMPLAINT" | "SYSTEM";

export async function createNotification(input: {
  clientId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: {
      notifyInApp: true,
      notifyLeadTelegram: true,
      notifyComplaintTelegram: true,
      notifyDailySummary: true,
    },
  });

  const typeEnabled =
    input.type === "LEAD"
      ? client?.notifyLeadTelegram
      : input.type === "COMPLAINT"
        ? client?.notifyComplaintTelegram
        : client?.notifyDailySummary;

  let notification = null;
  if (client?.notifyInApp && typeEnabled) {
    notification = await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        clientId: input.clientId,
      },
    });
  }

  const botToken = process.env.TELEGRAM_NOTIFICATION_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_NOTIFICATION_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (typeEnabled && botToken && chatIds.length > 0) {
    const text = [
      input.type === "LEAD" ? "Yangi lead" : input.type === "COMPLAINT" ? "Yangi shikoyat" : "Chatspace bildirishnomasi",
      input.title,
      input.body,
    ].join("\n");

    await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          const response = await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          });
          if (!response.ok) {
            console.error("[notifications] Telegram xabari yuborilmadi", chatId, await response.text());
          }
        } catch (error) {
          console.error("[notifications] Telegram API xatosi", chatId, error);
        }
      }),
    );
  }

  return notification;
}
