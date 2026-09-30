import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["NEW", "IN_PROGRESS", "DONE"] as const;
type RequestStatus = (typeof VALID_STATUSES)[number];

function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as RequestStatus);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!isRequestStatus(body?.status)) {
    return NextResponse.json({ error: "Noto'g'ri holat" }, { status: 400 });
  }

  const existing = await prisma.request.findFirst({
    where: { id, clientId: session.clientId, isDuplicate: false },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ariza topilmadi" }, { status: 404 });
  }

  const request = await prisma.request.update({
    where: { id: existing.id },
    data: { status: body.status },
    select: {
      id: true,
      category: true,
      status: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ request });
}
