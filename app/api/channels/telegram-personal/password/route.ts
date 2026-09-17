import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitLoginPassword } from "@/lib/telegram-personal";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!loginId || !password) {
    return NextResponse.json({ error: "Ma'lumot yetarli emas" }, { status: 400 });
  }

  const ok = submitLoginPassword(loginId, password);
  if (!ok) {
    return NextResponse.json({ error: "Sessiya kutilmayapti" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
