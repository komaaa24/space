import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const automation = await prisma.automation.findUnique({ where: { id } });
  if (!automation || automation.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  if (automation.kind === "AUTO_REPLY" && !(await canUseFeature(session.clientId, "autoReply"))) {
    return forbiddenByPlan("Avtojavob faqat VIP tarifda ochiq");
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.active === "boolean") data.active = body.active;
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.triggerOnDm === "boolean") data.triggerOnDm = body.triggerOnDm;
  if (typeof body?.triggerOnComment === "boolean") data.triggerOnComment = body.triggerOnComment;
  if (typeof body?.matchAny === "boolean") data.matchAny = body.matchAny;
  if (typeof body?.keywords === "string") data.keywords = body.keywords.trim() || null;
  if (typeof body?.exactMatch === "boolean") data.exactMatch = body.exactMatch;
  if (typeof body?.allPosts === "boolean") data.allPosts = body.allPosts;
  if (Array.isArray(body?.mediaIds)) data.mediaIds = body.mediaIds;
  if (typeof body?.checkSubscription === "boolean") data.checkSubscription = body.checkSubscription;
  if (typeof body?.replyMessage === "string") data.replyMessage = body.replyMessage.trim() || null;
  if (typeof body?.welcomeMessage === "string" && body.welcomeMessage.trim())
    data.welcomeMessage = body.welcomeMessage.trim();
  if (typeof body?.welcomeButtonLabel === "string" && body.welcomeButtonLabel.trim())
    data.welcomeButtonLabel = body.welcomeButtonLabel.trim();
  if (typeof body?.notSubscribedMessage === "string" && body.notSubscribedMessage.trim())
    data.notSubscribedMessage = body.notSubscribedMessage.trim();
  if (typeof body?.notSubscribedButtonLabel === "string" && body.notSubscribedButtonLabel.trim())
    data.notSubscribedButtonLabel = body.notSubscribedButtonLabel.trim();
  if (typeof body?.deliveredMessage === "string" && body.deliveredMessage.trim())
    data.deliveredMessage = body.deliveredMessage.trim();
  if (typeof body?.deliveredButtonLabel === "string" && body.deliveredButtonLabel.trim())
    data.deliveredButtonLabel = body.deliveredButtonLabel.trim();
  if (typeof body?.deliveredLinkUrl === "string" && body.deliveredLinkUrl.trim()) {
    let url = body.deliveredLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    data.deliveredLinkUrl = url;
  }
  if (typeof body?.publicReplyEnabled === "boolean") data.publicReplyEnabled = body.publicReplyEnabled;
  if (Array.isArray(body?.publicReplyVariants))
    data.publicReplyVariants = body.publicReplyVariants.filter(
      (v: unknown) => typeof v === "string" && v.trim(),
    );
  if (typeof body?.reminderEnabled === "boolean") data.reminderEnabled = body.reminderEnabled;
  if (Number.isFinite(body?.reminderMinutes)) data.reminderMinutes = body.reminderMinutes;
  if (typeof body?.reminderMessage === "string") data.reminderMessage = body.reminderMessage.trim() || null;
  if (typeof body?.followUpEnabled === "boolean") data.followUpEnabled = body.followUpEnabled;
  if (Number.isFinite(body?.followUpMinutes)) data.followUpMinutes = body.followUpMinutes;
  if (typeof body?.followUpMessage === "string") data.followUpMessage = body.followUpMessage.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Ma'lumot yo'q" }, { status: 400 });
  }

  const updated = await prisma.automation.update({ where: { id }, data });
  return NextResponse.json({ automation: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const automation = await prisma.automation.findUnique({ where: { id } });
  if (!automation || automation.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.automation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
