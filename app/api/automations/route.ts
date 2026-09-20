import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan, getClientAccess } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ automations: [] }, { status: 401 });
  }

  const automations = await prisma.automation.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
    include: {
      channel: { select: { id: true, type: true, handle: true } },
      _count: { select: { runs: true } },
    },
  });

  const access = await getClientAccess(session.clientId);
  return NextResponse.json({ automations, access });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind === "AUTO_REPLY" ? "AUTO_REPLY" : "LEAD_FLOW";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const channelId = typeof body?.channelId === "string" ? body.channelId : "";

  if (!name || !channelId) {
    return NextResponse.json({ error: "Nomi va kanal tanlanishi kerak" }, { status: 400 });
  }
  if (!(await canUseFeature(session.clientId, "instagramAutomation"))) {
    return forbiddenByPlan("Instagram Automation joriy tarifingizda yopiq");
  }
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.clientId !== session.clientId) {
    return NextResponse.json({ error: "Kanal topilmadi" }, { status: 404 });
  }

  const matchAny = body?.matchAny !== false;
  const keywords = typeof body?.keywords === "string" ? body.keywords.trim() : null;
  if (!matchAny && !keywords) {
    return NextResponse.json({ error: "Kalit so'zlarni kiriting" }, { status: 400 });
  }

  if (kind === "AUTO_REPLY") {
    const replyMessage = typeof body?.replyMessage === "string" ? body.replyMessage.trim() : "";
    if (!replyMessage) {
      return NextResponse.json({ error: "Javob matni kiritilishi kerak" }, { status: 400 });
    }

    const automation = await prisma.automation.create({
      data: {
        clientId: session.clientId,
        channelId,
        name,
        kind: "AUTO_REPLY",
        triggerOnDm: true,
        triggerOnComment: false,
        matchAny,
        keywords,
        exactMatch: Boolean(body?.exactMatch),
        checkSubscription: false,
        replyMessage,
      },
    });
    return NextResponse.json({ automation });
  }

  const welcomeMessage = typeof body?.welcomeMessage === "string" ? body.welcomeMessage.trim() : "";
  const welcomeButtonLabel =
    typeof body?.welcomeButtonLabel === "string" ? body.welcomeButtonLabel.trim() : "";
  const notSubscribedMessage =
    typeof body?.notSubscribedMessage === "string" ? body.notSubscribedMessage.trim() : "";
  const deliveredMessage =
    typeof body?.deliveredMessage === "string" ? body.deliveredMessage.trim() : "";
  const deliveredButtonLabel =
    typeof body?.deliveredButtonLabel === "string" ? body.deliveredButtonLabel.trim() : "";
  let deliveredLinkUrl =
    typeof body?.deliveredLinkUrl === "string" ? body.deliveredLinkUrl.trim() : "";
  if (deliveredLinkUrl && !/^https?:\/\//i.test(deliveredLinkUrl)) {
    deliveredLinkUrl = `https://${deliveredLinkUrl}`;
  }

  if (
    !welcomeMessage ||
    !welcomeButtonLabel ||
    !notSubscribedMessage ||
    !deliveredMessage ||
    !deliveredButtonLabel ||
    !deliveredLinkUrl
  ) {
    return NextResponse.json(
      { error: "Majburiy maydonlar to'ldirilmagan" },
      { status: 400 },
    );
  }

  const triggerOnDm = body?.triggerOnDm !== false;
  const triggerOnComment = Boolean(body?.triggerOnComment);
  if (!triggerOnDm && !triggerOnComment) {
    return NextResponse.json(
      { error: "Kamida bitta trigger turi (DM yoki Komment) tanlanishi kerak" },
      { status: 400 },
    );
  }

  const automation = await prisma.automation.create({
    data: {
      clientId: session.clientId,
      channelId,
      name,
      kind: "LEAD_FLOW",
      triggerOnDm,
      triggerOnComment,
      matchAny,
      keywords,
      exactMatch: Boolean(body?.exactMatch),
      allPosts: body?.allPosts !== false,
      mediaIds: Array.isArray(body?.mediaIds) ? body.mediaIds : undefined,
      checkSubscription: body?.checkSubscription !== false,
      welcomeMessage,
      welcomeButtonLabel,
      notSubscribedMessage,
      notSubscribedButtonLabel:
        typeof body?.notSubscribedButtonLabel === "string" && body.notSubscribedButtonLabel.trim()
          ? body.notSubscribedButtonLabel.trim()
          : "✅ Tayyor",
      deliveredMessage,
      deliveredButtonLabel,
      deliveredLinkUrl,
      publicReplyEnabled: Boolean(body?.publicReplyEnabled),
      publicReplyVariants: Array.isArray(body?.publicReplyVariants)
        ? body.publicReplyVariants.filter((v: unknown) => typeof v === "string" && v.trim())
        : undefined,
      reminderEnabled: Boolean(body?.reminderEnabled),
      reminderMinutes: Number.isFinite(body?.reminderMinutes) ? body.reminderMinutes : null,
      reminderMessage: typeof body?.reminderMessage === "string" ? body.reminderMessage.trim() : null,
      followUpEnabled: Boolean(body?.followUpEnabled),
      followUpMinutes: Number.isFinite(body?.followUpMinutes) ? body.followUpMinutes : null,
      followUpMessage: typeof body?.followUpMessage === "string" ? body.followUpMessage.trim() : null,
    },
  });

  return NextResponse.json({ automation });
}
