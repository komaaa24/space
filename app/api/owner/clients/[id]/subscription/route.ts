import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function addPeriod(cycle: "MONTHLY" | "YEARLY") {
  const endsAt = new Date();
  if (cycle === "YEARLY") endsAt.setFullYear(endsAt.getFullYear() + 1);
  else endsAt.setMonth(endsAt.getMonth() + 1);
  return endsAt;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const plan = ["FREE", "PRO", "VIP"].includes(body?.plan) ? body.plan : null;
  const cycle = body?.cycle === "YEARLY" ? "YEARLY" : "MONTHLY";

  if (!plan) {
    return NextResponse.json({ error: "Tarif noto'g'ri" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: "Mijoz topilmadi" }, { status: 404 });
  }

  await prisma.subscription.updateMany({
    where: { clientId: id, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  const subscription = await prisma.subscription.create({
    data: {
      clientId: id,
      plan,
      cycle,
      status: "ACTIVE",
      endsAt: addPeriod(cycle),
    },
  });
  const updatedClient = await prisma.client.update({
    where: { id },
    data: { plan, status: "ACTIVE" },
  });

  return NextResponse.json({ subscription, client: updatedClient });
}
