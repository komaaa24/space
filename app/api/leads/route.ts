import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security";

// Landing sahifadagi "Bepul demo uchun ariza qoldiring" formasi shu yerga
// yozadi — ochiq, autentifikatsiyasiz endpoint.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : undefined;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Ism va telefon raqam kiritilishi shart" },
      { status: 400 },
    );
  }

  const limited = checkRateLimit(`lead:${getClientIp(req)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  const lead = await prisma.platformLead.create({
    data: { name, phone, note },
  });

  return NextResponse.json({ lead });
}

// Owner paneli — barcha leadlar ro'yxati
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const leads = await prisma.platformLead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}
