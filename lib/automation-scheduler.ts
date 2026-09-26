import { prisma } from "@/lib/prisma";
import { recordInboxMessage } from "@/lib/inbox-messages";
import { sendInstagramMessage, parseInstagramCredential } from "@/lib/instagram";

const TICK_MS = 60_000;
let started = false;

async function sendDueMessages() {
  const now = new Date();

  const dueReminders = await prisma.automationRun.findMany({
    where: { reminderSentAt: null, reminderDueAt: { lte: now } },
    include: { automation: { include: { channel: true } } },
  });
  for (const run of dueReminders) {
    const { automation } = run;
    if (!automation.reminderEnabled || !automation.reminderMessage || !automation.channel.credential)
      continue;
    try {
      const { accessToken } = parseInstagramCredential(automation.channel.credential);
      await sendInstagramMessage(accessToken, run.contactId, automation.reminderMessage);
      await prisma.automationRun.update({
        where: { id: run.id },
        data: { reminderSentAt: new Date() },
      });
      await recordInboxMessage(
        {
          channelId: automation.channel.id,
          clientId: automation.clientId,
          contactId: run.contactId,
        },
        {
          role: "AI",
          source: "AUTOMATION",
          content: automation.reminderMessage,
          externalId: `automation:reminder:${run.id}`,
        },
      );
    } catch (err) {
      console.error("Avtomatizatsiya eslatmasida xatolik:", err);
    }
  }

  const dueFollowUps = await prisma.automationRun.findMany({
    where: { followUpSentAt: null, followUpDueAt: { lte: now } },
    include: { automation: { include: { channel: true } } },
  });
  for (const run of dueFollowUps) {
    const { automation } = run;
    if (!automation.followUpEnabled || !automation.followUpMessage || !automation.channel.credential)
      continue;
    try {
      const { accessToken } = parseInstagramCredential(automation.channel.credential);
      await sendInstagramMessage(accessToken, run.contactId, automation.followUpMessage);
      await prisma.automationRun.update({
        where: { id: run.id },
        data: { followUpSentAt: new Date() },
      });
      await recordInboxMessage(
        {
          channelId: automation.channel.id,
          clientId: automation.clientId,
          contactId: run.contactId,
        },
        {
          role: "AI",
          source: "AUTOMATION",
          content: automation.followUpMessage,
          externalId: `automation:follow-up:${run.id}`,
        },
      );
    } catch (err) {
      console.error("Avtomatizatsiya qo'shimcha xabarida xatolik:", err);
    }
  }
}

// instrumentation.ts'dan bir marta chaqiriladi — har 60 soniyada kechiktirilgan
// eslatma/qo'shimcha xabarlarni tekshirib yuboradi. Bitta Render instance
// ichida ishlaydi (hozirgi arxitektura uchun yetarli).
export function bootAutomationScheduler() {
  if (started) return;
  started = true;
  setInterval(() => {
    sendDueMessages().catch((err) => console.error("Avtomatizatsiya scheduler xatosi:", err));
  }, TICK_MS);
}
