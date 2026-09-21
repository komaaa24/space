import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email va parolni kiriting" },
        { status: 400 },
      );
    }

    const limited = checkRateLimit(`login:${getClientIp(req)}:${email}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) return limited;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Login yoki parol noto'g'ri" },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: getClientIp(req),
        loginCount: { increment: 1 },
      },
    });

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      role: user.role,
      redirectTo: user.role === "OWNER" ? "/owner" : "/admin",
    });
  } catch (error) {
    console.error("[auth login] failed", error);
    return NextResponse.json(
      { error: "Kirishda xatolik. Birozdan keyin qayta urinib ko'ring." },
      { status: 500 },
    );
  }
}
