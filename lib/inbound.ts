import { prisma } from "@/lib/prisma";
import {
  generateReply,
  classifyMessage,
  assessMessageSafety,
  type ChatTurn,
} from "@/lib/ai";
import { isWithinWorkHours } from "@/lib/work-hours";
import { canUseFeature } from "@/lib/access-control";

interface IncomingMessageParams {
  channelId: string;
  clientId: string;
  contactId: string;
  text: string;
  fromName: string;
  fromUsername?: string;
  sendReply: (text: string) => Promise<void>;
}

// Har qanday kanaldan (Telegram bot/shaxsiy, Instagram va h.k.) kelgan bitta
// xabarni to'liq qayta ishlaydi: saqlash → AI javob → yuborish → lead/shikoyat
// tasniflash. Yuborish usuli chaqiruvchi tomonidan `sendReply` orqali beriladi
// — bu funksiya kanal turidan mustaqil.
export async function handleIncomingMessage({
  channelId,
  clientId,
  contactId,
  text,
  fromName,
  fromUsername,
  sendReply,
}: IncomingMessageParams) {
  let conversation = await prisma.conversation.findUnique({
    where: { channelId_contactId: { channelId, contactId } },
  });
  if (conversation && conversation.clientId !== clientId) {
    console.error("Conversation clientId kanal egasiga mos emas, tuzatilmoqda", {
      conversationId: conversation.id,
      currentClientId: conversation.clientId,
      expectedClientId: clientId,
      channelId,
    });
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        clientId,
        contactName: fromName,
        contactHandle: fromUsername ? `@${fromUsername}` : conversation.contactHandle,
      },
    });
  }
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        clientId,
        channelId,
        contactId,
        contactName: fromName,
        contactHandle: fromUsername ? `@${fromUsername}` : null,
      },
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: text },
  });

  const priorMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  const history: ChatTurn[] = priorMessages.slice(0, -1).map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));

  const [client, channel, knowledgeItems, faqs, catalogItems, aiAgentEnabled] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.channel.findUnique({ where: { id: channelId } }),
    prisma.knowledgeItem.findMany({ where: { clientId } }),
    prisma.faq.findMany({ where: { clientId } }),
    prisma.catalogItem.findMany({ where: { clientId }, include: { variants: true } }),
    canUseFeature(clientId, "aiAgent"),
  ]);

  const withinHours =
    !client ||
    client.afterHoursMode === "ALWAYS" ||
    isWithinWorkHours(client.workHoursStart, client.workHoursEnd);

  let reply: string | null = null;

  if (channel?.aiPaused) {
    // Operator kanalni qo'lda pauza qilgan — AI javob yozmaydi, xabar saqlanadi.
  } else if (!withinHours && client?.afterHoursMode === "SILENT") {
    // Javob bermaydi — xabar saqlanadi, lekin AI javob yozmaydi/yubormaydi.
  } else if (!aiAgentEnabled) {
    // Tarifda AI Agent yopiq — xabar saqlanadi, operator kutadi.
  } else if (!withinHours && client?.afterHoursMode === "AUTO_REPLY") {
    reply = `Assalomu alaykum! Hozir ish vaqtimizdan tashqarida (ish soatlari: ${client.workHoursStart}–${client.workHoursEnd}). Ish boshlanishi bilan albatta javob beramiz!`;
  } else {
    const profile = {
      agentName: client?.agentName,
      companyName: client?.company,
      tone: client?.agentTone,
      forbiddenPhrases: client?.forbiddenPhrases,
      extraInstructions: client?.extraInstructions,
      knowledgeItems,
      faqs,
      catalogItems,
    };
    const safety = await assessMessageSafety(text, profile);
    if (!safety.allowed) {
      reply =
        safety.reason === "AI_IDENTITY"
          ? `Ha, men ${client?.company ?? "kompaniya"} bo'yicha avtomatlashtirilgan yordamchiman. Shu biznesga oid savolingiz bo'lsa, yordam beraman.`
          : `Bu savol ${client?.company ?? "kompaniya"} faoliyatiga tegishli emas. Men faqat ${client?.company ?? "kompaniya"} xizmatlari, narxlari va qabul/buyurtma jarayoni bo'yicha yordam bera olaman. Shu mavzuda savolingiz bo'lsa, yozing.`;
    } else {
      reply = await generateReply(history, text, profile);
    }
  }

  if (reply) {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "AI", content: reply },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "ANSWERED", lastMessageAt: new Date() },
    });
    await sendReply(reply);
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "WAITING", lastMessageAt: new Date() },
    });
  }

  try {
    const classification = await classifyMessage(text);
    if (classification.category) {
      await prisma.request.create({
        data: {
          clientId,
          conversationId: conversation.id,
          category: classification.category,
          name: fromName,
          phone: classification.phone,
          text,
        },
      });
    }
  } catch (err) {
    console.error("Tasniflashda xatolik:", err);
  }

  return reply;
}
