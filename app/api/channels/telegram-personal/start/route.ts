import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { startQrLogin } from "@/lib/telegram-personal";

export async function POST() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  try {
    const result = await startQrLogin(session.clientId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Xatolik yuz berdi" },
      { status: 500 },
    );
  }
}
