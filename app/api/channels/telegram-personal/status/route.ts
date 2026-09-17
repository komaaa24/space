import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLoginStatus } from "@/lib/telegram-personal";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const loginId = new URL(req.url).searchParams.get("loginId");
  if (!loginId) {
    return NextResponse.json({ error: "loginId kerak" }, { status: 400 });
  }

  const status = getLoginStatus(loginId);
  if (!status) {
    return NextResponse.json({ error: "Sessiya topilmadi" }, { status: 404 });
  }

  return NextResponse.json(status);
}
