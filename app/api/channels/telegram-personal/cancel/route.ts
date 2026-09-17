import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cancelLogin } from "@/lib/telegram-personal";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId : "";
  cancelLogin(loginId);
  return NextResponse.json({ ok: true });
}
