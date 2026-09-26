import { prisma } from "@/lib/prisma";
import { recordInboxMessage } from "@/lib/inbox-messages";
import { getAppBaseUrl } from "@/lib/env";
import { canStartAutomation } from "@/lib/access-control";
import {
  checkIsFollowing,
  replyToComment,
  sendInstagramMessage,
  sendInstagramQuickReply,
  sendPrivateReplyToComment,
} from "@/lib/instagram";

const PAYLOAD_GET = "cs_automation_get";
const PAYLOAD_READY = "cs_automation_ready";

interface AutomationRecord {
  id: string;
  kind: "LEAD_FLOW" | "AUTO_REPLY";
  matchAny: boolean;
  keywords: string | null;
  exactMatch: boolean;
  triggerOnDm: boolean;
  triggerOnComment: boolean;
  allPosts: boolean;
  mediaIds: unknown;
  checkSubscription: boolean;
  replyMessage: string | null;
  welcomeMessage: string | null;
  welcomeButtonLabel: string | null;
  notSubscribedMessage: string | null;
  notSubscribedButtonLabel: string | null;
  deliveredMessage: string | null;
  deliveredButtonLabel: string | null;
  deliveredLinkUrl: string | null;
  publicReplyEnabled: boolean;
  publicReplyVariants: unknown;
  reminderEnabled: boolean;
  reminderMinutes: number | null;
  followUpEnabled: boolean;
  followUpMinutes: number | null;
}

function textMatches(automation: AutomationRecord, text: string): boolean {
  if (automation.matchAny) return true;
  const keywords = (automation.keywords ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (keywords.length === 0) return false;
  const normalized = text.trim().toLowerCase();
  if (automation.exactMatch) {
    return keywords.includes(normalized);
  }
  return keywords.some((k) => normalized.includes(k));
}

function mediaMatches(automation: AutomationRecord, mediaId?: string): boolean {
  if (automation.allPosts) return true;
  if (!mediaId) return false;
  const ids = Array.isArray(automation.mediaIds) ? (automation.mediaIds as string[]) : [];
  return ids.includes(mediaId);
}

interface DmEventParams {
  channelId: string;
  accessToken: string;
  contactId: string;
  text: string;
  contactName?: string;
  contactUsername?: string;
  quickReplyPayload?: string;
}

// DM orqali kelgan xabar — trigerga mos avtomatizatsiya bormi va/yoki
// mavjud AutomationRun'ni bir qadam oldinga suradi. true qaytsa — xabar
// avtomatizatsiya tomonidan ushlangan, AI chaqirilmasin.
export async function handleAutomationDmEvent(params: DmEventParams): Promise<boolean> {
  const { channelId, accessToken, contactId, text, contactName, contactUsername, quickReplyPayload } =
    params;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { clientId: true, aiPaused: true },
  });
  if (!channel) {
    console.warn("[automation] DM channel topilmadi", { channelId });
    return false;
  }
  if (channel.aiPaused) {
    console.info("[automation] DM avtomatizatsiyasi pauzada", { channelId, contactId });
    return false;
  }

  const existingRun = await prisma.automationRun.findFirst({
    where: {
      contactId,
      status: "AWAITING_SUBSCRIPTION",
      automation: { channelId, active: true, triggerOnDm: true },
    },
    include: { automation: true },
  });

  if (existingRun && quickReplyPayload) {
    const sentText = await advanceRun(
      existingRun.id,
      existingRun.automation as AutomationRecord,
      accessToken,
      contactId,
    );
    if (sentText) {
      await recordAutomationExchange({
        channelId,
        clientId: channel.clientId,
        contactId,
        contactName,
        contactUsername,
        replyText: sentText,
      });
    }
    return true;
  }

  const access = await canStartAutomation(channel.clientId, contactId);
  if (!access.allowed) {
    console.warn("[automation] DM limit/tarif blokladi", {
      clientId: channel.clientId,
      contactId,
      reason: access.reason,
    });
    return false;
  }

  const automations = (await prisma.automation.findMany({
    where: { channelId, active: true, triggerOnDm: true },
  })) as unknown as AutomationRecord[];

  const matched = automations.find((a) => textMatches(a, text));
  if (!matched) {
    console.info("[automation] DM automation mos kelmadi", {
      channelId,
      contactId,
      activeDmAutomations: automations.length,
    });
    return false;
  }

  if (matched.kind === "AUTO_REPLY") {
    const sentText = await sendSimpleAutoReply(matched, contactId, accessToken, {
      recipientId: contactId,
    });
    if (sentText) {
      await recordAutomationExchange({
        channelId,
        clientId: channel.clientId,
        contactId,
        contactName,
        contactUsername,
        replyText: sentText,
      });
    }
    if (sentText) {
      console.info("[automation] DM avtojavob yuborildi", {
        automationId: matched.id,
        contactId,
      });
    } else {
      console.info("[automation] DM avtojavob takror yuborilmadi", {
        automationId: matched.id,
        contactId,
      });
    }
    return true;
  }

  const result = await startRun(matched, contactId, accessToken, { recipientId: contactId });
  if (result.sentText) {
    await recordAutomationExchange({
      channelId,
      clientId: channel.clientId,
      contactId: result.contactId,
      contactName,
      contactUsername,
      replyText: result.sentText,
    });
  }
  return true;
}

