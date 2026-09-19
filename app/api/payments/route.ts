import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPaymeCheckoutUrl } from "@/lib/payme";
import { buildClickCheckoutUrl } from "@/lib/click";
import { getAppBaseUrl } from "@/lib/env";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ payments: [] }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
    include: { integration: { select: { provider: true } } },
  });

  return NextResponse.json({ payments });
}

// Mijozning suhbatidagi xaridor uchun to'lov havolasi yaratadi — pul
// to'g'ridan-to'g'ri mijozning o'z Payme/Click hisobiga tushadi.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Summani to'g'ri kiriting" }, { status: 400 });
  }

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        clientId: session.clientId,
        channel: { clientId: session.clientId },
      },
      select: { id: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Suhbat topilmadi" }, { status: 404 });
    }
  }

  const integrations = await prisma.paymentIntegration.findMany({
    where: { clientId: session.clientId, active: true },
  });

  if (integrations.length === 0) {
    return NextResponse.json(
      { error: "Avval Payme yoki Click hisobini ulang (Integratsiyalar)" },
      { status: 400 },
    );
  }

  const base = getAppBaseUrl();
  const results = [];

  for (const integration of integrations) {
    const payment = await prisma.payment.create({
      data: {
        clientId: session.clientId,
        integrationId: integration.id,
        amount,
        description,
        conversationId,
      },
    });

    const checkoutUrl =
      integration.provider === "PAYME"
        ? buildPaymeCheckoutUrl({
            merchantId: integration.merchantId,
            paymentId: payment.id,
            amountSom: amount,
          })
        : buildClickCheckoutUrl({
            merchantId: integration.merchantId,
            serviceId: integration.serviceId ?? "",
            paymentId: payment.id,
            amountSom: amount,
            returnUrl: `${base}/pay/return`,
          });

    results.push({ provider: integration.provider, paymentId: payment.id, checkoutUrl });
  }

  return NextResponse.json({ payments: results });
}
