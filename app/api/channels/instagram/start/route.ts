import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInstagramOAuthUrl, getAppBaseUrl } from "@/lib/instagram";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(getInstagramOAuthUrl(state));
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });
  return res;
}