// AUTO_REPLY turi — bitta kontaktga bitta automation javobi faqat bir marta yuboriladi.
async function sendSimpleAutoReply(
  automation: AutomationRecord,
  contactId: string,
  accessToken: string,
  recipient: Recipient,
) {
  if (!automation.replyMessage) {
    console.warn("[automation] Avtojavob matni bo'sh", { automationId: automation.id });
    return null;
  }
  const reservation = await createAutomationRunOnce(automation.id, contactId, "DELIVERED");
  if (!reservation.created) return null;

  await sendToRecipient(accessToken, recipient, automation.replyMessage);
  return automation.replyMessage;
}

interface CommentEventParams {
  channelId: string;
  accessToken: string;
  contactId: string; // commenter's IGSID (from.id)
  contactName?: string;
  contactUsername?: string;
  commentId: string;
  mediaId: string;
  text: string;
}

export async function handleAutomationCommentEvent(params: CommentEventParams): Promise<boolean> {
  const { channelId, accessToken, contactId, contactName, contactUsername, commentId, mediaId, text } =
    params;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { clientId: true },
  });
  if (!channel) {
    console.warn("[automation] Komment channel topilmadi", { channelId });
    return false;
  }

  const access = await canStartAutomation(channel.clientId, contactId);
  if (!access.allowed) {
    console.warn("[automation] Komment limit/tarif blokladi", {
      clientId: channel.clientId,
      contactId,
      reason: access.reason,
    });
    return false;
  }

  const automations = (await prisma.automation.findMany({
    where: { channelId, active: true, triggerOnComment: true },
  })) as unknown as AutomationRecord[];

  const matched = automations.find((a) => textMatches(a, text) && mediaMatches(a, mediaId));
  if (!matched) {
    console.info("[automation] Komment automation mos kelmadi", {
      channelId,
      contactId,
      activeCommentAutomations: automations.length,
    });
    return false;
  }

  const reservedRun = await createAutomationRunOnce(
    matched.id,
    contactId,
    "AWAITING_SUBSCRIPTION",
  );
  if (!reservedRun.created) {
    console.info("[automation] Komment avtojavob takror yuborilmadi", {
      automationId: matched.id,
      contactId,
      commentId,
    });
    return true;
  }

  if (matched.publicReplyEnabled) {
    const variants = Array.isArray(matched.publicReplyVariants)
      ? (matched.publicReplyVariants as string[])
      : [];
    if (variants.length > 0) {
      const pick = variants[Math.floor(Math.random() * variants.length)];
      await replyToComment(accessToken, commentId, pick);
    }
  }

  const result = await startRun(matched, contactId, accessToken, { commentId }, reservedRun.run.id);
  if (result.sentText) {
    await recordAutomationExchange({
      channelId,
      clientId: channel.clientId,
      contactId: result.contactId,
      contactName,
      contactUsername,
      replyText: result.sentText,
    });
  }
  return true;
}

type Recipient = { recipientId: string } | { commentId: string };

