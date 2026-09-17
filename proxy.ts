import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "chatspace_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET .env faylida topilmadi");
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL("/login", req.url);

  if (!token) return NextResponse.redirect(loginUrl);

  let payload: { role?: string } | null = null;
  try {
    const result = await jwtVerify(token, getSecret());
    payload = result.payload as { role?: string };
  } catch {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const isOwnerArea = req.nextUrl.pathname.startsWith("/owner");
  if (isOwnerArea && payload.role !== "OWNER") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*"],
};
