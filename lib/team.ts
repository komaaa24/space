import crypto from "crypto";
import type { SessionPayload } from "@/lib/auth";

export function canManageTeam(session: SessionPayload | null) {
  return Boolean(
    session?.clientId &&
      session.role === "CLIENT_ADMIN" &&
      (!session.teamRole || session.teamRole === "ADMIN"),
  );
}

export function normalizeTeamEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidTeamEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashTeamInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
