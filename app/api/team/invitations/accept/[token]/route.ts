import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashTeamInviteToken } from "@/lib/team";

async function getInvitation(token: string) {
  if (!token || token.length < 32) return null;
  return prisma.teamInvitation.findUnique({
    where: { tokenHash: hashTeamInviteToken(token) },
    include: { client: { select: { company: true } } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Taklif havolasi eskirgan yoki bekor qilingan" }, { status: 410 });
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    company: invitation.client.company,
    expiresAt: invitation.expiresAt,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Taklif havolasi eskirgan yoki bekor qilingan" }, { status: 410 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: invitation.email },
        select: { id: true },
      });
      if (existing) throw new Error("EMAIL_ALREADY_USED");

      const created = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: "CLIENT_ADMIN",
          teamRole: invitation.role,
          clientId: invitation.clientId,
          active: true,
        },
      });
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    const sessionToken = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      teamRole: user.teamRole,
      clientId: user.clientId,
    });
    await setSessionCookie(sessionToken);

    return NextResponse.json({ ok: true, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_USED") {
      return NextResponse.json({ error: "Bu email allaqachon ro'yxatdan o'tgan" }, { status: 409 });
    }
    console.error("[team invitation] accept failed", error);
    return NextResponse.json({ error: "Taklifni qabul qilib bo'lmadi" }, { status: 500 });
  }
}
