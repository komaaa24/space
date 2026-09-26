import { prisma } from "@/lib/prisma";
import type { MessageRole, MessageSource } from "@/lib/generated/prisma";

interface Contact {
  channelId: string;
  clientId: string;
  contactId: string;
  name?: string;
  username?: string;
}

export async function recordInboxMessage(contact: Contact, message: {
  role: MessageRole;
  content: string;
  source: MessageSource;
  externalId?: string;
}) {
  const externalId = message.externalId ? `${contact.channelId}:${message.externalId}` : undefined;
  try {
    return await prisma.$transaction(async (tx) => {
      const channel = await tx.channel.findFirst({ where: { id: contact.channelId, clientId: contact.clientId }, select: { id: true } });
      if (!channel) throw new Error("Kanal egasi mos emas");
      if (externalId) {
        const existing = await tx.message.findUnique({ where: { externalId }, include: { conversation: true } });
        if (existing) {
          if (existing.conversation.clientId !== contact.clientId || existing.conversation.contactId !== contact.contactId) throw new Error("Xabar egasi mos emas");
          return { conversation: existing.conversation, message: existing, duplicate: true };
        }
      }
      const conversation = await tx.conversation.upsert({
        where: { channelId_contactId: { channelId: contact.channelId, contactId: contact.contactId } },
        create: { channelId: contact.channelId, clientId: contact.clientId, contactId: contact.contactId, contactName: contact.name, contactHandle: contact.username ? `@${contact.username}` : null },
        update: {},
      });
      if (conversation.clientId !== contact.clientId) throw new Error("Suhbat egasi mos emas");
      const saved = await tx.message.create({
        data: { conversationId: conversation.id, role: message.role, content: message.content, source: message.source, externalId },
      });
      const updated = await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          contactName: contact.name || undefined,
          contactHandle: contact.username ? `@${contact.username}` : undefined,
          lastMessageAt: saved.createdAt,
          status: message.role === "USER" ? "WAITING" : "ANSWERED",
        },
      });
      return { conversation: updated, message: saved, duplicate: false };
    });
  } catch (error) {
    // A retried webhook can race the original delivery; the database owns deduplication.
    if (externalId && error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const existing = await prisma.message.findUnique({ where: { externalId }, include: { conversation: true } });
      if (existing && existing.conversation.clientId === contact.clientId && existing.conversation.contactId === contact.contactId) {
        return { conversation: existing.conversation, message: existing, duplicate: true };
      }
    }
    throw error;
  }
}

export type RecordedIncoming = Awaited<ReturnType<typeof recordInboxMessage>>;
