import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/credentials";
import { parseInstagramCredential, unsubscribeFromMessaging } from "@/lib/instagram";
import { disconnectPersonalChannel } from "@/lib/telegram-personal";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      company: true,
      channels: {
        select: {
          id: true,
          type: true,
          credential: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Kabinet topilmadi" }, { status: 404 });
  }

  for (const channel of client.channels) {
    if (channel.type === "TELEGRAM_PERSONAL") {
      await disconnectPersonalChannel(channel.id, channel.credential ?? undefined).catch(
        (err) => console.error("Shaxsiy Telegram akkauntdan chiqishda xatolik:", err),
      );
    } else if (channel.type === "TELEGRAM_BOT" && channel.credential) {
      const token = decryptCredential(channel.credential);
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`).catch(() => {});
    } else if (channel.type === "INSTAGRAM" && channel.credential) {
      const { accessToken } = parseInstagramCredential(channel.credential);
      await unsubscribeFromMessaging(accessToken).catch((err) =>
        console.error("Instagram webhook obunasini o'chirishda xatolik:", err),
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.automationRun.deleteMany({
      where: { automation: { clientId: id } },
    });
    await tx.automation.deleteMany({ where: { clientId: id } });
    await tx.message.deleteMany({
      where: { conversation: { clientId: id } },
    });
    await tx.payment.deleteMany({ where: { clientId: id } });
    await tx.request.deleteMany({ where: { clientId: id } });
    await tx.conversation.deleteMany({ where: { clientId: id } });
    await tx.productVariant.deleteMany({
      where: { item: { clientId: id } },
    });
    await tx.catalogItem.deleteMany({ where: { clientId: id } });
    await tx.knowledgeItem.deleteMany({ where: { clientId: id } });
    await tx.faq.deleteMany({ where: { clientId: id } });
    await tx.scenario.deleteMany({ where: { clientId: id } });
    await tx.paymentIntegration.deleteMany({ where: { clientId: id } });
    await tx.subscription.deleteMany({ where: { clientId: id } });
    await tx.channel.deleteMany({ where: { clientId: id } });
    await tx.user.deleteMany({ where: { clientId: id } });
    await tx.client.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true, deletedClient: { id, company: client.company } });
}
