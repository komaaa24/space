import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptCredential } from "@/lib/credentials";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ integrations: [] }, { status: 401 });
  }

  const integrations = await prisma.paymentIntegration.findMany({
    where: { clientId: session.clientId },
    select: {
      id: true,
      provider: true,
      merchantId: true,
      serviceId: true,
      active: true,
      createdAt: true,
      // secretKey qaytarilmaydi — bir marta kiritiladi, ko'rsatilmaydi
    },
  });

  return NextResponse.json({ integrations });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const provider = body?.provider === "PAYME" || body?.provider === "CLICK" ? body.provider : null;
  const merchantId = typeof body?.merchantId === "string" ? body.merchantId.trim() : "";
  const secretKey = typeof body?.secretKey === "string" ? body.secretKey.trim() : "";
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId.trim() : null;

  if (!provider || !merchantId || !secretKey) {
    return NextResponse.json(
      { error: "Barcha maydonlarni to'ldiring" },
      { status: 400 },
    );
  }
  if (provider === "CLICK" && !serviceId) {
    return NextResponse.json(
      { error: "Click uchun Service ID kerak" },
      { status: 400 },
    );
  }

  const integration = await prisma.paymentIntegration.upsert({
    where: { clientId_provider: { clientId: session.clientId, provider } },
    create: {
      clientId: session.clientId,
      provider,
      merchantId,
      secretKey: encryptCredential(secretKey) ?? secretKey,
      serviceId,
    },
    update: { merchantId, secretKey: encryptCredential(secretKey) ?? secretKey, serviceId, active: true },
    select: { id: true, provider: true, merchantId: true, serviceId: true, active: true },
  });

  return NextResponse.json({ integration });
}
