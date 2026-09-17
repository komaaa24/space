import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  const [started, delivered, clicked] = await Promise.all([
    prisma.automationRun.count({ where: { automationId: id } }),
    prisma.automationRun.count({ where: { automationId: id, status: "DELIVERED" } }),
    prisma.automationRun.count({ where: { automationId: id, linkClicked: true } }),
  ]);

  return NextResponse.json({
    started,
    delivered,
    clicked,
  });
}