async function sendToRecipient(
  accessToken: string,
  recipient: Recipient,
  text: string,
  quickReply?: { buttonLabel: string; payload: string },
) {
  if ("commentId" in recipient) {
    const res = await sendPrivateReplyToComment(accessToken, recipient.commentId, text, quickReply);
    return res.recipient_id;
  }
  if (quickReply) {
    await sendInstagramQuickReply(
      accessToken,
      recipient.recipientId,
      text,
      quickReply.buttonLabel,
      quickReply.payload,
    );
  } else {
    await sendInstagramMessage(accessToken, recipient.recipientId, text);
  }
  return recipient.recipientId;
}

async function startRun(
  automation: AutomationRecord,
  contactId: string,
  accessToken: string,
  recipient: Recipient,
  reservedRunId?: string,
) {
  const reservation = reservedRunId
    ? { run: { id: reservedRunId }, created: true }
    : await createAutomationRunOnce(automation.id, contactId, "AWAITING_SUBSCRIPTION");
  if (!reservation.created) {
    console.info("[automation] Oqim takror boshlanmadi", {
      automationId: automation.id,
      contactId,
    });
    return { contactId, sentText: null };
  }

  const sentText = automation.welcomeMessage ?? "";
  const resolvedId = await sendToRecipient(accessToken, recipient, sentText, {
    buttonLabel: automation.welcomeButtonLabel ?? "Olish",
    payload: PAYLOAD_GET,
  });

  // Komment orqali boshlangan bo'lsa, resolvedId — foydalanuvchining doimiy
  // PSID'i (recipient_id), shu bilan bog'liq holatni yangilaymiz — chunki
  // keyingi qadamlarda contactId sifatida shundan foydalanamiz.
  if (resolvedId && resolvedId !== contactId) {
    await prisma.automationRun
      .update({
        where: { id: reservation.run.id },
        data: { contactId: resolvedId },
      })
      .catch(() => {});
  }

  return { contactId: resolvedId || contactId, sentText };
}

async function createAutomationRunOnce(
  automationId: string,
  contactId: string,
  status: "AWAITING_SUBSCRIPTION" | "DELIVERED",
) {
  try {
    const run = await prisma.automationRun.create({
      data: { automationId, contactId, status },
      select: { id: true },
    });
    return { run, created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const run = await prisma.automationRun.findUnique({
        where: { automationId_contactId: { automationId, contactId } },
        select: { id: true },
      });
      if (run) return { run, created: false };
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function advanceRun(
  runId: string,
  automation: AutomationRecord,
  accessToken: string,
  recipientId: string,
) {
  const isSubscribed = automation.checkSubscription
    ? await checkIsFollowing(accessToken, recipientId)
    : true;

  const recipient: Recipient = { recipientId };

  if (!isSubscribed) {
    const sentText = automation.notSubscribedMessage ?? "";
    await sendToRecipient(accessToken, recipient, sentText, {
      buttonLabel: automation.notSubscribedButtonLabel ?? "✅ Tayyor",
      payload: PAYLOAD_READY,
    });
    return sentText;
  }

  const appBase = getAppBaseUrl();
  const trackedUrl = `${appBase}/api/automations/click/${runId}`;
  const deliveredText = `${automation.deliveredMessage}\n\n${automation.deliveredButtonLabel}: ${trackedUrl}`;

  await sendToRecipient(accessToken, recipient, deliveredText);

  const now = new Date();
  const reminderDueAt =
    automation.reminderEnabled && automation.reminderMinutes
      ? new Date(now.getTime() + automation.reminderMinutes * 60_000)
      : null;

  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: "DELIVERED", reminderDueAt },
  });
  return deliveredText;
}

async function recordAutomationExchange({
  channelId,
  clientId,
  contactId,
  contactName,
  contactUsername,
  replyText,
}: {
  channelId: string;
  clientId: string;
  contactId: string;
  contactName?: string;
  contactUsername?: string;
  replyText: string;
}) {
  await recordInboxMessage(
    {
      channelId,
      clientId,
      contactId,
      name: contactName,
      username: contactUsername,
    },
    { role: "AI", source: "AUTOMATION", content: replyText },
  );
}
