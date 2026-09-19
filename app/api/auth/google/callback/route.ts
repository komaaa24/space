import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  return process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || url.origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = getBaseUrl(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const loginUrl = new URL("/login", baseUrl);

  if (error) {
    loginUrl.searchParams.set("error", "google_cancelled");
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  const storedRedirectUri = cookieStore.get("google_oauth_redirect_uri")?.value;
  const redirectUri = storedRedirectUri?.includes("%3A")
    ? decodeURIComponent(storedRedirectUri)
    : storedRedirectUri;

  if (!code || !state || !expectedState || state !== expectedState || !redirectUri) {
    loginUrl.searchParams.set("error", "google_invalid_state");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = (await tokenRes.json().catch(() => null)) as GoogleTokenResponse | null;

  if (!tokenRes.ok || !tokenData?.access_token) {
    console.error("Google token error:", tokenData);
    loginUrl.searchParams.set("error", "google_token_failed");
    return NextResponse.redirect(loginUrl);
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json().catch(() => null)) as GoogleUserInfo | null;
  const email = profile?.email?.trim().toLowerCase();

  if (!profileRes.ok || !profile || !email || !profile.email_verified) {
    loginUrl.searchParams.set("error", "google_email_unverified");
    return NextResponse.redirect(loginUrl);
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (process.env.GOOGLE_AUTO_PROVISION !== "true") {
      loginUrl.searchParams.set("error", "google_user_not_found");
      return NextResponse.redirect(loginUrl);
    }

    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    const company =
      profile.name?.trim() || email.split("@")[0] || "Google foydalanuvchi";

    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "CLIENT_ADMIN",
        client: {
          create: {
            company,
            plan: "FREE",
            status: "TRIAL",
          },
        },
      },
    });
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
  });
  await setSessionCookie(token);

  const res = NextResponse.redirect(
    new URL(user.role === "OWNER" ? "/owner" : "/admin", baseUrl),
  );
  res.cookies.delete("google_oauth_state");
  res.cookies.delete("google_oauth_redirect_uri");
  return res;
}
