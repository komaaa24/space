import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

function getRedirectUri(req: Request) {
  const url = new URL(req.url);
  const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const baseUrl = isLocal
    ? url.origin
    : process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || url.origin;

  return `${baseUrl}/api/auth/google/callback`;
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  res.cookies.set("google_oauth_redirect_uri", redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
