import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  canManageTeam,
  hashTeamInviteToken,
  isValidTeamEmail,
  normalizeTeamEmail,
} from "@/lib/team";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { clientId: session.clientId, role: "CLIENT_ADMIN", active: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        teamRole: true,
        createdAt: true,
      },
    }),
    prisma.teamInvitation.findMany({
      where: {
        clientId: session.clientId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    canManage: canManageTeam(session),
    currentUserId: session.sub,
    members,
    invitations,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId || !canManageTeam(session)) {
    return NextResponse.json({ error: "Jamoa boshqarish huquqi yo'q" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = normalizeTeamEmail(body?.email);
  const role = body?.role === "ADMIN" ? "ADMIN" : "OPERATOR";

  if (!isValidTeamEmail(email)) {
    return NextResponse.json({ error: "To'g'ri email kiriting" }, { status: 400 });
  }
  if (email === session.email.toLowerCase()) {
    return NextResponse.json({ error: "O'zingizni jamoaga qayta qo'shib bo'lmaydi" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, clientId: true, active: true },
  });
  if (existingUser) {
    return NextResponse.json(
      {
        error:
          existingUser.clientId === session.clientId
            ? "Bu email allaqachon jamoada"
            : "Bu email boshqa workspace'da ro'yxatdan o'tgan",
      },
      { status: 409 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.teamInvitation.deleteMany({
    where: { clientId: session.clientId, email, acceptedAt: null },
  });
  const invitation = await prisma.teamInvitation.create({
    data: {
      clientId: session.clientId,
      email,
      role,
      tokenHash: hashTeamInviteToken(token),
      expiresAt,
    },
    select: { id: true, email: true, role: true, expiresAt: true },
  });

  return NextResponse.json({
    invitation,
    inviteUrl: `${getAppBaseUrl()}/invite/${token}`,
  });
}
